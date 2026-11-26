import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import subscriptionPlanService from '../../services/subscriptionPlanService';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { 
  FaArrowLeft, 
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
  FaGem,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';

const SuperAppSubscriptionPlanDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlanDetail();
      fetchPlanStats();
    }
  }, [id]);

  const fetchPlanDetail = async () => {
    try {
      setLoading(true);
      const response = await subscriptionPlanService.getPlanById(id);
      setPlan(response.data);
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      alert('Gagal memuat detail paket langganan');
      navigate('/subscription-plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanStats = async () => {
    try {
      setLoadingStats(true);
      const response = await subscriptionPlanService.getPlanStats(id);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching plan stats:', error);
      // Don't show error for stats, just continue
    } finally {
      setLoadingStats(false);
    }
  };

  const handleBackToPlans = () => {
    navigate('/subscription-plans');
  };

  const handleEditPlan = () => {
    navigate(`/subscription-plans/${id}/edit`);
  };

  const handleToggleStatus = async () => {
    try {
      await subscriptionPlanService.togglePlanStatus(id, !plan.is_active);
      alert('Status paket berhasil diubah');
      fetchPlanDetail();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      alert('Gagal mengubah status paket');
    }
  };

  const handleDeletePlan = async () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus paket "${plan.name}"?`)) {
      try {
        await subscriptionPlanService.deletePlan(id);
        alert('Paket berhasil dihapus');
        navigate('/subscription-plans');
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Gagal menghapus paket');
      }
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat detail paket...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FaTimes className="text-lg font-semibold text-red-500" />
          </div>
          <h3 className="text-xl font-montserrat text-gray-900 mb-2">Paket tidak ditemukan</h3>
          <p className="text-sm text-gray-500 mb-4 font-montserrat">Paket langganan yang Anda cari tidak tersedia</p>
          <AnimatedButton
            onClick={handleBackToPlans}
            variant="blue"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold mx-auto"
          >
            <FaArrowLeft className="text-sm" />
            Kembali ke Daftar Paket
          </AnimatedButton>
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
              onClick={handleBackToPlans}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-lg border`}>
                {getPlanIcon(plan.name)}
              </div>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">{plan.name}</h1>
                <p className="text-sm text-gray-600 font-montserrat">Detail paket langganan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          {/* Plan Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-xl border`}>
                  {getPlanIcon(plan.name)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-montserrat text-gray-900">{plan.name}</h2>
                  <p className="text-sm text-gray-500 font-montserrat">
                    {plan.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEditPlan}
                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                  title="Edit Paket"
                >
                  <FaEdit className="text-sm" />
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    plan.is_active 
                      ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title={plan.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {plan.is_active ? <FaToggleOn className="text-sm" /> : <FaToggleOff className="text-sm" />}
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                  title="Hapus Paket"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>

            {/* Plan Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FaDollarSign className="text-green-500 text-sm" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Harga</span>
                </div>
                <p className="text-lg font-bold text-gray-900 font-montserrat">{formatCurrency(plan.price)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarAlt className="text-blue-500 text-sm" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Durasi</span>
                </div>
                <p className="text-lg font-bold text-gray-900 font-montserrat">{formatDuration(plan.duration_days)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FaUsers className="text-purple-500 text-sm" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Max Users</span>
                </div>
                <p className="text-lg font-bold text-gray-900 font-montserrat">{plan.max_users || 'Unlimited'}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FaBuilding className="text-orange-500 text-sm" />
                  <span className="text-xs font-semibold text-gray-700 font-montserrat">Max Branches</span>
                </div>
                <p className="text-lg font-bold text-gray-900 font-montserrat">{plan.max_branches || 'Unlimited'}</p>
              </div>
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                    plan.is_active 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {plan.is_active ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-600" />}
                    {plan.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-montserrat">
                  Dibuat: {new Date(plan.createdAt).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-blue-500 text-lg" />
                <h3 className="text-xl font-montserrat text-gray-900">Statistik Paket</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-blue-600">{stats.total_subscriptions || 0}</p>
                  <p className="text-xs text-gray-500 font-montserrat">Total Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-green-600">{stats.active_subscriptions || 0}</p>
                  <p className="text-xs text-gray-500 font-montserrat">Active Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-purple-600">{stats.total_revenue || 0}</p>
                  <p className="text-xs text-gray-500 font-montserrat">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-orange-600">{stats.avg_monthly_revenue || 0}</p>
                  <p className="text-xs text-gray-500 font-montserrat">Avg Monthly Revenue</p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {plan.features && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-500 text-lg" />
                <h3 className="text-xl font-montserrat text-gray-900">Fitur Paket</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(plan.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {enabled && <FaCheckCircle className="text-green-600 text-xs" />}
                    </div>
                    <span className={`text-sm font-medium font-montserrat capitalize ${
                      enabled ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {feature.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <AnimatedButton
              onClick={handleBackToPlans}
              variant="outline"
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FaArrowLeft className="text-sm" />
              Kembali ke Daftar
            </AnimatedButton>
            <AnimatedButton
              onClick={handleEditPlan}
              variant="blue"
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FaEdit className="text-sm" />
              Edit Paket
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAppSubscriptionPlanDetail;
