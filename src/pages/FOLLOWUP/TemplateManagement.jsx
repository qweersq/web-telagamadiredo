import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, MessageSquare, FileText } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile, getTenantBusinessName } from '../../utils/userProfileHelper';

const TemplateManagement = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // State management
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState('');

  // User data state
  const [userRole, setUserRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [businessName, setBusinessName] = useState('NAMA_BISNIS');

  // State untuk modal penjelasan

  // Removed MAX_TEMPLATES limit

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch business name on mount
  useEffect(() => {
    const fetchBusinessName = async () => {
      const tenantBusinessName = await getTenantBusinessName();
      if (tenantBusinessName) {
        setBusinessName(tenantBusinessName);
      }
    };
    fetchBusinessName();
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadTemplates();
    }
  }, [tenantId]);

  useEffect(() => {
    initializeData();
  }, []);

  // API Functions
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;

      return {
        id: profile.user?.id,
        tenant_id: profile.tenant?.id,
        role: profile.user?.role
      };
    } catch (error) {
      console.error('[ERROR] TemplateManagement - Failed to get userData:', error);
      return null;
    }
  };

  const initializeData = async () => {
    try {
      const userData = await getUserData();
      if (!userData) return;

      setUserRole(userData.role);
      setTenantId(userData.tenant_id);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const loadTemplates = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const params = {
        is_active: true,
        category: 'followup', // Only get followup templates
        tenant_id: tenantId
      };

      const response = await instance.get('/followup-templates', { params });

      if (response.data.success && response.data.data.templates) {
        setTemplates(response.data.data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback mock data
      setTemplates([
        {
          id: 17,
          name: 'followup_7_days',
          title: 'Follow-up 7 Hari',
          category: 'followup',
          description: 'Template follow-up setelah 7 hari',
          template_content: 'Halo {customer_name}! 😊\n\nGimana kabarnya? Sepatu yang kemarin sudah dicuci di {business_name} masih bersih kan?',
          variables: ['customer_name', 'business_name', 'branch_name'],
          is_active: true,
          created_at: '2025-09-29T07:59:27.000Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template) => {
    try {
      const sampleData = {
        customer_name: 'John Doe',
        business_name: businessName,
        branch_name: 'Jakarta Selatan',
        days_since_last_order: '15',
        last_order_date: '2025-09-14',
        total_orders: '3'
      };

      const response = await instance.post(`/followup-templates/${template.id}/preview`, {
        sample_data: sampleData
      });

      if (response.data.success && response.data.data.preview) {
        setPreviewContent(response.data.data.preview.processed_content);
        setSelectedTemplate(template);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      // Fallback to raw template content
      setPreviewContent(template.template_content.replace(/{(\w+)}/g, (match, variable) => {
        const values = {
          customer_name: 'John Doe',
          business_name: businessName,
          branch_name: 'Jakarta Selatan'
        };
        return values[variable] || match;
      }));
      setSelectedTemplate(template);
      setShowPreviewModal(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await instance.delete(`/followup-templates/${selectedTemplate.id}`);
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
      setShowDeleteModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Gagal menghapus template: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle explanation modal confirmation

  // Handle explanation modal close

  const getCategoryColor = (category) => {
    const colors = {
      followup: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCharacterCount = (content) => {
    return content ? content.length : 0;
  };

  const canCreateMore = true; // No limit

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Template WA Follow-Up"
        description="Template WA untuk follow-up"
        showBackButton={true}
        currentTime={currentTime}
        backPath="/berandaowner"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-24 pb-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Template Info */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Template Follow-Up</h3>
                    <p className="text-xs text-gray-500">Kelola template WhatsApp</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">{templates.length}</div>
                  <div className="text-xs text-gray-500">template</div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-6 flex gap-3">
              {/* Add Button - Primary */}
              {canCreateMore && (
                <button
                  onClick={() => navigate('/followup/templates/create')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span>Buat Template WA</span>
                </button>
              )}

            </div>

            {/* Templates List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  DAFTAR TEMPLATE
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <div key={template.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                          {/* Title & Category */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 font-montserrat">
                              {template.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                                🔔 {template.category}
                              </div>
                              <span className="text-xs text-gray-500">
                                {template.variables?.length || 0} variables
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 font-montserrat mb-2 line-clamp-2">
                            {template.description || 'Tidak ada deskripsi'}
                          </p>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-montserrat">
                            <div>
                              Dibuat: {new Date(template.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Section - Desktop & Mobile */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                          {/* Preview Button */}
                          <AnimatedButton
                            onClick={() => handlePreview(template)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors text-xs font-medium min-w-[90px]"
                            title="Preview template"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </AnimatedButton>

                          {/* Edit & Delete Buttons */}
                          <div className="flex items-center gap-2">
                            <AnimatedButton
                              onClick={() => navigate(`/followup/templates/${template.id}`)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors text-xs font-medium min-w-[80px]"
                              title="Edit template"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </AnimatedButton>

                            <AnimatedButton
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowDeleteModal(true);
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors text-xs font-medium min-w-[80px]"
                              title="Hapus template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                      Belum Ada Template
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                      Buat template pertama untuk follow-up WhatsApp otomatis
                    </p>

                    <AnimatedButton
                      onClick={() => navigate('/followup/templates/create')}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                      variant="blue"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Template Pertama
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col max-h-[85vh]">
            <div className="p-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Preview Template
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  {selectedTemplate?.title}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Preview dengan data sample
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {previewContent}
                </div>
              </div>
            </div>

            <div className="p-4 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <AnimatedButton
                onClick={() => setShowPreviewModal(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col max-h-[85vh]">
            <div className="p-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Hapus Template
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              <p className="text-gray-700">
                Apakah Anda yakin ingin menghapus template <strong>"{selectedTemplate?.title}"</strong>?
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <AnimatedButton
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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

export default TemplateManagement;

