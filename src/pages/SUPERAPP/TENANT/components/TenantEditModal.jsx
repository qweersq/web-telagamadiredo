import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';

/**
 * TenantEditModal - Modal untuk edit tenant data (SuperApp Admin Only)
 * Like phpMyAdmin tapi dengan UI modern
 */
const TenantEditModal = ({ tenant, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: '',
    trial_end_date: '',
    subscription_end_date: '',
    subscription_status: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'trial', label: 'Trial' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending_payment', label: 'Pending Payment' }
  ];

  const subscriptionStatusOptions = [
    { value: 'trial', label: 'Trial' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending_payment', label: 'Pending Payment' }
  ];

  useEffect(() => {
    if (tenant) {
      // Format trial_end_date untuk input type="datetime-local"
      let formattedTrialEndDate = '';
      if (tenant.trial_end_date) {
        const date = new Date(tenant.trial_end_date);
        // Format: YYYY-MM-DDTHH:mm
        formattedTrialEndDate = date.toISOString().slice(0, 16);
      }

      // Format subscription_end_date untuk input type="datetime-local"
      let formattedSubscriptionEndDate = '';
      // Get from tenant.subscriptions array
      const subscriptionEndDate = tenant.subscriptions?.[0]?.end_date;
      if (subscriptionEndDate) {
        const date = new Date(subscriptionEndDate);
        // Format: YYYY-MM-DDTHH:mm
        formattedSubscriptionEndDate = date.toISOString().slice(0, 16);
      }

      setFormData({
        business_name: tenant.business_name || '',
        owner_name: tenant.owner_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        status: tenant.status || '',
        trial_end_date: formattedTrialEndDate,
        subscription_end_date: formattedSubscriptionEndDate,
        subscription_status: tenant.subscription_status || ''
      });
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show confirmation modal
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowConfirm(false);

      // Prepare data untuk API
      const updateData = { ...formData };
      
      // Remove subscription_end_date (not supported by tenant update API)
      delete updateData.subscription_end_date;
      
      // Convert trial_end_date back to ISO format if exists
      if (updateData.trial_end_date) {
        updateData.trial_end_date = new Date(updateData.trial_end_date).toISOString();
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/superapp/tenants/v2/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update tenant');
      }

      // Success
      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold">Edit Tenant</h2>
              <p className="text-sm text-gray-300 mt-1">SuperApp Admin - God Mode ⚡</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors p-2"
              disabled={loading}
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Warning Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Critical Fields - Edit with Caution</p>
                <p className="text-yellow-700 mt-1">
                  Mengubah status atau date fields akan trigger auto-billing generation. 
                  Pastikan data sudah benar sebelum save.
                </p>
                <p className="text-yellow-600 mt-2 text-xs">
                  ℹ️ Note: Subscription Status "Active" akan menampilkan Subscription End Date (read-only). 
                  Status lainnya menampilkan Trial End Date (editable).
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      maxLength={25}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Subscription */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-600" />
                  Critical Fields - Will Trigger Billing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tenant Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">Select Status</option>
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: <span className="font-semibold">{tenant.status}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subscription Status
                    </label>
                    <select
                      name="subscription_status"
                      value={formData.subscription_status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">Select Status</option>
                      {subscriptionStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: <span className="font-semibold">{tenant.subscription_status}</span>
                    </p>
                  </div>
                  {/* Conditional: Show Subscription End Date for active, Trial End Date for others */}
                  <div className="col-span-2">
                    {formData.subscription_status === 'active' ? (
                      <>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Subscription End Date
                          <span className="text-xs text-gray-500 font-normal ml-2">(Read-only - managed by subscription)</span>
                        </label>
                        <input
                          type="datetime-local"
                          name="subscription_end_date"
                          value={formData.subscription_end_date}
                          onChange={handleChange}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed opacity-75"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Current: <span className="font-semibold">
                            {formatDateTime(tenant.subscriptions?.[0]?.end_date)}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Trial End Date
                        </label>
                        <input
                          type="datetime-local"
                          name="trial_end_date"
                          value={formData.trial_end_date}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Current: <span className="font-semibold">{formatDateTime(tenant.trial_end_date)}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-gray-500">
              {hasChanges ? '⚠️ Unsaved changes' : '✓ No changes'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes (bisa bikin data gasesuai)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-yellow-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Confirm Changes
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Anda akan mengubah data tenant. Perubahan status atau trial_end_date 
                  akan trigger auto-billing generation via /billing/validate.
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  Lanjutkan perubahan?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Yes, Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantEditModal;

