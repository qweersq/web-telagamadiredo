// Template Invoice Thermal Printer 80mm - Modular
// Paper width: 80mm = ~48 characters per line (80/8 = 10, but use 48 for safety)

// Constants for 80mm paper
const MAX_CHARS = 48;
const SEPARATOR = '-'.repeat(48);
const SEPARATOR_DOUBLE = '='.repeat(48);

// Reuse helper functions from 58mm template
function formatNumber(num) {
  return parseInt(num).toLocaleString('id-ID');
}

function safeNumber(val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// Helper functions for 80mm (48 chars)
function wrapText80mm(text, maxLength = MAX_CHARS, indent = 0) {
  if (!text) return '';
  const indentStr = ' '.repeat(indent);
  if (text.length <= maxLength) return indentStr + text;
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxLength) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(indentStr + currentLine);
        currentLine = word;
      } else {
        // Word terlalu panjang, potong
        lines.push(indentStr + word.slice(0, maxLength));
        currentLine = word.slice(maxLength);
      }
    }
  }
  
  if (currentLine) {
    lines.push(indentStr + currentLine);
  }
  
  return lines.join('\n');
}

function rightAlign80mm(text, value, length = MAX_CHARS) {
  const textLength = text.length;
  const valueLength = value.toString().length;
  const spaces = length - textLength - valueLength;
  return `${text}${' '.repeat(Math.max(0, spaces))}${value}`;
}

function centerAlign80mm(text, width = MAX_CHARS) {
  if (!text) return '';
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((width - textLength) / 2));
  return `${' '.repeat(padding)}${text}`;
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

// Grouping function untuk invoice (sama dengan 58mm)
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

function generateHeaderInvoice80mm(dataOrder, tenantInfo = null, branchInfo = null, printerSettings = null, pointsEnabled = false, currentPoints = 0) {
  const { customer, payment } = dataOrder;
  
  // Dynamic values dengan fallback yang lebih baik
  const tenantName = tenantInfo?.business_name || tenantInfo?.company_name || '';
  const tenantAddress = tenantInfo?.address || '';
  const tenantPhone = tenantInfo?.phone || '';
  
  // Format header
  let header = '';
  
  // Jika logo tidak aktif, tampilkan tenant business name (uppercase, center) sebagai title dengan box design
  if (!printerSettings?.show_logo || !printerSettings?.logo_url) {
    if (tenantName) {
      // Box design untuk tenant business name (48 chars width)
      const boxWidth = MAX_CHARS;
      const tenantNameUpper = tenantName.toUpperCase();
      const paddingLeft = Math.floor((boxWidth - 2 - tenantNameUpper.length) / 2);
      const paddingRight = Math.ceil((boxWidth - 2 - tenantNameUpper.length) / 2);
      
      header += '+' + '-'.repeat(boxWidth - 2) + '+\n';
      header += '|' + ' '.repeat(paddingLeft) + tenantNameUpper + ' '.repeat(paddingRight) + '|\n';
      header += '+' + '-'.repeat(boxWidth - 2) + '+\n';
    }
  }
  
  // Tenant address & phone (wrapped to 48 chars)
  if (tenantAddress) {
    header += `${wrapText80mm(tenantAddress, MAX_CHARS)}\n`;
  }
  if (tenantPhone) {
    header += `Telp: ${tenantPhone}\n`;
  }
  header += `${SEPARATOR}\n`;
  
  // Customer info (wrapped)
  header += `Nama   : ${customer?.name || ''}\n`;
  
  // ✅ Poin Terkumpul: Tambahkan di bawah nama jika points enabled
  if (pointsEnabled && customer?.points != null) {
    const pointsToDisplay = currentPoints > 0 ? currentPoints : (Number(customer.points) || 0);
    header += `Poin Terkumpul : ${formatNumber(pointsToDisplay)}\n`;
  }
  
  if (customer?.address) {
    // Wrap "Alamat : {address}" dengan max 48 karakter per line
    const addressLine = `Alamat : ${customer.address}`;
    header += wrapText80mm(addressLine, MAX_CHARS) + '\n\n';
  } else {
    header += '\n';
  }
  
  header += `No.Inv : ${payment?.code || ''}\n`;
  
  // Tanggal saja (no time)
  const dateField = dataOrder.entry_date || dataOrder.createdAt || dataOrder.created_at || dataOrder.date || dataOrder.order_date;
  const formattedDate = dateField 
    ? new Date(dateField).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : 'Tidak ada tanggal';
  
  header += `Tgl    : ${formattedDate}\n`;
  header += `Kasir  : ${dataOrder.creator?.name || '-'}\n`;
  header += `${SEPARATOR}\n`;
  
  return header;
}

