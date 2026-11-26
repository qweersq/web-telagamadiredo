import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import { WithRole } from '../../utils/roleValidator';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, [searchTerm, statusFilter, subscriptionFilter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (subscriptionFilter) params.subscription_status = subscriptionFilter;

      const response = await tenantService.getAllTenants(params);
      setTenants(response.data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      alert('Gagal memuat data tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = () => {
    navigate('/tenants/create');
  };

  const handleViewTenant = (id) => {
    navigate(`/tenants/${id}`);
  };

  const handleEditTenant = (id) => {
    navigate(`/tenants/${id}/edit`);
  };

  const handleDeleteTenant = async (id, businessName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tenant "${businessName}"?`)) {
      try {
        await tenantService.deleteTenant(id);
        alert('Tenant berhasil dihapus');
        fetchTenants();
      } catch (error) {
        console.error('Error deleting tenant:', error);
        alert('Gagal menghapus tenant');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'trial': { color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200', text: 'Trial', icon: '⏳' },
      'active': { color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200', text: 'Aktif', icon: '✅' },
      'inactive': { color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200', text: 'Tidak Aktif', icon: '⏸️' },
      'suspended': { color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200', text: 'Ditangguhkan', icon: '🚫' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200', text: status, icon: '❓' };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getSubscriptionBadge = (subscriptionStatus) => {
    const statusConfig = {
      'trial': { color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200', text: 'Trial', icon: '🆓' },
      'active': { color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200', text: 'Aktif', icon: '💎' },
      'expired': { color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200', text: 'Kadaluarsa', icon: '⏰' },
      'cancelled': { color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200', text: 'Dibatalkan', icon: '❌' }
    };
    
    const config = statusConfig[subscriptionStatus] || { color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200', text: subscriptionStatus, icon: '❓' };
    return (
      <span className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat data tenant...</p>
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FaBuilding className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Kelola Tenants</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola semua bisnis laundry</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-xs font-medium text-gray-600 font-montserrat">Total: </span>
              <span className="text-base font-bold text-blue-600 font-montserrat">{tenants.length}</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-xs font-medium text-gray-600 font-montserrat">Aktif: </span>
              <span className="text-base font-bold text-green-600 font-montserrat">
                {tenants.filter(t => t.status === 'active').length}
              </span>
            </div>
          </div>
          <WithRole allowedRoles={['superapp-superadmin']}>
            <AnimatedButton
              onClick={handleCreateTenant}
              variant="blue"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            >
              <FaPlus className="text-sm" />
              Tambah Tenant
            </AnimatedButton>
          </WithRole>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-blue-500 text-lg" />
            <h2 className="text-xl font-montserrat text-gray-900">Filter & Pencarian</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
                <FaSearch className="text-blue-500" />
                Cari Tenant
              </label>
              <input
                type="text"
                placeholder="Cari nama bisnis, owner, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
                <FaBuilding className="text-green-500" />
                Status Bisnis
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="trial">Trial</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
                <FaCalendarAlt className="text-purple-500" />
                Status Langganan
              </label>
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              >
                <option value="">Semua Langganan</option>
                <option value="trial">Trial</option>
                <option value="active">Aktif</option>
                <option value="expired">Kadaluarsa</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tenants List */}
        <div className="space-y-4">
          {tenants.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="text-lg font-semibold text-blue-500" />
              </div>
              <h3 className="text-xl font-montserrat text-gray-900 mb-2">Tidak ada tenant</h3>
              <p className="text-sm text-gray-500 mb-4 font-montserrat">Belum ada tenant yang terdaftar dalam sistem</p>
              <WithRole allowedRoles={['superapp-superadmin']}>
                <AnimatedButton
                  onClick={handleCreateTenant}
                  variant="blue"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold mx-auto"
                >
                  <FaPlus className="text-sm" />
                  Tambah Tenant Pertama
                </AnimatedButton>
              </WithRole>
            </div>
          ) : (
            tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Header Card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaBuilding className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-montserrat text-gray-900">{tenant.business_name}</h3>
                      <div className="text-xs text-gray-500 flex items-center gap-1 font-montserrat">
                        <FaMapMarkerAlt className="text-xs" />
                        {tenant.city || 'Lokasi tidak tersedia'}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewTenant(tenant.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                      title="Lihat Detail"
                    >
                      <FaEye className="text-sm" />
                    </button>
                    <WithRole allowedRoles={['superapp-superadmin']}>
                      <button
                        onClick={() => handleEditTenant(tenant.id)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                        title="Edit Tenant"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id, tenant.business_name)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                        title="Hapus Tenant"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </WithRole>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUser className="text-green-500 text-sm" />
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">Pemilik</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 ml-5 font-montserrat">{tenant.owner_name}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FaEnvelope className="text-purple-500 text-sm" />
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">Kontak</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      <p className="text-sm text-gray-900 font-montserrat">{tenant.email}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 font-montserrat">
                        <FaPhone className="text-green-500 text-xs" />
                        {tenant.phone}
                      </p>
                    </div>
                  </div>

                  {/* Status & Subscription */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaBuilding className="text-green-500 text-sm" />
                        <span className="text-xs font-semibold text-gray-700 font-montserrat">Status Bisnis</span>
                      </div>
                      <div className="ml-5">
                        {getStatusBadge(tenant.status)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaCalendarAlt className="text-purple-500 text-sm" />
                        <span className="text-xs font-semibold text-gray-700 font-montserrat">Status Langganan</span>
                      </div>
                      <div className="ml-5">
                        {getSubscriptionBadge(tenant.subscription_status)}
                      </div>
                    </div>
                  </div>

                  {/* Trial End Date */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <FaCalendarAlt className="text-orange-500 text-sm" />
                      <span className="text-xs font-semibold text-gray-700 font-montserrat">Trial Berakhir</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 ml-5 font-montserrat">{formatDate(tenant.trial_end_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantList;

