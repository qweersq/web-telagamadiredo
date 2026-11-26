import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '../../config/api';
import Header from '../../components/Com Header/Header';
import AnimatedButton from '../../components/Design/AnimatedButton';
import LoadingDots from '../../components/Design/LoadingDots';
import { getUserProfile, invalidateUserProfileCache } from '../../utils/userProfileHelper';
import { uploadSinglePhoto } from '../../utils/uploadHelper';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaSignOutAlt, FaCamera, FaTimes } from 'react-icons/fa';

const EndWorkPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [endWorkTime, setEndWorkTime] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aiNote, setAiNote] = useState(null);

  const resetPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handlePhotoPicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    try {
      // Resolusi lebih tinggi dari default supaya teks watermark tetap terbaca AI.
      return await uploadSinglePhoto(photoFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
    } catch (uploadError) {
      console.warn('Upload foto absen gagal, absen tetap dilanjutkan:', uploadError.message);
      return null;
    }
  };

  // Get user data from API
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };
      
      // Untuk role admin dan employee, gunakan data asli dari login
      // Untuk superadmin, gunakan data yang mungkin sudah diupdate dengan branch selection
      if (userData.role === 'admin' || userData.role === 'employee') {
        return {
          ...userData,
          selected_role: undefined,
          branch_name: undefined,
          branch_address: undefined
        };
      }
      
      return userData;
    } catch (error) {
      console.error('Error parsing userData:', error);
      return null;
    }
  };

  // Check attendance status
  const checkAttendanceStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = getUserData();
      if (!userData) {
        setError('User data not found');
        return;
      }

      // Call get-profile to check attendance status
      const { data } = await instance.get('/get-profile');
      
      setAttendanceData(data.data);
      
      // Set default end work time to current time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      setEndWorkTime(currentTime);
      
    } catch (error) {
      console.error('Error checking attendance:', error);
      setError('Gagal memeriksa status kehadiran');
    } finally {
      setLoading(false);
    }
  };

  // Handle end work submission
  const handleEndWork = async () => {
    if (!endWorkTime) {
      alert('Silakan pilih jam pulang');
      return;
    }

    if (!photoFile) {
      alert('Foto bukti pulang wajib diunggah. Gunakan aplikasi GPS Camera agar tanggal, jam, dan lokasi terlihat.');
      return;
    }

    try {
      setUpdating(true);
      
      const userData = getUserData();
      if (!userData) {
        alert('User data not found');
        return;
      }

      // Check if user has current absent data
      if (!attendanceData?.todayAbsent?.id) {
        alert('Tidak ada data absensi yang aktif. Silakan absen masuk terlebih dahulu.');
        return;
      }

      // Prepare end work data
      const photoUrl = await uploadPhoto();
      if (!photoUrl) {
        alert('Foto gagal diunggah. Periksa koneksi lalu pilih ulang foto.');
        return;
      }
      const absentId = attendanceData.todayAbsent.id;

      // Ambil koordinat untuk validasi radius kantor di backend.
      let coords = null;
      try {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });
      } catch {
        coords = null;
      }

      const endWorkData = {
        clock_out: endWorkTime,
        description: 'Absen pulang (foto GPS camera)',
        photo_clock_out: photoUrl,
        ...(coords && {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy
        })
      };

      // Call the end work API (using the correct route)
      await instance.put(`/absents/${absentId}`, endWorkData);

      // Pastikan beranda (dan header) membaca ulang status absen terbaru
      invalidateUserProfileCache();

      // Verifikasi AI dipicu otomatis oleh backend di background.
      setAiNote('Foto bukti pulang sedang diverifikasi AI.');

      setShowSuccess(true);
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate(-1); // Go back to previous page
      }, 2000);
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Gagal mengupdate absensi');
    } finally {
      setUpdating(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("workStartTime");
    sessionStorage.removeItem("fromPresent");
    sessionStorage.removeItem("fromIzin");
    navigate('/');
  };

  useEffect(() => {
    checkAttendanceStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 font-montserrat mb-4">{error}</p>
          <AnimatedButton
            onClick={checkAttendanceStatus}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Coba Lagi
          </AnimatedButton>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h2 className="text-lg font-semibold font-montserrat text-green-600 mb-2">Absensi Berhasil!</h2>
          <p className="font-montserrat text-gray-600 mb-4">
            Anda telah berhasil absen pulang pada jam {endWorkTime}
          </p>
          {aiNote && (
            <p className="font-montserrat text-sm text-green-600 mb-4">{aiNote}</p>
          )}
          <p className="font-montserrat text-sm text-gray-500">
            Mengalihkan ke halaman sebelumnya...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-semibold font-montserrat text-center mb-6">Absen Pulang</h1>
          
          {/* Current Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="mb-4">
                <FaClock className="text-blue-500 text-4xl mx-auto" />
              </div>
              
              <h2 className="text-xl font-montserrat mb-2">Status Kehadiran</h2>
              
              {attendanceData?.todayAbsent ? (
                <div className="space-y-2 font-montserrat text-sm text-gray-600">
                  <p><strong>Jam Masuk:</strong> {attendanceData.todayAbsent.clock_in}</p>
                  <p><strong>Status:</strong> Sedang bekerja</p>
                </div>
              ) : (
                <p className="font-montserrat text-gray-600 mb-4">
                  Tidak ada data absensi yang aktif
                </p>
              )}
            </div>
          </div>

          {/* End Work Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-montserrat mb-4">Absen Pulang</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-montserrat text-gray-700 mb-2">
                  Jam Pulang:
                </label>
                <input
                  type="time"
                  value={endWorkTime}
                  onChange={(e) => setEndWorkTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Foto bukti pulang dari aplikasi GPS Camera */}
              <div>
                <label className="block text-sm font-montserrat text-gray-700 mb-2">
                  Foto Bukti Pulang:
                </label>
                <p className="font-montserrat text-xs text-gray-500 mb-2">
                  Pakai foto dari aplikasi GPS Camera (ada watermark tanggal, jam, dan lokasi).
                </p>

                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Foto bukti absen pulang"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={resetPhoto}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:border-red-400 hover:text-red-500">
                    <FaCamera />
                    <span className="text-xs font-montserrat">Pilih foto dari GPS Camera</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPicked} />
                  </label>
                )}
              </div>

              <AnimatedButton
                onClick={handleEndWork}
                disabled={updating || !endWorkTime || !photoFile || !attendanceData?.todayAbsent}
                className={`w-full py-3 px-4 rounded-lg font-montserrat ${
                  updating || !endWorkTime || !attendanceData?.todayAbsent
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {updating ? 'Menyimpan...' : 'Absen Pulang'}
              </AnimatedButton>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-blue-500 text-lg mr-3 mt-0.5" />
              <div>
                <h4 className="font-montserrat text-blue-800 mb-1">Informasi</h4>
                <p className="font-montserrat text-sm text-blue-700">
                  Pastikan jam pulang yang Anda pilih sudah benar. 
                  Data ini akan digunakan untuk menghitung jam kerja Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndWorkPage;