export function generateOrderDetails80mm(orderDetails) {
  // Group dulu sebelum generate
  const groupedDetails = groupOrderDetailsForInvoice(orderDetails);
  
  let result = '';
  let totalAll = 0;
  for (const group of groupedDetails) {
    const treatmentName = group.treatment?.name || '-';
    const qty = group.qty;
    
    // Hitung base price dan discount untuk display
    const base = group.custom_price != null 
      ? safeNumber(group.custom_price) 
      : safeNumber(group.treatment?.price);
    
    let addonTotal = 0;
    if (group.addons && Array.isArray(group.addons)) {
      addonTotal = group.addons.reduce((sum, addon) => {
        const addonPrice = safeNumber(addon.addon?.price || addon.price || 0);
        return sum + addonPrice;
      }, 0);
    }
    const priceWithAddons = base + addonTotal;
    
    // Calculate discount amount untuk display
    let discountAmount = 0;
    let discountText = '';
    const discount = group.discount;
    if (discount && discount.type) {
      const discVal = (discount.discount != null) ? safeNumber(discount.discount) : safeNumber(discount.value);
      if (discount.type === 'percent') {
        discountAmount = priceWithAddons * (discVal / 100);
        discountText = `-${discVal}%`;
      } else if (discount.type === 'nominal') {
        discountAmount = discVal;
        discountText = `-${formatNumber(discVal)}`;
      }
    }
    
    const finalPricePerItem = calculateFinalPricePerItem(group);
    const totalFinal = finalPricePerItem * qty;
    totalAll += totalFinal;
    
    result += `${treatmentName} x${qty}\n`;
    
    // Tambahkan custom_price_reason jika ada
    if (group.custom_price_reason) {
      result += wrapText80mm(`Ket: ${group.custom_price_reason}`, 46, 2) + '\n';
    }

    // ✅ Detail item + nomor antrian tag (reset harian per cabang)
    if (group.items && Array.isArray(group.items) && group.items.length > 0) {
      for (const item of group.items) {
        const itemName = item.item?.name || item.name || '';
        const itemBrand = item.item?.brand || item.brand || '';
        if (!itemName && !itemBrand) continue;

        const tagNumber = item.tag_number != null
          ? item.tag_number
          : (item.item?.tag_number != null ? item.item.tag_number : null);

        const label = itemBrand ? `${itemBrand} ${itemName}` : itemName;
        result += wrapText80mm(tagNumber != null ? `#${tagNumber} ${label}` : label, 46, 2) + '\n';
      }
    }
    
    // Tampilkan discount jika ada (format compact agar tidak overflow)
    if (discount && discount.type && discountAmount > 0) {
      // Format: "Diskon -10%: -4.000" (lebih compact)
      result += rightAlign80mm(`Diskon ${discountText}:`, formatNumber(discountAmount)) + '\n';
    }
    
    result += rightAlign80mm(`Harga (${qty}x${formatNumber(finalPricePerItem)})`, formatNumber(totalFinal)) + '\n';
    result += `${SEPARATOR}\n`;
  }
  return { details: result, totalAll };
}

