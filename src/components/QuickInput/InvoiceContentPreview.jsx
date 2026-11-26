import React, { useState, useEffect } from 'react';
import { formatPaymentMethod } from '../../utils/labelFormatter';
import { getUserProfile } from '../../utils/userProfileHelper';
import QRCode from 'qrcode';
import instance from '../../config/api';

// Helper functions (from thermalPrinterInvoiceTemplate.js)
function truncateText(text, maxLength = 32) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function wrapText(text, maxLength = 32, indent = 2) {
  if (!text) return '';
  if (text.length <= maxLength) return ' '.repeat(indent) + text;

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxLength) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(' '.repeat(indent) + currentLine);
        currentLine = word;
      } else {
        // Word terlalu panjang, potong
        lines.push(' '.repeat(indent) + word.slice(0, maxLength));
        currentLine = word.slice(maxLength);
      }
    }
  }

  if (currentLine) {
    lines.push(' '.repeat(indent) + currentLine);
  }

  return lines.join('\n');
}

function rightAlign(text, value, length = 32) {
  const textLength = text.length;
  const valueLength = value.toString().length;
  const spaces = length - textLength - valueLength;
  return `${text}${' '.repeat(Math.max(0, spaces))}${value}`;
}

function centerAlign(text, width = 32) {
  if (!text) return '';
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((width - textLength) / 2));
  return `${' '.repeat(padding)}${text}`;
}

function formatNumber(num) {
  return parseInt(num).toLocaleString('id-ID');
}

