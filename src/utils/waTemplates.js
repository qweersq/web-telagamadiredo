/**
 * WhatsApp Message Templates
 * Centralized templates for different tenant conditions
 * Easy to modify and maintain
 */

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

/**
 * Generate WhatsApp message for unverified tenants
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateUnverifiedMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  
  return `Halo kak ${ownerName}, bisnis ${businessName} belum melakukan verifikasi email jadi belum bisa login. Mohon untuk klik link verifikasi di bawah ini ya kak agar kakak bisa login dan menggunakan sistem NotaSepatu.

Link verifikasi akan dikirim ke email: ${tenant.email}

Terima kasih kak! 🙏`;
};

/**
 * Generate WhatsApp message for active trial tenants
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateActiveTrialMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : 'tanggal yang akan ditentukan';
  
  return `Halo kak ${ownerName}, selamat! Bisnis ${businessName} sedang dalam masa trial gratis. 

Trial akan berakhir pada: ${trialEndDate}

Selama masa trial, kakak bisa menggunakan semua fitur NotaSepatu secara gratis. Jika ada pertanyaan atau butuh bantuan, jangan ragu untuk menghubungi kami ya kak!

Semoga bisnis ${businessName} semakin sukses! 🚀`;
};

/**
 * Generate WhatsApp message for last access trial tenants (trial ending soon)
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateLastAccessTrialMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  const trialEndDate = tenant.trial_end_date ? new Date(tenant.trial_end_date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : 'tanggal yang akan ditentukan';
  
  return `Halo kak ${ownerName}, masa trial bisnis ${businessName} akan segera berakhir pada ${trialEndDate}.

Untuk melanjutkan menggunakan NotaSepatu, kakak bisa berlangganan dengan harga yang sangat terjangkau. Kami punya paket yang sesuai dengan kebutuhan bisnis kakak.

Apakah kakak tertarik untuk berlangganan? Kami siap membantu prosesnya! 💪`;
};

/**
 * Generate WhatsApp message for expired trial tenants
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateExpiredTrialMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  
  return `Halo kak ${ownerName}, masa trial bisnis ${businessName} sudah berakhir.

Kami harap kakak puas dengan fitur-fitur NotaSepatu selama masa trial. Jika kakak ingin melanjutkan menggunakan sistem kami, kami punya penawaran khusus untuk kakak!

Dengan berlangganan, kakak akan mendapatkan:
✅ Akses penuh ke semua fitur
✅ Support 24/7
✅ Update fitur terbaru
✅ Backup data otomatis

Apakah kakak tertarik untuk berlangganan? 🤝`;
};

/**
 * Generate WhatsApp message for active subscription tenants
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateActiveSubscriptionMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  
  return `Halo kak ${ownerName}, terima kasih sudah berlangganan NotaSepatu untuk bisnis ${businessName}!

Kami harap kakak puas dengan layanan kami. Jika ada pertanyaan, butuh bantuan, atau ada saran untuk pengembangan fitur, jangan ragu untuk menghubungi kami ya kak.

Kami selalu siap membantu kesuksesan bisnis kakak! 💼✨`;
};

/**
 * Generate WhatsApp message for last access subscription tenants (subscription ending soon)
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateLastAccessSubscriptionMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  
  return `Halo kak ${ownerName}, langganan NotaSepatu untuk bisnis ${businessName} akan segera berakhir.

Untuk melanjutkan layanan, mohon untuk memperpanjang langganan ya kak. Kami punya beberapa pilihan paket yang bisa disesuaikan dengan kebutuhan bisnis kakak.

Jika ada kendala dalam pembayaran atau butuh bantuan, jangan ragu untuk menghubungi kami! 🤝`;
};

/**
 * Generate WhatsApp message for expired tenants
 * @param {object} tenant - Tenant data
 * @returns {string} - Formatted WhatsApp message
 */
export const generateExpiredTenantMessage = (tenant) => {
  const ownerName = tenant.owner_name || 'Kakak';
  const businessName = tenant.business_name || 'Bisnis';
  
  return `Halo kak ${ownerName}, kami melihat bahwa langganan NotaSepatu untuk bisnis ${businessName} sudah berakhir.

Kami harap kakak puas dengan layanan kami sebelumnya. Jika kakak ingin kembali menggunakan NotaSepatu, kami punya penawaran khusus untuk kakak!

Kami siap membantu kakak untuk melanjutkan perjalanan digitalisasi bisnis. Apakah kakak tertarik untuk berlangganan kembali? 🚀`;
};

// ============================================================================
// TEMPLATE SELECTOR
// ============================================================================

