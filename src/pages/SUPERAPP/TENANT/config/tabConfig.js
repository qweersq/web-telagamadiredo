/**
 * Tenant Tab Configuration
 * 4 Status Tabs: Trial Active, Trial Expired, Active, Expired
 * 4 Plan Tabs: NotaFree, NotaLite, NotaPro, NotaBusiness
 */

export const TENANT_TABS = [
  {
    key: 'active_trial',
    label: 'Trial Active',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    badgeColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-100',
    description: 'Tenants in active trial period',
    
    // Backend filter criteria
    filter: {
      status: 'trial',
      subscription_status: 'trial'
    },
    
    // Table columns to display
    columns: ['business_name', 'owner_name', 'email', 'trial_end_date', 'days_left', 'actions'],
    
    // Available actions for this tab
    actions: ['view', 'extend_trial', 'convert_to_paid']
  },
  
  {
    key: 'expired_trial',
    label: 'Trial Expired',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    badgeColor: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-100',
    description: 'Trial expired - never paid subscription',
    
    filter: {
      status: 'expired',
      subscription_status: 'expired',
      trial_end_date: 'NOT_NULL' // Must have trial_end_date (never paid)
    },
    
    columns: ['business_name', 'owner_name', 'email', 'trial_end_date', 'days_expired', 'actions'],
    
    actions: ['view', 'recover', 'generate_billing']
  },
  
  {
    key: 'active',
    label: 'Active',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-500',
    badgeColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-100',
    description: 'Active paid subscriptions',
    
    filter: {
      status: 'active',
      subscription_status: 'active'
    },
    
    columns: ['business_name', 'owner_name', 'plan_name', 'subscription_end_date', 'days_left', 'actions'],
    
    actions: ['view', 'view_billing', 'change_plan']
  },
  
  {
    key: 'expired_tenant',
    label: 'Expired',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-500',
    badgeColor: 'bg-gray-500',
    hoverColor: 'hover:bg-gray-100',
    description: 'Subscription expired - previously paid',
    
    filter: {
      status: 'expired',
      subscription_status: 'expired',
      trial_end_date: 'NULL' // Must NOT have trial_end_date (already paid before)
    },
    
    columns: ['business_name', 'owner_name', 'last_plan', 'subscription_end_date', 'days_expired', 'actions'],
    
    actions: ['view', 'recover', 'generate_billing']
  },
  
  // Plan-based tabs
  {
    key: 'notafree',
    label: 'NotaFree',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-500',
    badgeColor: 'bg-gray-500',
    hoverColor: 'hover:bg-gray-100',
    description: 'Tenants with NotaFree plan',
    type: 'plan',
    planName: 'NotaFree',
    
    filter: {
      plan_name: 'NotaFree'
    },
    
    columns: ['business_name', 'owner_name', 'email', 'subscription_end_date', 'days_left', 'actions'],
    
    actions: ['view', 'view_billing', 'change_plan']
  },
  
  {
    key: 'notalite',
    label: 'NotaLite',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    badgeColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-100',
    description: 'Tenants with NotaLite plan',
    type: 'plan',
    planName: 'NotaLite',
    
    filter: {
      plan_name: 'NotaLite'
    },
    
    columns: ['business_name', 'owner_name', 'email', 'subscription_end_date', 'days_left', 'actions'],
    
    actions: ['view', 'view_billing', 'change_plan']
  },
  
  {
    key: 'notapro',
    label: 'NotaPro',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-500',
    badgeColor: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-100',
    description: 'Tenants with NotaPro plan',
    type: 'plan',
    planName: 'NotaPro',
    
    filter: {
      plan_name: 'NotaPro'
    },
    
    columns: ['business_name', 'owner_name', 'email', 'subscription_end_date', 'days_left', 'actions'],
    
    actions: ['view', 'view_billing', 'change_plan']
  },
  
  {
    key: 'notabusiness',
    label: 'NotaBusiness',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500',
    badgeColor: 'bg-yellow-500',
    hoverColor: 'hover:bg-yellow-100',
    description: 'Tenants with NotaBusiness plan',
    type: 'plan',
    planName: 'NotaBusiness',
    
    filter: {
      plan_name: 'NotaBusiness'
    },
    
    columns: ['business_name', 'owner_name', 'email', 'subscription_end_date', 'days_left', 'actions'],
    
    actions: ['view', 'view_billing', 'change_plan']
  }
];

// Helper function to get tab by key
export const getTabByKey = (key) => {
  return TENANT_TABS.find(tab => tab.key === key);
};

// Helper function to get tab colors
export const getTabColors = (key) => {
  const tab = getTabByKey(key);
  if (!tab) return { bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200' };
  return {
    bgColor: tab.bgColor,
    textColor: tab.textColor,
    borderColor: tab.borderColor
  };
};