function generatePaymentSummary80mm(payment, subTotal) {
  if (!payment) return '';
  const {
    paid_amount,
    status,
    payment_details
  } = payment;
  
  // Hitung total pembayaran dari payment_details
  let totalPaid = 0;
  if (payment_details && payment_details.length > 0) {
    payment_details.forEach(detail => {
      totalPaid += safeNumber(detail.amount);
    });
  }
  
  // Tentukan status berdasarkan perhitungan yang sama dengan QuickOrderInput
  let paymentStatus = '';
  // Jika total amount = 0 (free service), otomatis lunas
  if (subTotal === 0) {
    paymentStatus = '(Lunas)';
  } else if (totalPaid === 0) {
    paymentStatus = '(Belum Lunas)';
  } else if (totalPaid > 0 && totalPaid < subTotal) {
    paymentStatus = `(DP ${formatNumber(totalPaid)})`;
  } else if (totalPaid >= subTotal) {
    paymentStatus = '(Lunas)';
  } else {
    paymentStatus = '(Belum Lunas)';
  }
  
  let summary = `\n${rightAlign80mm('Sub Total', formatNumber(subTotal))}`;
  if (payment_details && payment_details.length > 0) {
    payment_details.forEach(detail => {
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
      
      summary += `\n${rightAlign80mm(`Bayar (${methodDisplay})`, formatNumber(detail.amount))}`;
    });
  }
  const sisa = Math.max(0, subTotal - totalPaid);
  if (sisa > 0) {
    summary += `\n${rightAlign80mm('Sisa', formatNumber(sisa))}`;
  }
  summary += `\n${rightAlign80mm('Status', paymentStatus)}`;
  summary += `\n${SEPARATOR_DOUBLE}\n`;
  return summary;
}

function generatePointsSection80mm(orderData, payment, totalPaid, finalTotal, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
  // earn_rate passed as parameter (default: 1000 = 1 poin per Rp 1.000)
  // pointsEnabled: hanya generate section jika enabled = true
  
  // Jika points tidak enabled, return empty string
  if (!pointsEnabled) {
    return '';
  }
  
  // Calculate points based on payment status
  const paymentStatus = payment?.status || 'unpaid';
  const paidAmount = totalPaid || 0;
  const finalPrice = finalTotal || 0;
  
  // Calculate points: PAID = dari paid_amount, DP/UNPAID = dari final_price (potensi)
  let pointsEarned = 0;
  let pointsLabel = '';
  if (paymentStatus === 'paid' && paidAmount > 0) {
    pointsEarned = Math.floor(paidAmount / earnRate);
    pointsLabel = 'Poin Didapat';
  } else if (finalPrice > 0) {
    pointsEarned = Math.floor(finalPrice / earnRate);
    pointsLabel = 'Poin Menunggu';
  }
  
  // Get customer points data
  const customer = orderData?.customer || null;
  const currentPoints = customer?.points != null ? Number(customer.points) : 0;
  const membershipName = customer?.current_membership?.membership?.name || null;
  
  // Show section only if points enabled
  let pointsSection = '\n';
  pointsSection += centerAlign80mm('*** REWARD POIN ***') + '\n';
  
  // Poin Tambahan / Poin Menunggu
  if (pointsEarned > 0) {
    pointsSection += `${rightAlign80mm(pointsLabel, `+${formatNumber(pointsEarned)}`)}\n`;
  }
  
  // Bonus Order Pertama (tampil jika ada PointTransaction)
  // ✅ FIX: Cek dari bonusPoints.firstOrder (jika > 0, berarti ada PointTransaction dengan first order bonus)
  if (bonusPoints.firstOrder > 0) {
    pointsSection += `${rightAlign80mm('Bonus Order Pertama', `+${formatNumber(bonusPoints.firstOrder)}`)}\n`;
  }
  
  // Bonus Referral (hanya tampil jika ada)
  if (bonusPoints.referral > 0) {
    pointsSection += `${rightAlign80mm('Bonus Referral', `+${formatNumber(bonusPoints.referral)}`)}\n`;
  }
  
  // ✅ REMOVED: Poin Saat Ini dipindahkan ke header sebagai "Poin Terkumpul"
  
  // Membership (if exists)
  if (membershipName) {
    pointsSection += `Membership: ${membershipName}\n`;
  }
  
  // Add promotional text
  pointsSection += '\n';
  pointsSection += centerAlign80mm('(Tukar poin kamu jadi diskon!)') + '\n';
  pointsSection += `${SEPARATOR_DOUBLE}\n`;
  
  return pointsSection;
}

