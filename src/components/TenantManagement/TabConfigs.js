// Tab Configuration untuk Tenant Management
export const TAB_CONFIGS = {
  unverified: {
    id: 'unverified',
    label: 'Belum Verifikasi',
    color: 'red',
    description: 'Tenant yang belum klik link verifikasi',
    priority: 'verification',
    columns: ['business', 'owner', 'contact', 'registration', 'verification'],
    actions: ['view'],
    apiEndpoint: 'getUnverifiedTenants'
  },
  active_trial: {
    id: 'active_trial',
    label: 'Active Trial',
    color: 'yellow',
    description: 'Tenant trial yang sudah aktif',
    priority: 'conversion',
    columns: ['business', 'owner', 'contact', 'trialStart', 'trialEnd', 'daysRemaining'],
    actions: ['view'],
    apiEndpoint: 'getActiveTrialTenants'
  },
  last_access_trial: {
    id: 'last_access_trial',
    label: 'Last Access Trial',
    color: 'orange',
    description: 'Tenant trial yang hari ini terakhir akses',
    priority: 'urgent',
    columns: ['business', 'owner', 'contact', 'trialEnd', 'lastLogin', 'trialUsage'],
    actions: ['view'],
    apiEndpoint: 'getLastAccessTrialTenants'
  },
  expired_trial: {
    id: 'expired_trial',
    label: 'Expired Trial',
    color: 'orange',
    description: 'Tenant trial yang sudah expired',
    priority: 'recovery',
    columns: ['business', 'owner', 'contact', 'trialEnd', 'daysSinceExpired'],
    actions: ['view'],
    apiEndpoint: 'getExpiredTrialTenants'
  },
  active: {
    id: 'active',
    label: 'Active',
    color: 'green',
    description: 'Tenant aktif berbayar',
    priority: 'management',
    columns: ['business', 'owner', 'contact', 'subscriptionPlan', 'subscriptionStart', 'subscriptionEnd', 'renewalDate', 'paymentStatus'],
    actions: ['view'],
    apiEndpoint: 'getActiveTenants'
  },
  last_access_subscription: {
    id: 'last_access_subscription',
    label: 'Last Access Subscription',
    color: 'blue',
    description: 'Tenant subscription yang hari ini terakhir akses',
    priority: 'retention',
    columns: ['business', 'owner', 'contact', 'subscriptionPlan', 'subscriptionEnd', 'renewalReminder', 'usageStats'],
    actions: ['view'],
    apiEndpoint: 'getLastAccessSubscriptionTenants'
  },
  expired_tenant: {
    id: 'expired_tenant',
    label: 'Expired Tenant',
    color: 'gray',
    description: 'Tenant yang pernah aktif tapi tidak perpanjang',
    priority: 'analysis',
    columns: ['business', 'owner', 'contact', 'lastActiveDate', 'expiredDate', 'daysSinceExpired', 'previousPlan', 'churnReason'],
    actions: ['view'],
    apiEndpoint: 'getExpiredTenants'
  }
};

// Column Labels
export const COLUMN_LABELS = {
  business: 'Business',
  owner: 'Owner',
  contact: 'Contact',
  registration: 'Registration',
  verification: 'Verification',
  trialStart: 'Trial Start',
  trialEnd: 'Trial End',
  daysRemaining: 'Days Remaining',
  lastLogin: 'Last Login',
  trialUsage: 'Trial Usage',
  daysSinceExpired: 'Days Since Expired',
  subscriptionPlan: 'Subscription Plan',
  subscriptionStart: 'Subscription Start',
  subscriptionEnd: 'Subscription End',
  renewalDate: 'Renewal Date',
  paymentStatus: 'Payment Status',
  renewalReminder: 'Renewal Reminder',
  usageStats: 'Usage Stats',
  lastActiveDate: 'Last Active',
  expiredDate: 'Expired Date',
  previousPlan: 'Previous Plan',
  churnReason: 'Churn Reason'
};

// Priority Colors
export const PRIORITY_COLORS = {
  verification: 'bg-red-50 text-red-700 border-red-200',
  conversion: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  urgent: 'bg-orange-50 text-orange-700 border-orange-200',
  recovery: 'bg-orange-50 text-orange-700 border-orange-200',
  management: 'bg-green-50 text-green-700 border-green-200',
  retention: 'bg-blue-50 text-blue-700 border-blue-200',
  analysis: 'bg-gray-50 text-gray-700 border-gray-200'
};
