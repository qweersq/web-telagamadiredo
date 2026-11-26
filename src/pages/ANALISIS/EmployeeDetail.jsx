import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimatedButton from '../../components/Design/AnimatedButton';
import EmployeeModal from '../../components/Modal/EmployeeModal';
import instance from '../../config/api';
import EmployeeDetailApi from '../../services/employeeDetailApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import {
  formatOrderDetailStatus,
  getOrderDetailStatusColors,
  formatCurrency,
  formatDate,
  formatDateTime
} from '../../utils/labelFormatter';
import PhotoGalleryModal from '../../components/Modal/PhotoGalleryModal';
import { getRoleLabel, getRoleBadgeClass } from '../../utils/roleValidator';
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import MonthlyPerformanceChart from '../../components/MonthlyPerformanceChart';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // localStorage key untuk date filter
  const DATE_FILTER_STORAGE_KEY = 'employeeDetail_dateFilter';

  // State untuk data karyawan
  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [processedItems, setProcessedItems] = useState([]);
  const [performanceChart, setPerformanceChart] = useState([]);

  // State untuk loading dan error
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [loadingProcessedItems, setLoadingProcessedItems] = useState(false);
  const [error, setError] = useState(null);

  // Load saved filter from localStorage or use default
  const loadSavedFilter = () => {
    try {
      const savedFilter = localStorage.getItem(DATE_FILTER_STORAGE_KEY);
      if (savedFilter) {
        return JSON.parse(savedFilter);
      }
    } catch (error) {
      console.error('Error loading saved filter:', error);
    }
    // Default fallback: 7 hari lalu
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return {
      dateFilterTab: '7',
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  const savedFilter = loadSavedFilter();

  // State untuk periode
  const [startDate, setStartDate] = useState(savedFilter.startDate);
  const [endDate, setEndDate] = useState(savedFilter.endDate);

  // State untuk filter tanggal
  const [dateFilterTab, setDateFilterTab] = useState(savedFilter.dateFilterTab); // '7', '30', 'custom'
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // State untuk active tab
  const [activeTab, setActiveTab] = useState('summary');

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Reduced for better load more UX
  const [totalItems, setTotalItems] = useState(0);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State untuk modal detail item
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedStatusPhoto, setSelectedStatusPhoto] = useState(null);

  // State untuk PhotoGalleryModal
  const [isPhotoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [showStatusPhotoModal, setShowStatusPhotoModal] = useState(false);
  const [currentStatusPhotoIndex, setCurrentStatusPhotoIndex] = useState(0);
  const [currentStatusLog, setCurrentStatusLog] = useState(null);

  // State untuk employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState('update');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // State untuk performance chart modal
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);

  // State untuk edit delivery modal
  const [showEditDeliveryModal, setShowEditDeliveryModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [editDeliveryForm, setEditDeliveryForm] = useState({ quantity: '', total_distance: '' });
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Fetch employee detail
  const fetchEmployeeDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await instance.get(`/employees/${id}`);

      if (data.success && data.data) {
        setEmployee(data.data);
      } else {
        setError('Gagal memuat data karyawan');
      }
    } catch (error) {
      console.error('Error fetching employee detail:', error);
      setError('Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data using new API
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);

      const response = await EmployeeDetailApi.getEmployeeSummary(id, startDate, endDate);

      if (response.success) {
        console.log('📊 Employee Summary Data:', response.data);
        console.log('🎯 Breakdown Data:', response.data.breakdown);

        setSummary({
          ...response.data.summary,
          period: response.data.period,
          breakdown: response.data.breakdown
        });
      } else {
        setError('Gagal memuat data ringkasan');
      }

    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Gagal memuat data ringkasan');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);

      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const { data } = await instance.get(`/employees/${id}/attendance?${params.toString()}`);

      if (data.success && data.data) {
        setAttendance(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch deliveries
  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const { data } = await instance.get(`/employees/${id}/deliveries?${params.toString()}`);

      if (data.success && data.data) {
        setDeliveries(data.data.deliveries);
        setTotalItems(data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Handle edit delivery
  const handleEditDelivery = (delivery) => {
    setEditingDelivery(delivery);
    setEditDeliveryForm({
      quantity: delivery.quantity || '',
      total_distance: delivery.total_distance || ''
    });
    setShowEditDeliveryModal(true);
  };

  // Handle save delivery edit
  const handleSaveDeliveryEdit = async () => {
    if (!editingDelivery) return;

    try {
      setSavingDelivery(true);

      await instance.put(`/deliveries/${editingDelivery.id}`, {
        users_id: editingDelivery.users_id,
        quantity: parseInt(editDeliveryForm.quantity) || 0,
        date: editingDelivery.date,
        total_distance: parseFloat(editDeliveryForm.total_distance) || 0
      });

      // Refresh deliveries list
      await fetchDeliveries();
      // Refresh summary untuk update total jarak
      await fetchSummary();

      setShowEditDeliveryModal(false);
      setEditingDelivery(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('Gagal menyimpan perubahan');
    } finally {
      setSavingDelivery(false);
    }
  };

  // Fetch processed items
  const fetchProcessedItems = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoadingProcessedItems(true);
        setCurrentPage(1); // Reset to first page for new search
      }

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const { data } = await instance.get(`/employees/${id}/processed-items?${params.toString()}`);

      if (data.success && data.data) {
        // Group items by order_detail_id and get the latest status
        const groupedItems = groupItemsByOrderDetailId(data.data.items);

        if (isLoadMore) {
          // Append new items to existing ones
          setProcessedItems(prevItems => [...prevItems, ...groupedItems]);
        } else {
          // Replace items for new search
          setProcessedItems(groupedItems);
        }

        setTotalItems(data.data.pagination?.total || 0);

        // Check if there are more items to load
        const currentTotal = isLoadMore ? processedItems.length + groupedItems.length : groupedItems.length;
        setHasMoreItems(currentTotal < (data.data.pagination?.total || 0));
      }
    } catch (error) {
      console.error('Error fetching processed items:', error);
    } finally {
      setLoadingProcessedItems(false);
      setLoadingMore(false);
    }
  };

  // Fetch performance chart
  const fetchPerformanceChart = async () => {
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      params.append('chart_type', 'work_hours');

      const { data } = await instance.get(`/employees/${id}/performance-chart?${params.toString()}`);

      if (data.success && data.data) {
        setPerformanceChart(data.data);
      }
    } catch (error) {
      console.error('Error fetching performance chart:', error);
    }
  };

  // Function to save filter to localStorage
  const saveFilterToStorage = (tab, start, end) => {
    try {
      const filterData = {
        dateFilterTab: tab,
        startDate: start,
        endDate: end
      };
      localStorage.setItem(DATE_FILTER_STORAGE_KEY, JSON.stringify(filterData));
    } catch (error) {
      console.error('Error saving filter to storage:', error);
    }
  };

  // Function to set date range based on tab
  const setDateRange = (days) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1)); // -1 to get exactly 'days' days

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    setStartDate(startDateStr);
    setEndDate(endDateStr);

    // Save to localStorage
    const tab = days === 7 ? '7' : '30';
    saveFilterToStorage(tab, startDateStr, endDateStr);
  };


  // Handle date filter tab change
  const handleDateFilterTabChange = (tab) => {
    setDateFilterTab(tab);

    if (tab === '7') {
      setDateRange(7);
    } else if (tab === '30') {
      setDateRange(30);
    } else if (tab === 'custom') {
      setShowCustomDateModal(true);
    }
  };

  // Handle custom date modal
  const handleCustomDateSubmit = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setShowCustomDateModal(false);

      // Save to localStorage
      saveFilterToStorage('custom', tempStartDate, tempEndDate);
    }
  };

  // Handle custom date modal cancel
  const handleCustomDateCancel = () => {
    setShowCustomDateModal(false);
    setTempStartDate('');
    setTempEndDate('');
  };

  // Initial load
  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id]);

  // Fetch data when dates change
  useEffect(() => {
    if (employee) {
      fetchSummary();
      fetchAttendance();
      fetchPerformanceChart();

      if (activeTab === 'deliveries') {
        fetchDeliveries();
      } else if (activeTab === 'processed-items') {
        fetchProcessedItems();
      }
    }
  }, [startDate, endDate, employee]);

  // Fetch tab data when tab changes
  useEffect(() => {
    if (employee) {
      setCurrentPage(1);
      setHasMoreItems(true); // Reset hasMoreItems when switching tabs

      // Fetch only the data for the active tab
      if (activeTab === 'summary') {
        fetchSummary();
        fetchAttendance();
        fetchPerformanceChart();
      } else if (activeTab === 'attendance') {
        fetchAttendance();
      } else if (activeTab === 'deliveries') {
        fetchDeliveries();
      } else if (activeTab === 'processed-items') {
        fetchProcessedItems();
      }
    }
  }, [activeTab]);

  // Handle load more for processed items
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreItems) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Fetch paginated data when page changes
  useEffect(() => {
    if (employee && (activeTab === 'deliveries' || activeTab === 'processed-items')) {
      if (activeTab === 'deliveries') {
        fetchDeliveries();
      } else if (activeTab === 'processed-items' && currentPage > 1) {
        // Only fetch if it's load more (page > 1)
        fetchProcessedItems(true);
      }
    }
  }, [currentPage]);

  // Handle keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showStatusPhotoModal) {
          handleCloseStatusPhotoModal();
        } else if (isPhotoGalleryOpen) {
          setPhotoGalleryOpen(false);
        } else if (showItemModal) {
          handleCloseModal();
        } else if (showEmployeeModal) {
          setShowEmployeeModal(false);
        } else if (showCustomDateModal) {
          handleCustomDateCancel();
        }
      } else if (showStatusPhotoModal && currentStatusLog && currentStatusLog.photos && currentStatusLog.photos.length > 1) {
        if (event.key === 'ArrowLeft') {
          handlePrevStatusPhoto();
        } else if (event.key === 'ArrowRight') {
          handleNextStatusPhoto();
        }
      }
    };

    if (showItemModal || isPhotoGalleryOpen || showStatusPhotoModal || showEmployeeModal || showCustomDateModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showItemModal, isPhotoGalleryOpen, showStatusPhotoModal, showEmployeeModal, showCustomDateModal, selectedItem, currentStatusLog]);

  const handleBackToList = () => {
    navigate('/analisis-karyawan');
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const handleEditEmployee = () => {
    setEmployeeModalMode('update');
    setShowEmployeeModal(true);
  };

  const handleEmployeeModalSuccess = (updatedEmployee) => {
    // Update local employee data
    setEmployee(updatedEmployee);
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handlePhotoClick = (photo, index) => {
    console.log('Photo clicked:', photo, index);
    console.log('Selected item:', selectedItem);

    // Convert photo format for PhotoGalleryModal
    const photos = selectedItem.item_photo.map(p => ({
      url_photo: p.url_photo,
      id: p.id,
      createdAt: p.createdAt
    }));

    console.log('Gallery photos:', photos);
    setGalleryPhotos(photos);
    setGalleryInitialIndex(index);
    setPhotoGalleryOpen(true);
  };


  const handleStatusPhotoClick = (photo, log, photoIndex) => {
    setSelectedStatusPhoto(photo);
    setCurrentStatusPhotoIndex(photoIndex);
    setCurrentStatusLog(log);
    setShowStatusPhotoModal(true);
  };

  const handleCloseStatusPhotoModal = () => {
    setShowStatusPhotoModal(false);
    setSelectedStatusPhoto(null);
    setCurrentStatusPhotoIndex(0);
    setCurrentStatusLog(null);
  };

  const handleStatusPhotoModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseStatusPhotoModal();
    }
  };

  const handleNextStatusPhoto = () => {
    if (currentStatusLog && currentStatusLog.photos) {
      const nextIndex = (currentStatusPhotoIndex + 1) % currentStatusLog.photos.length;
      setCurrentStatusPhotoIndex(nextIndex);
      setSelectedStatusPhoto(currentStatusLog.photos[nextIndex]);
    }
  };

  const handlePrevStatusPhoto = () => {
    if (currentStatusLog && currentStatusLog.photos) {
      const prevIndex = currentStatusPhotoIndex === 0 ? currentStatusLog.photos.length - 1 : currentStatusPhotoIndex - 1;
      setCurrentStatusPhotoIndex(prevIndex);
      setSelectedStatusPhoto(currentStatusLog.photos[prevIndex]);
    }
  };


  // Use labelFormatter for date formatting
  // const formatDate is now imported from labelFormatter

  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[date.getDay()];
    const formattedDate = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return `${dayName}, ${formattedDate}`;
  };

  const formatTime = (timeString) => {
    return timeString?.substring(0, 5) || '-';
  };

  // Use labelFormatter for currency formatting
  // const formatCurrency is now imported from labelFormatter

  const formatDuration = (duration) => {
    if (!duration) return '-';
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}j ${minutes}m`;
  };

  // Use labelFormatter for order detail status
  const getStatusColor = (status) => {
    // Normalize status to lowercase for case-insensitive matching
    const normalizedStatus = status ? status.toLowerCase() : '';

    // For attendance status, use custom colors
    const attendanceColors = {
      'present': 'bg-telaga-100 text-telaga-900',
      'hadir': 'bg-telaga-100 text-telaga-900',
      'absent': 'bg-red-100 text-red-800',
      'late': 'bg-senja-100 text-senja-800',
      'personalleave': 'bg-senja-100 text-senja-800'
    };

    // For order detail status, use labelFormatter
    if (attendanceColors[normalizedStatus]) {
      return attendanceColors[normalizedStatus];
    }

    return getOrderDetailStatusColors(status);
  };

  const getStatusText = (status) => {
    // Normalize status to lowercase for case-insensitive matching
    const normalizedStatus = status ? status.toLowerCase() : '';

    // For attendance status, use custom texts
    const attendanceTexts = {
      'present': 'Hadir',
      'hadir': 'Hadir',
      'absent': 'Tidak Hadir',
      'late': 'Terlambat',
      'personalleave': 'Izin Pribadi'
    };

    // For order detail status, use labelFormatter
    if (attendanceTexts[normalizedStatus]) {
      return attendanceTexts[normalizedStatus];
    }

    return formatOrderDetailStatus(status);
  };

  // Helper function to group items by order_detail_id and collect ALL status logs
  const groupItemsByOrderDetailId = (items) => {
    const grouped = {};

    items.forEach(item => {
      const orderDetailId = item.order_detail_id;

      if (!grouped[orderDetailId]) {
        // Initialize with first item's data
        grouped[orderDetailId] = {
          ...item,
          all_logs: []
        };
      }

      // Collect all status logs for this order_detail_id
      if (item.status_logs && item.status_logs.length > 0) {
        grouped[orderDetailId].all_logs.push({
          ...item.status_logs[0],
          updatedAt: item.updatedAt
        });
      }
    });

    // Convert object to array and sort logs by date
    return Object.values(grouped).map(item => ({
      ...item,
      all_logs: item.all_logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }));
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Kinerja Karyawan"
          description="Ringkasan kinerja & aktivitas karyawan"
          hideLogout={true}
          hideUserMenu={true}
          showBackButton={true}
          backPath="/analisis-karyawan"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
            <div className="max-w-[390px] md:max-w-none mx-auto animate-pulse">
              <div className="h-28 bg-telaga-100 rounded-2xl mb-4"></div>
              <div className="h-12 bg-telaga-100 rounded-xl mb-4"></div>
              <div className="h-10 bg-telaga-100 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Kinerja Karyawan"
          description="Ringkasan kinerja & aktivitas karyawan"
          hideLogout={true}
          hideUserMenu={true}
          showBackButton={true}
          backPath="/analisis-karyawan"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
            <div className="max-w-[390px] md:max-w-none mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-semibold text-red-800">{error}</p>
              <button
                onClick={() => navigate('/analisis-karyawan')}
                className="mt-4 px-4 py-2 rounded-xl bg-telaga-700 text-white text-sm font-semibold hover:bg-telaga-800 transition-colors"
              >
                Kembali ke Daftar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Kinerja Karyawan"
        description="Ringkasan kinerja & aktivitas karyawan"
        hideLogout={true}
        hideUserMenu={true}
        showBackButton={true}
        backPath="/analisis-karyawan"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
          <div className="max-w-[390px] md:max-w-none mx-auto ">

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-6 bg-telaga-50 border border-telaga-200 text-telaga-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-telaga-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Data karyawan berhasil diperbarui!
              </div>
            )}

            {/* Employee Info */}
            <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-telaga-700 via-telaga-800 to-telaga-950 p-4 text-white shadow-sm">
              <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-senja-400/25 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/25">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-base font-bold leading-tight">{employee.name}</h1>
                  <p className="truncate text-xs text-white/70">{employee.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                    <span className="truncate">
                      {employee.branch?.name || 'Cabang tidak diketahui'}
                    </span>
                    {employee.phone && (
                      <>
                        <span className="flex-shrink-0">•</span>
                        <span className="truncate">{employee.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <AnimatedButton
                  onClick={handleEditEmployee}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </AnimatedButton>
              </div>

              {/* Status Karyawan & Keaktifan */}
              <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${getRoleBadgeClass(employee.role)}`}>
                  {getRoleLabel(employee.role)}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${employee.status === 'active'
                  ? 'bg-telaga-50/90 text-telaga-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${employee.status === 'active' ? 'bg-telaga-600' : 'bg-red-500'}`} />
                  {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Date Filter Tabs */}
            <div className="mb-4 flex gap-1 rounded-xl border border-telaga-100 bg-white p-1 shadow-sm">
              {[
                { id: '7', label: '7 Hari' },
                { id: '30', label: '30 Hari' },
                { id: 'custom', label: 'Custom' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleDateFilterTabChange(tab.id)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${dateFilterTab === tab.id
                    ? 'bg-telaga-700 text-white shadow-sm'
                    : 'text-telaga-900/55 hover:bg-telaga-50 hover:text-telaga-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Current Date Range Display */}
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-telaga-100 bg-telaga-50/70 px-3 py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-telaga-700 ring-1 ring-telaga-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-telaga-900/45">Periode terpilih</p>
                <p className="truncate text-xs font-semibold text-telaga-900">
                  {formatDate(startDate)} — {formatDate(endDate)}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-telaga-100 bg-white p-1 shadow-sm">
              {[
                { id: 'summary', label: 'Ringkasan' },
                { id: 'attendance', label: 'Absensi' },
                // { id: 'deliveries', label: 'Delivery' }, // disembunyikan: tidak relevan
                { id: 'processed-items', label: 'Item Diproses' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeTab === tab.id
                    ? 'bg-telaga-700 text-white shadow-sm'
                    : 'text-telaga-900/55 hover:bg-telaga-50 hover:text-telaga-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm mb-4">
              {/* Tab Content */}
              <div>
                {activeTab === 'summary' && (
                  <div>
                    {loadingSummary ? (
                      <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-telaga-100 rounded-lg"></div>
                          ))}
                        </div>
                        <div className="h-64 bg-telaga-100 rounded-lg"></div>
                      </div>
                    ) : summary ? (
                      <div>
                        {/* Button Chart Performa - Standalone */}
                        <button
                          onClick={() => setShowPerformanceChart(true)}
                          className="w-full mb-4 px-4 py-2.5 bg-telaga-50 text-telaga-700 rounded-xl hover:bg-telaga-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Lihat Chart Performa
                        </button>

                        {/* Summary Cards - Compact Grid Design */}
                        <div className="grid grid-cols-1 gap-2 mb-4">
                          {/* Revenue Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-lg p-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[10px] md:text-xs font-medium text-telaga-900/70 truncate">Penghasilan</h3>
                                <div className="w-5 h-5 md:w-6 md:h-6 bg-telaga-50 rounded flex items-center justify-center flex-shrink-0">
                                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-telaga-600 rounded-full"></div>
                                </div>
                              </div>
                              <p className="text-sm md:text-base font-bold text-telaga-950 truncate">
                                {formatCurrency(summary.revenue?.total || 0)}
                              </p>
                              <p className="text-[10px] md:text-xs text-telaga-900/55 truncate">
                                {formatCurrency(summary.revenue?.daily_average || 0)}/hr
                              </p>
                            </div>
                          </div> */}

                          {/* Layanan Dikerjakan Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-lg p-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs md:text-sm font-medium text-telaga-900/70 truncate">Item/Layanan Dikerjakan</h3>
                                <div className="w-5 h-5 md:w-6 md:h-6 bg-telaga-50 rounded flex items-center justify-center flex-shrink-0">
                                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-telaga-600 rounded-full"></div>
                                </div>
                              </div>
                              <p className="text-base md:text-lg font-bold text-telaga-950 truncate">
                                {summary.revenue?.treatments_completed || 0}
                              </p>
                              <p className="text-xs md:text-sm text-telaga-900/55 truncate">
                                {summary.attendance?.present_days > 0 ? 
                                  ((summary.revenue?.treatments_completed || 0) / summary.attendance.present_days).toFixed(1) : 0
                                }/hr
                              </p>
                            </div>
                          </div> */}

                          {/* Progress Updates Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-lg p-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs md:text-sm font-medium text-telaga-900/70 truncate">Progress</h3>
                                <div className="w-5 h-5 md:w-6 md:h-6 bg-senja-50 rounded flex items-center justify-center flex-shrink-0">
                                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-senja-500 rounded-full"></div>
                                </div>
                              </div>
                              <p className="text-base md:text-lg font-bold text-telaga-950 truncate">
                                {summary.progress?.total_updates || 0}
                              </p>
                              <p className="text-xs md:text-sm text-telaga-900/55 truncate">
                                {summary.progress?.daily_average?.toFixed(1) || 0}/hr
                              </p>
                            </div>
                          </div> */}

                          {/* Kehadiran Card */}
                          <div className="bg-white border border-telaga-100 rounded-lg p-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm md:text-base font-semibold text-telaga-950">Kehadiran</h3>
                                <div className="w-6 h-6 md:w-7 md:h-7 bg-senja-50 rounded flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-senja-500 rounded-full"></div>
                                </div>
                              </div>

                              {/* 3 Column Breakdown */}
                              <div className="grid grid-cols-3 gap-2">
                                {/* Hadir */}
                                <div className="bg-telaga-50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-telaga-700 font-medium mb-1">Hadir</p>
                                  <p className="text-lg md:text-xl font-bold text-telaga-800">
                                    {summary.attendance?.present_days || 0}
                                  </p>
                                </div>

                                {/* Izin */}
                                <div className="bg-senja-50 rounded-lg p-2 text-center">
                                  <p className="text-xs text-senja-700 font-medium mb-1">Izin</p>
                                  <p className="text-lg md:text-xl font-bold text-senja-800">
                                    {summary.attendance?.personal_leave_days || 0}
                                  </p>
                                </div>

                                {/* Lainnya */}
                                <div className="bg-krem rounded-lg p-2 text-center">
                                  <p className="text-xs text-telaga-900/70 font-medium mb-1">Lainnya</p>
                                  <p className="text-lg md:text-xl font-bold text-telaga-900">
                                    {(summary.period?.total_days || 0) - (summary.attendance?.present_days || 0) - (summary.attendance?.personal_leave_days || 0)}
                                  </p>
                                </div>
                              </div>

                              {/* Summary Info */}
                              <div className="flex items-center justify-between text-xs md:text-sm text-telaga-900/55 pt-1 border-t border-telaga-50">
                                <span>
                                  {summary.attendance?.present_days || 0}/{summary.period?.total_days || 0} hari
                                </span>
                                <span>
                                  {summary.attendance?.total_work_hours?.toFixed(1) || 0} jam
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-lg p-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs md:text-sm font-medium text-telaga-900/70 truncate">Pengiriman</h3>
                                <div className="w-5 h-5 md:w-6 md:h-6 bg-krem rounded flex items-center justify-center flex-shrink-0">
                                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-telaga-500 rounded-full"></div>
                                </div>
                              </div>
                              <p className="text-base md:text-lg font-bold text-telaga-950 truncate">
                                {summary.delivery?.total_deliveries || 0}
                              </p>
                              <p className="text-xs md:text-sm text-telaga-900/55 truncate">
                                {summary.delivery?.total_distance?.toFixed(2) || 0} km
                              </p>
                            </div>
                          </div> */}
                        </div>

                        {/* Breakdown Section */}
                        {summary.breakdown && (
                          <div className="space-y-3 mt-4">
                            {/* Pickup vs Delivery Breakdown - disembunyikan: tidak relevan */}
                            {false && (
                            <div className="bg-white border border-telaga-100 rounded-lg p-3">
                              <h3 className="text-sm font-semibold text-telaga-950 mb-2.5">Aktivitas Pickup & Delivery</h3>
                              <div className="grid grid-cols-2 gap-2 mb-2.5">
                                <div className="bg-telaga-50 rounded-lg p-2.5">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-telaga-700 font-medium">Pickup</span>
                                    <svg className="w-3.5 h-3.5 text-telaga-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <p className="text-lg md:text-xl font-bold text-telaga-800">
                                    {summary.breakdown.pickup_delivery?.total_pickups || 0}
                                  </p>
                                  <p className="text-xs text-telaga-700 mt-0.5">Penjemputan</p>
                                </div>
                                <div className="bg-senja-50 rounded-lg p-2.5">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-senja-700 font-medium">Delivery</span>
                                    <svg className="w-3.5 h-3.5 text-senja-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                  <p className="text-lg md:text-xl font-bold text-senja-800">
                                    {summary.breakdown.pickup_delivery?.total_deliveries || 0}
                                  </p>
                                  <p className="text-xs text-senja-700 mt-0.5">Pengiriman</p>
                                </div>
                              </div>

                              {/* Footer Summary */}
                              <div className="pt-2.5 border-t border-telaga-100 text-center">
                                <p className="text-xs text-telaga-900/70">
                                  {summary.delivery?.total_distance > 0 && (
                                    <> Total Jarak Pengiriman: {summary.delivery.total_distance.toFixed(1)} km</>
                                  )}
                                </p>
                              </div>
                            </div>
                            )}

                            {/* Treatment Breakdown - disembunyikan: tidak relevan */}
                            {false && summary.breakdown.treatments && (
                              <div className="bg-white border border-telaga-100 rounded-lg p-3">
                                <h3 className="text-sm font-semibold text-telaga-950 mb-2.5">
                                  Total Layanan Dikerjakan ({summary.revenue?.treatments_completed || 0} Item)
                                </h3>
                                {summary.breakdown.treatments.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {summary.breakdown.treatments.map((treatment, idx) => (
                                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-krem rounded-lg hover:bg-telaga-50 transition-colors">
                                        <span className="text-xs md:text-sm text-telaga-900 font-medium truncate flex-1">
                                          {treatment.treatment_name}
                                        </span>
                                        <span className="text-xs md:text-sm font-bold text-telaga-950 ml-2">
                                          {treatment.total_items} <span className="text-telaga-900/55 font-normal">item</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-telaga-900/40 italic text-center py-3">Tidak ada data</p>
                                )}
                              </div>
                            )}

                            {/* QC Breakdown - disembunyikan: tidak relevan */}
                            {false && summary.breakdown.qc && summary.breakdown.qc.treatments && (
                              <div className="bg-white border border-telaga-100 rounded-lg p-3">
                                <h3 className="text-sm font-semibold text-telaga-950 mb-2.5">
                                  Total Pengecekan QC ({summary.breakdown.qc?.total_qc || 0} Item)
                                </h3>
                                {summary.breakdown.qc.treatments.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {summary.breakdown.qc.treatments.map((treatment, idx) => (
                                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-krem rounded-lg hover:bg-telaga-50 transition-colors">
                                        <span className="text-xs md:text-sm text-telaga-900 font-medium truncate flex-1">
                                          {treatment.treatment_name}
                                        </span>
                                        <span className="text-xs md:text-sm font-bold text-telaga-950 ml-2">
                                          {treatment.total_qc} <span className="text-telaga-900/55 font-normal">item</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-telaga-900/40 italic text-center py-3">Tidak ada data</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-telaga-900/55">
                        Tidak ada data ringkasan
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div>
                    {loadingAttendance ? (
                      <div className="animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-telaga-100 rounded-lg mb-3"></div>
                        ))}
                      </div>
                    ) : attendance.length > 0 ? (
                      <div className="space-y-2">
                        {attendance.map((record) => (
                          <div key={record.id} className="p-2.5 bg-krem rounded-lg">
                            <div className="space-y-3">
                              {/* Row 1: Tanggal dan Status */}
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs text-telaga-900/70">Tanggal</p>
                                  <p className="font-semibold text-telaga-950 text-sm">
                                    {formatDateWithDay(record.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-telaga-900/70">Status</p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                    {getStatusText(record.status)}
                                  </span>
                                </div>
                              </div>

                              {/* Row 2: Masuk, Keluar, Jam Kerja */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                  <p className="text-xs text-telaga-900/70">Masuk</p>
                                  <p className="font-semibold text-telaga-950 text-sm">
                                    {formatTime(record.clock_in)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-telaga-900/70">Keluar</p>
                                  <p className="font-semibold text-telaga-950 text-sm">
                                    {formatTime(record.clock_out)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-telaga-900/70">Jam Kerja</p>
                                  <p className="font-semibold text-telaga-950 text-sm">
                                    {record.calculated_work_hours ? `${record.calculated_work_hours.toFixed(1)}j` : '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-telaga-900/55">
                        Tidak ada data absensi
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Delivery - disembunyikan: tidak relevan */}
                {false && activeTab === 'deliveries' && (
                  <div>
                    {loadingDeliveries ? (
                      <div className="animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-telaga-100 rounded-lg mb-3"></div>
                        ))}
                      </div>
                    ) : deliveries.length > 0 ? (
                      <div>
                        <div className="space-y-2 mb-4">
                          {deliveries.map((delivery) => (
                            <div key={delivery.id} className="p-2.5 bg-krem rounded-lg">
                              <div className="flex items-center justify-between gap-2">
                                <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
                                  <div className="text-center min-w-0">
                                    <p className="text-xs text-telaga-900/70 truncate">Tanggal</p>
                                    <p className="font-semibold text-telaga-950 text-xs truncate">
                                      {formatDate(delivery.date)}
                                    </p>
                                  </div>
                                  <div className="text-center min-w-0">
                                    <p className="text-xs text-telaga-900/70 truncate">Qty</p>
                                    <p className="font-semibold text-telaga-950 text-xs truncate">
                                      {delivery.quantity}
                                    </p>
                                  </div>
                                  <div className="text-center min-w-0">
                                    <p className="text-xs text-telaga-900/70 truncate">Jarak</p>
                                    <p className="font-semibold text-telaga-950 text-xs truncate">
                                      {delivery.total_distance} km
                                    </p>
                                  </div>
                                </div>
                                {/* Edit Button */}
                                <button
                                  onClick={() => handleEditDelivery(delivery)}
                                  className="p-1.5 text-telaga-700 hover:bg-telaga-50 rounded-lg transition-colors flex-shrink-0"
                                  title="Edit Jarak"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalItems > pageSize && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                            <p className="text-xs text-telaga-900/70 text-center sm:text-left">
                              Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
                            </p>
                            <div className="flex gap-1.5">
                              <AnimatedButton
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-2 py-1 rounded text-xs ${currentPage === 1
                                  ? 'bg-telaga-50 text-telaga-900/40 cursor-not-allowed'
                                  : 'bg-telaga-600 text-white hover:bg-telaga-700'
                                  }`}
                              >
                                Sebelumnya
                              </AnimatedButton>
                              <AnimatedButton
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                                className={`px-2 py-1 rounded text-xs ${currentPage >= Math.ceil(totalItems / pageSize)
                                  ? 'bg-telaga-50 text-telaga-900/40 cursor-not-allowed'
                                  : 'bg-telaga-600 text-white hover:bg-telaga-700'
                                  }`}
                              >
                                Selanjutnya
                              </AnimatedButton>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-telaga-900/55">
                        Tidak ada data delivery
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'processed-items' && (
                  <div>
                    {loadingProcessedItems ? (
                      <div className="animate-pulse">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div className="h-16 bg-telaga-100 rounded-lg"></div>
                          <div className="h-16 bg-telaga-100 rounded-lg"></div>
                          <div className="h-16 bg-telaga-100 rounded-lg sm:col-span-2 lg:col-span-1"></div>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-telaga-100 rounded-lg mb-3"></div>
                        ))}
                      </div>
                    ) : processedItems.length > 0 ? (
                      <div>
                        {/* Statistics Cards - Modern Minimalist Design */}
                        <div className="space-y-4 mb-6">
                          {/* Total Item Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-telaga-900/70 mb-1">Total Item</h3>
                                <p className="text-2xl font-bold text-telaga-950 mb-1">
                                  {processedItems.length}
                                </p>
                                <p className="text-sm text-telaga-900/55">
                                  Item diproses
                                </p>
                              </div>
                              <div className="w-12 h-12 bg-telaga-50 rounded-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-telaga-600 rounded-full"></div>
                              </div>
                            </div>
                          </div> */}

                          {/* Total Harga Card */}
                          {/* <div className="bg-white border border-telaga-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-telaga-900/70 mb-1">Total Harga</h3>
                                <p className="text-2xl font-bold text-telaga-950 mb-1">
                                  {formatCurrency(processedItems.reduce((sum, item) => {
                                    const price = parseFloat(item.final_price) || 0;
                                    return sum + price;
                                  }, 0))}
                                </p>
                                <p className="text-sm text-telaga-900/55">
                                  Nilai total
                                </p>
                              </div>
                              <div className="w-12 h-12 bg-telaga-50 rounded-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-telaga-600 rounded-full"></div>
                              </div>
                            </div>
                          </div> */}

                        </div>

                        <div className="space-y-3 mb-4">
                          {processedItems.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white border border-telaga-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleItemClick(item)}
                            >
                              {/* Header: Item & Treatment */}
                              <div className="mb-3 pb-2 border-b border-telaga-50">
                                <h4 className="font-semibold text-telaga-950 text-sm mb-0.5">
                                  {item.item?.name || 'Item tidak diketahui'}
                                </h4>
                                <p className="text-xs text-telaga-900/70">
                                  {item.treatment?.name || 'Treatment tidak diketahui'}
                                </p>
                              </div>

                              {/* Timeline: All Status Transitions */}
                              {item.all_logs && item.all_logs.length > 0 && (
                                <div className="space-y-2">
                                  {item.all_logs.map((log, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <div className="w-5 h-5 bg-telaga-50 rounded-full flex items-center justify-center flex-shrink-0">
                                          <span className="text-telaga-700 font-semibold text-[10px]">{idx + 1}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(log.old_status)}`}>
                                          {getStatusText(log.old_status)}
                                        </span>
                                        <svg className="w-3 h-3 text-telaga-900/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(log.new_status)}`}>
                                          {getStatusText(log.new_status)}
                                        </span>
                                      </div>
                                      <span className="text-telaga-900/55 text-[10px] whitespace-nowrap">
                                        {formatDateTime(log.created_at)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* No logs fallback */}
                              {(!item.all_logs || item.all_logs.length === 0) && (
                                <p className="text-xs text-telaga-900/40 italic">Tidak ada riwayat status</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Load More Button */}
                        {hasMoreItems && processedItems.length > 0 && (
                          <div className="flex flex-col items-center gap-3 mt-4">
                            <div className="text-center">
                              <p className="text-xs text-telaga-900/70 mb-1">
                                Menampilkan {processedItems.length} dari {totalItems} item
                              </p>
                              <p className="text-xs text-telaga-900/55">
                                {totalItems - processedItems.length} item tersisa
                              </p>
                            </div>
                            <AnimatedButton
                              onClick={handleLoadMore}
                              disabled={loadingMore}
                              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${loadingMore
                                ? 'bg-telaga-50 text-telaga-900/40 cursor-not-allowed'
                                : 'bg-telaga-600 text-white hover:bg-telaga-700 hover:shadow-md'
                                }`}
                            >
                              {loadingMore ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border border-telaga-200 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Memuat...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  <span>Muat Lebih Banyak</span>
                                </div>
                              )}
                            </AnimatedButton>
                          </div>
                        )}

                        {/* No more items message */}
                        {!hasMoreItems && processedItems.length > 0 && (
                          <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-krem rounded-lg">
                              <svg className="w-4 h-4 text-telaga-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-telaga-900/70">Semua item telah dimuat</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-telaga-900/55">
                        Tidak ada data item diproses
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <div
          className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm z-50 p-[max(1.5rem,env(safe-area-inset-top))] sm:p-8"
          style={{
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
          }}
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full h-full mx-auto flex flex-col max-h-[85vh]">
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-6 py-3 border-b-2 border-telaga-100 rounded-t-2xl bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-telaga-950">Detail Item</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-telaga-900/70 hover:bg-telaga-50 rounded-lg p-1.5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="space-y-3">
                {/* Customer Information */}
                {selectedItem.customer && (
                  <div className="bg-telaga-50 rounded-lg p-3">
                    <h4 className="font-semibold text-telaga-900 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Customer
                    </h4>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-xs text-telaga-700 mb-0.5">Nama</p>
                        <p className="font-medium text-telaga-900 text-sm">
                          {selectedItem.customer.name}
                        </p>
                      </div>
                      {selectedItem.customer.phone && (
                        <div>
                          <p className="text-xs text-telaga-700 mb-0.5">Telepon</p>
                          <a
                            href={`tel:${selectedItem.customer.phone}`}
                            className="font-medium text-telaga-900 hover:text-telaga-700 transition-colors flex items-center gap-1.5 text-sm"
                          >
                            {selectedItem.customer.phone}
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Item Photos - disembunyikan: tidak relevan */}
                {false && selectedItem.item_photo && selectedItem.item_photo.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-telaga-950 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Foto Item ({selectedItem.item_photo.length} foto)
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedItem.item_photo.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url_photo}
                            alt={`Foto item ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity relative z-10"
                            onClick={() => handlePhotoClick(photo, index)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                            <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Item Details */}
                <div className="bg-krem rounded-lg p-3">
                  <h4 className="font-semibold text-telaga-950 text-sm mb-3">
                    {selectedItem.item?.name || 'Item tidak diketahui'}
                  </h4>

                  <div className="space-y-2.5">
                    <div>
                      <p className="text-xs text-telaga-900/70 mb-0.5">Treatment</p>
                      <p className="font-medium text-telaga-950 text-sm">
                        {selectedItem.treatment?.name || 'Treatment tidak diketahui'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-telaga-900/70 mb-0.5">Deskripsi</p>
                      <p className="font-medium text-telaga-950 text-sm">
                        {selectedItem.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-telaga-900/70 mb-0.5">Tanggal Dibuat</p>
                      <p className="font-medium text-telaga-950 text-sm">
                        {formatDate(selectedItem.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline - ALL Status Transitions - disembunyikan: tidak relevan */}
                {false && selectedItem.all_logs && selectedItem.all_logs.length > 0 && (
                  <div className="bg-telaga-50 rounded-lg p-3">
                    <h4 className="font-semibold text-telaga-900 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Timeline Pengerjaan ({selectedItem.all_logs.length} proses)
                    </h4>
                    <div className="space-y-2.5">
                      {selectedItem.all_logs.map((log, index) => (
                        <div key={log.id || index} className="bg-white rounded-lg p-3 border border-telaga-100">
                          {/* Step Number & Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-telaga-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(log.old_status)}`}>
                                {getStatusText(log.old_status)}
                              </span>
                              <svg className="w-3 h-3 text-telaga-900/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(log.new_status)}`}>
                                {getStatusText(log.new_status)}
                              </span>
                            </div>
                          </div>

                          {/* Date & Updater */}
                          <div className="flex items-center justify-between text-xs text-telaga-900/70 mb-2">
                            <span>{formatDateTime(log.created_at)}</span>
                            {log.status_updater && (
                              <span className="text-telaga-700 font-medium">
                                {log.status_updater.name}
                              </span>
                            )}
                          </div>

                          {/* Status Log Photos */}
                          {log.photos && log.photos.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-telaga-50">
                              <p className="text-xs text-telaga-900/70 mb-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Foto ({log.photos.length})
                              </p>
                              <div className={`grid gap-1.5 ${log.photos.length === 1 ? 'grid-cols-1' : log.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {log.photos.map((photo, photoIndex) => (
                                  <div
                                    key={photo.id}
                                    className="relative group cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleStatusPhotoClick(photo, log, photoIndex);
                                    }}
                                  >
                                    <img
                                      src={getPhotoUrl(photo.photo_url)}
                                      alt={`Foto status ${photoIndex + 1}`}
                                      className={`w-full object-cover rounded-lg hover:opacity-80 transition-opacity ${log.photos.length === 1 ? 'h-24' : log.photos.length === 2 ? 'h-20' : 'h-16'
                                        }`}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="hidden w-full h-full bg-telaga-100 rounded-lg flex items-center justify-center">
                                      <svg className="w-6 h-6 text-telaga-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                                      <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                      </svg>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Timeline Fallback */}
                {(!selectedItem.all_logs || selectedItem.all_logs.length === 0) && (
                  <div className="bg-krem rounded-lg p-4 text-center">
                    <svg className="w-8 h-8 text-telaga-900/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-telaga-900/55">Tidak ada riwayat pengerjaan</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t-2 border-telaga-100 rounded-b-2xl bg-white">
              <button
                onClick={handleCloseModal}
                className="w-full px-4 py-2.5 bg-telaga-50 text-telaga-900 rounded-xl hover:bg-telaga-100 transition-colors text-sm font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isPhotoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />

      {/* Status Photo Modal */}
      {showStatusPhotoModal && selectedStatusPhoto && currentStatusLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
          onClick={handleStatusPhotoModalBackdropClick}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={handleCloseStatusPhotoModal}
              className="absolute top-4 right-4 text-white hover:text-telaga-900/30 transition-colors z-10 bg-telaga-950/60 backdrop-blur-sm rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Buttons */}
            {currentStatusLog.photos && currentStatusLog.photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevStatusPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-telaga-900/30 transition-colors z-10 bg-telaga-950/60 backdrop-blur-sm rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNextStatusPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-telaga-900/30 transition-colors z-10 bg-telaga-950/60 backdrop-blur-sm rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            <div className="flex items-center justify-center h-full">
              <img
                src={getPhotoUrl(selectedStatusPhoto.photo_url)}
                alt="Foto status detail"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Gagal memuat foto</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 text-white text-sm bg-telaga-950/60 backdrop-blur-sm rounded-lg px-3 py-1">
              Status: {getStatusText(currentStatusLog.new_status)} • Foto {currentStatusPhotoIndex + 1} dari {currentStatusLog.photos?.length || 1} • {formatDate(selectedStatusPhoto.createdAt)}
            </div>

            <div className="absolute top-4 left-4 text-white text-sm bg-telaga-950/60 backdrop-blur-sm rounded-lg px-3 py-1">
              {currentStatusLog.status_updater?.name} • {formatDate(currentStatusLog.created_at)}
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-telaga-950 font-montserrat">
                Pilih Periode Custom
              </h3>
              <button
                onClick={handleCustomDateCancel}
                className="w-8 h-8 bg-telaga-50 rounded-lg flex items-center justify-center hover:bg-telaga-100 transition-colors"
              >
                <svg className="w-4 h-4 text-telaga-900/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-0 focus:border-telaga-600 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-telaga-900 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-telaga-100 rounded-xl focus:ring-0 focus:border-telaga-600 focus:outline-none font-montserrat text-sm bg-krem transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCustomDateCancel}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-telaga-900/70 bg-telaga-50 hover:bg-telaga-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCustomDateSubmit}
                disabled={!tempStartDate || !tempEndDate}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${!tempStartDate || !tempEndDate
                  ? 'bg-telaga-50 text-telaga-900/40 cursor-not-allowed'
                  : 'text-white bg-telaga-700 hover:bg-telaga-800'
                  }`}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        employee={employee}
        onSuccess={handleEmployeeModalSuccess}
        mode={employeeModalMode}
      />

      {/* Performance Chart Modal */}
      <MonthlyPerformanceChart
        employeeId={id}
        isOpen={showPerformanceChart}
        onClose={() => setShowPerformanceChart(false)}
      />

      {/* Edit Delivery Modal */}
      {showEditDeliveryModal && editingDelivery && (
        <div
          className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowEditDeliveryModal(false)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-telaga-950">Edit Jarak Delivery</h3>
              <button
                onClick={() => setShowEditDeliveryModal(false)}
                className="p-1 hover:bg-telaga-50 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-telaga-900/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-krem rounded-lg">
              <p className="text-xs text-telaga-900/70">Tanggal: <span className="font-semibold text-telaga-950">{formatDate(editingDelivery.date)}</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-telaga-900 mb-1">Qty</label>
                <input
                  type="number"
                  value={editDeliveryForm.quantity}
                  onChange={(e) => setEditDeliveryForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-telaga-200 rounded-lg focus:ring-2 focus:border-telaga-600 focus:border-telaga-600 text-sm"
                  placeholder="Masukkan qty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-telaga-900 mb-1">Jarak (km)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editDeliveryForm.total_distance}
                  onChange={(e) => setEditDeliveryForm(prev => ({ ...prev, total_distance: e.target.value }))}
                  className="w-full px-3 py-2 border border-telaga-200 rounded-lg focus:ring-2 focus:border-telaga-600 focus:border-telaga-600 text-sm"
                  placeholder="Masukkan jarak"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowEditDeliveryModal(false)}
                className="flex-1 px-4 py-2 bg-telaga-50 text-telaga-900 rounded-lg hover:bg-telaga-100 transition-colors text-sm font-medium"
                disabled={savingDelivery}
              >
                Batal
              </button>
              <button
                onClick={handleSaveDeliveryEdit}
                disabled={savingDelivery}
                className="flex-1 px-4 py-2 bg-telaga-600 text-white rounded-lg hover:bg-telaga-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingDelivery ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
