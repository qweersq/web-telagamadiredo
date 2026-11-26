// Billing-specific formatters for consistent data display

// Format currency with proper Indonesian Rupiah format
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
};

// Format status with proper styling and text
export const formatBillingStatus = (status) => {
  const statusMap = {
    'unpaid': {
      text: 'Unpaid',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      icon: '⏳'
    },
    'pending': {
      text: 'Pending',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      icon: '⏰'
    },
    'paid': {
      text: 'Paid',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      icon: '✅'
    },
    'failed': {
      text: 'Failed',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      icon: '❌'
    },
    'cancelled': {
      text: 'Cancelled',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      icon: '🚫'
    },
    'refunded': {
      text: 'Refunded',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      icon: '↩️'
    }
  };

  return statusMap[status] || {
    text: status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: '❓'
  };
};

// Format payment method
export const formatPaymentMethod = (method) => {
  if (!method) return 'N/A';
  
  const methodMap = {
    'manual_bank_transfer': 'Bank Transfer',
    'bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'e_wallet': 'E-Wallet',
    'qris': 'QRIS',
    'gopay': 'GoPay',
    'ovo': 'OVO',
    'dana': 'DANA',
    'shopeepay': 'ShopeePay',
    'linkaja': 'LinkAja',
    'bca_klik': 'BCA Klik',
    'mandiri_click': 'Mandiri Click',
    'bni_klik': 'BNI Klik',
    'bri_klik': 'BRI Klik',
    'cimb_clicks': 'CIMB Clicks',
    'permata_va': 'Permata VA',
    'bca_va': 'BCA VA',
    'mandiri_va': 'Mandiri VA',
    'bni_va': 'BNI VA',
    'bri_va': 'BRI VA',
    'other': 'Other'
  };

  // If exact match found, return it
  if (methodMap[method]) {
    return methodMap[method];
  }

  // If not found, format the method by replacing underscores with spaces and capitalizing
  return method
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format date with proper Indonesian format
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return new Intl.DateTimeFormat('id-ID', mergedOptions).format(new Date(date));
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format date for display (short format)
export const formatDateShort = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date for display (time only)
export const formatTime = (date) => {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format invoice number with proper styling
export const formatInvoiceNumber = (invoiceNumber) => {
  if (!invoiceNumber) return 'N/A';
  
  // Add spacing for better readability
  return invoiceNumber.replace(/(INV-\d+)-(\d+)-([A-Z0-9]+)/, '$1-$2-$3');
};

// Format phone number with Indonesian format
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.substring(1)}`;
  } else if (cleaned.length >= 10) {
    return `+62${cleaned}`;
  }
  
  return phone;
};

// Format business name with proper capitalization
export const formatBusinessName = (name) => {
  if (!name) return 'N/A';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format owner name with proper capitalization
export const formatOwnerName = (name) => {
  if (!name) return 'N/A';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format email with proper display
export const formatEmail = (email) => {
  if (!email) return 'N/A';
  
  return email.toLowerCase();
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '0%';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(decimals)}%`;
};

// Format number with thousand separators
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  
  const numValue = parseFloat(number);
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('id-ID').format(numValue);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Format duration in days
export const formatDuration = (days) => {
  if (!days) return '0 days';
  
  const numDays = parseInt(days);
  if (isNaN(numDays)) return '0 days';
  
  if (numDays === 1) return '1 day';
  if (numDays < 30) return `${numDays} days`;
  if (numDays < 365) {
    const months = Math.floor(numDays / 30);
    const remainingDays = numDays % 30;
    if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(numDays / 365);
  const remainingDays = numDays % 365;
  if (remainingDays === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
};

// Format subscription plan name
export const formatPlanName = (planName) => {
  if (!planName) return 'N/A';
  
  return planName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format bank name
export const formatBankName = (bankName) => {
  if (!bankName) return 'N/A';
  
  const bankMap = {
    'bca': 'BCA',
    'mandiri': 'Mandiri',
    'bni': 'BNI',
    'bri': 'BRI',
    'cimb': 'CIMB',
    'permata': 'Permata',
    'danamon': 'Danamon',
    'maybank': 'Maybank',
    'hsbc': 'HSBC',
    'citibank': 'Citibank'
  };
  
  const lowerBank = bankName.toLowerCase();
  return bankMap[lowerBank] || bankName.toUpperCase();
};

// Format account number with masking
export const formatAccountNumber = (accountNumber) => {
  if (!accountNumber) return 'N/A';
  
  const cleaned = accountNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return accountNumber;
  
  return `${cleaned.substring(0, 4)}****${cleaned.substring(cleaned.length - 4)}`;
};

// Format payment reference
export const formatPaymentReference = (reference) => {
  if (!reference) return 'N/A';
  
  // Add spacing for better readability
  return reference.replace(/(.{4})/g, '$1 ').trim();
};

// Format notes with proper line breaks
export const formatNotes = (notes) => {
  if (!notes) return 'N/A';
  
  return notes.replace(/\n/g, '<br>');
};

// Get status color classes for Tailwind
export const getStatusColorClasses = (status) => {
  const statusInfo = formatBillingStatus(status);
  return {
    text: statusInfo.color,
    bg: statusInfo.bgColor,
    border: statusInfo.borderColor,
    icon: statusInfo.icon
  };
};

// Format collection rate
export const formatCollectionRate = (rate) => {
  if (!rate && rate !== 0) return '0%';
  
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return '0%';
  
  return `${numRate.toFixed(1)}%`;
};

// Format growth rate
export const formatGrowthRate = (rate) => {
  if (!rate && rate !== 0) return '0%';
  
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return '0%';
  
  const sign = numRate >= 0 ? '+' : '';
  return `${sign}${numRate.toFixed(1)}%`;
};
