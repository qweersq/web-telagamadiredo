import { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const TemplatePreview = ({ 
  template, 
  onClose, 
  onEdit 
}) => {
  const [previewData, setPreviewData] = useState({});
  const [processedContent, setProcessedContent] = useState('');

  const sampleData = {
    customer_name: 'John Doe',
    customer_phone: '081234567890',
    order_number: 'KAT20250115001',
    tenant_name: 'NotaSepatu Laundry',
    branch_name: 'Cabang Grindulu',
    branch_address: 'Jl. Grindulu No. 123, Jakarta',
    current_date: new Date().toLocaleDateString('id-ID'),
    current_time: new Date().toLocaleTimeString('id-ID'),
    greeting: 'Pagi',
    total_amount: 'Rp 50.000',
    total_paid: 'Rp 25.000',
    remaining_amount: 'Rp 25.000',
    payment_status: 'DP',
    invoice_url: 'https://invoice.katsikat.id/123',
    item_name: 'Sepatu Nike Air Max',
    treatment_name: 'Deep Clean',
    delivery_type: 'Kurir',
    driver_name: 'Ahmad',
    estimated_time: '30 menit',
    pickup_type: 'Kurir',
  };

  useEffect(() => {
    if (template) {
      // Initialize preview data with sample data
      const initialData = {};
      template.variables?.forEach(variable => {
        initialData[variable] = sampleData[variable] || `{{${variable}}}`;
      });
      setPreviewData(initialData);
    }
  }, [template]);

  useEffect(() => {
    if (template && template.template_content) {
      let content = template.template_content;
      
      // Replace variables with preview data
      Object.keys(previewData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, previewData[key]);
      });
      
      setProcessedContent(content);
    }
  }, [template, previewData]);

  const handleVariableChange = (variable, value) => {
    setPreviewData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const getVariableLabel = (variable) => {
    const labels = {
      customer_name: 'Nama Customer',
      customer_phone: 'Nomor HP Customer',
      order_number: 'Nomor Order',
      tenant_name: 'Nama Tenant',
      branch_name: 'Nama Cabang',
      branch_address: 'Alamat Cabang',
      current_date: 'Tanggal Saat Ini',
      current_time: 'Waktu Saat Ini',
      greeting: 'Salam',
      total_amount: 'Total Tagihan',
      total_paid: 'Total Dibayar',
      remaining_amount: 'Sisa Tagihan',
      payment_status: 'Status Pembayaran',
      invoice_url: 'Link Invoice',
      item_name: 'Nama Item',
      treatment_name: 'Nama Treatment',
      delivery_type: 'Jenis Pengiriman',
      driver_name: 'Nama Driver',
      estimated_time: 'Estimasi Waktu',
      pickup_type: 'Jenis Pickup'
    };
    return labels[variable] || variable;
  };

  if (!template) return null;

  return (
    <div className="space-y-4">
      {/* Template Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{template.title}</h3>
            <p className="text-sm text-gray-600">{template.name}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mt-1">
              {template.category}
            </span>
          </div>
          <div className="flex gap-2">
            <AnimatedButton
              onClick={onEdit}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </AnimatedButton>
            <AnimatedButton
              onClick={onClose}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Tutup
            </AnimatedButton>
          </div>
        </div>
        
        {template.description && (
          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
        )}
      </div>

      {/* Variable Inputs */}
      {template.variables && template.variables.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900">Preview Data</h4>
          <div className="grid grid-cols-1 gap-3">
            {template.variables.map((variable) => (
              <div key={variable}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getVariableLabel(variable)}
                </label>
                <input
                  type="text"
                  value={previewData[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder={`Masukkan ${getVariableLabel(variable).toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-gray-900">Preview Pesan</h4>
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
            {processedContent || template.template_content}
          </div>
        </div>
      </div>

      {/* WhatsApp Preview */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-gray-900">Tampilan WhatsApp</h4>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">W</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">WhatsApp Business</p>
              <p className="text-xs text-gray-500">Sekarang</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
              {processedContent || template.template_content}
            </div>
          </div>
        </div>
      </div>

      {/* Template Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Pengaturan Template</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {template.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Default:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              template.is_default ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {template.is_default ? 'Ya' : 'Tidak'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Branch:</span>
            <span className="ml-2 text-gray-900">
              {template.branch_id ? `Branch ${template.branch_id}` : 'Semua Branch'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Variables:</span>
            <span className="ml-2 text-gray-900">
              {template.variables?.length || 0} variable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
