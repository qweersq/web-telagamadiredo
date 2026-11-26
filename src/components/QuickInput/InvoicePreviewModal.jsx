import React, { useState, useEffect } from 'react';
import { Send, Edit3, Save, Eye, X } from 'lucide-react';

const InvoicePreviewModal = ({ 
  show, 
  onClose, 
  order, 
  previewMessage, 
  templateContent, 
  availableVariables, 
  editMode, 
  onEditMode, 
  onSaveTemplate, 
  onPreviewTemplate, 
  onSendInvoice, 
  sendingInvoice
}) => {
  const [localTemplateContent, setLocalTemplateContent] = useState(templateContent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTemplateContent(templateContent);
  }, [templateContent]);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      await onSaveTemplate(localTemplateContent);
      // Auto-close modal setelah save
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseDefaultTemplate = () => {
    // Determine payment status untuk menentukan template default
    const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const totalAmount = order.payment?.total_amount || 0;
    
    let category = 'invoice_unpaid';
    if (totalPaid >= totalAmount) {
      category = 'invoice_paid';
    } else if (totalPaid > 0) {
      category = 'invoice_dp';
    }
    
    // Get default template berdasarkan kategori
    const defaultTemplate = getDefaultTemplateByCategory(category);
    setLocalTemplateContent(defaultTemplate);
  };

  const getDefaultTemplateByCategory = (category) => {
    const templates = {
      invoice_paid: `{{greeting}} Kak {{customer_name}} 👋

Terima kasih sudah menggunakan layanan {{tenant_name}}! 🙏

Invoice #{{order_number}} sudah lunas sebesar {{total_payment}}.

Terima kasih! ✨`,
      
      invoice_dp: `{{greeting}} Kak {{customer_name}} 👋

Terima kasih sudah menggunakan layanan {{tenant_name}}! 🙏

Invoice #{{order_number}} sudah dibayar sebesar {{paid_amount}} dari total {{total_amount}}.

Sisa pembayaran: {{remaining_amount}}

Terima kasih! ✨`,
      
      invoice_unpaid: `{{greeting}} Kak {{customer_name}} 👋

Terima kasih sudah menggunakan layanan {{tenant_name}}! 🙏

Berikut detail invoice untuk pesanan #{{order_number}}:

💵 Total Harga: {{total_amount}}

Mohon lakukan pembayaran jika belum dibayar:
💳 DP minimal 50% dari total tagihan

Kakak bisa cek detail lengkap pesanan melalui link berikut ya:
{{invoice_url}}

Kalau ada pertanyaan atau butuh bantuan, silakan hubungi kami.

Semoga hari Kakak menyenangkan!✨

Salam hangat,
*{{tenant_name}}*`
    };
    
    return templates[category] || templates.invoice_unpaid;
  };

  const handlePreviewTemplate = async () => {
    await onPreviewTemplate(localTemplateContent);
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localTemplateContent;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setLocalTemplateContent(before + `{{${variable}}}` + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.105"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Preview Pesan Invoice</h3>
              <p className="text-sm text-gray-500 font-montserrat">Tinjau pesan sebelum dikirim ke customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 font-montserrat">
                {order.customer?.name || 'Customer'}
              </h4>
              <p className="text-xs text-gray-600 font-montserrat">
                {order.customer?.phone || 'No phone'} • Order #{order.payment?.code || order.id}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {editMode ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 font-montserrat">
                    Template Content:
                  </label>
                  <button
                    onClick={handleUseDefaultTemplate}
                    className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors duration-200 font-montserrat"
                  >
                    Gunakan Default Template
                  </button>
                </div>
                <textarea 
                  value={localTemplateContent}
                  onChange={(e) => setLocalTemplateContent(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                  placeholder="Masukkan template content dengan variables {{variable_name}}"
                />
              </div>
              
              {/* Variable Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                  Available Variables:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map(variable => (
                    <button 
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-montserrat hover:bg-blue-200 transition-colors"
                    >
                      {variable.key}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Live Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                  Live Preview:
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm font-montserrat">
                    {previewMessage}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            // Preview Mode
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">B</span>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-800 font-montserrat">Business Name</h5>
                  <p className="text-xs text-gray-500 font-montserrat">Online</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="text-sm text-gray-800 font-montserrat whitespace-pre-wrap">
                  {previewMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100">
          {editMode ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onEditMode(false)}
                className="w-full px-4 py-2 rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors duration-200 font-montserrat"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:transform-none font-montserrat"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors duration-200 font-montserrat"
              >
                Tutup
              </button>
              <button
                onClick={() => onEditMode(true)}
                className="w-full px-4 py-2 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors duration-200 font-montserrat"
              >
                Edit Template
              </button>
              <button
                onClick={onSendInvoice}
                disabled={sendingInvoice}
                className="w-full px-4 py-2 rounded-lg text-sm bg-green-500 hover:bg-green-600 text-white font-medium transition-colors duration-200 disabled:opacity-50 disabled:transform-none font-montserrat"
              >
                {sendingInvoice ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
