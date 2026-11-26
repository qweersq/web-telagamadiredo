/**
 * Label Formatter Utility
 * Centralized formatting functions for consistent display across the application
 */

// ============================================================================
// PAYMENT METHOD FORMATTERS
// ============================================================================

/**
 * Format payment method from database value to display label
 * @param {string} method - Payment method from database (cash, qris, bank_transfer)
 * @returns {string} - Formatted display label
 */
export const formatPaymentMethod = (method) => {
  if (!method) return 'Tidak Diketahui';
  
  const methodMap = {
    'cash': 'Tunai',
    'qris': 'QRIS',
    'bank_transfer': 'Transfer Bank',
    'transfer': 'Transfer Bank',
    'bank': 'Transfer Bank'
  };
  
  return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
};

/**
 * Get payment method icon component name
 * @param {string} method - Payment method
 * @returns {string} - Icon component name
 */
export const getPaymentMethodIcon = (method) => {
  if (!method) return 'DollarSign';
  
  const iconMap = {
    'cash': 'DollarSign',
    'qris': 'QrCode',
    'bank_transfer': 'CreditCard',
    'transfer': 'CreditCard',
    'bank': 'CreditCard'
  };
  
  return iconMap[method.toLowerCase()] || 'DollarSign';
};

/**
 * Get payment method color scheme
 * @param {string} method - Payment method
 * @returns {object} - Color scheme object
 */