function safeNumber(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function calculateFinalPricePerItem(group) {
  // 1. Base price (custom_price priority dengan null check)
  const base = group.custom_price != null
    ? safeNumber(group.custom_price)
    : safeNumber(group.treatment?.price);

  // 2. Addon total
  let addonTotal = 0;
  if (group.addons && Array.isArray(group.addons)) {
    addonTotal = group.addons.reduce((sum, addon) => {
      const addonPrice = safeNumber(addon.addon?.price || addon.price || 0);
      return sum + addonPrice;
    }, 0);
  }

  // 3. Price dengan addons
  const priceWithAddons = base + addonTotal;

  // 4. Diskon (apply ke priceWithAddons)
  let finalPrice = priceWithAddons;
  const discount = group.discount;
  if (discount && discount.type) {
    const discVal = (discount.discount != null) ? safeNumber(discount.discount) : safeNumber(discount.value);
    if (discount.type === 'percent') {
      finalPrice = priceWithAddons - (priceWithAddons * (discVal / 100));
    } else if (discount.type === 'nominal') {
      finalPrice = priceWithAddons - discVal;
    }
  }

  return Math.max(0, Math.round(finalPrice));
}

// Grouping function untuk invoice
function groupOrderDetailsForInvoice(orderDetails) {
  const grouped = {};

  for (const detail of orderDetails) {
    const treatmentId = detail.treatment_id || detail.treatment?.id;
    const discountId = detail.discount_id || detail.discount?.id || 'no_discount';
    const customPrice = detail.custom_price != null ? Number(detail.custom_price) : 'no_custom';
    const customReason = (detail.custom_price_reason || '').trim() || 'no_reason';
    const finalPrice = calculateFinalPricePerItem(detail);

    // Group key: treatment_id + discount_id + custom_price + finalPrice + custom_reason
    const key = `${treatmentId}_${discountId}_${customPrice}_${finalPrice}_${customReason}`;

    if (!grouped[key]) {
      grouped[key] = {
        ...detail,
        items: Array.isArray(detail.items) ? [...detail.items] : [detail],
        qty: Array.isArray(detail.items) ? detail.items.length : 1,
        custom_price_reason: (detail.custom_price_reason || '').trim() || null
      };
    } else {
      // Merge items
      if (Array.isArray(detail.items)) {
        grouped[key].items.push(...detail.items);
      } else {
        grouped[key].items.push(detail);
      }
      grouped[key].qty = grouped[key].items.length;
    }
  }

  return Object.values(grouped);
}

const InvoiceContentPreview = ({
  order,
  printType,
  detailsArr,
  summaryOrderDetails,
  tenantInfo,
  branchInfo,
  printerSettings,
  invoiceUrl
}) => {
  const [profileData, setProfileData] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [earnRate, setEarnRate] = useState(1000); // Default: 1 poin per Rp 1.000
  const [pointsEnabled, setPointsEnabled] = useState(false); // Default: false (sesuai tenant settings)
  const [bonusPoints, setBonusPoints] = useState({ firstOrder: 0, referral: 0 }); // Bonus poin untuk order ini
  const [pointsSettings, setPointsSettings] = useState({ first_order_bonus: 0, first_order_bonus_enabled: true, referral_bonus_new_customer: 0 }); // Points settings untuk calculate expected bonus

  useEffect(() => {
    const fetchProfile = async () => {
      if (!tenantInfo || !branchInfo) {
        const profile = await getUserProfile();
        setProfileData(profile);
      }
    };
    fetchProfile();
  }, [tenantInfo, branchInfo]);

  // Fetch earn_rate and enabled from points settings
  useEffect(() => {
    const fetchEarnRate = async () => {
      try {
        const response = await instance.get('/points-settings');
        if (response.data.success && response.data.data) {
          // Ambil earn_rate dan enabled dari response
          setEarnRate(Number(response.data.data.earn_rate) || 1000);
          setPointsEnabled(Boolean(response.data.data.enabled) || false);
          // ✅ Save points settings for expected bonus calculation
          setPointsSettings({
            first_order_bonus: Number(response.data.data.first_order_bonus) || 0,
            first_order_bonus_enabled: Boolean(response.data.data.first_order_bonus_enabled !== undefined ? response.data.data.first_order_bonus_enabled : true)
          });
        }
      } catch (error) {
        console.error('Error fetching points settings, using default:', error);
        // Keep default values if fetch fails
      }
    };
    fetchEarnRate();
  }, []);

  // Fetch bonus points from PointTransaction for this order
  // ✅ FIX: Calculate expected bonus if order unpaid + customer baru (following payment step logic)
  useEffect(() => {
    const fetchBonusPoints = async () => {
      if (!order?.id || !order?.customer?.id) return;
      
      // ✅ Fetch points settings first to get first_order_bonus, first_order_bonus_enabled, and referral_bonus_new_customer
      let currentPointsSettings = pointsSettings;
      try {
        const settingsResponse = await instance.get('/points-settings');
        if (settingsResponse.data.success && settingsResponse.data.data) {
          currentPointsSettings = {
            first_order_bonus: Number(settingsResponse.data.data.first_order_bonus) || 0,
            first_order_bonus_enabled: Boolean(settingsResponse.data.data.first_order_bonus_enabled !== undefined ? settingsResponse.data.data.first_order_bonus_enabled : true),
            referral_bonus_new_customer: Number(settingsResponse.data.data.referral_bonus_new_customer) || 0
          };
          // Update state if different
          if (currentPointsSettings.first_order_bonus !== pointsSettings.first_order_bonus || 
              currentPointsSettings.first_order_bonus_enabled !== pointsSettings.first_order_bonus_enabled ||
              currentPointsSettings.referral_bonus_new_customer !== (pointsSettings.referral_bonus_new_customer || 0)) {
            setPointsSettings(currentPointsSettings);
          }
        }
      } catch (error) {
        console.error('Error fetching points settings in fetchBonusPoints, using existing state:', error);
      }
      
      try {
        // Fetch point history untuk customer ini
        const response = await instance.get(`/points/customers/${order.customer.id}/history?limit=100`);
        if (response.data.success && response.data.data?.data) {
          // Filter PointTransaction untuk order ini dengan type='bonus'
          const bonusTransactions = response.data.data.data.filter(pt => 
            pt.order_id === order.id && 
            pt.type === 'bonus' &&
            pt.points > 0
          );
          
          let firstOrderBonus = 0;
          let referralBonus = 0;
          
          bonusTransactions.forEach(pt => {
            // ✅ FIX: Gunakan bonus_type field (lebih reliable daripada description matching)
            const bonusType = pt.bonus_type || '';
            
            // First Order Bonus
            if (bonusType === 'first_order') {
              firstOrderBonus += pt.points;
            }
            // Referral Bonus untuk customer baru (yang melakukan order)
            // Referral bonus untuk referrer tidak ditampilkan di struk customer
            else if (bonusType === 'referral_new_customer') {
              referralBonus += pt.points;
            }
            // Fallback: jika bonus_type belum ada, gunakan description matching (backward compatibility)
            else if (!bonusType) {
              const description = (pt.description || '').toLowerCase();
              if (description.includes('first order bonus')) {
                firstOrderBonus += pt.points;
              } else if (description.includes('referral bonus') && description.includes('new customer')) {
                referralBonus += pt.points;
              }
            }
          });
          
          // ✅ FIX: Calculate expected bonus if order unpaid + customer baru (belum pernah punya paid order)
          // Backend logic: bonus diberikan saat order PAID pertama kali, bukan order dibuat pertama kali
          const paymentStatus = order.payment?.status || 'unpaid';
          // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
          const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
          // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
          const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);
          
          // ✅ Calculate expected first order bonus if unpaid + customer baru
          if (firstOrderBonus === 0 && paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
            firstOrderBonus = currentPointsSettings.first_order_bonus;
            console.log('✅ [InvoiceContentPreview] Using expected first order bonus for unpaid order:', firstOrderBonus);
          }
          
          // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
          if (referralBonus === 0 && paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
            referralBonus = currentPointsSettings.referral_bonus_new_customer;
            console.log('✅ [InvoiceContentPreview] Using expected referral bonus for unpaid order:', {
              referralBonus,
              hasReferral,
              referrer: order.referrer,
              referred_by_phone: order.referred_by_phone,
              referred_by: order.referred_by
            });
          }
          
          setBonusPoints({ firstOrder: firstOrderBonus, referral: referralBonus });
        } else {
          // ✅ FIX: If no transactions found and order unpaid + customer baru (belum pernah punya paid order), calculate expected bonus
          const paymentStatus = order.payment?.status || 'unpaid';
          // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
          const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
          // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
          const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);
          
          let expectedFirstOrderBonus = 0;
          let expectedReferralBonus = 0;
          
          // Calculate expected first order bonus
          if (paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
            expectedFirstOrderBonus = currentPointsSettings.first_order_bonus;
            console.log('✅ [InvoiceContentPreview] Using expected first order bonus (no transactions):', expectedFirstOrderBonus);
          }
          
          // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
          if (paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
            expectedReferralBonus = currentPointsSettings.referral_bonus_new_customer;
            console.log('✅ [InvoiceContentPreview] Using expected referral bonus (no transactions):', {
              expectedReferralBonus,
              hasReferral,
              referrer: order.referrer,
              referred_by_phone: order.referred_by_phone,
              referred_by: order.referred_by
            });
          }
          
          setBonusPoints({ firstOrder: expectedFirstOrderBonus, referral: expectedReferralBonus });
        }
      } catch (error) {
        console.error('Error fetching bonus points, using default:', error);
        // ✅ FIX: If fetch fails and order unpaid + customer baru (belum pernah punya paid order), try to use expected bonus
        const paymentStatus = order.payment?.status || 'unpaid';
        // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
        const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
        // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
        const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);
        
        let expectedFirstOrderBonus = 0;
        let expectedReferralBonus = 0;
        
        // Calculate expected first order bonus
        if (paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
          expectedFirstOrderBonus = currentPointsSettings.first_order_bonus;
          console.log('✅ [InvoiceContentPreview] Using expected first order bonus (fetch failed):', expectedFirstOrderBonus);
        }
        
        // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
        if (paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
          expectedReferralBonus = currentPointsSettings.referral_bonus_new_customer;
          console.log('✅ [InvoiceContentPreview] Using expected referral bonus (fetch failed):', {
            expectedReferralBonus,
            hasReferral,
            referrer: order.referrer,
            referred_by_phone: order.referred_by_phone,
            referred_by: order.referred_by
          });
        }
        
        setBonusPoints({ firstOrder: expectedFirstOrderBonus, referral: expectedReferralBonus });
      }
    };
    fetchBonusPoints();
  }, [order?.id, order?.customer?.id]); // Don't include pointsSettings to avoid infinite loop, we fetch it inside

  // Load logo preview jika ada
  useEffect(() => {
    if (printerSettings?.show_logo && printerSettings?.logo_url) {
      const loadLogo = async () => {
        try {
          const logoUrl = printerSettings.logo_url.startsWith('http')
            ? printerSettings.logo_url
            : `${instance.defaults.baseURL}/${printerSettings.logo_url}`;
          setLogoPreview(logoUrl);
        } catch (error) {
          console.error('Error loading logo:', error);
          setLogoPreview(null);
        }
      };
      loadLogo();
    } else {
      setLogoPreview(null);
    }
  }, [printerSettings?.show_logo, printerSettings?.logo_url]);

  // Generate QR Code image untuk preview
  useEffect(() => {
    const generateQRCode = async () => {
      if (printerSettings?.show_qr_code && invoiceUrl) {
        try {
          const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
            width: 160,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          setQrCodeImage(qrDataUrl);
        } catch (error) {
          console.error('Error generating QR Code:', error);
          setQrCodeImage(null);
        }
      } else {
        setQrCodeImage(null);
      }
    };
    generateQRCode();
  }, [printerSettings?.show_qr_code, invoiceUrl]);

  // Tenant & Branch info dengan fallback
  const tenantName = tenantInfo?.business_name ||
    tenantInfo?.company_name ||
    profileData?.tenant?.business_name ||
    'NOTASEPATU';
  // Branch address & phone (prioritas: branchInfo prop > profileData.branch > fallback tenant > default)
  const branchAddress = branchInfo?.address ||
    profileData?.branch?.address ||
    tenantInfo?.address ||
    profileData?.tenant?.address ||
    'Jl Grindulu No 24, Bunulrejo\nKec. Blimbing, Kota Malang';
  const branchPhone = branchInfo?.phone ||
    profileData?.branch?.phone ||
    tenantInfo?.phone ||
    profileData?.tenant?.phone ||
    '0877-9545-2475';
  const branchName = branchInfo?.name || profileData?.branch?.name || '';

  // Format tanggal (tanggal saja, tanpa time)
  const dateField = order.entry_date || order.createdAt || order.created_at || order.date || order.order_date;
  const formattedDate = dateField ? new Date(dateField).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }) : 'Tidak ada tanggal';

  // Group order details dulu sebelum generate invoice
  const groupedOrderDetails = groupOrderDetailsForInvoice(order.order_details || []);

  // Generate order details dengan grouping
  let totalAll = 0;
  const orderDetailsLines = [];
  for (const group of groupedOrderDetails) {
    const treatmentName = group.treatment?.name || '-';
    const qty = group.qty;
    const finalPricePerItem = calculateFinalPricePerItem(group);
    const totalFinal = finalPricePerItem * qty;
    totalAll += totalFinal;

    const lineData = {
      line1: `${treatmentName} x${qty}`,
      line2: rightAlign(`Harga (${qty}x${formatNumber(finalPricePerItem)})`, formatNumber(totalFinal))
    };

    // Tambahkan custom_price_reason jika ada
    if (group.custom_price_reason) {
      lineData.reason = wrapText(`Ket: ${group.custom_price_reason}`, 30, 2);
    }

    // Tambahkan detail items jika ada
    if (group.items && Array.isArray(group.items) && group.items.length > 0) {
      const itemsText = [];
      group.items.forEach((item, index) => {
        // Get item data (support both item.item and direct item structure)
        const itemName = item.item?.name || item.name || '';
        const itemBrand = item.item?.brand || item.brand || '';
        const itemNotes = item.notes || '';
        
        // Skip jika tidak ada data sama sekali
        if (!itemName && !itemBrand) {
          return;
        }
        
        // ✅ Nomor antrian tag (reset harian per cabang) — biar pelanggan langsung tahu
        const tagNumber = item.tag_number != null
          ? item.tag_number
          : (item.item?.tag_number != null ? item.item.tag_number : null);

        // Build item text: [brand] [nama item]
        let itemText = '';
        if (itemBrand) {
          itemText = `${itemBrand} ${itemName}`;
        } else {
          itemText = itemName;
        }

        if (tagNumber != null) {
          itemText = `#${tagNumber} ${itemText}`;
        }
        
        // Wrap text dan tambahkan indent
        itemsText.push(wrapText(itemText, 30, 2));
        
        // Tambahkan notes jika ada
        // if (itemNotes && itemNotes.trim()) {
        //   const notesText = `Catatan: ${itemNotes.trim()}`;
        //   itemsText.push(wrapText(notesText, 30, 4)); // Indent lebih dalam untuk notes
        // }
      });
      
      if (itemsText.length > 0) {
        lineData.items = itemsText.join('\n');
      }
    }

    orderDetailsLines.push(lineData);
  }

  // Payment summary
  let totalPaid = 0;
  if (order.payment?.payment_details && order.payment.payment_details.length > 0) {
    order.payment.payment_details.forEach(detail => {
      totalPaid += safeNumber(detail.amount);
    });
  }

  // ✅ FIX: Calculate payment-level discount FIRST (sebelum hitung status)
  // Calculate payment-level discount (pisahkan: payment discount, membership discount, points discount)
  let paymentDiscountAmount = 0; // Payment discount saja (dari discount object)
  let membershipDiscountAmount = 0; // Membership discount
  let pointsDiscountAmount = 0; // Points discount
  let finalTotal = totalAll;
  
  // ✅ FIX: SELALU ambil points_discount dan membership_discount dari backend TERLEBIH DAHULU
  // Ini untuk memastikan nilai poin tidak masuk ke paymentDiscountAmount
  membershipDiscountAmount = safeNumber(order.payment?.membership_discount || 0);
  pointsDiscountAmount = safeNumber(order.payment?.points_discount || 0);
  
  // Prioritaskan final_price dari backend jika tersedia (lebih akurat)
  if (order.payment?.final_price != null) {
    finalTotal = safeNumber(order.payment.final_price);
    
    // Hitung payment discount (dari discount object atau dari total_discount - membership - points)
    if (order.payment?.discount && order.payment.discount.type) {
      // Hitung dari discount object
      const paymentDiscount = order.payment.discount;
      const discVal = (paymentDiscount.discount != null) ? safeNumber(paymentDiscount.discount) : safeNumber(paymentDiscount.value);
      
      if (paymentDiscount.type === 'percent') {
        paymentDiscountAmount = Math.round(totalAll * (discVal / 100));
      } else if (paymentDiscount.type === 'nominal') {
        paymentDiscountAmount = discVal;
      }
    } else if (order.payment?.total_discount != null) {
      // ✅ FIX: Hitung payment discount dari total_discount - membership - points
      // Pastikan points_discount dan membership_discount sudah diambil sebelumnya
      const totalDiscount = safeNumber(order.payment.total_discount);
      paymentDiscountAmount = Math.max(0, totalDiscount - membershipDiscountAmount - pointsDiscountAmount);
    }
  } else if (order.payment?.discount && order.payment.discount.type) {
    // Jika final_price tidak tersedia, hitung dari discount object
    const paymentDiscount = order.payment.discount;
    const discVal = (paymentDiscount.discount != null) ? safeNumber(paymentDiscount.discount) : safeNumber(paymentDiscount.value);
    
    if (paymentDiscount.type === 'percent') {
      paymentDiscountAmount = Math.round(totalAll * (discVal / 100));
    } else if (paymentDiscount.type === 'nominal') {
      paymentDiscountAmount = discVal;
    }
    
    finalTotal = Math.max(0, Math.round(totalAll - paymentDiscountAmount - membershipDiscountAmount - pointsDiscountAmount));
  } else {
    // ✅ FIX: Jika tidak ada payment discount object, cek langsung dari membership_discount dan points_discount
    if (membershipDiscountAmount > 0 || pointsDiscountAmount > 0) {
      finalTotal = Math.max(0, Math.round(totalAll - membershipDiscountAmount - pointsDiscountAmount));
    }
  }

  // ✅ FIX: Hitung status berdasarkan finalTotal (setelah discount), bukan totalAll
  let paymentStatus = '';
  // Jika total amount = 0 (free service atau sudah lunas dengan discount), otomatis lunas
  if (finalTotal === 0) {
    paymentStatus = '(Lunas)';
  } else if (totalPaid === 0) {
    paymentStatus = '(Belum Lunas)';
  } else if (totalPaid > 0 && totalPaid < finalTotal) {
    paymentStatus = `(DP ${formatNumber(totalPaid)})`;
  } else if (totalPaid >= finalTotal) {
    paymentStatus = '(Lunas)';
  } else {
    paymentStatus = '(Belum Lunas)';
  }

  const sisa = Math.max(0, finalTotal - totalPaid);

  // Helper untuk wrap text (tanpa indent)
  const wrapTextSimple = (text, maxLength = 32) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxLength) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxLength ? word.slice(0, maxLength) : word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  };

  // Width 32ch untuk thermal printer (58mm paper, ~8px per char = 256px)
  const previewWidth = '32ch';
  const maxWidthPx = 256; // 32ch * 8px

  return (
    <div className="bg-white border border-gray-300 rounded-lg mx-auto p-2" style={{ width: previewWidth, maxWidth: maxWidthPx + 'px' }}>
      {/* Logo Preview */}
      {printerSettings?.show_logo && logoPreview && (
        <div className="mb-2" style={{ width: "18ch", maxWidth: maxWidthPx + 'px', margin: '0 auto', marginBottom: '8px', overflow: 'hidden' }}>
          <img
            src={logoPreview}
            alt="Logo"
            className="h-auto object-contain"
            style={{ width: '100%', maxWidth: '100%', display: 'block' }}
          />
        </div>
      )}

      <pre className="font-mono text-[9px] leading-tight whitespace-pre-wrap break-words m-0" style={{ width: previewWidth, maxWidth: maxWidthPx + 'px', margin: '0 auto' }}>
        {/* Header - jika logo tidak aktif, tampilkan tenant business name (uppercase, center) dengan box design */}
        {(!printerSettings?.show_logo || !printerSettings?.logo_url) && tenantName && (() => {
          const boxWidth = 32;
          const tenantNameUpper = tenantName.toUpperCase();
          const paddingLeft = Math.floor((boxWidth - 2 - tenantNameUpper.length) / 2);
          const paddingRight = Math.ceil((boxWidth - 2 - tenantNameUpper.length) / 2);
          return (
            <>
              {'+' + '-'.repeat(boxWidth - 2) + '+\n'}
              {'|' + ' '.repeat(paddingLeft) + tenantNameUpper + ' '.repeat(paddingRight) + '|\n'}
              {'+' + '-'.repeat(boxWidth - 2) + '+\n'}
            </>
          );
        })()}
        
        {/* Branch address & phone */}
        {wrapTextSimple(branchAddress, 32) + '\n'}
        {wrapTextSimple(`Telp: ${branchPhone}`, 32) + '\n'}
        {'--------------------------------\n'}

        {/* Customer Info */}
        {wrapTextSimple(`Nama   : ${order.customer?.name || ''}`, 32) + '\n'}
        {/* ✅ Poin Terkumpul: Tambahkan di bawah nama jika points enabled */}
        {pointsEnabled && order.customer?.points != null && (() => {
          const currentPoints = order.customer?.points != null ? Number(order.customer.points) : 0;
          return wrapTextSimple(`Poin Terkumpul : ${formatNumber(currentPoints)}`, 32) + '\n';
        })()}
        {order.customer?.address ? wrapTextSimple(`Alamat : ${order.customer.address}`, 32) + '\n\n' : '\n'}
        {wrapTextSimple(`No.Inv : ${order.payment?.code || ''}`, 32) + '\n'}
        {wrapTextSimple(`Tgl    : ${formattedDate}`, 32) + '\n'}
        {'--------------------------------\n'}

        {/* Order Details */}
        {orderDetailsLines.map((detail, i) => {
          // Wrap treatment name jika terlalu panjang
          let line = wrapTextSimple(detail.line1, 32) + '\n';
          if (detail.reason) {
            line += wrapTextSimple(detail.reason, 32) + '\n';
          }
          
          // Tambahkan detail items jika ada
          if (detail.items) {
            line += wrapTextSimple(detail.items, 32) + '\n';
          }

          // Check discount untuk detail ini
          const group = groupedOrderDetails[i];
          if (group?.discount && group.discount.type) {
            const discVal = (group.discount.discount != null) ? safeNumber(group.discount.discount) : safeNumber(group.discount.value);
            let discountText = '';
            let discountAmount = 0;
            const priceWithAddons = (group.custom_price != null ? safeNumber(group.custom_price) : safeNumber(group.treatment?.price || 0));
            if (group.discount.type === 'percent') {
              discountAmount = priceWithAddons * (discVal / 100);
              discountText = `-${discVal}%`;
            } else if (group.discount.type === 'nominal') {
              discountAmount = discVal;
              discountText = `-${formatNumber(discVal)}`;
            }
            if (discountAmount > 0) {
              // Discount line sudah di-wrap di rightAlign, tapi pastikan tidak overflow
              const discountLine = rightAlign(`Diskon ${discountText}:`, formatNumber(discountAmount));
              line += (discountLine.length > 32 ? wrapTextSimple(discountLine, 32) : discountLine) + '\n';
            }
          }

          // Wrap price line jika terlalu panjang
          line += (detail.line2.length > 32 ? wrapTextSimple(detail.line2, 32) : detail.line2) + '\n--------------------------------\n';
          return line;
        }).join('')}

        {/* Payment Summary */}
        {'\n' + rightAlign('Sub Total', formatNumber(totalAll)) + '\n'}
        {/* ✅ FIX: Pisahkan potongan: Points Discount dulu, lalu Membership Discount, lalu Payment Discount */}
        {/* Urutan: Points > Membership > Payment Discount (sesuai prioritas) */}
        {pointsDiscountAmount > 0 && (() => {
          const discountLine = rightAlign('Potongan Poin', `(${formatNumber(pointsDiscountAmount)})`);
          return (discountLine.length > 32 ? wrapTextSimple(discountLine, 32) : discountLine) + '\n';
        })()}
        {membershipDiscountAmount > 0 && (() => {
          const discountLine = rightAlign('Potongan Membership', `(${formatNumber(membershipDiscountAmount)})`);
          return (discountLine.length > 32 ? wrapTextSimple(discountLine, 32) : discountLine) + '\n';
        })()}
        {paymentDiscountAmount > 0 && (() => {
          const discountLine = rightAlign('Potongan Diskon', `(${formatNumber(paymentDiscountAmount)})`);
          return (discountLine.length > 32 ? wrapTextSimple(discountLine, 32) : discountLine) + '\n';
        })()}
        {(() => {
          // Total Akhir = Sub Total - Semua Potongan (selalu tampilkan setelah semua potongan jika ada, atau setelah Sub Total jika tidak ada potongan)
          const totalAkhirLine = rightAlign('Total Akhir', formatNumber(finalTotal));
          return (totalAkhirLine.length > 32 ? wrapTextSimple(totalAkhirLine, 32) : totalAkhirLine) + '\n\n';
        })()}
        {order.payment?.payment_details?.map((detail) => {
          // Prioritaskan code dari payment_method object, lalu payment_method_code, lalu extract dari name, lalu method, fallback ke 'CASH'
          let paymentMethodCode = detail.transaction?.finance_account?.payment_method?.code ||
            detail.payment_method_code ||
            detail.method ||
            'cash';
          
          // Jika masih belum dapat code, coba extract dari name
          if (!paymentMethodCode || paymentMethodCode === detail.transaction?.finance_account?.name) {
            const name = detail.transaction?.finance_account?.name || detail.payment_method_name;
            if (name) {
              // Extract code dari name (misal "QRIS GATEWAY" -> "QRIS", "BANK TRANSFER" -> "BANK")
              const nameUpper = name.toUpperCase();
              if (nameUpper.includes('QRIS')) {
                paymentMethodCode = 'QRIS';
              } else if (nameUpper.includes('CASH') || nameUpper.includes('TUNAI')) {
                paymentMethodCode = 'CASH';
              } else if (nameUpper.includes('BANK') || nameUpper.includes('TRANSFER')) {
                paymentMethodCode = 'BANK';
              } else {
                // Ambil kata pertama dari name sebagai code
                paymentMethodCode = name.split(' ')[0].toUpperCase();
              }
            }
          }
          
          // Hapus underscore dan replace dengan space, lalu uppercase
          let methodDisplay = (paymentMethodCode || 'CASH').toString().toUpperCase();
          // Replace underscore dengan space
          methodDisplay = methodDisplay.replace(/_/g, ' ');
          // Jika panjang, ambil kata pertama saja (misal "BANK TRANSFER" -> "BANK")
          if (methodDisplay.includes(' ')) {
            const firstWord = methodDisplay.split(' ')[0];
            // Jika kata pertama adalah BANK, QRIS, CASH, dll, gunakan itu saja
            if (['BANK', 'QRIS', 'CASH', 'TUNAI'].includes(firstWord)) {
              methodDisplay = firstWord;
            }
          }
          
          let paymentLines = rightAlign(`Bayar (${methodDisplay})`, formatNumber(detail.amount));
          
          // ✅ Display money_received and change for cash payments
          if (detail.money_received && detail.money_received > 0) {
            paymentLines += '\n' + rightAlign('Uang Diterima', formatNumber(detail.money_received));
            if (detail.change_amount && detail.change_amount > 0) {
              paymentLines += '\n' + rightAlign('Kembalian', formatNumber(detail.change_amount));
            }
          }
          
          // Wrap jika terlalu panjang (per line, bukan semua lines)
          const lines = paymentLines.split('\n');
          const wrappedLines = lines.map(line => line.length > 32 ? wrapTextSimple(line, 32) : line);
          return wrappedLines.join('\n') + '\n';
        }).join('')}
        {sisa > 0 ? (() => {
          const sisaLine = rightAlign('Sisa', formatNumber(sisa));
          return (sisaLine.length > 32 ? wrapTextSimple(sisaLine, 32) : sisaLine) + '\n';
        })() : ''}
        {(() => {
          const statusLine = rightAlign('Status', paymentStatus);
          return (statusLine.length > 32 ? wrapTextSimple(statusLine, 32) : statusLine) + '\n';
        })()}
        {'================================\n'}

        {/* REWARD POIN Section - Only show if points enabled in tenant settings */}
        {pointsEnabled && (() => {
          // Use earn_rate from state (fetched from tenant settings)
          
          // Calculate points based on payment status
          const paymentStatusForPoints = order.payment?.status || 'unpaid';
          const paidAmount = totalPaid || 0;
          const finalPrice = finalTotal || 0;
          
          // Calculate points: HANYA PAID = Poin Didapat, DP/UNPAID = Poin Menunggu
          let pointsEarned = 0;
          let pointsLabel = '';
          if (paymentStatusForPoints === 'paid' && paidAmount > 0) {
            pointsEarned = Math.floor(paidAmount / earnRate);
            pointsLabel = 'Poin Didapat';
          } else if (paymentStatusForPoints === 'dp' || paymentStatusForPoints === 'unpaid') {
            // Status DP atau UNPAID: poin masih menunggu (dari final_price)
            pointsEarned = Math.floor(finalPrice / earnRate);
            pointsLabel = 'Poin Menunggu';
          }
          
          // Get customer points data
          const currentPoints = order.customer?.points != null ? Number(order.customer.points) : 0;
          const membershipName = order.customer?.current_membership?.membership?.name || null;
          
          // Show section only if points enabled
          let pointsSection = '\n';
          pointsSection += centerAlign('*** REWARD POIN ***', 32) + '\n';
          
          // Poin Tambahan / Poin Menunggu
          if (pointsEarned > 0) {
            const pointsLine = rightAlign(pointsLabel, `+${formatNumber(pointsEarned)}`);
            pointsSection += (pointsLine.length > 32 ? wrapTextSimple(pointsLine, 32) : pointsLine) + '\n';
          }
          
          // Bonus Order Pertama (tampil jika ada PointTransaction)
          // ✅ FIX: Cek dari bonusPoints.firstOrder (jika > 0, berarti ada PointTransaction dengan first order bonus)
          if (bonusPoints.firstOrder > 0) {
            const firstOrderLine = rightAlign('Bonus Order Pertama', `+${formatNumber(bonusPoints.firstOrder)}`);
            pointsSection += (firstOrderLine.length > 32 ? wrapTextSimple(firstOrderLine, 32) : firstOrderLine) + '\n';
          }
          
          // Bonus Referral (hanya tampil jika ada)
          if (bonusPoints.referral > 0) {
            const referralLine = rightAlign('Bonus Referral', `+${formatNumber(bonusPoints.referral)}`);
            pointsSection += (referralLine.length > 32 ? wrapTextSimple(referralLine, 32) : referralLine) + '\n';
          }
          
          // ✅ REMOVED: Poin Saat Ini dipindahkan ke header sebagai "Poin Terkumpul"
          
          // Membership (if exists)
          if (membershipName) {
            pointsSection += `Membership: ${membershipName}\n`;
          }
          
          // Add promotional text
          pointsSection += '\n';
          pointsSection += centerAlign('(Tukar poin kamu jadi diskon!)', 32) + '\n';
          pointsSection += '================================\n';
          
          return pointsSection;
        })()}

        {/* Footer */}
        {'\n' + centerAlign('*** TERIMA KASIH ***', 32) + '\n'}
        {wrapTextSimple(printerSettings?.custom_thank_you || 'Terima Kasih Telah Mempercayakan Layanan Kepada Kami.', 32) + '\n'}

        {/* Footer Notes */}
        {printerSettings?.footer_notes && (
          <>
            {'\n--------------------------------\n'}
            {centerAlign('INFORMASI PENTING', 32) + '\n'}
            {'--------------------------------\n'}
            {wrapTextSimple(printerSettings.footer_notes, 32) + '\n'}
          </>
        )}

        {/* Social Media */}
        {(printerSettings?.instagram || printerSettings?.website) && (
          <>
            {'\n--------------------------------\n'}
            {printerSettings.instagram && wrapTextSimple(`Instagram: ${printerSettings.instagram}`, 32) + '\n'}
            {printerSettings.website && wrapTextSimple(`Website: ${printerSettings.website}`, 32) + '\n'}
          </>
        )}

        {/* Promo Text */}
        {printerSettings?.promo_text && (
          <>
            {'\n--------------------------------\n'}
            {centerAlign('PROMO SAAT INI', 32) + '\n'}
            {wrapTextSimple(printerSettings.promo_text, 32) + '\n'}
          </>
        )}

        {printerSettings?.show_qr_code && (
          <>
            {'\n\n'}
          </>
        )}
      </pre>

      {/* QR Code Preview - di-render setelah text */}
      {printerSettings?.show_qr_code && qrCodeImage && (
        <div className="flex flex-col items-center mt-1">
          <p className="text-[9px] font-mono text-gray-600 mt-1 text-center">
            Scan untuk lihat invoice digital
          </p>
          <div className="flex flex-col items-center mt-1" style={{ width: "10ch", maxWidth: "10ch" + 'px', margin: '0 auto' }}>
            <div className=" p-2 bg-white rounded" style={{ display: 'inline-block' }}>
              <img
                src={qrCodeImage}
                alt="QR Code"
                className="w-auto h-auto"
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceContentPreview;
