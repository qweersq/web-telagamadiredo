import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Info, ArrowLeft, Type, Hash } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile, getTenantBusinessName } from '../../utils/userProfileHelper';

const TemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    template_content: '',
    variables: [],
    is_active: true
  });

  const [availableVariables] = useState([
    { key: 'customer_name', label: 'Nama Customer', required: true },
    { key: 'business_name', label: 'Nama Bisnis', required: true },
    { key: 'branch_name', label: 'Nama Cabang', required: true },
    { key: 'days_since_last_order', label: 'Hari Sejak Order Terakhir', required: false },
    { key: 'last_order_date', label: 'Tanggal Order Terakhir', required: false },
    { key: 'total_orders', label: 'Total Order Customer', required: false },
    { key: 'customer_phone', label: 'Nomor HP Customer', required: false },
    { key: 'branch_phone', label: 'Nomor Telepon Cabang', required: false },
    { key: 'branch_address', label: 'Alamat Cabang', required: false },
    { key: 'current_date', label: 'Tanggal Saat Ini', required: false },
    { key: 'current_time', label: 'Waktu Saat Ini', required: false }
  ]);

  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [characterCount, setCharacterCount] = useState(0);

  // User data state
  const [userRole, setUserRole] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [businessName, setBusinessName] = useState('NAMA_BISNIS');

  // Sample template data
  const sampleTemplates = [
    {
      title: "Contoh Template",
      content: `Halo {customer_name}! 😊

Gimana kabarnya? Sepatu yang kemarin sudah dicuci di {business_name} masih bersih kan?

Kalau ada yang kotor lagi, jangan sungkan untuk bawa ke kami ya! 

Terima kasih sudah percaya sama {business_name} 🙏`,
      description: "Template follow-up setelah 7 hari dari layanan terakhir"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    initializeData();
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
    if (isEdit && tenantId) {
      loadTemplateData();
    }
  }, [id, isEdit, tenantId]);

  useEffect(() => {
    setCharacterCount(formData.template_content.length);
  }, [formData.template_content]);

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
      console.error('[ERROR] TemplateForm - Failed to get userData:', error);
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


  const loadTemplateData = async () => {
    setLoading(true);
    try {
      const response = await instance.get(`/followup-templates/${id}`);
      
      if (response.data.success && response.data.data) {
        const template = response.data.data;
        setFormData({
          name: template.name,
          title: template.title,
          description: template.description || '',
          template_content: template.template_content,
          variables: Array.isArray(template.variables) ? template.variables : [],
          is_active: template.is_active
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Gagal memuat data template: ' + (error.response?.data?.message || error.message));
      navigate('/followup/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-detect variables in template content
    if (field === 'template_content') {
      const foundVariables = [];
      const variableRegex = /{(\w+)}/g;
      let match;
      
      while ((match = variableRegex.exec(value)) !== null) {
        const variable = match[1];
        if (!foundVariables.includes(variable)) {
          foundVariables.push(variable);
        }
      }
      
      setFormData(prev => ({ ...prev, variables: foundVariables }));
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template_content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.template_content;
    const newText = text.substring(0, start) + `{${variable}}` + text.substring(end);
    
    handleInputChange('template_content', newText);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 0);
  };

  const handlePreview = async () => {
    try {
      const sampleData = {
        customer_name: 'John Doe',
        business_name: businessName,
        branch_name: 'Jakarta Selatan',
        days_since_last_order: '15',
        last_order_date: '2025-09-14',
        total_orders: '3',
        customer_phone: '081234567890',
        branch_phone: '021-1234567',
        branch_address: 'Jl. Sudirman No. 123',
        current_date: new Date().toLocaleDateString('id-ID'),
        current_time: new Date().toLocaleTimeString('id-ID')
      };

      if (isEdit) {
        // Use API preview for existing template
        const response = await instance.post(`/followup-templates/${id}/preview`, {
          sample_data: sampleData
        });

        if (response.data.success && response.data.data.preview) {
          setPreviewContent(response.data.data.preview.processed_content);
        }
      } else {
        // Manual replacement for new template
        let processedContent = formData.template_content;
        Object.entries(sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`{${key}}`, 'g');
          processedContent = processedContent.replace(regex, value);
        });
        setPreviewContent(processedContent);
      }
      
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      // Fallback manual replacement
      let processedContent = formData.template_content;
      const sampleData = {
        customer_name: 'John Doe',
        business_name: businessName,
        branch_name: 'Jakarta Selatan'
      };
      
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      });
      
      setPreviewContent(processedContent);
      setShowPreviewModal(true);
    }
  };

  const handleSave = async () => {
    // Validation first (before setLoading)
    if (!formData.name.trim()) {
      alert('Nama template harus diisi');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('Judul template harus diisi');
      return;
    }
    
    if (!formData.template_content.trim()) {
      alert('Konten template harus diisi');
      return;
    }

    // Check if required variables are present
    const requiredVars = ['customer_name', 'business_name'];
    const missingRequired = requiredVars.filter(varName =>
      !Array.isArray(formData.variables) || !formData.variables.includes(varName)
    );
    
    if (missingRequired.length > 0) {
      alert(`Template harus mengandung variabel wajib: ${missingRequired.join(', ')}`);
      return;
    }


    setLoading(true);
    try {
      const userData = await getUserData();

      const templateData = {
        ...formData,
        category: 'followup', // Fixed category for follow-up templates
        name: formData.name.toLowerCase().replace(/\s+/g, '_'), // Auto-format name
      };

      // Add tenant isolation (no branch_id needed)
      if (userData?.tenant_id) {
        templateData.tenant_id = userData.tenant_id;
      }
      // Set branch_id to null for global templates
      templateData.branch_id = null;

      let response;
      
      if (isEdit) {
        response = await instance.put(`/followup-templates/${id}`, templateData);
      } else {
        response = await instance.post('/followup-templates', templateData);
      }

      if (response.data.success) {
        alert(isEdit ? 'Template berhasil diperbarui!' : 'Template berhasil dibuat!');
        navigate('/followup/templates');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Gagal menyimpan template: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateTemplateName = () => {
    if (formData.title) {
      const name = formData.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      handleInputChange('name', name);
    }
  };

  const loadSampleTemplate = (sampleIndex) => {
    const sample = sampleTemplates[sampleIndex];
    if (!sample) return;

    // Check if template_content has content and ask for confirmation
    if (formData.template_content.trim()) {
      const confirmed = window.confirm('Apakah Anda yakin ingin mengganti konten template yang sudah ada dengan template contoh?');
      if (!confirmed) return;
    }

    // Auto-detect variables in sample content
    const foundVariables = [];
    const variableRegex = /{(\w+)}/g;
    let match;
    
    while ((match = variableRegex.exec(sample.content)) !== null) {
      const variable = match[1];
      if (!foundVariables.includes(variable)) {
        foundVariables.push(variable);
      }
    }

    // Update both template_content and variables
    setFormData(prev => ({
      ...prev,
      template_content: sample.content,
      variables: foundVariables
    }));
  };

  const getVariableColor = (variable) => {
    const required = availableVariables.find(v => v.key === variable)?.required;
    return required ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  if (loading && isEdit) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data template...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title={isEdit ? 'Edit Template' : 'Buat Template Baru'}
        description="Template pesan WhatsApp untuk follow-up"
        showBackButton={true}
        currentTime={currentTime}
        backPath="/followup/templates"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-24 pb-6">
          <div className="max-w-4xl mx-auto space-y-6">


            {/* Form Sections */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Informasi Template
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Template *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    onBlur={generateTemplateName}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="Contoh: Follow-up 7 Hari"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Template (Sistem) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="followup_7_hari"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Huruf kecil, tanpa spasi, gunakan underscore
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="Jelaskan kapan template ini digunakan..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Template Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Type className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Konten Pesan
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Content */}
                <div className="lg:col-span-2 ">
                  <div className="flex flex  sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Konten Template *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {sampleTemplates.map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => loadSampleTemplate(index)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors whitespace-nowrap"
                          type="button"
                          title={sample.description}
                        >
                          <span className="">{sample.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="template_content"
                    value={formData.template_content}
                    onChange={(e) => handleInputChange('template_content', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="Halo {customer_name}! 😊&#10;&#10;Gimana kabarnya? Sepatu yang kemarin sudah dicuci di {business_name} masih bersih kan?"
                    rows={10}
                    required
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Gunakan {`{nama_variable}`} untuk data dinamis
                    </p>
                    <p className="text-xs text-gray-500">
                      {characterCount} karakter
                    </p>
                  </div>
                </div>

                {/* Available Variables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variabel Tersedia
                  </label>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable.key}
                        onClick={() => insertVariable(variable.key)}
                        className="w-full text-left p-2 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            {variable.label}
                          </span>
                          {variable.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <code className="text-xs text-blue-600 bg-blue-50 px-1 rounded">
                          {`{${variable.key}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detected Variables */}
              {Array.isArray(formData.variables) && formData.variables.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Variabel Terdeteksi:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable) => (
                      <span
                        key={variable}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVariableColor(variable)}`}
                      >
                        {variable}
                        {availableVariables.find(v => v.key === variable)?.required && ' *'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Preview & Simpan
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Template</h4>
                  <AnimatedButton
                    onClick={handlePreview}
                    disabled={!formData.template_content}
                    className="w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    Preview dengan Sample Data
                  </AnimatedButton>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Simpan Template</h4>
                  <AnimatedButton
                    onClick={handleSave}
                    disabled={loading || !formData.name || !formData.title || !formData.template_content}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="green"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Menyimpan...' : (isEdit ? 'Update Template' : 'Simpan Template')}
                  </AnimatedButton>
                </div>
              </div>

              {/* Validation Messages */}
              {(!Array.isArray(formData.variables) || !formData.variables.includes('customer_name') || !formData.variables.includes('business_name')) && formData.template_content && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Template harus mengandung variabel wajib: customer_name, business_name
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
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
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  {formData.title || 'Template Preview'}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Preview dengan data sample customer
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {previewContent}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Karakter: {previewContent.length}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
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
    </div>
  );
};

export default TemplateForm;
