// Template Invoice Thermal Printer - Modular
import { formatPaymentMethod } from '../utils/labelFormatter';

// Helper
function truncateText(text, maxLength = 32) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function wrapText(text, maxLength = 32, indent = 0) {
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

// Helper: Format item details untuk invoice
function formatItemDetails(items, maxLength = 30, indent = 2) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }

  let result = '';
  const indentStr = ' '.repeat(indent);
  const notesIndent = ' '.repeat(indent + 2); // Indent lebih dalam untuk notes

  items.forEach((item, index) => {
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

    // Build item text: [#N] [brand] [nama item]
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
    const wrappedText = wrapText(itemText, maxLength, indent);
    result += wrappedText + '\n';

    // Tambahkan notes jika ada
    // if (itemNotes && itemNotes.trim()) {
    //   const notesText = `Catatan: ${itemNotes.trim()}`;
    //   const wrappedNotes = wrapText(notesText, maxLength, indent + 2);
    //   result += wrappedNotes + '\n';
    // }
  });

  return result;
}

function generateHeaderInvoice(dataOrder, tenantInfo = null, branchInfo = null, printerSettings = null, pointsEnabled = false, currentPoints = 0) {
  const { customer, payment } = dataOrder;

  // Dynamic values dengan fallback yang lebih baik
  const tenantName = tenantInfo?.business_name || tenantInfo?.company_name || '';
  // Branch address & phone (prioritas: branchInfo > tenantInfo > default)
  const branchAddress = branchInfo?.address ||
    tenantInfo?.address ||
    '';
  const branchPhone = branchInfo?.phone ||
    tenantInfo?.phone ||
    '';

  // Format header
  let header = '';

  // Jika logo tidak aktif, tampilkan tenant business name (uppercase, center) sebagai title dengan box design
  if (!printerSettings?.show_logo || !printerSettings?.logo_url) {
    if (tenantName) {
      // Box design untuk tenant business name
      const boxWidth = 32;
      const tenantNameUpper = tenantName.toUpperCase();
      const paddingLeft = Math.floor((boxWidth - 2 - tenantNameUpper.length) / 2);
      const paddingRight = Math.ceil((boxWidth - 2 - tenantNameUpper.length) / 2);

      header += '+' + '-'.repeat(boxWidth - 2) + '+\n';
      header += '|' + ' '.repeat(paddingLeft) + tenantNameUpper + ' '.repeat(paddingRight) + '|\n';
      header += '+' + '-'.repeat(boxWidth - 2) + '+\n';
    }
  }

  // Branch address & phone (wrapped to 32 chars)
  if (branchAddress) {
    header += `${wrapText(branchAddress, 32)}\n`;
  }
  if (branchPhone) {
    header += `Telp: ${branchPhone}\n`;
  }
  header += `--------------------------------\n`;

  // Customer info (wrapped)
  header += `Nama   : ${customer?.name || ''}\n`;

  // ✅ Poin Terkumpul: Tambahkan di bawah nama jika points enabled
  if (pointsEnabled && customer?.points != null) {
    const pointsToDisplay = currentPoints > 0 ? currentPoints : (Number(customer.points) || 0);
    header += `Poin Terkumpul : ${formatNumber(pointsToDisplay)}\n`;
  }

  if (customer?.address) {
    // Wrap "Alamat : {address}" dengan max 32 karakter per line
    const addressLine = `Alamat : ${customer.address}`;
    header += wrapText(addressLine, 32) + '\n\n';
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
  header += `--------------------------------\n`;

  return header;
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

// Grouping function untuk invoice (sama dengan InvoiceContentPreview)
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

export function generateOrderDetails(orderDetails) {
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
      result += wrapText(`Ket: ${group.custom_price_reason}`, 30, 2) + '\n';
    }

    // Tambahkan detail items jika ada
    if (group.items && Array.isArray(group.items) && group.items.length > 0) {
      const itemsText = formatItemDetails(group.items, 30, 2);
      if (itemsText) {
        result += itemsText;
      }
    }

    // Tampilkan discount jika ada (format compact agar tidak overflow)
    if (discount && discount.type && discountAmount > 0) {
      // Format: "Diskon -10%: -4.000" (lebih compact)
      result += rightAlign(`Diskon ${discountText}:`, formatNumber(discountAmount)) + '\n';
    }

    result += rightAlign(`Harga (${qty}x${formatNumber(finalPricePerItem)})`, formatNumber(totalFinal)) + '\n';
    result += '--------------------------------\n';
  }
  return { details: result, totalAll };
}

