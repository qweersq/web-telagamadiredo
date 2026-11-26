import { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';
import HelpTooltip from './HelpTooltip';

const SimpleTemplateForm = ({ 
  template = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    category: 'invoice',
    template_content: '',
    is_active: true
  });

  const [showPreview, setShowPreview] = useState(false);

  const categories = [
    { 
      value: 'invoice', 
      label: 'Invoice', 
      description: 'Pesan untuk invoice pembayaran',
      icon: '🧾',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50'
    },
    { 
      value: 'item_done', 
      label: 'Item Selesai', 
      description: 'Notifikasi item sudah selesai',
      icon: '✅',
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50'
    },
    { 
      value: 'delivery', 
      label: 'Pengantaran', 
      description: 'Pesan untuk pengantaran barang',
      icon: '🚚',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      bgColor: 'bg-purple-50'
    },
    { 
      value: 'pickup', 
      label: 'Penjemputan', 
      description: 'Pesan untuk penjemputan barang',
      icon: '📦',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      bgColor: 'bg-orange-50'
    },
    { 
      value: 'notification', 
      label: 'Notifikasi', 
      description: 'Pesan notifikasi umum',
      icon: '🔔',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50'
    },
    { 
      value: 'promotion', 
      label: 'Promosi', 
      description: 'Pesan promosi dan marketing',
      icon: '🎯',
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      bgColor: 'bg-pink-50'
    },
    { 
      value: 'reminder', 
      label: 'Reminder', 
      description: 'Pesan pengingat',
      icon: '⏰',
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50'
    },
    { 
      value: 'other', 
      label: 'Lainnya', 
      description: 'Template lainnya',
      icon: '📝',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      bgColor: 'bg-gray-50'
    }
  ];

  // Variables yang paling umum dan penting untuk semua kategori
  const commonVariables = [
    { key: 'customer_name', label: 'Nama Customer', example: 'John Doe' },
    { key: 'tenant_name', label: 'Nama Toko', example: 'NotaSepatu Laundry' },
    { key: 'greeting', label: 'Salam', example: 'Pagi' }
  ];

  // Logic untuk menentukan greeting berdasarkan waktu
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Pagi';
    if (hour < 15) return 'Siang';
    if (hour < 18) return 'Sore';
    return 'Malam';
  };

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        title: template.title || '',
        category: template.category || 'invoice',
        template_content: template.template_content || '',
        is_active: template.is_active !== undefined ? template.is_active : true
      });
    }
  }, [template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validation
    if (!formData.name || !formData.title || !formData.template_content) {
      console.log('Form validation failed:', formData);
      return;
    }
    
    console.log('Form submitted with data:', formData);
    onSubmit({
      ...formData,
      description: `Template ${formData.title}`,
      variables: getVariablesFromContent(formData.template_content),
      is_default: false,
      branch_id: null
    });
  };

  const getVariablesFromContent = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
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
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.key.length + 4, start + variable.key.length + 4);
      }, 0);
    }
  };

  const handleButtonClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const generateSampleContent = () => {
    const greeting = getGreeting();
    const samples = {
      invoice: `Selamat {{greeting}} {{customer_name}}! 👋

Terima kasih sudah mempercayakan perawatan sepatu di {{tenant_name}}! 🙏

Detail Invoice:
• Nomor Order: KAT20250115001
• Total Tagihan: Rp 50.000
• Tanggal: 15 Jan 2025

Silakan lakukan pembayaran sesuai nominal di atas.

Terima kasih! ✨`,
      item_done: `Selamat {{greeting}} {{customer_name}}! 👋

Item sepatu Anda sudah selesai dikerjakan! 😊

Treatment: Deep Clean

Silakan ambil ke toko atau hubungi kami untuk pengantaran.

Terima kasih sudah mempercayakan {{tenant_name}}! 🙏`,
      delivery: `Selamat {{greeting}} {{customer_name}}! 👋

Driver sedang dalam perjalanan mengantar pesanan Anda.

Estimasi waktu: 30 menit

Mohon ditunggu ya! 🙏

{{tenant_name}}`,
      pickup: `Selamat {{greeting}} {{customer_name}}! 👋

Driver sedang dalam perjalanan menjemput pesanan Anda.

Estimasi waktu: 30 menit

Mohon ditunggu ya! 🙏

{{tenant_name}}`,
      notification: `Selamat {{greeting}} {{customer_name}}! 👋

Ini adalah notifikasi dari {{tenant_name}}.

Terima kasih! 🙏`,
      promotion: `Selamat {{greeting}} {{customer_name}}! 👋

🎉 PROMO KHUSUS! 🎉

Diskon 50% untuk semua treatment!
Kode: DISKON50

Jangan sampai terlewat! Promo terbatas.

{{tenant_name}}`,
      reminder: `Selamat {{greeting}} {{customer_name}}! 👋

Pengingat pembayaran

Mohon segera lakukan pembayaran.

{{tenant_name}}`,
      other: `Selamat {{greeting}} {{customer_name}}! 👋

Pesan dari {{tenant_name}}.

Terima kasih! 🙏`
    };
    
    setFormData(prev => ({
      ...prev,
      template_content: samples[formData.category]
    }));
  };

  // Menggunakan commonVariables untuk semua kategori
  const currentVariables = commonVariables;

  return (
    <div className="space-y-6">
      {/* Header dengan bantuan */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Cara Membuat Template</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              1. Pilih kategori template<br/>
              2. Tulis pesan yang ingin dikirim<br/>
              3. Gunakan tombol variable untuk menambahkan data dinamis<br/>
              4. Klik "Lihat Preview" untuk melihat hasilnya
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informasi Template</h3>
          
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
                placeholder="Contoh: invoice_pembayaran"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Nama unik untuk identifikasi template (huruf kecil, underscore)</p>
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
                placeholder="Contoh: Invoice Pembayaran"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Judul yang akan ditampilkan di list template</p>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pilih Kategori Template</h3>
          <p className="text-sm text-gray-600">Pilih kategori yang sesuai dengan kegunaan template ini</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Template *
              <HelpTooltip 
                title="Apa itu Kategori?"
                content="Kategori menentukan kapan template ini digunakan. Misal: Invoice untuk mengirim tagihan, Item Selesai untuk memberitahu customer bahwa pesanan sudah selesai."
              />
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label} - {category.description}
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {categories.find(c => c.value === formData.category)?.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {categories.find(c => c.value === formData.category)?.label}
                  </p>
                  <p className="text-xs text-gray-600">
                    {categories.find(c => c.value === formData.category)?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Isi Pesan</h3>
            <AnimatedButton
              type="button"
              onClick={(e) => handleButtonClick(e, generateSampleContent)}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              📝 Gunakan Contoh
            </AnimatedButton>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tulis pesan yang ingin dikirim *
              <HelpTooltip 
                title="Cara Menulis Pesan"
                content="Tulis pesan seperti biasa. Untuk data yang berubah-ubah (seperti nama customer, nomor order), gunakan tombol variable di bawah."
              />
            </label>
            <textarea
              id="template_content"
              value={formData.template_content}
              onChange={(e) => handleInputChange('template_content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tulis pesan Anda di sini..."
              rows={8}
              required
            />
          </div>

          {/* Variable Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data yang Bisa Digunakan
              <HelpTooltip 
                title="Apa itu Variable?"
                content="Variable adalah data yang akan berubah-ubah setiap kali dikirim. Misal: nama customer akan berbeda untuk setiap pesan, tapi format pesannya sama."
              />
            </label>
            <div className="grid grid-cols-1 gap-2">
              {currentVariables.map((variable) => {
                // Tampilkan greeting yang dinamis
                const example = variable.key === 'greeting' ? getGreeting() : variable.example;
                return (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={(e) => handleButtonClick(e, () => insertVariable(variable))}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-left"
                  >
                    <div className="font-medium">{variable.label}</div>
                    <div className="text-xs text-blue-600">Contoh: {example}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          {/* <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Preview Pesan</h3>
            <AnimatedButton
              type="button"
              onClick={(e) => handleButtonClick(e, () => setShowPreview(!showPreview))}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              {showPreview ? 'Sembunyikan' : 'Lihat Preview'}
            </AnimatedButton>
          </div> */}
          
          {showPreview && (
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
                  {formData.template_content || 'Tulis pesan Anda di atas untuk melihat preview...'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pengaturan</h3>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Template Aktif</span>
            <HelpTooltip 
              title="Template Aktif"
              content="Template yang aktif bisa digunakan untuk mengirim pesan. Template yang tidak aktif tidak akan muncul di pilihan saat mengirim pesan."
            />
          </label>
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
            onClick={(e) => handleButtonClick(e, onCancel)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Batal
          </AnimatedButton>
        </div>
      </form>
    </div>
  );
};

export default SimpleTemplateForm;
