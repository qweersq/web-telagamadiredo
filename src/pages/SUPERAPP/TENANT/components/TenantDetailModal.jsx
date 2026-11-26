import React, { useState, useEffect } from 'react';
import { FaTimes, FaClock, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaEdit, FaFileInvoiceDollar, FaHistory, FaBolt, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import tenantService from '../services/tenantService';
import TenantEditModal from './TenantEditModal';
import BillingHistoryModal from './BillingHistoryModal';
import ValidationResultsModal from './ValidationResultsModal';
import ManualBillingFixPanel from './ManualBillingFixPanel';

/**
 * Tenant Detail Modal - Clean & Functional
 */
const TenantDetailModal = ({ tenant, onClose, activeTab, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [tenantDetail, setTenantDetail] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [latestBilling, setLatestBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Validation states
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  useEffect(() => {
    fetchTenantDetail();
    fetchLatestBilling();
  }, [tenant.id]);

  const fetchTenantDetail = async () => {
    try {
      setLoading(true);
      // Fetch detailed analytics from API V2
      const response = await tenantService.getTenantAnalytics(tenant.id);
      if (response.success) {
        setTenantDetail(response.data);
      }
    } catch (error) {
      console.error('Error fetching tenant detail:', error);
      // Fallback to table data if API fails
      setTenantDetail(tenant);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestBilling = async () => {
    try {
      setBillingLoading(true);
      const response = await tenantService.getLatestBilling(tenant.id);
      if (response.success) {
        // Handle different response structures
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setLatestBilling(data[0]);
        } else if (data.billings && data.billings.length > 0) {
          setLatestBilling(data.billings[0]);
        } else {
          setLatestBilling(null);
        }
      }
    } catch (error) {
      console.error('Error fetching latest billing:', error);
      setLatestBilling(null);
    } finally {
      setBillingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      trial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Trial' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
      expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Suspended' },
      pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Payment' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleEditSuccess = (updatedTenant) => {
    setShowEditModal(false);
    setTenantDetail(updatedTenant);
    if (onRefresh) {
      onRefresh(); // Refresh stats + table data
    }
  };

  const handleValidateBilling = async () => {
    try {
      setValidating(true);
      const response = await tenantService.validateBilling(tenant.id);

      if (response.success) {
        setValidationResults(response.data);
        setShowValidationModal(true);

        // Refresh latest billing if new billing was generated
        const hasGenerated = response.data.validations?.some(
          v => v.status === 'generated' && v.result?.count > 0
        );

        if (hasGenerated) {
          await fetchLatestBilling();
        }
      }
    } catch (error) {
      console.error('Error validating billing:', error);
      // Show error in validation modal
      setValidationResults({
        tenant_id: tenant.id,
        tenant_status: currentTenant.status,
        subscription_status: currentTenant.subscription_status,
        validations: [{
          type: 'error',
          status: 'error',
          message: error.response?.data?.error?.message || error.message || 'Failed to validate billing',
          error: error.message
        }]
      });
      setShowValidationModal(true);
    } finally {
      setValidating(false);
    }
  };

  const currentTenant = tenantDetail || tenant;
  const daysLeft = calculateDaysLeft(currentTenant.trial_end_date || currentTenant.subscriptions?.[0]?.end_date);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentTenant.business_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'active_trial' ? 'bg-blue-100 text-blue-700' :
                  activeTab === 'expired_trial' ? 'bg-orange-100 text-orange-700' :
                    activeTab === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                  {activeTab.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days ago`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <FaEdit />
                Edit Tenant
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading details...</p>
              </div>
            ) : (
              <>
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FaBuilding className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Business Name</div>
                        <div className="text-sm font-medium text-gray-900">{currentTenant.business_name}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaUser className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Owner</div>
                        <div className="text-sm font-medium text-gray-900">{currentTenant.owner_name}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaEnvelope className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm font-medium text-gray-900">{currentTenant.email}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaPhone className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="text-sm font-medium text-gray-900">{currentTenant.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="text-sm font-medium text-gray-900">{currentTenant.address || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 col-span-2">
                      <FaCalendarAlt className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Registered</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(currentTenant.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Subscription Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Status & Subscription
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tenant Status */}
                    <div className="flex items-start gap-3">
                      <FaShieldAlt className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Tenant Status</div>
                        <div className="mt-1">
                          {getStatusBadge(currentTenant.status)}
                        </div>
                      </div>
                    </div>

                    {/* Subscription Status */}
                    <div className="flex items-start gap-3">
                      <FaCreditCard className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Subscription Status</div>
                        <div className="mt-1">
                          {getStatusBadge(currentTenant.subscription_status)}
                        </div>
                      </div>
                    </div>

                    {/* Current Plan */}
                    <div className="flex items-start gap-3">
                      <FaFileInvoiceDollar className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Current Plan</div>
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            // Prioritas 1: Gunakan data dari analytics.subscription_info (sudah benar dari backend)
                            if (tenantDetail?.analytics?.subscription_info?.current_plan) {
                              return tenantDetail.analytics.subscription_info.current_plan;
                            }

                            // Prioritas 2: Ambil subscription yang active atau trial (sama seperti backend logic)
                            const activeSubscription = currentTenant.subscriptions?.find(
                              sub => sub.status === 'active' || sub.status === 'trial'
                            ) || currentTenant.subscriptions?.[0];

                            return activeSubscription?.plan?.name ||
                              currentTenant.plan_name ||
                              (currentTenant.subscription_status === 'trial' ? 'Trial Period' : '-');
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Subscription Period */}
                    <div className="flex items-start gap-3">
                      <FaClock className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {currentTenant.subscription_status === 'trial' ? 'Trial Period' : 'Subscription Period'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            if (currentTenant.subscription_status === 'trial') {
                              return formatDate(currentTenant.trial_end_date);
                            }

                            // Prioritas 1: Gunakan data dari analytics.subscription_info (sudah benar dari backend)
                            if (tenantDetail?.analytics?.subscription_info?.end_date) {
                              return formatDate(tenantDetail.analytics.subscription_info.end_date);
                            }

                            // Prioritas 2: Ambil subscription yang active atau trial
                            const activeSubscription = currentTenant.subscriptions?.find(
                              sub => sub.status === 'active' || sub.status === 'trial'
                            ) || currentTenant.subscriptions?.[0];

                            return formatDate(activeSubscription?.end_date);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trial/Subscription Status */}
                {(activeTab === 'active_trial' || activeTab === 'active') && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      {activeTab === 'active_trial' ? 'Trial Status' : 'Subscription Status'}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Started</div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(currentTenant.trial_start_date || currentTenant.created_at)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Ends</div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(currentTenant.trial_end_date || currentTenant.subscriptions?.[0]?.end_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branches */}
                {tenantDetail?.branches && tenantDetail.branches.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Branches ({tenantDetail.branches.length})
                    </h3>
                    <div className="space-y-3">
                      {tenantDetail.branches.map((branch) => (
                        <div key={branch.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{branch.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{branch.address}</div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>{branch.city}</span>
                                <span>•</span>
                                <span>{branch.phone}</span>
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {branch.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Billing Fix Panel */}
                <ManualBillingFixPanel
                  subscription={
                    currentTenant.subscriptions?.find(
                      s => s.status === 'active' || s.status === 'trial'
                    ) || currentTenant.subscriptions?.[0]
                  }
                  payment={latestBilling}
                  onSuccess={() => {
                    fetchLatestBilling();
                    fetchTenantDetail();
                  }}
                />

                {/* Latest Billing */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <FaFileInvoiceDollar />
                      Latest Billing
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleValidateBilling}
                        disabled={validating || billingLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaBolt size={12} className={validating ? 'animate-pulse' : ''} />
                        {validating ? 'Validating...' : 'Validate Billing'}
                      </button>
                      <button
                        onClick={() => setShowBillingHistory(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FaHistory size={12} />
                        View All Billings
                      </button>
                    </div>
                  </div>

                  {billingLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <p className="text-xs text-gray-500 mt-2">Loading billing...</p>
                    </div>
                  ) : latestBilling ? (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Invoice Number</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">
                            {latestBilling.invoice_number || `INV-${latestBilling.id}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-bold text-gray-900 mt-1">
                            {formatCurrency(latestBilling.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Due Date</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {formatDate(latestBilling.due_date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${latestBilling.status === 'paid' ? 'bg-green-100 text-green-700' :
                              latestBilling.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {latestBilling.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Payment Method</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {latestBilling.payment_method || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Created</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {formatDate(latestBilling.createdAt || latestBilling.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No billing found
                    </div>
                  )}
                </div>

                {/* Usage Metrics */}
                {tenantDetail?.analytics?.business_metrics && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Usage Metrics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {tenantDetail.analytics.business_metrics.orders_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Orders</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {tenantDetail.analytics.business_metrics.customers_count || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Customers</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(tenantDetail.analytics.business_metrics.total_revenue || 0).replace('Rp', '')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Revenue</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!loading && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <TenantEditModal
          tenant={currentTenant}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Billing History Modal */}
      {showBillingHistory && (
        <BillingHistoryModal
          tenant={currentTenant}
          onClose={() => setShowBillingHistory(false)}
        />
      )}

      {/* Validation Results Modal */}
      {showValidationModal && validationResults && (
        <ValidationResultsModal
          results={validationResults}
          tenant={currentTenant}
          onClose={() => setShowValidationModal(false)}
          onRefresh={fetchLatestBilling}
        />
      )}
    </>
  );
};

export default TenantDetailModal;