function generateFooterInvoice80mm(tenantInfo = null, printerSettings = null, orderData = null) {
  // Gunakan custom_thank_you dari printer settings jika ada
  const footerText = printerSettings?.custom_thank_you || 
                     "Terima Kasih Telah Mempercayakan Layanan Kepada Kami.";
  
  // Gunakan karakter ASCII yang bisa dicetak di thermal printer
  // Center align: "*** TERIMA KASIH ***"
  let footer = '\n';
  footer += centerAlign80mm('*** TERIMA KASIH ***') + '\n';
  footer += wrapText80mm(footerText, MAX_CHARS) + '\n';
  
  // Footer elements (opsional - urutan bisa dinamis)
  // 1. Footer Notes / Info Penting
  if (printerSettings?.footer_notes) {
    footer += `\n${SEPARATOR}\n`;
    footer += centerAlign80mm('INFORMASI PENTING') + '\n';
    footer += `${SEPARATOR}\n`;
    footer += wrapText80mm(printerSettings.footer_notes, MAX_CHARS) + '\n';
  }
  
  // 2. Social Media (Instagram/Website)
  if (printerSettings?.instagram || printerSettings?.website) {
    footer += `\n${SEPARATOR}\n`;
    footer += 'Follow Social Media Kami:\n';
    if (printerSettings.instagram) {
      footer += `Instagram: ${printerSettings.instagram}\n`;
    }
    if (printerSettings.website) {
      footer += `Website: ${printerSettings.website}\n`;
    }
  }
  
  // 3. Promo Text
  if (printerSettings?.promo_text) {
    footer += `\n${SEPARATOR}\n`;
    footer += centerAlign80mm('PROMO SAAT INI') + '\n';
    footer += wrapText80mm(printerSettings.promo_text, MAX_CHARS);
  }
  
  // QR Code di akhir (setelah semua footer lainnya)
  
  return footer;
}

export function generateInvoiceContent80mm(orderData, tenantInfo = null, branchInfo = null, printerSettings = null, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
  let content = '';
  const { details, totalAll } = generateOrderDetails80mm(orderData.order_details);
  
  // ✅ Get current points for header
  const customer = orderData?.customer || null;
  const currentPoints = customer?.points != null ? Number(customer.points) : 0;
  
  content += generateHeaderInvoice80mm(orderData, tenantInfo, branchInfo, printerSettings, pointsEnabled, currentPoints);
  content += details;
  content += generatePaymentSummary80mm(orderData.payment, totalAll);
  
  // Calculate totalPaid and finalTotal for points section
  let totalPaid = 0;
  if (orderData.payment?.payment_details && orderData.payment.payment_details.length > 0) {
    orderData.payment.payment_details.forEach(detail => {
      totalPaid += safeNumber(detail.amount);
    });
  }
  const finalTotal = orderData.payment?.final_price != null 
    ? safeNumber(orderData.payment.final_price) 
    : totalAll;
  
  // Add points section before footer (only if points enabled)
  content += generatePointsSection80mm(orderData, orderData.payment, totalPaid, finalTotal, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
  content += generateFooterInvoice80mm(tenantInfo, printerSettings, orderData);
  console.log('content 80mm', content);
  return content;
}