export const getPaymentMethodColors = (method) => {
  if (!method) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  
  const colorMap = {
    'cash': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'qris': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'bank_transfer': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'transfer': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'bank': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' }
  };
  
  return colorMap[method.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
};

// ============================================================================
// PAYMENT STATUS FORMATTERS
// ============================================================================

/**
 * Format payment status from database value to display label
 * @param {string} status - Payment status from database (paid, unpaid, dp, cancelled)
 * @returns {string} - Formatted display label
 */
export const formatPaymentStatus = (status) => {
  if (!status) return 'Tidak Diketahui';
  
  const statusMap = {
    'paid': 'Lunas',
    'unpaid': 'Belum Bayar',
    'dp': 'Bayar Sebagian',
    'cancelled': 'Dibatalkan'
  };
  
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get payment status color scheme
 * @param {string} status - Payment status
 * @returns {string} - CSS classes for styling
 */
export const getPaymentStatusColors = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  const colorMap = {
    'paid': 'bg-green-100 text-green-700 border-green-300',
    'unpaid': 'bg-red-100 text-red-700 border-red-300',
    'dp': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'cancelled': 'bg-gray-100 text-gray-500 border-gray-300'
  };
  
  return colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
};

/**
 * Calculate payment status based on amounts
 * @param {number} paidAmount - Amount already paid
 * @param {number} totalAmount - Total amount required
 * @returns {string} - Payment status
 */
export const calculatePaymentStatus = (paidAmount = 0, totalAmount = 0) => {
  // Jika total amount = 0 (free service), otomatis lunas
  if (totalAmount === 0) return 'paid';
  if (paidAmount === 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'dp';
};

// ============================================================================
// ORDER DETAIL STATUS FORMATTERS
// ============================================================================

/**
 * Format order detail status from database value to display label
 * @param {string} status - Order detail status from database
 * @returns {string} - Formatted display label
 */
export const formatOrderDetailStatus = (status) => {
  if (!status) return 'Tidak Diketahui';
  
  const statusMap = {
    'not_yet': 'Menunggu',
    'antrian': 'Antrian Kerja',
    'on_progress': 'Sedang Dikerjakan',
    'pengeringan': 'Sedang Dikeringkan',
    'siap': 'Siap Diambil',
    'siap_diambil': 'Siap Diambil',
    'siap_dikirim': 'Siap Dikirim',
    'done': 'Selesai',
    'selesai': 'Selesai',
    'cancelled': 'Dibatalkan',
    'not_ready': 'Tidak Lolos QC'
  };
  
  // ✅ Use snakeToTitleCase for fallback to handle underscores properly
  return statusMap[status.toLowerCase()] || snakeToTitleCase(status);
};

/**
 * Get order detail status color scheme
 * @param {string} status - Order detail status
 * @returns {string} - CSS classes for styling
 */
export const getOrderDetailStatusColors = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  const colorMap = {
    'not_yet': 'bg-gray-200 text-gray-700 border-gray-400',
    'antrian': 'bg-blue-100 text-blue-700 border-blue-300',
    'on_progress': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'pengeringan': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'siap': 'bg-indigo-100 text-indigo-700 border-indigo-300',
    'siap_diambil': 'bg-purple-100 text-purple-700 border-purple-300',
    'siap_dikirim': 'bg-purple-100 text-purple-700 border-purple-300',
    'done': 'bg-green-100 text-green-700 border-green-300',
    'selesai': 'bg-green-100 text-green-700 border-green-300',
    'cancelled': 'bg-gray-300 text-gray-500 border-gray-400',
    'not_ready': 'bg-red-100 text-red-700 border-red-300'
  };
  
  return colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
};

/**
 * Get order detail status icon
 * @param {string} status - Order detail status
 * @returns {string} - Icon component name
 */
export const getOrderDetailStatusIcon = (status) => {
  if (!status) return 'Clock';
  
  const iconMap = {
    'not_yet': 'Clock',
    'antrian': 'Users',
    'on_progress': 'Settings',
    'pengeringan': 'Wind',
    'siap': 'CheckCircle',
    'siap_diambil': 'Package',
    'siap_dikirim': 'Truck',
    'done': 'CheckCircle',
    'selesai': 'CheckCircle',
    'cancelled': 'XCircle',
    'not_ready': 'AlertCircle'
  };
  
  return iconMap[status.toLowerCase()] || 'Clock';
};

// ============================================================================
// ORDER TYPE FORMATTERS
// ============================================================================

/**
 * Format order type from database value to display label
 * @param {string} orderType - Order type from database (online, offline)
 * @returns {string} - Formatted display label
 */
export const formatOrderType = (orderType) => {
  if (!orderType) return 'Tidak Diketahui';
  
  const typeMap = {
    'dine-in': 'Dine-in',
    'dinein': 'Dine-in',
    'dine_in': 'Dine-in',
    'takeaway': 'Bawa Pulang',
    'take-away': 'Bawa Pulang',
    'take_away': 'Bawa Pulang',
    'mixed': 'Campuran (Dine-in + Bawa Pulang)',
    'online': 'Pickup Service',
    'offline': 'Datang ke Toko'
  };
  
  return typeMap[orderType.toLowerCase()] || orderType.charAt(0).toUpperCase() + orderType.slice(1);
};

// ============================================================================
// DELIVERY STATUS FORMATTERS
// ============================================================================

/**
 * Format delivery status from database value to display label
 * @param {string} status - Delivery status from database
 * @returns {string} - Formatted display label
 */
export const formatDeliveryStatus = (status) => {
  if (!status) return 'Tidak Diketahui';
  
  const statusMap = {
    'not_yet': 'Belum Dikirim',
    'scheduled': 'Terjadwal',
    'on_the_way': 'Dalam Perjalanan',
    'delivered': 'Terkirim',
    'failed': 'Gagal Kirim'
  };
  
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get delivery status color scheme
 * @param {string} status - Delivery status
 * @returns {string} - CSS classes for styling
 */
export const getDeliveryStatusColors = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  const colorMap = {
    'not_yet': 'bg-gray-100 text-gray-700 border-gray-300',
    'scheduled': 'bg-blue-100 text-blue-700 border-blue-300',
    'on_the_way': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'delivered': 'bg-green-100 text-green-700 border-green-300',
    'failed': 'bg-red-100 text-red-700 border-red-300'
  };
  
  return colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
};

// ============================================================================
// PICKUP METHOD FORMATTERS
// ============================================================================

/**
 * Format pickup method from database value to display label
 * @param {string} method - Pickup method from database (pickup, delivery)
 * @returns {string} - Formatted display label
 */
export const formatPickupMethod = (method) => {
  if (!method) return 'Tidak Diketahui';
  
  const methodMap = {
    'pickup': 'Ambil Sendiri',
    'delivery': 'Antar ke Rumah'
  };
  
  return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
};

// ============================================================================
// CURRENCY FORMATTERS
// ============================================================================

/**
 * Format currency to Indonesian Rupiah
 * @param {number|string} amount - Amount to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;
  
  if (!amount && amount !== 0) return showSymbol ? 'Rp 0' : '0';
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
  
  return showSymbol ? formatted : formatted.replace('Rp', '').trim();
};

/**
 * Format number with thousand separators
 * @param {number|string} number - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  return new Intl.NumberFormat('id-ID').format(number);
};

// ============================================================================
// DATE FORMATTERS
// ============================================================================

/**
 * Format date to Indonesian format
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  const {
    includeTime = false,
    format = 'short' // short, long, full
  } = options;
  
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (includeTime) {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    const formatOptions = {
      short: { day: '2-digit', month: 'short', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
    };
    
    return date.toLocaleDateString('id-ID', formatOptions[format]);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format date time to Indonesian format with time
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date time string
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, { includeTime: true });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert snake_case to Title Case
 * @param {string} str - Snake case string
 * @returns {string} - Title case string
 */
export const snakeToTitleCase = (str) => {
  if (!str) return '';
  return str.split('_').map(word => capitalize(word)).join(' ');
};

/**
 * Convert camelCase to Title Case
 * @param {string} str - Camel case string
 * @returns {string} - Title case string
 */
export const camelToTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
};

