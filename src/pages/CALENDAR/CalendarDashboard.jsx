import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Settings, Phone, ArrowLeft, FileText, ChevronDown } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import instance from "../../config/api";
import { getUserProfile } from "../../utils/userProfileHelper";
import AnimatedButton from "../../components/Design/AnimatedButton";
import PhotoPopup from "../ORDER/components/PhotoPopup";
import OrderStatusModal from "../ORDER/components/OrderStatusModal";
import {
  formatCurrency,
  formatDate,
  formatOrderDetailStatus,
  getOrderDetailStatusColors,
  formatPaymentStatus,
  getPaymentStatusColors,
  ORDER_DETAIL_STATUS,
  PAYMENT_STATUS
} from "../../utils/labelFormatter";

const CalendarDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("items"); // 'items' atau 'payments'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetails, setDateDetails] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [existingNote, setExistingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  // Order id yang item "lainnya" (due date beda) sedang dibuka.
  // Default tertutup — item lain hanya tampil setelah klik tombol.
  const [expandedOtherItems, setExpandedOtherItems] = useState({});

  // Get user data
  const getUserData = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      return {
        tenant_id: profile.tenant?.id,
        branch_id: profile.branch?.id,
      };
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }, []);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (!userData) return;

      const params = {
        month: currentMonth,
        year: currentYear,
        type: activeTab,
      };

      if (userData.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get("/calendar/summary", { params });
      if (response.data?.success) {
        setSummary(response.data.data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching calendar summary:", error);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, activeTab, getUserData]);

  // Fetch date details
  const fetchDateDetails = useCallback(async (date) => {
    try {
      setLoadingDetails(true);
      const userData = await getUserData();
      if (!userData) return;

      const params = {
        date,
        type: activeTab,
      };

      // Tab "Tanggal Selesai": minta backend ikut mengirim item lain milik
      // order yang sama (due date berbeda). Item due tetap jadi filter order,
      // jadi isi kartu tetap sama kecuali item lain yang kini ikut tersedia.
      if (activeTab === 'items') {
        params.include_other_items = 1;
      }

      if (userData.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get("/calendar/date-details", { params });
      if (response.data?.success) {
        setDateDetails(response.data.data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching date details:", error);
      setDateDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [activeTab, getUserData]);

  // Fetch note untuk tanggal tertentu
  const fetchNote = useCallback(async (date) => {
    try {
      const userData = await getUserData();
      if (!userData) return;
      const params = { date };
      if (userData.branch_id) params.branch_id = userData.branch_id;
      const res = await instance.get('/calendar/note', { params });
      const note = res.data?.data;
      setExistingNote(note);
      setNoteText(note?.note || '');
      if (note) setShowNoteEditor(true);
    } catch {
      setExistingNote(null);
      setNoteText('');
    }
  }, [getUserData]);

  const handleSaveNote = async () => {
    if (!noteText.trim() || !selectedDate) return;
    setSavingNote(true);
    try {
      const userData = await getUserData();
      await instance.put('/calendar/note', {
        date: selectedDate,
        note: noteText.trim(),
        branch_id: userData?.branch_id,
      });
      await fetchNote(selectedDate);
    } catch {
      alert('Gagal menyimpan catatan');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!existingNote || !selectedDate) return;
    setSavingNote(true);
    try {
      const userData = await getUserData();
      const params = { date: selectedDate };
      if (userData?.branch_id) params.branch_id = userData.branch_id;
      await instance.delete('/calendar/note', { params });
      setExistingNote(null);
      setNoteText('');
      setShowNoteEditor(false);
    } catch {
      alert('Gagal menghapus catatan');
    } finally {
      setSavingNote(false);
    }
  };

  // Load summary on mount and when dependencies change
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Fix z-index untuk OrderStatusModal agar muncul di atas Detail Modal
  useEffect(() => {
    if (showStatusModal) {
      // Find all divs with z-40 inside calendar-status-modal-wrapper and override
      const timer = setTimeout(() => {
        const wrapper = document.querySelector('.calendar-status-modal-wrapper');
        if (wrapper) {
          // Override z-40 (OrderStatusModal backdrop)
          const modals = wrapper.querySelectorAll('div[style*="z-40"], div[class*="z-40"]');
          modals.forEach(modal => {
            if (modal.style) {
              modal.style.zIndex = '60';
            }
          });

          // Override z-50 (PhotoPopup) - harus lebih tinggi dari OrderStatusModal
          const photoPopups = wrapper.querySelectorAll('div[class*="z-50"], div[style*="z-50"]');
          photoPopups.forEach(popup => {
            if (popup.style) {
              popup.style.zIndex = '80';
            } else {
              // Jika tidak ada inline style, tambahkan
              popup.style.setProperty('z-index', '80', 'important');
            }
          });
        }
      }, 100);

      // Also check periodically in case PhotoPopup is rendered later
      const interval = setInterval(() => {
        const wrapper = document.querySelector('.calendar-status-modal-wrapper');
        if (wrapper) {
          const photoPopups = wrapper.querySelectorAll('div[class*="z-50"], div[style*="z-50"]');
          photoPopups.forEach(popup => {
            if (popup.style) {
              popup.style.zIndex = '80';
            } else {
              popup.style.setProperty('z-index', '80', 'important');
            }
          });
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [showStatusModal]);

  // Listen for order status updates and refresh data
  useEffect(() => {
    const handleOrderStatusUpdated = async (event) => {
      const { orderId, updatedOrder } = event.detail;

      // Update selectedOrder if it's the same order
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }

      // Update order in dateDetails if modal is open
      if (showDetailModal && dateDetails.length > 0) {
        setDateDetails(prevDetails =>
          prevDetails.map(order =>
            order.id === orderId ? updatedOrder : order
          )
        );
      }

      // Refresh summary to update calendar colors
      await fetchSummary();

      // If detail modal is open, refresh date details to get latest data
      if (showDetailModal && selectedDate) {
        await fetchDateDetails(selectedDate);
      }
    };

    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdated);

    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdated);
    };
  }, [showDetailModal, dateDetails, selectedDate, selectedOrder, fetchSummary, fetchDateDetails]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentMonth, currentYear]);

  // Get date color based on summary
  const getDateColor = useCallback(
    (date) => {
      const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const dateStr = `${currentYear}-${monthStr}-${date < 10 ? `0${date}` : `${date}`}`;
      const data = summary[dateStr];

      if (!data) return "bg-gray-100 border-2 border-gray-400";

      if (activeTab === "items") {
        // Hijau solid: semua done
        if (data.done === data.total_due && data.total_due > 0) {
          return "bg-green-600 border-2 border-green-700 hover:bg-green-700 text-white";
        }
        // Merah maroon solid: ada overdue
        if (data.overdue > 0) {
          return "bg-red-800 border-2 border-red-900 hover:bg-red-900 text-white";
        }
        // Kuning solid: ada pending tapi belum overdue
        if (data.not_done > 0) {
          return "bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 text-white";
        }
      } else {
        // Payments
        // Hijau solid: semua paid
        if (data.paid === data.total_due && data.total_due > 0) {
          return "bg-green-600 border-2 border-green-700 hover:bg-green-700 text-white";
        }
        // Merah maroon solid: ada overdue
        if (data.overdue > 0) {
          return "bg-red-800 border-2 border-red-900 hover:bg-red-900 text-white";
        }
        // Kuning solid: ada unpaid tapi belum overdue
        if (data.unpaid > 0) {
          return "bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 text-white";
        }
      }

      return "bg-gray-100 border-2 border-gray-400 hover:bg-gray-200";
    },
    [summary, activeTab, currentMonth, currentYear]
  );

  // Get date count
  const getDateCount = useCallback(
    (date) => {
      const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const dateStr = `${currentYear}-${monthStr}-${date < 10 ? `0${date}` : `${date}`}`;
      const data = summary[dateStr];
      return data?.total_due || 0;
    },
    [summary, currentMonth, currentYear]
  );

  // Handle date click
  const handleDateClick = useCallback(
    async (date) => {
      const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const dateStr = `${currentYear}-${monthStr}-${date < 10 ? `0${date}` : `${date}`}`;
      setSelectedDate(dateStr);
      setShowDetailModal(true);
      setExistingNote(null);
      setNoteText('');
      setShowNoteEditor(false);
      setExpandedOtherItems({});
      await Promise.all([fetchDateDetails(dateStr), fetchNote(dateStr)]);
    },
    [currentMonth, currentYear, fetchDateDetails, fetchNote]
  );

  // Navigate month
  const navigateMonth = useCallback((direction) => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  }, [currentMonth, currentYear]);

  // Format date for display
  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Get status label - use formatOrderDetailStatus from utils for consistency
  const getStatusLabel = useCallback((status) => {
    return formatOrderDetailStatus(status);
  }, []);

  // Format due date
  const formatDueDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // Get all photos from order
  const getOrderPhotos = useCallback((order) => {
    const photos = [];
    // Get photos from order.photos (if exists)
    if (order.photos && Array.isArray(order.photos)) {
      photos.push(...order.photos);
    }
    // Get photos from order_details shoes_photos
    if (order.order_details && Array.isArray(order.order_details)) {
      order.order_details.forEach(detail => {
        if (detail.shoes_photos && Array.isArray(detail.shoes_photos)) {
          detail.shoes_photos.forEach(photo => {
            if (photo.url_photo) {
              photos.push(photo.url_photo);
            }
          });
        }
      });
    }
    return [...new Set(photos)]; // Remove duplicates
  }, []);

  // Handle photo click
  const handlePhotoClick = useCallback((order, photoIndex) => {
    const photos = getOrderPhotos(order);
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(photoIndex);
    setShowPhotoPopup(true);
  }, [getOrderPhotos]);

  // Handle status modal
  const handleStatusClick = useCallback((e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowStatusModal(true);
  }, []);

  // Buka/tutup daftar "item lainnya" untuk satu order tertentu
  const toggleOtherItems = useCallback((orderId) => {
    setExpandedOtherItems(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  }, []);

  /**
   * Render satu kartu item order.
   * Dipakai untuk item yang due di tanggal terpilih maupun item lainnya
   * (isOther = true, tampil lebih redup + border putus-putus).
   */
  const renderOrderDetailItem = (detail, idx, isOther = false) => {
    const treatmentName = detail.treatment?.name || "Treatment";
    const itemName = detail.item?.name || "Item";
    const itemBrand = detail.item?.brand;
    const fullItemName = itemBrand ? `${itemBrand} ${itemName}` : itemName;
    const statusLabel = detail.status ? getStatusLabel(detail.status) : '';
    const dueDate = detail.due_date ? formatDueDate(detail.due_date) : '';
    const statusColor = detail.status ? getOrderDetailStatusColors(detail.status) : '';
    const itemPhotos = detail.shoes_photos || [];

    return (
      <div
        key={detail.id ?? `detail-${idx}`}
        className={`rounded-lg p-3 border ${isOther
          ? 'bg-gray-50 border-dashed border-gray-300'
          : 'bg-white border-gray-200'
          }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold font-montserrat ${isOther ? 'text-gray-600' : 'text-gray-900'}`}>
              {treatmentName} - {fullItemName}
            </div>
            {statusLabel && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
            )}
            {dueDate && (
              <div className={`text-xs font-montserrat mt-1 ${isOther ? 'text-amber-600' : 'text-gray-500'}`}>
                Estimasi selesai: {dueDate}
              </div>
            )}
          </div>
        </div>

        {/* Item Photos */}
        {itemPhotos.length > 0 && (
          <div className="flex gap-1 mt-2 overflow-x-auto">
            {itemPhotos.slice(0, 3).map((photo, pIdx) => (
              <img
                key={pIdx}
                src={photo.url_photo}
                alt={`Item Photo ${pIdx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const allItemPhotos = itemPhotos.map(p => p.url_photo);
                  setSelectedPhotos(allItemPhotos);
                  setSelectedPhotoIndex(pIdx);
                  setShowPhotoPopup(true);
                }}
                className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              />
            ))}
            {itemPhotos.length > 3 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const allItemPhotos = itemPhotos.map(p => p.url_photo);
                  setSelectedPhotos(allItemPhotos);
                  setSelectedPhotoIndex(3);
                  setShowPhotoPopup(true);
                }}
                className="flex items-center justify-center w-10 h-10 rounded bg-gray-100 text-gray-500 text-xs border border-gray-200 hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                +{itemPhotos.length - 3}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get month name
  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth, currentYear]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth;
    const firstDay = firstDayOfMonth;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  }, [daysInMonth, firstDayOfMonth]);

  // Function untuk menentukan route kembali
  const getBackRoute = () => {
    // Default kembali ke berandakasir
    return '/berandakasir';
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] shadow-sm border-b rounded-b-3xl">
        <div className="flex items-center justify-between px-4 py-4 gap-2">
          {/* Left Side: Back Button + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(getBackRoute())}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white text-blue-600 rounded-full shadow-md border border-blue-200 transition-all duration-200 hover:scale-105 hover:shadow-lg font-montserrat text-sm font-semibold"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold sm:text-3xl font-montserrat text-white tracking-wide drop-shadow-md">
              Calendar
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto">
            {/* Header */}
            <div className="mb-6">

              {/* Tabs */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-1.5 mb-4 shadow-sm">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab("items")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "items"
                      ? "bg-blue-200 text-blue-800 shadow-md border border-blue-300"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeTab === "items" ? "bg-blue-600" : "bg-gray-400"
                        }`}></div>
                      <span className="font-montserrat">Tanggal Selesai</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "payments"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md border border-green-400"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeTab === "payments" ? "bg-white" : "bg-gray-400"
                        }`}></div>
                      <span className="font-montserrat">Tanggal Bayar</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-lg font-bold text-gray-800 font-montserrat capitalize">
                  {monthName}
                </h2>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-500 font-montserrat">Memuat...</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-gray-600 font-montserrat py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const count = getDateCount(day);
                    const colorClass = getDateColor(day);
                    const isToday =
                      day === new Date().getDate() &&
                      currentMonth === new Date().getMonth() + 1 &&
                      currentYear === new Date().getFullYear();

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        className={`aspect-square rounded-lg transition-all flex flex-col items-center justify-center relative ${colorClass} ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""
                          }`}
                      >
                        {/* Tanggal di atas */}
                        <span className="text-base font-bold font-montserrat mb-1">
                          {day}
                        </span>
                        {/* Badge dengan label yang jelas */}
                        {count > 0 && (
                          <div className="mt-0.5 flex items-center gap-1 bg-white/25 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/40">
                            <span className="text-[10px] font-bold font-montserrat">
                              {count}
                            </span>
                            <span className="text-[8px] font-medium font-montserrat opacity-95">
                              {activeTab === "items" ? "item" : "order"}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Keterangan:
              </h3>
              <div className="flex flex-wrap gap-4 text-xs font-montserrat">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-600 border-2 border-green-700"></div>
                  <span className="text-gray-600">Semua Selesai/Lunas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500 border-2 border-yellow-600"></div>
                  <span className="text-gray-600">Ada Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-800 border-2 border-red-900"></div>
                  <span className="text-gray-600">Ada Overdue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[50] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b-2 border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat">
                    {activeTab === "items" ? "Item Jatuh Tempo" : "Pembayaran"}
                  </h3>
                  <p className="text-sm text-gray-600 font-montserrat mt-1">
                    {selectedDate && formatDate(selectedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowNoteEditor(v => !v)}
                    title="Catatan tanggal ini"
                    className={`p-2 rounded-lg transition-colors relative ${showNoteEditor || existingNote ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'hover:bg-gray-100 text-gray-400'}`}
                  >
                    <FileText className="w-5 h-5" />
                    {existingNote && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedDate(null);
                      setDateDetails([]);
                      setShowNoteEditor(false);
                      setExpandedOtherItems({});
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Note Editor Panel */}
            {showNoteEditor && (
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex-shrink-0">
                <p className="text-xs font-semibold text-amber-700 font-montserrat mb-2">📝 Catatan Tanggal Ini</p>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Tulis catatan untuk tanggal ini..."
                  rows={3}
                  className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 resize-none font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <div className="flex items-center justify-between mt-2">
                  {existingNote ? (
                    <button
                      onClick={handleDeleteNote}
                      disabled={savingNote}
                      className="text-xs text-red-500 hover:text-red-700 font-montserrat font-semibold disabled:opacity-50"
                    >
                      Hapus catatan
                    </button>
                  ) : <span />}
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !noteText.trim()}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold font-montserrat rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingNote ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-gray-500 font-montserrat">Memuat...</div>
                </div>
              ) : dateDetails.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 font-montserrat">
                    Tidak ada data untuk tanggal ini
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dateDetails.map((order) => {
                    const allPhotos = getOrderPhotos(order);
                    const paymentStatus = order.payment?.status || order.paymentStatus || 'unpaid';

                    // Pisahkan item yang due di tanggal terpilih vs item lain
                    // dari order yang sama (due date berbeda).
                    // Backend menandai lewat is_due_on_filter_date; kalau field
                    // tidak ada (mis. response lama), anggap semua item due.
                    const orderDetailsList = Array.isArray(order.order_details) ? order.order_details : [];
                    const dueItems = orderDetailsList.filter(d => d.is_due_on_filter_date !== false);
                    const otherItems = orderDetailsList.filter(d => d.is_due_on_filter_date === false);
                    const isOtherExpanded = !!expandedOtherItems[order.id];

                    return (
                      <div
                        key={order.id}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-4 border-b border-blue-100">
                          {/* Badge Droppoint */}
                          {(order.branch_type === 'mitra' || order.branch?.branch_type === 'mitra') && (order.branch_name || order.branch?.name) && (
                            <div className="mb-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-300 rounded-full bg-purple-50 truncate max-w-full">
                                📍 {order.branch_name || order.branch?.name}
                              </span>
                            </div>
                          )}

                          {/* Customer Name & Payment Status */}
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 text-lg font-montserrat">
                              {order.customer?.name || "Customer"}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getPaymentStatusColors(paymentStatus)}`}>
                              {formatPaymentStatus(paymentStatus)}
                            </span>
                          </div>

                          {/* Order ID & Total Price */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-montserrat">
                              Pesanan #{order.id}
                            </p>
                            {order.payment?.final_price && (
                              <p className="text-xs text-gray-600 font-montserrat flex-shrink-0">
                                {formatCurrency(order.payment.final_price)}
                              </p>
                            )}
                          </div>

                          {/* Customer Info */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {order.customer?.phone && (
                                <a
                                  href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-green-600 hover:underline text-xs font-montserrat"
                                >
                                  <FaWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{order.customer.phone}</span>
                                </a>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="block text-xs text-gray-400 font-montserrat">Tanggal Masuk</span>
                              <span className="text-xs font-medium text-gray-700 font-montserrat">
                                {order.entry_date ? formatDate(order.entry_date) : '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="p-4 space-y-2">
                          {activeTab === "items" ? (
                            <>
                              {/* Item yang due di tanggal ini */}
                              {dueItems.map((detail, idx) => renderOrderDetailItem(detail, idx, false))}

                              {dueItems.length === 0 && (
                                <p className="text-xs text-gray-400 font-montserrat italic">
                                  Tidak ada layanan yang jatuh tempo di tanggal ini.
                                </p>
                              )}

                              {/* Item lain milik order yang sama — collapsed by default */}
                              {otherItems.length > 0 && (
                                <div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOtherItems(order.id);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 bg-white/70 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors text-xs font-semibold font-montserrat"
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOtherExpanded ? 'rotate-180' : ''}`}
                                    />
                                    {isOtherExpanded
                                      ? 'Sembunyikan layanan lainnya'
                                      : `Tampilkan layanan lainnya (${otherItems.length})`}
                                  </button>

                                  {isOtherExpanded && (
                                    <div className="mt-2 space-y-2">
                                      <p className="text-[10px] text-gray-400 font-montserrat">
                                        Layanan berikut jatuh tempo di tanggal lain:
                                      </p>
                                      {otherItems.map((detail, idx) => renderOrderDetailItem(detail, idx, true))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs text-gray-500 font-montserrat">Total Harga</span>
                                  <div className="text-lg font-bold text-green-700 font-montserrat mt-1">
                                    {formatCurrency(order.payment?.final_price || 0)}
                                  </div>
                                </div>
                                {order.payment && (
                                  <div className="text-right">
                                    <span className="text-xs text-gray-500 font-montserrat block">Terbayar</span>
                                    <span className="text-sm font-semibold text-green-600 font-montserrat">
                                      {formatCurrency(order.payment.paid_amount || 0)}
                                    </span>
                                    {order.payment.remaining_amount > 0 && (
                                      <>
                                        <span className="text-xs text-gray-500 font-montserrat block mt-1">Sisa</span>
                                        <span className="text-sm font-semibold text-red-600 font-montserrat">
                                          {formatCurrency(order.payment.remaining_amount || 0)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-4 pb-4 pt-2 flex items-center gap-2">
                          <button
                            onClick={(e) => handleStatusClick(e, order)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all duration-200 shadow-sm hover:shadow-md text-xs font-semibold font-montserrat"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Cek Status
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDetailModal(false);
                              navigate(`/order-detail/${order.id}`, { state: { order, from: '/calendar' } });
                            }}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-sm hover:shadow-md text-xs font-semibold font-montserrat"
                          >
                            <Info className="w-3.5 h-3.5" />
                            Detail
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Popup */}
      {showPhotoPopup && (
        <PhotoPopup
          photos={selectedPhotos}
          isOpen={showPhotoPopup}
          onClose={() => {
            setShowPhotoPopup(false);
            setSelectedPhotos([]);
            setSelectedPhotoIndex(0);
          }}
          initialIndex={selectedPhotoIndex}
        />
      )}

      {/* Order Status Modal - Higher z-index to appear above Detail Modal */}
      {showStatusModal && selectedOrder && (
        <div
          className="fixed inset-0 calendar-status-modal-wrapper"
          style={{ zIndex: 60 }}
        >
          <style>{`
            /* Override z-index untuk OrderStatusModal dan semua child modals */
            .calendar-status-modal-wrapper > * > div[style*="z-40"],
            .calendar-status-modal-wrapper > * > div[class*="z-40"] {
              z-index: 60 !important;
            }
            .calendar-status-modal-wrapper div[style*="z-40"],
            .calendar-status-modal-wrapper div[class*="z-40"] {
              z-index: 60 !important;
            }
            /* PhotoPopup harus lebih tinggi dari OrderStatusModal - Selector lebih spesifik */
            .calendar-status-modal-wrapper div.fixed.inset-0.z-50,
            .calendar-status-modal-wrapper div[class*="z-50"][class*="fixed"],
            .calendar-status-modal-wrapper div[style*="z-50"],
            .calendar-status-modal-wrapper div[class*="z-50"],
            .calendar-status-modal-wrapper div[style*="z-[50"]],
            .calendar-status-modal-wrapper div[class*="z-[50"]"] {
              z-index: 80 !important;
            }
            /* Confirmation Modal dan Success Modal harus lebih tinggi */
            .calendar-status-modal-wrapper div[style*="z-[70"]],
            .calendar-status-modal-wrapper div[class*="z-[70"]],
            .calendar-status-modal-wrapper div[style*="z-70"],
            .calendar-status-modal-wrapper div[class*="z-70"] {
              z-index: 70 !important;
            }
          `}</style>
          <OrderStatusModal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarDashboard;

