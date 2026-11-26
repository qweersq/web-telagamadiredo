import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaPlus } from 'react-icons/fa';
import TenantInfoPreview from './TenantInfoPreview';
import BillingFormFields from './BillingFormFields';
import BillingPreview from './BillingPreview';
import AnimatedButton from '../../../../components/Design/AnimatedButton';
import instance from '../../../../config/api';

const GenerateBillingModal = ({ 
  isOpen, 
  onClose, 
  onGenerate,
  isLoading = false 
}) => {
  const [tenants, setTenants] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tenant_id: '',
    subscription_plan_id: '',
    amount: 0,
    invoice_number: '',
    payment_method: '',
    due_date: '',
    billing_period: '',
    notes: ''
  });

  // Load tenants and subscription plans on mount
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Auto-set due date to 30 days from now
  useEffect(() => {
    if (isOpen && !formData.due_date) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        due_date: futureDate.toISOString().split('T')[0]
      }));
    }
  }, [isOpen, formData.due_date]);

  // Auto-set billing period to current month
  useEffect(() => {
    if (isOpen && !formData.billing_period) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      setFormData(prev => ({
        ...prev,
        billing_period: currentMonth
      }));
    }
  }, [isOpen, formData.billing_period]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        instance.get('/superapp/tenants'),
        instance.get('/superapp/subscription-plans')
      ]);

      setTenants(tenantsRes.data.data || []);
      setSubscriptionPlans(plansRes.data.data || []);
    } catch (err) {
      setError('Failed to load tenants and subscription plans');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantChange = async (e) => {
    const tenantId = parseInt(e.target.value);
    const tenant = tenants.find(t => t.id === tenantId);
    
    setSelectedTenant(tenant);
    setFormData(prev => ({ ...prev, tenant_id: tenantId }));
    
    if (tenant) {
      // Load tenant's current subscription
      try {
        const res = await instance.get(`/superapp/tenants/${tenantId}/subscription`);
        setSelectedSubscription(res.data.data);
      } catch (err) {
        console.error('Error loading subscription:', err);
      }
    } else {
      setSelectedSubscription(null);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleEditAmount = (isEditing) => {
    setIsEditingAmount(isEditing);
  };

  const handleGenerate = () => {
    if (!formData.tenant_id || !formData.subscription_plan_id || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setError('');
    onGenerate(formData);
  };

  const handleClose = () => {
    setFormData({
      tenant_id: '',
      subscription_plan_id: '',
      amount: 0,
      invoice_number: '',
      payment_method: '',
      due_date: '',
      billing_period: '',
      notes: ''
    });
    setSelectedTenant(null);
    setSelectedSubscription(null);
    setError('');
    onClose();
  };

  const selectedPlan = subscriptionPlans.find(p => p.id === formData.subscription_plan_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaPlus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                Generate Manual Billing
              </h2>
              <p className="text-sm text-gray-500 font-montserrat">
                Create billing manually for special cases
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            disabled={isLoading}
          >
            <FaTimes className="text-gray-500 text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                  Loading...
                </h3>
                <p className="text-sm text-gray-500 font-montserrat">
                  Please wait while we load the data
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Tenant Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Select Tenant *
                  </label>
                  <select
                    value={formData.tenant_id || ''}
                    onChange={handleTenantChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.business_name} - {tenant.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant Info Preview */}
                <TenantInfoPreview 
                  tenant={selectedTenant} 
                  subscription={selectedSubscription} 
                />
              </div>

              {/* Billing Form */}
              <BillingFormFields
                formData={formData}
                onFieldChange={handleFieldChange}
                isEditingAmount={isEditingAmount}
                onToggleEditAmount={handleToggleEditAmount}
                subscriptionPlans={subscriptionPlans}
                selectedPlan={selectedPlan}
              />

              {/* Preview */}
              <BillingPreview
                formData={formData}
                tenant={selectedTenant}
                selectedPlan={selectedPlan}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t-2 border-gray-300 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-end">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-white text-gray-800 font-montserrat font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap hover:bg-gray-100 transition-all duration-200 shadow-lg border-2 sm:border-3 border-gray-400 hover:border-gray-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <FaTimes className="text-sm sm:text-base flex-shrink-0" />
              <span>Cancel</span>
            </button>
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !formData.tenant_id || !formData.subscription_plan_id || !formData.amount}
              className="px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-montserrat font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap hover:from-green-700 hover:to-green-800 hover:shadow-2xl transition-all duration-200 shadow-xl border-2 sm:border-3 border-green-700 hover:border-green-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="text-sm sm:text-base flex-shrink-0 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FaPlus className="text-sm sm:text-base flex-shrink-0" />
                  <span>Generate Billing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateBillingModal;
