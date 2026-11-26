import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Eye, Settings, AlertCircle } from 'lucide-react';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { getOrderDetailsSummary } from '../../services/thermalPrinterInvoiceTemplate';

const InvoiceTemplateModal = ({ 
  show, 
  onClose, 
  order,
  paymentStatus, // 'paid', 'dp', 'unpaid' - optional, tidak wajib lagi
  onTemplateUpdated
}) => {
  // State untuk 3 template sekaligus
  const [templates, setTemplates] = useState({
    invoice_paid: '',
    invoice_dp: '',
    invoice_unpaid: '',
  });
  const [previewContents, setPreviewContents] = useState({
    invoice_paid: '',
    invoice_dp: '',
    invoice_unpaid: '',
  });
  const [activeCategory, setActiveCategory] = useState('invoice_paid');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [tenantName, setTenantName] = useState('NotaSepatu');
  const [earnRate, setEarnRate] = useState(1000); // Default: 1 poin per Rp 1.000
  const [pointsEnabled, setPointsEnabled] = useState(false); // Default: false (sesuai tenant settings)
  const [bonusPoints, setBonusPoints] = useState({ firstOrder: 0, referral: 0 }); // Bonus poin untuk order ini

  // Categories untuk tab
  const categories = [
    { key: 'invoice_paid', label: 'Lunas' },
    { key: 'invoice_dp', label: 'DP' },
    { key: 'invoice_unpaid', label: 'Belum Bayar' },
  ];

  // Get current template content based on active category
  const templateContent = templates[activeCategory] || '';
  const previewContent = previewContents[activeCategory] || '';

  // Available variables untuk invoice
  const availableVariables = [
    { key: 'greeting', label: 'Greeting (Selamat pagi/siang/sore/malam)' },
    { key: 'customer_name', label: 'Nama Customer' },
    { key: 'tenant_name', label: 'Nama Bisnis' },
    { key: 'order_number', label: 'Nomor Order' },
    { key: 'total_amount', label: 'Total Tagihan' },
    { key: 'paid_amount', label: 'Jumlah Dibayar' },
    { key: 'remaining_amount', label: 'Sisa Tagihan' },
    { key: 'total_payment', label: 'Total Pembayaran' },
    { key: 'customer_points', label: 'Poin Customer (jika sistem poin aktif)' },
    { key: 'info_poin', label: 'Info Poin Lengkap (semua info poin sekaligus)' },
    { key: 'invoice_url', label: 'URL Invoice' }
  ];

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
    const numAmount = Number(amount);
    if (numAmount === 0) return 'Rp0';
    return 'Rp' + numAmount.toLocaleString('id-ID');
  };

  // Helper: Remove http:// or https:// from URL
  const removeUrlProtocol = (url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  };

  // Initialize: Get user data dan load semua template
  useEffect(() => {
    if (show) {
      initializeData();
    } else {
      // Reset states when modal closes
      setTemplates({
        invoice_paid: '',
        invoice_dp: '',
        invoice_unpaid: '',
      });
      setPreviewContents({
        invoice_paid: '',
        invoice_dp: '',
        invoice_unpaid: '',
      });
      setActiveCategory('invoice_paid');
      setEditMode(false);
      setError(null);
      setTenantId(null);
      setBranchId(null);
      setTenantName('NotaSepatu');
    }
  }, [show]);

  const initializeData = async () => {
    try {
      const profile = await getUserProfile();
      if (profile?.tenant?.id) {
        setTenantId(profile.tenant.id);
        setBranchId(profile.branch?.id);
        setTenantName(profile.tenant?.business_name || 'NotaSepatu');
        await loadAllTemplates(profile.tenant.id, profile.branch?.id);
        await fetchEarnRate();
        await fetchBonusPoints();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Gagal memuat data');
    }
  };

  // Fetch earn_rate and enabled from points settings
  const fetchEarnRate = async () => {
    try {
      const response = await instance.get('/points-settings');
      if (response.data.success && response.data.data) {
        setEarnRate(Number(response.data.data.earn_rate) || 1000);
        setPointsEnabled(Boolean(response.data.data.enabled) || false);
      }
    } catch (error) {
      console.error('Error fetching points settings, using default:', error);
      // Keep default values if fetch fails
    }
  };

  // Fetch bonus points from PointTransaction for this order
  const fetchBonusPoints = async () => {
    if (!order?.id || !order?.customer?.id) return;
    
    try {
      const response = await instance.get(`/points/customers/${order.customer.id}/history?limit=100`);
      if (response.data.success && response.data.data?.data) {
        const bonusTransactions = response.data.data.data.filter(pt => 
          pt.order_id === order.id && 
          pt.type === 'bonus' &&
          pt.points > 0
        );
        
        let firstOrderBonus = 0;
        let referralBonus = 0;
        
        bonusTransactions.forEach(pt => {
          // Prioritaskan bonus_type field (lebih reliable daripada description matching)
          const bonusType = pt.bonus_type || '';
          
          // First Order Bonus
          if (bonusType === 'first_order') {
            firstOrderBonus += pt.points;
          }
          // Referral Bonus untuk customer baru (yang melakukan order)
          else if (bonusType === 'referral_new_customer') {
            referralBonus += pt.points;
          }
          // Fallback ke description untuk backward compatibility
          else {
            const description = (pt.description || '').toLowerCase();
            if (description.includes('first order bonus')) {
              firstOrderBonus += pt.points;
            } else if (description.includes('referral bonus')) {
              referralBonus += pt.points;
            }
          }
        });
        
        setBonusPoints({ firstOrder: firstOrderBonus, referral: referralBonus });
      }
    } catch (error) {
      console.error('Error fetching bonus points, using default:', error);
      // Keep default 0 if fetch fails
    }
  };

  // Load semua template sekaligus dari backend
  const loadAllTemplates = async (tenantId, branchId) => {
    setIsLoading(true);
    setError(null);
    try {
      const categoriesToLoad = ['invoice_paid', 'invoice_dp', 'invoice_unpaid'];
      const templatePromises = categoriesToLoad.map(async (cat) => {
        try {
          const response = await instance.get(`/invoice-templates/template/${branchId}/${cat}`, {
            params: { tenant_id: tenantId }
          });

          if (response.data.success && response.data.data?.template) {
            return { category: cat, content: response.data.data.template.template_content || '' };
          } else {
            return { category: cat, content: getDefaultTemplate(cat) };
          }
        } catch (error) {
          console.error(`Error loading template ${cat}:`, error);
          return { category: cat, content: getDefaultTemplate(cat) };
        }
      });

      const results = await Promise.all(templatePromises);
      const newTemplates = {};
      results.forEach((result) => {
        newTemplates[result.category] = result.content;
      });

      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback ke default templates
      setTemplates({
        invoice_paid: getDefaultTemplate('invoice_paid'),
        invoice_dp: getDefaultTemplate('invoice_dp'),
        invoice_unpaid: getDefaultTemplate('invoice_unpaid'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get default template berdasarkan category
  const getDefaultTemplate = (cat) => {
    const defaultTemplates = {
      invoice_paid: `{{greeting}} Kak {{customer_name}} 👋

Terima kasih sudah menggunakan layanan {{tenant_name}}! 🙏

Invoice #{{order_number}} sudah lunas sebesar {{total_payment}}.

Bisa cek progress item disin ya kak:
{{invoice_url}}

Terima kasih! ✨`,

      invoice_dp: `{{greeting}} Kak {{customer_name}} 👋

Terima kasih sudah menggunakan layanan {{tenant_name}}! 🙏

Invoice #{{order_number}} sudah dibayar sebesar {{paid_amount}} dari total {{total_amount}}.

Sisa pembayaran: {{remaining_amount}}

Bisa cek progress item disin ya kak:
{{invoice_url}}

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

    return defaultTemplates[cat] || defaultTemplates.invoice_unpaid;
  };

  // Prepare variables dari order data atau dummy data untuk preview
  const prepareVariables = (category) => {
    // Jika ada order, gunakan data real
    if (order) {
      const summaryOrderDetails = getOrderDetailsSummary(order.order_details || []);
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = summaryOrderDetails.total || 0;
      
      // ✅ FIX: Calculate final total (after all discounts) instead of subtotal
      let finalTotal = subtotal;
      if (order.payment?.final_price != null) {
        finalTotal = Number(order.payment.final_price);
      } else {
        // Fallback: calculate from discounts if final_price not available
        let totalDiscount = 0;
        if (order.payment?.total_discount != null) {
          totalDiscount = Number(order.payment.total_discount);
        } else {
          // Calculate from individual discounts
          if (order.payment?.discount && order.payment.discount.type) {
            const paymentDiscount = order.payment.discount;
            const discVal = paymentDiscount.discount != null 
              ? Number(paymentDiscount.discount) 
              : Number(paymentDiscount.value) || 0;
            
            if (paymentDiscount.type === 'percent') {
              totalDiscount += Math.round(subtotal * (discVal / 100));
            } else if (paymentDiscount.type === 'nominal') {
              totalDiscount += discVal;
            }
          }
          if (order.payment?.membership_discount) {
            totalDiscount += Number(order.payment.membership_discount);
          }
          if (order.payment?.points_discount) {
            totalDiscount += Number(order.payment.points_discount);
          }
        }
        finalTotal = Math.max(0, subtotal - totalDiscount);
      }
      
      const remainingAmount = Math.max(0, finalTotal - totalPaid);

      // Get customer points (jika sistem poin aktif)
      const customerPoints = order.customer?.points != null ? Number(order.customer.points) : null;
      const customerPointsText = customerPoints != null ? customerPoints.toString() : '';

      // Generate info_poin text (mirip InvoiceContentPreview tapi format text biasa untuk WhatsApp)
      let infoPoinText = '';
      if (pointsEnabled) {
        const paymentStatusForPoints = order.payment?.status || 'unpaid';
        const paidAmount = totalPaid || 0;
        const finalPrice = finalTotal || 0;
        
        // Calculate points: HANYA PAID = Poin Didapat, DP/UNPAID = Poin Menunggu
        let pointsEarned = 0;
        let pointsLabel = '';
        if (paymentStatusForPoints === 'paid' && paidAmount > 0) {
          pointsEarned = Math.floor(paidAmount / earnRate);
          pointsLabel = 'Poin Didapat';
        } else if (paymentStatusForPoints === 'dp' || paymentStatusForPoints === 'unpaid') {
          // Status DP atau UNPAID: poin masih menunggu (dari final_price)
          pointsEarned = Math.floor(finalPrice / earnRate);
          pointsLabel = 'Poin Menunggu';
        }
        
        const currentPoints = order.customer?.points != null ? Number(order.customer.points) : 0;
        const membershipName = order.customer?.current_membership?.membership?.name || null;
        
        // Build info poin text (format text biasa untuk WhatsApp)
        infoPoinText = '*** REWARD POIN ***\n\n';
        
        // Poin Tambahan / Poin Menunggu
        if (pointsEarned > 0) {
          infoPoinText += `${pointsLabel}: +${pointsEarned.toLocaleString('id-ID')}\n`;
        }
        
        // Bonus Order Pertama
        if (bonusPoints.firstOrder > 0) {
          infoPoinText += `Bonus Order Pertama: +${bonusPoints.firstOrder.toLocaleString('id-ID')}\n`;
        }
        
        // Bonus Referral
        if (bonusPoints.referral > 0) {
          infoPoinText += `Bonus Referral: +${bonusPoints.referral.toLocaleString('id-ID')}\n`;
        }
        
        // Poin Terkumpul (always show, even if 0)
        infoPoinText += `Poin Terkumpul: ${currentPoints.toLocaleString('id-ID')}\n`;
        
        // Membership (if exists)
        if (membershipName) {
          infoPoinText += `Membership: ${membershipName}\n`;
        }
        
        // Add promotional text
        infoPoinText += '\n(Tukar poin kamu jadi diskon!)';
      }

      return {
        greeting: getGreeting(),
        customer_name: order.customer?.name || 'Customer',
        tenant_name: tenantName,
        order_number: order.id || 'ORD-001',
        total_amount: formatCurrency(finalTotal), // ✅ Use finalTotal, not subtotal
        paid_amount: formatCurrency(totalPaid),
        remaining_amount: formatCurrency(remainingAmount), // ✅ Based on finalTotal
        total_payment: formatCurrency(totalPaid || finalTotal), // ✅ Use finalTotal
        customer_points: customerPointsText, // ✅ Poin customer (jika sistem poin aktif)
        info_poin: infoPoinText, // ✅ Info poin lengkap (semua info sekaligus)
        invoice_url: removeUrlProtocol(order.invoiceUrl || 'notasepatu.com/invoice/123'),
      };
    }

    // Jika tidak ada order, gunakan dummy data untuk preview
    const dummyInfoPoin = '*** REWARD POIN ***\n\nPoin Didapat: +50\nBonus Order Pertama: +10\nBonus Referral: +5\nPoin Terkumpul: 150\nMembership: Gold\n\n(Tukar poin kamu jadi diskon!)';
    
    const dummyData = {
      invoice_paid: {
        greeting: getGreeting(),
        customer_name: 'Budi Santoso',
        tenant_name: tenantName,
        order_number: 'ORD-001',
        total_amount: formatCurrency(500000),
        paid_amount: formatCurrency(500000),
        remaining_amount: formatCurrency(0),
        total_payment: formatCurrency(500000),
        customer_points: '150', // ✅ Dummy poin untuk preview
        info_poin: dummyInfoPoin, // ✅ Dummy info poin untuk preview
        invoice_url: 'notasepatu.com/invoice/123',
      },
      invoice_dp: {
        greeting: getGreeting(),
        customer_name: 'Budi Santoso',
        tenant_name: tenantName,
        order_number: 'ORD-001',
        total_amount: formatCurrency(500000),
        paid_amount: formatCurrency(250000),
        remaining_amount: formatCurrency(250000),
        total_payment: formatCurrency(250000),
        customer_points: '150', // ✅ Dummy poin untuk preview
        info_poin: dummyInfoPoin, // ✅ Dummy info poin untuk preview
        invoice_url: 'notasepatu.com/invoice/123',
      },
      invoice_unpaid: {
        greeting: getGreeting(),
        customer_name: 'Budi Santoso',
        tenant_name: tenantName,
        order_number: 'ORD-001',
        total_amount: formatCurrency(500000),
        paid_amount: formatCurrency(0),
        remaining_amount: formatCurrency(500000),
        total_payment: formatCurrency(0),
        customer_points: '150', // ✅ Dummy poin untuk preview
        info_poin: dummyInfoPoin, // ✅ Dummy info poin untuk preview
        invoice_url: 'notasepatu.com/invoice/123',
      },
    };

    return dummyData[category] || dummyData.invoice_unpaid;
  };

  // Process template dengan variables
  const processTemplate = (content, variables) => {
    let processed = content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    return processed;
  };

  // Preview template untuk category aktif
  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const variables = prepareVariables(activeCategory);
      const processed = processTemplate(templateContent, variables);
      setPreviewContents((prev) => ({
        ...prev,
        [activeCategory]: processed,
      }));
    } catch (error) {
      console.error('Error previewing template:', error);
      setError('Gagal membuat preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Insert variable ke template content
  const insertVariable = (variableKey) => {
    const textarea = document.querySelector('textarea[data-template-content]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variableKey}}}` + after;
      
      // Update template untuk category aktif
      setTemplates((prev) => ({
        ...prev,
        [activeCategory]: newText,
      }));
      
      // Set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length + 4, start + variableKey.length + 4);
      }, 0);
    } else {
      setTemplates((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory] + `{{${variableKey}}}`,
      }));
    }
  };

  // Save semua template sekaligus
  const handleSaveAll = async () => {
    if (!tenantId || !branchId) {
      setError('Tenant ID atau Branch ID tidak ditemukan');
      return;
    }

    setIsSavingAll(true);
    setError(null);
    try {
      const titleMap = {
        invoice_paid: 'Template Invoice Lunas',
        invoice_dp: 'Template Invoice DP',
        invoice_unpaid: 'Template Invoice Belum Bayar',
      };

      // Save semua template sekaligus
      const savePromises = Object.keys(templates).map(async (cat) => {
        const templateContent = templates[cat];
        
        // Extract variables
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables = [];
        let match;
        while ((match = variableRegex.exec(templateContent)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }

        return instance.post(`/invoice-templates/branch/${branchId}`, {
          category: cat,
          title: titleMap[cat] || 'Template Invoice',
          template_content: templateContent,
          variables: variables,
          tenant_id: tenantId,
        });
      });

      const results = await Promise.all(savePromises);
      const allSuccess = results.every((res) => res.data.success);

      if (allSuccess) {
        alert('Semua template berhasil disimpan!');
        setEditMode(false);
        if (onTemplateUpdated) {
          onTemplateUpdated();
        }
      } else {
        throw new Error('Beberapa template gagal disimpan');
      }
    } catch (error) {
      console.error('Error saving all templates:', error);
      setError('Gagal menyimpan template: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSavingAll(false);
    }
  };

  // Reset ke default template untuk category aktif
  const handleResetToDefault = () => {
    if (confirm('Yakin ingin reset ke template default? Perubahan yang belum disimpan akan hilang.')) {
      setTemplates((prev) => ({
        ...prev,
        [activeCategory]: getDefaultTemplate(activeCategory),
      }));
    }
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // Clear preview saat ganti category
    setPreviewContents((prev) => ({
      ...prev,
      [category]: '',
    }));
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-t-2xl">
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white font-montserrat">
                    Custom Template Invoice
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1.5 px-4 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium font-montserrat transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700 font-montserrat">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : editMode ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 font-montserrat">
                    Template Content:
                  </label>
                  <button
                    onClick={handleResetToDefault}
                    className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors font-montserrat"
                  >
                    Reset ke Default
                  </button>
                </div>
                <textarea
                  data-template-content
                  value={templateContent}
                  onChange={(e) => {
                    setTemplates((prev) => ({
                      ...prev,
                      [activeCategory]: e.target.value,
                    }));
                  }}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm resize-none"
                  placeholder="Masukkan template content dengan variables {{variable_name}}"
                />
              </div>

              {/* Variable Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                  Available Variables (Klik untuk insert):
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map(variable => (
                    <button
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium font-montserrat hover:bg-blue-200 transition-colors"
                      title={variable.label}
                    >
                      {variable.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Section */}
              {previewContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Preview:
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-sm text-gray-800 font-montserrat">
                      {previewContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Preview Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                  Template Content:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 font-montserrat">
                    {templateContent}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                  Preview dengan Data Order:
                </label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 font-montserrat">
                    {previewContent || 'Klik "Preview" untuk melihat hasil'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          {editMode ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePreview}
                disabled={isPreviewing || !templateContent}
                className="w-full px-3 py-2 rounded-lg text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-montserrat flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {isPreviewing ? 'Memproses...' : 'Preview'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setPreviewContents((prev) => ({
                      ...prev,
                      [activeCategory]: '',
                    }));
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors font-montserrat"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-montserrat flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingAll ? 'Menyimpan...' : 'Simpan Semua'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePreview}
                disabled={isPreviewing || !templateContent}
                className="w-full px-3 py-2 rounded-lg text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-montserrat flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {isPreviewing ? 'Memproses...' : 'Preview Template'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors font-montserrat"
                >
                  Tutup
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors font-montserrat flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateModal;

