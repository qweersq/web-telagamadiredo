import React, { useState } from 'react';
import { CheckCircle, CreditCard, User, Calendar, DollarSign, Printer, Settings, Bluetooth, FileText, Tag, Send, XIcon, MessageCircle, Copy, ArrowLeft, RefreshCw, Clock, ChefHat } from 'lucide-react';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import { getOrderDetailsSummary, generateOrderDetails } from '../../services/thermalPrinterInvoiceTemplate';
import { PrintChecklist } from '../../services/thermalPrinterChecklistTemplate';
import { buildKitchenTickets } from '../../services/thermalPrinterKitchenTicketTemplate';
import instance from '../../config/api';
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WhatsAppFormatter from '../WhatsAppMessage/WhatsAppFormatter';
import AnimatedButton from '../Design/AnimatedButton';
import { getUserProfile } from '../../utils/userProfileHelper';
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPaymentStatus,
  formatDiscountDisplay,
  PAYMENT_STATUS
} from '../../utils/labelFormatter';

// Import components
import InvoicePreviewModal from './InvoicePreviewModal';
import PrinterStatusCard from './PrinterStatusCard';
import InvoiceContentPreview from './InvoiceContentPreview';
import InvoiceTemplateModal from './InvoiceTemplateModal';

// Import hooks
import { useInvoiceTemplate } from './hooks/useInvoiceTemplate';
import { useWhatsAppStatus } from './hooks/useWhatsAppStatus';
import { usePrinterStatus } from './hooks/usePrinterStatus';

