import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance, { API_URL } from "../../config/api";
import Header from "../../components/Com Header/Header";
import AnimatedButton from "../../components/Design/AnimatedButton";
import LoadingDots from "../../components/Design/LoadingDots";
import PhotoGalleryModal from "../../components/Modal/PhotoGalleryModal";
import { FaTruck, FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaRoad, FaGasPump } from 'react-icons/fa';
import { getUserProfile } from "../../utils/userProfileHelper";
import { resizeImageFile } from "../ORDER/components/OrderDetail/ImageResizeUtil";

const UnifiedTransportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [transportList, setTransportList] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Helper function to create full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}/${imagePath}`;
  };

  // Helper function to open photo gallery
  const handleOpenPhotoGallery = (photos, initialIndex = 0) => {
    if (photos && photos.length > 0) {
      setGalleryPhotos(photos);
      setGalleryInitialIndex(initialIndex);
      setShowPhotoGallery(true);
    }
  };
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userData, setUserData] = useState(null);
  
  // Tab system
  const [activeTab, setActiveTab] = useState('odo'); // 'odo' or 'manual'
  
  // Form data
  const [formData, setFormData] = useState({
    odoStart: "",
    odoEnd: "",
    quantity: "",
    manualDistance: "", // For manual mode
  });
  
  // Photos
  const [photos, setPhotos] = useState({
    odoStart: null,
    odoEnd: null
  });
  
  const [previews, setPreviews] = useState({
    odoStart: null,
    odoEnd: null
  });
  
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Get user data from API
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
      
      console.log('✅ UnifiedTransportPage - getUserData from API:', userData);
      return userData;
    } catch (error) {
      console.error('[ERROR] UnifiedTransportPage - Failed to get userData from API:', error);
      return null;
    }
  };

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataFromAPI = await getUserData();
        if (userDataFromAPI) {
          setUserData(userDataFromAPI);
          console.log('✅ UnifiedTransportPage - User data loaded from API:', userDataFromAPI);
        }
      } catch (error) {
        console.error('❌ UnifiedTransportPage - Failed to load user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Fetch transport list
  const fetchTransportList = async (isListOnly = false) => {
    try {
      if (isListOnly) {
        setListLoading(true);
      }
      
      const userData = await getUserData();
      if (!userData?.id) return;

      const params = { 
        month: currentMonth, 
        year: currentYear,
        user_id: userData.id
      };
      
      console.log('Frontend - Fetching transport list with params:', params);
      
      const res = await instance.get('/deliveries', {
        params: params
      });

      if (res.data && res.data.success && res.data.data) {
        // Backend returns { statistics, deliveries, pagination }
        const deliveries = res.data.data.deliveries || [];
        setTransportList(deliveries);
      }
    } catch (error) {
      console.error('Error fetching transport list:', error);
      setTransportList([]);
    } finally {
      if (isListOnly) {
        setListLoading(false);
      }
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setError("");
    }
  };

  // Handle photo change
  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 2) {
      setError("Harap upload 2 foto sekaligus (ODO Mulai dan ODO Selesai)");
      return;
    }
    setError("");
    setUpdating(true);

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        
        // Resize foto sebelum processing
        const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
        const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [index === 0 ? 'odoStart' : 'odoEnd']: reader.result
          }));
        };
        reader.readAsDataURL(resizedFile);

        setPhotos(prev => ({
          ...prev,
          [index === 0 ? 'odoStart' : 'odoEnd']: resizedFile
        }));
      }
    } catch (err) {
      setError("Gagal resize foto. Silakan coba lagi.");
      console.error("Resize error:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Handle edit photo
  const handleEditPhoto = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUpdating(true);
        try {
          // Resize foto sebelum processing
          const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
          const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews(prev => ({
              ...prev,
              [type]: reader.result
            }));
            setPhotos(prev => ({
              ...prev,
              [type]: resizedFile
            }));
          };
          reader.readAsDataURL(resizedFile);
        } catch (err) {
          setError("Gagal resize foto. Silakan coba lagi.");
          console.error("Resize error:", err);
        } finally {
          setUpdating(false);
        }
      }
    };
    input.click();
  };

  // Handle form submit
  const handleSubmit = () => {
    // Validasi input berdasarkan mode
    if (activeTab === 'odo') {
      if (!formData.odoStart.trim() || !formData.odoEnd.trim() || !formData.quantity.trim()) {
        setError("Semua field harus diisi");
        return;
      }

      if (!photos.odoStart || !photos.odoEnd) {
        setError("Harap upload foto ODO Mulai dan ODO Selesai");
        return;
      }

      const odoStartNum = parseInt(formData.odoStart);
      const odoEndNum = parseInt(formData.odoEnd);

      if (isNaN(odoStartNum) || isNaN(odoEndNum)) {
        setError("ODO Mulai dan ODO Selesai harus berupa angka");
        return;
      }

      if (odoStartNum >= odoEndNum) {
        setError("ODO Selesai harus lebih besar dari ODO Mulai");
        return;
      }
    } else {
      // Manual mode validation
      if (!formData.manualDistance.trim() || !formData.quantity.trim()) {
        setError("Semua field harus diisi");
        return;
      }

      const manualDistanceNum = parseInt(formData.manualDistance);
      if (isNaN(manualDistanceNum) || manualDistanceNum <= 0) {
        setError("Total jarak harus berupa angka yang valid");
        return;
      }
    }

    // Jika semua validasi berhasil, langsung submit tanpa modal
    setError("");
    
    // Auto-calculate fuel cost (simplified calculation)
    let totalDistance;
    if (activeTab === 'odo') {
      const odoStartNum = parseInt(formData.odoStart);
      const odoEndNum = parseInt(formData.odoEnd);
      totalDistance = odoEndNum - odoStartNum;
    } else {
      totalDistance = parseInt(formData.manualDistance);
    }
    
    // Simple fuel calculation: 1 liter per 30km, Rp 10,000 per liter
    const fuelCost = Math.ceil(totalDistance / 30) * 10000;
    
    handleConfirm(fuelCost);
  };

  // Handle confirm (create)
  const handleConfirm = async (fuelCost) => {
    try {
      setUpdating(true);

      const userData = await getUserData();
      const quantityNum = parseInt(formData.quantity);
      const today = new Date().toISOString().slice(0, 10);
      
      let payload;

      if (activeTab === 'odo') {
        // 1. Upload photos for ODO mode
        const uploadForm = new FormData();
        uploadForm.append('photos', photos.odoStart);
        uploadForm.append('photos', photos.odoEnd);
        const uploadRes = await instance.post('/uploads-odo', uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadedUrls = uploadRes.data?.data || [];
        if (!uploadedUrls[0] || !uploadedUrls[1]) {
          throw new Error('Gagal upload foto, URL tidak ditemukan');
        }

        // 2. Create transport data for ODO mode
        const odoStartNum = parseInt(formData.odoStart);
        const odoEndNum = parseInt(formData.odoEnd);
        const totalDistance = odoEndNum - odoStartNum;
        
        payload = {
          users_id: userData.id,
          quantity: quantityNum,
          date: today,
          odoStart: odoStartNum,
          odoEnd: odoEndNum,
          totalDistance: totalDistance,
          totalCost: fuelCost,
          odoStartPhoto: uploadedUrls[0].url_photo,
          odoEndPhoto: uploadedUrls[1].url_photo,
        };
      } else {
        // Manual mode - auto-calculate ODO values
        const manualDistanceNum = parseInt(formData.manualDistance);
        const odoStart = 1;
        const odoEnd = 1 + manualDistanceNum;
        
        payload = {
          users_id: userData.id,
          quantity: quantityNum,
          date: today,
          odoStart: odoStart,
          odoEnd: odoEnd,
          totalDistance: manualDistanceNum,
          totalCost: fuelCost,
          odoStartPhoto: null,
          odoEndPhoto: null,
        };
      }

      await instance.post('/deliveries-odo', payload);
      
      // Refresh data
      await fetchTransportList(true);
      
      // Reset form
      resetForm();
      setShowForm(false);
      
      alert('Data transport berhasil disimpan!');
      
    } catch (error) {
      console.error("Error submitting data:", error);
      setError(
        error.response?.data?.message || error.message || "Terjadi kesalahan saat menyimpan data"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle edit
  const handleEdit = (transport) => {
    setSelectedTransport(transport);
    setFormData({
      odoStart: transport.odo_start?.toString() || "",
      odoEnd: transport.odo_end?.toString() || "",
      quantity: transport.quantity?.toString() || "",
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data transport ini?')) return;
    
    try {
      await instance.delete(`/deliveries/${id}`);
      await fetchTransportList(true);
      alert('Data transport berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting transport:', error);
      alert('Gagal menghapus data transport');
    }
  };

  // Handle view detail
  const handleViewDetail = (transport) => {
    setSelectedTransport(transport);
    setShowDetailModal(true);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ odoStart: "", odoEnd: "", quantity: "", manualDistance: "" });
    setPhotos({ odoStart: null, odoEnd: null });
    setPreviews({ odoStart: null, odoEnd: null });
    setError("");
    setActiveTab('odo'); // Reset to default tab
  };

  // Handle back
  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchTransportList();
      } catch (error) {
        setError('Gagal memuat data transport');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Separate effect for month/year changes
  useEffect(() => {
    if (currentMonth && currentYear) {
      fetchTransportList(true);
    }
  }, [currentMonth, currentYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showBackButton={true} 
        onBack={handleBack}
        title="Transport"
      />
      
      <div className="p-4 space-y-4 pt-[90px]">
        {/* Month Picker */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaCalendarAlt className="text-blue-500" />
            <span className="font-montserrat text-gray-800">Pilih Bulan</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={`${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`}
              onChange={(e) => {
                const [selectedYear, selectedMonth] = e.target.value.split("-");
                setCurrentYear(parseInt(selectedYear));
                setCurrentMonth(parseInt(selectedMonth));
              }}
              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-montserrat"
            />
          </div>
        </div>

        {/* Add Transport Button */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaTruck className="text-green-500" />
              <span className="font-montserrat text-gray-800">Data Transport</span>
            </div>
            <AnimatedButton
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 font-montserrat text-white rounded-lg flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Tambah Data
            </AnimatedButton>
          </div>
        </div>

        {/* Transport List */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaRoad className="text-blue-500" />
            <span className="font-montserrat text-gray-800">Riwayat Transport</span>
          </div>

          {listLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                  {/* Header skeleton */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-12"></div>
                  </div>
                  
                  {/* Content grid skeleton */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="h-3 bg-gray-300 rounded w-12 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="h-3 bg-gray-300 rounded w-12 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                  
                  {/* ODO info skeleton (optional) */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </div>
                  </div>
                  
                  {/* Actions skeleton */}
                  <div className="flex items-center justify-end space-x-2">
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : transportList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaTruck className="text-4xl mx-auto mb-2 text-gray-300" />
              <p className="font-montserrat text-sm">Tidak ada data transport</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transportList.map((transport, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  {/* Header - Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-montserrat text-lg text-gray-800">
                      {formatDate(transport.date)}
                    </div>
                    <div className="text-xs text-gray-500 font-montserrat">
                      ID: {transport.id}
                    </div>
                  </div>
                  
                  {/* Content - Grid layout */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Distance */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 font-montserrat mb-1">Jarak</div>
                      <div className="font-montserrat text-sm text-gray-800 font-semibold">
                        {transport.total_distance || 0} km
                      </div>
                    </div>
                    
                    {/* Cost */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 font-montserrat mb-1">Biaya</div>
                      <div className="font-montserrat text-sm text-gray-800 font-semibold">
                        {formatCurrency(transport.total_cost)}
                      </div>
                    </div>
                  </div>
                  
                  {/* ODO Info if available */}
                  {(transport.odo_start || transport.odo_end) && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {transport.odo_start && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-blue-600 font-montserrat mb-1">ODO Awal</div>
                          <div className="font-montserrat text-sm text-blue-800 font-semibold">
                            {transport.odo_start} km
                          </div>
                        </div>
                      )}
                      {transport.odo_end && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-green-600 font-montserrat mb-1">ODO Akhir</div>
                          <div className="font-montserrat text-sm text-green-800 font-semibold">
                            {transport.odo_end} km
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <AnimatedButton
                      onClick={() => handleViewDetail(transport)}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg flex items-center gap-1"
                    >
                      <FaEye className="text-xs" />
                      Lihat
                    </AnimatedButton>
                    {/* Only show Edit and Delete buttons for superadmin */}
                    {userData?.role === 'superadmin' && (
                      <>
                        <AnimatedButton
                          onClick={() => handleEdit(transport)}
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg flex items-center gap-1"
                        >
                          <FaEdit className="text-xs" />
                          Edit
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={() => handleDelete(transport.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg flex items-center gap-1"
                        >
                          <FaTrash className="text-xs" />
                          Hapus
                        </AnimatedButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h2 className=" text-xl text-gray-800 mb-2 font-montserrat">Tambah Data Transport</h2>
              <p className="font-montserrat text-gray-600 text-sm">
                {activeTab === 'odo' 
                  ? 'Data pada ODO Meter harus sesuai dengan bukti yang akan diupload!'
                  : 'Input total jarak tempuh dan jumlah pesanan'
                }
              </p>
            </div>

            {/* Tab System */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('odo')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-montserrat transition-colors ${
                  activeTab === 'odo'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Dengan ODO
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-montserrat transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Tanpa ODO
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4 font-montserrat text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* ODO Mode Fields */}
              {activeTab === 'odo' && (
                <>
                  <div>
                    <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
                      ODO Mulai
                    </label>
                    <input
                      type="text"
                      name="odoStart"
                      value={formData.odoStart}
                      onChange={handleInputChange}
                      className="h-10 w-full p-3 rounded-xl font-montserrat outline outline-1 outline-gray-200 placeholder:text-sm"
                      placeholder="Masukkan jarak mulai"
                      disabled={updating}
                    />
                  </div>

                  <div>
                    <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
                      ODO Selesai
                    </label>
                    <input
                      type="text"
                      name="odoEnd"
                      value={formData.odoEnd}
                      onChange={handleInputChange}
                      className="h-10 w-full p-3 rounded-xl outline outline-1 outline-gray-200 placeholder:text-sm font-montserrat"
                      placeholder="Masukkan jarak selesai"
                      disabled={updating}
                    />
                  </div>
                </>
              )}

              {/* Manual Mode Fields */}
              {activeTab === 'manual' && (
                <div>
                  <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
                    Total Jarak (KM)
                  </label>
                  <input
                    type="text"
                    name="manualDistance"
                    value={formData.manualDistance}
                    onChange={handleInputChange}
                    className="h-10 w-full p-3 rounded-xl font-montserrat outline outline-1 outline-gray-200 placeholder:text-sm"
                    placeholder="Masukkan total jarak tempuh"
                    disabled={updating}
                  />
                </div>
              )}

              <div>
                <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
                  Jumlah Order 
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="h-10 w-full p-3 rounded-xl font-montserrat outline outline-1 outline-gray-200 placeholder:text-sm"
                  placeholder="Masukkan jumlah pengantaran"
                  disabled={updating}
                />
              </div>

              {/* Photo Upload - Only for ODO Mode */}
              {activeTab === 'odo' && (
                <div>
                  <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
                    Foto ODO Mulai & Selesai
                  </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="odoPhotos"
                  multiple
                  required
                />
                <label
                  htmlFor="odoPhotos"
                  className="block w-full border-2 border-dashed border-[#5096FC] rounded-xl cursor-pointer hover:border-blue-400 transition-colors p-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Preview ODO Start */}
                    <div className="relative h-[100px]">
                      {previews.odoStart ? (
                        <>
                          <img
                            src={previews.odoStart}
                            alt="ODO Start Preview"
                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                            onClick={() => setSelectedPreview(previews.odoStart)}
                          />
                          <button
                            onClick={() => handleEditPhoto('odoStart')}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full rounded-lg outline outline-1 outline-gray-200 p-2 font-montserrat">
                          <span className="text-gray-500 text-sm text-center">
                            Foto ODO Mulai
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preview ODO End */}
                    <div className="relative h-[100px]">
                      {previews.odoEnd ? (
                        <>
                          <img
                            src={previews.odoEnd}
                            alt="ODO End Preview"
                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                            onClick={() => setSelectedPreview(previews.odoEnd)}
                          />
                          <button
                            onClick={() => handleEditPhoto('odoEnd')}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full rounded-lg outline outline-1 outline-gray-200 p-2 font-montserrat">
                          <span className="text-gray-500 text-sm text-center">
                            Foto ODO Selesai
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4 font-montserrat">
                    Silahkan upload 2 foto sekaligus (ODO Mulai & Selesai)
                  </p>
                </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <AnimatedButton
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={handleSubmit}
                disabled={updating || (activeTab === 'odo' && (!photos.odoStart || !photos.odoEnd))}
                className={`flex-1 py-2 font-montserrat text-center text-sm flex items-center justify-center ${
                  (updating || (activeTab === 'odo' && (!photos.odoStart || !photos.odoEnd))) 
                    ? "opacity-50 cursor-not-allowed bg-gray-400" 
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white rounded-lg`}
              >
                {updating ? "Menyimpan..." : "Selanjutnya"}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
          <div className="max-w-3xl max-h-[80vh] bg-white rounded-3xl overflow-hidden outline outline-2 outline-white">
            <img
              src={selectedPreview}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="p-4 bg-white flex justify-center">
              <AnimatedButton
                onClick={() => setSelectedPreview(null)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="font-montserrat text-xl text-gray-800 mb-2">Detail Transport</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-montserrat">Tanggal</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {formatDate(selectedTransport.date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-montserrat">Quantity</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {selectedTransport.quantity} item
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-montserrat">ODO Mulai</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {selectedTransport.odo_start} km
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-montserrat">ODO Selesai</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {selectedTransport.odo_end} km
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-montserrat">Total Jarak</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {selectedTransport.total_distance} km
                  </p>
                </div>
                {/* <div>
                  <label className="text-sm text-gray-600 font-montserrat">Total Biaya</label>
                  <p className="font-montserrat text-gray-800 font-semibold">
                    {formatCurrency(selectedTransport.total_cost)}
                  </p>
                </div> */}
              </div>

              {/* Photos */}
              {(selectedTransport.odo_start_photo_url || selectedTransport.odo_end_photo_url) && (
                <div>
                  <label className="text-sm text-gray-600 font-montserrat mb-2 block">Foto ODO</label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTransport.odo_start_photo_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ODO Mulai</p>
                        <img
                          src={getFullImageUrl(selectedTransport.odo_start_photo_url)}
                          alt="ODO Start"
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const photos = [
                              { url_photo: getFullImageUrl(selectedTransport.odo_start_photo_url) }
                            ];
                            if (selectedTransport.odo_end_photo_url) {
                              photos.push({ url_photo: getFullImageUrl(selectedTransport.odo_end_photo_url) });
                            }
                            handleOpenPhotoGallery(photos, 0);
                          }}
                        />
                      </div>
                    )}
                    {selectedTransport.odo_end_photo_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ODO Selesai</p>
                        <img
                          src={getFullImageUrl(selectedTransport.odo_end_photo_url)}
                          alt="ODO End"
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const photos = [];
                            if (selectedTransport.odo_start_photo_url) {
                              photos.push({ url_photo: getFullImageUrl(selectedTransport.odo_start_photo_url) });
                            }
                            photos.push({ url_photo: getFullImageUrl(selectedTransport.odo_end_photo_url) });
                            handleOpenPhotoGallery(photos, selectedTransport.odo_start_photo_url ? 1 : 0);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <AnimatedButton
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                Tutup
              </AnimatedButton>
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

export default UnifiedTransportPage;
