import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  formatDateTime,
  capitalize,
  snakeToTitleCase 
} from './labelFormatter';

// Color scheme
const colors = {
  primary: '#3B82F6',
  secondary: '#1E40AF', 
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  light: '#F8FAFC',
  dark: '#1E293B',
  gray: '#6B7280'
};

// Additional helper functions
const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

const formatServiceType = (type) => {
  if (!type) return '-';
  return snakeToTitleCase(type);
};

const formatDiscountType = (type) => {
  if (!type) return '-';
  const typeMap = {
    'percentage': 'Persentase',
    'nominal': 'Nominal',
    'fixed': 'Tetap'
  };
  return typeMap[type] || capitalize(type);
};

const formatDiscountValue = (discount) => {
  if (!discount) return '-';
  
  // If discount is an object with type and value
  if (typeof discount === 'object') {
    if (discount.type === 'percent' || discount.type === 'percentage') {
      return `${discount.discount || discount.value || 0}%`;
    } else if (discount.type === 'nominal' || discount.type === 'fixed') {
      return formatCurrency(discount.discount || discount.value || 0);
    }
  }
  
  // If discount is just a value, assume it's a number
  const numValue = parseFloat(discount);
  if (isNaN(numValue)) return String(discount);
  
  // Default to percentage if no type specified
  return `${numValue}%`;
};

/**
 * Create comprehensive operational report PDF
 */
