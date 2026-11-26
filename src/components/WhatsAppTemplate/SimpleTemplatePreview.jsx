import { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';
import TemplateModal from './TemplateModal';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../PhoneInput/PhoneInputWithCountry';

const SimpleTemplatePreview = ({ 
  template, 
  onClose, 
  onEdit 
}) => {
  const [testData, setTestData] = useState({});
  const [processedContent, setProcessedContent] = useState('');
  const [showTestSend, setShowTestSend] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [phoneError, setPhoneError] = useState('');

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

  // Validasi nomor WhatsApp
  // Handler untuk perubahan nomor telepon
  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    setPhoneError(validateFullPhone(value));
  };

  useEffect(() => {
    if (template) {
      // Initialize test data with sample data
      const initialData = {};
      template.variables?.forEach(variable => {
        initialData[variable] = sampleData[variable] || `{{${variable}}}`;
      });
      setTestData(initialData);
    }
  }, [template]);

  useEffect(() => {
    if (template && template.template_content) {
      let content = template.template_content;
      
      // Replace variables with test data
      Object.keys(testData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, testData[key]);
      });
      
      setProcessedContent(content);
    }
  }, [template, testData]);

  const handleVariableChange = (variable, value) => {
    setTestData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleTestSend = async () => {
    try {
      setLoading(true);
      setResult(null);

      const phoneErr = validateFullPhone(phoneNumber);
      if (phoneErr) { setPhoneError(phoneErr); setLoading(false); return; }

      // Get user data from API
      const profile = await getUserProfile();
      const userData = {
        id: profile?.user?.id,
        branch_id: profile?.branch?.id,
        branch_name: profile?.branch?.name,
        tenant_id: profile?.tenant?.id
      };
      
      if (!userData?.branch_id) {
        throw new Error('Branch ID tidak ditemukan');
      }

      // Get active session ID
      const sessionResponse = await instance.get('/wa-sessions/active-session', {
        params: {
          branchId: userData.branch_id,
          tenantId: userData.tenant_id
        }
      });

      if (!sessionResponse.data?.success) {
        throw new Error('Tidak ada session WhatsApp yang aktif');
      }

      const sessionId = sessionResponse.data.data.session_id;

      // Send message
      const sendResponse = await instance.post('/wa/send-message', {
        phone: phoneNumber,
        message: processedContent,
        sessionId: sessionId,
        branch_id: userData.branch_id
      });

      if (sendResponse.data?.success) {
        setResult({
          success: true,
          message: 'Pesan berhasil dikirim!',
          phone: phoneNumber
        });
      } else {
        throw new Error(sendResponse.data?.message || 'Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setResult({
        success: false,
        message: error.message || 'Gagal mengirim pesan test'
      });
    } finally {
      setLoading(false);
    }
  };

  const getVariableLabel = (variable) => {
    const labels = {
      customer_name: 'Nama Customer',
      customer_phone: 'Nomor HP Customer',
      order_number: 'Nomor Order',
      tenant_name: 'Nama Toko',
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
    <div className="space-y-6">
      {/* Template Info
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
      </div> */}

      {/* WhatsApp Preview */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-gray-900">Tampilan WhatsApp</h3>
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

      {/* Test Send Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900">Test Kirim Pesan</h3>
          <AnimatedButton
            onClick={() => setShowTestSend(!showTestSend)}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            {showTestSend ? 'Sembunyikan' : 'Test Kirim'}
          </AnimatedButton>
        </div>

        {showTestSend && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-yellow-700 leading-relaxed">
                  Masukkan nomor WhatsApp untuk mengirim pesan test. Pastikan nomor sudah terdaftar di WhatsApp.
                </p>
              </div>
            </div>

            <div>
              <PhoneInputWithCountry
                value={phoneNumber}
                onChange={handlePhoneChange}
                error={phoneError}
                label="Nomor WhatsApp"
                required
              />
              {!phoneError && phoneNumber && (
                <p className="mt-1 text-xs text-green-600">✓ Format nomor valid</p>
              )}
              {!phoneNumber && (
                <p className="mt-1 text-xs text-gray-500">
                  Pilih kode negara dan masukkan nomor tujuan
                </p>
              )}
            </div>

            {/* Variable Inputs */}
            {template.variables && template.variables.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Data Test (Opsional)</h4>
                <div className="grid grid-cols-1 gap-2">
                  {template.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {getVariableLabel(variable)}
                      </label>
                      <input
                        type="text"
                        value={testData[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        placeholder={`Masukkan ${getVariableLabel(variable).toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`rounded-lg p-3 ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-2 h-2 ${result.success ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
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
                  <p className="text-xs text-green-700 mt-1">
                    Dikirim ke: {result.phone}
                  </p>
                )}
              </div>
            )}

            {/* Send Button */}
            <AnimatedButton
              onClick={handleTestSend}
              disabled={loading || !phoneNumber || phoneError}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mengirim...' : '📱 Kirim Pesan Test'}
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTemplatePreview;
