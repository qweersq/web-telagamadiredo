import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { History } from "lucide-react";
import instance from "../../config/api";
import AntrianHeaderV2 from "../../components/Header Antrian/AntrianHeaderV2";
import LoadingDots from "../../components/Design/LoadingDots";
import AnimatedButton from "../../components/Design/AnimatedButton";
import QualityCheckModal from "../../components/Modal/QualityCheckModal";
import UploadPhotoModal from '../../components/Modal/UploadPhotoModal';
import PhotoHistoryModal from '../../components/Modal/PhotoHistoryModal';
import QCHistoryModal from "../../components/Modal/QCHistoryModal";
import { getUserProfile } from "../../utils/userProfileHelper";
import { saveFilterToStorage, getFilterFromStorage, clearFilterFromStorage, FILTER_TYPES, COMPONENT_NAMES } from "../../utils/filterStorage";
import { formatOrderDetailStatus } from "../../utils/labelFormatter";
import useOrderAlert from "../../hooks/useOrderAlert";
import OrderSoundToggle from "../../components/Notification/OrderSoundToggle";
import OrderAlertStack from "../../components/Notification/OrderAlertStack";

const AntrianKasir = () => {
  const { treatment } = useParams();
  const location = useLocation();
  const { dateRange } = location.state || {};
  const navigate = useNavigate();

  // Redirect to regular if no treatment specified
  useEffect(() => {
    if (!treatment) {
      navigate('/berandakasir/antriankasir/all', {
        state: { dateRange },
        replace: true
      });
    }
  }, [treatment, navigate, dateRange]);

  const [antrianData, setAntrianData] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPhotoHistory, setShowPhotoHistory] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sortBy, setSortBy] = useState('due_date_asc');


  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Handler untuk search
  const handleSearch = async () => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Reset pagination when search is triggered
      setCurrentPage(1);
      setHasNextPage(false);
      await fetchAntrianData();
    }
  };
  const [showQCModal, setShowQCModal] = useState(false);
  const [selectedQCType, setSelectedQCType] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [notifModal, setNotifModal] = useState({ open: false, message: "" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState(null);
  const [qcType, setQcType] = useState(null);
  const [qcDataItem, setQcDataItem] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Helper function untuk mendapatkan userData dari API
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;

      // Extract data yang dibutuhkan dari profile
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        branch_address: profile.branch?.address,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };

      return userData;
    } catch (error) {
      console.error('[ERROR] AntrianKasir - Failed to get userData from API:', error);
      return null;
    }
  };


  // Fungsi untuk mengambil data antrian dari API
  const fetchAntrianData = async (isLoadMore = false, overridePageSize = null, overridePage = null) => {
    try {

      // Set loading state
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }

      const userData = await getUserData();

      const formattedStartDate = formatDateForDB(dateRange.startDate);
      const formattedEndDate = formatDateForDB(dateRange.endDate);

      // Build filterObj sesuai backend (range pakai gte/lte, single pakai string)
      let filterObj = {};
      if (formattedStartDate === formattedEndDate) {
        filterObj.entry_date = formattedStartDate;
      } else {
        filterObj.entry_date = { gte: formattedStartDate, lte: formattedEndDate };
      }
      // Status untuk kasir: 
      // 1. PILIHAN LOLOS/TIDAK LOLOS: pengeringan
      // 2. PILIHAN DIANTAR/DIAMBIL DITOKO: siap
      // 3. SUDAH DIAMBIL: siap_diambil
      filterObj["order_details.status"] = ["pengeringan", "siap", "siap_diambil"];

      // Add search parameter if search query exists
      if (searchQuery && searchQuery.trim()) {
        filterObj.search = searchQuery.trim();
      }

      const params = {
        page: overridePage !== null ? overridePage : (isLoadMore ? currentPage + 1 : currentPage),
        pageSize: overridePageSize || 20,
        filter: JSON.stringify(filterObj),
      };

      // Add tenant_id and branch_id for data isolation
      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get('/orders-new-raw', { params });

      if (response.data && response.data.data && Array.isArray(response.data.data.orders)) {
        const ordersArray = response.data.data.orders;
        // Flatten order_details into a single array of treatments
        const allTreatments = ordersArray.flatMap((order) => {
          const orderDetails = Array.isArray(order?.order_details)
            ? order.order_details
            : [];
          return orderDetails.map((detail) => ({ ...detail, order: order }));
        });

        // Filter by selected treatment name (status sudah di-backend)
        let filteredByTreatment = allTreatments;

        if (treatment && treatment !== 'semua') {
          // Convert treatment parameter back to original name
          const treatmentName = treatment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          filteredByTreatment = allTreatments.filter((item) =>
            item.treatment?.name === treatmentName
          );
        } else {
          // If treatment is 'semua' or not specified, show all treatments
        }


        // Handle pagination data
        const pagination = response.data.data.pagination;
        setHasNextPage(pagination.currentPage < pagination.totalPages);

        if (isLoadMore) {
          // Append new data to existing data
          setAntrianData(prev => [...prev, ...filteredByTreatment]);
          setCurrentPage(prev => prev + 1);
        } else {
          // Replace data for initial load or filter change
          setAntrianData(filteredByTreatment);
          setCurrentPage(1);
        }
      } else {
        if (!isLoadMore) {
          setAntrianData([]);
        }
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Error fetching cashier orders:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      if (!isLoadMore) {
        setAntrianData([]);
      }
      setHasNextPage(false);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fungsi untuk load more data
  const loadMoreData = async () => {
    if (!hasNextPage || isLoadingMore) return;
    await fetchAntrianData(true);
  };

  // Effect untuk memanggil fetchAntrianData
  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Reset pagination when date range or treatment changes
      setCurrentPage(1);
      setHasNextPage(false);
      fetchAntrianData();
    }
  }, [dateRange, treatment]);

  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;
    setCurrentPage(1);
    setHasNextPage(false);
    setAntrianData([]);
    fetchAntrianData(false, 1000, 1);
  }, [sortBy]);

  // Load saved search filter on component mount
  useEffect(() => {
    const savedSearch = getFilterFromStorage(COMPONENT_NAMES.ANTRIAN_KASIR, FILTER_TYPES.SEARCH);
    if (savedSearch) {
      setSearchQuery(savedSearch);
    }
  }, []);

  // Save/clear search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      saveFilterToStorage(COMPONENT_NAMES.ANTRIAN_KASIR, FILTER_TYPES.SEARCH, searchQuery, 24);
    } else {
      clearFilterFromStorage(COMPONENT_NAMES.ANTRIAN_KASIR, FILTER_TYPES.SEARCH);
    }
  }, [searchQuery]);


  // Notifikasi realtime pesanan masuk (bel + kartu ringkasan).
  const { connected: notifConnected, toasts, dismissToast } = useOrderAlert({
    enabled: Boolean(dateRange?.startDate && dateRange?.endDate),
    onRefresh: () => {
      setCurrentPage(1);
      setHasNextPage(false);
      fetchAntrianData();
    },
  });

  const getThumbnailUrl = (originalUrl) => {
    // Jika menggunakan Cloudinary
    if (originalUrl.includes("cloudinary")) {
      return originalUrl.replace("/upload/", "/upload/w_200,h_200,c_fill/");
    }
    // Jika menggunakan ImageKit
    if (originalUrl.includes("imagekit")) {
      return originalUrl + "?tr=w-200,h-200";
    }
    // Jika tidak menggunakan CDN, gunakan URL original
    return originalUrl;
  };

  const handleStatusUpdate = async (id, status) => {
    setSelectedItemId(id);
    setSelectedQCType(status);
    setShowQCModal(true);
  };

  // Handler tombol Lolos
  const handleLolosClick = (item) => {
    setSelectedOrderDetailId(item.id);
    setQcDataItem(item);
    setQcType('siap');
    // Simpan qcType ke window object untuk diakses di UploadPhotoModal
    window.qcType = 'siap';
    setShowUploadModal(true);
  };

  // Handler tombol Tidak Lolos
  const handleTidakLolosClick = (item) => {
    setSelectedOrderDetailId(item.id);
    setQcDataItem(item);
    setQcType('not_yet');
    // Simpan qcType ke window object untuk diakses di UploadPhotoModal
    window.qcType = 'not_yet';
    setShowUploadModal(true);
  };

  // Handler setelah upload foto sukses (tambahkan branch untuk not_lolos)
  const handlePhotoUploaded = async (photoUrls) => {
    setShowUploadModal(false);
    try {
      const userData = await getUserData();
      const updated_by = userData?.id;
      const old_status = qcDataItem?.status || 'pengeringan';
      let new_status = '';
      if (qcType === 'not_yet') {
        new_status = 'not_ready'; // Tidak lolos QC, masuk ke teknisi
      } else {
        new_status = 'siap'; // Lolos QC, siap untuk dipilih diantar/diambil
      }
      const payload = {
        old_status,
        new_status,
        updated_by,
        photos: photoUrls,
      };
      await instance.post(`/order-detail-process/${selectedOrderDetailId}`, payload);
      if (qcType === 'not_yet') {
        fetchAntrianData();
        setNotifModal({ open: true, message: 'Status item diubah ke antrian (tidak lolos QC).' });
      } else {
        fetchAntrianData();
        setNotifModal({ open: true, message: 'Status item diubah ke siap. Silakan pilih metode pengambilan.' });
        setShowQCModal(true);
      }
      // Bersihkan window.qcType
      delete window.qcType;
    } catch (error) {
      alert('Gagal upload foto atau update status.');
    }
  };

  // Handler submit QC
  const handleQCSubmit = async (qcPayload) => {
    try {
      if (!qcDataItem || !qcDataItem.id) {
        setNotifModal({ open: true, message: 'ID order detail tidak ditemukan.' });
        return;
      }
      const updateData = qcPayload;
      await instance.put(`/order-details/${qcDataItem.id}`, updateData);
      fetchAntrianData();
      setNotifModal({
        open: true,
        message: `Status item diperbarui menjadi ${formatOrderDetailStatus(qcPayload.status)}`,
      });
      setShowQCModal(false);
      setQcType(null);
      setQcDataItem(null);
    } catch (error) {
      console.error('Error processing QC:', error);
      setNotifModal({ open: true, message: 'Error updating status.' });
    }
  };

  // Handler untuk tombol Sudah Diambil
  const handleSudahDiambil = async (item) => {
    try {
      await instance.put(`/order-details/${item.id}`, {
        status: 'done',
        delivery_status: 'delivered'
      });
      setNotifModal({ open: true, message: 'Status item diperbarui menjadi done.' });
      fetchAntrianData();
    } catch (error) {
      setNotifModal({ open: true, message: 'Gagal update status item.' });
    }
  };

  const handleOpenQueue = () => {
    // Konversi format treatment jika diperlukan
    const treatmentFormat = treatment; // treatment sudah sesuai dari useParams

    navigate(`/berandakasir/antriankasir/${treatmentFormat}`, {
      state: {
        dateRange,
        treatment: treatmentFormat,
      },
    });
  };

  // Handler untuk UploadPhotoModal: send manual
  const handleSendManual = () => {
    setShowUploadModal(false);
  };

  // Handler untuk UploadPhotoModal: send auto
  const handleSendAuto = async (type) => {
    // Ambil data customer, order, item dari qcDataItem
    if (!qcDataItem) return setNotifModal({ open: true, message: 'Data item tidak ditemukan.' });

    // Get user data untuk branch_id dan tenant_id
    const userData = getUserData();
    const branch_id = userData?.branch_id;
    const tenant_id = userData?.tenant_id;

    if (!branch_id) {
      return setNotifModal({ open: true, message: 'Branch ID tidak ditemukan. Silakan login ulang.' });
    }

    if (!tenant_id) {
      return setNotifModal({ open: true, message: 'Tenant ID tidak ditemukan. Silakan login ulang.' });
    }

    const customerName = qcDataItem.order?.customer?.name || '';
    const orderNumber = qcDataItem.order?.payment?.code || qcDataItem.order?.code || qcDataItem.order?.id || '';
    const customerPhone = qcDataItem.order?.customer?.phone || '';
    const itemName = `${qcDataItem.item?.name} dengan layanan ${qcDataItem.treatment?.name}`;

    // Tampilkan pilihan: semua atau sebagian
    // const type = window.prompt('Kirim notifikasi untuk SEMUA item selesai (ketik: semua) atau hanya item ini saja (ketik: sebagian)?', 'semua');
    if (!type) return;
    setShowUploadModal(false);
    try {
      let res;
      if (type.toLowerCase() === 'semua') {
        res = await instance.post('/wa-automation/notify-item-done-all', {
          customerName,
          orderNumber,
          customerPhone,
          branch_id,
          tenant_id
        });
      } else {
        res = await instance.post('/wa-automation/notify-item-done', {
          customerName,
          orderNumber,
          customerPhone,
          itemName,
          branch_id,
          tenant_id
        });
      }
      if (res.data && res.data.success) {
        setNotifModal({ open: true, message: 'Notifikasi WA berhasil dikirim ke customer.' });
      } else {
        setNotifModal({ open: true, message: 'Gagal mengirim notifikasi WA.' });
      }
    } catch (err) {
      setNotifModal({ open: true, message: 'Gagal mengirim notifikasi WA.' });
    }
  };

  const getSortedData = () => {
    return [...antrianData].sort((a, b) => {
      switch (sortBy) {
        case 'due_date_asc':
          return new Date(a.due_date) - new Date(b.due_date);
        case 'due_date_desc':
          return new Date(b.due_date) - new Date(a.due_date);
        case 'entry_date_asc':
          return new Date(a.order?.entry_date) - new Date(b.order?.entry_date);
        case 'entry_date_desc':
          return new Date(b.order?.entry_date) - new Date(a.order?.entry_date);
        default:
          return new Date(a.due_date) - new Date(b.due_date);
      }
    });
  };


  return (
    <div className="h-screen overflow-y-auto font-montserrat">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white">
        <AntrianHeaderV2
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rightAction={
            <div className="flex items-center gap-1.5">
              {notifConnected && (
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                  title="Notifikasi realtime aktif"
                />
              )}
              <OrderSoundToggle />
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-semibold text-[#2563EB] hover:bg-blue-100 transition-colors"
                title="Riwayat QC"
              >
                <History className="w-3.5 h-3.5" />
                Riwayat
              </button>
            </div>
          }
        />
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 md:px-10 pt-[150px] pb-24 h-[100dvh] overflow-y-auto">
        <div className="max-w-[390px] md:max-w-none mx-auto">
          {/* Initial Loading */}
          {isInitialLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          )}

          {/* Sort Bar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500 font-montserrat font-medium">Urutkan:</span>
            {[
              { value: 'due_date_asc',    label: 'Tgl Selesai ↑' },
              { value: 'due_date_desc',   label: 'Tgl Selesai ↓' },
              { value: 'entry_date_asc',  label: 'Tgl Masuk ↑' },
              { value: 'entry_date_desc', label: 'Tgl Masuk ↓' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold font-montserrat transition-all ${
                  sortBy === opt.value
                    ? 'bg-[#2E7CF6] text-white'
                    : 'bg-[#E6EFF9] text-[#2E7CF6] hover:bg-[#65B7FF] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {antrianData.length > 0 ? (
              getSortedData().map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative"
                  >
                    {/* Badge status untuk QC dan Gagal Kirim */}
                    {item.delivery_status === "failed" ? (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Gagal Kirim
                      </div>
                    ) : (
                      item.status === "siap" && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Lolos QC
                        </div>
                      )
                    )}
                    {/* Badge status untuk Antrian Pengiriman */}
                    {item.status === "siap_dikirim" && (
                      <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Antrian Pengiriman
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className="w-[100px] h-[100px] min-w-[100px] bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedOrderDetail(item);
                          setShowPhotoHistory(true);
                        }}
                      >
                        {imageLoading && <LoadingDots />}
                        {item.shoes_photos && item.shoes_photos.length > 0 ? (
                          <img
                            src={getThumbnailUrl(item.shoes_photos[0].url_photo)}
                            alt="Shoes"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onLoad={() => setImageLoading(false)}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              Tidak ada gambar
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate font-montserrat">
                          {item.order?.customer?.name || "No Name"}
                        </p>
                        {/* Droppoint Badge */}
                        {item.order?.branch_type === 'mitra' && item.order?.branch_name && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-300 rounded-full bg-purple-50 truncate max-w-full">
                            📍 {item.order.branch_name}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 truncate font-montserrat mt-0.5">
                          {item.item?.brand || "No Item"} (
                          {item.treatment?.name || "No Treatment"})
                        </p>
                        {/* Custom Price Reason */}
                        {item.custom_price_reason && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-1.5">
                            <p className="text-[10px] md:text-xs font-semibold text-blue-600 mb-0.5">Ket. Penyesuaian Harga</p>
                            <p className="text-[10px] md:text-xs text-gray-700 line-clamp-2">{item.custom_price_reason}</p>
                          </div>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2 text-[#AA3328]">
                          {item.description}
                        </p>
                        
                        {/* Date labels */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                            <span className="text-[9px] text-gray-400 font-montserrat font-medium">Masuk</span>
                            <span className="text-[10px] text-gray-600 font-montserrat font-bold">
                              {item.order?.entry_date
                                ? format(new Date(item.order.entry_date + 'T00:00:00'), 'dd MMM yyyy', { locale: id })
                                : '-'}
                            </span>
                          </span>
                          <span className="text-gray-300 text-xs">→</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                            new Date(item.due_date) < new Date()
                              ? 'bg-red-50 border-red-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}>
                            <span className="text-[9px] text-gray-400 font-montserrat font-medium">Selesai</span>
                            <span className={`text-[10px] font-montserrat font-bold ${
                              new Date(item.due_date) < new Date() ? 'text-red-500' : 'text-blue-600'
                            }`}>
                              {item.due_date
                                ? format(new Date(item.due_date), 'dd MMM yyyy', { locale: id })
                                : '-'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Footer with Info Button + Action Buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      {/* Info Button - Always Visible */}
                      <button
                        onClick={() => {
                          setSelectedOrderDetail(item);
                          setShowPhotoHistory(true);
                        }}
                        className="h-[35px] px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
                        title="Lihat riwayat foto"
                      >
                        <History className="w-4 h-4" />
                        <span>Detail</span>
                      </button>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-1">
                        {item.status === 'pengeringan' && (<>
                          <AnimatedButton
                            onClick={() => handleTidakLolosClick(item)}
                            className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#FFEEEE] text-[#E55050] hover:bg-red-50"
                          >
                            Tidak Lolos
                          </AnimatedButton>
                          <AnimatedButton
                            onClick={() => handleLolosClick(item)}
                            className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] hover:bg-blue-50"
                          >
                            Lolos
                          </AnimatedButton>
                        </>)}
                        {item.status === "siap" && (<>
                          <AnimatedButton
                            variant={"blue"}
                            onClick={() => {
                              setQcDataItem(item);
                              setShowQCModal(true);
                            }}
                            className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Pilih Pengiriman
                          </AnimatedButton>
                        </>)}
                        {item.status === "siap_diambil" && (<>
                          <AnimatedButton
                            variant={"blue"}
                            onClick={() => {
                              setQcDataItem(item);
                              setShowQCModal(true);
                            }}
                            className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600"
                          >
                            Opsi Lain
                          </AnimatedButton>
                          <AnimatedButton
                            variant={"green"}
                            onClick={() => handleSudahDiambil(item)}
                            className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-green-500 text-white hover:bg-green-600"
                          >
                            Selesai
                          </AnimatedButton>
                        </>)}
                      </div>
                    </div>
                  </div>
                )
              })

            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery.trim() !== ""
                  ? "Tidak ada item yang cocok dengan pencarian Anda"
                  : "Tidak ada antrian yang perlu dicek"}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasNextPage && !isInitialLoading && sortBy === 'due_date_asc' && (
            <div className="flex justify-center mt-6">
              <AnimatedButton
                onClick={loadMoreData}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memuat...
                  </div>
                ) : (
                  "Load More"
                )}
              </AnimatedButton>
            </div>
          )}
        </div>
      </main>

      {/* Photo History Modal */}
      <PhotoHistoryModal
        isOpen={showPhotoHistory}
        onClose={() => {
          setShowPhotoHistory(false);
          setSelectedOrderDetail(null);
        }}
        orderDetail={selectedOrderDetail}
      />

      {/* Quality Check Modal */}
      <QualityCheckModal
        isOpen={showQCModal}
        onClose={() => {
          setShowQCModal(false);
          setSelectedQCType(null);
          setSelectedItemId(null);
        }}
        type={qcType}
        onSubmit={handleQCSubmit}
        dataItem={qcDataItem}
      />

      {/* Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handlePhotoUploaded}
        onSendAuto={handleSendAuto}
        onSendManual={handleSendManual}
        status="siap"
      />

      {/* Riwayat QC Modal */}
      <QCHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        dateRange={dateRange}
      />

      {/* Notifikasi Modal */}
      {notifModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs text-center">
            <div className="text-[#2E7CF6] font-bold text-lg mb-2">
              Notifikasi
            </div>
            <div className="text-gray-700 mb-4">{notifModal.message}</div>
            <button
              className="px-6 py-2 bg-[#2E7CF6] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => setNotifModal({ open: false, message: "" })}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[201] px-4 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full font-montserrat flex flex-col items-center">
            <h3 className="text-lg font-montserrat text-blue-700 mb-2">Kirim Pesan ke Customer?</h3>
            <p className="text-sm text-gray-700 mb-4 text-center">Item sudah selesai. Ingin kirim pesan WhatsApp otomatis ke customer?</p>
            <div className="flex flex-col gap-2 w-full mt-2">
              <AnimatedButton
                onClick={() => {
                  setShowSendModal(false);
                  handleSendAuto('semua');
                }}
                variant="blue"
                className="w-full py-2"
              >Kabari Semua Selesai</AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowSendModal(false);
                  handleSendAuto('sebagian');
                }}
                variant="blue"
                className="w-full py-2"
              >Kabari Item Ini Saja</AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowSendModal(false);
                  handleSendManual();
                }}
                variant="grey"
                className="w-full py-2"
              >Nanti Saja</AnimatedButton>
            </div>
          </div>
        </div>
      )}
      {/* Notifikasi pesanan masuk (realtime) */}
      <OrderAlertStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AntrianKasir;