const QuickOrderPrintReceipt = ({ order, onClose, hideCloseButton = false }) => {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'kitchen' | 'tag' | 'whatsapp'
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinting80mm, setIsPrinting80mm] = useState(false);
  const [isPrintingChecklist, setIsPrintingChecklist] = useState(false);
  const [isPrintingKitchen, setIsPrintingKitchen] = useState(false);
  // Tiket dapur dari API (otoritatif). Fallback: bangun dari data order lokal.
  const [kitchenTicketData, setKitchenTicketData] = useState(null);
  const [isLoadingKitchenTickets, setIsLoadingKitchenTickets] = useState(false);
  const [printError, setPrintError] = useState(null);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [printerList, setPrinterList] = useState([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [printerSource, setPrinterSource] = useState(null); // 'server' | 'local'
  const [printerError, setPrinterError] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [branchInfo, setBranchInfo] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [printerSettings, setPrinterSettings] = useState(null);
  const [earnRate, setEarnRate] = useState(1000); // Default: 1 poin per Rp 1.000
  const [pointsEnabled, setPointsEnabled] = useState(false); // Default: false (sesuai tenant settings)
  const [bonusPoints, setBonusPoints] = useState({ firstOrder: 0, referral: 0 }); // Bonus poin untuk order ini
  const [pointsSettings, setPointsSettings] = useState({ first_order_bonus: 0, first_order_bonus_enabled: true, referral_bonus_new_customer: 0 }); // Points settings untuk calculate expected bonus
  const [copyStatus, setCopyStatus] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [isCopyingInvoice, setIsCopyingInvoice] = useState(false);

  // Pre-loaded template state untuk optimasi copy
  const [loadedTemplateContent, setLoadedTemplateContent] = useState(null);
  const [templateCategory, setTemplateCategory] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Tag Item states (from PrintChecklistModal)
  const [selectedItems, setSelectedItems] = useState([]);
  const [printAll, setPrintAll] = useState(true);
  // Nomor antrian tag: order_detail_id -> nomor (diisi dari backend, termasuk backfill order lama)
  const [tagNumberMap, setTagNumberMap] = useState({});

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showInvoiceTemplateModal, setShowInvoiceTemplateModal] = useState(false);

  // Custom hooks
  const { waConnected, waStatus, checkingWA, checkWhatsAppStatus } = useWhatsAppStatus();
  const { printerStatus, checkingPrinter, checkPrinterStatus } = usePrinterStatus();
  const {
    availableVariables,
    editMode,
    setEditMode,
    fetchTemplate,
    saveTemplate,
    previewTemplate,
    sendInvoice,
    isSending: sendingInvoice
  } = useInvoiceTemplate(order);
  // Hitung summary dan detail breakdown
  const summaryOrderDetails = getOrderDetailsSummary(order.order_details || []);

  // ===== Nomor antrian tag (reset harian per cabang) =====
  // Backend mengembalikan seluruh nomor tag order ini; sekaligus mengisi nomor
  // untuk order lama / item yang belum punya nomor.
  useEffect(() => {
    if (!order?.id) return;
    let cancelled = false;

    const loadTagNumbers = async () => {
      try {
        const res = await instance.post(`/orders/${order.id}/assign-tag-numbers`);
        const list = res?.data?.data || [];
        if (cancelled) return;
        const map = {};
        list.forEach(row => {
          if (row?.order_detail_id && row?.tag_number != null) {
            map[row.order_detail_id] = row.tag_number;
          }
        });
        setTagNumberMap(map);
      } catch (error) {
        console.warn('⚠️ Gagal mengambil nomor antrian tag:', error?.message);
      }
    };

    loadTagNumbers();
    return () => { cancelled = true; };
  }, [order?.id]);

  // Sisipkan nomor antrian ke tiap item order_detail
  const resolveTagNumbers = (orderData) => {
    if (!orderData) return orderData;
    return {
      ...orderData,
      order_details: (orderData.order_details || []).map(group => ({
        ...group,
        items: (group.items || []).map(item => {
          const resolved = item?.tag_number != null
            ? item.tag_number
            : tagNumberMap[item?.order_detail_id];
          return resolved != null ? { ...item, tag_number: resolved } : item;
        }),
      })),
    };
  };

  const resolvedOrder = resolveTagNumbers(order);

  // Tiket dapur: satu tiket per dapur produksi (outlet penjual / dapur pusat)
  const localKitchenTickets = useMemo(() => buildKitchenTickets(resolvedOrder), [resolvedOrder]);
  const kitchenTickets = kitchenTicketData || localKitchenTickets;

  useEffect(() => {
    if (activeTab !== 'kitchen' || !order?.id) return;
    let cancelled = false;

    const loadKitchenTickets = async () => {
      setIsLoadingKitchenTickets(true);
      try {
        const res = await instance.get(`/orders/${order.id}/kitchen-tickets`);
        const tickets = res?.data?.data?.tickets;
        if (!cancelled && Array.isArray(tickets)) setKitchenTicketData(tickets);
      } catch (error) {
        console.warn('⚠️ Gagal mengambil tiket dapur:', error?.message);
      } finally {
        if (!cancelled) setIsLoadingKitchenTickets(false);
      }
    };

    loadKitchenTickets();
    return () => { cancelled = true; };
  }, [activeTab, order?.id]);

  // Group order_details berdasarkan treatment_id dan discount_id
  const groupedDetails = {};
  (order.order_details || []).forEach(group => {
    const treatmentId = group.treatment?.id || 'no-treatment';
    const discountId = group.discount?.id || 'no-discount';
    const customPrice = group.custom_price != null ? Number(group.custom_price) : 'no-custom-price';
    const customReason = (group.custom_price_reason || '').trim() || 'no-reason';
    const key = `${treatmentId}-${discountId}-${customPrice}-${customReason}`;

    if (!groupedDetails[key]) {
      groupedDetails[key] = {
        treatment: group.treatment,
        discount: group.discount,
        items: [],
        totalQty: 0,
        custom_price: group.custom_price != null ? Number(group.custom_price) : null,
        custom_price_reason: (group.custom_price_reason || '').trim() || null
      };
    }

    if (Array.isArray(group.items)) {
      groupedDetails[key].items.push(...group.items);
      groupedDetails[key].totalQty += group.items.length;
    } else {
      groupedDetails[key].totalQty += 1;
    }
  });

  // Untuk breakdown per layanan (setelah grouping)
  const detailsArr = Object.values(groupedDetails).map(group => {
    const base = group.custom_price != null
      ? Number(group.custom_price)
      : Number(group.treatment?.price || 0);
    const qty = group.totalQty;

    // Hapus process time cost (tidak digunakan lagi)
    const afterProcess = base;

    let discountAmount = 0;
    const discount = group.discount;
    let discountLabel = '';
    if (discount && discount.type) {
      const discVal = (discount.discount != null) ? Number(discount.discount) : Number(discount.value) || 0;
      if (discount.type === 'percent') {
        discountAmount = afterProcess * (discVal / 100);
        discountLabel = `${discVal}%`;
      } else if (discount.type === 'nominal') {
        discountAmount = discVal;
        discountLabel = formatCurrency(discVal);
      }
    }
    const finalPerItem = Math.max(0, Math.round(afterProcess - discountAmount));
    const totalFinal = finalPerItem * qty;
    return {
      name: group.treatment?.name || '-',
      qty,
      base,
      discountLabel,
      discountAmount,
      finalPerItem,
      totalFinal
    };
  });

  const showInvoiceButtons = location.pathname.includes('/order-detail') || location.pathname.includes('/quick-order');
  const isFromQuickOrder = location.pathname.includes('/quick-order');

  // Fetch branch info from API
  const fetchBranchInfo = async (branchId) => {
    try {
      const response = await instance.get(`/branches/${branchId}`);
      if (response.data.success) {
        setBranchInfo(response.data.data);
      } else {
        setBranchInfo(null);
      }
    } catch (error) {
      console.error('Error fetching branch info:', error);
      setBranchInfo(null);
    }
  };

  // Fetch tenant info from API
  const fetchTenantInfo = async (tenantId) => {
    try {
      const response = await instance.get(`/tenants/${tenantId}`);
      if (response.data.success) {
        setTenantInfo(response.data.data);
      } else {
        setTenantInfo(null);
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error);
      setTenantInfo(null);
    }
  };

  const testPrintInvoice = async () => {
    try {
      // Generate invoice content untuk test
      const { generateInvoiceContent } = await import('../../services/thermalPrinterInvoiceTemplate');
      // ✅ Cek isFirstOrder dari customer total_orders (konsisten dengan mobile)
      const isFirstOrder = order.customer?.total_orders === 0 || order.customer?.total_orders === undefined;
      const invoiceContent = generateInvoiceContent(order, tenantInfo, branchInfo, printerSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);

      alert('Invoice content telah di-log ke console! Cek Developer Tools > Console');

    } catch (error) {
      console.error('❌ Test print invoice error:', error);
      alert('Gagal generate invoice content: ' + error.message);
    }
  };

  // Fetch printer settings from API
  const fetchPrinterSettings = async () => {
    try {
      const response = await instance.get('/printer-settings');
      if (response.data.success) {
        const settings = response.data.data || {};
        setPrinterSettings({
          show_logo: Boolean(settings.show_logo),
          logo_url: settings.logo_url || null,
          show_qr_code: Boolean(settings.show_qr_code),
          custom_thank_you: settings.custom_thank_you || null,
          footer_notes: settings.footer_notes || null,
          instagram: settings.instagram || null,
          website: settings.website || null,
          promo_text: settings.promo_text || null
        });
      } else {
        setPrinterSettings(null);
      }
    } catch (error) {
      console.error('Error fetching printer settings:', error);
      setPrinterSettings(null);
    }
  };

  // Simpan pilihan printer ke thermalPrinterService (termasuk device id untuk
  // reconnect senyap di print berikutnya).
  const applyPrinter = (printer, paperWidthOverride = null) => {
    if (!printer) return false;
    const paperWidth = paperWidthOverride || printer.paper_width;
    thermalPrinterService.addPrinterConfig(
      printer.device_name,
      printer.service_uuid,
      printer.characteristic_uuid,
      paperWidth
    );
    thermalPrinterService.setCurrentPrinter({
      name: printer.device_name,
      service_uuid: printer.service_uuid,
      characteristic_uuid: printer.characteristic_uuid,
      paper_width: paperWidth,
      device_id: printer.device_id || printer.deviceId || null,
      status: printer.status || 'active',
      is_default: true
    });
    return true;
  };

  // Fallback: pakai printer yang sudah tersimpan di browser (tanpa daftar server)
  const applyLocalPrinter = () => {
    const localPrinter = thermalPrinterService.getLocalPrinter();
    if (!localPrinter) return false;
    setSelectedPrinter(localPrinter);
    setPrinterSource('local');
    applyPrinter(localPrinter);
    return true;
  };

  // Hubungkan / ganti printer langsung dari browser (tanpa Printer Management)
  const handleConnectPrinter = async () => {
    setIsConnectingPrinter(true);
    setPrintError(null);
    try {
      const printer = await thermalPrinterService.pairPrinter();
      setSelectedPrinter(printer);
      setPrinterSource('local');
      setPrinterList((prev) => [
        ...prev.filter((p) => p.device_id !== printer.device_id && p.device_name !== printer.device_name),
        printer
      ]);
      applyPrinter(printer);
      checkPrinterStatus();
    } catch (error) {
      // NotFoundError = user menutup chooser, tidak perlu alert
      if (error?.name !== 'NotFoundError') {
        console.error('Connect printer error:', error);
        alert(error?.message || 'Gagal menghubungkan printer.');
      }
    } finally {
      setIsConnectingPrinter(false);
    }
  };

  // Pastikan ada printer siap pakai. Kalau belum pernah dipilih, buka chooser
  // Bluetooth sekali lalu simpan hasilnya di browser.
  const ensurePrinter = async () => {
    if (selectedPrinter) return selectedPrinter;

    const printer = await thermalPrinterService.pairPrinter();
    setSelectedPrinter(printer);
    setPrinterSource('local');
    setPrinterList((prev) => [
      ...prev.filter((p) => p.device_id !== printer.device_id && p.device_name !== printer.device_name),
      printer
    ]);
    applyPrinter(printer);
    checkPrinterStatus();
    return printer;
  };

  // Fetch printers from API based on current branch
  const fetchPrinters = async () => {
    setIsLoadingPrinters(true);
    setPrinterError(null);
    try {
      // Get current branch from API
      const profile = await getUserProfile();
      const userBranchId = profile?.branch?.id;

      if (!userBranchId) {
        throw new Error('Branch ID not found in user data');
      }

      // Get tenant ID from user profile
      const tenantId = profile?.user?.tenant_id;

      // ✅ Use order's branch_id for branch info (invoice address/phone should match order branch, not user branch)
      // Printer still uses userBranchId since the connected printer is at user's current branch
      const orderBranchId = order?.branch_id || userBranchId; // Fallback to user branch if order.branch_id not available

      // Fetch branch info, tenant info, and printers in parallel
      const [printersResponse] = await Promise.all([
        instance.get(`/printers?branch_id=${userBranchId}`), // ✅ Printer dari user branch
        fetchBranchInfo(orderBranchId), // ✅ Branch info dari order branch
        tenantId ? fetchTenantInfo(tenantId) : Promise.resolve()
      ]);

      if (printersResponse.data.success) {
        const printers = printersResponse.data.data || [];
        setPrinterList(printers);

        // Prioritas: printer default dari server, lalu yang aktif
        const activePrinter = printers.find(p => p.is_default)
          || printers.find(p => p.status === 'active')
          || printers[0];

        if (activePrinter) {
          setSelectedPrinter(activePrinter);
          setPrinterSource('server');
          applyPrinter(activePrinter);
        } else if (!applyLocalPrinter()) {
          // Tidak ada printer terdaftar: biarkan user hubungkan langsung
          console.warn('No printers found for this branch');
          setPrinterError('Belum ada printer. Hubungkan printer Bluetooth langsung dari tombol di atas.');
        }
      } else {
        throw new Error('Failed to fetch printers');
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      if (!applyLocalPrinter()) {
        setPrinterError('Belum ada printer. Hubungkan printer Bluetooth langsung dari tombol di atas.');
      }
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  // Pre-load template saat modal dibuka untuk optimasi copy
  const preLoadTemplate = async () => {
    try {
      setIsLoadingTemplate(true);
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      const tenantId = profile?.tenant?.id;

      if (!branchId || !tenantId) return;

      // Calculate payment status untuk determine category
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = summaryOrderDetails.total || 0;

      let finalTotal = subtotal;
      if (order.payment?.final_price != null) {
        finalTotal = Number(order.payment.final_price);
      } else {
        let totalDiscount = 0;
        if (order.payment?.total_discount != null) {
          totalDiscount = Number(order.payment.total_discount);
        } else {
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

      // Determine category
      let category = 'invoice_unpaid';
      if (finalTotal === 0) {
        category = 'invoice_paid';
      } else if (totalPaid === 0) {
        category = 'invoice_unpaid';
      } else if (totalPaid > 0 && totalPaid < finalTotal) {
        category = 'invoice_dp';
      } else if (totalPaid >= finalTotal) {
        category = 'invoice_paid';
      }

      // Fetch template
      const response = await instance.get(`/invoice-templates/template/${branchId}/${category}`);

      if (response.data.success && response.data.data.template?.template_content) {
        setLoadedTemplateContent(response.data.data.template.template_content);
        setTemplateCategory(category);
        console.log(`✅ Template pre-loaded: ${category}`);
      }
    } catch (error) {
      console.error('Error pre-loading template:', error);
      setLoadedTemplateContent(null);
      setTemplateCategory(null);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Fetch earn_rate and enabled from points settings
  const fetchEarnRate = async () => {
    try {
      const response = await instance.get('/points-settings');
      if (response.data.success && response.data.data) {
        // Ambil earn_rate dan enabled dari response
        setEarnRate(Number(response.data.data.earn_rate) || 1000);
        setPointsEnabled(Boolean(response.data.data.enabled) || false);
        // ✅ Save points settings for expected bonus calculation
        setPointsSettings({
          first_order_bonus: Number(response.data.data.first_order_bonus) || 0,
          first_order_bonus_enabled: Boolean(response.data.data.first_order_bonus_enabled !== undefined ? response.data.data.first_order_bonus_enabled : true)
        });
      }
    } catch (error) {
      console.error('Error fetching points settings, using default:', error);
      // Keep default values if fetch fails
    }
  };

  // Fetch bonus points from PointTransaction for this order
  // ✅ FIX: Calculate expected bonus if order unpaid + customer baru (following payment step logic)
  const fetchBonusPoints = async () => {
    if (!order?.id || !order?.customer?.id) return;

    // ✅ Fetch points settings first to get first_order_bonus, first_order_bonus_enabled, and referral_bonus_new_customer
    let currentPointsSettings = pointsSettings;
    try {
      const settingsResponse = await instance.get('/points-settings');
      if (settingsResponse.data.success && settingsResponse.data.data) {
        currentPointsSettings = {
          first_order_bonus: Number(settingsResponse.data.data.first_order_bonus) || 0,
          first_order_bonus_enabled: Boolean(settingsResponse.data.data.first_order_bonus_enabled !== undefined ? settingsResponse.data.data.first_order_bonus_enabled : true),
          referral_bonus_new_customer: Number(settingsResponse.data.data.referral_bonus_new_customer) || 0
        };
        // Update state if different
        if (currentPointsSettings.first_order_bonus !== pointsSettings.first_order_bonus ||
          currentPointsSettings.first_order_bonus_enabled !== pointsSettings.first_order_bonus_enabled ||
          currentPointsSettings.referral_bonus_new_customer !== (pointsSettings.referral_bonus_new_customer || 0)) {
          setPointsSettings(currentPointsSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching points settings in fetchBonusPoints, using existing state:', error);
    }

    try {
      // Fetch point history untuk customer ini
      const response = await instance.get(`/points/customers/${order.customer.id}/history?limit=100`);
      if (response.data.success && response.data.data?.data) {
        // Filter PointTransaction untuk order ini dengan type='bonus'
        const bonusTransactions = response.data.data.data.filter(pt =>
          pt.order_id === order.id &&
          pt.type === 'bonus' &&
          pt.points > 0
        );

        let firstOrderBonus = 0;
        let referralBonus = 0;

        bonusTransactions.forEach(pt => {
          // ✅ FIX: Gunakan bonus_type field (lebih reliable daripada description matching)
          const bonusType = pt.bonus_type || '';

          // First Order Bonus
          if (bonusType === 'first_order') {
            firstOrderBonus += pt.points;
          }
          // Referral Bonus untuk customer baru (yang melakukan order)
          // Referral bonus untuk referrer tidak ditampilkan di struk customer
          else if (bonusType === 'referral_new_customer') {
            referralBonus += pt.points;
          }
          // Fallback: jika bonus_type belum ada, gunakan description matching (backward compatibility)
          else if (!bonusType) {
            const description = (pt.description || '').toLowerCase();
            if (description.includes('first order bonus')) {
              firstOrderBonus += pt.points;
            } else if (description.includes('referral bonus') && description.includes('new customer')) {
              referralBonus += pt.points;
            }
          }
        });

        // ✅ FIX: Calculate expected bonus if order unpaid + customer baru (belum pernah punya paid order)
        // Backend logic: bonus diberikan saat order PAID pertama kali, bukan order dibuat pertama kali
        const paymentStatus = order.payment?.status || 'unpaid';
        // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
        const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
        // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
        const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);

        // ✅ Calculate expected first order bonus if unpaid + customer baru
        if (firstOrderBonus === 0 && paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
          firstOrderBonus = currentPointsSettings.first_order_bonus;
          console.log('✅ [QuickOrderPrintReceipt] Using expected first order bonus for unpaid order:', firstOrderBonus);
        }

        // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
        if (referralBonus === 0 && paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
          referralBonus = currentPointsSettings.referral_bonus_new_customer;
          console.log('✅ [QuickOrderPrintReceipt] Using expected referral bonus for unpaid order:', {
            referralBonus,
            hasReferral,
            referrer: order.referrer,
            referred_by_phone: order.referred_by_phone,
            referred_by: order.referred_by
          });
        }

        setBonusPoints({ firstOrder: firstOrderBonus, referral: referralBonus });
      } else {
        // ✅ FIX: If no transactions found and order unpaid + customer baru (belum pernah punya paid order), calculate expected bonus
        const paymentStatus = order.payment?.status || 'unpaid';
        // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
        const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
        // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
        const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);

        let expectedFirstOrderBonus = 0;
        let expectedReferralBonus = 0;

        // Calculate expected first order bonus
        if (paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
          expectedFirstOrderBonus = currentPointsSettings.first_order_bonus;
          console.log('✅ [QuickOrderPrintReceipt] Using expected first order bonus (no transactions):', expectedFirstOrderBonus);
        }

        // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
        if (paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
          expectedReferralBonus = currentPointsSettings.referral_bonus_new_customer;
          console.log('✅ [QuickOrderPrintReceipt] Using expected referral bonus (no transactions):', {
            expectedReferralBonus,
            hasReferral,
            referrer: order.referrer,
            referred_by_phone: order.referred_by_phone,
            referred_by: order.referred_by
          });
        }

        setBonusPoints({ firstOrder: expectedFirstOrderBonus, referral: expectedReferralBonus });
      }
    } catch (error) {
      console.error('Error fetching bonus points, using default:', error);
      // ✅ FIX: If fetch fails and order unpaid + customer baru (belum pernah punya paid order), try to use expected bonus
      const paymentStatus = order.payment?.status || 'unpaid';
      // ✅ FIX: Gunakan has_received_first_order_bonus (lebih akurat - hanya true jika pernah dapat bonus saat paid)
      const isNewCustomer = order.customer?.has_received_first_order_bonus === false || order.customer?.has_received_first_order_bonus === undefined;
      // ✅ FIX: Cek referrer object (jika ada, berarti order pakai referral)
      const hasReferral = order.referrer != null || (order.referred_by_phone != null && order.referred_by_phone !== '') || (order.referred_by != null && order.referred_by !== null);

      let expectedFirstOrderBonus = 0;
      let expectedReferralBonus = 0;

      // Calculate expected first order bonus
      if (paymentStatus !== 'paid' && isNewCustomer && currentPointsSettings.first_order_bonus_enabled && currentPointsSettings.first_order_bonus > 0) {
        expectedFirstOrderBonus = currentPointsSettings.first_order_bonus;
        console.log('✅ [QuickOrderPrintReceipt] Using expected first order bonus (fetch failed):', expectedFirstOrderBonus);
      }

      // ✅ Calculate expected referral bonus if unpaid + ada referral (cek dari referrer object)
      if (paymentStatus !== 'paid' && hasReferral && currentPointsSettings.referral_bonus_new_customer > 0) {
        expectedReferralBonus = currentPointsSettings.referral_bonus_new_customer;
        console.log('✅ [QuickOrderPrintReceipt] Using expected referral bonus (fetch failed):', {
          expectedReferralBonus,
          hasReferral,
          referrer: order.referrer,
          referred_by_phone: order.referred_by_phone,
          referred_by: order.referred_by
        });
      }

      setBonusPoints({ firstOrder: expectedFirstOrderBonus, referral: expectedReferralBonus });
    }
  };

  useEffect(() => {
    const fetchInvoiceUrl = async () => {
      try {
        const res = await instance.get(`/url-by-order-id?order_id=${order.id}`);
        const json = res.data;
        if (json.success && json.data && json.data.invoiceUrl) {
          setInvoiceUrl(json.data.invoiceUrl);
        } else {
          setInvoiceUrl('');
        }
      } catch (err) {
        setInvoiceUrl('');
      }
    };
    fetchInvoiceUrl();

    // Pre-load template untuk optimasi copy
    preLoadTemplate();

    // Fetch printers and printer settings on component mount
    fetchPrinters();
    fetchPrinterSettings();
    fetchEarnRate();
    fetchBonusPoints();
  }, [order.id]);

  // Helper functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const getHardcodedTemplate = (category) => {
    const templates = {
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

    return templates[category] || templates.invoice_unpaid;
  };

  const processTemplate = async (templateContent, variables) => {
    try {
      const response = await instance.post('/invoice-templates/preview', {
        template_content: templateContent,
        variables: variables
      });

      if (response.data.success) {
        return response.data.data.processed_content;
      } else {
        throw new Error('Failed to process template');
      }
    } catch (error) {
      console.error('Error processing template:', error);
      // Fallback ke manual processing
      let processedContent = templateContent;
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, variables[key]);
      });
      return processedContent;
    }
  };

  const handleSaveTemplate = async (content) => {
    setIsSaving(true);
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;

      // ✅ FIX: Determine category based on finalTotal (after discounts), not subtotal
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = summaryOrderDetails.total || 0;

      // Calculate final total from payment.final_price (after all discounts)
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

      let category = 'invoice_unpaid';
      if (finalTotal === 0) {
        category = 'invoice_paid'; // Free service or fully discounted
      } else if (totalPaid >= finalTotal) {
        category = 'invoice_paid';
      } else if (totalPaid > 0) {
        category = 'invoice_dp';
      }

      const response = await instance.post(`/invoice-templates/branch/${branchId}`, {
        category: category,
        title: `Template ${category} - Branch ${branchId}`,
        description: `Template untuk ${category} branch ${branchId}`,
        template_content: content,
        variables: extractVariables(content),
        is_active: true
      });

      if (response.data.success) {
        alert('Template berhasil disimpan ke database!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Gagal menyimpan template: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const extractVariables = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
  };

  // Preview invoice message
  const handlePreviewInvoice = async () => {
    if (!waConnected) {
      alert('WhatsApp belum terhubung. Silakan cek koneksi terlebih dahulu.');
      return;
    }

    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      const tenantId = profile?.tenant?.id;

      // ✅ FIX: Calculate final total (after all discounts) instead of subtotal
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = summaryOrderDetails.total || 0;

      // Calculate final total from payment.final_price (after all discounts)
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

      // ✅ FIX: Determine category based on finalTotal (after discounts), not subtotal
      let category = 'invoice_unpaid';
      if (finalTotal === 0) {
        category = 'invoice_paid'; // Free service or fully discounted
      } else if (totalPaid >= finalTotal) {
        category = 'invoice_paid';
      } else if (totalPaid > 0) {
        category = 'invoice_dp';
      }

      let templateContent = '';
      let isFromDatabase = false;

      // Fetch template from database (backend will auto-generate if not exists)
      try {
        const response = await instance.get(`/invoice-templates/template/${branchId}/${category}`);
        if (response.data.success && response.data.data.template) {
          templateContent = response.data.data.template.template_content;
          isFromDatabase = true;
        } else {
          throw new Error('No template found in database');
        }
      } catch (error) {
        console.error('❌ Error fetching template:', error);
        alert('Gagal memuat template: ' + error.message);
        return;
      }

      // ✅ FIX: Process template dengan variables using finalTotal (after discounts)
      const variables = {
        customer_name: order.customer?.name || '',
        tenant_name: profile?.tenant?.business_name || 'NotaSepatu',
        order_number: order.payment?.code || order.id || '',
        total_amount: formatCurrency(finalTotal), // ✅ Use finalTotal, not subtotal
        paid_amount: formatCurrency(totalPaid),
        remaining_amount: formatCurrency(remainingAmount), // ✅ Based on finalTotal
        total_payment: formatCurrency(totalPaid || finalTotal), // ✅ Use finalTotal
        invoice_url: invoiceUrl.startsWith('http') ? invoiceUrl : `https://${invoiceUrl}`,
        greeting: getGreeting()
      };

      // Process template
      const processedMessage = await processTemplate(templateContent, variables);

      // Set states
      setPreviewMessage(processedMessage);
      setTemplateContent(templateContent);
      setShowPreviewModal(true);

    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Gagal membuat preview pesan: ' + error.message);
    }
  };

  const handleThermalPrint = async () => {
    setIsPrinting(true);
    setPrintError(null);

    try {
      if (printType === 'invoice') {
        // ✅ Cek isFirstOrder dari customer total_orders (konsisten dengan mobile)
        const isFirstOrder = order.customer?.total_orders === 0 || order.customer?.total_orders === undefined;
        await thermalPrinterService.printInvoice(resolvedOrder, tenantInfo, branchInfo, printerSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
        alert('Invoice berhasil dicetak!');
      } else {
        await thermalPrinterService.printChecklist(resolvedOrder);
        alert('Checklist berhasil dicetak!');
      }
    } catch (error) {
      console.error('Thermal print error:', error);
      setPrintError('Gagal mencetak. Pastikan printer terhubung.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWebPrint = () => {
    window.print();
  };

  const handleChangePrinter = (e) => {
    const printerId = e.target.value;
    const printer = printerList.find(p => p.id.toString() === printerId);
    if (printer) {
      setSelectedPrinter(printer);
      setPrinterSource(printer.source === 'local' ? 'local' : 'server');
      applyPrinter(printer);
    }
  };

  // Helper: Generate available items untuk Tag tab (from PrintChecklistModal)
  const generateAvailableItems = (orderData) => {
    const items = [];
    let globalIndex = 0;

    (orderData?.order_details || []).forEach(group => {
      (group.items || []).forEach(item => {
        items.push({
          id: `${group.treatment?.id}-${group.discount?.id || 'no-discount'}-${globalIndex}`,
          groupKey: `${group.treatment?.id}-${group.discount?.id || 'no-discount'}`,
          treatment: group.treatment?.name || 'Unknown Treatment',
          processTime: group.process_time || 'standard',
          dueDate: group.due_date || new Date().toISOString().slice(0, 10),
          item: {
            brand: item.brand || '',
            name: item.name || '',
            color: item.color || '',
            parfum: item.parfum || '',
            notes: item.notes || item.description || '',
            tag_number: item.tag_number != null ? item.tag_number : null
          },
          tagNumber: item.tag_number != null ? item.tag_number : null,
          orderDetailId: item.order_detail_id,
          globalIndex: globalIndex
        });
        globalIndex++;
      });
    });

    return items;
  };

  const availableItems = generateAvailableItems(resolvedOrder);
  const totalItems = availableItems.length;

  // Helper: Handle item selection untuk Tag tab
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
    setPrintAll(false);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === totalItems) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
    }
    setPrintAll(false);
  };

  const handlePrintAllToggle = () => {
    setPrintAll(true);
    setSelectedItems([]);
  };

  const formatProcessTime = (processTime) => {
    if (processTime === 'same_day') return 'Same Day';
    if (processTime === '2_days') return '2 Hari';
    if (processTime === '3_days') return '3 Hari';
    if (processTime === '1_week') return '1 Minggu';
    return processTime;
  };

  const formatDateTag = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Helper: cek item yang belum lengkap (name/brand kosong)
  function getIncompleteItems() {
    const result = [];
    (order.order_details || []).forEach((group, groupIdx) => {
      // Cek array items (bukan item tunggal)
      if (Array.isArray(group.items)) {
        group.items.forEach((item, itemIdx) => {
          if (!item.name || !item.brand) {
            result.push({
              groupIdx,
              itemIdx,
              treatment: group.treatment?.name || '-',
              ...item
            });
          }
        });
      }
    });
    return result;
  }

  // Handler untuk preview/kirim invoice dengan validasi item
  const handleInvoiceAction = async (type) => {
    const incomplete = getIncompleteItems();
    if (type === 'preview') {
      if (invoiceUrl) {
        window.open(invoiceUrl.startsWith('http') ? invoiceUrl : `https://${invoiceUrl}`, '_blank');
      } else {
        alert('URL invoice tidak ditemukan.');
      }
    } else if (type === 'send') {
      setIsSending(true);
      try {
        const res = await instance.post('/send-by-order-id', { order_id: order.id });
        const json = res.data;
        if (json.success) {
          alert('Invoice berhasil dikirim ke pelanggan!');
          setInvoiceStatus('sent');
          setInvoiceSent(true);
        } else {
          alert('Gagal mengirim invoice digital.');
        }
      } catch (err) {
        alert('Gagal mengirim invoice digital.');
      } finally {
        setIsSending(false);
      }
    }
  };

  // Handler untuk copy invoice (untuk WhatsApp tab)
  const [copied, setCopied] = useState(false);
  const handleCopyInvoiceForWA = async () => {
    await handleCopyInvoiceText();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handler untuk pilihan WA Web
  const handleWAWeb = () => {
    if (!order.customer?.phone) {
      alert('Nomor telepon customer tidak ditemukan.');
      return;
    }

    // Hapus karakter non-digit dari nomor telepon
    const phoneNumber = order.customer.phone.replace(/\D/g, '');

    // Jika nomor dimulai dengan 0, ganti dengan 62
    const formattedPhone = phoneNumber.startsWith('0') ? '62' + phoneNumber.substring(1) : phoneNumber;

    // Buka WhatsApp Web dengan nomor customer
    window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}`, '_blank');
    setShowWAModal(false);
  };

  // Handler untuk pilihan WA Aplikasi
  const handleWAApp = () => {
    if (!order.customer?.phone) {
      alert('Nomor telepon customer tidak ditemukan.');
      return;
    }

    // Hapus karakter non-digit dari nomor telepon
    const phoneNumber = order.customer.phone.replace(/\D/g, '');

    // Jika nomor dimulai dengan 0, ganti dengan 62
    const formattedPhone = phoneNumber.startsWith('0') ? '62' + phoneNumber.substring(1) : phoneNumber;

    // Buka WhatsApp App dengan nomor customer
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
    setShowWAModal(false);
  };

  // Handle print tiket dapur (satu tiket per dapur produksi)
  const handlePrintKitchenTickets = async () => {
    if (!kitchenTickets.length) {
      alert('Tidak ada tiket dapur untuk dicetak.');
      return;
    }

    setIsPrintingKitchen(true);
    setPrintError(null);
    try {
      const printer = await ensurePrinter();
      applyPrinter(printer);

      const result = await thermalPrinterService.printKitchenTickets(kitchenTickets);
      if (result === false || result === null || result === undefined) {
        throw new Error('Print cancelled or failed');
      }

      alert(`Tiket dapur berhasil dicetak (${kitchenTickets.length} tiket)!`);
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      if (error?.name === 'NotFoundError') return; // user menutup chooser Bluetooth
      setPrintError('Gagal mencetak tiket dapur. Pastikan printer terhubung.');
      alert('Gagal mencetak tiket dapur. Pastikan printer terhubung dan coba lagi.');
    } finally {
      setIsPrintingKitchen(false);
    }
  };

  // Handle print all item tags
  const handlePrintAllChecklist = async () => {
    setIsPrintingChecklist(true);
    setPrintError(null);
    try {

      const printer = await ensurePrinter();
      applyPrinter(printer);

      const result = await thermalPrinterService.printChecklist(resolvedOrder);

      // Cek apakah print berhasil atau tidak
      if (result === false || result === null || result === undefined) {
        throw new Error('Print cancelled or failed');
      }

      alert('Tag berhasil dicetak!');
    } catch (error) {
      console.error('Print item tag error:', error);
      setPrintError('Gagal mencetak tag. Pastikan printer terhubung.');
      alert('Gagal mencetak tag. Pastikan printer terhubunkan dan coba lagi.');
    } finally {
      setIsPrintingChecklist(false);
    }
  };

  // Handle print selected item tags
  const handlePrintSelectedChecklist = async (selectedItemIds) => {
    setIsPrintingChecklist(true);
    setPrintError(null);
    try {

      const printer = await ensurePrinter();
      applyPrinter(printer);

      // Filter order data berdasarkan selected items
      const filteredOrder = filterOrderBySelectedItems(resolvedOrder, selectedItemIds);

      // Tambahkan informasi original untuk numbering yang benar
      const orderWithOriginalInfo = {
        ...filteredOrder,
        originalTotalItems: (() => {
          let total = 0;
          (resolvedOrder?.order_details || []).forEach(group => {
            total += (group.items || []).length;
          });
          return total;
        })(),
        originalItemMapping: (() => {
          const mapping = {};
          let globalIndex = 0;
          (resolvedOrder?.order_details || []).forEach(group => {
            (group.items || []).forEach(item => {
              const groupKey = `${group.treatment?.id}-${group.discount?.id || 'no-discount'}`;
              const itemId = `${groupKey}-${globalIndex}`;
              mapping[itemId] = globalIndex;
              globalIndex++;
            });
          });
          return mapping;
        })()
      };

      const result = await thermalPrinterService.printChecklist(orderWithOriginalInfo);

      // Cek apakah print berhasil atau tidak
      if (result === false || result === null || result === undefined) {
        throw new Error('Print cancelled or failed');
      }

      alert(`Tag berhasil dicetak untuk ${selectedItemIds.length} item!`);
    } catch (error) {
      console.error('Print selected item tag error:', error);
      setPrintError('Gagal mencetak item tag. Pastikan printer terhubung.');
      alert('Gagal mencetak item tag. Pastikan printer terhubung dan coba lagi.');
    } finally {
      setIsPrintingChecklist(false);
    }
  };

  // Filter order data berdasarkan selected items
  const filterOrderBySelectedItems = (orderData, selectedItemIds) => {
    const filteredOrderDetails = [];
    let globalIndex = 0; // Gunakan globalIndex seperti di modal

    (orderData?.order_details || []).forEach((group, groupIndex) => {
      const filteredItems = (group.items || []).filter((item, itemIndex) => {
        const groupKey = `${group.treatment?.id}-${group.discount?.id || 'no-discount'}`;
        const itemId = `${groupKey}-${globalIndex}`; // Gunakan globalIndex, bukan itemIndex
        const isIncluded = selectedItemIds.includes(itemId);

        // Tambahkan originalGlobalIndex ke item jika ter-include
        if (isIncluded) {
          item.originalGlobalIndex = globalIndex;
        }

        globalIndex++; // Increment globalIndex untuk setiap item
        return isIncluded;
      });

      if (filteredItems.length > 0) {
        filteredOrderDetails.push({
          ...group,
          items: filteredItems
        });
      }
    });

    const result = {
      ...orderData,
      order_details: filteredOrderDetails
    };

    return result;
  };

  // Helper: Format currency untuk template
  const formatCurrencyForTemplate = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
    const numAmount = Number(amount);
    if (numAmount === 0) return 'Rp0';
    return 'Rp' + numAmount.toLocaleString('id-ID');
  };

  // Helper: Process template dengan variables (sync version untuk copy)
  const processTemplateSync = (content, variables) => {
    let processed = content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    return processed;
  };

  // Helper: Remove http:// or https:// from URL
  const removeUrlProtocol = (url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  };

  // Helper: Generate info_poin text (mirip InvoiceTemplateModal tapi untuk WhatsApp)
  const generateInfoPoinText = (finalTotal, totalPaid, paymentStatus, currentPoints, membershipName) => {
    if (!pointsEnabled) return '';

    // Calculate points: PAID = dari paid_amount, DP/UNPAID = dari final_price (potensi)
    let pointsEarned = 0;
    let pointsLabel = '';
    if (paymentStatus === 'paid' && totalPaid > 0) {
      pointsEarned = Math.floor(totalPaid / earnRate);
      pointsLabel = 'Poin Didapat';
    } else if (finalTotal > 0) {
      pointsEarned = Math.floor(finalTotal / earnRate);
      pointsLabel = 'Poin Menunggu';
    }

    // Build info poin text (format text biasa untuk WhatsApp)
    let infoPoinText = '*** REWARD POIN ***\n\n';

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

    // ✅ REMOVED: Poin Saat Ini dipindahkan ke header sebagai "Poin Terkumpul" (di generateInvoiceVariables)

    // Membership (if exists)
    if (membershipName) {
      infoPoinText += `Membership: ${membershipName}\n`;
    }

    // Add promotional text
    infoPoinText += '\n(Tukar poin kamu jadi diskon!)';

    return infoPoinText;
  };

  // Helper: Generate invoice text (untuk pre-generate)
  const generateInvoiceText = async () => {
    try {
      // ✅ FIX: Calculate final total (after all discounts) instead of subtotal
      const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const subtotal = summaryOrderDetails.total || 0;

      // Calculate final total from payment.final_price (after all discounts)
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

      // ✅ FIX: Determine category based on finalTotal (after discounts), not subtotal
      let paymentStatus = '';
      let category = 'invoice_unpaid';
      if (finalTotal === 0) {
        paymentStatus = PAYMENT_STATUS.PAID;
        category = 'invoice_paid'; // Free service or fully discounted
      } else if (totalPaid === 0) {
        paymentStatus = PAYMENT_STATUS.UNPAID;
        category = 'invoice_unpaid';
      } else if (totalPaid > 0 && totalPaid < finalTotal) {
        paymentStatus = PAYMENT_STATUS.DP;
        category = 'invoice_dp';
      } else if (totalPaid >= finalTotal) {
        paymentStatus = PAYMENT_STATUS.PAID;
        category = 'invoice_paid';
      }

      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      const tenantId = profile?.tenant?.id;

      let invoiceText = '';
      const cleanInvoiceUrl = removeUrlProtocol(invoiceUrl);

      try {
        if (branchId && tenantId) {
          const response = await instance.get(`/invoice-templates/template/${branchId}/${category}`);

          if (response.data.success && response.data.data.template?.template_content) {
            // Get customer points (jika sistem poin aktif)
            const customerPoints = order.customer?.points != null ? Number(order.customer.points) : null;
            const customerPointsText = customerPoints != null ? customerPoints.toString() : '';

            // Generate info_poin text
            const paymentStatusForPoints = order.payment?.status || 'unpaid';
            const currentPoints = order.customer?.points != null ? Number(order.customer.points) : 0;
            const membershipName = order.customer?.current_membership?.membership?.name || null;
            const infoPoinText = generateInfoPoinText(finalTotal, totalPaid, paymentStatusForPoints, currentPoints, membershipName);

            // ✅ FIX: Use finalTotal (after discounts) for all variables
            const variables = {
              greeting: getGreeting(),
              customer_name: order.customer?.name || '',
              tenant_name: profile?.tenant?.business_name || 'NotaSepatu',
              order_number: order.id || '',
              total_amount: formatCurrencyForTemplate(finalTotal), // ✅ Use finalTotal, not subtotal
              paid_amount: formatCurrencyForTemplate(totalPaid),
              remaining_amount: formatCurrencyForTemplate(remainingAmount), // ✅ Based on finalTotal
              total_payment: formatCurrencyForTemplate(totalPaid || finalTotal), // ✅ Use finalTotal
              customer_points: customerPointsText, // ✅ Poin customer (jika sistem poin aktif)
              info_poin: infoPoinText, // ✅ Info poin lengkap (semua info sekaligus)
              invoice_url: cleanInvoiceUrl
            };
            invoiceText = processTemplateSync(response.data.data.template.template_content, variables);
          } else {
            throw new Error('Template not found');
          }
        } else {
          throw new Error('Branch ID or Tenant ID not found');
        }
      } catch (templateError) {
        console.log('Template not found or error, using fallback:', templateError);
        invoiceText = WhatsAppFormatter.formatInvoiceMessage({
          customerName: order.customer?.name || '',
          orderNumber: order.id || '',
          amount: finalTotal, // ✅ Use finalTotal (after discounts)
          totalAmount: finalTotal, // ✅ Use finalTotal (after discounts), not subtotal
          totalPaid: totalPaid,
          remainingAmount: remainingAmount,
          paymentStatus: paymentStatus,
          invoiceUrl: cleanInvoiceUrl,
          businessName: profile?.tenant?.business_name || 'NotaSepatu'
        });
      }

      return invoiceText;
    } catch (err) {
      console.error('Error generating invoice text:', err);
      return '';
    }
  };

  // Removed pre-generate: Template akan di-fetch fresh setiap kali user klik Copy Invoice

  // Helper: Copy to clipboard dengan fallback
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (clipboardError) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) {
          throw new Error('execCommand failed');
        }
        return true;
      } catch (execError) {
        console.error('Fallback copy failed:', execError);
        throw new Error('Gagal copy text. Silakan copy manual.');
      }
    }
  };

  const handleCopyInvoiceText = async () => {
    setIsCopyingInvoice(true);
    setCopyStatus('');

    try {
      // ✅ OPTIMASI: Gunakan pre-loaded template jika ada, jika tidak fetch fresh
      let invoiceText = '';

      if (loadedTemplateContent && templateCategory) {
        // Process dari pre-loaded template (lebih cepat)
        const profile = await getUserProfile();
        const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
        const subtotal = summaryOrderDetails.total || 0;

        let finalTotal = subtotal;
        if (order.payment?.final_price != null) {
          finalTotal = Number(order.payment.final_price);
        } else {
          let totalDiscount = 0;
          if (order.payment?.total_discount != null) {
            totalDiscount = Number(order.payment.total_discount);
          } else {
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
        const cleanInvoiceUrl = removeUrlProtocol(invoiceUrl);

        // Get customer points (jika sistem poin aktif)
        const customerPoints = order.customer?.points != null ? Number(order.customer.points) : null;
        const customerPointsText = customerPoints != null ? customerPoints.toString() : '';

        // Generate info_poin text
        const paymentStatusForPoints = order.payment?.status || 'unpaid';
        const currentPoints = order.customer?.points != null ? Number(order.customer.points) : 0;
        const membershipName = order.customer?.current_membership?.membership?.name || null;
        const infoPoinText = generateInfoPoinText(finalTotal, totalPaid, paymentStatusForPoints, currentPoints, membershipName);

        const variables = {
          greeting: getGreeting(),
          customer_name: order.customer?.name || '',
          tenant_name: profile?.tenant?.business_name || 'NotaSepatu',
          order_number: order.id || '',
          total_amount: formatCurrencyForTemplate(finalTotal),
          paid_amount: formatCurrencyForTemplate(totalPaid),
          remaining_amount: formatCurrencyForTemplate(remainingAmount),
          total_payment: formatCurrencyForTemplate(totalPaid || finalTotal),
          customer_points: customerPointsText, // ✅ Poin customer (jika sistem poin aktif)
          info_poin: infoPoinText, // ✅ Info poin lengkap (semua info sekaligus)
          invoice_url: cleanInvoiceUrl
        };

        invoiceText = processTemplateSync(loadedTemplateContent, variables);
      } else {
        // Fallback: fetch fresh jika pre-load belum selesai atau gagal
        console.log('⚠️ Pre-loaded template not available, fetching fresh...');
        invoiceText = await generateInvoiceText();
      }

      if (!invoiceText) {
        throw new Error('Gagal generate invoice text');
      }

      await copyToClipboard(invoiceText);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      console.error('Error in handleCopyInvoiceText:', err);
      alert('Gagal copy text invoice: ' + err.message);
    } finally {
      setIsCopyingInvoice(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 sm:p-8 animate-fade-in" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-telaga-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-telaga-600 to-senja-500 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white font-montserrat leading-tight truncate">
                Invoice Pelanggan
              </h3>
              <p className="text-[11px] text-white/70 font-montserrat truncate">
                Cetak &amp; kirim bukti transaksi
              </p>
            </div>
          </div>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors flex-shrink-0"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation — tab TAG & WHATSAPP disembunyikan (kode tetap ada,
            cukup hapus komentar untuk memunculkan kembali). */}
        <div className="flex-shrink-0 px-4 pt-3 pb-3 bg-white border-b border-telaga-100">
          <div className="flex gap-1.5 p-1 rounded-xl bg-telaga-50/70 border border-telaga-100">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-montserrat transition-all ${activeTab === 'invoice'
                  ? 'bg-white text-telaga-700 shadow-sm'
                  : 'text-telaga-900/50 hover:text-telaga-900/70'
                }`}
            >
              <FileText className="w-4 h-4" />
              INVOICE
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-montserrat transition-all ${activeTab === 'kitchen'
                  ? 'bg-white text-telaga-700 shadow-sm'
                  : 'text-telaga-900/50 hover:text-telaga-900/70'
                }`}
            >
              <ChefHat className="w-4 h-4" />
              DAPUR
            </button>
            {/* <button
              onClick={() => setActiveTab('tag')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-montserrat transition-all ${activeTab === 'tag'
                  ? 'bg-white text-telaga-700 shadow-sm'
                  : 'text-telaga-900/50 hover:text-telaga-900/70'
                }`}
            >
              <Tag className="w-4 h-4" />
              TAG
            </button> */}
            {/* <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-montserrat transition-all ${activeTab === 'whatsapp'
                  ? 'bg-white text-telaga-700 shadow-sm'
                  : 'text-telaga-900/50 hover:text-telaga-900/70'
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              WHATSAPP
            </button> */}
          </div>
        </div>

        {/* Status printer + tombol hubungkan langsung (tanpa Printer Management) */}
        <div className="flex-shrink-0 px-4 py-2 bg-telaga-50/70 border-b border-telaga-100 flex items-center gap-2">
          <Printer className={`w-4 h-4 shrink-0 ${selectedPrinter ? 'text-telaga-600' : 'text-telaga-900/30'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold font-montserrat text-telaga-900 truncate">
              {selectedPrinter?.device_name || 'Belum ada printer'}
            </p>
            <p className="text-[10px] text-telaga-900/50 font-montserrat truncate">
              {isConnectingPrinter
                ? 'Menghubungkan printer...'
                : printerSource === 'local'
                  ? 'Tersimpan di browser ini'
                  : selectedPrinter
                    ? `${selectedPrinter.paper_width || 58}mm`
                    : 'Hubungkan printer Bluetooth untuk mencetak'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnectPrinter}
            disabled={isConnectingPrinter}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-telaga-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-telaga-700 transition hover:border-telaga-400 hover:bg-telaga-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
          >
            <Bluetooth className={`w-3.5 h-3.5 ${isConnectingPrinter ? 'animate-pulse' : ''}`} />
            {isConnectingPrinter ? 'Proses' : selectedPrinter ? 'Ganti' : 'Hubungkan'}
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <div className="px-4 py-5">
            {/* TAB 1: INVOICE - Show when tab active */}
            {activeTab === 'invoice' && (
              <>
                {/* Content Preview */}
                <InvoiceContentPreview
                  order={resolvedOrder}
                  printType="invoice"
                  detailsArr={detailsArr}
                  summaryOrderDetails={summaryOrderDetails}
                  tenantInfo={tenantInfo}
                  branchInfo={branchInfo}
                  printerSettings={printerSettings}
                  invoiceUrl={invoiceUrl}
                />

                {/* Invoice Action Buttons - Inside Invoice Area */}
                {showInvoiceButtons && (
                  <div className="mt-4 space-y-3">
                    {/* Test Mode Toggle */}
                    {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 font-montserrat">Test Mode:</span>
                    <span className={`text-sm font-semibold ${testMode ? 'text-green-600' : 'text-telaga-600'}`}>
                      {testMode ? 'ON (Console Log)' : 'OFF (Real Print)'}
                    </span>
                  </div>
                  <button
                    onClick={() => setTestMode(!testMode)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      testMode 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-telaga-100  hover:bg-telaga-200'
                    }`}
                  >
                    {testMode ? 'Switch to Real Print' : 'Switch to Test Mode'}
                  </button>
                </div> */}

                    {/* Print Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={async () => {
                          if (testMode) {
                            await testPrintInvoice();
                          } else {
                            // Real print mode
                            setIsPrinting(true);
                            setPrintError(null);
                            try {
                              // Pastikan printer siap (pairing otomatis kalau belum ada)
                              const printer = await ensurePrinter();
                              applyPrinter(printer);

                              // Pastikan invoiceUrl ada di order data untuk QR Code
                              // ✅ Cek isFirstOrder dari customer total_orders (konsisten dengan mobile)
                              const isFirstOrder = order.customer?.total_orders === 0 || order.customer?.total_orders === undefined;
                              const orderWithInvoiceUrl = {
                                ...resolvedOrder,
                                invoiceUrl: invoiceUrl || order.invoiceUrl || order.invoice_url,
                                is_first_order: isFirstOrder
                              };

                              const result = await thermalPrinterService.printInvoice(orderWithInvoiceUrl, tenantInfo, branchInfo, printerSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);

                              // Cek apakah print berhasil atau tidak
                              if (result === false || result === null || result === undefined) {
                                throw new Error('Print cancelled or failed');
                              }

                              alert('Invoice berhasil dicetak!');
                            } catch (error) {
                              console.error('Print invoice error:', error);
                              if (error?.name === 'NotFoundError') return;
                              setPrintError('Gagal mencetak invoice. Pastikan printer terhubung.');
                              alert('Gagal mencetak invoice. Pastikan printer terhubung dan coba lagi.');
                            } finally {
                              setIsPrinting(false);
                            }
                          }
                        }}
                        disabled={!testMode && isPrinting}
                        className={`flex-1 py-2.5 text-white rounded-xl font-montserrat font-semibold shadow-md shadow-telaga-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-telaga-100 disabled:text-telaga-900/40 disabled:shadow-none disabled:cursor-not-allowed ${testMode
                            ? 'bg-gradient-to-r from-telaga-500 to-telaga-400 hover:from-telaga-600 hover:to-telaga-500'
                            : 'bg-gradient-to-r from-telaga-600 to-telaga-500 hover:from-telaga-700 hover:to-telaga-600'
                          }`}
                      >
                        {testMode ? (
                          <>
                            <FileText className="w-5 h-5" />
                            {isPrinting ? 'Testing...' : 'Test Print Invoice'}
                          </>
                        ) : (
                          <>
                            <Bluetooth className="w-5 h-5" />
                            {isPrinting ? 'Printing...' : 'Print Invoice'}
                          </>
                        )}
                      </button>

                      {/* Print Invoice 80mm Button - Only for Tenant ID 180 */}
                      {tenantInfo?.id === 180 && (
                        <button
                          onClick={async () => {
                            setIsPrinting80mm(true);
                            setPrintError(null);
                            try {
                              const printer = await ensurePrinter();
                              applyPrinter(printer, 80); // Force 80mm paper width

                              // Pastikan invoiceUrl ada di order data untuk QR Code
                              // ✅ Cek isFirstOrder dari customer total_orders (konsisten dengan mobile)
                              const isFirstOrder = order.customer?.total_orders === 0 || order.customer?.total_orders === undefined;
                              const orderWithInvoiceUrl = {
                                ...resolvedOrder,
                                invoiceUrl: invoiceUrl || order.invoiceUrl || order.invoice_url,
                                is_first_order: isFirstOrder
                              };

                              const result = await thermalPrinterService.printInvoice80mm(orderWithInvoiceUrl, tenantInfo, branchInfo, printerSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);

                              // Cek apakah print berhasil atau tidak
                              if (result === false || result === null || result === undefined) {
                                throw new Error('Print cancelled or failed');
                              }

                              alert('Invoice 80mm berhasil dicetak!');
                            } catch (error) {
                              console.error('Print invoice 80mm error:', error);
                              if (error?.name === 'NotFoundError') return;
                              setPrintError('Gagal mencetak invoice 80mm. Pastikan printer terhubung.');
                              alert('Gagal mencetak invoice 80mm. Pastikan printer terhubung dan coba lagi.');
                            } finally {
                              setIsPrinting80mm(false);
                            }
                          }}
                          disabled={isPrinting80mm}
                          className="flex-1 py-2.5 text-white rounded-xl font-montserrat font-semibold shadow-md shadow-senja-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-telaga-100 disabled:text-telaga-900/40 disabled:shadow-none disabled:cursor-not-allowed bg-gradient-to-r from-senja-500 to-senja-400 hover:from-senja-600 hover:to-senja-500"
                        >
                          <Bluetooth className="w-5 h-5" />
                          {isPrinting80mm ? 'Printing...' : 'Print Invoice (80mm)'}
                        </button>
                      )}
                    </div>

                    {/* Preview Invoice Digital Button - Full Width */}
                    {!isFromQuickOrder && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleInvoiceAction('preview')}
                          disabled={!invoiceUrl}
                          className="w-full py-2.5 px-3 bg-white hover:bg-telaga-50/60 border-2 border-telaga-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-telaga-50 border border-telaga-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-telaga-600" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-telaga-700 font-montserrat truncate">
                                Preview Invoice Digital
                              </h4>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* Status Cards */}
                <div className="mt-4 space-y-3">
                  {showInvoiceButtons && (
                    <PrinterStatusCard
                      printerStatus={printerStatus}
                      checkingPrinter={checkingPrinter}
                      onCheckStatus={checkPrinterStatus}
                    />
                  )}
                </div>

                {printError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-700 text-sm">{printError}</div>
                  </div>
                )}
              </>
            )}

            {/* TAB: TIKET DAPUR - satu tiket per dapur produksi */}
            {activeTab === 'kitchen' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-telaga-50 border border-telaga-100 p-4">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-telaga-700" />
                    <h3 className="text-sm font-bold text-telaga-900 font-montserrat">
                      Tiket Dapur ({kitchenTickets.length})
                    </h3>
                  </div>
                  <p className="text-[11px] text-telaga-900/60 font-montserrat mt-1">
                    Item dipisah otomatis sesuai dapur produksinya. Order dari Cafe 2/3 yang makanannya
                    dibuat di Cafe 1 akan dicetak pada tiket Cafe 1.
                  </p>
                </div>

                {isLoadingKitchenTickets && (
                  <p className="text-xs text-gray-500 font-montserrat">Memuat tiket dapur...</p>
                )}

                {!isLoadingKitchenTickets && kitchenTickets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <ChefHat className="w-14 h-14 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-montserrat text-center">
                      Tidak ada item yang perlu diproduksi di dapur.
                    </p>
                  </div>
                )}

                {kitchenTickets.map((ticket, idx) => {
                  const queueNumbers = Array.from(new Set(
                    (ticket.items || []).flatMap((row) => row.tag_numbers || [])
                  )).sort((a, b) => a - b);

                  return (
                    <div key={`${ticket.production_branch_id}-${idx}`} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500 font-montserrat">
                            Tiket {idx + 1}/{kitchenTickets.length}
                          </p>
                          <h4 className="text-sm font-bold text-gray-900 font-montserrat truncate">
                            {ticket.production_branch_name || 'Dapur'}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-montserrat">
                            {ticket.order_code || '-'}
                            {ticket.table_number ? ` • Meja ${ticket.table_number}` : ''}
                            {ticket.customer_name ? ` • ${ticket.customer_name}` : ''}
                          </p>
                          {ticket.selling_branch_name
                            && ticket.selling_branch_name !== ticket.production_branch_name && (
                            <p className="text-[11px] text-amber-600 font-montserrat mt-0.5">
                              Order dari {ticket.selling_branch_name}
                            </p>
                          )}
                        </div>
                        {queueNumbers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-telaga-600 text-white text-[10px] font-bold font-montserrat tracking-wide flex-shrink-0">
                            Antrian {queueNumbers.join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {(ticket.items || []).map((row, rowIdx) => (
                          <div key={`${row.treatment_id}-${rowIdx}`} className="text-xs font-montserrat">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-telaga-700 flex-shrink-0">{row.qty}x</span>
                              <span className="font-semibold text-gray-900">{row.treatment_name}</span>
                            </div>
                            <p className="text-gray-500 ml-6">Penyajian: {row.serve_mode}</p>
                            {(row.options || []).map((option) => (
                              <p key={option} className="text-gray-500 ml-6">- {option}</p>
                            ))}
                            {row.note && <p className="text-gray-500 ml-6">Catatan: {row.note}</p>}
                          </div>
                        ))}
                      </div>

                      {ticket.customer_note && (
                        <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 font-montserrat">
                          Catatan order: {ticket.customer_note}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={handlePrintKitchenTickets}
                  disabled={isPrintingKitchen || kitchenTickets.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-telaga-600 hover:bg-telaga-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
                >
                  {isPrintingKitchen
                    ? 'Mencetak tiket dapur...'
                    : `Cetak Tiket Dapur (${kitchenTickets.length})`}
                </button>

                <PrinterStatusCard
                  printerStatus={printerStatus}
                  checkingPrinter={checkingPrinter}
                  onCheckStatus={checkPrinterStatus}
                />

                {printError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-700 text-sm">{printError}</div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TAG ITEM */}
            {activeTab === 'tag' && (
              (() => {
                // Check if any item has actual item data (brand/name filled)
                const hasItemData = availableItems.some(item => item.item.brand || item.item.name);

                if (!hasItemData && isFromQuickOrder) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                      <Tag className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-base font-semibold text-gray-600 font-montserrat mb-2">
                        Item Belum Diisi
                      </h3>
                      <p className="text-sm text-gray-400 font-montserrat text-center max-w-xs">
                        Belum bisa print tag karena item belum diisi. Silakan edit item di detail pesanan terlebih dahulu.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Print All Option */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="printOption"
                          checked={printAll}
                          onChange={handlePrintAllToggle}
                          className="w-4 h-4 text-telaga-600 focus:ring-telaga-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-sm text-gray-900 font-montserrat">
                              Print Semua Item
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-montserrat mt-1">
                            Cetak tag untuk semua {totalItems} item dalam order ini
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500 font-montserrat font-medium">ATAU</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Select Specific Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 font-montserrat">
                          Pilih Item Tertentu
                        </h3>
                        <button
                          onClick={handleSelectAll}
                          className="text-xs text-telaga-600 hover:text-telaga-700 font-montserrat font-medium"
                        >
                          {selectedItems.length === totalItems ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </button>
                      </div>

                      {/* Items List */}
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {availableItems.map((item, index) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item.id)}
                            className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${selectedItems.includes(item.id)
                                ? 'border-telaga-500 bg-telaga-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                readOnly
                                className="w-4 h-4 text-telaga-600 focus:ring-telaga-500 mt-0.5 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-500 font-montserrat">
                                    #{index + 1}
                                  </span>
                                  {item.tagNumber != null && (
                                    <span className="px-2 py-0.5 rounded-md bg-telaga-600 text-white text-[10px] font-bold font-montserrat tracking-wide">
                                      No. Antrian {item.tagNumber}
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-gray-900 font-montserrat">
                                    {item.treatment}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-700 font-montserrat">
                                      {item.item.brand} {item.item.name}
                                    </span>
                                    {item.item.color && (
                                      <span className="text-xs text-gray-500 font-montserrat">
                                        ({item.item.color})
                                      </span>
                                    )}
                                  </div>

                                  {item.item.parfum && (
                                    <div className="text-xs text-gray-600 font-montserrat">
                                      Parfum: {item.item.parfum}
                                    </div>
                                  )}

                                  {item.item.notes && (
                                    <div className="text-xs text-gray-600 font-montserrat">
                                      Catatan: {item.item.notes}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-xs">Due: {formatDateTag(item.dueDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Print Button */}
                      <button
                        onClick={() => {
                          if (printAll) {
                            handlePrintAllChecklist();
                          } else {
                            handlePrintSelectedChecklist(selectedItems);
                          }
                        }}
                        disabled={!printAll && selectedItems.length === 0}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-telaga-600 hover:bg-telaga-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
                      >
                        {printAll
                          ? `Print Semua Tag (${totalItems} items)`
                          : `Print Tag Terpilih (${selectedItems.length} items)`
                        }
                      </button>

                      {/* Print Semua Tag 80mm Button - Only for Tenant ID 180 */}
                      {tenantInfo?.id === 180 && (
                        <button
                          onClick={async () => {
                            setIsPrintingChecklist(true);
                            setPrintError(null);
                            try {
                              const printer = await ensurePrinter();
                              applyPrinter(printer, 80); // Force 80mm paper width

                              const result = await thermalPrinterService.printAllTags80mm(resolvedOrder);

                              // Cek apakah print berhasil atau tidak
                              if (result === false || result === null || result === undefined) {
                                throw new Error('Print cancelled or failed');
                              }

                              alert(`Semua tag 80mm berhasil dicetak untuk ${totalItems} item!`);
                            } catch (error) {
                              console.error('Print all tags 80mm error:', error);
                              if (error?.name === 'NotFoundError') return;
                              setPrintError('Gagal mencetak tag 80mm. Pastikan printer terhubung.');
                              alert('Gagal mencetak tag 80mm. Pastikan printer terhubung dan coba lagi.');
                            } finally {
                              setIsPrintingChecklist(false);
                            }
                          }}
                          disabled={isPrintingChecklist || totalItems === 0}
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
                        >
                          {isPrintingChecklist
                            ? `Printing... (${totalItems} items)`
                            : `Print Semua Tag 80mm (${totalItems} items)`
                          }
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* TAB 3: WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-telaga-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-telaga-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 font-montserrat">
                        {order.customer?.name || 'Customer'}
                      </h4>
                      <p className="text-xs text-gray-600 font-montserrat">
                        {order.customer?.phone || 'No phone'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {/* WA Web Option */}
                  <button
                    onClick={handleWAWeb}
                    className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all duration-200 hover:border-green-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-800 font-montserrat">WhatsApp Web</h4>
                        <p className="text-xs text-gray-600 font-montserrat">Buka di browser komputer</p>
                      </div>
                    </div>
                  </button>

                  {/* WA App Option */}
                  <button
                    onClick={handleWAApp}
                    className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all duration-200 hover:border-green-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.105" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-800 font-montserrat">WhatsApp App</h4>
                        <p className="text-xs text-gray-600 font-montserrat">Buka aplikasi WhatsApp</p>
                      </div>
                    </div>
                  </button>

                  {/* Copy Invoice Option */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyInvoiceForWA}
                      disabled={isCopyingInvoice}
                      className={`w-full p-4 border-2 rounded-xl transition-all duration-200 ${copied
                          ? 'bg-green-50 border-green-300'
                          : isCopyingInvoice
                            ? 'bg-gray-50 border-gray-300 cursor-wait'
                            : 'bg-telaga-50 hover:bg-telaga-100 border-telaga-200 hover:border-telaga-300'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${copied ? 'bg-green-500' : isCopyingInvoice ? 'bg-gray-400' : 'bg-telaga-500'
                          }`}>
                          {isCopyingInvoice ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : copied ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Copy className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <h4 className={`text-sm font-semibold font-montserrat ${copied ? 'text-green-800' : isCopyingInvoice ? 'text-gray-600' : 'text-gray-800'
                            }`}>
                            {isCopyingInvoice ? 'Memuat template...' : copied ? 'Tersalin!' : 'Copy Template Text'}
                          </h4>
                          <p className={`text-xs font-montserrat ${copied ? 'text-green-600' : isCopyingInvoice ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                            {isCopyingInvoice ? 'Mengambil template terbaru...' : copied ? 'Siap untuk paste' : 'Salin teks invoice untuk kirim manual'}
                          </p>
                        </div>
                      </div>
                    </button>
                    {/* Custom Template Button */}
                    <button
                      onClick={() => setShowInvoiceTemplateModal(true)}
                      className="w-full p-3 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold font-montserrat text-gray-700">Custom Template</span>
                    </button>
                  </div>

                  {/* Invoice Digital Actions - Simple Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        if (invoiceUrl) {
                          try {
                            const fullUrl = invoiceUrl.startsWith('http') ? invoiceUrl : `https://${invoiceUrl}`;
                            await copyToClipboard(fullUrl);
                            alert('URL invoice berhasil disalin!');
                          } catch (err) {
                            alert('Gagal menyalin URL: ' + err.message);
                          }
                        }
                      }}
                      disabled={!invoiceUrl}
                      className="p-3 bg-telaga-50 hover:bg-telaga-100 border-2 border-telaga-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Copy className="w-5 h-5 text-telaga-600" />
                        <span className="text-xs font-semibold text-telaga-700 font-montserrat">Salin URL</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleInvoiceAction('preview')}
                      disabled={!invoiceUrl}
                      className="p-3 bg-telaga-500 hover:bg-telaga-600 border-2 border-telaga-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="w-5 h-5 text-white" />
                        <span className="text-xs font-semibold text-white font-montserrat">Preview</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="px-4 py-4 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            {!isFromQuickOrder && (
              <AnimatedButton
                variant="grey"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <XIcon className="w-5 h-5" />
                Tutup
              </AnimatedButton>
            )}
            <AnimatedButton
              variant="blue"
              onClick={() => navigate('/orders')}
              className="flex-1 py-2.5 px-4 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {isFromQuickOrder ? 'Lihat Order' : 'Kembali'}
            </AnimatedButton>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvoicePreviewModal
        show={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        order={order}
        previewMessage={previewMessage}
        templateContent={templateContent}
        availableVariables={availableVariables}
        editMode={editMode}
        onEditMode={setEditMode}
        onSaveTemplate={handleSaveTemplate}
        onPreviewTemplate={previewTemplate}
        onSendInvoice={sendInvoice}
        sendingInvoice={sendingInvoice}
      />

      {/* Invoice Template Modal */}
      <InvoiceTemplateModal
        show={showInvoiceTemplateModal}
        onClose={() => setShowInvoiceTemplateModal(false)}
        order={order}
        paymentStatus={(() => {
          // ✅ FIX: Calculate finalTotal (after discounts) instead of subtotal
          const totalPaid = order.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
          const subtotal = summaryOrderDetails.total || 0;

          // Calculate final total from payment.final_price (after all discounts)
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

          // ✅ FIX: Determine status based on finalTotal (after discounts)
          if (finalTotal === 0) return 'paid'; // Free service or fully discounted
          if (totalPaid === 0) return 'unpaid';
          if (totalPaid >= finalTotal) return 'paid';
          return 'dp';
        })()}
        onTemplateUpdated={() => {
          // Reset pre-loaded template state agar reload fresh saat buka lagi
          setLoadedTemplateContent(null);
          setTemplateCategory(null);

          // Tutup InvoiceTemplateModal
          setShowInvoiceTemplateModal(false);

          // Tutup QuickOrderPrintReceipt modal
          onClose();

          console.log('✅ Template updated, modals closed');
        }}
      />
    </div>
  );
};

export default QuickOrderPrintReceipt; 