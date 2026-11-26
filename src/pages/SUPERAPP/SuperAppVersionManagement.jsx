import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import appVersionService from '../../services/appVersionService';
import AppVersionModal from '../../components/SuperAppAdmin/AppVersionModal';

const SuperAppVersionManagement = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    fetchVersions();
  }, [platformFilter]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await appVersionService.getAllVersions(platformFilter || null);
      setVersions(response.data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      alert('Gagal memuat data versi aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedVersion(null);
    setShowModal(true);
  };

  const handleEdit = (version) => {
    setModalMode('edit');
    setSelectedVersion(version);
    setShowModal(true);
  };

  const handleDelete = async (id, version) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus versi "${version}"?`)) {
      try {
        await appVersionService.deleteVersion(id);
        alert('Versi berhasil dihapus');
        fetchVersions();
      } catch (error) {
        console.error('Error deleting version:', error);
        alert('Gagal menghapus versi');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (modalMode === 'create') {
        await appVersionService.createVersion(formData);
        alert('Versi berhasil ditambahkan');
      } else {
        await appVersionService.updateVersion(selectedVersion.id, formData);
        alert('Versi berhasil diupdate');
      }
      fetchVersions();
    } catch (error) {
      throw error;
    }
  };

  const getPlatformBadge = (platform) => {
    const colors = {
      android: 'bg-green-100 text-green-800',
      ios: 'bg-gray-100 text-gray-800',
      web: 'bg-blue-100 text-blue-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const filteredVersions = versions.filter(v => {
    if (!platformFilter) return true;
    return v.platform === platformFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/superapp-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">App Version Management</h1>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Tambah Version
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Platform</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : filteredVersions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Tidak ada data versi aplikasi</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Required</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Force Update</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVersions.map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformBadge(version.platform)}`}>
                        {version.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{version.version}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{version.version_code || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{version.min_required_version}</td>
                    <td className="px-4 py-3">
                      {version.force_update ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Ya</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Tidak</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {version.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(version)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(version.id, version.version)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <AppVersionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedVersion(null);
        }}
        onSubmit={handleSubmit}
        version={selectedVersion}
        mode={modalMode}
      />
    </div>
  );
};

export default SuperAppVersionManagement;

