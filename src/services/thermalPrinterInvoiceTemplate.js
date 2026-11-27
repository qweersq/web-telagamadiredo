// Template Invoice Thermal Printer - Modular
import dayjs from 'dayjs';
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

// Keterangan / request khusus per item (dedupe, tanpa tag antrian)
function collectItemNotes(group) {
  const notes = [];
  const push = (value) => {
    const note = String(value || '').trim();
    if (!note || note === '-') return;
    if (notes.some((existing) => existing.toLowerCase() === note.toLowerCase())) return;
    notes.push(note);
  };

  if (group.custom_price_reason) push(group.custom_price_reason);

  const items = Array.isArray(group.items) ? group.items : [];
  items.forEach((item) => {
    push(item?.description);
    push(item?.notes);
    push(item?.note);
  });

  return notes;
}

function generateHeaderInvoice(dataOrder, tenantInfo = null, branchInfo = null, printerSettings = null) {
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

  // Customer info — walk-in tanpa identitas tetap tampil sebagai "Pelanggan Umum"
  header += `Nama   : ${customer?.name || 'Pelanggan Umum'}\n\n`;

  header += `No.Inv : ${payment?.code || ''}\n`;

  // Tanggal + jam transaksi (dari createdAt order)
  const dateField = dataOrder.createdAt || dataOrder.created_at || dataOrder.entry_date || dataOrder.date || dataOrder.order_date;
  const formattedDate = dateField
    ? dayjs(dateField).format('DD/MM/YY HH:mm')
    : 'Tidak ada tanggal';

  header += `Tgl    : ${formattedDate}\n`;
  header += `Kasir  : ${dataOrder.creator?.name || '-'}\n`;
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

    // Keterangan / request khusus
    collectItemNotes(group).forEach((note) => {
      result += wrapText(`Ket: ${note}`, 30, 2) + '\n';
    });

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

  // ✅ FIX: Pisahkan potongan: Payment Discount, Membership Discount
  if (paymentDiscountAmount > 0) {
    summary += `\n${rightAlign('Potongan Diskon', `(${formatNumber(paymentDiscountAmount)})`)}`;
  }
  if (membershipDiscountAmount > 0) {
    summary += `\n${rightAlign('Potongan Membership', `(${formatNumber(membershipDiscountAmount)})`)}`;
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

export function generateInvoiceContent(orderData, tenantInfo = null, branchInfo = null, printerSettings = null) {
  let content = '';
  const { details, totalAll } = generateOrderDetails(orderData.order_details);

  content += generateHeaderInvoice(orderData, tenantInfo, branchInfo, printerSettings);
  content += details;
  content += generatePaymentSummary(orderData.payment, totalAll);
  content += generateFooterInvoice(tenantInfo, printerSettings, orderData);
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