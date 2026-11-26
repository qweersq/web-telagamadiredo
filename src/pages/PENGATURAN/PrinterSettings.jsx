import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile, getTenantBusinessName, getBranchName } from '../../utils/userProfileHelper';
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import { generateInvoiceContent } from '../../services/thermalPrinterInvoiceTemplate';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import LogoSettings from './components/LogoSettings';

const PrinterSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'preview'

  // User profile data
  const [tenantBusinessName, setTenantBusinessName] = useState('NOTASEPATU');
  const [branchName, setBranchName] = useState('');
  const [tenantData, setTenantData] = useState(null);
  const [tenantAddress, setTenantAddress] = useState('Jl. Contoh No. 123');
  const [tenantPhone, setTenantPhone] = useState('081234567890');

  // Helper function untuk center align text
  const centerAlign = (text, width = 32) => {
    if (!text) return '';
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  // Helper function untuk wrap text
  const wrapText = (text, maxLength = 32) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word terlalu panjang, potong paksa
          lines.push(word.slice(0, maxLength));
          currentLine = word.slice(maxLength);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  };

  // Form state
  const [formData, setFormData] = useState({
    show_logo: false,
    logo_url: null, // URL path to uploaded logo
    show_qr_code: false,
    // qr_code_url tidak diperlukan lagi, karena otomatis dari order data
    custom_thank_you: null,
    footer_notes: null,
    instagram: null,
    website: null,
    promo_text: null
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);

  // Generate QR Code image untuk preview
  useEffect(() => {
    const generateQRCode = async () => {
      if (formData.show_qr_code) {
        try {
          const sampleInvoiceUrl = 'https://www.notasepatu.id/invoice/WG1i9Yq_';
          // Size disesuaikan: 160px ≈ 20ch untuk 58mm paper (8px per char)
          const qrDataUrl = await QRCode.toDataURL(sampleInvoiceUrl, {
            width: 160,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          setQrCodeImage(qrDataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
          setQrCodeImage(null);
        }
      } else {
        setQrCodeImage(null);
      }
    };

    generateQRCode();
  }, [formData.show_qr_code]);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
    fetchSettings();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        const businessName = await getTenantBusinessName();
        const branch = await getBranchName();

        setTenantBusinessName(businessName || 'NOTASEPATU');
        setBranchName(branch || '');
        setTenantData(profile.tenant);

        // Set tenant address and phone
        setTenantAddress(profile.tenant?.address || 'Jl. Contoh No. 123');
        setTenantPhone(profile.tenant?.phone || '081234567890');

        // Generate ASCII art
        generateASCIIArt(businessName || 'NOTASEPATU');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };


  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await instance.get('/printer-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Clean data dari API: hanya ambil atribut yang diperlukan
        const apiData = response.data.data;
        const cleanedApiData = {
          show_logo: Boolean(apiData.show_logo),
          logo_url: apiData.logo_url || null,
          show_qr_code: Boolean(apiData.show_qr_code),
          // qr_code_url tidak diperlukan lagi, karena otomatis dari order data
          custom_thank_you: apiData.custom_thank_you || null,
          footer_notes: apiData.footer_notes || null,
          instagram: apiData.instagram || null,
          website: apiData.website || null,
          promo_text: apiData.promo_text || null
        };

        // Merge with existing state to preserve defaults
        const mergedData = {
          ...formData,  // Start with defaults
          ...cleanedApiData  // Override with cleaned API data
        };

        setFormData(mergedData);

        // Set logo preview if exists
        if (cleanedApiData.logo_url) {
          const fullUrl = getPhotoUrl(cleanedApiData.logo_url);
          setLogoPreview(fullUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching printer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, dll)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);
      uploadFormData.append('tenant', tenantBusinessName || 'logo');

      const response = await instance.post('/uploads-logo', uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.data[0]) {
        const logoPath = response.data.data[0].url_photo;
        setFormData(prev => ({
          ...prev,
          logo_url: logoPath,
          show_logo: true
        }));
        // Use helper to get full URL
        const fullUrl = getPhotoUrl(logoPath);
        setLogoPreview(fullUrl);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Gagal upload logo');
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo_url: null,
      show_logo: false
    }));
    setLogoPreview(null);
  };

  // Clean formData: hanya simpan atribut yang diperlukan untuk printer settings
  const cleanPrinterSettings = (data) => {
    return {
      show_logo: Boolean(data.show_logo),
      logo_url: data.logo_url || null,
      show_qr_code: Boolean(data.show_qr_code),
      // qr_code_url tidak diperlukan lagi, karena otomatis dari order data
      custom_thank_you: data.custom_thank_you?.trim() || null,
      footer_notes: data.footer_notes?.trim() || null,
      instagram: data.instagram?.trim() || null,
      website: data.website?.trim() || null,
      promo_text: data.promo_text?.trim() || null
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      // Clean data: hanya kirim atribut yang diperlukan
      const cleanedData = cleanPrinterSettings(formData);

      console.log('💾 Saving printer settings:', cleanedData);

      const response = await instance.put('/printer-settings', cleanedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 Response received:', response.data);

      if (response.data.success) {
        console.log('✅ Saved successfully:', response.data.data);
        alert('Pengaturan berhasil disimpan!');
        setActiveTab('preview'); // Auto switch to preview
      }
    } catch (error) {
      console.error('❌ Error saving printer settings:', error);
      alert('Gagal menyimpan pengaturan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    // Validasi printer config
    const printerConfig = thermalPrinterService.getCurrentPrinter();
    if (!printerConfig) {
      alert('❌ Silakan setting printer dulu di menu "Printer Management"!\n\nBuka: Beranda → Printer → Tambah Printer');
      return;
    }

    try {
      setSaving(true);
      console.log('🖨️ ===== TEST PRINT INVOICE TO PRINTER =====');

      // Sample order data for testing
      const sampleOrderData = {
        invoice_number: 'NOTA25102948048',
        entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        invoiceUrl: 'https://www.notasepatu.id/invoice/WG1i9Yq_', // Sample invoice URL untuk testing QR Code
        order_details: [
          {
            treatment: { name: 'Shoes - Deep Clean', price: 40000 },
            items: [{ id: 1 }],
            qty: 1,
            custom_price: 40000,
            custom_price_reason: 'Khusus sepatu premium dengan perawatan ekstra',
            discount: {
              type: 'percent',
              value: 10
            }
          },
          {
            treatment: { name: 'Shoes - Fast Clean', price: 25000 },
            items: [{ id: 2 }, { id: 3 }],
            qty: 2,
            custom_price: 25000
          }
        ],
        customer: {
          name: 'Customer Name',
          address: 'Customer Address',
          phone: '081234567890'
        },
        payment: {
          code: 'NOTA25102948048',
          payment_method: 'Cash',
          total_amount: 90000,
          paid_amount: 50000,
          payment_status: 'Belum Lunas',
          payment_details: []
        }
      };

      // Tenant & Branch info from state
      const tenantInfo = {
        business_name: tenantBusinessName || 'NOTASEPATU',
        company_name: tenantBusinessName || 'NOTASEPATU',
        address: tenantAddress || 'Jl. Contoh No. 123',
        phone: tenantPhone || '081234567890'
      };

      const branchInfo = branchName ? { name: branchName } : null;

      // Print invoice (logo akan otomatis dicetak jika aktif di printer settings)
      console.log('🖨️ Printing invoice with settings...');
      // Pass printer settings (formData) untuk custom footer dan logo
      await thermalPrinterService.printInvoice(sampleOrderData, tenantInfo, branchInfo, formData);

      alert('✅ Invoice berhasil dicetak ke printer!');
    } catch (error) {
      console.error('❌ Test print invoice error:', error);

      if (error.message.includes('User cancelled')) {
        alert('⚠️ Koneksi printer dibatalkan');
      } else {
        alert('❌ Gagal print invoice:\n\n' + error.message + '\n\nPastikan:\n1. Printer sudah tersimpan di Printer Management\n2. Printer dalam keadaan menyala\n3. Bluetooth aktif');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrintLogo = async () => {
    // Validasi logo
    if (!formData.show_logo || !formData.logo_url) {
      alert('❌ Silakan upload logo terlebih dahulu dan aktifkan "Tampilkan Logo"!');
      return;
    }

    // Validasi printer config
    const printerConfig = thermalPrinterService.getCurrentPrinter();
    if (!printerConfig) {
      alert('❌ Silakan setting printer dulu di menu "Printer Management"!\n\nBuka: Beranda → Printer → Tambah Printer');
      return;
    }

    try {
      setSaving(true);

      // Get full logo URL
      const fullLogoUrl = getPhotoUrl(formData.logo_url);
      console.log('🖼️ Testing print logo:', fullLogoUrl);

      // Print logo
      await thermalPrinterService.printLogo(fullLogoUrl, 384, 200);

      alert('✅ Logo berhasil dicetak ke printer!\n\n📝 Tips:\n- Jika logo terlalu gelap, gunakan logo dengan background putih\n- Ukuran optimal: 200x100px');
    } catch (error) {
      console.error('❌ Test print logo error:', error);

      if (error.message.includes('User cancelled')) {
        alert('⚠️ Koneksi printer dibatalkan');
      } else {
        alert('❌ Gagal print logo:\n\n' + error.message + '\n\nPastikan:\n1. Printer sudah tersimpan di Printer Management\n2. Printer dalam keadaan menyala\n3. Bluetooth aktif');
      }
    } finally {
      setSaving(false);
    }
  };


  // Generate preview content
  const generatePreview = () => {
    let preview = '\n';

    // Jika logo tidak aktif, tampilkan tenant business name (uppercase, center) sebagai title dengan box design
    if (!formData.show_logo || !formData.logo_url) {
      if (tenantBusinessName) {
        // Box design untuk tenant business name
        const boxWidth = 32;
        const tenantNameUpper = tenantBusinessName.toUpperCase();
        const paddingLeft = Math.floor((boxWidth - 2 - tenantNameUpper.length) / 2);
        const paddingRight = Math.ceil((boxWidth - 2 - tenantNameUpper.length) / 2);

        preview += '+' + '-'.repeat(boxWidth - 2) + '+\n';
        preview += '|' + ' '.repeat(paddingLeft) + tenantNameUpper + ' '.repeat(paddingRight) + '|\n';
        preview += '+' + '-'.repeat(boxWidth - 2) + '+\n';
      }
    }

    // Tenant address & phone (wrapped to 32 chars)
    if (tenantData?.address) {
      preview += wrapText(tenantData.address, 32) + '\n';
    }
    if (tenantData?.phone) {
      preview += `Telp: ${tenantData.phone}\n`;
    }
    preview += '--------------------------------\n';
    // Customer info (wrapped)
    preview += 'Nama   : Customer Name\n';
    const customerAddressLine = 'Alamat : Customer Address';
    preview += wrapText(customerAddressLine, 32) + '\n\n';
    preview += 'No.Inv : NOTA25102948048\n';
    preview += 'Tgl    : 29/10/25\n'; // No time, date only
    preview += '--------------------------------\n';
    // Treatment 1: dengan custom_price_reason dan discount
    preview += 'Shoes - Deep Clean x1\n';
    preview += '  Ket: tambahan perawatan\n';
    preview += 'Diskon -10%:              4.000\n';
    preview += 'Harga (1x36.000)          36.000\n';
    preview += '--------------------------------\n';
    // Treatment 2: tanpa reason dan discount
    preview += 'Shoes - Fast Clean x2\n';
    preview += 'Harga (2x25.000)          50.000\n';
    preview += '--------------------------------\n\n';
    preview += 'Sub Total                 86.000\n';
    preview += 'Sisa                      86.000\n';
    preview += 'Status             (Belum Lunas)\n';
    preview += '================================\n\n';

    // Footer - Thank you (gunakan ASCII yang bisa dicetak)
    preview += '      *** TERIMA KASIH ***\n';
    const thankYou = formData.custom_thank_you || 'Terima Kasih Telah Mempercayakan Layanan Kepada Kami';
    preview += wrapText(thankYou, 32) + '\n';

    // Footer elements (opsional - urutan dinamis sama seperti di template)
    // 1. Footer Notes / Info Penting
    if (formData.footer_notes) {
      preview += '\n--------------------------------\n';
      preview += '      INFORMASI PENTING\n';
      preview += '--------------------------------\n';
      preview += wrapText(formData.footer_notes, 32) + '\n';
    }

    // 2. Social Media (Instagram/Website)
    if (formData.instagram || formData.website) {
      preview += '\n--------------------------------\n';
      if (formData.instagram) {
        preview += `Instagram: ${formData.instagram}\n`;
      }
      if (formData.website) {
        preview += `Website: ${formData.website}\n`;
      }
    }

    // 3. Promo Text
    if (formData.promo_text) {
      preview += '\n--------------------------------\n';
      preview += '      PROMO SAAT INI\n';
      preview += wrapText(formData.promo_text, 32) + '\n';
    }

    // QR Code di akhir (setelah semua footer lainnya)
    // Spacing: langsung separator tanpa newline di depan
    // Content text (Thank You atau footer lain) sudah diakhiri dengan newline
    // Jadi langsung separator akan memberikan spacing minimal dan konsisten
    if (formData.show_qr_code) {
      preview += '--------------------------------\n';
      // QR Code image dan text "Scan untuk lihat invoice digital" akan di-render setelah text preview
    }

    // preview += '================================\n';

    return preview;
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Pengaturan Struk Invoice"
          description="Atur tampilan struk thermal printer"
          showBackButton={true}
          fromBerandaOwner={true}
          hideLogout={true}
          hideUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat pengaturan...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Pengaturan Struk Invoice"
        description="Atur tampilan struk thermal printer"
        showBackButton={true}
        fromBerandaOwner={true}
        hideLogout={true}
        hideUserMenu={true}
      />

      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-white mt-20">
        <div className="max-w-[390px] md:max-w-none mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            ⚙️ Pengaturan
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            👁️ Preview Struk
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-[390px] md:max-w-none mx-auto px-4 py-6">

          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">

              {/* Header Settings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Tampilan Header</h3>
                  <AnimatedButton
                    variant="blue"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-semibold rounded-xl"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </AnimatedButton>
                </div>

                {/* Logo Upload Section (component) */}
                <LogoSettings
                  formData={formData}
                  saving={saving}
                  onToggleShowLogo={(val) => handleInputChange('show_logo', val)}
                  onLogoUpload={handleLogoUpload}
                  onRemoveLogo={handleRemoveLogo}
                  onTestPrintLogo={handleTestPrintLogo}
                />
              </div>

              {/* Footer Settings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pengaturan Footer</h3>

                {/* Custom Thank You */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pesan Terima Kasih (Opsional)
                  </label>
                  <textarea
                    value={formData.custom_thank_you || ''}
                    onChange={(e) => handleInputChange('custom_thank_you', e.target.value || null)}
                    placeholder="Terima Kasih Telah Mempercayakan Layanan Kepada Kami"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Footer Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan/Syarat & Ketentuan (Opsional)
                  </label>
                  <textarea
                    value={formData.footer_notes || ''}
                    onChange={(e) => handleInputChange('footer_notes', e.target.value || null)}
                    placeholder="Ambil sepatu maks 30 hari, Complain maks 1x24 jam, Simpan struk baik-baik"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pisahkan dengan enter untuk baris baru</p>
                </div>

                {/* Instagram */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instagram (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.instagram || ''}
                    onChange={(e) => handleInputChange('instagram', e.target.value || null)}
                    placeholder="@notasepatu.id"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Website */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value || null)}
                    placeholder="www.notasepatu.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Promo Text */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teks Promo (Opsional)
                  </label>
                  <textarea
                    value={formData.promo_text || ''}
                    onChange={(e) => handleInputChange('promo_text', e.target.value || null)}
                    placeholder="Cuci 3 Gratis 1 Deep Clean!&#10;Berlaku s/d 31 Des 2025"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* QR Code Toggle */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_qr_code}
                      onChange={(e) => handleInputChange('show_qr_code', e.target.checked)}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="font-semibold text-gray-700">Tampilkan QR Code di Footer</span>
                  </label>
                  <p className="text-xs text-purple-600 mt-2 ml-8">
                    💡 QR Code akan menampilkan Invoice Digital URL secara otomatis dari data order
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <AnimatedButton
                variant="blue"
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-4 text-base font-semibold rounded-xl"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  'Simpan Pengaturan'
                )}
              </AnimatedButton>
            </div>
          )}

          {/* Tab Content: Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Preview Struk Thermal</h3>
                <div className="bg-white rounded-xl p-4 overflow-x-auto border-2 border-gray-300">
                  {/* Container wrapper - center aligned dengan width sesuai text (kurang dari 32ch) */}
                  <div style={{ width: '22ch', maxWidth: '100%', margin: '0 auto' }}>
                    {/* Logo Preview - Full width dalam container (hanya jika aktif) */}
                    {formData.show_logo && logoPreview && (
                      <div className="w-full mb-2">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-auto object-contain block"
                        />
                      </div>
                    )}

                    {/* Text Preview - Full width dalam container */}
                    <pre className="font-mono text-gray-800 text-xs whitespace-pre w-full" style={{ textAlign: 'left' }}>
                      {generatePreview()}
                    </pre>

                    {/* QR Code Preview - ditampilkan jika aktif */}
                    {formData.show_qr_code && qrCodeImage && (
                      <div className="w-full flex flex-col items-center mt-1">
                        <p className="text-xs text-gray-600 mt-1 text-center" style={{ width: '22ch' }}>
                          Scan untuk lihat invoice digital!
                        </p>
                        {/* QR Code image - size disesuaikan (15-20ch ≈ 120-160px) */}
                        <div className=" p-2 bg-white rounded">
                          <img
                            src={qrCodeImage}
                            alt="QR Code"
                            className="w-auto h-auto"
                            style={{ width: '160px', height: '160px' }} // ~20ch width untuk 58mm paper
                          />
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Test Print Button */}
                <AnimatedButton
                  variant="green"
                  onClick={handleTestPrint}
                  disabled={saving}
                  className="w-full px-4 py-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {saving ? '⏳ Printing...' : '🖨️ TEST PRINT INVOICE'}
                </AnimatedButton>

                {/* Save & Back Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <AnimatedButton
                    variant="grey"
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-3 text-sm font-semibold rounded-xl"
                  >
                    ← Kembali Edit
                  </AnimatedButton>
                  <AnimatedButton
                    variant="blue"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-3 text-sm font-semibold rounded-xl"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PrinterSettings;