// ============================================================================
// DISCOUNT FORMATTERS
// ============================================================================

/**
 * Format discount display for UI
 * @param {object|string|number} discount - Discount object or value
 * @returns {string} - Formatted discount display
 */
export const formatDiscountDisplay = (discount) => {
  if (!discount) return '-';
  
  // If discount is an object
  if (typeof discount === 'object') {
    if (discount.name) return discount.name;
    if (discount.discount) {
      if (discount.type === 'nominal') {
        return formatCurrency(discount.discount);
      } else if (discount.type === 'percent' || discount.type === 'percentage') {
        return `${discount.discount}%`;
      }
    }
  }
  
  // If discount is a string or number
  return String(discount);
};

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

/**
 * Order detail status constants
 */
export const ORDER_DETAIL_STATUS = {
  NOT_YET: 'not_yet',
  ANTRIAN: 'antrian',
  ON_PROGRESS: 'on_progress',
  PENGERINGAN: 'pengeringan',
  SIAP: 'siap',
  SIAP_DIAMBIL: 'siap_diambil',
  SIAP_DIKIRIM: 'siap_dikirim',
  DONE: 'done',
  SELESAI: 'selesai',
  CANCELLED: 'cancelled',
  NOT_READY: 'not_ready'
};

/**
 * Payment status constants
 */
export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  DP: 'dp',
  CANCELLED: 'cancelled'
};

/**
 * Order type constants
 */
export const ORDER_TYPE = {
  DINE_IN: 'dine-in',
  TAKEAWAY: 'takeaway',
  // Hasil rollup backend: order berisi campuran item dine-in & bawa pulang
  MIXED: 'mixed',
  // Legacy (NotaSepatu) — masih dipakai halaman order lama
  ONLINE: 'online',
  OFFLINE: 'offline'
};

/**
 * Delivery status constants
 */
export const DELIVERY_STATUS = {
  NOT_YET: 'not_yet',
  SCHEDULED: 'scheduled',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

// ============================================================================
// DATE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format for input fields
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * Get today's date and time in YYYY-MM-DDTHH:MM format for input fields
 * @returns {string} - Today's date and time in YYYY-MM-DDTHH:MM format
 */
export const getTodayDateTimeString = () => {
  return new Date().toISOString().slice(0, 16);
};

/**
 * Convert date to input field format (YYYY-MM-DD)
 * @param {string|Date} date - Date to convert
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const toInputDateString = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};

/**
 * Convert date to input datetime field format (YYYY-MM-DDTHH:MM)
 * @param {string|Date} date - Date to convert
 * @returns {string} - Date in YYYY-MM-DDTHH:MM format
 */
export const toInputDateTimeString = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 16);
};

/**
 * Check if date is in the past (before today)
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isDateInPast = (date) => {
  if (!date) return false;
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkDate < today;
};

/**
 * Check if date is today or in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today or in the future
 */
export const isDateTodayOrFuture = (date) => {
  return !isDateInPast(date);
};

// ============================================================================
// STATUS CHECK FUNCTIONS
// ============================================================================

/**
 * Check if order detail status is editable
 * @param {string} status - Order detail status
 * @returns {boolean} - True if status is editable
 */
