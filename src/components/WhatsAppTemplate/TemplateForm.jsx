import { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const TemplateForm = ({ 
  template = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    category: 'invoice',
    description: '',
    template_content: '',
    variables: [],
    is_active: true,
    is_default: false,
    branch_id: null
  });

  const [availableVariables, setAvailableVariables] = useState([]);
  const [selectedVariables, setSelectedVariables] = useState([]);

  const categories = [
    { value: 'invoice', label: 'Invoice' },
    { value: 'item_done', label: 'Item Selesai' },
    { value: 'delivery', label: 'Pengantaran' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'notification', label: 'Notifikasi' },
    { value: 'promotion', label: 'Promosi' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'other', label: 'Lainnya' }
  ];

  const commonVariables = [
    { key: 'customer_name', label: 'Nama Customer' },
    { key: 'customer_phone', label: 'Nomor HP Customer' },
    { key: 'order_number', label: 'Nomor Order' },
    { key: 'tenant_name', label: 'Nama Tenant' },
    { key: 'branch_name', label: 'Nama Cabang' },
    { key: 'branch_address', label: 'Alamat Cabang' },
    { key: 'current_date', label: 'Tanggal Saat Ini' },
    { key: 'current_time', label: 'Waktu Saat Ini' },
    { key: 'greeting', label: 'Salam (Pagi/Siang/Sore/Malam)' }
  ];

  const categorySpecificVariables = {
    invoice: [
      { key: 'total_amount', label: 'Total Tagihan' },
      { key: 'total_paid', label: 'Total Dibayar' },
      { key: 'remaining_amount', label: 'Sisa Tagihan' },
      { key: 'payment_status', label: 'Status Pembayaran' },
      { key: 'invoice_url', label: 'Link Invoice' }
    ],
    item_done: [
      { key: 'item_name', label: 'Nama Item' },
      { key: 'treatment_name', label: 'Nama Treatment' }
    ],
    delivery: [
      { key: 'delivery_type', label: 'Jenis Pengiriman' },
      { key: 'driver_name', label: 'Nama Driver' },
      { key: 'estimated_time', label: 'Estimasi Waktu' }
    ],
    pickup: [
      { key: 'pickup_type', label: 'Jenis Pickup' },
      { key: 'driver_name', label: 'Nama Driver' },
      { key: 'estimated_time', label: 'Estimasi Waktu' }
    ]
  };

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        title: template.title || '',
        category: template.category || 'invoice',
        description: template.description || '',
        template_content: template.template_content || '',
        variables: template.variables || [],
        is_active: template.is_active !== undefined ? template.is_active : true,
        is_default: template.is_default || false,
        branch_id: template.branch_id || null
      });
      setSelectedVariables(template.variables || []);
    }
  }, [template]);

  useEffect(() => {
    const variables = [
      ...commonVariables,
      ...(categorySpecificVariables[formData.category] || [])
    ];
    setAvailableVariables(variables);
  }, [formData.category]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVariableToggle = (variable) => {
    setSelectedVariables(prev => {
      const isSelected = prev.includes(variable.key);
      if (isSelected) {
        return prev.filter(v => v !== variable.key);
      } else {
        return [...prev, variable.key];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      variables: selectedVariables
    });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template_content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable.key}}}` + after;
      
      setFormData(prev => ({
        ...prev,
        template_content: newText
      }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.key.length + 4, start + variable.key.length + 4);
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Informasi Dasar</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Template *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama template"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Template *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan judul template"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan deskripsi template"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Template Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Konten Template</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konten Template *
          </label>
          <textarea
            id="template_content"
            value={formData.template_content}
            onChange={(e) => handleInputChange('template_content', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Masukkan konten template. Gunakan {{variable}} untuk variable dinamis."
            rows={8}
            required
          />
        </div>

        {/* Variable Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variable yang Tersedia
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableVariables.map((variable) => (
              <button
                key={variable.key}
                type="button"
                onClick={() => insertVariable(variable)}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {variable.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Variables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variable yang Dipilih
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedVariables.map((variableKey) => {
              const variable = availableVariables.find(v => v.key === variableKey);
              return (
                <span
                  key={variableKey}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                >
                  {variable?.label || variableKey}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Pengaturan</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Template Aktif</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => handleInputChange('is_default', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Template Default untuk Kategori</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <AnimatedButton
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : (template ? 'Update Template' : 'Buat Template')}
        </AnimatedButton>
        
        <AnimatedButton
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Batal
        </AnimatedButton>
      </div>
    </form>
  );
};

export default TemplateForm;
