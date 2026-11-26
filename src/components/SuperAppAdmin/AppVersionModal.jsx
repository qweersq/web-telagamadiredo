import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AppVersionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  version = null, 
  mode = 'create' 
}) => {
  const [formData, setFormData] = useState({
    platform: 'android',
    version: '',
    version_code: '',
    min_required_version: '',
    force_update: false,
    update_message: '',
    features: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && version) {
      setFormData({
        platform: version.platform || 'android',
        version: version.version || '',
        version_code: version.version_code || '',
        min_required_version: version.min_required_version || '',
        force_update: version.force_update || false,
        update_message: version.update_message || '',
        features: Array.isArray(version.features) ? version.features.join('\n') : '',
        is_active: version.is_active !== undefined ? version.is_active : true
      });
    } else {
      setFormData({
        platform: 'android',
        version: '',
        version_code: '',
        min_required_version: '',
        force_update: false,
        update_message: '',
        features: '',
        is_active: true
      });
    }
    setErrors({});
  }, [version, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.platform) newErrors.platform = 'Platform wajib diisi';
    if (!formData.version) newErrors.version = 'Version wajib diisi';
    if (!formData.min_required_version) newErrors.min_required_version = 'Min required version wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        version_code: formData.version_code ? parseInt(formData.version_code) : null,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : []
      };
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Tambah App Version' : 'Edit App Version'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform *
            </label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
            {errors.platform && <p className="text-red-500 text-sm mt-1">{errors.platform}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version *
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              placeholder="1.0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.version && <p className="text-red-500 text-sm mt-1">{errors.version}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version Code (Android)
            </label>
            <input
              type="number"
              name="version_code"
              value={formData.version_code}
              onChange={handleChange}
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Required Version *
            </label>
            <input
              type="text"
              name="min_required_version"
              value={formData.min_required_version}
              onChange={handleChange}
              placeholder="1.0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.min_required_version && <p className="text-red-500 text-sm mt-1">{errors.min_required_version}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="force_update"
              checked={formData.force_update}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Force Update (Wajib Update)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Update Message
            </label>
            <textarea
              name="update_message"
              value={formData.update_message}
              onChange={handleChange}
              rows={3}
              placeholder="Pesan update untuk user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features (satu per baris)
            </label>
            <textarea
              name="features"
              value={formData.features}
              onChange={handleChange}
              rows={4}
              placeholder="Fitur baru 1&#10;Fitur baru 2&#10;Fitur baru 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppVersionModal;