export const createOperationalReportPDF = async (reportData, userProfile, selectedBranchData, selectedMonth, selectedYear, months) => {
  try {
    console.log('🔍 Creating operational report PDF...', { reportData, userProfile, selectedBranchData });

    // Initialize PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Get branch name
    const branchName = selectedBranchData?.name || 'Semua Cabang';

    // Header Section
    doc.setFillColor(colors.primary);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN OPERASIONAL', 20, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${userProfile?.tenant?.business_name || 'Nama Bisnis'} • ${branchName}`, 20, 22);
    
    doc.text(`${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 20, 28);

    yPosition = 40;

    // Summary Cards Section
    doc.setFillColor(colors.secondary);
    doc.rect(15, yPosition - 5, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN OPERASIONAL', 20, yPosition);
    
    yPosition += 15;

    // Summary data
    const summaryData = [
      ['Total Layanan', formatNumber(reportData.summary?.total_services || 0), 'Layanan tersedia'],
      ['Customer Aktif', formatNumber(reportData.summary?.total_customers || 0), 'Customer dalam periode'],
      ['Customer Baru', formatNumber(reportData.summary?.total_new_customers || 0), 'Customer baru'],
      ['Total Diskon', formatCurrency(reportData.summary?.total_discounts || 0), 'Diskon diberikan'],
      ['Item Dirawat', formatNumber(reportData.summary?.total_items || 0), 'Item yang dirawat'],
      ['Membership Aktif', formatNumber(reportData.summary?.total_memberships || 0), 'Member aktif']
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
        2: { cellWidth: 60 }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Top Services Section
    if (reportData.top_services && reportData.top_services.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LAYANAN TERBANYAK', 20, yPosition);
      
      yPosition += 15;

      const servicesData = reportData.top_services.slice(0, 10).map(service => [
        service.treatment_name,
        formatNumber(service.total_orders),
        formatCurrency(service.total_revenue),
        formatCurrency(service.avg_price)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Layanan', 'Jumlah Order', 'Total Revenue', 'Rata-rata Harga']],
        body: servicesData,
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
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Top Customers Section
    if (reportData.top_customers && reportData.top_customers.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER TERBANYAK', 20, yPosition);
      
      yPosition += 15;

      const customersData = reportData.top_customers.slice(0, 10).map(customer => [
        customer.customer_name,
        customer.phone,
        formatNumber(customer.total_orders),
        formatCurrency(customer.total_spent),
        formatDate(customer.last_order_date, { format: 'short' })
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Customer', 'No. Telepon', 'Total Order', 'Total Spent', 'Last Order']],
        body: customersData,
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
          1: { cellWidth: 35 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Discount Analysis Section
    if (reportData.discount_analysis && reportData.discount_analysis.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISA DISKON', 20, yPosition);
      
      yPosition += 15;

      const discountData = reportData.discount_analysis.map(discount => [
        discount.discount_name,
        formatDiscountType(discount.discount_type),
        formatDiscountValue({
          type: discount.discount_type,
          discount: discount.discount_value
        }),
        formatNumber(discount.usage_count),
        formatCurrency(discount.total_discount_given),
        formatCurrency(discount.avg_discount_per_order)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Nama Diskon', 'Tipe', 'Nilai', 'Penggunaan', 'Total Diskon', 'Rata-rata']],
        body: discountData,
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
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' },
          5: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Item Analysis Section
    if (reportData.item_analysis && reportData.item_analysis.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ITEM TERBANYAK', 20, yPosition);
      
      yPosition += 15;

      const itemData = reportData.item_analysis.slice(0, 10).map(item => [
        item.item_name,
        item.brand || '-',
        formatServiceType(item.type),
        capitalize(item.color) || '-',
        formatNumber(item.total_treatments),
        formatCurrency(item.total_revenue)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Brand', 'Tipe', 'Warna', 'Treatment', 'Revenue']],
        body: itemData,
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
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Membership Analysis Section
    if (reportData.membership_analysis && reportData.membership_analysis.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISA MEMBERSHIP', 20, yPosition);
      
      yPosition += 15;

      const membershipData = reportData.membership_analysis.map(membership => [
        membership.membership_name,
        formatCurrency(membership.membership_price),
        formatNumber(membership.total_members),
        formatNumber(membership.active_members),
        formatNumber(membership.expired_members),
        formatCurrency(membership.total_revenue)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Membership', 'Harga', 'Total Member', 'Aktif', 'Expired', 'Revenue']],
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
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Trends Summary Section
    if (reportData.trends && reportData.trends.length > 0) {
      doc.setFillColor(colors.secondary);
      doc.rect(15, yPosition - 5, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN TREND', 20, yPosition);
      
      yPosition += 15;

      // Calculate trend summary
      const totalOrders = reportData.trends.reduce((sum, trend) => sum + trend.daily_orders, 0);
      const totalRevenue = reportData.trends.reduce((sum, trend) => sum + trend.daily_revenue, 0);
      const avgDailyOrders = totalOrders / reportData.trends.length;
      const avgDailyRevenue = totalRevenue / reportData.trends.length;

      const trendData = [
        ['Total Order (Periode)', formatNumber(totalOrders), 'Semua order dalam periode'],
        ['Total Revenue (Periode)', formatCurrency(totalRevenue), 'Total pendapatan'],
        ['Rata-rata Order/Hari', formatNumber(avgDailyOrders.toFixed(1)), 'Order per hari'],
        ['Rata-rata Revenue/Hari', formatCurrency(avgDailyRevenue), 'Revenue per hari']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Jumlah', 'Keterangan']],
        body: trendData,
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
          2: { cellWidth: 60 }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setFillColor(colors.light);
    doc.rect(0, footerY - 10, pageWidth, 10, 'F');
    
    doc.setTextColor(colors.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Laporan dibuat pada: ${formatDateTime(new Date())}`, 20, footerY - 3);
    doc.text(`Periode: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, pageWidth - 60, footerY - 3);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const branchSuffix = selectedBranchData?.name ? 
      `_${selectedBranchData.name.replace(/\s+/g, '_')}` : 
      '_Semua_Cabang';
    const filename = `Laporan_Operasional_${months.find(m => m.value === selectedMonth)?.label}_${selectedYear}${branchSuffix}_${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);
    
    console.log(`✅ Operational report PDF generated: ${filename}`);
    return filename;

  } catch (error) {
    console.error('❌ Error creating operational report PDF:', error);
    throw new Error(`Failed to create operational report PDF: ${error.message}`);
  }
};
