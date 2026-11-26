import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LordIcon from '../../components/Design/LordIcon.jsx';
import axios from 'axios';
import decryptAes from '../../utils/decryptAes.js';
import instance from '../../config/api';
import { FaUser, FaMapMarkerAlt, FaPhone, FaChevronDown } from 'react-icons/fa';
import { X, Clock, CheckCircle, AlertCircle, Loader2, User, Star, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatOrderDetailStatus, getOrderDetailStatusColors } from '../../utils/labelFormatter';
import { generateGradientFromColor, calculateContrastColor, darkenColor, lightenColor } from '../../utils/colorGradientHelper';
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import PhotoGalleryModal from '../../components/Modal/PhotoGalleryModal';

// Digital Invoice Page - Consistent Design with Animated Icon Header
const Invoice = () => {
  // Estimasi selesai (dummy fallback)
  const getEstimate = (item) => new Date(item?.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) || '08 Juli 2025';

  useEffect(() => {
    document.title = 'Invoice';
    return () => { document.title = 'NotaSepatu'; };
  }, []);

  // State untuk progress modal
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  
  // State untuk modal foto galeri progress
  const [showProgressPhotoGallery, setShowProgressPhotoGallery] = useState(false);
  const [selectedProgressPhotos, setSelectedProgressPhotos] = useState([]);
  const [selectedProgressPhotoIndex, setSelectedProgressPhotoIndex] = useState(0);

  // State untuk modal foto galeri shoes_photos
  const [showShoesPhotoGallery, setShowShoesPhotoGallery] = useState(false);
  const [selectedShoesPhotos, setSelectedShoesPhotos] = useState([]);
  const [selectedShoesPhotoIndex, setSelectedShoesPhotoIndex] = useState(0);

  // Handler buka modal foto galeri shoes_photos (menggunakan PhotoGalleryModal seperti progress)
  const handleOpenShoesPhotoGallery = (photos, initialIndex = 0) => {
    // Photos sudah dalam format { url_photo: ... }
    setSelectedShoesPhotos(photos);
    setSelectedShoesPhotoIndex(initialIndex);
    setShowShoesPhotoGallery(true);
  };

  const handleCloseShoesPhotoGallery = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setShowShoesPhotoGallery(false);
    setSelectedShoesPhotos([]);
    setSelectedShoesPhotoIndex(0);
  };

  // Handler buka modal progress
  const openProgressModal = (item) => {
    setSelectedItem(item);
    setSelectedItemName(item.name || 'Item');
    setProgressModalOpen(true);
  };

  // Handler tutup modal progress
  const closeProgressModal = () => {
    setProgressModalOpen(false);
    setSelectedItem(null);
    setSelectedItemName('');
  };

  // Handler buka modal foto galeri progress
  const handleOpenProgressPhotoGallery = (photos, initialIndex = 0) => {
    const transformedPhotos = photos.map(photo => ({
      url_photo: getPhotoUrl(photo.photo_url)
    }));
    setSelectedProgressPhotos(transformedPhotos);
    setSelectedProgressPhotoIndex(initialIndex);
    setShowProgressPhotoGallery(true);
  };

  const handleCloseProgressPhotoGallery = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setShowProgressPhotoGallery(false);
    setSelectedProgressPhotos([]);
    setSelectedProgressPhotoIndex(0);
  };

  // Get status icon untuk progress modal
  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    switch (status.toLowerCase()) {
      case 'done':
      case 'selesai':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'siap':
      case 'siap_diambil':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'siap_dikirim':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'on_progress':
      case 'pengeringan':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'not_yet':
      case 'antrian':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  // Format datetime untuk progress modal
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy 'pukul' HH:mm", { locale: id });
    } catch (error) {
      return dateString;
    }
  };


  // State untuk fetch data invoice
  const { token } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    instance.get(`/invoice/${token}`)
      .then((res) => {
        const key = import.meta.env.VITE_AES_SECRET_KEY;
        const decryptedString = decryptAes(res.data.data, key);
        const decrypted = JSON.parse(decryptedString);
        if (decrypted.order?.order_details && decrypted.order.order_details.length > 0) {
          decrypted.order.order_details.forEach((detail, idx) => {

          });
        }
        if (!decrypted || !decrypted.order) throw new Error(decrypted?.message || 'Invoice tidak ditemukan');
        setOrderData({
          ...decrypted.order,
          token: decrypted.token,
          invoice_id: decrypted.id,
          tenant: decrypted.tenant,
          branch: decrypted.branch,
          printer_settings: decrypted.printer_settings || null,
          invoice_digital_settings: decrypted.invoice_digital_settings || null, // Include invoice digital settings
          points_settings: decrypted.points_settings || null, // Include points settings
          bonus_points: decrypted.bonus_points || { firstOrder: 0, referral: 0 }, // Include bonus points
        });
      })
      .catch((err) => {
        console.error('❌ Error:', err);
        setError(err.response?.data?.message || err.message || 'Gagal mengambil data invoice');
        setOrderData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Format tanggal masuk: 06 Juli 2025
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // Format harga
  const formatNumber = (num) => {
    return Number(num).toLocaleString('id-ID');
  };

  // Get header gradient from settings or default
  const getHeaderGradient = () => {
    if (orderData?.invoice_digital_settings?.header_color) {
      const colors = generateGradientFromColor(orderData.invoice_digital_settings.header_color);
      return `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
    return 'linear-gradient(to bottom right, #5096FC, #7BD1FD, #6C63FF)';
  };

  // Get footer gradient from settings or default
  const getFooterGradient = () => {
    if (orderData?.invoice_digital_settings?.footer_color) {
      const colors = generateGradientFromColor(orderData.invoice_digital_settings.footer_color);
      return `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
    return 'linear-gradient(to bottom right, #5096FC, #7BD1FD, #6C63FF)';
  };

  // Get logo URL from settings
  const getLogoUrl = () => {
    if (orderData?.invoice_digital_settings?.show_logo && orderData?.invoice_digital_settings?.logo_url) {
      return getPhotoUrl(orderData.invoice_digital_settings.logo_url);
    }
    return null;
  };

  // Get header text color from settings or auto-calculate based on background
  const getHeaderTextColor = () => {
    // If manual text color is set, use it
    if (orderData?.invoice_digital_settings?.header_text_color) {
      return orderData.invoice_digital_settings.header_text_color;
    }
    // Otherwise, auto-calculate based on header background color
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return calculateContrastColor(headerColor);
  };

  // Get footer text color from settings or auto-calculate based on background
  const getFooterTextColor = () => {
    // If manual text color is set, use it
    if (orderData?.invoice_digital_settings?.footer_text_color) {
      return orderData.invoice_digital_settings.footer_text_color;
    }
    // Otherwise, auto-calculate based on footer background color
    const footerColor = orderData?.invoice_digital_settings?.footer_color || '#5096FC';
    return calculateContrastColor(footerColor);
  };

  // Get content text color - darkened version of header color (for better contrast on white bg)
  const getContentTextColor = () => {
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return darkenColor(headerColor, 60); // Darken by 70% - darker for better readability
  };

  // Get card background color - lightened version of header color
  const getCardBackgroundColor = () => {
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return lightenColor(headerColor, 70); // Lighten by 70% - more visible color tint
  };

  // Get light background color for small elements (icon, badge, button)
  const getLightBackgroundColor = () => {
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return lightenColor(headerColor, 75); // Lighten by 75% - lighter for small elements
  };

  // Get hover background color (slightly darker than light bg)
  const getHoverBackgroundColor = () => {
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return lightenColor(headerColor, 65); // Lighten by 65% - darker for hover state
  };

  // Get button/icon background color (medium light)
  const getButtonBackgroundColor = () => {
    const headerColor = orderData?.invoice_digital_settings?.header_color || '#5096FC';
    return darkenColor(headerColor, 20); // Darken by 20% - for button backgrounds
  };

  // Hitung harga final per item dengan support custom_price dan addon
  const calculateFinalPricePerItem = (group) => {
    // ✅ Use final_price from backend if available (most accurate)
    if (group.final_price != null) {
      return Number(group.final_price);
    }
    
    // ✅ Fallback: calculate manually (same logic as OrderDetail)
    // 1. Base price (custom_price priority dengan null check)
    const base = group.custom_price != null 
      ? Number(group.custom_price) 
      : Number(group.treatment?.price || 0);
    
    // 2. Addon total
    let addonTotal = 0;
    if (group.addons && Array.isArray(group.addons)) {
      addonTotal = group.addons.reduce((sum, addon) => {
        const addonPrice = Number(addon.addon?.price || addon.price || 0);
        return sum + addonPrice;
      }, 0);
    }
    
    // 3. Price dengan addons
    const priceWithAddons = base + addonTotal;
    
    // 4. Diskon (apply ke priceWithAddons)
    let finalPrice = priceWithAddons;
    const discount = group.discount;
    if (discount && discount.type) {
      const discVal = Number(discount.discount || discount.value || 0);
      if (discount.type === 'percent' || discount.type === 'percentage') {
        finalPrice = priceWithAddons - (priceWithAddons * (discVal / 100));
      } else if (discount.type === 'nominal') {
        finalPrice = priceWithAddons - discVal;
      }
    }
    
    return Math.max(0, Math.round(finalPrice));
  };

  // Format metode pembayaran (hilangkan underscore, kapitalisasi)
  const formatMethod = (method) => {
    if (!method) return '-';
    if (method.toLowerCase() === 'bank_transfer') return 'Transfer';
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format payment method dengan prioritas finance_account.name
  const formatPaymentMethod = (paymentDetail) => {
    const method = paymentDetail?.transaction?.finance_account?.name || 
                   paymentDetail?.payment_method_code || 
                   paymentDetail?.payment_method_name || 
                   paymentDetail?.method;
    return formatMethod(method);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 sm:px-0 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #fff' }}>
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin mb-4" />
          <div className="text-gray-700 font-montserrat text-lg">Memuat invoice...</div>
        </div>
      )}
      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
          <div className="text-red-600 font-montserrat text-lg mb-2">{error}</div>
          <div className="text-gray-500 text-sm">Cek kembali link invoice atau hubungi admin.</div>
        </div>
      )}
      {/* Data State */}
      {!loading && !error && orderData && (
        <div className="w-full max-w-[500px] my-8 bg-white rounded-3xl outline outline-2 outline-[#EEF1F7] shadow-md scrollbar-thin scrollbar-thumb-gray-300 flex flex-col justify-between">
          {/* Premium Gradient Header */}
          <div className="relative px-4 sm:px-6 pt-8 pb-7 text-center mb-0 rounded-t-3xl overflow-hidden" style={{ background: getHeaderGradient() }}>
            {/* Logo or Animated LordIcon (checkmark) */}
            <div className="flex justify-center mb-2">
              {getLogoUrl() ? (
                <img src={getLogoUrl()} alt="Logo" className="h-24 w-auto object-contain" />
              ) : (
                <LordIcon
                  src="https://cdn.lordicon.com/egiwmiit.json"
                  trigger="loop"
                  colors="primary:#ffffff,secondary:#E5E7EB"
                  stroke="bold"
                  style={{ width: 48, height: 48 }}
                />
              )}
            </div>
            {/* Business Name - Tampilkan jika tidak ada logo ATAU jika logo ada DAN show_business_name true */}
            {(!getLogoUrl() || (getLogoUrl() && orderData?.invoice_digital_settings?.show_business_name !== false)) && (
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold tracking-widest mb-1 drop-shadow-lg uppercase" style={{ letterSpacing: '0.08em', textShadow: '0 2px 8px rgba(0,0,0,0.1)', color: getHeaderTextColor() }}>
                {orderData?.tenant?.business_name || 'NotaSepatu'}
              </h2>
            )}
            {/* Tagline - Tampilkan jika tidak ada logo ATAU jika logo ada DAN show_tagline true */}
            {(!getLogoUrl() || (getLogoUrl() && orderData?.invoice_digital_settings?.show_tagline !== false)) && (
              <div className="text-xs sm:text-base font-montserrat font-semibold tracking-widest uppercase mb-2" style={{ color: getHeaderTextColor(), opacity: 0.9 }}>
                Invoice Pembayaran
              </div>
            )}
            {/* Accent bar */}
            <div className="mx-auto w-24 h-1.5 rounded-full bg-gradient-to-r mb-3" style={{ background: `linear-gradient(to right, ${getHeaderTextColor()}80, ${getHeaderTextColor()}40, ${getHeaderTextColor()}80)` }} />
            {/* Info toko - Branch address & phone (prioritas: branch > tenant > default) */}
            <div className="flex flex-col items-center gap-1 text-xs sm:text-sm font-montserrat font-medium mx-auto w-full px-4" style={{ color: getHeaderTextColor(), opacity: 0.9 }}>
              <div className="flex items-center gap-1 justify-center w-full whitespace-nowrap overflow-hidden">
                <FaMapMarkerAlt className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: getHeaderTextColor(), opacity: 0.7 }} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                  {orderData?.branch?.address || orderData?.tenant?.address || ''}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-center w-full whitespace-nowrap overflow-hidden">
                <FaPhone className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: getHeaderTextColor(), opacity: 0.7 }} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                  Telp: {orderData?.branch?.phone || orderData?.tenant?.phone || '0877-9545-2475'}
                </span>
              </div>
            </div>
            {/* Optional: subtle pattern/shape SVG di pojok kanan bawah */}
            <svg className="absolute right-0 bottom-0 opacity-10 w-32 h-20 hidden sm:block" viewBox="0 0 120 60" fill="none"><ellipse cx="60" cy="30" rx="60" ry="30" fill="white" /></svg>
          </div>
          {/* Info invoice otomatis */}
          <div className="px-6 pt-6 pb-1 text-left mt-4 sm:mt-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-montserrat mb-2 break-words text-left">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#E5E7EB" /><path d="M12 8v4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="#6B7280" /></svg>
              Invoice ini dibuat otomatis oleh sistem pada {orderData.createdAt ? new Date(orderData.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
            </div>
          </div>
          {/* Customer Info Section + Staff */}
          <div className="px-4 sm:px-6 pt-5 pb-2 text-left">
            <div className="flex flex-row items-end justify-between gap-4 mb-3 w-full">
              {/* Order ID */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-montserrat text-gray-400 font-medium tracking-wide mb-0.5">Order ID</span>
                <span className="text-sm font-montserrat font-bold tracking-wide select-all break-all" style={{ color: getContentTextColor() }}>#{orderData?.id || '-'}</span>
                <span className="block h-1 w-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5" />
              </div>
              {/* Tanggal Masuk */}
              <div className="flex flex-col flex-1 min-w-0 items-end">
                <span className="text-xs font-montserrat text-gray-400 font-base tracking-wide mb-0.5">Tanggal Masuk</span>
                <span className="text-sm font-montserrat font-bold tracking-wide whitespace-nowrap" style={{ color: getContentTextColor() }}>{formatDate(orderData?.entry_date)}</span>
                <span className="block h-1 w-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5 ml-auto" />
              </div>
            </div>
            <div className="backdrop-blur rounded-3xl shadow-lg border border-gray-200 px-5 py-5 flex flex-col gap-4 mt-4 mb-2 text-left relative" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
              {/* Badge Poin Kecil di Pojok Kanan Atas (Floating) */}
              {orderData?.points_settings?.enabled && orderData?.customer?.points != null && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg" style={{ 
                    boxShadow: '0 2px 8px 0 rgba(251, 191, 36, 0.3)'
                  }}>
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span className="text-xs font-montserrat font-bold">
                    Poin Kamu: {formatNumber(orderData.customer.points)} 
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 w-full">
                  <span className="rounded-full p-2 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getLightBackgroundColor() }}>
                    <FaUser className="w-6 h-6" style={{ color: getContentTextColor() }} />
                  </span>
                  <span className="text-base sm:text-xl font-montserrat font-bold break-words truncate" style={{ color: getContentTextColor() }}>{orderData?.customer?.name || '-'}</span>
                </div>
                {/* Accent bar di bawah nama */}
                <span className="block h-1 w-12 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5" />
              </div>
              <div className="flex flex-row items-center gap-4 text-sm text-gray-600 font-montserrat w-full mt-1">
                <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px] xl:max-w-[320px]" title={orderData?.customer?.address || '-'}>
                    {orderData?.customer?.address || '-'}
                  </span>
                </div>
                {orderData?.customer?.phone && (
                  <div className="flex flex-row items-center gap-1 flex-shrink-0">
                    <FaPhone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className=" max-w-[110px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[200px] xl:max-w-[220px]" title={orderData?.customer?.phone}>
                      {orderData?.customer?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Order Details Section */}
          <div className="px-4 pt-2 pb-4 text-left">
            <div className="text-lg font-montserrat font-bold mb-2" style={{ color: getContentTextColor() }}>Detail Pesanan</div>
            <div className="flex flex-col gap-1">
              {(orderData.order_details || []).map((group, idx) => {
                const finalPrice = calculateFinalPricePerItem(group);
                const qty = group.items.length;
                const total = finalPrice * qty;
                const processLabel = group.process_time && group.process_time !== 'regular'
                  ? group.process_time.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : null;
                
                // Calculate discount amount for display
                let discountAmount = 0;
                if (group.discount) {
                  const basePrice = group.custom_price != null ? Number(group.custom_price) : Number(group.treatment?.price || 0);
                  const discVal = Number(group.discount.discount || group.discount.value || 0);
                  if (group.discount.type === 'percent' || group.discount.type === 'percentage') {
                    discountAmount = basePrice * (discVal / 100);
                  } else if (group.discount.type === 'nominal') {
                    discountAmount = discVal;
                  }
                }
                return (
                  <div key={idx} className="rounded-2xl shadow-lg border border-gray-200 p-4 flex flex-col gap-3 mb-4" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
                    {/* Header layanan */}
                    <div className="flex flex-col gap-0.5 mb-0.5">
                      <div className="flex flex-col gap-1">
                        <div className="font-montserrat font-bold text-base break-words flex items-center " style={{ color: getContentTextColor() }}>
                          <span className="">{group.treatment?.name}</span>
                          {processLabel && <span className="ml-2 text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: getLightBackgroundColor(), color: getContentTextColor() }}>{processLabel}</span>}
                        </div>
                        {/* Custom Price Reason */}
                        {group.custom_price_reason && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 italic font-montserrat">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" fill="#E5E7EB"/>
                              <path d="M12 8v4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                              <circle cx="12" cy="16" r="1" fill="#6B7280"/>
                            </svg>
                            Ket: {group.custom_price_reason}
                          </div>
                        )}
                        {/* Discount */}
                        {discountAmount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-semibold font-montserrat">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                              <path d="M7 13l5 5 10-10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Diskon: Rp{formatNumber(discountAmount)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-row items-center gap-2 mt-0.5">
                        <span className="text-xs font-montserrat text-gray-400">{qty} item</span>
                        <span className="text-xs font-montserrat font-semibold" style={{ color: getContentTextColor() }}>Rp{formatNumber(finalPrice)} <span className="font-normal text-gray-500">/item</span></span>
                      </div>
                      <div className="flex flex-row items-center gap-2 mt-0.5">
                        <span className="text-xs font-montserrat text-gray-500">Total</span>
                        <span className="text-base font-montserrat font-bold" style={{ color: getContentTextColor() }}>Rp{formatNumber(total)}</span>
                      </div>
                    </div>
                    {/* List Items (always visible) */}
                    <div className="flex flex-col gap-3 mt-2">
                      {(group.items || []).filter(item => item && item.id).map((item, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 px-2 py-2 sm:px-4 sm:py-3 flex flex-col gap-3 relative" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
                            {/* Konten item: info dan foto (sejajar) */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-stretch">
                              {/* Info utama kiri */}
                              <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    {/* BRAND - NAME - Full width untuk mobile */}
                                    <div className="font-montserrat font-semibold text-sm sm:text-sm w-full sm:truncate sm:max-w-[180px] break-words" style={{ color: getContentTextColor() }}>
                                      {[item.brand, item.name].filter(Boolean).join(' - ')}
                                    </div>
                                    {/* WARNA - Font kecil */}
                                    {item.color && (
                                      <div className="font-montserrat text-xs text-gray-600 w-full sm:truncate sm:max-w-[180px] break-words">
                                        {item.color}
                                      </div>
                                    )}
                                  </div>
                                  {item.notes && <div className="text-xs text-gray-400 font-montserrat italic ml-1 break-words max-w-[80px] sm:max-w-[120px] flex-shrink-0">{item.notes}</div>}
                                </div>
                                {/* Estimasi selesai */}
                                <div className="flex items-center gap-1 text-xs text-gray-700 font-montserrat mt-0.5">
                                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="1.5" /><path d="M12 7v5l3 3" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                  Estimasi: <span className="font-semibold">{getEstimate(item)}</span>
                                </div>
                              </div>
                              {/* Kolom kanan: foto */}
                              {item.shoes_photos && item.shoes_photos.length > 0 && (
                                <div className="flex gap-1 sm:gap-2 flex-nowrap overflow-x-auto max-w-full">
                                  {item.shoes_photos.slice(0, 3).map((photo, pidx) => (
                                    <img
                                      key={pidx}
                                      src={photo.url_photo}
                                      alt={`Foto ${item.name || 'Item'}`}
                                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer flex-shrink-0"
                                      onClick={() => handleOpenShoesPhotoGallery(item.shoes_photos, pidx)}
                                    />
                                  ))}
                                  {item.shoes_photos.length > 3 && (
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-md border border-gray-200 text-xs font-montserrat flex-shrink-0" style={{ backgroundColor: getLightBackgroundColor(), color: getContentTextColor() }}>+{item.shoes_photos.length - 3} foto</div>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Progress button - Full width di bawah */}
                            <div className="w-full">
                              <button
                                className="w-full flex items-center justify-center gap-2 text-xs rounded-lg px-3 py-2 font-montserrat font-semibold shadow-sm border border-gray-200 transition-colors"
                                style={{ backgroundColor: getLightBackgroundColor(), color: getContentTextColor() }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = getHoverBackgroundColor()}
                                onMouseLeave={(e) => e.target.style.backgroundColor = getLightBackgroundColor()}
                                onClick={() => openProgressModal(item)}
                              >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                Lihat Progress & Foto
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Payment Section - Redesain Modern */}
          <div className="px-4 pt-2 pb-4">
            <div className="rounded-2xl shadow-lg border border-gray-200 px-5 py-5 flex flex-col gap-2" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
              <div className="text-lg font-montserrat font-bold mb-2" style={{ color: getContentTextColor() }}>Pembayaran</div>
              {/* Payment Breakdown */}
              {(() => {
                // Hitung subtotal dari order_details (selalu hitung ulang untuk akurasi)
                let subtotal = 0;
                if (orderData.order_details && orderData.order_details.length > 0) {
                  subtotal = orderData.order_details.reduce((sum, group) => {
                    const finalPrice = calculateFinalPricePerItem(group);
                    const qty = group.items?.length || 1;
                    const groupTotal = finalPrice * qty;
                    return sum + groupTotal;
                  }, 0);
                } else {
                  // Fallback ke payment.subtotal jika order_details tidak ada
                  subtotal = Number(orderData.payment?.subtotal || 0);
                }
                
                // ✅ FIX: Calculate payment-level discount (pisahkan: payment discount, membership discount, points discount)
                // SELALU ambil points_discount dan membership_discount dari backend TERLEBIH DAHULU
                let paymentDiscountAmount = 0; // Payment discount saja (dari discount object)
                let membershipDiscountAmount = Number(orderData.payment?.membership_discount || 0);
                let pointsDiscountAmount = Number(orderData.payment?.points_discount || 0);
                let finalTotal = subtotal;
                
                // ✅ DEBUG: Log payment data untuk troubleshooting
                console.log('🔍 [InvoiceDigital] Payment data:', {
                  payment: orderData.payment,
                  points_discount: orderData.payment?.points_discount,
                  membership_discount: orderData.payment?.membership_discount,
                  final_price: orderData.payment?.final_price,
                  subtotal: subtotal
                });
                
                // Prioritaskan final_price dari backend jika tersedia (lebih akurat)
                if (orderData.payment?.final_price != null) {
                  finalTotal = Number(orderData.payment.final_price);
                  
                  // Hitung payment discount (dari discount object atau dari total_discount - membership - points)
                  if (orderData.payment?.discount && orderData.payment.discount.type) {
                    // Hitung dari discount object
                    const paymentDiscount = orderData.payment.discount;
                    const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
                    
                    if (paymentDiscount.type === 'percent') {
                      paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
                    } else if (paymentDiscount.type === 'nominal') {
                      paymentDiscountAmount = discVal;
                    }
                  } else if (orderData.payment?.total_discount != null) {
                    // Jika tidak ada discount object, hitung payment discount dari total_discount - membership - points
                    const totalDiscount = Number(orderData.payment.total_discount);
                    paymentDiscountAmount = Math.max(0, totalDiscount - membershipDiscountAmount - pointsDiscountAmount);
                  }
                } else if (orderData.payment?.discount && orderData.payment.discount.type) {
                  // Jika final_price tidak tersedia, hitung dari discount object
                  const paymentDiscount = orderData.payment.discount;
                  const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
                  
                  if (paymentDiscount.type === 'percent') {
                    paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
                  } else if (paymentDiscount.type === 'nominal') {
                    paymentDiscountAmount = discVal;
                  }
                  
                  finalTotal = Math.max(0, Math.round(subtotal - paymentDiscountAmount - membershipDiscountAmount - pointsDiscountAmount));
                } else {
                  // Jika tidak ada payment discount object, cek langsung dari membership_discount dan points_discount
                  if (membershipDiscountAmount > 0 || pointsDiscountAmount > 0) {
                    finalTotal = Math.max(0, Math.round(subtotal - membershipDiscountAmount - pointsDiscountAmount));
                  }
                }
                
                const paid = Number((orderData.payment?.payment_details || []).reduce((a, b) => a + Number(b.amount || 0), 0));
                const sisa = finalTotal - paid;
                
                // ✅ FIX: Tentukan status pembayaran berdasarkan finalTotal (setelah semua discount)
                let paymentStatusText = '';
                if (finalTotal === 0) {
                  paymentStatusText = 'LUNAS';
                } else if (paid === 0) {
                  paymentStatusText = 'BELUM LUNAS';
                } else if (paid > 0 && paid < finalTotal) {
                  paymentStatusText = `DP ${paid.toLocaleString('id-ID')}`;
                } else if (paid >= finalTotal) {
                  paymentStatusText = 'LUNAS';
                } else {
                  paymentStatusText = 'BELUM LUNAS';
                }
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-montserrat text-gray-500">Sub Total</span>
                      <span className="text-sm text-right font-montserrat font-medium text-gray-700">
                        Rp{subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {/* ✅ FIX: Urutan: Points > Membership > Payment Discount (sesuai prioritas) */}
                    {pointsDiscountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-montserrat text-gray-500">Potongan Poin</span>
                        <span className="text-sm text-right font-montserrat font-medium text-red-600">
                          (Rp{pointsDiscountAmount.toLocaleString('id-ID')})
                        </span>
                      </div>
                    )}
                    {membershipDiscountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-montserrat text-gray-500">Potongan Membership</span>
                        <span className="text-sm text-right font-montserrat font-medium text-red-600">
                          (Rp{membershipDiscountAmount.toLocaleString('id-ID')})
                        </span>
                      </div>
                    )}
                    {paymentDiscountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-montserrat text-gray-500">Potongan Diskon</span>
                        <span className="text-sm text-right font-montserrat font-medium text-red-600">
                          (Rp{paymentDiscountAmount.toLocaleString('id-ID')})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-montserrat text-gray-500">Total Akhir</span>
                      <span className="text-base text-right font-montserrat font-bold" style={{ color: getContentTextColor() }}>
                        Rp{finalTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-montserrat text-gray-500">Sudah Dibayar</span>
                      <span className="text-base text-right font-montserrat font-bold" style={{ color: getContentTextColor() }}>Rp{paid.toLocaleString('id-ID')}</span>
                    </div>
                    {sisa > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-montserrat text-red-700">Sisa Bayar</span>
                        <span className="bg-red-100 text-right text-red-700 rounded-full px-3 py-1 text-base font-bold">Rp{sisa.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Divider */}
              <div className="w-full border-t border-dashed border-gray-200 my-2"></div>
              {/* History pembayaran */}
              <div className="flex flex-col gap-1 mt-1">
                {(orderData.payment?.payment_details || []).map((pay, idx) => {
                  const paymentMethod = pay?.transaction?.finance_account?.payment_method?.code || 
                  pay?.transaction?.finance_account?.name || 
                                       pay?.payment_method_code || 
                                       pay?.transaction?.finance_account?.name ||
                                       pay?.payment_method_name || 
                                       pay?.method;
                  const formattedMethod = formatPaymentMethod(pay);
                  
                  return (
                  <div key={idx} className="flex items-center justify-between rounded-md px-2 py-1 border border-gray-200 shadow-xs" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
                    <div className="flex items-center gap-1">
                      {/* Icon metode minimalis */}
                      {(() => {
                        const methodCode = paymentMethod?.toLowerCase();
                        if (methodCode?.includes('qris')) {
                          return <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#9ca3af" strokeWidth="1.2" fill="none" /><path d="M7 8.5h10M7 12h6" stroke="#9ca3af" strokeWidth="1" /></svg>;
                        }
                        if (methodCode?.includes('cash') || methodCode?.includes('tunai')) {
                          return <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#9ca3af" strokeWidth="1.2" fill="none" /><path d="M7 12h10M7 16h6" stroke="#9ca3af" strokeWidth="1" /></svg>;
                        }
                        if (methodCode?.includes('bank') || methodCode?.includes('transfer')) {
                          return <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="#9ca3af" /><path d="M7 12h10M7 16h6" stroke="#fff" strokeWidth="1" /></svg>;
                        }
                        return <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" stroke="#9ca3af" strokeWidth="1.2" fill="none" /><path d="M7 12h10M7 16h6" stroke="#9ca3af" strokeWidth="1" /></svg>;
                      })()}
                      <span className="inline-block px-1.5 py-0.5 rounded bg-transparent text-gray-700 text-xs font-semibold font-montserrat border border-gray-300 break-words max-w-[80px]">
                        {paymentMethod.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-montserrat font-bold text-gray-700 text-xs whitespace-nowrap">Rp{Number(pay.amount).toLocaleString('id-ID')}</div>
                  </div>
                  );
                })}
              </div>
              {/* Status pembayaran */}
              {(() => {
                // ✅ FIX: Hitung finalTotal (setelah semua discount) seperti di Payment Breakdown
                // Hitung subtotal dari order_details
                let subtotal = 0;
                if (orderData.order_details && orderData.order_details.length > 0) {
                  subtotal = orderData.order_details.reduce((sum, group) => {
                    const finalPrice = calculateFinalPricePerItem(group);
                    const qty = group.items?.length || 1;
                    const groupTotal = finalPrice * qty;
                    return sum + groupTotal;
                  }, 0);
                } else {
                  // Fallback ke payment.subtotal jika order_details tidak ada
                  subtotal = Number(orderData.payment?.subtotal || 0);
                }
                
                // ✅ FIX: Calculate payment-level discount (pisahkan: payment discount, membership discount, points discount)
                let paymentDiscountAmount = 0; // Payment discount saja (dari discount object)
                let membershipDiscountAmount = 0; // Membership discount
                let pointsDiscountAmount = 0; // Points discount
                let finalTotal = subtotal;
                
                // Prioritaskan final_price dari backend jika tersedia (lebih akurat)
                if (orderData.payment?.final_price != null) {
                  finalTotal = Number(orderData.payment.final_price);
                  
                  // ✅ FIX: Pisahkan discount dari backend jika tersedia
                  membershipDiscountAmount = Number(orderData.payment.membership_discount || 0);
                  pointsDiscountAmount = Number(orderData.payment.points_discount || 0);
                  
                  // Hitung payment discount (dari discount object atau dari total_discount - membership - points)
                  if (orderData.payment?.discount && orderData.payment.discount.type) {
                    // Hitung dari discount object
                    const paymentDiscount = orderData.payment.discount;
                    const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
                    
                    if (paymentDiscount.type === 'percent') {
                      paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
                    } else if (paymentDiscount.type === 'nominal') {
                      paymentDiscountAmount = discVal;
                    }
                  } else if (orderData.payment?.total_discount != null) {
                    // Jika tidak ada discount object, hitung payment discount dari total_discount - membership - points
                    const totalDiscount = Number(orderData.payment.total_discount);
                    paymentDiscountAmount = Math.max(0, totalDiscount - membershipDiscountAmount - pointsDiscountAmount);
                  }
                } else if (orderData.payment?.discount && orderData.payment.discount.type) {
                  // Jika final_price tidak tersedia, hitung dari discount object
                  const paymentDiscount = orderData.payment.discount;
                  const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
                  
                  if (paymentDiscount.type === 'percent') {
                    paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
                  } else if (paymentDiscount.type === 'nominal') {
                    paymentDiscountAmount = discVal;
                  }
                  
                  // ✅ FIX: Ambil membership discount dan points discount dari backend jika ada
                  membershipDiscountAmount = Number(orderData.payment.membership_discount || 0);
                  pointsDiscountAmount = Number(orderData.payment.points_discount || 0);
                  
                  finalTotal = Math.max(0, Math.round(subtotal - paymentDiscountAmount - membershipDiscountAmount - pointsDiscountAmount));
                } else {
                  // ✅ FIX: Jika tidak ada payment discount object, cek langsung dari membership_discount dan points_discount
                  membershipDiscountAmount = Number(orderData.payment.membership_discount || 0);
                  pointsDiscountAmount = Number(orderData.payment.points_discount || 0);
                  
                  if (membershipDiscountAmount > 0 || pointsDiscountAmount > 0) {
                    finalTotal = Math.max(0, Math.round(subtotal - membershipDiscountAmount - pointsDiscountAmount));
                  }
                }
                
                // Hitung totalPaid dari payment_details
                const totalPaid = Number((orderData.payment?.payment_details || []).reduce((a, b) => a + Number(b.amount || 0), 0));
                
                // ✅ FIX: Tentukan status pembayaran berdasarkan finalTotal (setelah semua discount), bukan subtotal
                let paymentStatusText = '';
                // Jika total amount = 0 (free service atau sudah lunas dengan discount), otomatis lunas
                if (finalTotal === 0) {
                  paymentStatusText = 'LUNAS';
                } else if (totalPaid === 0) {
                  paymentStatusText = 'BELUM LUNAS';
                } else if (totalPaid > 0 && totalPaid < finalTotal) {
                  paymentStatusText = `DP ${totalPaid.toLocaleString('id-ID')}`;
                } else if (totalPaid >= finalTotal) {
                  paymentStatusText = 'LUNAS';
                } else {
                  paymentStatusText = 'BELUM LUNAS';
                }
                
                const isLunas = paymentStatusText === 'LUNAS';
                
                return (
                  <div className="flex items-center justify-between mt-3 px-1">
                    <span className="text-xs text-gray-500 font-montserrat">Status</span>
                    <span className={`text-base font-bold font-montserrat rounded-full px-4 py-2 ${isLunas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} whitespace-nowrap`}>
                      {paymentStatusText}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Reward Poin Section - Tampilkan jika points enabled */}
          {orderData?.points_settings?.enabled && (() => {
            // Hitung subtotal dan finalTotal (sama seperti di InvoiceContentPreview.jsx)
            let subtotal = 0;
            if (orderData.order_details && orderData.order_details.length > 0) {
              subtotal = orderData.order_details.reduce((sum, group) => {
                const finalPrice = calculateFinalPricePerItem(group);
                const qty = group.items?.length || 1;
                const groupTotal = finalPrice * qty;
                return sum + groupTotal;
              }, 0);
            } else {
              subtotal = Number(orderData.payment?.subtotal || 0);
            }
            
            // ✅ FIX: Hitung semua discount types (mirror InvoiceContentPreview.jsx)
            const membershipDiscountAmount = Number(orderData.payment?.membership_discount || 0);
            const pointsDiscountAmount = Number(orderData.payment?.points_discount || 0);
            let paymentDiscountAmount = 0;
            let finalTotal = subtotal;
            
            // Prioritaskan final_price dari backend jika tersedia (lebih akurat)
            if (orderData.payment?.final_price != null) {
              finalTotal = Number(orderData.payment.final_price);
              
              // Hitung payment discount (dari discount object atau dari total_discount - membership - points)
              if (orderData.payment?.discount && orderData.payment.discount.type) {
                // Hitung dari discount object
                const paymentDiscount = orderData.payment.discount;
              const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
                
              if (paymentDiscount.type === 'percent') {
                paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
              } else if (paymentDiscount.type === 'nominal') {
                paymentDiscountAmount = discVal;
              }
              } else if (orderData.payment?.total_discount != null) {
                // ✅ FIX: Hitung payment discount dari total_discount - membership - points
                const totalDiscount = Number(orderData.payment.total_discount);
                paymentDiscountAmount = Math.max(0, totalDiscount - membershipDiscountAmount - pointsDiscountAmount);
              }
            } else if (orderData.payment?.discount && orderData.payment.discount.type) {
              // Jika final_price tidak tersedia, hitung dari discount object
              const paymentDiscount = orderData.payment.discount;
              const discVal = Number(paymentDiscount.discount != null ? paymentDiscount.discount : paymentDiscount.value || 0);
              
              if (paymentDiscount.type === 'percent') {
                paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
              } else if (paymentDiscount.type === 'nominal') {
                paymentDiscountAmount = discVal;
              }
              
              finalTotal = Math.max(0, Math.round(subtotal - paymentDiscountAmount - membershipDiscountAmount - pointsDiscountAmount));
            } else {
              // ✅ FIX: Jika tidak ada payment discount object, cek langsung dari membership_discount dan points_discount
              if (membershipDiscountAmount > 0 || pointsDiscountAmount > 0) {
                finalTotal = Math.max(0, Math.round(subtotal - membershipDiscountAmount - pointsDiscountAmount));
              }
            }
            
            const paid = Number((orderData.payment?.payment_details || []).reduce((a, b) => a + Number(b.amount || 0), 0));
            const paymentStatus = orderData.payment?.status || 'unpaid';
            const earnRate = orderData.points_settings?.earn_rate || 1000;
            
            // Calculate points: HANYA PAID = Poin Didapat, DP/UNPAID = Poin Menunggu
            let pointsEarned = 0;
            let pointsLabel = '';
            if (paymentStatus === 'paid' && paid > 0) {
              pointsEarned = Math.floor(paid / earnRate);
              pointsLabel = 'Poin Didapat';
            } else if (paymentStatus === 'dp' || paymentStatus === 'unpaid') {
              // Status DP atau UNPAID: poin masih menunggu (dari final_price)
              pointsEarned = Math.floor(finalTotal / earnRate);
              pointsLabel = 'Poin Menunggu';
            }
            
            // Get customer points data
            const currentPoints = orderData.customer?.points != null ? Number(orderData.customer.points) : 0;
            const membershipName = orderData.customer?.current_membership?.membership?.name || null;
            
            // Get bonus points dari orderData
            const bonusPoints = orderData.bonus_points || { firstOrder: 0, referral: 0 };
            
            return (
              <div className="px-4 pt-2 pb-4">
                <div className="rounded-2xl shadow-lg border border-gray-200 px-5 py-5 flex flex-col gap-3" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
                  <div className="text-lg font-montserrat font-bold mb-1" style={{ color: getContentTextColor() }}>Reward Poin</div>
                  
                  {/* Poin Tambahan / Poin Menunggu */}
                  {pointsEarned > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-montserrat text-gray-600">{pointsLabel}</span>
                      <span className="text-base font-montserrat font-bold text-green-600">
                        +{formatNumber(pointsEarned)}
                      </span>
                    </div>
                  )}
                  
                  {/* Bonus Order Pertama (tampil jika ada) */}
                  {bonusPoints.firstOrder > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-montserrat text-gray-600">Bonus Order Pertama</span>
                      <span className="text-base font-montserrat font-bold text-green-600">
                        +{formatNumber(bonusPoints.firstOrder)}
                      </span>
                    </div>
                  )}
                  
                  {/* Bonus Referral (tampil jika ada) */}
                  {bonusPoints.referral > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-montserrat text-gray-600">Bonus Referral</span>
                      <span className="text-base font-montserrat font-bold text-green-600">
                        +{formatNumber(bonusPoints.referral)}
                      </span>
                    </div>
                  )}
                  
                  {/* Poin Saat Ini */}
                  {/* <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <span className="text-sm font-montserrat text-gray-600">Poin Saat Ini</span>
                    <span className="text-base font-montserrat font-bold" style={{ color: getContentTextColor() }}>
                      {formatNumber(currentPoints)}
                    </span>
                  </div> */}
                  
                  {/* Membership (if exists) */}
                  {membershipName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-montserrat text-gray-600">Membership</span>
                      <span className="text-sm font-montserrat font-semibold" style={{ color: getContentTextColor() }}>
                        {membershipName}
                      </span>
                    </div>
                  )}
                  
                  {/* Promotional text */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-montserrat text-center text-gray-500 italic">
                      Tukar poin kamu jadi diskon!
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* Footer Invoice - Premium Modern (Serasi Header) dengan Printer Settings */}
          <div className="px-4 pb-8 pt-2">
            <div className="rounded-b-3xl shadow-md px-5 py-7 flex flex-col items-center text-center gap-3" style={{ background: getFooterGradient() }}>
              {/* Footer Notes / Syarat & Ketentuan - DI ATAS THANK YOU dengan Title */}
              {(orderData?.invoice_digital_settings?.footer_notes || orderData?.printer_settings?.footer_notes) && (
                <div className="w-full max-w-md">
                  <div className="text-xs sm:text-sm font-montserrat mb-2 font-semibold bg-white/15 rounded-lg px-4 py-2 backdrop-blur text-center" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    INFORMASI PENTING
                  </div>
                  <div className="text-sm font-montserrat mb-2 text-left bg-white/10 rounded-lg px-4 py-3 backdrop-blur" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    {(orderData?.invoice_digital_settings?.footer_notes || orderData?.printer_settings?.footer_notes || '').split('\n').map((line, idx) => (
                      line.trim() && (
                        <div key={idx} className="mb-1 text-xs sm:text-sm">
                          {line.trim().startsWith('•') || line.trim().startsWith('-') 
                            ? line.trim() 
                            : `• ${line.trim()}`
                          }
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Custom Thank You Message */}
              {orderData?.invoice_digital_settings?.custom_thank_you || orderData?.printer_settings?.custom_thank_you ? (
                <div className="text-base font-montserrat mb-2 break-words drop-shadow" style={{ color: getFooterTextColor() }}>
                  {orderData?.invoice_digital_settings?.custom_thank_you || orderData?.printer_settings?.custom_thank_you}
                </div>
              ) : (
                <div className="text-base font-montserrat mb-2 break-words drop-shadow" style={{ color: getFooterTextColor() }}>
                  Terima kasih telah mempercayakan kami di {orderData?.tenant?.business_name || 'NotaSepatu'}.
                </div>
              )}
              
              {/* Promo Text - DI ATAS SOCIAL MEDIA dengan Title */}
              {(orderData?.invoice_digital_settings?.promo_text || orderData?.printer_settings?.promo_text) && (
                <div className="w-full max-w-md">
                  <div className="text-xs sm:text-sm font-montserrat mb-2 font-semibold bg-white/15 rounded-lg px-4 py-2 backdrop-blur text-center" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    PROMO SAAT INI
                  </div>
                  <div className="text-xs sm:text-sm font-montserrat bg-white/10 rounded-lg px-4 py-2 backdrop-blur text-left" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    {(orderData?.invoice_digital_settings?.promo_text || orderData?.printer_settings?.promo_text || '').split('\n').map((line, idx) => (
                      line.trim() && (
                        <div key={idx} className="mb-1 last:mb-0">
                          {line.trim()}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Social Media (Instagram & Website) - DI BAWAH PROMO */}
              {((orderData?.invoice_digital_settings?.instagram || orderData?.printer_settings?.instagram) || 
                (orderData?.invoice_digital_settings?.website || orderData?.printer_settings?.website)) && (
                <div className="flex flex-col items-center gap-2 text-sm font-montserrat" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                  {(orderData?.invoice_digital_settings?.instagram || orderData?.printer_settings?.instagram) && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" fill="currentColor" />
                        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
                      </svg>
                      <span>{orderData?.invoice_digital_settings?.instagram || orderData?.printer_settings?.instagram}</span>
                    </div>
                  )}
                  {(orderData?.invoice_digital_settings?.website || orderData?.printer_settings?.website) && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{orderData?.invoice_digital_settings?.website || orderData?.printer_settings?.website}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Footer Credit - PALING BAWAH */}
              <div className="text-xs font-montserrat mt-2 italic" style={{ color: getFooterTextColor(), opacity: 0.8 }}>
                Invoice digital ini dibuat dengan NotaSepatu
              </div>
            </div>
          </div>
          {/* Safe area bawah untuk iPhone/browser modern */}
          {/* <div className="pb-safe pb-8 mb-20" /> */}
        </div>
      )}

      {/* Progress Modal - Mirip StatusHistoryModal */}
      {progressModalOpen && selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
          onClick={closeProgressModal}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl animate-fadeInUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-montserrat font-bold text-xl text-gray-800">Progress Item</h2>
              <button
                onClick={closeProgressModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Item Name */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-montserrat font-semibold text-lg text-gray-800">{selectedItemName}</h3>
                <p className="text-sm text-gray-500 font-montserrat mt-1">Status saat ini: 
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(selectedItem.status)}`}>
                    {selectedItem.status === 'siap' ? 'Siap Diambil/Dikirim' : formatOrderDetailStatus(selectedItem.status)}
                  </span>
                </p>
              </div>

              {/* Status Logs */}
              {selectedItem.status_logs && selectedItem.status_logs.length > 0 ? (
                <div className="space-y-4">
                  {selectedItem.status_logs.map((log, index) => (
                    <div key={log.id} className="relative">
                      {/* Timeline line */}
                      {index < selectedItem.status_logs.length - 1 && (
                        <div className="absolute left-6 top-8 w-0.5 h-12 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Status icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                          {getStatusIcon(log.new_status)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Status change info */}
                          {log.old_status && log.old_status !== log.new_status ? (
                            <div className="mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.old_status)}`}>
                                  {log.old_status === 'siap' ? 'Siap Diambil/Dikirim' : formatOrderDetailStatus(log.old_status)}
                                </span>
                                <span className="text-gray-400 text-xs">→</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.new_status)}`}>
                                  {log.new_status === 'siap' ? 'Siap Diambil/Dikirim' : formatOrderDetailStatus(log.new_status)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.new_status)} mb-2`}>
                              {log.new_status === 'siap' ? 'Siap Diambil/Dikirim' : formatOrderDetailStatus(log.new_status)}
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 font-montserrat">
                            {formatDateTime(log.created_at)}
                          </p>
                          
                          {/* Status updater info - hanya tampilkan jika setting aktif */}
                          {orderData?.invoice_digital_settings?.show_technician_info && (
                            log.status_updater ? (
                              <div className="mt-2">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 font-montserrat">Diperbarui oleh:</span>
                                  <span className="text-xs font-semibold text-blue-600 font-montserrat">
                                    {log.status_updater.name}
                                  </span>
                                </div>
                              </div>
                            ) : log.updated_by ? (
                              <div className="mt-2">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 font-montserrat">Diperbarui oleh:</span>
                                  <span className="text-xs font-semibold text-blue-600 font-montserrat">
                                    User ID: {log.updated_by}
                                  </span>
                                </div>
                              </div>
                            ) : null
                          )}
                          
                          {/* Photos - hanya tampilkan jika setting aktif */}
                          {orderData?.invoice_digital_settings?.show_progress_photos && log.item_status_photos && log.item_status_photos.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 font-montserrat mb-2">Foto progress:</p>
                              <div className="flex flex-wrap gap-2">
                                {log.item_status_photos.map((photo, photoIndex) => (
                                  <div key={photo.id} className="relative">
                                    <img
                                      src={getPhotoUrl(photo.photo_url)}
                                      alt="Progress photo"
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-md"
                                      onClick={() => handleOpenProgressPhotoGallery(log.item_status_photos, photoIndex)}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="font-montserrat text-gray-600 text-center">
                    Belum ada riwayat progress
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={closeProgressModal}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold font-montserrat hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: getButtonBackgroundColor() }}
                onMouseEnter={(e) => e.target.style.backgroundColor = darkenColor(orderData?.invoice_digital_settings?.header_color || '#5096FC', 30)}
                onMouseLeave={(e) => e.target.style.backgroundColor = getButtonBackgroundColor()}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal untuk Progress Photos */}
      <PhotoGalleryModal
        isOpen={showProgressPhotoGallery}
        onClose={handleCloseProgressPhotoGallery}
        photos={selectedProgressPhotos}
        initialIndex={selectedProgressPhotoIndex}
      />

      {/* Photo Gallery Modal untuk Shoes Photos */}
      <PhotoGalleryModal
        isOpen={showShoesPhotoGallery}
        onClose={handleCloseShoesPhotoGallery}
        photos={selectedShoesPhotos}
        initialIndex={selectedShoesPhotoIndex}
      />
    </div>
  );
};

export default Invoice; 