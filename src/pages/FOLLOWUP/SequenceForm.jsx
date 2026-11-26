import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, MessageSquare, Eye, Save, CheckCircle, Info, ArrowLeft, Edit } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile, getTenantBusinessName } from '../../utils/userProfileHelper';
import { formatWATemplateStepDisplay } from '../../utils/labelFormatter';

const SequenceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const [templates, setTemplates] = useState([
    {
      id: null,
      step_number: 1,
      delay_days: 7,
      template_id: '',
      send_time: '09:00',
      template: null
    }
  ]);

  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [availableVariables, setAvailableVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [previewCustomer, setPreviewCustomer] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplateData, setPreviewTemplateData] = useState(null);
  const [businessName, setBusinessName] = useState('NAMA_BISNIS');

  // API Integration Functions
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      
      return {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };
    } catch (error) {
      console.error('[ERROR] SequenceForm - Failed to get userData from API:', error);
      return null;
    }
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const userData = await getUserData();
      
      const params = {
        is_active: true,
        limit: 100
      };

      // Add tenant and branch isolation
      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get('/followup-templates', { params });
      
      if (response.data.success && response.data.data.templates) {
        setAvailableTemplates(response.data.data.templates);
        return response.data.data.templates;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to mock data jika API gagal
      const mockTemplates = [
        { 
          id: 17, 
          name: 'followup_7_days', 
          title: 'Follow-up 7 Hari', 
          category: 'followup',
          description: 'Template follow-up setelah 7 hari',
          template_content: 'Halo {customer_name}! 😊\n\nGimana kabarnya? Sepatu yang kemarin sudah dicuci di {business_name} masih bersih kan?',
          variables: ['customer_name', 'business_name', 'branch_name'],
          is_active: true
        },
        { 
          id: 18, 
          name: 'followup_14_days', 
          title: 'Follow-up 14 Hari', 
          category: 'followup',
          description: 'Template follow-up setelah 14 hari',
          template_content: 'Halo {customer_name}! 🌟\n\nSudah 2 minggu nih sejak terakhir cuci sepatu di {business_name}. Gimana sepatu nya?',
          variables: ['customer_name', 'business_name', 'days_since_last_order'],
          is_active: true
        },
        { 
          id: 19, 
          name: 'followup_30_days', 
          title: 'Follow-up 30 Hari', 
          category: 'followup',
          description: 'Template follow-up setelah 30 hari',
          template_content: 'Halo {customer_name}! 👋\n\nSudah sebulan nih! Sepatu nya masih oke kan? Yuk cuci lagi di {business_name}!',
          variables: ['customer_name', 'business_name'],
          is_active: true
        },
        { 
          id: 20, 
          name: 'promo_special', 
          title: 'Promo Spesial', 
          category: 'promotion',
          description: 'Template untuk promosi khusus',
          template_content: 'Halo {customer_name}! 🎉\n\nAda promo spesial nih di {business_name}! Diskon 20% untuk cuci sepatu!',
          variables: ['customer_name', 'business_name', 'promo_code'],
          is_active: true
        }
      ];
      setAvailableTemplates(mockTemplates);
      return mockTemplates;
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchAvailableVariables = async () => {
    try {
      const response = await instance.get('/followup-templates/utils/variables');

      if (response.data.success && response.data.data.variables) {
        setAvailableVariables(response.data.data.variables);
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
      // Fallback variables
      setAvailableVariables([
        { key: 'customer_name', label: 'Nama Customer', type: 'text', required: true },
        { key: 'business_name', label: 'Nama Bisnis', type: 'text', required: true },
        { key: 'branch_name', label: 'Nama Cabang', type: 'text', required: true },
        { key: 'days_since_last_order', label: 'Hari Sejak Order Terakhir', type: 'number', required: false }
      ]);
    }
  };

  const previewTemplate = async (templateId, sampleData = null) => {
    try {
      const defaultSampleData = {
        customer_name: 'John Doe',
        business_name: businessName,
        branch_name: 'Jakarta Selatan',
        days_since_last_order: '15',
        last_order_date: '2025-09-14',
        total_orders: '3'
      };

      const response = await instance.post(`/followup-templates/${templateId}/preview`, {
        sample_data: sampleData || defaultSampleData
      });

      if (response.data.success && response.data.data.preview) {
        setTemplatePreviews(prev => ({
          ...prev,
          [templateId]: response.data.data.preview
        }));
        return response.data.data.preview;
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
    return null;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load templates and variables on component mount
    Promise.all([
      fetchTemplates(),
      fetchAvailableVariables()
    ]).then(async () => {
      if (isEdit) {
        loadSequenceData();
      }

      // Get business name for dynamic template variables
      const tenantBusinessName = await getTenantBusinessName();
      if (tenantBusinessName) {
        setBusinessName(tenantBusinessName);
      }
    });
  }, [id, isEdit]);

  const loadSequenceData = async () => {
    setLoading(true);
    try {
      const response = await instance.get(`/followup-sequences/${id}`);
      
      if (response.data.success && response.data.data) {
        const sequenceData = response.data.data;
        
        // Set form data
        setFormData({
          name: sequenceData.name,
          description: sequenceData.description || '',
          is_active: sequenceData.is_active
        });

        // Map sequence templates with actual template data from API response
        if (sequenceData.templates && sequenceData.templates.length > 0) {
          const mappedTemplates = sequenceData.templates.map(seqTemplate => {
            // Use template data from API response directly
            const templateData = seqTemplate.template;
            
            return {
              id: seqTemplate.id,
              step_number: seqTemplate.step_number,
              delay_days: seqTemplate.delay_days,
              template_id: seqTemplate.template_id.toString(),
              send_time: seqTemplate.send_time.substring(0, 5), // Remove seconds
              template: templateData ? {
                id: templateData.id,
                name: templateData.name,
                title: templateData.title,
                template_content: templateData.template_content,
                variables: templateData.variables,
                category: 'followup' // Default category for existing templates
              } : null
            };
          });

          setTemplates(mappedTemplates);

          // Generate previews for existing templates
          mappedTemplates.forEach(template => {
            if (template.template_id && template.template) {
              previewTemplate(parseInt(template.template_id));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading sequence:', error);
      
      // Fallback to mock data for development
      if (id === '1') {
        setFormData({
          name: 'Default Follow-up Sequence',
          description: 'Sequence follow-up default untuk semua customer',
          is_active: true
        });
        
        // Use real templates dari API
        const template17 = availableTemplates.find(t => t.id === 17);
        const template18 = availableTemplates.find(t => t.id === 18);
        
        setTemplates([
          {
            id: 1,
            step_number: 1,
            delay_days: 7,
            template_id: '17',
            send_time: '09:00',
            template: template17
          },
          {
            id: 2,
            step_number: 2,
            delay_days: 14,
            template_id: '18',
            send_time: '10:00',
            template: template18
          }
        ]);

        // Generate previews for existing templates
        if (template17) previewTemplate(17);
        if (template18) previewTemplate(18);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = async (index, field, value) => {
    setTemplates(prev => prev.map((template, i) => {
      if (i === index) {
        const updated = { ...template, [field]: value };
        if (field === 'template_id') {
          updated.template = availableTemplates.find(t => t.id === parseInt(value));
          // Auto-generate preview when template is selected
          if (value) {
            previewTemplate(parseInt(value));
          }
        }
        return updated;
      }
      return template;
    }));
  };

  const addTemplate = () => {
    const newStepNumber = Math.max(...templates.map(t => t.step_number)) + 1;
    const newDelayDays = templates.length > 0 ? templates[templates.length - 1].delay_days + 7 : 7;
    
    setTemplates(prev => [...prev, {
      id: null,
      step_number: newStepNumber,
      delay_days: newDelayDays,
      template_id: '',
      send_time: '09:00',
      template: null
    }]);
  };

  const removeTemplate = (index) => {
    if (templates.length > 1) {
      setTemplates(prev => prev.filter((_, i) => i !== index));
    }
  };

  const openTemplateModal = (index) => {
    setEditingTemplateIndex(index);
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplateIndex(null);
  };

  const handlePreviewSingleTemplate = async (templateId) => {
    if (!templateId) return;
    
    try {
      const sampleData = {
        customer_name: 'John Doe',
        business_name: businessName,
        branch_name: 'Jakarta Selatan',
        days_since_last_order: '15',
        last_order_date: '2025-09-14',
        total_orders: '3'
      };

      const response = await instance.post(`/followup-templates/${templateId}/preview`, {
        sample_data: sampleData
      });

      if (response.data.success && response.data.data.preview) {
        const template = availableTemplates.find(t => t.id === parseInt(templateId));
        setPreviewTemplateData({
          template: template,
          preview: response.data.data.preview
        });
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      // Fallback preview
      const template = availableTemplates.find(t => t.id === parseInt(templateId));
      if (template) {
        const fallbackContent = template.template_content.replace(/{(\w+)}/g, (match, variable) => {
          const values = {
            customer_name: 'John Doe',
            business_name: businessName,
            branch_name: 'Jakarta Selatan'
          };
          return values[variable] || match;
        });
        
        setPreviewTemplateData({
          template: template,
          preview: {
            processed_content: fallbackContent,
            character_count: fallbackContent.length
          }
        });
        setShowPreviewModal(true);
      }
    }
  };

  const handlePreview = async () => {
    // Set sample customer data
    const sampleCustomer = {
      name: 'John Doe',
      phone: '081234567890',
      last_order: '2025-09-22'
    };
    
    setPreviewCustomer(sampleCustomer);

    // Generate previews for all templates in sequence
    const previewPromises = templates.map(async (template) => {
      if (template.template_id) {
        return await previewTemplate(parseInt(template.template_id));
      }
      return null;
    });

    try {
      await Promise.all(previewPromises);
    } catch (error) {
      console.error('Error generating previews:', error);
    }
  };

  const handleSave = async (activate = false) => {
    setLoading(true);
    try {
      const userData = await getUserData();
      
      const sequenceData = {
        ...formData,
        is_active: activate ? true : formData.is_active
      };

      // Add tenant and branch isolation
      if (userData?.tenant_id) {
        sequenceData.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        sequenceData.branch_id = userData.branch_id;
      }

      let sequenceResponse;
      
      if (isEdit) {
        // Update existing sequence
        sequenceResponse = await instance.put(`/followup-sequences/${id}`, sequenceData);
      } else {
        // Create new sequence
        sequenceResponse = await instance.post('/followup-sequences', sequenceData);
      }

      if (sequenceResponse.data.success) {
        const sequenceId = sequenceResponse.data.data.id;

        // Save templates to sequence
        const templatePromises = templates.map(async (template, index) => {
          if (template.template_id) {
            const templateData = {
              step_number: index + 1,
              delay_days: template.delay_days,
              template_id: parseInt(template.template_id),
              send_time: template.send_time + ':00', // Add seconds
              is_active: true
            };

            if (isEdit && template.id) {
              // Update existing template
              return instance.put(`/followup-sequences/templates/${template.id}`, templateData);
            } else {
              // Add new template
              return instance.post(`/followup-sequences/${sequenceId}/templates`, templateData);
            }
          }
        });

        await Promise.all(templatePromises.filter(Boolean));
        
        console.log('✅ Sequence saved successfully');
        navigate('/followup/sequences');
      }
    } catch (error) {
      console.error('Error saving sequence:', error);
      // TODO: Show error notification to user
    } finally {
      setLoading(false);
    }
  };

  const getTemplateColor = (category) => {
    const colors = {
      followup: 'bg-blue-100 text-blue-800 border-blue-200',
      reminder: 'bg-green-100 text-green-800 border-green-200',
      promotion: 'bg-pink-100 text-pink-800 border-pink-200',
      notification: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDaysSuffix = (days) => {
    if (days === 1) return 'hari';
    return 'hari';
  };

  if (loading && isEdit) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data sequence...</p>
        </div>
      </div>
    );
  }

  if (templatesLoading && availableTemplates.length === 0) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title={isEdit ? 'Edit Sequence' : 'Buat Sequence Baru'}
        description={isEdit ? 'Ubah pengaturan sequence follow-up' : 'Atur sequence follow-up otomatis'}
        showBackButton={true}
        currentTime={currentTime}
        backPath="/followup/sequences"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-24 pb-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Progress Indicator */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">Step 1: Info Dasar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">Step 2: Template</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">Step 3: Preview</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {availableTemplates.length} template tersedia • {templates.length} step dikonfigurasi
              </div>
            </div>

            {/* Section 1: Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                    📝 INFORMASI SEQUENCE
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Sequence *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="Contoh: Follow-up Customer Baru"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.is_active}
                        onChange={() => handleInputChange('is_active', true)}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={!formData.is_active}
                        onChange={() => handleInputChange('is_active', false)}
                        className="text-gray-500 focus:ring-gray-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Draft</span>
                    </label>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                    placeholder="Jelaskan tujuan dan target sequence ini..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Templates Timeline */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-3 h-3 text-purple-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 font-montserrat tracking-wide">
                    ⏰ JADWAL FOLLOW-UP
                  </h3>
                </div>
                <AnimatedButton
                  onClick={addTemplate}
                  className="px-3 py-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs"
                  variant="purple"
                >
                  <Plus className="w-3 h-3" />
                  Tambah
                </AnimatedButton>
              </div>

              <div className="space-y-2">
                {templates.map((template, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Step Number */}
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {template.step_number}
                        </div>
                        
                        {/* Compact Info */}
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const displayData = formatWATemplateStepDisplay(template);
                            if (!displayData) return null;
                            
                            return (
                              <>
                                <div className="flex items-center gap-2 text-sm min-w-0">
                                  <span className="font-medium text-gray-700 whitespace-nowrap">
                                    {displayData.dayLabel}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600 min-w-0 max-w-[200px]">
                                    {(() => {
                                      const words = displayData.templateTitle.split(' ');
                                      if (words.length <= 3) {
                                        return displayData.templateTitle;
                                      }
                                      return words.slice(0, 3).join(' ') + '...';
                                    })()}
                                  </span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500 text-xs whitespace-nowrap">
                                    {displayData.timeLabel}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1 mt-1">
                                  {displayData.isConfigured && (
                                    <AnimatedButton
                                      onClick={() => handlePreviewSingleTemplate(template.template_id)}
                                      className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-50 rounded-md transition-colors text-xs"
                                      title="Preview pesan template"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Preview</span>
                                    </AnimatedButton>
                                  )}
                                  
                                  <AnimatedButton
                                    onClick={() => openTemplateModal(index)}
                                    className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-xs"
                                    title="Edit step"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </AnimatedButton>
                                  
                                  {templates.length > 1 && (
                                    <AnimatedButton
                                      onClick={() => removeTemplate(index)}
                                      className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors text-xs"
                                      title="Hapus step"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </AnimatedButton>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Preview */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Timeline Preview
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {templates.map((template, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Hari {template.delay_days}
                      </div>
                      {index < templates.length - 1 && (
                        <div className="text-blue-400">→</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Total durasi: {Math.max(...templates.map(t => t.delay_days))} hari
                </p>
              </div>
            </div>

            {/* Section 3: Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Save className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  💾 SIMPAN SEQUENCE
                </h3>
              </div>

              <div className="space-y-3">
                <AnimatedButton
                  onClick={() => handleSave(false)}
                  disabled={loading || !formData.name}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan sebagai Draft'}
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={() => handleSave(true)}
                  disabled={loading || !formData.name || templates.some(t => !t.template_id)}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  variant="green"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan & Aktifkan'}
                </AnimatedButton>
              </div>

              {/* Validation Messages */}
              {!formData.name && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">⚠️ Nama sequence harus diisi</p>
                </div>
              )}
              
              {templates.some(t => !t.template_id) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">⚠️ Semua step harus memiliki template</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Template Detail Modal */}
      {showTemplateModal && editingTemplateIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit Step {templates[editingTemplateIndex]?.step_number}
                </h3>
                <button
                  onClick={closeTemplateModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Delay Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari ke-*
                  </label>
                  <input
                    type="number"
                    value={templates[editingTemplateIndex]?.delay_days || ''}
                    onChange={(e) => handleTemplateChange(editingTemplateIndex, 'delay_days', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    min="1"
                    max="365"
                    placeholder="Contoh: 7"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pesan akan dikirim setelah X hari dari order terakhir
                  </p>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Pesan *
                  </label>
                  <select
                    value={templates[editingTemplateIndex]?.template_id || ''}
                    onChange={(e) => handleTemplateChange(editingTemplateIndex, 'template_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={templatesLoading}
                  >
                    <option value="">
                      {templatesLoading ? 'Loading templates...' : 'Pilih template...'}
                    </option>
                    {availableTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} • {t.category} • {t.variables?.length || 0} variables
                      </option>
                    ))}
                  </select>
                </div>

                {/* Send Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Kirim *
                  </label>
                  <input
                    type="time"
                    value={templates[editingTemplateIndex]?.send_time || ''}
                    onChange={(e) => handleTemplateChange(editingTemplateIndex, 'send_time', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Waktu optimal pengiriman pesan
                  </p>
                </div>
                
                {/* Template Info */}
                {templates[editingTemplateIndex]?.template && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Template</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTemplateColor(templates[editingTemplateIndex].template.category)}`}>
                          {templates[editingTemplateIndex].template.category === 'followup' && '🔔'}
                          {templates[editingTemplateIndex].template.category === 'promotion' && '🎯'}
                          {templates[editingTemplateIndex].template.category === 'notification' && '📢'}
                          {templates[editingTemplateIndex].template.category}
                        </div>
                        <span className="text-xs text-gray-500">
                          {templates[editingTemplateIndex].template.variables?.length || 0} variables
                        </span>
                      </div>
                      
                      {/* Template Description */}
                      {templates[editingTemplateIndex].template.description && (
                        <p className="text-sm text-gray-600">
                          {templates[editingTemplateIndex].template.description}
                        </p>
                      )}
                      
                      {/* Variables List */}
                      {templates[editingTemplateIndex].template.variables && templates[editingTemplateIndex].template.variables.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {templates[editingTemplateIndex].template.variables.map(variable => (
                              <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {variable}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Preview Content */}
                      {templatePreviews[templates[editingTemplateIndex].template_id] && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-blue-800 mb-2">Preview Pesan:</div>
                          <div className="text-sm text-blue-700 mb-2 max-h-32 overflow-y-auto">
                            {templatePreviews[templates[editingTemplateIndex].template_id].processed_content}
                          </div>
                          <div className="text-xs text-blue-600">
                            {templatePreviews[templates[editingTemplateIndex].template_id].character_count} karakter
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <AnimatedButton
                  onClick={closeTemplateModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  onClick={closeTemplateModal}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Simpan
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Template Modal */}
      {showPreviewModal && previewTemplateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
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
                  {previewTemplateData.template?.title}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Preview dengan data sample customer
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-800">WhatsApp Message</span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 mb-3">
                  {previewTemplateData.preview?.processed_content}
                </div>
                <div className="text-xs text-green-600">
                  {previewTemplateData.preview?.character_count} karakter
                </div>
              </div>
              
              {previewTemplateData.template?.variables && previewTemplateData.template.variables.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-2">Variables yang digunakan:</p>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplateData.template.variables.map(variable => (
                      <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

export default SequenceForm;
