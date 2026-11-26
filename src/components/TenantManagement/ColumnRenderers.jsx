import { formatDate, formatDaysRemaining, formatDaysSince } from '../../utils/dateUtils';

// Column Renderers untuk setiap kolom
export const COLUMN_RENDERERS = {
  business: (tenant) => (
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-gray-900 truncate" title={tenant.business_name}>
        {tenant.business_name}
      </div>
      <div className="text-sm text-gray-500 truncate" title={tenant.city}>
        {tenant.city || 'Location not available'}
      </div>
    </div>
  ),

  owner: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="font-medium text-gray-900 truncate" title={tenant.owner_name}>
        {tenant.owner_name}
      </div>
    </div>
  ),

  contact: (tenant) => (
    <div className="min-w-0">
      <div>
        <div className="text-sm text-gray-900 truncate" title={tenant.email}>
          {tenant.email}
        </div>
        <div className="text-sm text-gray-500 truncate" title={tenant.phone}>
          {tenant.phone}
        </div>
      </div>
    </div>
  ),

  registration: (tenant) => (
    <div className="min-w-0">
      <div className="text-sm text-gray-900 truncate" title={formatDate(tenant.createdAt)}>
        {formatDate(tenant.createdAt)}
      </div>
    </div>
  ),

  verification: (tenant) => (
    <div className="min-w-0">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        tenant.is_verified 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {tenant.is_verified ? 'Verified' : 'Unverified'}
      </span>
    </div>
  ),

  trialStart: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.trial_start_date)}
      </div>
    </div>
  ),

  trialEnd: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.trial_end_date)}
      </div>
    </div>
  ),

  daysRemaining: (tenant) => {
    const days = formatDaysRemaining(tenant.trial_end_date);
    return (
      <div className="w-24 flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          days <= 3 ? 'bg-red-100 text-red-800' :
          days <= 7 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {days} days
        </span>
      </div>
    );
  },

  lastLogin: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.last_login_at)}
      </div>
    </div>
  ),

  trialUsage: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {tenant.login_count || 0} logins
      </div>
    </div>
  ),

  daysSinceExpired: (tenant) => {
    const days = formatDaysSince(tenant.trial_end_date);
    return (
      <div className="w-32 flex-shrink-0">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {days} days ago
        </span>
      </div>
    );
  },


  subscriptionPlan: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm font-medium text-gray-900">
        {tenant.subscriptions?.[0]?.plan?.name || 'No Plan'}
      </div>
    </div>
  ),

  subscriptionStart: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.subscription_start_date)}
      </div>
    </div>
  ),

  subscriptionEnd: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.subscription_end_date)}
      </div>
    </div>
  ),

  renewalDate: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.renewal_date)}
      </div>
    </div>
  ),

  paymentStatus: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        tenant.payment_status === 'paid' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {tenant.payment_status || 'Unknown'}
      </span>
    </div>
  ),

  renewalReminder: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        tenant.renewal_reminder_sent 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {tenant.renewal_reminder_sent ? 'Sent' : 'Not Sent'}
      </span>
    </div>
  ),

  usageStats: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {tenant.monthly_logins || 0} logins/month
      </div>
    </div>
  ),

  lastActiveDate: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.last_active_at)}
      </div>
    </div>
  ),

  expiredDate: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {formatDate(tenant.expired_at)}
      </div>
    </div>
  ),

  previousPlan: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900">
        {tenant.previous_plan || 'Unknown'}
      </div>
    </div>
  ),

  churnReason: (tenant) => (
    <div className="w-32 flex-shrink-0">
      <div className="text-sm text-gray-900 truncate" title={tenant.churn_reason}>
        {tenant.churn_reason || 'Not specified'}
      </div>
    </div>
  )
};
