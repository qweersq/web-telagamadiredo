import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subscriptionPlanService from '../../services/subscriptionPlanService';
import AnimatedButton from '../../components/Design/AnimatedButton';
import SubscriptionPlanDetailModal from './components/modals/SubscriptionPlanDetailModal';
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES
} from '../../utils/filterStorage';
import {
  FaArrowLeft, 
  FaPlus, 
  FaFilter, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff,
  FaDollarSign,
  FaCalendarAlt,
  FaUsers,
  FaBuilding,
  FaChartBar,
  FaCrown,
  FaStar,
  FaGem
} from 'react-icons/fa';

const SuperAppSubscriptionPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active'); // Default to active
  const [showStats, setShowStats] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Component name untuk filter storage
  const COMPONENT_NAME = COMPONENT_NAMES.SUBSCRIPTION_PLANS;

  useEffect(() => {
    // Load saved filters on component mount
    const savedStatusFilter = getFilterFromStorage(COMPONENT_NAME, FILTER_TYPES.STATUS_FILTER);
    
    if (savedStatusFilter) {
      setStatusFilter(savedStatusFilter);
    }
    
    fetchPlans();
  }, []);

  useEffect(() => {
    // Save filters when they change
    if (statusFilter !== 'active') {
      saveFilterToStorage(
        COMPONENT_NAME,
        FILTER_TYPES.STATUS_FILTER,
        statusFilter,
        24 // 24 hours expiration
      );
    } else {
      clearFilterFromStorage(COMPONENT_NAME, FILTER_TYPES.STATUS_FILTER);
    }
    
    fetchPlans();
  }, [statusFilter]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = {};
      params.is_active = statusFilter === 'active';

      const response = await subscriptionPlanService.getAllPlans(params);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      alert('Gagal memuat data paket langganan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    navigate('/subscription-plans/create');
  };

  const handleViewPlan = (id) => {
    setSelectedPlanId(id);
    setShowDetailModal(true);
  };

  const handleEditPlan = (id) => {
    setSelectedPlanId(id);
    setShowDetailModal(true);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await subscriptionPlanService.togglePlanStatus(id, !currentStatus);
      alert('Status paket berhasil diubah');
      fetchPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Gagal mengubah status paket');
    }
  };

  const handleDeletePlan = async (id, planName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus paket "${planName}"?`)) {
      try {
        await subscriptionPlanService.deletePlan(id);
        alert('Paket berhasil dihapus');
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Gagal menghapus paket');
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/superapp-dashboard');
  };

  const handleClearAllFilters = () => {
    setStatusFilter('active');
    
    // Clear saved filters from localStorage
    clearFilterFromStorage(COMPONENT_NAME, FILTER_TYPES.STATUS_FILTER);
    
    fetchPlans();
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPlanId(null);
  };

  const handlePlanUpdate = () => {
    fetchPlans(); // Refresh the plans list
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return <FaStar className="text-yellow-500" />;
    if (name.includes('premium')) return <FaCrown className="text-purple-500" />;
    if (name.includes('enterprise')) return <FaGem className="text-blue-500" />;
    return <FaStar className="text-gray-500" />;
  };

  const getPlanColor = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return 'from-yellow-100 to-orange-100 border-yellow-200';
    if (name.includes('premium')) return 'from-purple-100 to-pink-100 border-purple-200';
    if (name.includes('enterprise')) return 'from-blue-100 to-cyan-100 border-blue-200';
    return 'from-gray-100 to-slate-100 border-gray-200';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (days) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} tahun`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} bulan`;
    } else {
      return `${days} hari`;
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesStatus = (statusFilter === 'active' && plan.is_active) ||
                         (statusFilter === 'inactive' && !plan.is_active);
    
    return matchesStatus;
  });

  const activePlansCount = plans.filter(plan => plan.is_active).length;
  const totalPlansCount = plans.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat data paket langganan...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 font-montserrat flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Subscription Plans</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola paket langganan untuk tenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-montserrat">Total Plans</p>
                  <p className="text-lg font-semibold font-bold text-gray-900">{totalPlansCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCrown className="text-blue-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-montserrat">Active Plans</p>
                  <p className="text-lg font-semibold font-bold text-green-600">{activePlansCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaToggleOn className="text-green-600 text-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <AnimatedButton
              onClick={handleCreatePlan}
              variant="blue"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            >
              <FaPlus className="text-sm" />
              Tambah Paket
            </AnimatedButton>
          </div>

          {/* Filters - Simple & Modern */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400 text-sm" />
                  <span className="text-sm font-medium text-gray-700 font-montserrat">Filter</span>
                </div>
                {statusFilter === 'active' && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium font-montserrat">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Menampilkan Paket Aktif
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-montserrat">Status Paket</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs font-montserrat bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Plans Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredPlans.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaCrown className="text-lg font-semibold text-indigo-500" />
                </div>
                <h3 className="text-xl font-montserrat text-gray-900 mb-2">
                  {statusFilter === 'active' ? 'Tidak ada paket aktif' : 'Tidak ada paket langganan'}
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-montserrat">
                  {statusFilter === 'active' 
                    ? 'Belum ada paket langganan yang aktif tersedia' 
                    : 'Belum ada paket langganan yang tersedia'
                  }
                </p>
                <AnimatedButton
                  onClick={handleCreatePlan}
                  variant="blue"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold mx-auto"
                >
                  <FaPlus className="text-sm" />
                  Tambah Paket Pertama
                </AnimatedButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Paket
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Harga
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Durasi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Max Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Max Branches
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider font-montserrat">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50 transition-colors duration-150">
                        {/* Paket Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-lg border`}>
                              {getPlanIcon(plan.name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 font-montserrat">
                                {plan.name}
                              </div>
                              <div className="text-xs text-gray-500 font-montserrat">
                                {plan.description || 'Tidak ada deskripsi'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Harga Column */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 font-montserrat">
                            {formatCurrency(plan.price)}
                          </div>
                        </td>
                        
                        {/* Durasi Column */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-montserrat">
                            {formatDuration(plan.duration_days)}
                          </div>
                        </td>
                        
                        {/* Max Users Column */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-montserrat">
                            {plan.max_users || 'Unlimited'}
                          </div>
                        </td>
                        
                        {/* Max Branches Column */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-montserrat">
                            {plan.max_branches || 'Unlimited'}
                          </div>
                        </td>
                        
                        {/* Status Column */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                            plan.is_active 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {plan.is_active ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-600" />}
                            {plan.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        
                        {/* Aksi Column */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewPlan(plan.id)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                              title="Lihat Detail"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleEditPlan(plan.id)}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                              title="Edit Paket"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                plan.is_active 
                                  ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title={plan.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {plan.is_active ? <FaToggleOn className="text-sm" /> : <FaToggleOff className="text-sm" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <SubscriptionPlanDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        planId={selectedPlanId}
        onUpdate={handlePlanUpdate}
      />
    </div>
  );
};

export default SuperAppSubscriptionPlans;
