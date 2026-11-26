// Excel Formatter untuk Laporan Keuangan
// Modern, minimalist, dan professional

// Import xlsx di level module
import * as XLSX from 'xlsx';

export const createFinancialReportExcel = (reportData, userProfile, selectedBranch, selectedMonth, selectedYear, months) => {
  try {
    const { utils, writeFile } = XLSX;
  
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

  // Data untuk Excel dengan struktur yang lebih terorganisir
  const excelData = [
    // Header Section
    ['LAPORAN KEUANGAN BULANAN'],
    [''],
    ['Nama Bisnis', userProfile?.tenant?.business_name || 'Nama Bisnis'],
    ['Cabang', branchName],
    ['Periode', `${monthName} ${selectedYear}`],
    ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')],
    [''],
    
    // Summary Section
    ['RINGKASAN KEUANGAN'],
    [''],
    ['Item', 'Jumlah', 'Keterangan'],
    ['Total Pemasukan', formatCurrency(reportData.summary.total_income), `${reportData.summary.income_transactions} transaksi`],
    ['Total Pengeluaran', formatCurrency(reportData.summary.total_expense), `${reportData.summary.expense_transactions} transaksi`],
    ['Laba Bersih', formatCurrency(reportData.summary.net_balance), `${((reportData.summary.net_balance / reportData.summary.total_income) * 100).toFixed(1)}% dari pemasukan`],
    ['Total Transaksi', reportData.summary.transaction_count, 'Semua transaksi'],
    [''],
    
    // Income Breakdown
    ['PEMASUKAN PER KATEGORI'],
    [''],
    ['Kategori', 'Jumlah', 'Persentase', 'Transaksi'],
    ...reportData.category_breakdown
      .filter(cat => cat.category_type === 'credit')
      .map(cat => [
        cat.category_name,
        formatCurrency(cat.total_amount),
        `${cat.percentage.toFixed(1)}%`,
        cat.transaction_count
      ]),
    [''],
    
    // Expense Breakdown
    ['PENGELUARAN PER KATEGORI'],
    [''],
    ['Kategori', 'Jumlah', 'Persentase', 'Transaksi'],
    ...reportData.category_breakdown
      .filter(cat => cat.category_type === 'debit')
      .map(cat => [
        cat.category_name,
        formatCurrency(cat.total_amount),
        `${cat.percentage.toFixed(1)}%`,
        cat.transaction_count
      ]),
    [''],
    
    // Account Balances
    ['SALDO AKUN KEUANGAN'],
    [''],
    ['Nama Akun', 'Saldo Saat Ini', 'Saldo Awal', 'Perubahan', 'Transaksi'],
    ...reportData.account_balances.map(account => [
      account.account_name,
      formatCurrency(account.current_balance),
      formatCurrency(account.opening_balance),
      formatCurrency(account.monthly_change),
      account.transaction_count
    ]),
    [''],
    
    // Payment Methods
    ['METODE PEMBAYARAN'],
    [''],
    ['Metode', 'Jumlah', 'Persentase', 'Transaksi', 'Tipe'],
    ...reportData.payment_method_breakdown.map(method => [
      method.payment_method_name,
      formatCurrency(method.total_amount),
      `${method.percentage.toFixed(1)}%`,
      method.transaction_count,
      method.type
    ]),
    [''],
    
    // Top Transactions
    ['TRANSAKSI TERBESAR'],
    [''],
    ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Akun', 'Metode'],
    ...reportData.top_transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('id-ID'),
      transaction.description,
      transaction.category?.name || 'N/A',
      formatCurrency(transaction.final_amount),
      transaction.account?.name || 'N/A',
      transaction.payment_method?.name || 'N/A'
    ]),
    [''],
    
    // Footer
    [''],
    ['Laporan dibuat oleh sistem NotaSepatu'],
    [`Dibuat pada: ${new Date().toLocaleString('id-ID')}`],
    [''],
    ['Catatan:'],
    ['• Laporan ini dibuat berdasarkan data transaksi keuangan yang tercatat dalam sistem'],
    ['• Semua nominal dalam Rupiah (IDR)'],
    ['• Data diambil dari periode yang dipilih'],
    ['• Jika ada pertanyaan, hubungi admin NotaSepatu']
  ];

  // Create workbook dengan styling yang lebih baik
  const ws = utils.aoa_to_sheet(excelData);
  const wb = utils.book_new();
  
  // Set column widths untuk tampilan yang lebih baik
  const colWidths = [
    { wch: 30 }, // Kolom 1 - Nama/Kategori/Deskripsi
    { wch: 20 }, // Kolom 2 - Jumlah
    { wch: 15 }, // Kolom 3 - Persentase/Keterangan
    { wch: 10 }, // Kolom 4 - Transaksi
    { wch: 20 }, // Kolom 5 - Akun
    { wch: 15 }  // Kolom 6 - Metode
  ];
  ws['!cols'] = colWidths;
  
  // Add styling untuk header dan section titles
  const range = utils.decode_range(ws['!ref']);
  
  // Style untuk header utama
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2E7D32" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Style untuk section headers
  const sectionHeaders = ['RINGKASAN KEUANGAN', 'PEMASUKAN PER KATEGORI', 'PENGELUARAN PER KATEGORI', 'SALDO AKUN KEUANGAN', 'METODE PEMBAYARAN', 'TRANSAKSI TERBESAR'];
  
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = utils.encode_cell({ r: row, c: col });
      const cell = ws[cellAddress];
      
      if (cell && cell.v) {
        const cellValue = cell.v.toString();
        
        // Style untuk section headers
        if (sectionHeaders.includes(cellValue)) {
          cell.s = {
            font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1976D2" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
        }
        
        // Style untuk table headers (baris dengan Kategori, Jumlah, dll)
        else if (cellValue.includes('Kategori') || cellValue.includes('Jumlah') || cellValue.includes('Persentase') || 
                 cellValue.includes('Transaksi') || cellValue.includes('Nama Akun') || cellValue.includes('Metode') ||
                 cellValue.includes('Tanggal') || cellValue.includes('Deskripsi') || cellValue.includes('Item')) {
          cell.s = {
            font: { bold: true, size: 10 },
            fill: { fgColor: { rgb: "E3F2FD" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
        
        // Style untuk data rows
        else if (row > 0 && cellValue && !cellValue.includes('Laporan') && !cellValue.includes('Dibuat') && !cellValue.includes('Catatan') && !cellValue.includes('•')) {
          cell.s = {
            font: { size: 10 },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
          
          // Style khusus untuk kolom jumlah (currency)
          if (col === 1 && cellValue.includes('Rp')) {
            cell.s.alignment = { horizontal: "right", vertical: "center" };
            cell.s.font = { size: 10, color: { rgb: "2E7D32" } };
          }
        }
      }
    }
  }
  
  // Add worksheet ke workbook
  utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
  
  // Generate filename
  const filename = `Laporan-Keuangan-${monthName}-${selectedYear}-${branchName.replace(/\s+/g, '-')}.xlsx`;
  
  // Download file
  writeFile(wb, filename);
  
  return filename;
    
  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw new Error(`Gagal membuat file Excel: ${error.message}`);
  }
};

// Alternative function untuk styling yang lebih advanced (jika dibutuhkan)
export const createAdvancedFinancialReportExcel = (reportData, userProfile, selectedBranch, selectedMonth, selectedYear, months, XLSX) => {
  const { utils, writeFile } = XLSX;
  
  const branchName = selectedBranch ? selectedBranch.name : 'Semua Cabang';
  const monthName = months.find(m => m.value === selectedMonth)?.label;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Data dengan struktur yang lebih terorganisir
  const excelData = [
    // Header
    ['LAPORAN KEUANGAN BULANAN'],
    [''],
    ['Nama Bisnis', userProfile?.tenant?.business_name || 'Nama Bisnis'],
    ['Cabang', branchName],
    ['Periode', `${monthName} ${selectedYear}`],
    ['Tanggal Laporan', new Date().toLocaleDateString('id-ID')],
    [''],
    
    // Financial Summary Table
    ['RINGKASAN KEUANGAN'],
    [''],
    ['Item', 'Jumlah', 'Keterangan'],
    ['Total Pemasukan', formatCurrency(reportData.summary.total_income), `${reportData.summary.income_transactions} transaksi`],
    ['Total Pengeluaran', formatCurrency(reportData.summary.total_expense), `${reportData.summary.expense_transactions} transaksi`],
    ['Laba Bersih', formatCurrency(reportData.summary.net_balance), `${((reportData.summary.net_balance / reportData.summary.total_income) * 100).toFixed(1)}% dari pemasukan`],
    ['Total Transaksi', reportData.summary.transaction_count, 'Semua transaksi'],
    [''],
    
    // Income Breakdown Table
    ['PEMASUKAN PER KATEGORI'],
    [''],
    ['Kategori', 'Jumlah', 'Persentase', 'Transaksi'],
    ...reportData.category_breakdown
      .filter(cat => cat.category_type === 'credit')
      .map(cat => [
        cat.category_name,
        formatCurrency(cat.total_amount),
        `${cat.percentage.toFixed(1)}%`,
        cat.transaction_count
      ]),
    [''],
    
    // Expense Breakdown Table
    ['PENGELUARAN PER KATEGORI'],
    [''],
    ['Kategori', 'Jumlah', 'Persentase', 'Transaksi'],
    ...reportData.category_breakdown
      .filter(cat => cat.category_type === 'debit')
      .map(cat => [
        cat.category_name,
        formatCurrency(cat.total_amount),
        `${cat.percentage.toFixed(1)}%`,
        cat.transaction_count
      ]),
    [''],
    
    // Account Balances Table
    ['SALDO AKUN KEUANGAN'],
    [''],
    ['Nama Akun', 'Saldo Saat Ini', 'Saldo Awal', 'Perubahan', 'Transaksi'],
    ...reportData.account_balances.map(account => [
      account.account_name,
      formatCurrency(account.current_balance),
      formatCurrency(account.opening_balance),
      formatCurrency(account.monthly_change),
      account.transaction_count
    ]),
    [''],
    
    // Payment Methods Table
    ['METODE PEMBAYARAN'],
    [''],
    ['Metode', 'Jumlah', 'Persentase', 'Transaksi', 'Tipe'],
    ...reportData.payment_method_breakdown.map(method => [
      method.payment_method_name,
      formatCurrency(method.total_amount),
      `${method.percentage.toFixed(1)}%`,
      method.transaction_count,
      method.type
    ]),
    [''],
    
    // Top Transactions Table
    ['TRANSAKSI TERBESAR'],
    [''],
    ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Akun', 'Metode'],
    ...reportData.top_transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString('id-ID'),
      transaction.description,
      transaction.category?.name || 'N/A',
      formatCurrency(transaction.final_amount),
      transaction.account?.name || 'N/A',
      transaction.payment_method?.name || 'N/A'
    ]),
    [''],
    
    // Footer
    [''],
    ['Laporan dibuat oleh sistem NotaSepatu'],
    [`Dibuat pada: ${new Date().toLocaleString('id-ID')}`],
    [''],
    ['Catatan:'],
    ['• Laporan ini dibuat berdasarkan data transaksi keuangan yang tercatat dalam sistem'],
    ['• Semua nominal dalam Rupiah (IDR)'],
    ['• Data diambil dari periode yang dipilih'],
    ['• Jika ada pertanyaan, hubungi admin NotaSepatu']
  ];

  // Create workbook
  const ws = utils.aoa_to_sheet(excelData);
  const wb = utils.book_new();
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // Kolom 1 - Nama/Kategori/Deskripsi
    { wch: 20 }, // Kolom 2 - Jumlah
    { wch: 15 }, // Kolom 3 - Persentase/Keterangan
    { wch: 10 }, // Kolom 4 - Transaksi
    { wch: 20 }, // Kolom 5 - Akun
    { wch: 15 }  // Kolom 6 - Metode
  ];
  ws['!cols'] = colWidths;
  
  utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
  
  const filename = `Laporan-Keuangan-${monthName}-${selectedYear}-${branchName.replace(/\s+/g, '-')}.xlsx`;
  writeFile(wb, filename);
  
  return filename;
};
