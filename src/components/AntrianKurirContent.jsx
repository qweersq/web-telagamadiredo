import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";
import LordIcon from "./Design/LordIcon";
import AnimatedButton from "./Design/AnimatedButton";
import WhatsAppFormatter from "./WhatsAppMessage/WhatsAppFormatter";
import Modal from './Modal/ConfirmationModal';
import PhotoGalleryModal from './Modal/PhotoGalleryModal';
import { formatOrderDetailStatus } from "../utils/labelFormatter";
import { getTenantBusinessName } from "../utils/userProfileHelper";

const AntrianKurirContent = ({
  filteredAntrian,
  type,
  searchQuery,
  handleWhatsApp,
  handleStartDelivery,
  handleCancelDelivery,
  handleSelesaiClick,
  loading = false,
  activeDeliveryId, // pastikan prop ini diterima
}) => {
  const [copiedId, setCopiedId] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  const getButtonText = (type) => {
    return type === "pickup" ? "Mulai Penjemputan" : "Mulai Pengantaran";
  };

  const getWhatsAppMessage = async (type) => {
    try {
      const businessName = await getTenantBusinessName();
      if (type === "pickup") {
        return encodeURIComponent(WhatsAppFormatter.formatStartDeliveryMessage("pickup", businessName));
      } else {
        return encodeURIComponent(WhatsAppFormatter.formatStartDeliveryMessage("delivery", businessName));
      }
    } catch (error) {
      console.error('Error getting business name:', error);
      // Fallback ke default
      if (type === "pickup") {
        return encodeURIComponent(WhatsAppFormatter.formatStartDeliveryMessage("pickup"));
      } else {
        return encodeURIComponent(WhatsAppFormatter.formatStartDeliveryMessage("delivery"));
      }
    }
  };

  const handleCopyAddress = (id, address) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset setelah 2 detik
  };

  const handleOpenPhotoGallery = (photos, initialIndex = 0) => {
    if (photos && photos.length > 0) {
      setGalleryPhotos(photos);
      setGalleryInitialIndex(initialIndex);
      setShowPhotoGallery(true);
    }
  };

  return (
    <div className="max-w-[390px] md:max-w-none mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Memuat data...
          </div>
        ) : filteredAntrian.length > 0 ? (
          filteredAntrian.map((customer) => {
            return (
              <div
                key={customer.customerName + customer.phone}
                className="rounded-2xl p-3 outline outline-1 outline-[#C1C1C1] bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header dengan nama dan info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-gray-800 truncate">
                        {customer.customerName}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {customer.itemCount} item
                      </span>
                    </div>
                    {/* Droppoint Badge */}
                    {customer.branch_type === 'mitra' && customer.branch_name && (
                      <span className="inline-block mb-1 px-2 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-300 rounded-full bg-purple-50 truncate max-w-full">
                        📍 {customer.branch_name}
                      </span>
                    )}
                    <p className="text-sm text-gray-600 font-medium">
                      {customer.phone}
                    </p>
                  </div>
                  <AnimatedButton
                    onClick={() => {
                      setModalItems(customer.items);
                      setModalCustomer(customer);
                      setShowItemModal(true);
                    }}
                    className="p-1 rounded-lg bg-blue-500 text-white transition-colors flex-shrink-0"
                    title="Lihat detail lengkap"
                  >
                    <span className="text-xs">Detail</span>
                  </AnimatedButton>
                </div>

                {/* Alamat dengan copy button */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {customer.address || "Tidak ada alamat"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyAddress(customer.customerName, customer.address)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                    title="Salin alamat"
                  >
                    {copiedId === customer.customerName ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Google Maps link */}
                {customer.googleMapsUrl && customer.googleMapsUrl !== '-' ? (
                  <a
                    href={customer.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mb-2 inline-block"
                  >
                    📍 Buka di Google Maps
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 mb-2 inline-block">
                    📍 Link Google Maps tidak tersedia
                  </span>
                )}

                {/* Tanggal dan waktu */}
                <div className="flex justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Tanggal:</span> {customer.items && customer.items.length > 0 && customer.items[0].delivery_date ?
                      format(new Date(customer.items[0].delivery_date), "dd MMM yyyy", { locale: id }) :
                      'Belum dijadwalkan'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Waktu:</span> {customer.requestTime && !isNaN(new Date(customer.requestTime)) ? format(new Date(customer.requestTime), "HH:mm", { locale: id }) : 'Belum dijadwalkan'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={async () => {
                        const message = await getWhatsAppMessage(type);
                        handleWhatsApp(customer.phone, message);
                      }}
                      className="w-[36px] h-[36px] rounded-xl flex items-center justify-center text-white bg-[#25D366] hover:bg-[#1ebe57] transition-colors shadow-sm"
                      title="Kirim WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.77 0-3.5-.46-5.01-1.33l-.36-.21-3.69.97.99-3.59-.23-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.55 0 4.95.99 6.76 2.8A9.54 9.54 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 5.01 4.23.7.24 1.25.38 1.68.49.71.18 1.36.15 1.87.09.57-.07 1.75-.72 2-1.41.25-.69.25-1.28.18-1.41-.07-.13-.25-.2-.53-.34z" />
                      </svg>
                    </AnimatedButton>

                  </div>
                  <div className="flex gap-2 flex-1 justify-end">
                    <AnimatedButton
                      onClick={() => handleCancelDelivery(customer)}
                      className="flex-1 h-[36px] rounded-xl flex items-center justify-center text-xs font-semibold text-blue-500 border border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      Opsi Lain
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handleSelesaiClick(customer)}
                      variant="green"
                      className="flex-1 h-[36px] rounded-xl flex items-center justify-center text-xs font-semibold"
                    >
                      Selesai
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchQuery.trim() !== ""
              ? "Tidak ada data yang sesuai dengan pencarian"
              : `Tidak ada antrian ${type === 'pickup' ? 'penjemputan' : 'pengantaran'} untuk saat ini.`}
          </div>
        )}
      </div>
      {/* Detail Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-fadeInUp flex flex-col max-h-[85vh]">
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white flex-shrink-0 border-b-2 border-blue-700 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-montserrat text-base font-semibold">Detail Antrian</h2>
                  <p className="text-xs opacity-90 mt-0.5">{type === 'pickup' ? 'Penjemputan' : 'Pengantaran'}</p>
                </div>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="px-6 py-4 flex-1 overflow-y-auto" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              {/* Customer Info */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-base">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informasi Customer
                </h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-600">Nama:</span> {modalCustomer?.customerName}</p>
                  <p><span className="font-medium text-gray-600">Telepon:</span> {modalCustomer?.phone}</p>
                  <p><span className="font-medium text-gray-600">Total Item:</span> {modalCustomer?.itemCount} item</p>
                </div>
              </div>

              {/* Address Info */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-base">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Alamat
                </h3>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {modalCustomer?.address || "Tidak ada alamat"}
                  </p>
                  {modalCustomer?.googleMapsUrl && modalCustomer?.googleMapsUrl !== '-' && (
                    <a
                      href={modalCustomer.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Buka di Google Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Schedule Info */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-base">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Jadwal
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium text-gray-600">Tanggal:</span> {
                      modalCustomer?.items && modalCustomer?.items.length > 0 && modalCustomer?.items[0].delivery_date ?
                        format(new Date(modalCustomer.items[0].delivery_date), "dd MMM yyyy", { locale: id }) :
                        'Belum dijadwalkan'
                    }
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Waktu:</span> {
                      modalCustomer?.requestTime && !isNaN(new Date(modalCustomer.requestTime)) ?
                        format(new Date(modalCustomer.requestTime), "HH:mm", { locale: id }) :
                        'Belum dijadwalkan'
                    }
                  </p>
                </div>
              </div>

              {/* Items Detail */}
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-base">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Detail Item ({modalItems.length})
                </h3>
                <div className="space-y-2">
                  {modalItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">
                            {idx + 1}. {item.brand || item.item?.brand || 'Brand tidak tersedia'}
                          </p>
                          {item.treatment_name || item.treatment?.name ? (
                            <p className="text-sm text-gray-600 mt-1">
                              Treatment: {item.treatment_name || item.treatment?.name}
                            </p>
                          ) : null}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {formatOrderDetailStatus(item.status || item.delivery_status || '-')}
                        </span>
                      </div>

                      {/* Foto Item */}
                      {item.shoes_photos && item.shoes_photos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1.5 font-medium">Foto Item:</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {item.shoes_photos.map((photo, photoIdx) => (
                              <div key={photo.id || photoIdx} className="flex-shrink-0">
                                <img
                                  src={photo.url_photo}
                                  alt={`Item ${idx + 1} - Foto ${photoIdx + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                                  onClick={() => handleOpenPhotoGallery(item.shoes_photos, photoIdx)}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.delivery_date && (
                        <div className="mt-2 p-2 bg-white rounded border-l-2 border-blue-300">
                          <p className="text-sm text-blue-600">
                            <span className="font-medium">Delivery:</span> {format(new Date(item.delivery_date), "dd MMM yyyy", { locale: id })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <div className="flex gap-2">
                <AnimatedButton
                  onClick={async () => {
                    const message = await getWhatsAppMessage(type);
                    handleWhatsApp(modalCustomer?.phone, message);
                  }}
                  className="flex-1 py-2.5 rounded-lg flex items-center justify-center text-white bg-[#25D366] hover:bg-[#1ebe57] transition-colors text-sm font-semibold"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.77 0-3.5-.46-5.01-1.33l-.36-.21-3.69.97.99-3.59-.23-.37A9.94 9.94 0 0 1 2 12C2 6.48 6.48 2 12 2c2.55 0 4.95.99 6.76 2.8A9.54 9.54 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 5.01 4.23.7.24 1.25.38 1.68.49.71.18 1.36.15 1.87.09.57-.07 1.75-.72 2-1.41.25-.69.25-1.28.18-1.41-.07-.13-.25-.2-.53-.34z" />
                  </svg>
                  WhatsApp
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 rounded-lg flex items-center justify-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Tutup
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />
    </div>
  );
};

export default AntrianKurirContent;
