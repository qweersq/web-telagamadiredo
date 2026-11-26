import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import { getUserProfile, invalidateUserProfileCache, clearUserProfileCache } from '../../utils/userProfileHelper';
import ProfileEditModal from '../../components/Modal/ProfileEditModal';
import api from '../../config/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Building,
  Edit2,
  Trash2,
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getUserProfile();

      if (!profileData) {
        throw new Error('Profile data not found');
      }

      setUserData(profileData.user || null);
      setBranchData(profileData.branch || null);
      setTenantData(profileData.tenant || null);
    } catch (error) {
      console.error('❌ ProfilePage - Error fetching profile:', error);
      setUserData(null);
      setBranchData(null);
      setTenantData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role) => {
    const roleMap = {
      'superadmin': 'Owner',
      'admin': 'Admin',
      'employee': 'Karyawan',
      'teknisi': 'Teknisi',
      'kurir': 'Kurir',
      'qc': 'QC',
      'kasir': 'Kasir',
    };
    return roleMap[role] || role;
  };

  const formatStatus = (status) => {
    const statusMap = {
      'active': 'Aktif',
      'inactive': 'Tidak Aktif',
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#10B981' : '#EF4444';
  };

  const handleEditSuccess = () => {
    // Invalidate cache to force refresh
    invalidateUserProfileCache();
    // Refetch profile data
    fetchProfile();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus akun ini?\n\n' +
      'Akun akan dinonaktifkan dan Anda akan keluar dari aplikasi.\n\n' +
      'Tindakan ini tidak dapat dibatalkan.'
    );
    if (!confirmed) return;

    try {
      await api.delete('/delete-account');
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      clearUserProfileCache();

      // Redirect to login
      navigate('/login');
    } catch (error) {
      alert('Gagal menghapus akun: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBerandaOwner
          showBackButton={true}
          hideUserMenu={true}
          title="Profile"
          description="Data diri Anda"
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-montserrat text-sm">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBerandaOwner
          showBackButton={true}
          hideUserMenu={true}
          title="Profile"
          description="Data diri Anda"
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <User size={64} className="text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-900 font-montserrat font-bold text-lg">Data tidak ditemukan</p>
            <p className="mt-2 text-gray-600 font-montserrat text-sm">Gagal memuat data profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBerandaOwner
        showBackButton={true}
        hideUserMenu={true}
        title="Profile"
        description="Data diri Anda"
        backPath="-1"

      />

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Data Diri Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4 mt-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 font-montserrat">Data Diri</h3>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
            >
              <Edit2 size={14} />
              Edit
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <User size={16} className="text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-montserrat mb-1">Nama</p>
              <p className="text-sm font-semibold text-gray-900 font-montserrat">{userData.name || '-'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <Mail size={16} className="text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-montserrat mb-1">Email</p>
              <p className="text-sm font-semibold text-gray-900 font-montserrat">{userData.email || '-'}</p>
            </div>
          </div>

          {userData.phone && (
            <div className="flex items-start gap-3 mb-4">
              <Phone size={16} className="text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-montserrat mb-1">Telepon</p>
                <p className="text-sm font-semibold text-gray-900 font-montserrat">{userData.phone}</p>
              </div>
            </div>
          )}

          {userData.address && (
            <div className="flex items-start gap-3 mb-4">
              <MapPin size={16} className="text-gray-500 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-montserrat mb-1">Alamat</p>
                <p className="text-sm font-semibold text-gray-900 font-montserrat">{userData.address}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <Calendar size={16} className="text-gray-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-montserrat mb-1">Role</p>
              <p className="text-sm font-semibold text-gray-900 font-montserrat">
                {formatRole(userData.role || userData.user_role)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="mt-1" style={{ color: getStatusColor(userData.status) }} />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-montserrat mb-1">Status</p>
              <p className="text-sm font-semibold font-montserrat" style={{ color: getStatusColor(userData.status) }}>
                {formatStatus(userData.status)}
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Bisnis & Cabang Card */}
        {(tenantData || branchData) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-4">Informasi Bisnis & Outlet</h3>

            {tenantData && tenantData.business_name && (
              <div className="flex items-start gap-3 mb-4">
                <Building size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Nama Bisnis</p>
                  <p className="text-sm font-semibold text-gray-900 font-montserrat">{tenantData.business_name}</p>
                </div>
              </div>
            )}

            {branchData && branchData.name && (
              <div className="flex items-start gap-3 mb-4">
                <Building size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Nama Cabang</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 font-montserrat">{branchData.name}</p>
                    {branchData.branch_type === 'main' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase">
                        Outlet
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase">
                        Droppoint
                      </span>
                    )}
                  </div>

                  {branchData.branch_type === 'mitra' && branchData.parentRelation?.parentBranch && (
                    <p className="text-xs text-gray-500 mt-1">
                      Outlet Utama: <span className="font-semibold text-gray-700">{branchData.parentRelation.parentBranch.name}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {branchData && branchData.address && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Alamat Cabang</p>
                  <p className="text-sm font-semibold text-gray-900 font-montserrat">{branchData.address}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informasi Tambahan Card */}
        {(userData.salary || userData.salary_date || userData.createdAt) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-4">Informasi Tambahan</h3>

            {userData.salary && (
              <div className="flex items-start gap-3 mb-4">
                <Calendar size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Gaji</p>
                  <p className="text-sm font-semibold text-gray-900 font-montserrat">{formatCurrency(userData.salary)}</p>
                </div>
              </div>
            )}

            {userData.salary_date && (
              <div className="flex items-start gap-3 mb-4">
                <Calendar size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Tanggal Gaji</p>
                  <p className="text-sm font-semibold text-gray-900 font-montserrat">{formatDate(userData.salary_date)}</p>
                </div>
              </div>
            )}

            {userData.createdAt && (
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-montserrat mb-1">Tanggal Bergabung</p>
                  <p className="text-sm font-semibold text-gray-900 font-montserrat">{formatDate(userData.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-5" />

        {/* Hapus Akun */}
        <div className="px-4">
          <button
            onClick={handleDeleteAccount}
            className="w-full py-3 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} className="text-red-600" />
            <span className="text-sm font-semibold font-montserrat text-red-700">Hapus Akun</span>
          </button>
          <p className="text-xs text-gray-400 font-montserrat text-center mt-2">
            Akun akan dinonaktifkan dan Anda akan keluar
          </p>
        </div>

        <div className="h-10" />
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userData={userData}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default ProfilePage;