function generatePaymentSummary(payment, subTotal) {
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

  // ✅ FIX: Calculate payment-level discount (pisahkan: payment discount, membership discount, points discount)
  let paymentDiscountAmount = 0; // Payment discount saja (dari discount object)
  let membershipDiscountAmount = 0; // Membership discount
  let pointsDiscountAmount = 0; // Points discount
  let finalTotal = subTotal;

  // Prioritaskan final_price dari backend jika tersedia (lebih akurat)
  if (payment?.final_price != null) {
    finalTotal = safeNumber(payment.final_price);

    // ✅ FIX: Pisahkan discount dari backend jika tersedia
    membershipDiscountAmount = safeNumber(payment.membership_discount || 0);
    pointsDiscountAmount = safeNumber(payment.points_discount || 0);

    // Hitung payment discount (dari discount object atau dari total_discount - membership - points)
    if (payment?.discount && payment.discount.type) {
      // Hitung dari discount object
      const paymentDiscount = payment.discount;
      const discVal = (paymentDiscount.discount != null) ? safeNumber(paymentDiscount.discount) : safeNumber(paymentDiscount.value);

      if (paymentDiscount.type === 'percent') {
        paymentDiscountAmount = Math.round(subTotal * (discVal / 100));
      } else if (paymentDiscount.type === 'nominal') {
        paymentDiscountAmount = discVal;
      }
    } else if (payment?.total_discount != null) {
      // Jika tidak ada discount object, hitung payment discount dari total_discount - membership - points
      const totalDiscount = safeNumber(payment.total_discount);
      paymentDiscountAmount = Math.max(0, totalDiscount - membershipDiscountAmount - pointsDiscountAmount);
    }
  } else if (payment?.discount && payment.discount.type) {
    // Jika final_price tidak tersedia, hitung dari discount object
    const paymentDiscount = payment.discount;
    const discVal = (paymentDiscount.discount != null) ? safeNumber(paymentDiscount.discount) : safeNumber(paymentDiscount.value);

    if (paymentDiscount.type === 'percent') {
      paymentDiscountAmount = Math.round(subTotal * (discVal / 100));
    } else if (paymentDiscount.type === 'nominal') {
      paymentDiscountAmount = discVal;
    }

    // ✅ FIX: Ambil membership discount dan points discount dari backend jika ada
    membershipDiscountAmount = safeNumber(payment.membership_discount || 0);
    pointsDiscountAmount = safeNumber(payment.points_discount || 0);

    finalTotal = Math.max(0, Math.round(subTotal - paymentDiscountAmount - membershipDiscountAmount - pointsDiscountAmount));
  } else {
    // ✅ FIX: Jika tidak ada payment discount object, cek langsung dari membership_discount dan points_discount
    membershipDiscountAmount = safeNumber(payment.membership_discount || 0);
    pointsDiscountAmount = safeNumber(payment.points_discount || 0);

    if (membershipDiscountAmount > 0 || pointsDiscountAmount > 0) {
      finalTotal = Math.max(0, Math.round(subTotal - membershipDiscountAmount - pointsDiscountAmount));
    }
  }

  // ✅ FALLBACK: Jika ada selisih antara subtotal dan finalPrice tapi tidak ada diskon yang terdeteksi,
  // hitung implicit discount dari selisihnya.
  if (paymentDiscountAmount === 0 && membershipDiscountAmount === 0 && pointsDiscountAmount === 0 && finalTotal < subTotal) {
    paymentDiscountAmount = subTotal - finalTotal;
  }

  // ✅ Tentukan status berdasarkan finalTotal (bukan subTotal)
  let paymentStatus = '';
  // Jika total amount = 0 (free service), otomatis lunas
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

  // ✅ Payment Summary dengan urutan yang benar
  let summary = `\n${rightAlign('Sub Total', formatNumber(subTotal))}`;

  // ✅ FIX: Pisahkan potongan: Payment Discount, Membership Discount, Points Discount
  if (paymentDiscountAmount > 0) {
    summary += `\n${rightAlign('Potongan Diskon', `(${formatNumber(paymentDiscountAmount)})`)}`;
  }
  if (membershipDiscountAmount > 0) {
    summary += `\n${rightAlign('Potongan Membership', `(${formatNumber(membershipDiscountAmount)})`)}`;
  }
  if (pointsDiscountAmount > 0) {
    summary += `\n${rightAlign('Potongan Poin', `(${formatNumber(pointsDiscountAmount)})`)}`;
  }

  // ✅ Tampilkan Total Akhir (dengan enter setelahnya)
  summary += `\n${rightAlign('Total Akhir', formatNumber(finalTotal))}\n`;

  // ✅ Tampilkan Bayar setelah Total Akhir
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

      summary += `\n${rightAlign(`Bayar (${methodDisplay})`, formatNumber(detail.amount))}`;

      // ✅ Display money_received and change for cash payments
      if (detail.money_received && detail.money_received > 0) {
        summary += `\n${rightAlign('Uang Diterima', formatNumber(detail.money_received))}`;
        if (detail.change_amount && detail.change_amount > 0) {
          summary += `\n${rightAlign('Kembalian', formatNumber(detail.change_amount))}`;
        }
      }
    });
  }

  // ✅ Hitung sisa berdasarkan finalTotal (bukan subTotal)
  const sisa = Math.max(0, finalTotal - totalPaid);
  if (sisa > 0) {
    summary += `\n${rightAlign('Sisa', formatNumber(sisa))}`;
  }
  summary += `\n${rightAlign('Status', paymentStatus)}`;
  summary += '\n================================\n';
  return summary;
}

