import { useState, useEffect } from 'react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getTenantBusinessName } from '../../utils/userProfileHelper';
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import { generateGradientFromColor } from '../../utils/colorGradientHelper';
import LordIcon from '../../components/Design/LordIcon';
import InvoiceDigitalPreview from './components/InvoiceDigitalPreview';
import ColorPickerTemplate from './components/ColorPickerTemplate';

const InvoiceDigitalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'preview'
  const [tenantBusinessName, setTenantBusinessName] = useState('');
  
  const [formData, setFormData] = useState({
    show_logo: false,
    logo_url: null,
    show_business_name: true,
    show_tagline: true,
    header_color: '#5096FC',
    footer_color: '#5096FC',
    header_text_color: '#FFFFFF',
    footer_text_color: '#FFFFFF',
    footer_notes: '',
    custom_thank_you: '',
    promo_text: '',
    instagram: '',
    website: '',
    show_progress_photos: false,
    show_technician_info: false
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [headerGradient, setHeaderGradient] = useState(['#3D7AC8', '#5096FC', '#62B3FF']);
  const [footerGradient, setFooterGradient] = useState(['#3D7AC8', '#5096FC', '#62B3FF']);

  useEffect(() => {
    fetchUserProfile();
    fetchSettings();
  }, []);

  useEffect(() => {
    // Auto-generate gradient saat warna berubah
    const headerGrad = generateGradientFromColor(formData.header_color);
    const footerGrad = generateGradientFromColor(formData.footer_color);
    setHeaderGradient(headerGrad);
    setFooterGradient(footerGrad);
  }, [formData.header_color, formData.footer_color]);

  const fetchUserProfile = async () => {
    try {
      const businessName = await getTenantBusinessName();
      setTenantBusinessName(businessName || 'NOTASEPATU');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await instance.get('/invoice-digital-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        const settings = {
          show_logo: Boolean(apiData.show_logo),
          logo_url: apiData.logo_url || null,
          show_business_name: apiData.show_business_name !== undefined ? Boolean(apiData.show_business_name) : true,
          show_tagline: apiData.show_tagline !== undefined ? Boolean(apiData.show_tagline) : true,
          header_color: apiData.header_color || '#5096FC',
          footer_color: apiData.footer_color || '#5096FC',
          header_text_color: apiData.header_text_color || '#FFFFFF',
          footer_text_color: apiData.footer_text_color || '#FFFFFF',
          footer_notes: apiData.footer_notes || '',
          custom_thank_you: apiData.custom_thank_you || '',
          promo_text: apiData.promo_text || '',
          instagram: apiData.instagram || '',
          website: apiData.website || '',
          show_progress_photos: apiData.show_progress_photos !== undefined ? Boolean(apiData.show_progress_photos) : false,
          show_technician_info: apiData.show_technician_info !== undefined ? Boolean(apiData.show_technician_info) : false
        };
        
        setFormData(settings);
        if (settings.logo_url) {
          const fullUrl = getPhotoUrl(settings.logo_url);
          setLogoPreview(fullUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice digital settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

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
        const fullUrl = getPhotoUrl(logoPath);
        setLogoPreview(fullUrl);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Gagal upload logo');
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo_url: null,
      show_logo: false
    }));
    setLogoPreview(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await instance.put('/invoice-digital-settings', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Pengaturan berhasil disimpan!');
      }
    } catch (error) {
      console.error('❌ Error saving invoice digital settings:', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Invoice Digital Settings"
          description="Atur tampilan invoice digital"
          showBackButton={true}
          fromBerandaOwner={true}
          hideLogout={true}
          hideUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Invoice Digital Settings"
        description="Atur tampilan invoice digital"
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
            👁️ Preview
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-[390px] md:max-w-none mx-auto px-4 py-6">
          
          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
            
              {/* Logo Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Logo Invoice Digital</h3>
              
              {logoPreview ? (
                <div className="mb-4">
                  <img src={logoPreview} alt="Logo" className="max-h-32 mx-auto rounded-lg" />
                  <div className="flex gap-2 mt-4">
                    <label className="flex-1 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <div className="text-center py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        Ganti Logo
                      </div>
                    </label>
                    <button
                      onClick={handleRemoveLogo}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      Hapus Logo
                    </button>
                  </div>
                  {/* Checkbox untuk tampilkan text jika logo ada */}
                  <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show_business_name"
                        checked={formData.show_business_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_business_name: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="show_business_name" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Tampilkan Nama Bisnis
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="show_tagline"
                        checked={formData.show_tagline}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_tagline: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="show_tagline" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Tampilkan ("Invoice Pembayaran")
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Centang untuk menampilkan text di bawah logo</p>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">Klik untuk upload logo</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Header Color */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Warna Background Header</h3>
              <div className="space-y-4">
                <ColorPickerTemplate
                  currentColor={formData.header_color}
                  onSelectColor={(color) => setFormData(prev => ({ ...prev, header_color: color }))}
                  label="Pilih Warna Utama"
                />
                
                <ColorPickerTemplate
                  currentColor={formData.header_text_color}
                  onSelectColor={(color) => setFormData(prev => ({ ...prev, header_text_color: color }))}
                  label="Pilih Warna Teks"
                />
                
                <div>
                  <p className="text-xs text-gray-600 mb-2">Preview Gradient:</p>
                  <div 
                    className="h-16 rounded-lg flex items-center justify-center font-bold shadow-md"
                    style={{ 
                      background: `linear-gradient(to bottom right, ${headerGradient[0]}, ${headerGradient[1]}, ${headerGradient[2]})`,
                      color: formData.header_text_color
                    }}
                  >
                    HEADER PREVIEW
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Color */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Warna Background Footer</h3>
              <div className="space-y-4">
                <ColorPickerTemplate
                  currentColor={formData.footer_color}
                  onSelectColor={(color) => setFormData(prev => ({ ...prev, footer_color: color }))}
                  label="Pilih Warna Utama"
                />
                
                <ColorPickerTemplate
                  currentColor={formData.footer_text_color}
                  onSelectColor={(color) => setFormData(prev => ({ ...prev, footer_text_color: color }))}
                  label="Pilih Warna Teks"
                />
                
                <div>
                  <p className="text-xs text-gray-600 mb-2">Preview Gradient:</p>
                  <div 
                    className="h-16 rounded-lg flex items-center justify-center font-bold shadow-md"
                    style={{ 
                      background: `linear-gradient(to bottom right, ${footerGradient[0]}, ${footerGradient[1]}, ${footerGradient[2]})`,
                      color: formData.footer_text_color
                    }}
                  >
                    FOOTER PREVIEW
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Text Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Pengaturan Footer Invoice</h3>
              <div className="space-y-4">
                {/* Footer Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Footer (Syarat & Ketentuan)
                  </label>
                  <textarea
                    value={formData.footer_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, footer_notes: e.target.value }))}
                    placeholder="Masukkan catatan footer, bisa pakai enter untuk baris baru"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Gunakan enter untuk baris baru</p>
                </div>

                {/* Custom Thank You */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pesan Terima Kasih Kustom
                  </label>
                  <textarea
                    value={formData.custom_thank_you}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_thank_you: e.target.value }))}
                    placeholder="Contoh: Terima kasih telah mempercayakan sepatu Anda di [Nama Toko]"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={2}
                  />
                </div>

                {/* Promo Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teks Promo
                  </label>
                  <textarea
                    value={formData.promo_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, promo_text: e.target.value }))}
                    placeholder="Masukkan teks promo, bisa pakai enter untuk baris baru"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                  />
                </div>

                {/* Social Media */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@username atau URL Instagram"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Photos & Technician Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Tampilkan Progress Item & Teknisi</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_progress_photos"
                    checked={formData.show_progress_photos}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_progress_photos: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="show_progress_photos" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Tampilkan Foto Progress Item
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_technician_info"
                    checked={formData.show_technician_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_technician_info: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="show_technician_info" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Tampilkan Info Teknisi
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Aktifkan untuk menampilkan foto progress dan informasi teknisi yang mengerjakan item di invoice digital
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
            <div className="space-y-6">
              <InvoiceDigitalPreview formData={formData} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default InvoiceDigitalSettings;

