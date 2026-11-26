import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import LoadingDots from '../../components/Design/LoadingDots';
import AnimatedButton from '../../components/Design/AnimatedButton';
import SimpleTemplateCard from '../../components/WhatsAppTemplate/SimpleTemplateCard';
import SimpleTemplateForm from '../../components/WhatsAppTemplate/SimpleTemplateForm';
import SimpleTemplatePreview from '../../components/WhatsAppTemplate/SimpleTemplatePreview';
import TemplateModal from '../../components/WhatsAppTemplate/TemplateModal';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';

const WhatsAppTemplateManagement = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSystemTemplates, setShowSystemTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  // Helper function untuk mendapatkan userData dari API
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      
      // Extract data yang dibutuhkan dari profile
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        branch_address: profile.branch?.address,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };
      
      console.log('✅ WhatsAppTemplateManagement - getUserData from API:', userData);
      return userData;
    } catch (error) {
      console.error('[ERROR] WhatsAppTemplateManagement - Failed to get userData from API:', error);
      return null;
    }
  };

  // Fetch templates
  const fetchTemplates = async (page = 1, search = '', category = '', isSystem = false) => {
    try {
      setLoading(true);
      const userData = await getUserData();
      
      if (!userData?.tenant_id) {
        console.error('Tenant ID not found');
        return;
      }

      const params = {
        page,
        pageSize: pagination.pageSize,
        search,
        category,
        is_system: isSystem,
        tenant_id: userData.tenant_id,
        branch_id: userData.branch_id
      };

      const response = await instance.get('/whatsapp-templates', { params });
      
      if (response.data?.success) {
        setTemplates(response.data.data.templates);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchTemplates(1, query, selectedCategory, showSystemTemplates);
  };

  // Handle category filter
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    fetchTemplates(1, searchQuery, category, showSystemTemplates);
  };

  // Handle system template filter
  const handleSystemFilter = (isSystem) => {
    setShowSystemTemplates(isSystem);
    fetchTemplates(1, searchQuery, selectedCategory, isSystem);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchTemplates(newPage, searchQuery, selectedCategory, showSystemTemplates);
  };

  // Create template
  const handleCreateTemplate = async (formData) => {
    try {
      setFormLoading(true);
      const userData = await getUserData();
      
      const response = await instance.post('/whatsapp-templates', {
        ...formData,
        tenant_id: userData.tenant_id,
        branch_id: userData.branch_id,
        created_by: userData.id
      });
      
      if (response.data?.success) {
        setShowCreateModal(false);
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Gagal membuat template');
    } finally {
      setFormLoading(false);
    }
  };

  // Update template
  const handleUpdateTemplate = async (formData) => {
    try {
      setFormLoading(true);
      const userData = await getUserData();
      
      const response = await instance.put(`/whatsapp-templates/${selectedTemplate.id}`, {
        ...formData,
        updated_by: userData.id
      });
      
      if (response.data?.success) {
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Gagal mengupdate template');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      return;
    }

    try {
      const response = await instance.delete(`/whatsapp-templates/${templateId}`);
      
      if (response.data?.success) {
        // Refresh templates
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Gagal menghapus template');
    }
  };

  // Duplicate template
  const handleDuplicateTemplate = async (template) => {
    try {
      const response = await instance.post(`/whatsapp-templates/${template.id}/duplicate`, {
        name: `${template.name} (Copy)`,
        title: `${template.title} (Copy)`
      });
      
      if (response.data?.success) {
        // Refresh templates
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Gagal menduplikasi template');
    }
  };

  // Set as default
  const handleSetDefault = async (templateId) => {
    try {
      const response = await instance.put(`/whatsapp-templates/${templateId}`, {
        is_default: true
      });
      
      if (response.data?.success) {
        // Refresh templates
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('Gagal mengatur template default');
    }
  };

  // Toggle active status
  const handleToggleActive = async (template) => {
    try {
      const response = await instance.put(`/whatsapp-templates/${template.id}`, {
        is_active: !template.is_active
      });
      
      if (response.data?.success) {
        // Refresh templates
        fetchTemplates(pagination.page, searchQuery, selectedCategory, showSystemTemplates);
      }
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Gagal mengubah status template');
    }
  };

  // Handle preview template
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  // Handle edit template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  // Handle close modals
  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPreviewModal(false);
    setSelectedTemplate(null);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const categories = [
    { value: '', label: 'Semua Kategori' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'item_done', label: 'Item Selesai' },
    { value: 'delivery', label: 'Pengantaran' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'notification', label: 'Notifikasi' },
    { value: 'promotion', label: 'Promosi' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'other', label: 'Lainnya' }
  ];


  return (
    <div className="h-screen overflow-y-auto font-montserrat">
      {/* Header */}
      <HeaderBerandaOwner
        title="Manajemen Template WhatsApp"
        description="Kelola template pesan WhatsApp untuk berbagai kategori"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      <div className="p-4 space-y-4 mt-14">
        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">Apa itu Template WhatsApp?</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Template adalah format pesan yang sudah disiapkan untuk dikirim ke customer. 
                Anda bisa membuat template untuk invoice, notifikasi item selesai, pengantaran, dll. 
                Gunakan tombol "Test Kirim" untuk melihat bagaimana pesan akan terlihat.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* System Template Filter */}
            <div className="sm:w-48">
              <select
                value={showSystemTemplates}
                onChange={(e) => handleSystemFilter(e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={false}>Custom Templates</option>
                <option value={true}>System Templates</option>
                <option value="">All Templates</option>
              </select>
            </div>

            {/* Create Button */}
            {!showSystemTemplates && (
              <AnimatedButton
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Buat Template
              </AnimatedButton>
            )}
          </div>
        </div>

        {/* Templates List */}
        <div className="bg-white rounded-xl shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingDots />
            </div>
          ) : (
            <div className="p-4">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Tidak ada template ditemukan</p>
                  <p className="text-sm text-gray-400 mt-1">Klik "Buat Template" untuk membuat template pertama</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <SimpleTemplateCard
                      key={template.id}
                      template={template}
                      onPreview={handlePreviewTemplate}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <AnimatedButton
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </AnimatedButton>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <AnimatedButton
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <TemplateModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        title="Buat Template Baru"
        size="xl"
      >
        <SimpleTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={handleCloseModals}
          loading={formLoading}
        />
      </TemplateModal>

      {/* Edit Template Modal */}
      <TemplateModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        title={`Edit Template: ${selectedTemplate?.title || ''}`}
        size="xl"
      >
        <SimpleTemplateForm
          template={selectedTemplate}
          onSubmit={handleUpdateTemplate}
          onCancel={handleCloseModals}
          loading={formLoading}
        />
      </TemplateModal>

      {/* Preview Template Modal */}
      <TemplateModal
        isOpen={showPreviewModal}
        onClose={handleCloseModals}
        title={`Preview Template: ${selectedTemplate?.title || ''}`}
        size="xl"
      >
        <SimpleTemplatePreview
          template={selectedTemplate}
          onClose={handleCloseModals}
          onEdit={handleEditTemplate}
        />
      </TemplateModal>
    </div>
  );
};

export default WhatsAppTemplateManagement;
