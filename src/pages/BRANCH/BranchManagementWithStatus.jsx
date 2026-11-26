import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Edit, Trash2, MapPin, Users } from 'lucide-react';
import Header from '../../components/Com Header/Header';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';

const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    manager_id: null,
    status: 'active'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get('/branches');
      setBranches(data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await instance.post('/branches', formData);
      setShowCreateModal(false);
      setFormData({ name: '', address: '', phone: '', city: '', manager_id: null, status: 'active' });
      fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Gagal membuat cabang baru');
    }
  };

  const handleEditBranch = async (e) => {
    e.preventDefault();
    try {
      await instance.put(`/branches/${editingBranch.id}`, formData);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', city: '', manager_id: null, status: 'active' });
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Gagal mengupdate cabang');
    }
  };

  const handleDeleteBranch = async () => {
    try {
      await instance.delete(`/branches/${branchToDelete.id}`);
      setShowDeleteModal(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Gagal menghapus cabang');
    }
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      city: branch.city,
      manager_id: branch.manager_id,
      status: branch.status || 'active'
    });
  };

  const openDeleteModal = (branch) => {
    setBranchToDelete(branch);
    setShowDeleteModal(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Tidak Aktif', color: 'bg-gray-100 text-gray-800' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'suspended', label: 'Ditangguhkan', color: 'bg-red-100 text-red-800' }
  ];

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat cabang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-montserrat">
      {/* Header */}
      <Header
        title="MANAJEMEN CABANG"
        showBackButton={true}
        onBackClick={() => navigate('/berandaowner')}
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
            
            {/* Back Button */}
            <div className="mb-6">
              <AnimatedButton
                onClick={() => navigate('/berandaowner')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                variant="grey"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Beranda
              </AnimatedButton>
            </div>

            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Manajemen Cabang</h1>
                <p className="text-sm font-montserrat text-gray-600 mt-1">
                  Kelola cabang-cabang bisnis Anda
                </p>
              </div>
              <AnimatedButton
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                variant="blue"
              >
                <Plus className="w-4 h-4" />
                Tambah Cabang
              </AnimatedButton>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari cabang..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Branches List */}
            <div className="space-y-4">
              {filteredBranches.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'Cabang tidak ditemukan' : 'Belum ada cabang'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Coba kata kunci lain' : 'Tambahkan cabang pertama Anda'}
                  </p>
                </div>
              ) : (
                filteredBranches.map((branch) => (
                  <div key={branch.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {branch.name}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{branch.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{branch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{branch.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(branch)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(branch.status).color}`}>
                        {getStatusInfo(branch.status).label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Dibuat: {new Date(branch.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-montserrat mb-4">Tambah Cabang Baru</h2>
            <form onSubmit={handleCreateBranch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Cabang
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <PhoneInputWithCountry
                  value={formData.phone}
                  onChange={(full) => setFormData({ ...formData, phone: full })}
                  label="Nomor Telepon"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <AnimatedButton
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl text-sm"
                  variant="grey"
                >
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl text-sm"
                  variant="blue"
                >
                  Simpan
                </AnimatedButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-montserrat mb-4">Edit Cabang</h2>
            <form onSubmit={handleEditBranch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Cabang
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <PhoneInputWithCountry
                  value={formData.phone}
                  onChange={(full) => setFormData({ ...formData, phone: full })}
                  label="Nomor Telepon"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <AnimatedButton
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="flex-1 py-2 px-4 rounded-xl text-sm"
                  variant="grey"
                >
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl text-sm"
                  variant="blue"
                >
                  Update
                </AnimatedButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-montserrat mb-4 text-red-600">Hapus Cabang</h2>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus cabang "{branchToDelete?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <AnimatedButton
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 rounded-xl text-sm"
                variant="grey"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={handleDeleteBranch}
                className="flex-1 py-2 px-4 rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white"
                variant="red"
              >
                Hapus
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
