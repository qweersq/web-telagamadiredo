/**
 * Google Analytics 4 Helper
 * Centralized GA4 tracking functions
 */

// Check if GA4 is loaded
const isGA4Loaded = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Safe GA4 wrapper
const trackEvent = (eventName, params = {}) => {
  if (isGA4Loaded()) {
    try {
      window.gtag('event', eventName, params);
      console.log(`✅ GA4: ${eventName}`, params);
    } catch (error) {
      console.error('❌ GA4 Error:', error);
    }
  } else {
    console.warn('⚠️ GA4 not loaded');
  }
};

// GA4 Events for Funnel Tracking
export const ga4 = {
  // Funnel Step 1: Landing Page View
  trackLandingPage: () => {
    trackEvent('view_landing_page', {
      page_title: 'Landing Page',
      page_location: window.location.href,
      funnel_step: 1
    });
  },

  // Funnel Step 2: Pricing Page View
  trackPricingPage: () => {
    trackEvent('view_pricing_page', {
      page_title: 'Pricing Page',
      page_location: window.location.href,
      funnel_step: 2
    });
  },

  // Funnel Step 3: Order Form View
  trackOrderForm: (planName = '', planPrice = 0) => {
    trackEvent('begin_checkout', {
      page_title: 'Order Form',
      page_location: window.location.href,
      funnel_step: 3,
      items: [{
        item_name: planName,
        price: planPrice
      }]
    });
  },

  // Funnel Step 4: Registration Success (CONVERSION)
  trackRegistration: (planName = '', planPrice = 0, email = '') => {
    trackEvent('sign_up', {
      method: 'email',
      plan_name: planName,
      value: planPrice,
      currency: 'IDR',
      funnel_step: 4
    });
    
    // Also track as conversion
    trackEvent('conversion', {
      send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Update jika pakai Google Ads
      value: planPrice,
      currency: 'IDR',
      transaction_id: Date.now()
    });
  },

  // Additional: Track CTA clicks
  trackCTAClick: (ctaName, ctaLocation) => {
    trackEvent('cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation
    });
  },

  // Additional: Track app download button clicks (Play Store / App Store)
  trackAppDownload: (platform, location) => {
    trackEvent('app_download', {
      platform: platform, // 'android' | 'ios'
      cta_location: location // 'hero' | 'sticky' | 'trust_badges'
    });
  },

  // Additional: Track scroll depth
  trackScrollDepth: (percentage, page) => {
    trackEvent('scroll', {
      percent_scrolled: percentage,
      page_name: page
    });
  },

  // Additional: Track form start
  trackFormStart: (formName) => {
    trackEvent('form_start', {
      form_name: formName
    });
  },

  // Additional: Track form field completion
  trackFormProgress: (formName, completionRate) => {
    trackEvent('form_progress', {
      form_name: formName,
      completion_rate: completionRate
    });
  }
};

export default ga4;

