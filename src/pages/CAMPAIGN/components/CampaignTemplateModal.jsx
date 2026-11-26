import { useState, useEffect } from "react";
import instance from "../../../config/api";
import AnimatedButton from "../../../components/Design/AnimatedButton";

const CampaignTemplateModal = ({ isOpen, onClose, onSelectTemplate, selectedTemplateId }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: null,
    template_content: '',
    variables: [],
    is_active: true,
    is_default: false
  });

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/whatsapp-templates?category=campaign&is_active=true');
      if (response.data.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract variables from template content
  const extractVariables = (content) => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  };

  const handleCreateTemplate = async () => {
    // Check template limit
    if (templates.length >= 5) {
      alert('❌ Maksimal 5 template per tenant!');
      return;
    }
    
    try {
      setLoading(true);
      
      // Extract variables from template content
      const extractedVariables = extractVariables(formData.template_content);
      
      const response = await instance.post('/whatsapp-templates', {
        ...formData,
        variables: extractedVariables,
        category: 'campaign'
      });
      
      if (response.data.success) {
        alert('✅ Template berhasil dibuat!');
        setShowCreateModal(false);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setLoading(true);
      
      // Extract variables from template content
      const extractedVariables = extractVariables(formData.template_content);
      
      const response = await instance.put(`/whatsapp-templates/${editingTemplate.id}`, {
        ...formData,
        variables: extractedVariables,
        category: 'campaign'
      });
      
      if (response.data.success) {
        alert('✅ Template berhasil diupdate!');
        setEditingTemplate(null);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
    
    try {
      setLoading(true);
      const response = await instance.delete(`/whatsapp-templates/${templateId}`);
      
      if (response.data.success) {
        alert('✅ Template berhasil dihapus!');
        loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: null,
      template_content: '',
      variables: [],
      is_active: true,
      is_default: false
    });
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      description: null,
      template_content: template.template_content,
      variables: template.variables || [],
      is_active: template.is_active,
      is_default: template.is_default
    });
  };

  const closeEditModal = () => {
    setEditingTemplate(null);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold font-montserrat">Campaign Templates</h3>
          <div className="flex items-center gap-3">
            <AnimatedButton
              onClick={() => setShowCreateModal(true)}
              disabled={templates.length >= 5}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-montserrat ${
                templates.length >= 5
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {templates.length >= 5 ? 'Maksimal 5 Template' : '+ Tambah'}
            </AnimatedButton>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 font-montserrat">Memuat templates...</p>
            </div>
          ) : templates.length > 0 ? (
            templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                  selectedTemplateId === template.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {selectedTemplateId === template.id ? (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800 font-montserrat">{template.title}</h4>
                      {template.is_default && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-montserrat">
                          Default
                        </span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-montserrat">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-montserrat mb-3 line-clamp-2">
                      {template.template_content}
                    </p>
                    {template.description && (
                      <p className="text-xs text-gray-500 font-montserrat mb-3">
                        {template.description}
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(template);
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-montserrat"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-montserrat"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-montserrat">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mb-2">Tidak ada template tersedia</p>
              <p className="text-sm text-gray-400">Buat template campaign pertama Anda</p>
            </div>
          )}
        </div>

        {/* Template Count Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-montserrat">
            📊 Batasan Template: {templates.length}/5 
            {templates.length >= 5 && (
              <span className="text-red-600 font-semibold ml-2">(Maksimal tercapai)</span>
            )}
          </p>
        </div>

        {/* Create/Edit Template Modal */}
        {(showCreateModal || editingTemplate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold font-montserrat">
                  {editingTemplate ? 'Edit Template' : 'Buat Template Baru'}
                </h4>
                <button
                  onClick={editingTemplate ? closeEditModal : () => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Nama Template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                    placeholder="Contoh: PROMO LEBARAN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Konten Template *
                  </label>
                  <textarea
                    value={formData.template_content}
                    onChange={(e) => setFormData({...formData, template_content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat h-32"
                    placeholder="Halo {customer_name}! Promo Ramadhan 2024... Gunakan {variable} untuk personalisasi"
                  />
                  <p className="text-xs text-gray-500 font-montserrat mt-1">
                    Gunakan {'{{customer_name}}'}, {'{{business_name}}'} untuk personalisasi. Variables akan otomatis terdeteksi.
                  </p>
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingTemplate ? closeEditModal : () => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-montserrat"
                >
                  Batal
                </button>
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={loading || !formData.name || !formData.template_content}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-montserrat"
                >
                  {loading ? 'Menyimpan...' : (editingTemplate ? 'Update' : 'Buat Template')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignTemplateModal;
