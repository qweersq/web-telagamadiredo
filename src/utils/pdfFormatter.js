// PDF Formatter untuk Laporan Keuangan
// Modern, professional, dan responsive

// Dynamic import untuk jsPDF
let jsPDF = null;
let autoTable = null;

export const createFinancialReportPDF = async (reportData, userProfile, selectedBranch, selectedMonth, selectedYear, months) => {
  try {
    // Dynamic import jsPDF dan jspdf-autotable
    if (!jsPDF) {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default;
    }
    
    if (!autoTable) {
      const autoTableModule = await import('jspdf-autotable');
      autoTable = autoTableModule.default;
    }

    const branchName = selectedBranch ? selectedBranch.name : 'Semua Cabang';
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    
    // Helper function untuk format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Create PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Set font
    doc.setFont('helvetica');
    
    // Colors
    const colors = {
      primary: '#2E7D32',
      secondary: '#1976D2',
      light: '#E3F2FD',
      dark: '#333333',
      gray: '#666666',
      lightGray: '#F5F5F5'
    };

    let yPosition = 20;

    // Header Section
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN BULANAN', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(userProfile?.tenant?.business_name || 'Nama Bisnis', 105, 22, { align: 'center' });
    
    yPosition = 40;

    // Business Info
    doc.setTextColor(colors.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const businessInfo = [
      ['Cabang', branchName],
      ['Periode', `${monthName} ${selectedYear}`],
      ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')]
    ];

    businessInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Summary Section
    doc.setFillColor(colors.secondary);
    doc.rect(15, yPosition - 5, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN', 20, yPosition);
    
    yPosition += 15;

    // Summary Table
    const summaryData = [
      ['Total Pemasukan', formatCurrency(reportData.summary.total_income), `${reportData.summary.income_transactions} transaksi`],
      ['Pendapatan Membership', formatCurrency(reportData.summary.membership_revenue || 0), `${reportData.summary.membership_count || 0} membership`],
      ['Total Pengeluaran', formatCurrency(reportData.summary.total_expense), `${reportData.summary.expense_transactions} transaksi`],
      ['Arus Kas Bersih', formatCurrency(reportData.summary.net_balance), `${reportData.summary.total_income ? ((reportData.summary.net_balance / reportData.summary.total_income) * 100).toFixed(1) : 0}% dari pemasukan`],
      ['Omzet Penjualan Item', formatCurrency(reportData.summary.sales_revenue || 0), `${reportData.hpp_breakdown?.total_items || 0} item terjual`],
      ['HPP (Harga Pokok)', formatCurrency(reportData.summary.hpp_total || 0), `${reportData.hpp_breakdown?.items_without_hpp || 0} item HPP kosong`],
      ['Laba Kotor', formatCurrency(reportData.summary.gross_profit || 0), `${(reportData.summary.gross_margin_percent || 0).toFixed(1)}% margin`],
      ['Total Transaksi', reportData.summary.transaction_count.toString(), 'Semua transaksi']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Jumlah', 'Keterangan']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.light,
        textColor: colors.dark,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: colors.dark
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 50 }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Income Breakdown
    if (reportData.category_breakdown.filter(cat => cat.category_type === 'credit').length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PEMASUKAN PER KATEGORI', 20, yPosition);
      
      yPosition += 15;

      const incomeData = reportData.category_breakdown
        .filter(cat => cat.category_type === 'credit')
        .map(cat => [
          cat.category_name,
          formatCurrency(cat.total_amount),
          `${cat.percentage.toFixed(1)}%`,
          cat.transaction_count.toString()
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Kategori', 'Jumlah', 'Persentase', 'Transaksi']],
        body: incomeData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.light,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Expense Breakdown
    if (reportData.category_breakdown.filter(cat => cat.category_type === 'debit').length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PENGELUARAN PER KATEGORI', 20, yPosition);
      
      yPosition += 15;

      const expenseData = reportData.category_breakdown
        .filter(cat => cat.category_type === 'debit')
        .map(cat => [
          cat.category_name,
          formatCurrency(cat.total_amount),
          `${cat.percentage.toFixed(1)}%`,
          cat.transaction_count.toString()
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Kategori', 'Jumlah', 'Persentase', 'Transaksi']],
        body: expenseData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.light,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // ✅ Rincian Transaksi Pengeluaran (dari expense_transactions_list atau fallback ke top_transactions)
    const expenseTransactions = reportData.expense_transactions_list 
      ? reportData.expense_transactions_list 
      : (reportData.top_transactions || []).filter(t => t.category?.type === 'debit');
    if (expenseTransactions.length > 0) {
      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RINCIAN TRANSAKSI PENGELUARAN', 20, yPosition);

      yPosition += 15;

      const expenseTransactionData = expenseTransactions.map(t => [
        t.date ? new Date(t.date).toLocaleDateString('id-ID') : '-',
        t.description || '-',
        t.category?.name || '-',
        t.account?.name || '-',
        formatCurrency(t.final_amount || t.amount || 0),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Akun', 'Nominal']],
        body: expenseTransactionData,
        theme: 'grid',
        headStyles: {
          fillColor: '#FFEBEE',
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: colors.dark,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 55 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 15, right: 15 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Membership Breakdown
    if (reportData.membership_breakdown && reportData.membership_breakdown.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PENDAPATAN MEMBERSHIP', 20, yPosition);
      
      yPosition += 15;

      const membershipData = reportData.membership_breakdown.map(membership => [
        membership.membership_name,
        formatCurrency(membership.membership_price),
        membership.total_members.toString(),
        formatCurrency(membership.total_revenue),
        membership.active_members.toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Jenis Membership', 'Harga', 'Total Member', 'Total Revenue', 'Member Aktif']],
        body: membershipData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.light,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Account Balances
    if (reportData.account_balances.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SALDO AKUN KEUANGAN', 20, yPosition);
      
      yPosition += 15;

      const accountData = reportData.account_balances.map(account => [
        account.account_name,
        formatCurrency(account.current_balance),
        account.transaction_count.toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Nama Akun', 'Saldo Saat Ini', 'Transaksi']],
        body: accountData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.light,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Payment Methods
    if (reportData.payment_method_breakdown.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('METODE PEMBAYARAN', 20, yPosition);
      
      yPosition += 15;

      const paymentData = reportData.payment_method_breakdown.map(method => [
        method.payment_method_name,
        formatCurrency(method.total_amount),
        `${method.percentage.toFixed(1)}%`,
        method.transaction_count.toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Metode', 'Jumlah', 'Persentase', 'Transaksi']],
        body: paymentData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.light,
          textColor: colors.dark,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.dark
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }


    // Footer
    yPosition += 10;
    doc.setTextColor(colors.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan dibuat oleh sistem NotaSepatu', 20, yPosition);
    doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, 20, yPosition + 5);
    
    yPosition += 15;
    doc.text('Catatan:', 20, yPosition);
    doc.text('• Laporan ini dibuat berdasarkan data transaksi keuangan yang tercatat dalam sistem', 25, yPosition + 5);
    doc.text('• Semua nominal dalam Rupiah (IDR)', 25, yPosition + 10);
    doc.text('• Data diambil dari periode yang dipilih', 25, yPosition + 15);
    doc.text('• Jika ada pertanyaan, hubungi admin NotaSepatu', 25, yPosition + 20);

    // Generate filename dan download
    const filename = `Laporan-Keuangan-${monthName}-${selectedYear}-${branchName.replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
    
    return filename;
    
  } catch (error) {
    console.error('Error creating PDF file:', error);
    throw new Error(`Gagal membuat file PDF: ${error.message}`);
  }
};
