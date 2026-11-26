const WhatsAppFormatter = {
  getGreeting: () => {
    const jakartaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const hour = new Date(jakartaTime).getHours();

    if (hour >= 5 && hour < 11) return 'Pagi';
    if (hour >= 11 && hour < 15) return 'Siang';
    if (hour >= 15 && hour < 18) return 'Sore';
    return 'Malam';
  },

  formatStartDeliveryMessage: (type, businessName = 'NotaSepatu') => {
    const message = type === 'pickup' ? 'Menjemput' : 'Mengantar';
    const durationText = type === 'pickup' ? 'pengambilan' : 'pengantaran';
    const greeting = WhatsAppFormatter.getGreeting();
    
    return `Halo kak, Selamat ${greeting}!

Saya driver ${businessName} yang akan ${message} item kakak.

Durasi ${durationText} mungkin sedikit lebih lama menyesuaikan lokasi driver saat ini.

Mohon ditunggu ya kak, Terima kasih!`;
  },

  formatCompletionMessage: (businessName = 'NotaSepatu') => {
    return `Halo kak!

Setelah item diterima, kakak dapat memberikan review pada halaman Google milik ${businessName} yaa...
https://g.co/kgs/fXUqxG4

Terima kasih, selamat digunakan kembali!

Salam,
[Tim ${businessName}]`;
  },

  formatInitialMessage: (businessName = 'NotaSepatu') => {
    const greeting = WhatsAppFormatter.getGreeting();
    return `Halo kak, Selamat ${greeting}! Saya driver dari ${businessName}!`;
  },

  formatCancelMessage: (businessName = 'NotaSepatu') => {
    return `Mohon maaf kak, pengantaran dibatalkan karena kendala teknis.

Kami akan mengirimkan driver lain untuk melayani kakak.

Terima kasih atas pengertiannya 🙏`;
  },

  formatDelayMessage: (businessName = 'NotaSepatu') => {
    return `Mohon maaf kak, pengantaran akan sedikit terlambat karena kendala di jalan.

Mohon kesediaannya untuk menunggu sebentar ya kak.

Terima kasih 🙏`;
  },

  formatArrivalMessage: (businessName = 'NotaSepatu') => {
    return `Halo kak, saya sudah sampai di lokasi.

Mohon ditunggu sebentar ya kak 🙏`;
  },

  formatCancelDeliveryMessage: (type, nextDate, businessName = 'NotaSepatu') => {
    const message = type === 'pickup' ? 'penjemputan' : 'pengantaran';
    const greeting = WhatsAppFormatter.getGreeting();
    
    return `Halo kak, Selamat ${greeting}!

Mohon maaf, ${message} terpaksa dibatalkan karena kendala teknis.

Kami akan menjadwalkan ulang untuk besok (${nextDate}).

Terima kasih atas pengertiannya 🙏`;
  },

  // Template WhatsApp untuk pengiriman invoice
  formatInvoiceMessage: ({ customerName, orderNumber, amount, totalAmount, totalPaid, remainingAmount, paymentStatus, invoiceUrl, businessName = 'NotaSepatu' }) => {
    const greeting = WhatsAppFormatter.getGreeting();
    const status = paymentStatus || (Number(totalPaid || 0) <= 0 ? 'unpaid' : (Number(totalPaid || 0) < Number(totalAmount || amount || 0) ? 'partial' : 'paid'));

    function formatRupiah(amount) {
      if (!amount || isNaN(amount)) return '-';
      return 'Rp' + Number(amount).toLocaleString('id-ID');
    }

    let paymentSection = '';
    if (status === 'unpaid') {
      paymentSection = `
💵 Total Harga: ${formatRupiah(totalAmount || amount)}

Mohon lakukan pembayaran jika belum dibayar:
💳 DP minimal 50% dari total tagihan`;
    } else if (status === 'dp') {
      paymentSection = `
💵 Total Tagihan: ${formatRupiah(totalAmount || amount)}
✅ Pembayaran Diterima (DP): ${formatRupiah(totalPaid)}
🔁 Sisa Tagihan: ${formatRupiah(remainingAmount)}

Mohon selesaikan pelunasan sebelum pengambilan/pengiriman barang ya Kak.`;
    } else if (status === 'paid') {
      paymentSection = `
✅ Status: Lunas
💵 Total Pembayaran: ${formatRupiah(totalPaid || totalAmount || amount)}

Terima kasih, tidak ada tagihan yang tersisa.`;
    } else {};

    return `Selamat ${greeting} Kak ${customerName || ''} 👋

Terima kasih banyak sudah mempercayakan kami di *${businessName}*! 🙏  
Berikut kami kirimkan detail invoice untuk pesanan *#${orderNumber || '-'}*:
${paymentSection}

Kakak bisa cek detail lengkap pesanan melalui link berikut ya:  
${invoiceUrl}

Kalau ada pertanyaan atau butuh bantuan, silakan hubungi kami.

Semoga hari Kakak menyenangkan!✨

Salam hangat,  
*${businessName}*`;
  }
};

export default WhatsAppFormatter; 