import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../config/api";
import dayjs from 'dayjs';
import PhotoGalleryModal from '../../components/Modal/PhotoGalleryModal';
import { getUserProfile, getActiveShiftId } from "../../utils/userProfileHelper";
import Header from "../../components/Com Header/Header";
import BreakTimeAlert from "../../components/BreakTimeAlert";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import InfoModal from "../../components/Modal/InfoModal";
import AnimatedButton from "../../components/Design/AnimatedButton";
import DateRangePickerV2 from "../../components/DateRangePicker/DateRangePickerV2";
import OpenShiftModal from './SHIFT/OpenShiftModal';
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES
} from "../../utils/filterStorage";

const BerandaQC = () => {
  const navigate = useNavigate();
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [topTreatments, setTopTreatments] = useState([]);
  const [totalAntrian, setTotalAntrian] = useState(0);
  const [showAllTreatments, setShowAllTreatments] = useState(false);
  const [displayedTreatments, setDisplayedTreatments] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    // Load saved date range from filter storage
    const savedRange = getFilterFromStorage(COMPONENT_NAMES.BERANDA_QC, FILTER_TYPES.DATE_FILTER);
    if (savedRange) {
      return savedRange;
    }
    // Fallback to localStorage for backward compatibility
    const localSavedRange = localStorage.getItem("dateRange");
    if (localSavedRange) {
      return JSON.parse(localSavedRange);
    }
    const today = new Date().toISOString().split("T")[0];
    return {
      startDate: today,
      endDate: today,
    };
  });
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchRoleModal, setShowSwitchRoleModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  const [isFromPresent, setIsFromPresent] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);
  const [showShiftValidationModal, setShowShiftValidationModal] = useState(false);

  const [selectedQCTreatment, setSelectedQCTreatment] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

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
      console.error('[ERROR] BerandaQC - Failed to get userData from API:', error);
      return null;
    }
  };

  // Fungsi untuk mengambil data antrian dari API dan menghitung jumlahnya
  const fetchAntrianCounts = async (range) => {
    try {
      const userData = await getUserData();

      // Format tanggal ke YYYY-MM-DD
      const startDate = formatDateForDB(range.startDate);
      const endDate = formatDateForDB(range.endDate);

      // Build filterObj sesuai backend (range pakai gte/lte, single pakai string)
      let filterObj = {};
      if (startDate === endDate) {
        filterObj.entry_date = startDate;
      } else {
        filterObj.entry_date = { gte: startDate, lte: endDate };
      }
      // Status untuk kasir: 
      // 1. PILIHAN LOLOS/TIDAK LOLOS: pengeringan
      // 2. PILIHAN DIANTAR/DIAMBIL DITOKO: siap
      // 3. SUDAH DIAMBIL: siap_diambil
      filterObj["order_details.status"] = ["pengeringan", "siap", "siap_diambil"];

      const params = {
        page: 1,
        pageSize: 1000,
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
        setFetchedOrders(ordersArray);
      } else {
        setFetchedOrders([]);
      }
    } catch (error) {
      console.error("Error fetching QC data:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      setFetchedOrders([]);
    }
  };

  // Handle perubahan input tanggal
  const handleDateInputChange = async (e) => {
    const { name, value } = e.target;
    const formattedValue = formatDateForDB(value);

    const newRange = {
      ...dateRange,
      [name]: formattedValue,
    };

    if (name === "startDate" && formattedValue > dateRange.endDate) {
      newRange.endDate = formattedValue;
    } else if (name === "endDate" && formattedValue < dateRange.startDate) {
      newRange.startDate = formattedValue;
    }

    setDateRange(newRange);

    // Save to filter storage
    saveFilterToStorage(
      COMPONENT_NAMES.BERANDA_QC,
      FILTER_TYPES.DATE_FILTER,
      newRange,
      24 // 24 hours expiration
    );

    // Also save to localStorage for backward compatibility
    localStorage.setItem("dateRange", JSON.stringify(newRange));
    fetchAntrianCounts(newRange); // Panggil fetchAntrianCounts saat tanggal berubah
  };

  useEffect(() => {
    // Panggil fetchAntrianCounts saat komponen pertama kali dimuat atau dateRange berubah
    fetchAntrianCounts(dateRange);

    // Cek present seperti sebelumnya
    const fromPresent = sessionStorage.getItem("fromPresent");
    if (fromPresent === "true") setIsFromPresent(true);
  }, [dateRange]); // Tambahkan dateRange sebagai dependency

  // New useEffect to process fetchedOrders and update counts
  useEffect(() => {
    if (fetchedOrders.length > 0) {
      const allTreatments = fetchedOrders.flatMap((order) => {
        const orderDetails = Array.isArray(order?.order_details)
          ? order.order_details
          : [];
        return orderDetails.map((detail) => ({ ...detail, order: order }));
      });

      // Hitung jumlah per treatment
      const treatmentCounts = {};
      allTreatments.forEach((item) => {
        const treatmentName = item.treatment?.name || 'Unknown Treatment';
        if (treatmentCounts[treatmentName]) {
          treatmentCounts[treatmentName]++;
        } else {
          treatmentCounts[treatmentName] = 1;
        }
      });

      // Convert ke array dan sort berdasarkan jumlah (descending)
      const sortedTreatments = Object.entries(treatmentCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setTopTreatments(sortedTreatments);
      setTotalAntrian(allTreatments.length);
    } else {
      setTopTreatments([]);
      setTotalAntrian(0);
    }
  }, [fetchedOrders]); // Depend on fetchedOrders to re-calculate counts

  // Update displayed treatments based on showAllTreatments state
  useEffect(() => {

    if (showAllTreatments) {
      setDisplayedTreatments(topTreatments);
    } else {
      setDisplayedTreatments(topTreatments.slice(0, 5));
    }
  }, [topTreatments, showAllTreatments]);

  const handleLogoutConfirm = () => {
    // Implementasi log out
  };

  const handleSwitchRoleConfirm = () => {
    // Implementasi switch role
  };

  // Validasi shift sebelum navigasi ke quick order
  const handleTambahPesananClick = async () => {
    try {
      const activeShiftId = await getActiveShiftId();
      if (!activeShiftId) {
        setShowShiftValidationModal(true);
        return;
      }
      // Jika shift aktif, lanjutkan navigasi
      navigate('/quick-order');
    } catch (error) {
      console.error('❌ BerandaKasir - Error checking active shift:', error);
      setShowShiftValidationModal(true);
    }
  };

  const handleOpenQueue = (treatmentName) => {
    // Gunakan treatmentName sebagai filter untuk navigasi
    const treatmentFormat = treatmentName.toLowerCase().replace(/\s+/g, '_');

    navigate(`/berandakasir/antriankasir/${treatmentFormat}`, {
      state: {
        dateRange,
        treatment: treatmentFormat,
      },
    });
  };

  const QC_STATUSES = ['pengeringan', 'siap', 'siap_diambil', 'siap_dikirim'];

  const handleQCTreatmentClick = (treatmentName) => {
    console.log('🔘 QC Treatment Clicked:', treatmentName);
    if (!fetchedOrders || !Array.isArray(fetchedOrders)) {
      console.log('⚠️ No fetched orders available');
      return;
    }

    const items = [];
    fetchedOrders.forEach(order => {
      const matchingDetails = (order.order_details || []).filter(
        d => d.treatment?.name === treatmentName && QC_STATUSES.includes(d.status)
      );
      if (matchingDetails.length > 0) {
        items.push({
          orderId: order.id,
          customerName: order.customer?.name || 'Unknown',
          customerPhone: order.customer?.phone || '',
          entryDate: order.entry_date || null,
          dueDate: matchingDetails[0]?.due_date || null,
          details: matchingDetails.map(d => ({
            id: d.id,
            status: d.status,
            processTime: d.process_time,
            photos: Array.isArray(d.shoes_photos)
              ? d.shoes_photos.filter(p => p?.url_photo)
              : []
          }))
        });
      }
    });

    console.log(`📊 Found ${items.length} items for ${treatmentName}`);
    setSelectedQCTreatment({ name: treatmentName, items });
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <Header
        // title="CASHIER DASHBOARD"
        showLogoutButton={true}
        onLogoutClick={() => setShowLogoutModal(true)}
        showSwitchRole={true}
        onSwitchRoleClick={() => setShowSwitchRoleModal(true)}
        currentTime={currentTime}
      />

      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Date Range Picker */}
            <DateRangePickerV2
              dateRange={dateRange}
              setDateRange={setDateRange}
              onDateChange={(newRange) => {
                setDateRange(newRange);

                // Save to filter storage
                saveFilterToStorage(
                  COMPONENT_NAMES.BERANDA_QC,
                  FILTER_TYPES.DATE_FILTER,
                  newRange,
                  24 // 24 hours expiration
                );

                // Also save to localStorage for backward compatibility
                localStorage.setItem("dateRange", JSON.stringify(newRange));
              }}
            />

            {/* Quality Check Queue Details Card */}
            <div className="mb-2 rounded-3xl p-4 mt-4 outline outline-2 outline-[#EEF1F7]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold font-montserrat">
                    Cek Item
                  </h2>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="group relative"
                    title="Informasi tentang antrian ini"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={() => navigate('/berandaqc/history', {
                      state: { dateRange }
                    })}
                    className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gradient-to-r from-[#34D399] to-[#10B981] text-white hover:from-[#22D19A] hover:to-[#0D9A70] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Riwayat
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => navigate('/berandakasir/antriankasir/semua', {
                      state: { dateRange }
                    })}
                    className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white hover:from-[#4088EB] hover:to-[#6BC1ED] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Antrian
                  </AnimatedButton>
                </div>
              </div>

              {/* Treatments */}
              <div className="space-y-3 mb-4">
                {displayedTreatments.length > 0 ? (
                  displayedTreatments.map((treatment, index) => (
                    <div
                      key={treatment.name}
                      className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                      onClick={() => handleQCTreatmentClick(treatment.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm font-['Montserrat']">
                            {treatment.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-['Montserrat']">
                            {treatment.count} antrian
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold font-bold text-blue-600 font-['Montserrat']">
                          {treatment.count}
                        </p>
                        <p className="text-xs text-gray-400 font-['Montserrat']">
                          items
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 font-['Montserrat']">
                    <p>Tidak ada treatment yang perlu dicek</p>
                  </div>
                )}
              </div>

              {/* Load More Button */}
              {topTreatments.length > 5 && (
                <div className="mb-4">
                  <AnimatedButton
                    onClick={() => setShowAllTreatments(!showAllTreatments)}
                    className="w-full h-[35px] py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  >
                    {showAllTreatments ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua (${topTreatments.length})`}
                  </AnimatedButton>
                </div>
              )}

              {/* Total antrian */}
              <div className="mt-4 text-center outline outline-2 outline-[#EEF1F7] rounded-3xl p-3">
                <p className="text-sm text-gray-600 font-['Montserrat']">
                  Total Antrian: <span className="font-bold text-blue-600">{totalAntrian}</span>
                </p>
              </div>

            </div>


          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to logout? Logging out is recommended when work hours are finished."
      />

      <ConfirmationModal
        isOpen={showSwitchRoleModal}
        onClose={() => setShowSwitchRoleModal(false)}
        onConfirm={handleSwitchRoleConfirm}
        title="Switch Role Confirmation"
        message="Are you sure you want to switch to courier page?"
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Item yang Perlu Dicek"
        items={[
          {
            title: "Status Pengeringan",
            description: "Item yang sudah selesai dicuci dan masih dalam proses pengeringan",
            bgColor: "bg-yellow-50",
            dotColor: "bg-yellow-500",
            titleColor: "text-yellow-700"
          },
          {
            title: "Status Siap",
            description: "Item yang sudah siap diambil atau diantar",
            bgColor: "bg-blue-50",
            dotColor: "bg-blue-500",
            titleColor: "text-blue-700"
          },
          {
            title: "Status Siap Diambil/Diantar",
            description: "Item yang sudah siap diambil atau diantar",
            bgColor: "bg-green-50",
            dotColor: "bg-green-500",
            titleColor: "text-green-700"
          }
        ]}
        footerInfo={{
          text: "Antrian ini menampilkan item dari status pengeringan ke siap dan bisa dijadwalkan pengantaran (siap_dikirim) atau (siap_diambil)"
        }}
      />

      {/* Modal yang dibuka dari FABMenu */}
      <OpenShiftModal open={showFabModal} onClose={() => setShowFabModal(false)} />

      {/* Shift Validation Modal */}
      <ConfirmationModal
        isOpen={showShiftValidationModal}
        onClose={() => setShowShiftValidationModal(false)}
        onConfirm={() => {
          setShowShiftValidationModal(false);
          setShowFabModal(true);
        }}
        title="Shift Belum Dibuka"
        message="Shift adalah pencatatan kas & transaksi selama jam kerja Anda.

Buka shift dulu sebelum menambah pesanan agar semua pembayaran tercatat dengan benar dalam laporan shift Anda.

Buka shift sekarang?"
        confirmText="Buka Shift"
        cancelText="Nanti Saja"
      />

      {/* QC Treatment Detail Modal */}
      {selectedQCTreatment && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedQCTreatment(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-['Montserrat']">
                  {selectedQCTreatment.name}
                </h3>
                <p className="text-xs text-gray-400 font-['Montserrat'] mt-0.5">
                  {selectedQCTreatment.items.length} customer
                </p>
              </div>
              <button
                onClick={() => setSelectedQCTreatment(null)}
                className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedQCTreatment.items.map((item, idx) => {
                const statusLabels = {
                  pengeringan: { label: 'Pengeringan', color: 'text-orange-600 bg-orange-50' },
                  siap: { label: 'Siap Diambil', color: 'text-green-600 bg-green-50' },
                  siap_diambil: { label: 'Siap Diambil', color: 'text-green-600 bg-green-50' },
                  siap_dikirim: { label: 'Siap Dikirim', color: 'text-blue-600 bg-blue-50' },
                };
                const statusCounts = item.details.reduce((acc, d) => {
                  acc[d.status] = (acc[d.status] || 0) + 1;
                  return acc;
                }, {});
                const dominantStatus = Object.keys(statusCounts).reduce((a, b) =>
                  statusCounts[a] > statusCounts[b] ? a : b
                );
                const statusStyle = statusLabels[dominantStatus] || { label: dominantStatus, color: 'text-gray-500 bg-gray-50' };
                const allPhotos = item.details.flatMap(d => d.photos || []);

                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 font-['Montserrat']">
                          {idx + 1}. {item.customerName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-['Montserrat'] mt-0.5">
                          {item.customerPhone}
                        </p>
                        {/* Date chips */}
                        {(item.entryDate || item.dueDate) && (
                          <div className="flex items-center gap-1.5 mt-1 mb-1 flex-wrap">
                            {item.entryDate && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                                <span className="text-[9px] text-gray-400 font-['Montserrat']">Masuk</span>
                                <span className="text-[10px] text-gray-700 font-['Montserrat'] font-bold">
                                  {dayjs(item.entryDate).format('D MMM YYYY')}
                                </span>
                              </span>
                            )}
                            {item.dueDate && (
                              <>
                                <span className="text-gray-300 text-[10px]">→</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${dayjs(item.dueDate).isBefore(dayjs(), 'day') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                                  }`}>
                                  <span className="text-[9px] text-gray-400 font-['Montserrat']">Selesai</span>
                                  <span className={`text-[10px] font-['Montserrat'] font-bold ${dayjs(item.dueDate).isBefore(dayjs(), 'day') ? 'text-red-500' : 'text-blue-600'
                                    }`}>
                                    {dayjs(item.dueDate).format('D MMM YYYY')}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ml-2 flex-shrink-0 ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Item count */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-['Montserrat']">
                        {item.details.length} item
                      </span>
                    </div>

                    {/* Photo thumbnails */}
                    {allPhotos.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {allPhotos.slice(0, 4).map((photo, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={e => {
                              e.stopPropagation();
                              setGalleryPhotos(allPhotos);
                              setGalleryInitialIndex(pIdx);
                              setShowGallery(true);
                            }}
                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-300 hover:scale-105 transition-all"
                          >
                            <img src={photo.url_photo} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {allPhotos.length > 4 && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setGalleryPhotos(allPhotos);
                              setGalleryInitialIndex(4);
                              setShowGallery(true);
                            }}
                            className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500
  hover:bg-gray-200 transition-all"
                          >
                            +{allPhotos.length - 4}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="h-px bg-gray-50 mt-1" />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedQCTreatment(null)}
                className="w-full py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 font-['Montserrat'] hover:bg-gray-100 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => { setShowGallery(false); setGalleryPhotos([]); }}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />
    </div>
  );
};

export default BerandaQC;
