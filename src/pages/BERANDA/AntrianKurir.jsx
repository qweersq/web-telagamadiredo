import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AntrianHeader from "../../components/Header Antrian/AntrianHeader";
import AntrianKurirContent from "../../components/AntrianKurirContent";
import WhatsAppFormatter from "../../components/WhatsAppMessage/WhatsAppFormatter";
import { getTenantBusinessName } from "../../utils/userProfileHelper";
import {
  getKurirAntrianData,
  updateOrderStatus,
} from "../../services/kurirService";
import instance from '../../config/api';
import UploadPhotoModal from '../../components/Modal/UploadPhotoModal';
import KurirHistoryModal from '../../components/Modal/KurirHistoryModal';
import AnimatedButton from "../../components/Design/AnimatedButton";
import { getUserProfile } from "../../utils/userProfileHelper";
import { saveFilterToStorage, getFilterFromStorage, clearFilterFromStorage, FILTER_TYPES, COMPONENT_NAMES } from "../../utils/filterStorage";
import { buildDateTime } from "../../utils/dateUtils";

const AntrianKurir = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dateRange } = location.state || {};

  const [antrianData, setAntrianData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pickup'); // Default: Penjemputan

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [activeDeliveryId, setActiveDeliveryId] = useState(() => {
    // Ambil dari sessionStorage jika ada
    return sessionStorage.getItem('activeDeliveryId') || null;
  });
  const [notification, setNotification] = useState("");
  const [deliveryStartTime, setDeliveryStartTime] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState(null);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [deliveryType, setDeliveryType] = useState('pickup'); // Untuk tracking per item
  const [showFailModal, setShowFailModal] = useState(false);
  const [failCustomer, setFailCustomer] = useState(null);
  const [failActionType, setFailActionType] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  // Riwayat penyerahan (item yang sudah dijemput/diantar → hilang dari antrian)
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Group data per customer + delivery_date (untuk memisahkan customer dengan delivery_date berbeda)
  function groupByCustomer(data) {
    const grouped = {};
    data.forEach(item => {
      // Group berdasarkan customer + phone + delivery_date
      const key = item.customerName + '|' + item.phone + '|' + (item.delivery_date || 'no-date');
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          items: [],
          itemCount: 0,
        };
      }
      grouped[key].items.push(item);
      grouped[key].itemCount += 1;
    });

    // Setelah grouping, ambil requestTime yang paling awal dari semua items
    return Object.values(grouped).map(customer => {
      // Cari requestTime yang paling awal dari semua items customer ini
      const validRequestTimes = customer.items
        .map(item => {
          // Coba ambil dari delivery_date dan delivery_time jika ada
          if (item.delivery_date && item.delivery_time) {
            const parsed = buildDateTime(item.delivery_date, item.delivery_time);
            if (parsed) return parsed;
          }
          // Fallback ke requestTime jika ada
          if (item.requestTime && !isNaN(new Date(item.requestTime))) {
            return new Date(item.requestTime);
          }
          return null;
        })
        .filter(time => time !== null && !isNaN(time));

      // Ambil yang paling awal, atau gunakan waktu sekarang jika tidak ada yang valid
      const earliestRequestTime = validRequestTimes.length > 0
        ? new Date(Math.min(...validRequestTimes.map(t => t.getTime())))
        : new Date();

      return {
        ...customer,
        requestTime: earliestRequestTime
      };
    });
  }

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
      console.error('[ERROR] AntrianKurir - Failed to get userData from API:', error);
      return null;
    }
  };

  // Refetch antrian data
  const fetchAntrianData = async (isLoadMore = false) => {
    setLoading(true);
    try {
      const userData = await getUserData();
      const currentDateRange = dateRange || {
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      };
      // Format tanggal ke YYYY-MM-DD
      const startDate = currentDateRange.startDate;
      const endDate = currentDateRange.endDate;

      // Build filterObj sesuai backend (range pakai gte/lte, single pakai string)
      let filterObj = {};
      if (startDate === endDate) {
        filterObj.entry_date = startDate;
      } else {
        filterObj.entry_date = { gte: startDate, lte: endDate };
      }

      // ✅ OPTIMASI: Filter berdasarkan activeTab di backend untuk mengurangi data transfer
      filterObj["order_details.delivery_status"] = ["scheduled"];
      if (activeTab === 'pickup') {
        filterObj["order_details.pickup_method"] = ["pickup"];
        filterObj["order_details.status"] = ["not_yet", "antrian"];
      } else if (activeTab === 'delivery') {
        filterObj["order_details.pickup_method"] = ["delivery"];
        filterObj["order_details.status"] = ["siap_dikirim"];
      } else {
        // Fallback untuk safety
        filterObj["order_details.pickup_method"] = ["pickup", "delivery"];
        filterObj["order_details.status"] = ["not_yet", "siap_dikirim"];
      }

      // Add search parameter if search query exists
      if (searchQuery && searchQuery.trim()) {
        filterObj.search = searchQuery.trim();
      }

      const params = {
        page: isLoadMore ? currentPage + 1 : currentPage,
        pageSize: 20,
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
        // Flatten order_details into a single array of transport items
        const allTransports = ordersArray.flatMap((order) => {
          const orderDetails = Array.isArray(order?.order_details)
            ? order.order_details
            : [];
          return orderDetails.map((detail) => ({
            ...detail,
            customerName: order.customer?.name || '',
            phone: order.customer?.phone || '',
            address: order.customer?.address || '',
            googleMapsUrl: order.customer?.gmaps || '-',
            pickup_method: detail.pickup_method,
            delivery_status: detail.delivery_status,
            status: detail.status,
            id: detail.id,
            delivery_date: detail.delivery_date,
            requestTime: detail.requestTime,
            shoes_photos: detail.shoes_photos || [],
            branch_type: order.branch_type || null,
            branch_name: order.branch_name || null,
          }));
        });

        // Handle pagination data
        const pagination = response.data.data.pagination;
        setHasNextPage(pagination.currentPage < pagination.totalPages);

        if (isLoadMore) {
          // Append new data to existing data
          setAntrianData(prev => [...prev, ...allTransports]);
          setCurrentPage(prev => prev + 1);
        } else {
          // ✅ Replace data for initial load, filter change, or tab switch
          setAntrianData(allTransports);
          setCurrentPage(1);
        }

      } else {
        if (!isLoadMore) {
          setAntrianData([]);
        }
        setHasNextPage(false);
      }
    } catch (error) {
      if (!isLoadMore) {
        setAntrianData([]);
      }
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk load more data
  const loadMoreData = async () => {
    if (!hasNextPage || isLoadingMore || loading) return; // ✅ Prevent load more saat loading
    setIsLoadingMore(true);
    try {
      await fetchAntrianData(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Reset pagination when date range or activeTab changes
      setCurrentPage(1);
      setHasNextPage(false);

      // ✅ Reset semua state saat switch tab untuk mencegah state inconsistency
      if (activeDeliveryId) {
        setActiveDeliveryId(null);
        sessionStorage.removeItem('activeDeliveryId');
      }
      setDeliveryStartTime({}); // Reset delivery start times
      setIsLoadingMore(false); // Reset loading more state

      fetchAntrianData();
    }
  }, [dateRange, activeTab]); // ✅ Include activeTab to trigger re-fetch when tab changes

  // Load saved search filter on component mount
  useEffect(() => {
    const savedSearch = getFilterFromStorage(COMPONENT_NAMES.ANTRIAN_KURIR, FILTER_TYPES.SEARCH);
    if (savedSearch) {
      setSearchQuery(savedSearch);
    }
  }, []);

  // Save/clear search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      saveFilterToStorage(COMPONENT_NAMES.ANTRIAN_KURIR, FILTER_TYPES.SEARCH, searchQuery, 24);
    } else {
      clearFilterFromStorage(COMPONENT_NAMES.ANTRIAN_KURIR, FILTER_TYPES.SEARCH);
    }
  }, [searchQuery]);

  // Cek apakah activeDeliveryId masih ada di data antrian setelah data di-load
  useEffect(() => {
    if (activeDeliveryId && antrianData.length > 0) {
      const found = antrianData.some(item => String(item.id) === String(activeDeliveryId));
      if (!found) {
        setActiveDeliveryId(null);
        sessionStorage.removeItem('activeDeliveryId');
      }
    }
  }, [antrianData, activeDeliveryId]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handler untuk search
  const handleSearch = async () => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // ✅ Reset pagination when search is triggered
      setCurrentPage(1);
      setHasNextPage(false);
      await fetchAntrianData();
    }
  };

  // Filter data berdasarkan activeTab
  const getFilteredAntrian = () => {
    // ✅ OPTIMASI: Data sudah difilter di backend berdasarkan activeTab
    // Tidak perlu filter lagi di frontend, langsung group saja
    return groupByCustomer(antrianData);
  };

  // Fungsi untuk memformat nomor telepon ke format internasional (awalan 62)
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    // Hapus semua karakter non-digit
    let cleaned = phone.replace(/\D/g, "");
    // Jika diawali 0, ganti dengan 62
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    // Jika sudah diawali 62, biarkan
    // Jika sudah diawali 8, tambahkan 62 di depan
    if (cleaned.startsWith("8")) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  };

  const handleWhatsApp = (phone, message) => {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) return;
    const url = `https://wa.me/${formattedPhone}?text=${message}`;

    // Buka WhatsApp di tab baru tanpa mengganggu state aplikasi
    const whatsappWindow = window.open(url, "_blank", "noopener,noreferrer");

    // Fokus kembali ke aplikasi setelah membuka WhatsApp
    if (whatsappWindow) {
      setTimeout(() => {
        window.focus();
      }, 1000);
    }
  };

  const handleStartDelivery = async (id) => {
    setActiveDeliveryId(id);
    sessionStorage.setItem('activeDeliveryId', id); // Simpan ke sessionStorage
    setDeliveryStartTime((prev) => ({
      ...prev,
      [id]: new Date(),
    }));

    // Set deliveryType berdasarkan activeTab
    setDeliveryType(activeTab);

    // Kirim WhatsApp ke customer
    const item = antrianData.find((item) => item.id === id);
    if (item) {
      try {
        const businessName = await getTenantBusinessName();
        const message = WhatsAppFormatter.formatStartDeliveryMessage(activeTab, businessName);
        // Langsung buka WhatsApp tanpa delay
        handleWhatsApp(item.phone, message);
      } catch (error) {
        console.error('Error getting business name:', error);
        // Fallback ke default
        const message = WhatsAppFormatter.formatStartDeliveryMessage(activeTab);
        handleWhatsApp(item.phone, message);
      }
    }

    setNotification(
      `${activeTab === "pickup" ? "Penjemputan" : "Pengantaran"} dimulai untuk ${item?.customerName || "customer"
      }`
    );
  };

  const handleCancelDelivery = async (id) => {
    const confirmCancel = window.confirm(
      "Apakah Anda yakin ingin membatalkan pengantaran ini?"
    );
    if (!confirmCancel) return;

    try {
      const item = antrianData.find((item) => item.id === id);
      if (!item) return;

      let deliveryDateStr = item.delivery_date;
      if (!deliveryDateStr && item.requestTime) {
        deliveryDateStr = item.requestTime instanceof Date
          ? item.requestTime.toISOString().split("T")[0]
          : String(item.requestTime).split("T")[0];
      }
      if (!deliveryDateStr) return;

      const currentDate = new Date(deliveryDateStr);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextDate = currentDate.toISOString().split("T")[0];

      const result = await instance.put(`/order-details/${id}`, { delivery_date: nextDate });
      if (result.status === 200 && result.data.success) {
        await fetchAntrianData();
        setActiveDeliveryId(null);
        sessionStorage.removeItem('activeDeliveryId'); // Hapus dari sessionStorage
        setDeliveryStartTime((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }

      try {
        const businessName = await getTenantBusinessName();
        const message = WhatsAppFormatter.formatCancelDeliveryMessage(
          activeTab,
          nextDate,
          businessName
        );
        handleWhatsApp(item.phone, message);
      } catch (error) {
        console.error('Error getting business name:', error);
        // Fallback ke default
        const message = WhatsAppFormatter.formatCancelDeliveryMessage(
          activeTab,
          nextDate
        );
        handleWhatsApp(item.phone, message);
      }

      setNotification(
        `${activeTab === "pickup" ? "Penjemputan" : "Pengantaran"} dibatalkan dan dijadwalkan ulang untuk besok`
      );
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      setNotification("Gagal membatalkan pengantaran. Silakan coba lagi.");
    }
  };

  // Handler tombol Selesai
  const handleSelesaiClick = (item) => {
    setSelectedOrderDetailId(item.id);
    setSelectedItemData(item);
    setDeliveryType(activeTab); // Set berdasarkan tab aktif
    setShowUploadModal(true);
  };

  // Handler tombol Gagal (per customer)
  const handleFailClickCustomer = (customer) => {
    setFailCustomer(customer);
    setShowFailModal(true);
  };

  // Handler ganti tanggal pengiriman
  const handleChangeDate = (customer) => {
    setSelectedCustomer(customer);
    setNewDeliveryDate(customer.items[0]?.delivery_date || '');
    setShowFailModal(false); // Tutup modal opsi lain
    setShowDateModal(true);  // Buka modal tanggal
  };

  // Handler simpan tanggal baru
  const handleSaveDateChange = async () => {
    if (!selectedCustomer || !newDeliveryDate) return;

    try {
      // Update semua items customer dengan tanggal baru
      for (const item of selectedCustomer.items) {
        await instance.put(`/order-details/${item.id}`, {
          delivery_date: newDeliveryDate
        });
      }

      await fetchAntrianData(); // Refresh data
      setShowDateModal(false);
      setSelectedCustomer(null);
      setNotification('Tanggal pengiriman berhasil diubah');
    } catch (error) {
      console.error('Error updating delivery date:', error);
      setNotification('Gagal mengubah tanggal pengiriman');
    }
  };

  // Handler aksi pada modal gagal
  const handleFailAction = async (action) => {
    if (!failCustomer) return;
    setShowFailModal(false);
    try {
      for (const item of failCustomer.items) {
        if (activeTab === 'pickup') {
          if (action === 'cancelled') {
            // Batal: update status ke cancelled
            await instance.put(`/order-details/${item.id}`, { status: 'cancelled', delivery_status: 'failed' });
          } else if (action === 'delivered') {
            // Sudah di toko: update status ke antrian (balik ke kasir)
            await instance.put(`/order-details/${item.id}`, { status: 'antrian', delivery_status: 'failed' });
          }
        } else if (activeTab === 'delivery') {
          if (action === 'siap') {
            // Gagal delivery: update status ke siap (balik ke kasir)
            await instance.put(`/order-details/${item.id}`, { status: 'siap', delivery_status: 'failed' });
          } else if (action === 'done') {
            // Sudah diambil duluan: update status ke done
            await instance.put(`/order-details/${item.id}`, { status: 'done', delivery_status: 'delivered' });
          }
        }
      }
      await fetchAntrianData();

      // Set notifikasi yang lebih spesifik berdasarkan action
      let notificationText = 'Status berhasil diupdate.';
      if (activeTab === 'pickup') {
        if (action === 'cancelled') {
          notificationText = 'Pickup dibatalkan.';
        } else if (action === 'delivered') {
          notificationText = 'Item sudah di toko, dikembalikan ke antrian Teknisi.';
        }
      } else if (activeTab === 'delivery') {
        if (action === 'siap') {
          notificationText = 'Delivery gagal, dikembalikan ke antrian QC.';
        } else if (action === 'done') {
          notificationText = 'Item sudah diambil duluan.';
        }
      }
      setNotification(notificationText);
    } catch (error) {
      console.error('Error updating fail status:', error);
      setNotification('Gagal update status.');
    } finally {
      setFailCustomer(null);
    }
  };

  // Handler per customer (loop all items)
  const handleStartDeliveryCustomer = (customer) => {
    customer.items.forEach(item => handleStartDelivery(item.id));
  };
  const handleCancelDeliveryCustomer = (customer) => {
    customer.items.forEach(item => handleCancelDelivery(item.id));
  };
  const handleSelesaiClickCustomer = (customer) => {
    customer.items.forEach(item => handleSelesaiClick(item));
  };

  // Handler setelah upload foto sukses
  const handlePhotoUploaded = async (photoUrls) => {
    setShowUploadModal(false);
    try {
      const userData = await getUserData();
      const updated_by = userData?.id;
      // Find the correct customer in getFilteredAntrian by customerName and phone
      const customer = getFilteredAntrian().find(cust =>
        cust.customerName === selectedItemData.customerName &&
        cust.phone === selectedItemData.phone
      );
      const itemsToUpdate = Array.isArray(customer?.items) && customer.items.length > 0
        ? customer.items
        : [selectedItemData];
      for (const item of itemsToUpdate) {
        let old_status = '';
        let new_status = '';
        if (deliveryType === 'pickup') {
          old_status = 'not_yet';
          new_status = 'antrian';
        } else if (deliveryType === 'delivery') {
          old_status = 'siap_dikirim';
          new_status = 'done';
        }
        const payload = {
          old_status,
          new_status,
          updated_by,
          photos: photoUrls,
        };
        await instance.post(`/order-detail-process/${item.id}`, payload);
      }
      // After all posts, call complete handler for each item
      if (deliveryType === 'delivery') {
        for (const item of itemsToUpdate) {
          await handleCompleteDelivery(item.id);
        }
      } else {
        for (const item of itemsToUpdate) {
          await handleCompletePickup(item.id);
        }
      }
    } catch (error) {
      alert('Gagal upload foto atau update status.');
    }
  };

  const handleCompleteDelivery = async (id) => {

    try {
      const result = await instance.put(`/order-details/${id}`, { status: 'done', delivery_status: 'delivered' });
      if (result.status === 200 && result.data.success) {
        await fetchAntrianData();
      }
    } catch (error) {
      console.error("Error completing delivery:", error);
      setNotification("Gagal menyelesaikan pengantaran. Silakan coba lagi.");
    }
  };

  const handleCompletePickup = async (id) => {

    try {
      const result = await instance.put(`/order-details/${id}`, {
        delivery_status: "delivered"
      });
      if (result.status === 200 && result.data.success) {
        await fetchAntrianData();
      }
      // Notifikasi
      setNotification('Penjemputan selesai');
    } catch (error) {
      console.error("Error completing pickup:", error);
      setNotification("Gagal menyelesaikan penjemputan. Silakan coba lagi.");
    }
  };

  // Fungsi untuk mendapatkan durasi pengantaran
  const getDeliveryDuration = (id) => {
    const startTime = deliveryStartTime[id];
    if (!startTime) return "";

    const now = new Date();
    const duration = Math.round((now - startTime) / 1000 / 60);
    return duration > 0 ? `${duration} menit` : "Baru saja";
  };

  return (
    <div className="h-screen overflow-y-auto bg-white font-montserrat">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {notification}
        </div>
      )}

      {/* Modal Gagal */}
      {showFailModal && failCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs mx-4 sm:mx-auto shadow-lg animate-fadeInUp">
            <h2 className="font-montserrat text-lg font-semibold text-center mb-2 text-[#2E7CF6]">Opsi Lain</h2>
            <p className="text-center text-gray-700 mb-4 text-sm font-semibold">
              Pilih opsi untuk pelanggan <b>{failCustomer.customerName}</b>:
            </p>
            <div className="flex flex-col gap-3">
              {/* OPSI GANTI TANGGAL - SELALU ADA */}
              <AnimatedButton
                variant="blue"
                className="w-full py-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                onClick={() => handleChangeDate(failCustomer)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ganti Tanggal
              </AnimatedButton>

              {activeTab === 'pickup' && (
                <>

                  <AnimatedButton
                    variant="green"
                    className="w-full py-2 rounded-xl font-semibold transition-colors"
                    onClick={() => handleFailAction('delivered')}
                  >
                    Sudah di toko
                  </AnimatedButton>
                  <AnimatedButton
                    variant="red"
                    className="w-full py-2 rounded-xl font-semibold transition-colors"
                    onClick={() => handleFailAction('cancelled')}
                  >
                    Tidak jadi order
                  </AnimatedButton>
                </>
              )}
              {activeTab === 'delivery' && (
                <>
                  <AnimatedButton
                    variant="green"
                    className="w-full py-2 rounded-xl font-semibold transition-colors"
                    onClick={() => handleFailAction('siap')}
                  >
                    Gagal ambil (kembali ke antrian kasir)
                  </AnimatedButton>
                  <AnimatedButton
                    variant="black"
                    className="w-full py-2 rounded-xl font-semibold transition-colors"
                    onClick={() => handleFailAction('done')}
                  >
                    Sudah diambil duluan
                  </AnimatedButton>
                </>
              )}
              <AnimatedButton
                className="w-full py-2 rounded-xl bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 transition-colors mt-2"
                onClick={() => { setShowFailModal(false); setFailCustomer(null); }}
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti Tanggal */}
      {showDateModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 sm:mx-auto shadow-lg animate-fadeInUp">
            <h2 className="font-montserrat text-xl text-center mb-2 text-[#2E7CF6]">Ganti Tanggal</h2>
            <p className="text-center text-gray-600 mb-4 text-sm">
              {selectedCustomer.customerName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pengiriman Baru
                </label>
                <input
                  type="date"
                  value={newDeliveryDate}
                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <AnimatedButton
                  onClick={handleSaveDateChange}
                  className="flex-1 py-2 rounded-xl bg-[#2E7CF6] text-white font-semibold"
                >
                  Simpan
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => {
                    setShowDateModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-300 text-gray-700 font-semibold"
                >
                  Batal
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-10 bg-white">
        {/* <AntrianHeader /> */}
        <div className="mx-auto px-4 py-4 md:px-10 flex flex-col gap-4 w-full md:max-w-none bg-white shadow-lg">
          {/* Header dengan Back Button dan Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Kembali"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold font-montserrat text-gray-800">
                Antrian Kurir
              </h1>
            </div>

            {/* Tombol Riwayat — item yang SUDAH diserahkan */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-100 transition-colors"
              title="Riwayat penyerahan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Riwayat
            </button>
          </div>

          {/* Search Input dengan styling yang sama */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari nama Pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <AnimatedButton
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold text-sm"
            >
              Cari
            </AnimatedButton>
          </div>

          {/* Tab Component */}
          <div className="flex gap-2">
            <AnimatedButton
              onClick={() => setActiveTab('pickup')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'pickup'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Penjemputan
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setActiveTab('delivery')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'delivery'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Pengantaran
            </AnimatedButton>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 md:px-10 pt-[200px] pb-10 h-[100dvh] overflow-y-auto">
        <AntrianKurirContent
          filteredAntrian={getFilteredAntrian()}
          type={activeTab}
          searchQuery={searchQuery}
          handleWhatsApp={handleWhatsApp}
          handleStartDelivery={handleStartDeliveryCustomer}
          handleCancelDelivery={handleFailClickCustomer}
          handleCompleteDelivery={handleCompleteDelivery}
          loading={loading}
          activeDeliveryId={activeDeliveryId}
          getDeliveryDuration={getDeliveryDuration}
          handleSelesaiClick={handleSelesaiClickCustomer}
        />

        {/* Load More Button */}
        {hasNextPage && !loading && (
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
        <UploadPhotoModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handlePhotoUploaded}
          status="done"
        />
      </main>

      {/* Riwayat Penyerahan Modal */}
      <KurirHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AntrianKurir;