/**
 * Get appropriate WhatsApp message template based on tenant status
 * @param {object} tenant - Tenant data
 * @param {string} activeTab - Current active tab
 * @returns {string} - Formatted WhatsApp message
 */
export const getWhatsAppMessage = (tenant, activeTab) => {
  if (!tenant) return '';
  
  switch (activeTab) {
    case 'unverified':
      return generateUnverifiedMessage(tenant);
    
    case 'active_trial':
      return generateActiveTrialMessage(tenant);
    
    case 'last_access_trial':
      return generateLastAccessTrialMessage(tenant);
    
    case 'expired_trial':
      return generateExpiredTrialMessage(tenant);
    
    case 'active':
      return generateActiveSubscriptionMessage(tenant);
    
    case 'last_access_subscription':
      return generateLastAccessSubscriptionMessage(tenant);
    
    case 'expired_tenant':
      return generateExpiredTenantMessage(tenant);
    
    default:
      return generateActiveSubscriptionMessage(tenant);
  }
};

// ============================================================================
// WHATSAPP URL GENERATOR
// ============================================================================

/**
 * Generate WhatsApp URL with formatted message
 * @param {string} phoneNumber - Tenant phone number
 * @param {string} message - Message to send
 * @returns {string} - WhatsApp URL
 */
export const generateWhatsAppUrl = (phoneNumber, message) => {
  if (!phoneNumber || !message) return '';
  
  // Format phone number for WhatsApp
  let formattedPhone = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Remove +62 and replace with 62
  if (formattedPhone.startsWith('+62')) {
    formattedPhone = formattedPhone.substring(1);
  }
  
  // If starts with 0, replace with 62
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  }
  
  // If doesn't start with 62, add it
  if (!formattedPhone.startsWith('62')) {
    formattedPhone = '62' + formattedPhone;
  }
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Generate WhatsApp URL for tenant with appropriate message
 * @param {object} tenant - Tenant data
 * @param {string} activeTab - Current active tab
 * @returns {string} - WhatsApp URL
 */
export const getTenantWhatsAppUrl = (tenant, activeTab) => {
  if (!tenant || !tenant.phone) return '';
  
  const message = getWhatsAppMessage(tenant, activeTab);
  return generateWhatsAppUrl(tenant.phone, message);
};

// ============================================================================
// TEMPLATE CUSTOMIZATION
// ============================================================================

/**
 * Template configuration for easy customization
 */
export const TEMPLATE_CONFIG = {
  // Company information
  companyName: 'NotaSepatu',
  supportHours: '24/7',
  
  // Message customization
  greeting: 'Halo kak',
  closing: 'Terima kasih kak! 🙏',
  
  // Trial information
  trialDuration: '7 hari',
  trialFeatures: 'semua fitur NotaSepatu secara gratis',
  
  // Subscription benefits
  subscriptionBenefits: [
    'Akses penuh ke semua fitur',
    'Support 24/7',
    'Update fitur terbaru',
    'Backup data otomatis'
  ],
  
  // Contact information
  supportContact: 'Tim Support NotaSepatu',
  supportMessage: 'Jika ada pertanyaan atau butuh bantuan, jangan ragu untuk menghubungi kami ya kak!'
};

/**
 * Update template configuration
 * @param {object} newConfig - New configuration object
 */
export const updateTemplateConfig = (newConfig) => {
  Object.assign(TEMPLATE_CONFIG, newConfig);
};

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

/**
 * Validate if tenant data is sufficient for message generation
 * @param {object} tenant - Tenant data
 * @returns {object} - Validation result
 */
export const validateTenantData = (tenant) => {
  const errors = [];
  
  if (!tenant) {
    errors.push('Tenant data is required');
    return { isValid: false, errors };
  }
  
  if (!tenant.owner_name) {
    errors.push('Owner name is required');
  }
  
  if (!tenant.business_name) {
    errors.push('Business name is required');
  }
  
  if (!tenant.phone) {
    errors.push('Phone number is required for WhatsApp');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// TEMPLATE PREVIEW
// ============================================================================

/**
 * Get template preview for a specific tab
 * @param {string} activeTab - Active tab
 * @param {object} sampleTenant - Sample tenant data for preview
 * @returns {string} - Template preview
 */
export const getTemplatePreview = (activeTab, sampleTenant = null) => {
  const defaultTenant = {
    owner_name: 'John Doe',
    business_name: 'Toko Sepatu ABC',
    email: 'john@example.com',
    phone: '081234567890',
    trial_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const tenant = sampleTenant || defaultTenant;
  return getWhatsAppMessage(tenant, activeTab);
};
