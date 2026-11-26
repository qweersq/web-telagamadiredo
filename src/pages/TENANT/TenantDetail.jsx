import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import { WithRole } from '../../utils/roleValidator';
import { 
  FaBuilding, 
  FaEdit,
  FaPlay,
  FaPause,
  FaPlus,
  FaArrowLeft,
  FaWhatsapp,
  FaCopy
} from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetchTenantData();
  }, [id]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [tenantResponse, statsResponse] = await Promise.all([
        tenantService.getTenantById(id),
        tenantService.getTenantStats(id)
      ]);
      setTenant(tenantResponse.data);
      setStats(statsResponse.data);
      
      // Debug: Log tenant data to verify is_verified field
      console.log('🔍 TenantDetail - Tenant data received:', {
        id: tenantResponse.data.id,
        business_name: tenantResponse.data.business_name,
        status: tenantResponse.data.status,
        subscription_status: tenantResponse.data.subscription_status,
        is_verified: tenantResponse.data.is_verified
      });
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      alert('Gagal memuat data tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/tenants/${id}/edit`);
  };

  const handleActivate = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengaktifkan tenant ini?')) {
      try {
        await tenantService.activateTenant(id);
        alert('Tenant berhasil diaktifkan');
        fetchTenantData();
      } catch (error) {
        console.error('Error activating tenant:', error);
        alert('Gagal mengaktifkan tenant');
      }
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Alasan penangguhan (opsional):');
    if (window.confirm('Apakah Anda yakin ingin menangguhkan tenant ini?')) {
      try {
        await tenantService.suspendTenant(id, reason);
        alert('Tenant berhasil ditangguhkan');
        fetchTenantData();
      } catch (error) {
        console.error('Error suspending tenant:', error);
        alert('Gagal menangguhkan tenant');
      }
    }
  };

  const handleExtendTrial = async () => {
    const days = prompt('Berapa hari untuk memperpanjang trial?', '7');
    if (days && !isNaN(days) && parseInt(days) > 0) {
      try {
        await tenantService.extendTrial(id, parseInt(days));
        alert(`Trial berhasil diperpanjang ${days} hari`);
        fetchTenantData();
      } catch (error) {
        console.error('Error extending trial:', error);
        alert('Gagal memperpanjang trial');
      }
    }
  };

  const handleGenerateVerificationLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await tenantService.generateVerificationLink(id);
      
      if (response.success) {
        const { whatsapp_url, whatsapp_message } = response.data;
        
        // Copy message to clipboard
        await navigator.clipboard.writeText(whatsapp_message);
        
        // Open WhatsApp
        window.open(whatsapp_url, '_blank');
        
        alert('Pesan telah disalin ke clipboard dan WhatsApp dibuka!');
      }
    } catch (error) {
      console.error('Error generating verification link:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal membuat link verifikasi');
      }
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyVerificationMessage = async () => {
    try {
      setGeneratingLink(true);
      const response = await tenantService.generateVerificationLink(id);
      
      if (response.success) {
        const { whatsapp_message } = response.data;
        
        // Copy message to clipboard
        await navigator.clipboard.writeText(whatsapp_message);
        alert('Pesan verifikasi telah disalin ke clipboard!');
      }
    } catch (error) {
      console.error('Error generating verification message:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Gagal membuat pesan verifikasi');
      }
    } finally {
      setGeneratingLink(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'trial': { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        text: 'Trial'
      },
      'active': { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        text: 'Aktif'
      },
      'inactive': { 
        color: 'bg-gray-100 text-gray-800 border border-gray-200', 
        text: 'Tidak Aktif'
      },
      'suspended': { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        text: 'Ditangguhkan'
      }
    };
    
    const config = statusConfig[status] || { 
      color: 'bg-gray-100 text-gray-800 border border-gray-200', 
      text: status
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getSubscriptionBadge = (subscriptionStatus) => {
    const statusConfig = {
      'trial': { 
        color: 'bg-blue-100 text-blue-800 border border-blue-200', 
        text: 'Trial'
      },
      'active': { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        text: 'Aktif'
      },
      'expired': { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        text: 'Kadaluarsa'
      },
      'cancelled': { 
        color: 'bg-gray-100 text-gray-800 border border-gray-200', 
        text: 'Dibatalkan'
      }
    };
    
    const config = statusConfig[subscriptionStatus] || { 
      color: 'bg-gray-100 text-gray-800 border border-gray-200', 
      text: subscriptionStatus
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-y-auto font-montserrat">
        <div className="max-w-7xl mx-auto pb-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div>
                  <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Information Skeleton */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-5 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>

              {/* Subscription Information Skeleton */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Statistics Skeleton */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-6 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-montserrat">
        <div className="text-center bg-white rounded-lg shadow-sm border p-8 max-w-md mx-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Tenant tidak ditemukan</h3>
          <p className="text-gray-600 mb-6">Tenant yang Anda cari tidak ditemukan.</p>
          <AnimatedButton
            onClick={() => navigate('/tenants')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Kembali ke daftar tenant
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <AnimatedButton
              onClick={() => navigate('/tenant-list')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaArrowLeft className="text-lg" />
            </AnimatedButton>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{tenant.business_name}</h1>
              <p className="text-sm text-gray-600">Pemilik: {tenant.owner_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            {getStatusBadge(tenant.status)}
            {getSubscriptionBadge(tenant.subscription_status)}
            {/* Verification Status Badge */}
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
              tenant.is_verified 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {tenant.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
            </span>
          </div>

          {/* Action Buttons */}
          <WithRole allowedRoles={['superapp-superadmin']}>
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Aksi</h2>
              {/* Debug: Log button validation logic */}
              {console.log('🔍 TenantDetail - Button validation:', {
                status: tenant.status,
                is_verified: tenant.is_verified,
                showActivateButton: tenant.status === 'trial' && tenant.is_verified,
                showSuspendButton: tenant.status === 'active',
                showExtendTrialButton: tenant.status === 'trial' && tenant.is_verified,
                showVerificationButtons: !tenant.is_verified,
                showReactivateButton: tenant.status === 'suspended'
              })}
              <div className="flex flex-wrap gap-3">
                <AnimatedButton
                  onClick={handleEdit}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
                >
                  Edit
                </AnimatedButton>
                {/* Activate button - only for verified trial tenants */}
                {tenant.status === 'trial' && tenant.is_verified && (
                  <AnimatedButton
                    onClick={handleActivate}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Aktifkan
                  </AnimatedButton>
                )}
                
                {/* Suspend button - only for active tenants */}
                {tenant.status === 'active' && (
                  <AnimatedButton
                    onClick={handleSuspend}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                  >
                    Tangguhkan
                  </AnimatedButton>
                )}
                
                {/* Extend trial button - only for verified trial tenants */}
                {tenant.status === 'trial' && tenant.is_verified && (
                  <AnimatedButton
                    onClick={handleExtendTrial}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Perpanjang Trial
                  </AnimatedButton>
                )}
                
                {/* Verification buttons - only show if tenant is NOT verified */}
                {!tenant.is_verified && (
                  <>
                    <AnimatedButton
                      onClick={handleGenerateVerificationLink}
                      disabled={generatingLink}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FaWhatsapp className="text-sm" />
                      {generatingLink ? 'Membuat...' : 'Kirim ke WhatsApp'}
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleCopyVerificationMessage}
                      disabled={generatingLink}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FaCopy className="text-sm" />
                      Copy Pesan
                    </AnimatedButton>
                  </>
                )}
                
                {/* Reactivate button - for suspended tenants */}
                {tenant.status === 'suspended' && (
                  <AnimatedButton
                    onClick={handleActivate}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Aktifkan Kembali
                  </AnimatedButton>
                )}
              </div>
            </div>
          </WithRole>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Informasi Bisnis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Nama Bisnis
                  </label>
                  <p className="text-base font-semibold text-gray-900">{tenant.business_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Kota
                  </label>
                  <p className="text-base font-semibold text-gray-900">{tenant.city || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Pemilik
                  </label>
                  <p className="text-base font-semibold text-gray-900">{tenant.owner_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-base font-semibold text-gray-900">{tenant.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Telepon
                  </label>
                  <p className="text-base font-semibold text-gray-900">{tenant.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    Trial Berakhir
                  </label>
                  <p className="text-base font-semibold text-gray-900">{formatDate(tenant.trial_end_date)}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Alamat Lengkap
                </label>
                <p className="text-base font-semibold text-gray-900">{tenant.address}</p>
              </div>
            </div>

            {/* Subscription Information */}
            {tenant.subscriptions && tenant.subscriptions.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Informasi Langganan</h3>
                {tenant.subscriptions.map((subscription, index) => (
                  <div key={index} className="bg-gray-50 border rounded-lg p-6 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Paket
                        </label>
                        <p className="text-base font-semibold text-gray-900">{subscription.plan?.name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Status
                        </label>
                        <p className="text-base font-semibold text-gray-900">{subscription.status}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Mulai
                        </label>
                        <p className="text-base font-semibold text-gray-900">{formatDate(subscription.start_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Berakhir
                        </label>
                        <p className="text-base font-semibold text-gray-900">{formatDate(subscription.end_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Harga
                        </label>
                        <p className="text-base font-semibold text-gray-900">Rp {subscription.final_price?.toLocaleString('id-ID') || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Auto Renew
                        </label>
                        <p className="text-base font-semibold text-gray-900">{subscription.auto_renew ? 'Ya' : 'Tidak'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            {stats && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Statistik</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total Cabang</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.total_branches}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total User</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.total_users}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total Customer</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.total_customers}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total Order</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-600">Order 30 Hari</span>
                    <span className="text-lg font-semibold text-gray-900">{stats.recent_orders}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <WithRole allowedRoles={['superapp-superadmin']}>
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Aksi Cepat</h3>
                <div className="space-y-3">
                  <AnimatedButton
                    onClick={() => navigate(`/tenants/${id}/dashboard`)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-left px-4 py-3 rounded-lg border border-blue-200 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Lihat Dashboard</p>
                      <p className="text-sm text-gray-600">Analisis performa bisnis</p>
                    </div>
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => navigate(`/tenants/${id}/stats`)}
                    className="w-full bg-green-50 hover:bg-green-100 text-left px-4 py-3 rounded-lg border border-green-200 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Lihat Statistik</p>
                      <p className="text-sm text-gray-600">Data detail dan tren</p>
                    </div>
                  </AnimatedButton>
                  {/* Extend trial - only for verified trial tenants */}
                  {tenant.status === 'trial' && tenant.is_verified && (
                    <AnimatedButton
                      onClick={handleExtendTrial}
                      className="w-full bg-orange-50 hover:bg-orange-100 text-left px-4 py-3 rounded-lg border border-orange-200 transition-colors duration-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">Perpanjang Trial</p>
                        <p className="text-sm text-gray-600">Tambah waktu percobaan</p>
                      </div>
                    </AnimatedButton>
                  )}
                </div>
              </div>
            </WithRole>
          </div>
        </div>
        </div>
      </div>
  );
};

export default TenantDetail;