function generatePointsSection(orderData, payment, totalPaid, finalTotal, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
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

  // Calculate points: HANYA PAID = Poin Didapat, DP/UNPAID = Poin Menunggu
  let pointsEarned = 0;
  let pointsLabel = '';
  if (paymentStatus === 'paid' && paidAmount > 0) {
    pointsEarned = Math.floor(paidAmount / earnRate);
    pointsLabel = 'Poin Didapat';
  } else if (paymentStatus === 'dp' || paymentStatus === 'unpaid') {
    // Status DP atau UNPAID: poin masih menunggu (dari final_price)
    pointsEarned = Math.floor(finalPrice / earnRate);
    pointsLabel = 'Poin Menunggu';
  }

  // Get customer points data
  const customer = orderData?.customer || null;
  const currentPoints = customer?.points != null ? Number(customer.points) : 0;
  const membershipName = customer?.current_membership?.membership?.name || null;

  // Show section only if points enabled
  let pointsSection = '\n';
  pointsSection += centerAlign('*** REWARD POIN ***', 32) + '\n';

  // Poin Tambahan / Poin Menunggu
  if (pointsEarned > 0) {
    pointsSection += `${rightAlign(pointsLabel, `+${formatNumber(pointsEarned)}`)}\n`;
  }

  // Bonus Order Pertama (tampil jika ada PointTransaction)
  // ✅ FIX: Cek dari bonusPoints.firstOrder (jika > 0, berarti ada PointTransaction dengan first order bonus)
  if (bonusPoints.firstOrder > 0) {
    pointsSection += `${rightAlign('Bonus Order Pertama', `+${formatNumber(bonusPoints.firstOrder)}`)}\n`;
  }

  // Bonus Referral (hanya tampil jika ada)
  if (bonusPoints.referral > 0) {
    pointsSection += `${rightAlign('Bonus Referral', `+${formatNumber(bonusPoints.referral)}`)}\n`;
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
}

function generateFooterInvoice(tenantInfo = null, printerSettings = null, orderData = null) {
  // Gunakan custom_thank_you dari printer settings jika ada
  const footerText = printerSettings?.custom_thank_you ||
    "Terima Kasih Telah Mempercayakan Layanan Kepada Kami.";

  // Gunakan karakter ASCII yang bisa dicetak di thermal printer
  // Center align: "*** TERIMA KASIH ***"
  let footer = '\n';
  footer += centerAlign('*** TERIMA KASIH ***', 32) + '\n';
  footer += wrapText(footerText, 32) + '\n';

  // Footer elements (opsional - urutan bisa dinamis)
  // 1. Footer Notes / Info Penting
  if (printerSettings?.footer_notes) {
    footer += '\n--------------------------------\n';
    footer += centerAlign('INFORMASI PENTING', 32) + '\n';
    footer += '--------------------------------\n';
    footer += wrapText(printerSettings.footer_notes, 32) + '\n';
  }

  // 2. Social Media (Instagram/Website)
  if (printerSettings?.instagram || printerSettings?.website) {
    footer += '\n--------------------------------\n';
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
    footer += '\n--------------------------------\n';
    footer += centerAlign('PROMO SAAT INI', 32) + '\n';
    footer += wrapText(printerSettings.promo_text, 32);
  }

  // QR Code di akhir (setelah semua footer lainnya)

  return footer;
}

export function generateInvoiceContent(orderData, tenantInfo = null, branchInfo = null, printerSettings = null, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
  let content = '';
  const { details, totalAll } = generateOrderDetails(orderData.order_details);

  // ✅ Get current points for header
  const customer = orderData?.customer || null;
  const currentPoints = customer?.points != null ? Number(customer.points) : 0;

  content += generateHeaderInvoice(orderData, tenantInfo, branchInfo, printerSettings, pointsEnabled, currentPoints);
  content += details;
  content += generatePaymentSummary(orderData.payment, totalAll);

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
  content += generatePointsSection(orderData, orderData.payment, totalPaid, finalTotal, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
  content += generateFooterInvoice(tenantInfo, printerSettings, orderData);
  console.log('content', content);
  return content;
}

// Utility: hitung total, totalNormal, totalAddon, totalDiscount dari grouped order_details
export function getOrderDetailsSummary(orderDetails) {
  let total = 0;
  let totalNormal = 0;
  let totalAddon = 0;
  let totalDiscount = 0;

  for (const group of orderDetails) {
    const base = group.custom_price != null
      ? safeNumber(group.custom_price)
      : safeNumber(group.treatment?.price);
    const qty = Array.isArray(group.items) ? group.items.length : 1;

    // Hitung addon total
    let addonTotal = 0;
    if (group.addons && Array.isArray(group.addons)) {
      addonTotal = group.addons.reduce((sum, addon) => {
        const addonPrice = safeNumber(addon.addon?.price || addon.price || 0);
        return sum + addonPrice;
      }, 0);
    }

    const priceWithAddons = base + addonTotal;

    // Hitung diskon
    let discountAmount = 0;
    const discount = group.discount;
    if (discount && discount.type) {
      const discVal = (discount.discount != null) ? safeNumber(discount.discount) : safeNumber(discount.value);
      if (discount.type === 'percent') {
        discountAmount = priceWithAddons * (discVal / 100);
      } else if (discount.type === 'nominal') {
        discountAmount = discVal;
      }
    }

    const finalPerItem = Math.max(0, Math.round(priceWithAddons - discountAmount));
    total += finalPerItem * qty;
    totalNormal += base * qty;
    totalAddon += addonTotal * qty;
    totalDiscount += discountAmount * qty;
  }

  return {
    total, // total yang harus dibayar
    totalNormal, // total harga normal (base price)
    totalAddon, // total addon
    totalDiscount // total potongan
  };
} 