export const isOrderDetailStatusEditable = (status) => {
  const editableStatuses = [
    ORDER_DETAIL_STATUS.NOT_YET,
    ORDER_DETAIL_STATUS.ANTRIAN,
    ORDER_DETAIL_STATUS.ON_PROGRESS,
    ORDER_DETAIL_STATUS.PENGERINGAN,
    ORDER_DETAIL_STATUS.SIAP,
    ORDER_DETAIL_STATUS.SIAP_DIAMBIL,
    ORDER_DETAIL_STATUS.SIAP_DIKIRIM
  ];
  return editableStatuses.includes(status);
};

/**
 * Check if order detail status is removable
 * @param {string} status - Order detail status
 * @returns {boolean} - True if status is removable
 */
export const isOrderDetailStatusRemovable = (status) => {
  const removableStatuses = [
    ORDER_DETAIL_STATUS.NOT_YET,
    ORDER_DETAIL_STATUS.ANTRIAN,
    ORDER_DETAIL_STATUS.ON_PROGRESS,
    ORDER_DETAIL_STATUS.PENGERINGAN,
    ORDER_DETAIL_STATUS.SIAP,
    ORDER_DETAIL_STATUS.SIAP_DIAMBIL,
    ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
    ORDER_DETAIL_STATUS.CANCELLED
  ];
  return removableStatuses.includes(status);
};

/**
 * Check if payment status allows editing
 * @param {string} status - Payment status
 * @returns {boolean} - True if payment status allows editing
 */
export const isPaymentStatusEditable = (status) => {
  const editableStatuses = [
    PAYMENT_STATUS.UNPAID,
    PAYMENT_STATUS.DP
  ];
  return editableStatuses.includes(status);
};

// ============================================================================
// MEMBERSHIP FORMATTERS
// ============================================================================

/**
 * Generate consistent color scheme based on membership name
 * @param {string} membershipName - Membership name
 * @returns {string} - CSS classes for styling
 */
export const getMembershipBadgeColor = (membershipName) => {
  if (!membershipName) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  // Predefined colors for common membership types
  const predefinedColors = {
    'lite': 'bg-gray-100 text-gray-800 border-gray-200',
    'basic': 'bg-gray-100 text-gray-800 border-gray-200',
    'standard': 'bg-gray-100 text-gray-800 border-gray-200',
    'premium': 'bg-blue-100 text-blue-800 border-blue-200',
    'vip': 'bg-purple-100 text-purple-800 border-purple-200',
    'platinum': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'gold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'silver': 'bg-gray-100 text-gray-800 border-gray-200',
    'bronze': 'bg-orange-100 text-orange-800 border-orange-200',
    'diamond': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'elite': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'pro': 'bg-green-100 text-green-800 border-green-200',
    'plus': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'max': 'bg-red-100 text-red-800 border-red-200',
    'ultimate': 'bg-pink-100 text-pink-800 border-pink-200'
  };
  
  // Check if membership name matches predefined colors
  const lowerName = membershipName.toLowerCase();
  if (predefinedColors[lowerName]) {
    return predefinedColors[lowerName];
  }
  
  // Generate color based on first letter if not predefined
  return getMembershipColorByFirstLetter(membershipName);
};

/**
 * Generate color scheme based on first letter of membership name
 * @param {string} membershipName - Membership name
 * @returns {string} - CSS classes for styling
 */
