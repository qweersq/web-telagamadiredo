/**
 * Facebook Pixel Helper
 * Centralized FB Pixel tracking functions
 */

// Check if FB Pixel is loaded
const isFbPixelLoaded = () => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

// Safe FB Pixel wrapper
const trackEvent = (eventName, params = {}) => {
  if (isFbPixelLoaded()) {
    try {
      window.fbq('track', eventName, params);
      console.log(`✅ FB Pixel: ${eventName}`, params);
    } catch (error) {
      console.error('❌ FB Pixel Error:', error);
    }
  } else {
    console.warn('⚠️ FB Pixel not loaded');
  }
};

// FB Pixel Events
export const fbPixel = {
  // PageView (auto-tracked, but can be manually triggered)
  pageView: () => {
    trackEvent('PageView');
  },

  // View Content (user views specific content)
  viewContent: (contentName, contentCategory = '') => {
    trackEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory
    });
  },

  // Lead (user shows interest)
  lead: (contentName, value = 0) => {
    trackEvent('Lead', {
      content_name: contentName,
      value: value,
      currency: 'IDR'
    });
  },

  // App Download (user clicks Play Store / App Store download button)
  // Event standar 'Lead' + parameter platform/lokasi biar bisa difilter di Meta
  appDownload: (platform, location) => {
    trackEvent('Lead', {
      content_name: 'AppDownload',
      content_category: 'app_download',
      platform: platform, // 'android' | 'ios'
      cta_location: location // 'hero' | 'sticky' | 'trust_badges'
    });
  },

  // CTA Lead (user clicks "Mulai Gratis" / CTA menuju pricing)
  // Event standar 'Lead' — fase minat sebelum daftar/bayar
  ctaLead: (ctaName, location) => {
    trackEvent('Lead', {
      content_name: ctaName, // 'MulaiGratis'
      content_category: 'cta',
      cta_location: location // 'hero_section' | 'sticky_mobile_cta' | 'pricing_notafree' | 'cta_banner'
    });
  },

  // Add to Cart (user selects a plan)
  addToCart: (planName, planPrice) => {
    trackEvent('AddToCart', {
      content_name: planName,
      value: planPrice,
      currency: 'IDR',
      content_type: 'product'
    });
  },

  // Initiate Checkout (user enters order form)
  initiateCheckout: (planName, planPrice) => {
    trackEvent('InitiateCheckout', {
      content_name: planName,
      value: planPrice,
      currency: 'IDR',
      num_items: 1
    });
  },

  // Add Payment Info (user fills payment details)
  addPaymentInfo: (planName, planPrice) => {
    trackEvent('AddPaymentInfo', {
      content_name: planName,
      value: planPrice,
      currency: 'IDR'
    });
  },

  // Complete Registration (MAIN CONVERSION)
  completeRegistration: (planName, planPrice, email = '') => {
    trackEvent('CompleteRegistration', {
      content_name: planName,
      value: planPrice,
      currency: 'IDR',
      status: 'success'
    });
  },

  // Purchase (optional, can be used alongside CompleteRegistration)
  purchase: (planName, planPrice, orderId = '') => {
    trackEvent('Purchase', {
      content_name: planName,
      value: planPrice,
      currency: 'IDR',
      content_type: 'subscription',
      transaction_id: orderId
    });
  },

  // Custom Events
  customEvent: (eventName, params = {}) => {
    trackEvent(eventName, params);
  }
};

export default fbPixel;

