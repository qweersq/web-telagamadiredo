import { useState } from 'react';
import AnimatedButton from '../Design/AnimatedButton';
import TemplateModal from './TemplateModal';

const TestSendModal = ({ 
  isOpen, 
  onClose, 
  template 
}) => {
  const [testData, setTestData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  const getVariablesFromContent = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
  };

  const processContent = (content, data) => {
    let processed = content;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, data[key]);
    });
    return processed;
  };

  const handleInputChange = (variable, value) => {
    setTestData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleTestSend = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResult({
        success: true,
        message: 'Pesan test berhasil dikirim!',
        phone: testData.customer_phone || sampleData.customer_phone,
        content: processContent(template.template_content, { ...sampleData, ...testData })
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Gagal mengirim pesan test. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTestData({});
    setResult(null);
    onClose();
  };

  if (!template) return null;

  const variables = getVariablesFromContent(template.template_content);
  const processedContent = processContent(template.template_content, { ...sampleData, ...testData });

  return (
    <TemplateModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Test Kirim: ${template.title}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Info Box */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900 mb-1">Test Kirim Pesan</h3>
              <p className="text-xs text-yellow-700 leading-relaxed">
                Fitur ini akan mengirim pesan test ke nomor yang Anda masukkan. 
                Gunakan data dummy untuk melihat bagaimana pesan akan terlihat.
              </p>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Template: {template.title}</h3>
          <p className="text-xs text-gray-600">{template.name}</p>
        </div>

        {/* Variable Inputs */}
        {variables.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Data Test</h3>
            <div className="grid grid-cols-1 gap-3">
              {variables.map((variable) => (
                <div key={variable}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    value={testData[variable] || sampleData[variable] || ''}
                    onChange={(e) => handleInputChange(variable, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder={`Masukkan ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Preview Pesan</h3>
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
                {processedContent}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                result.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-3 h-3 ${result.success ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  {result.success ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
              </div>
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.message}
              </p>
            </div>
            {result.success && result.phone && (
              <p className="text-xs text-green-700 mt-2">
                Dikirim ke: {result.phone}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <AnimatedButton
            onClick={handleTestSend}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengirim...' : '📱 Test Kirim Pesan'}
          </AnimatedButton>
          
          <AnimatedButton
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Tutup
          </AnimatedButton>
        </div>
      </div>
    </TemplateModal>
  );
};

export default TestSendModal;
