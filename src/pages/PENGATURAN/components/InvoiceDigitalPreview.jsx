import { useEffect, useState } from 'react';
import { generateGradientFromColor, calculateContrastColor, darkenColor, lightenColor } from '../../../utils/colorGradientHelper';
import { getPhotoUrl } from '../../../utils/photoUrlHelper';
import { getUserProfile } from '../../../utils/userProfileHelper';
import { FaMapMarkerAlt, FaPhone, FaUser } from 'react-icons/fa';

const InvoiceDigitalPreview = ({ formData }) => {
  // State untuk data tenant/branch dari user profile
  const [tenantData, setTenantData] = useState({
    business_name: 'NotaSepatu',
    address: 'Jl. Contoh No. 123',
    phone: '081234567890'
  });
  const [branchData, setBranchData] = useState({
    name: 'Cabang Pusat',
    address: 'Jl. Contoh No. 123',
    phone: '081234567890'
  });
  
  // Fetch data tenant/branch dari user profile
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          // Update tenant data
          if (profile.tenant) {
            setTenantData({
              business_name: profile.tenant.business_name || 'NotaSepatu',
              address: profile.tenant.address || 'Jl. Contoh No. 123',
              phone: profile.tenant.phone || '081234567890'
            });
          }
          
          // Update branch data
          if (profile.branch) {
            setBranchData({
              name: profile.branch.name || 'Cabang Pusat',
              address: profile.branch.address || 'Jl. Contoh No. 123',
              phone: profile.branch.phone || '081234567890'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    fetchProfileData();
  }, []);
  // Helper functions
  const getHeaderGradient = () => {
    if (formData?.header_color) {
      const colors = generateGradientFromColor(formData.header_color);
      return `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
    return 'linear-gradient(to bottom right, #5096FC, #7BD1FD, #6C63FF)';
  };

  const getFooterGradient = () => {
    if (formData?.footer_color) {
      const colors = generateGradientFromColor(formData.footer_color);
      return `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
    return 'linear-gradient(to bottom right, #5096FC, #7BD1FD, #6C63FF)';
  };

  const getLogoUrl = () => {
    if (formData?.show_logo && formData?.logo_url) {
      return getPhotoUrl(formData.logo_url);
    }
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatNumber = (num) => Number(num).toLocaleString('id-ID');

  // Get header text color from settings or auto-calculate
  const getHeaderTextColor = () => {
    if (formData?.header_text_color) {
      return formData.header_text_color;
    }
    const headerColor = formData?.header_color || '#5096FC';
    return calculateContrastColor(headerColor);
  };

  // Get footer text color from settings or auto-calculate
  const getFooterTextColor = () => {
    if (formData?.footer_text_color) {
      return formData.footer_text_color;
    }
    const footerColor = formData?.footer_color || '#5096FC';
    return calculateContrastColor(footerColor);
  };

  // Get content text color - darkened version of header color
  const getContentTextColor = () => {
    const headerColor = formData?.header_color || '#5096FC';
    return darkenColor(headerColor, 60);
  };

  // Get card background color - lightened version of header color
  const getCardBackgroundColor = () => {
    const headerColor = formData?.header_color || '#5096FC';
    return lightenColor(headerColor, 70);
  };

  // Dummy data dengan data dinamis dari profile
  const dummyData = {
    id: 12345,
    entry_date: new Date().toISOString(),
    tenant: tenantData,
    branch: branchData,
    customer: { name: 'Customer Name', address: 'Jl. Customer No. 456', phone: '081234567890' },
    order_details: [
      {
        treatment: { name: 'Shoes - Deep Clean' },
        items: [{ id: 1 }, { id: 2 }],
        qty: 2,
        process_time: 'regular',
        price: 40000
      },
      {
        treatment: { name: 'Shoes - Fast Clean' },
        items: [{ id: 3 }],
        qty: 1,
        process_time: 'regular',
        price: 25000
      }
    ],
    payment: {
      final_price: 105000,
      payment_details: [
        { amount: 50000, method: 'Cash' },
        { amount: 55000, method: 'QRIS' }
      ],
      status: 'lunas'
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Preview Invoice Digital</h3>
      
      <div className="overflow-x-auto">
        {/* Mini Invoice Card */}
        <div className="inline-block w-full max-w-[400px] bg-white rounded-3xl outline outline-2 outline-[#EEF1F7] shadow-md">
          {/* Header */}
          <div className="relative px-4 pt-6 pb-5 text-center mb-0 rounded-t-3xl overflow-hidden" style={{ background: getHeaderGradient() }}>
            {/* Logo or Icon */}
            <div className="flex justify-center mb-2">
              {getLogoUrl() ? (
                <img src={getLogoUrl()} alt="Logo" className="h-24 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={formData.header_text_color || 'white'} strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Business Name - Tampilkan jika tidak ada logo ATAU jika logo ada DAN show_business_name true */}
            {(!getLogoUrl() || (getLogoUrl() && formData?.show_business_name !== false)) && (
              <h2 className="text-3xl sm:text-4xl font-montserrat font-bold tracking-widest mb-1 drop-shadow-lg uppercase" style={{ letterSpacing: '0.08em', textShadow: '0 2px 8px rgba(0,0,0,0.1)', color: getHeaderTextColor() }}>
                {dummyData.tenant.business_name}
              </h2>
            )}
            {/* Tagline - Tampilkan jika tidak ada logo ATAU jika logo ada DAN show_tagline true */}
            {(!getLogoUrl() || (getLogoUrl() && formData?.show_tagline !== false)) && (
              <div className="text-xs sm:text-base font-montserrat font-semibold tracking-widest uppercase mb-2" style={{ color: getHeaderTextColor(), opacity: 0.9 }}>
                Invoice Pembayaran
              </div>
            )}
            {/* Accent bar */}
            <div className="mx-auto w-24 h-1.5 rounded-full bg-gradient-to-r mb-3" style={{ background: `linear-gradient(to right, ${getHeaderTextColor()}80, ${getHeaderTextColor()}40, ${getHeaderTextColor()}80)` }} />
            {/* Info toko */}
            <div className="flex flex-col items-center gap-1 text-xs sm:text-sm font-montserrat font-medium mx-auto w-full px-4" style={{ color: getHeaderTextColor(), opacity: 0.9 }}>
              <div className="flex items-center gap-1 justify-center w-full whitespace-nowrap overflow-hidden">
                <FaMapMarkerAlt className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: getHeaderTextColor(), opacity: 0.7 }} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">{dummyData.branch.address || dummyData.tenant.address}</span>
              </div>
              <div className="flex items-center gap-1 justify-center w-full whitespace-nowrap overflow-hidden">
                <FaPhone className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: getHeaderTextColor(), opacity: 0.7 }} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">Telp: {dummyData.branch.phone || dummyData.tenant.phone || '0877-9545-2475'}</span>
              </div>
            </div>
          </div>

          {/* Info invoice otomatis */}
          <div className="px-4 pt-4 pb-1 text-left mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-montserrat mb-2 break-words text-left">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#E5E7EB" /><path d="M12 8v4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="#6B7280" /></svg>
              Invoice ini dibuat otomatis oleh sistem
            </div>
          </div>

          {/* Customer Info Section */}
          <div className="px-4 pt-3 pb-2 text-left">
            <div className="flex flex-row items-end justify-between gap-4 mb-3 w-full">
              {/* Order ID */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-montserrat text-gray-400 font-medium tracking-wide mb-0.5">Order ID</span>
                <span className="text-sm font-montserrat font-bold tracking-wide select-all break-all" style={{ color: getContentTextColor() }}>#{dummyData.id}</span>
                <span className="block h-1 w-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5" />
              </div>
              {/* Tanggal Masuk */}
              <div className="flex flex-col flex-1 min-w-0 items-end">
                <span className="text-xs font-montserrat text-gray-400 font-base tracking-wide mb-0.5">Tanggal Masuk</span>
                <span className="text-sm font-montserrat font-bold tracking-wide whitespace-nowrap" style={{ color: getContentTextColor() }}>{formatDate(dummyData.entry_date)}</span>
                <span className="block h-1 w-10 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5 ml-auto" />
              </div>
            </div>
            
            {/* Customer Card */}
            <div className="backdrop-blur rounded-3xl shadow-lg border border-gray-200 px-4 py-4 flex flex-col gap-3 mt-2 mb-2 text-left" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full p-2 flex items-center justify-center" style={{ backgroundColor: lightenColor(formData?.header_color || '#5096FC', 75) }}>
                    <FaUser className="w-4 h-4" style={{ color: getContentTextColor() }} />
                  </span>
                  <span className="text-base font-montserrat font-bold ml-2 break-words truncate" style={{ color: getContentTextColor() }}>{dummyData.customer.name}</span>
                </div>
                {/* Accent bar di bawah nama */}
                <span className="block h-1 w-12 bg-gradient-to-r from-gray-400 to-gray-300 rounded-full mt-1 mb-0.5" />
              </div>
              <div className="flex flex-row items-center gap-4 text-sm text-gray-600 font-montserrat w-full mt-1">
                <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="truncate" title={dummyData.customer.address}>
                    {dummyData.customer.address}
                  </span>
                </div>
                {dummyData.customer.phone && (
                  <div className="flex flex-row items-center gap-1 flex-shrink-0">
                    <FaPhone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span title={dummyData.customer.phone}>
                      {dummyData.customer.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="px-4 pt-2 pb-3 text-left">
            <div className="text-lg font-montserrat font-bold mb-2" style={{ color: getContentTextColor() }}>Detail Pesanan</div>
            <div className="flex flex-col gap-1">
              {dummyData.order_details.map((group, idx) => (
                <div key={idx} className="rounded-2xl shadow-lg border border-gray-200 p-3 flex flex-col gap-2 mb-2" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-montserrat font-bold text-base break-words flex items-center" style={{ color: getContentTextColor() }}>
                      {group.treatment.name}
                    </div>
                    <div className="flex flex-row items-center gap-2 mt-0.5">
                      <span className="text-xs font-montserrat text-gray-400">{group.qty} item</span>
                      <span className="text-xs font-montserrat font-semibold" style={{ color: getContentTextColor() }}>Rp{formatNumber(group.price)} <span className="font-normal text-gray-500">/item</span></span>
                    </div>
                    <div className="flex flex-row items-center gap-2 mt-0.5">
                      <span className="text-xs font-montserrat text-gray-500">Total</span>
                      <span className="text-base font-montserrat font-bold" style={{ color: getContentTextColor() }}>Rp{formatNumber(group.price * group.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div className="px-4 pt-2 pb-3">
            <div className="rounded-2xl shadow-lg border border-gray-200 px-4 py-4 flex flex-col gap-2" style={{ background: `linear-gradient(to bottom right, white, ${getCardBackgroundColor()})` }}>
              <div className="text-lg font-montserrat font-bold mb-2" style={{ color: getContentTextColor() }}>Pembayaran</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-montserrat text-gray-500">Total</span>
                <span className="text-base text-right font-montserrat font-bold" style={{ color: getContentTextColor() }}>Rp{formatNumber(dummyData.payment.final_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-montserrat text-gray-500">Sudah Dibayar</span>
                <span className="text-base text-right font-montserrat font-bold" style={{ color: getContentTextColor() }}>Rp{formatNumber(dummyData.payment.final_price)}</span>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-xs text-gray-500 font-montserrat">Status</span>
                <span className="text-base font-bold font-montserrat rounded-full px-4 py-2 bg-green-100 text-green-700 whitespace-nowrap">LUNAS</span>
              </div>
            </div>
          </div>

          {/* Footer Invoice */}
          <div className="px-4 pb-6 pt-2">
            <div className="rounded-b-3xl shadow-md px-4 py-5 flex flex-col items-center text-center gap-3" style={{ background: getFooterGradient() }}>
              {/* Footer Notes / Syarat & Ketentuan - DI ATAS THANK YOU dengan Title */}
              {formData?.footer_notes && (
                <div className="w-full max-w-md">
                  <div className="text-xs sm:text-sm font-montserrat mb-2 font-semibold bg-white/15 rounded-lg px-4 py-2 backdrop-blur text-center" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    INFORMASI PENTING
                  </div>
                  <div className="text-sm font-montserrat mb-2 text-left bg-white/10 rounded-lg px-4 py-3 backdrop-blur" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    {(formData.footer_notes || '').split('\n').map((line, idx) => (
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
              {formData?.custom_thank_you ? (
                <div className="text-base font-montserrat mb-2 break-words drop-shadow" style={{ color: getFooterTextColor() }}>
                  {formData.custom_thank_you}
                </div>
              ) : (
                <div className="text-base font-montserrat mb-2 break-words drop-shadow" style={{ color: getFooterTextColor() }}>
                  Terima kasih telah mempercayakan kami di {dummyData.tenant.business_name}.
                </div>
              )}
              
              {/* Promo Text - DI ATAS SOCIAL MEDIA dengan Title */}
              {formData?.promo_text && (
                <div className="w-full max-w-md">
                  <div className="text-xs sm:text-sm font-montserrat mb-2 font-semibold bg-white/15 rounded-lg px-4 py-2 backdrop-blur text-center" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    PROMO SAAT INI
                  </div>
                  <div className="text-xs sm:text-sm font-montserrat bg-white/10 rounded-lg px-4 py-2 backdrop-blur text-left" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                    {(formData.promo_text || '').split('\n').map((line, idx) => (
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
              {(formData?.instagram || formData?.website) && (
                <div className="flex flex-col items-center gap-2 text-sm font-montserrat" style={{ color: getFooterTextColor(), opacity: 0.9 }}>
                  {formData.instagram && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" fill="currentColor" />
                        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
                      </svg>
                      <span>{formData.instagram}</span>
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{formData.website}</span>
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
        </div>
      </div>
    </div>
  );
};

export default InvoiceDigitalPreview;

