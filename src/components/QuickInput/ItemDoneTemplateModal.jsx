import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Eye, AlertCircle } from 'lucide-react';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';

const ItemDoneTemplateModal = ({ 
  show, 
  onClose, 
  order,
  onTemplateUpdated 
}) => {
  const textareaRef = useRef(null);
  const [templateContent, setTemplateContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [tenantName, setTenantName] = useState('NotaSepatu');
  const [existingTemplateId, setExistingTemplateId] = useState(null);

  const category = 'item_done';

  // Available variables untuk item done
  const availableVariables = [
    { key: 'greeting', label: 'Greeting (Selamat pagi/siang/sore/malam)' },
    { key: 'customer_name', label: 'Nama Customer' },
    { key: 'tenant_name', label: 'Nama Bisnis' },
    { key: 'order_number', label: 'Nomor Order' },
    { key: 'item_name', label: 'Nama Item' },
    { key: 'treatment_name', label: 'Nama Treatment' },
    { key: 'item_description', label: 'Deskripsi Item (Treatment + Item)' }
  ];

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // Initialize: Get user data dan load template
  useEffect(() => {
    if (show) {
      initializeData();
    }
  }, [show]);

  const initializeData = async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.tenant?.id) {
        setTenantId(profile.tenant.id);
        setBranchId(profile.branch?.id);
        setTenantName(profile.tenant?.business_name || 'NotaSepatu');
        await loadTemplate(profile.tenant.id, profile.branch?.id);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Gagal memuat data');
    }
  };

  // Load template dari backend
  const loadTemplate = async (tenantId, branchId) => {
    setIsLoading(true);
    setError(null);
    try {
      // Coba fetch dari whatsapp-templates available endpoint
      const response = await instance.get(`/whatsapp-templates/available/${category}`);
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Sort berdasarkan updated_at terbaru, lalu ambil yang pertama
        const sortedTemplates = [...response.data.data].sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0);
          const dateB = new Date(b.updated_at || b.created_at || 0);
          return dateB - dateA; // Descending (terbaru di atas)
        });
        const template = sortedTemplates[0];
        let content = template.template_content || '';
        
        // Fix: Hapus "Selamat " di awal sebelum {{greeting}} untuk menghindari double "Selamat"
        content = content.replace(/^Selamat\s+\{\{greeting\}\}/i, '{{greeting}}');
        content = content.replace(/Selamat\s+\{\{greeting\}\}/g, '{{greeting}}');
        
        console.log('📝 Loaded template from DB:', content);
        setTemplateContent(content);
        
        // Simpan ID template yang sudah ada (bukan system template) untuk update
        if (!template.is_system && template.id) {
          setExistingTemplateId(template.id);
        } else {
          setExistingTemplateId(null);
        }
      } else {
        // Jika tidak ada template, gunakan default
        const defaultContent = getDefaultTemplate();
        console.log('📝 Using default template:', defaultContent);
        setTemplateContent(defaultContent);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      // Fallback ke default template
      const defaultContent = getDefaultTemplate();
      console.log('📝 Error loading, using default template:', defaultContent);
      setTemplateContent(defaultContent);
    } finally {
      setIsLoading(false);
    }
  };

  // Get default template
  const getDefaultTemplate = () => {
    return `{{greeting}} Kak {{customer_name}}, item kakak yang {{item_description}} sudah selesai, terima kasih 🙏`;
  };

  // Prepare variables dari order data
  const prepareVariables = () => {
    if (!order) return {};

    const orderDetails = order.order_details || [];
    
    // Build item descriptions (sama seperti generateMessageTemplate)
    const descriptions = orderDetails.map(detail => {
      const treatmentName = detail.treatment?.name || 'Item';
      const itemName = detail.item?.name;
      const itemBrand = detail.item?.brand;
      
      if (itemName) {
        const itemDesc = itemBrand ? `${itemBrand} ${itemName}` : itemName;
        return `${treatmentName} (${itemDesc})`;
      }
      return treatmentName;
    });
    
    // Get unique descriptions
    const uniqueDesc = [...new Set(descriptions)].join(', ');
    
    // Get first item for item_name and treatment_name
    const firstDetail = orderDetails[0];
    const itemName = firstDetail?.item?.name || '';
    const itemBrand = firstDetail?.item?.brand || '';
    const fullItemName = itemBrand ? `${itemBrand} ${itemName}` : itemName;
    const treatmentName = firstDetail?.treatment?.name || '';

    return {
      greeting: getGreeting(),
      customer_name: order.customer?.name || '',
      tenant_name: tenantName,
      order_number: order.id || order.payment?.code || '',
      item_name: fullItemName,
      treatment_name: treatmentName,
      item_description: uniqueDesc
    };
  };

  // Process template dengan variables
  const processTemplate = (content, variables) => {
    if (!content) return '';
    let processed = content;
    // Process variables yang ada di template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    // Hapus variabel yang tidak ter-process (biarkan kosong atau hapus)
    processed = processed.replace(/\{\{[\w_]+\}\}/g, '');
    return processed;
  };

  // Preview template
  const handlePreview = () => {
    setIsPreviewing(true);
    console.log('🔍 Preview - Current templateContent:', templateContent);
    const variables = prepareVariables();
    console.log('🔍 Preview - Variables:', variables);
    const processed = processTemplate(templateContent, variables);
    console.log('🔍 Preview - Processed:', processed);
    setPreviewContent(processed);
  };

  // Insert variable ke template
  const handleInsertVariable = (variableKey) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const variableText = `{{${variableKey}}}`;
      const newText = before + variableText + after;
      
      // Update content
      setTemplateContent(newText);
      
      // Set cursor position setelah variable
      // Gunakan requestAnimationFrame untuk memastikan DOM sudah ter-update
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            // Posisi cursor = start + panjang variable yang di-insert
            const newPosition = start + variableText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      });
    } else {
      // Fallback jika textarea tidak ditemukan
      setTemplateContent(templateContent + `{{${variableKey}}}`);
    }
  };

  // Save template
  const handleSave = async () => {
    if (!tenantId || !branchId) {
      setError('Tenant ID atau Branch ID tidak ditemukan');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Extract variables dari template content
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables = [];
      let match;
      while ((match = variableRegex.exec(templateContent)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      // Cek apakah template sudah ada, jika ada update, jika tidak create
      let response;
      if (existingTemplateId) {
        // Update existing template
        response = await instance.put(`/whatsapp-templates/${existingTemplateId}`, {
          name: `${category}_branch_${branchId}`,
          category: category,
          title: 'Template Item Done',
          description: 'Template untuk notifikasi item selesai',
          template_content: templateContent,
          variables: variables,
          branch_id: branchId,
          is_active: true
        });
      } else {
        // Create new template
        response = await instance.post(`/whatsapp-templates`, {
          name: `${category}_branch_${branchId}`,
          category: category,
          title: 'Template Item Done',
          description: 'Template untuk notifikasi item selesai',
          template_content: templateContent,
          variables: variables,
          branch_id: branchId,
          is_active: true
        });
        
        // Simpan ID template yang baru dibuat untuk update selanjutnya
        if (response.data.success && response.data.data?.id) {
          setExistingTemplateId(response.data.data.id);
        }
      }

      if (response.data.success) {
        alert('Template berhasil disimpan!');
        // Trigger callback untuk update message text di parent
        if (onTemplateUpdated) {
          onTemplateUpdated();
        }
      } else {
        throw new Error('Gagal menyimpan template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error.response?.data?.error?.message || error.message || 'Gagal menyimpan template');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset ke default
  const handleReset = () => {
    if (confirm('Yakin ingin reset ke template default?')) {
      setTemplateContent(getDefaultTemplate());
      setEditMode(true);
    }
  };

  if (!show) return null;

  const variables = prepareVariables();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-montserrat">Custom Template Item Done</h3>
            <p className="text-sm text-gray-600 font-montserrat mt-1">Atur format pesan notifikasi item selesai</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 font-montserrat">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Variable Picker */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                  Variables Tersedia:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => handleInsertVariable(variable.key)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium font-montserrat transition-colors"
                      title={variable.label}
                    >
                      {variable.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Editor */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700 font-montserrat">
                    Template Content:
                  </label>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-montserrat"
                  >
                    Reset Default
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={templateContent}
                  onChange={(e) => {
                    console.log('📝 Template content changed:', e.target.value);
                    setTemplateContent(e.target.value);
                  }}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm resize-none"
                  placeholder="Masukkan template dengan variables seperti {{customer_name}}"
                />
              </div>

              {/* Preview */}
              {isPreviewing && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-green-800 font-montserrat">
                      Preview:
                    </label>
                    <button
                      onClick={() => setIsPreviewing(false)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-green-900 font-montserrat whitespace-pre-wrap">
                    {previewContent}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          {/* Preview Button - Tidak sejajar */}
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="w-full mb-3 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-montserrat font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          
          {/* Tutup dan Simpan - Sejajar */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-montserrat font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-montserrat font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDoneTemplateModal;