export const getMembershipColorByFirstLetter = (membershipName) => {
  if (!membershipName) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  const firstLetter = membershipName.charAt(0).toLowerCase();
  
  const colorMap = {
    'a': 'bg-red-100 text-red-800 border-red-200',
    'b': 'bg-blue-100 text-blue-800 border-blue-200',
    'c': 'bg-green-100 text-green-800 border-green-200',
    'd': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'e': 'bg-purple-100 text-purple-800 border-purple-200',
    'f': 'bg-pink-100 text-pink-800 border-pink-200',
    'g': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'h': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'i': 'bg-orange-100 text-orange-800 border-orange-200',
    'j': 'bg-teal-100 text-teal-800 border-teal-200',
    'k': 'bg-lime-100 text-lime-800 border-lime-200',
    'l': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'm': 'bg-rose-100 text-rose-800 border-rose-200',
    'n': 'bg-violet-100 text-violet-800 border-violet-200',
    'o': 'bg-amber-100 text-amber-800 border-amber-200',
    'p': 'bg-sky-100 text-sky-800 border-sky-200',
    'q': 'bg-stone-100 text-stone-800 border-stone-200',
    'r': 'bg-slate-100 text-slate-800 border-slate-200',
    's': 'bg-zinc-100 text-zinc-800 border-zinc-200',
    't': 'bg-neutral-100 text-neutral-800 border-neutral-200',
    'u': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'v': 'bg-lime-100 text-lime-800 border-lime-200',
    'w': 'bg-blue-100 text-blue-800 border-blue-200',
    'x': 'bg-purple-100 text-purple-800 border-purple-200',
    'y': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'z': 'bg-green-100 text-green-800 border-green-200'
  };
  
  return colorMap[firstLetter] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Generate color scheme based on hash of membership name (more random distribution)
 * @param {string} membershipName - Membership name
 * @returns {string} - CSS classes for styling
 */
export const getMembershipColorByHash = (membershipName) => {
  if (!membershipName) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < membershipName.length; i++) {
    const char = membershipName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get consistent color
  const colorIndex = Math.abs(hash) % 12;
  
  const colors = [
    'bg-red-100 text-red-800 border-red-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-rose-100 text-rose-800 border-rose-200'
  ];
  
  return colors[colorIndex];
};

/**
 * Get membership icon (always Crown for consistency)
 * @param {string} membershipName - Membership name
 * @returns {string} - Icon component name
 */
export const getMembershipIcon = (membershipName) => {
  // Always return Crown icon for consistency across all memberships
  return 'Crown';
};

/**
 * Get membership icon component (for React components)
 * @param {string} membershipName - Membership name
 * @param {string} className - CSS classes for the icon
 * @returns {JSX.Element} - Crown icon component
 */
export const getMembershipIconComponent = (membershipName, className = 'w-3 h-3') => {
  // This would need to be imported in the component that uses it
  // For now, return the icon name that should be imported
  return 'Crown';
};

/**
 * Format membership display name
 * @param {string} membershipName - Membership name
 * @returns {string} - Formatted membership name
 */
export const formatMembershipName = (membershipName) => {
  if (!membershipName) return 'Tidak Diketahui';
  
  // Capitalize first letter and keep the rest as is
  return membershipName.charAt(0).toUpperCase() + membershipName.slice(1);
};

/**
 * Get membership discount display
 * @param {number} discountPercentage - Discount percentage
 * @returns {string} - Formatted discount display
 */
export const getMembershipDiscountDisplay = (discountPercentage) => {
  if (!discountPercentage && discountPercentage !== 0) return '';
  
  // Convert to number and format to remove unnecessary decimals
  const num = parseFloat(discountPercentage);
  if (isNaN(num)) return '';
  
  // If it's a whole number, show without decimals
  if (num % 1 === 0) {
    return `${num}% diskon`;
  }
  
  // If it has decimals, show with 1 decimal place max
  return `${num.toFixed(1)}% diskon`;
};

// ============================================================================
// WA TEMPLATE FORMATTERS
// ============================================================================

/**
 * Format WA template category from database value to display label
 * @param {string} category - Template category from database (followup, promotion, notification, reminder)
 * @returns {string} - Formatted display label
 */
export const formatWATemplateCategory = (category) => {
  if (!category) return 'Tidak Diketahui';
  
  const categoryMap = {
    'followup': 'Follow-up',
    'promotion': 'Promosi',
    'notification': 'Notifikasi',
    'reminder': 'Pengingat',
    'general': 'Umum'
  };
  
  return categoryMap[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Get WA template category color scheme
 * @param {string} category - Template category
 * @returns {string} - CSS classes for styling
 */
export const getWATemplateCategoryColors = (category) => {
  if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
  
  const colorMap = {
    'followup': 'bg-blue-100 text-blue-800 border-blue-200',
    'promotion': 'bg-pink-100 text-pink-800 border-pink-200',
    'notification': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'reminder': 'bg-green-100 text-green-800 border-green-200',
    'general': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get WA template category icon
 * @param {string} category - Template category
 * @returns {string} - Icon emoji
 */
export const getWATemplateCategoryIcon = (category) => {
  if (!category) return '📝';
  
  const iconMap = {
    'followup': '🔔',
    'promotion': '🎯',
    'notification': '📢',
    'reminder': '⏰',
    'general': '📝'
  };
  
  return iconMap[category.toLowerCase()] || '📝';
};

/**
 * Format WA template step display for sequence
 * @param {object} template - Template object with step info
 * @returns {object} - Formatted template display data
 */
export const formatWATemplateStepDisplay = (template) => {
  if (!template) return null;
  
  const {
    step_number = 1,
    delay_days = 7,
    template: templateData = null,
    send_time = '09:00'
  } = template;
  
  const templateTitle = templateData?.title || 'Belum dipilih';
  const category = templateData?.category || 'general';
  const variableCount = templateData?.variables?.length || 0;
  
  return {
    stepNumber: step_number,
    dayLabel: `Hari ${delay_days}`,
    templateTitle: templateTitle,
    timeLabel: send_time.substring(0, 5), // Remove seconds if present
    categoryIcon: getWATemplateCategoryIcon(category),
    categoryLabel: formatWATemplateCategory(category),
    categoryColors: getWATemplateCategoryColors(category),
    variableCount: variableCount,
    variableLabel: `${variableCount} vars`,
    isConfigured: Boolean(templateData)
  };
};

/**
 * Format WA template display for management list
 * @param {object} template - Template object
 * @returns {object} - Formatted template display data
 */
export const formatWATemplateDisplay = (template) => {
  if (!template) return null;
  
  const {
    id,
    name,
    title,
    category = 'general',
    description,
    template_content,
    variables = [],
    is_active = true,
    created_at
  } = template;
  
  const characterCount = template_content ? template_content.length : 0;
  const variableCount = variables.length;
  
  return {
    id,
    name,
    title,
    description: description || 'Tidak ada deskripsi',
    categoryIcon: getWATemplateCategoryIcon(category),
    categoryLabel: formatWATemplateCategory(category),
    categoryColors: getWATemplateCategoryColors(category),
    characterCount,
    characterLabel: `${characterCount} karakter`,
    variableCount,
    variableLabel: `${variableCount} variables`,
    variableList: variables.join(', ') || 'Tidak ada',
    isActive: is_active,
    createdDate: created_at ? formatDate(created_at) : '-'
  };
};

/**
 * Format WA template variables display
 * @param {array} variables - Array of variable strings
 * @returns {object} - Formatted variables data
 */
export const formatWATemplateVariables = (variables) => {
  if (!variables || !Array.isArray(variables)) {
    return {
      count: 0,
      label: '0 variables',
      list: 'Tidak ada',
      badges: []
    };
  }
  
  const count = variables.length;
  
  return {
    count,
    label: `${count} variable${count !== 1 ? 's' : ''}`,
    list: variables.join(', '),
    badges: variables.map(variable => ({
      text: variable,
      isRequired: ['customer_name', 'business_name', 'branch_name'].includes(variable),
      colors: ['customer_name', 'business_name', 'branch_name'].includes(variable) 
        ? 'bg-red-100 text-red-800' 
        : 'bg-blue-100 text-blue-800'
    }))
  };
};

/**
 * Format character count with color coding
 * @param {number} characterCount - Number of characters
 * @returns {object} - Formatted character count with colors
 */
export const formatWATemplateCharacterCount = (characterCount) => {
  if (!characterCount && characterCount !== 0) {
    return {
      count: 0,
      label: '0 karakter',
      colors: 'text-gray-500'
    };
  }
  
  const count = parseInt(characterCount);
  let colors = 'text-green-600';
  
  if (count > 1000) {
    colors = 'text-red-600'; // Too long
  } else if (count > 500) {
    colors = 'text-yellow-600'; // Getting long
  }
  
  return {
    count,
    label: `${count} karakter`,
    colors
  };
};

/**
 * WA Template category constants
 */
export const WA_TEMPLATE_CATEGORY = {
  FOLLOWUP: 'followup',
  PROMOTION: 'promotion',
  NOTIFICATION: 'notification',
  REMINDER: 'reminder',
  GENERAL: 'general'
};

// ============================================================================
// PRIORITY STATUS FORMATTERS
// ============================================================================

/**
 * Format priority status from database value to display label
 * @param {string} priority - Priority status from database (low, medium, high, critical, maximum)
 * @returns {string} - Formatted display label
 */
export const formatPriorityStatus = (priority) => {
  if (!priority) return 'Tidak Diketahui';
  
  const priorityMap = {
    'low': 'Rendah',
    'medium': 'Sedang',
    'high': 'Tinggi',
    'critical': 'Kritis',
    'maximum': 'Maksimal'
  };
  
  return priorityMap[priority.toLowerCase()] || priority.charAt(0).toUpperCase() + priority.slice(1);
};

/**
 * Get priority status color scheme
 * @param {string} priority - Priority status
 * @returns {string} - CSS classes for styling
 */
export const getPriorityStatusColors = (priority) => {
  if (!priority) return 'bg-gray-100 text-gray-700 border-gray-300';
  
  const colorMap = {
    'low': 'bg-green-100 text-green-700 border-green-300',
    'medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'high': 'bg-orange-100 text-orange-700 border-orange-300',
    'critical': 'bg-red-100 text-red-700 border-red-300',
    'maximum': 'bg-red-200 text-red-800 border-red-400'
  };
  
  return colorMap[priority.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
};

/**
 * Get priority status icon
 * @param {string} priority - Priority status
 * @returns {string} - Icon emoji
 */
export const getPriorityStatusIcon = (priority) => {
  if (!priority) return '❓';
  
  const iconMap = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'critical': '🔴',
    'maximum': '🚨'
  };
  
  return iconMap[priority.toLowerCase()] || '❓';
};

/**
 * Priority status constants
 */
export const PRIORITY_STATUS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  MAXIMUM: 'maximum'
};

// ============================================================================
// PHONE FORMATTERS
// ============================================================================

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  // If it's empty after cleaning, return original
  if (!cleaned) return phone;
  
  // If it starts with +62, format as +62 xxxx-xxxx-xxx
  if (cleaned.startsWith('+62')) {
    const digits = cleaned.substring(3);
    if (digits.length >= 4) {
      const formatted = digits.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
      return `+62 ${formatted}`;
    }
    return cleaned;
  }
  
  // If it starts with 62, format as +62 xxxx-xxxx-xxx
  if (cleaned.startsWith('62')) {
    const digits = cleaned.substring(2);
    if (digits.length >= 4) {
      const formatted = digits.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
      return `+62 ${formatted}`;
    }
    return `+${cleaned}`;
  }
  
  // If it's a local number (starts with 0), format as +62 xxxx-xxxx-xxx
  if (cleaned.startsWith('0')) {
    const digits = cleaned.substring(1);
    if (digits.length >= 4) {
      const formatted = digits.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
      return `+62 ${formatted}`;
    }
    return `+62 ${digits}`;
  }
  
  // For other formats, return as is
  return cleaned;
};

/**
 * Format phone number for WhatsApp link
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number for WhatsApp
 */
export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^0-9+]/g, '');
  
  // If it starts with +62, remove the + and return
  if (cleaned.startsWith('+62')) {
    return cleaned.substring(1);
  }
  
  // If it starts with 62, return as is
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  
  // If it starts with 0, replace with 62
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  
  // For other formats, assume it's already in the correct format
  return cleaned;
};

/**
 * Get phone number display with clickable WhatsApp link
 * @param {string} phone - Phone number
 * @param {string} message - Optional message for WhatsApp
 * @returns {object} - Phone display data
 */
export const getPhoneDisplayData = (phone, message = '') => {
  if (!phone) {
    return {
      display: '-',
      whatsappLink: '',
      isClickable: false
    };
  }
  
  const formatted = formatPhoneNumber(phone);
  const whatsappNumber = formatPhoneForWhatsApp(phone);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}` : '';
  
  return {
    display: formatted,
    whatsappLink,
    isClickable: Boolean(whatsappNumber)
  };
};

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

/**
 * Legacy function for payment status badge colors
 * @deprecated Use getPaymentStatusColors instead
 */
export const getPaymentStatusBadge = getPaymentStatusColors;

/**
 * Legacy function for order detail status label
 * @deprecated Use formatOrderDetailStatus instead
 */
export const getOrderDetailStatusLabel = formatOrderDetailStatus;

/**
 * Legacy function for status colors
 * @deprecated Use getOrderDetailStatusColors instead
 */
export const getStatusColor = getOrderDetailStatusColors;
