import { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaSave, FaTimes as FaCancel } from 'react-icons/fa';
import subscriptionPlanService from '../../../../services/subscriptionPlanService';
import PlanBasicInfo from './PlanBasicInfo';
import PlanPricing from './PlanPricing';
import PlanLimits from './PlanLimits';
import PlanFeatures from './PlanFeatures';
import PlanStatus from './PlanStatus';

const SubscriptionPlanDetailModal = ({ isOpen, onClose, planId, onUpdate }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetails();
    }
  }, [isOpen, planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await subscriptionPlanService.getPlanById(planId);
      setPlan(response.data);
      setEditedPlan(response.data);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      alert('Gagal memuat detail paket');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPlan(plan);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await subscriptionPlanService.updatePlan(planId, editedPlan);
      setPlan(editedPlan);
      setIsEditing(false);
      onUpdate && onUpdate();
      alert('Paket berhasil diperbarui');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Gagal memperbarui paket');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeaturesChange = (features) => {
    setEditedPlan(prev => ({
      ...prev,
      features
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 font-montserrat">
                Detail Paket Langganan
              </h2>
              <p className="text-sm text-gray-600 font-montserrat">
                {isEditing ? 'Edit paket langganan' : 'Lihat detail paket langganan'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-montserrat text-sm font-semibold"
                  >
                    <FaSave className="text-sm" />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-montserrat text-sm font-semibold"
                  >
                    <FaCancel className="text-sm" />
                    Batal
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-montserrat text-sm font-semibold"
                >
                  <FaEdit className="text-sm" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-500"></div>
              <span className="ml-3 text-gray-600 font-montserrat">Memuat detail paket...</span>
            </div>
          ) : plan ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <PlanBasicInfo
                plan={isEditing ? editedPlan : plan}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />

              {/* Pricing */}
              <PlanPricing
                plan={isEditing ? editedPlan : plan}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />

              {/* Limits */}
              <PlanLimits
                plan={isEditing ? editedPlan : plan}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />

              {/* Features */}
              <PlanFeatures
                plan={isEditing ? editedPlan : plan}
                isEditing={isEditing}
                onFeaturesChange={handleFeaturesChange}
              />

              {/* Status */}
              <PlanStatus
                plan={isEditing ? editedPlan : plan}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-montserrat">Paket tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanDetailModal;
