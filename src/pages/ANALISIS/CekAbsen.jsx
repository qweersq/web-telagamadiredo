import { useState, useEffect } from "react";
import instance from "../../config/api";
import Header from "../../components/Com Header/Header";
import MonthYearPicker from "../../components/MonthYearPicker";
import { useNavigate } from "react-router-dom";
import { getHomeBeranda, getStoredRole } from "../../utils/roleValidator";
import LordIcon from "../../components/Design/LordIcon";
import { useLocation } from 'react-router-dom';
import AnimatedButton from "../../components/Design/AnimatedButton";
import { calculateAttendanceSummary } from "./calculateAttendanceSummary";
import { FaClock, FaCheckCircle, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import LoadingDots from "../../components/Design/LoadingDots";
import { getUserProfile } from "../../utils/userProfileHelper";

const CekAbsen = ({ hideBackButton, hideTitle, className = "pt-24", wrapperMode }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [absenData, setAbsenData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userData = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [selectedAbsent, setSelectedAbsent] = useState(null);
  const [endWorkTime, setEndWorkTime] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  const fetchAbsenReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from API
      const profile = await getUserProfile();
      const employeeId = profile?.user?.id;
      if (!employeeId) {
        setError("User tidak ditemukan.");
        setAbsenData([]);
        setLoading(false);
        return;
      }
      const res = await instance.get(`/absents-user/${employeeId}`, {
        params: { month, year }
      });
      console.log('API response:', res.data);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        // Map API data to table format
        const mapped = res.data.data.map(absen => ({
          id: absen.id,
          date: absen.date,
          clockIn: absen.clock_in,
          clockOut: absen.clock_out,
          status: absen.status ? absen.status.toLowerCase() : '-',
          description: absen.description || '-',
        }));
        console.log('Mapped absen data:', mapped);
        setAbsenData(mapped);
      } else {
        setAbsenData([]);
      }
    } catch (error) {
      console.error("Error fetching absen report:", error);
      setError("Gagal mengambil data absen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsenReport();
    checkAttendanceStatus();
  }, [month, year]);

  // Get Indonesia time (UTC+7)
  const getIndonesiaTime = () => {
    const now = new Date();
    // Convert to Indonesia timezone (UTC+7)
    const indonesiaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    return indonesiaTime;
  };

  // Check today's attendance status
  const checkAttendanceStatus = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile?.user?.id) return;

      const { data } = await instance.get('/get-profile');
      setAttendanceStatus(data.data);
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Validate location (simple distance check)
  const validateLocation = (currentLocation, branchLocation) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (currentLocation.latitude - branchLocation.latitude) * Math.PI / 180;
    const dLon = (currentLocation.longitude - branchLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(branchLocation.latitude * Math.PI / 180) * Math.cos(currentLocation.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers

    return distance <= 0.5; // Allow 500m radius
  };

  // Handle attendance check-in
  const handleAbsenMasuk = async () => {
    try {
      setCheckingLocation(true);
      setLocationError(null);

      // Get user data
      const profile = await getUserProfile();
      if (!profile) {
        setLocationError('Data user tidak ditemukan');
        return;
      }

      // Get current location
      const currentLocation = await getCurrentLocation();
      console.log('Current location:', currentLocation);

      // For now, we'll skip location validation and just create attendance
      // In production, you would validate against branch coordinates
      
      // Get current time in Indonesia timezone
      const now = new Date();
      
      // Create a new date object for Indonesia timezone
      const indonesiaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      
      // Format date as YYYY-MM-DD
      const year = indonesiaTime.getFullYear();
      const month = String(indonesiaTime.getMonth() + 1).padStart(2, '0');
      const day = String(indonesiaTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Format time as HH:mm:ss
      const hours = String(indonesiaTime.getHours()).padStart(2, '0');
      const minutes = String(indonesiaTime.getMinutes()).padStart(2, '0');
      const seconds = String(indonesiaTime.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      
      console.log('Current time (UTC):', now.toISOString());
      console.log('Indonesia time object:', indonesiaTime);
      console.log('Date string:', dateStr);
      console.log('Time string:', timeStr);

      const absentData = {
        employee_id: userData.id,
        branch_id: userData.branch_id,
        date: dateStr,
        clock_in: timeStr,
        status: 'hadir',
        description: 'Absen masuk hari ini'
      };

      console.log('Creating attendance with data:', absentData);

      const { data } = await instance.post('/absents', absentData);
      
      console.log('Attendance created successfully:', data);
      
      // Refresh data
      await fetchAbsenReport();
      await checkAttendanceStatus();
      
      setShowAbsenModal(false);
      alert('Absensi berhasil! Selamat bekerja.');
      
    } catch (error) {
      console.error('Error during attendance:', error);
      setLocationError(error.message);
    } finally {
      setCheckingLocation(false);
    }
  };

  // Format time by combining date and time string
  const formatTime = (dateString, timeString) => {
    if (!dateString || !timeString) return "-";
    const dateTime = `${dateString}T${timeString}`;
    const dateObj = new Date(dateTime);
    if (isNaN(dateObj)) return "-";
    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Format date to only show day (numeric)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric"
    });
  };

  const handleBack = () => {
    const previousPage = sessionStorage.getItem('previousPage');
    
    // Default ke beranda teknisi jika tidak ada previous page
    if (!previousPage) {
      navigate(getHomeBeranda(getStoredRole()));
      return;
    }

    // Navigasi ke halaman sebelumnya berdasarkan path yang tersimpan
    switch (previousPage) {
      case '/berandakurir':
        navigate('/berandakurir');
        break;
      case '/berandakasir':
        navigate('/berandakasir');
        break;
      case '/berandateknisi':
        navigate('/berandateknisi');
        break;
      default:
        navigate(getHomeBeranda(getStoredRole()));
    }
  };

  const handleSetCurrentDate = () => {
    const currentDate = new Date();
    setMonth(currentDate.getMonth() + 1);
    setYear(currentDate.getFullYear());
  };

  // Handle end work button click
  const handleEndWorkClick = (absen) => {
    setSelectedAbsent(absen);
    setEndWorkTime('17:00'); // Default time
    setShowEndWorkModal(true);
  };

  // Handle end work submission
  const handleEndWork = async () => {
    if (!endWorkTime) {
      alert('Silakan pilih jam pulang');
      return;
    }

    try {
      setUpdating(true);
      
      // Prepare end work data
      const endWorkData = {
        clock_out: endWorkTime,
        description: 'Manual end work - User input'
      };

      // Call the end work API
      await instance.put(`/absents/${selectedAbsent.id}`, endWorkData);
      
      // Refresh data
      await fetchAbsenReport();
      setShowEndWorkModal(false);
      alert('Absensi berhasil diupdate');
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Gagal mengupdate absensi');
    } finally {
      setUpdating(false);
    }
  };

  const displayedData = showAll ? absenData : absenData?.slice(0, 5);

  // Gunakan utility untuk menghitung ringkasan kehadiran
  const summary = calculateAttendanceSummary(absenData);

  // Validasi bulan dan tahun berjalan
  const isFutureMonth = (year > new Date().getFullYear()) || (year === new Date().getFullYear() && month > new Date().getMonth() + 1);

  if (wrapperMode) {
    return (
      <div>
        {/* ... existing wrapper mode content ... */}
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <Header />
      <main className={`${className} px-4 md:px-10 pb-10 flex-1 overflow-y-auto`}>
        {!hideBackButton && (
          <div className="flex items-center gap-3 mb-4">
            <AnimatedButton
              onClick={handleBack}
              className="p-2 rounded-full w-[41px] h-[41px] flex items-center justify-center outline outline-2 outline-[#EEF1F7]"
              title="Kembali"
            >
              <LordIcon 
                src="https://cdn.lordicon.com/jeuxydnh.json"
                trigger="loop"
                colors="primary:#57AEFF"
                style={{width: 41, height: 41}}
              />
            </AnimatedButton>
            {!hideTitle && <h1 className="text-lg font-semibold font-montserrat">Daftar Kehadiran</h1>}
          </div>
        )}

        {/* Month Year Picker */}
        <div className="mb-2 rounded-3xl p-4 mt-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
          <h2 className="text-lg font-semibold font-montserrat mb-3">Rentang Waktu</h2>
          <div className="flex gap-2">
            <input
              type="month"
              value={`${year}-${month < 10 ? "0" + month : month}`}
              onChange={(e) => {
                const [selectedYear, selectedMonth] = e.target.value.split("-");
                setYear(parseInt(selectedYear));
                setMonth(parseInt(selectedMonth));
              }}
              className="flex-1 bg-gray-100 text-gray-600 shadow shadow-white opacity-100 outline outline-2 outline-[#EEF1F7] w-full p-2 rounded-xl font-semibold"
            />
            {/* <AnimatedButton
              onClick={handleSetCurrentDate}
              className="px-4 rounded-xl font-semibold"
              variant="blue"
            >
              Sekarang
            </AnimatedButton> */}
          </div>
        </div>

        {/* Attendance Status & Action */}
        {attendanceStatus && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3">
                  {attendanceStatus.isAbsent ? (
                    <FaCheckCircle className="text-green-500 text-lg font-semibold" />
                  ) : (
                    <FaClock className="text-orange-500 text-lg font-semibold" />
                  )}
                </div>
                <div>
                  <h3 className="font-montserrat text-lg">
                    {attendanceStatus.isAbsent ? "Sudah Absen Hari Ini" : "Belum Absen Hari Ini"}
                  </h3>
                  <p className="font-montserrat text-sm text-gray-600">
                    {attendanceStatus.isAbsent 
                      ? "Anda sudah melakukan absensi hari ini"
                      : "Silakan lakukan absensi untuk hari ini"
                    }
                  </p>
                </div>
              </div>
              
              {!attendanceStatus.isAbsent && (
                <AnimatedButton
                  onClick={() => setShowAbsenModal(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-montserrat text-sm"
                >
                  <FaMapMarkerAlt className="inline mr-1" />
                  Absen Masuk
                </AnimatedButton>
              )}
            </div>
          </div>
        )}

        {/* Validasi bulan/tahun berjalan */}
        {isFutureMonth ? (
          <div className="mb-4 bg-yellow-100 text-yellow-800 rounded-3xl p-4 mt-4 outline outline-2 outline-[#EEF1F7] text-center font-semibold">
            Data atau informasi untuk bulan dan tahun tersebut belum tersedia. Mohon menunggu hingga admin melakukan update informasinya.
          </div>
        ) : (
          <>
            {/* Absen Report */}
            <div className="mb-2 rounded-3xl p-4 mt-4 outline outline-2 outline-[#EEF1F7]">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : !absenData || absenData.length === 0 ? (
                <div className="text-center py-4">Tidak ada data absen</div>
              ) : (
                <>
                  <div
                    className={`space-y-2 ${showAll ? "max-h-[400px] overflow-y-auto" : ""}`}
                  >
                    {displayedData.map((absen, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        {/* Compact row layout */}
                        <div className="flex items-center justify-between text-sm">
                          {/* Left side - Date and times */}
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Tanggal */}
                            <div className="min-w-[40px]">
                              <div className="font-montserrat text-sm text-gray-800">
                                {formatDate(absen.date)}
                              </div>
                            </div>
                            
                            {/* Jam Masuk */}
                            <div className="min-w-[50px]">
                              <div className="text-xs text-gray-600">Masuk</div>
                              <div className="font-montserrat text-xs text-gray-800">
                                {formatTime(absen.date, absen.clockIn)}
                              </div>
                            </div>
                            
                            {/* Jam Keluar */}
                            <div className="min-w-[50px]">
                              <div className="text-xs text-gray-600">Keluar</div>
                              <div className="font-montserrat text-xs text-gray-800">
                                {absen.clockOut ? (
                                  formatTime(absen.date, absen.clockOut)
                                ) : (
                                  <span className="text-gray-400 italic text-xs">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - Status and Action */}
                          <div className="flex items-center space-x-2">
                            {/* Status */}
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-montserrat whitespace-nowrap ${
                                absen.status === "hadir"
                                  ? "bg-green-100 text-green-800"
                                  : absen.status === "izin"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {absen.status}
                            </span>
                            
                            {/* Aksi */}
                            <div className="min-w-[50px] text-right">
                              {!absen.clockOut && absen.status === "hadir" ? (
                                <AnimatedButton
                                  onClick={() => handleEndWorkClick(absen)}
                                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded flex items-center gap-1"
                                >
                                  <FaClock className="text-xs" />
                                  End
                                </AnimatedButton>
                              ) : absen.clockOut ? (
                                <span className="text-green-600 text-xs flex items-center justify-end gap-1">
                                  <FaCheckCircle className="text-xs" />
                                  ✓
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Evaluasi/Deskripsi - baris terpisah jika ada */}
                        {absen.description && absen.description !== '-' && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-600 font-montserrat">Evaluasi:</div>
                            <div className="text-xs text-gray-700 font-montserrat">
                              {absen.description}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {absenData.length > 5 && (
                    <div className="mt-4 text-center">
                      <AnimatedButton
                        onClick={() => setShowAll(!showAll)}
                        className=" px-4 py-2"
                        variant="blue"
                      >
                        {showAll ? "Tampilkan Lebih Sedikit" : "Tampilkan Semua"}
                      </AnimatedButton>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Ringkasan Kehadiran hanya muncul jika data tersedia dan bukan bulan/tahun depan */}
            {!loading && !error && absenData && absenData.length > 0 && !isFutureMonth && (
              <div className="mb-2 rounded-3xl p-4 mt-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
                <h2 className="text-lg font-semibold font-montserrat mb-3">Ringkasan Kehadiran</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <div className="text-sm text-gray-600">Total Kehadiran</div>
                    <div className="text-lg font-semibold font-semibold text-[#2E7CF6]">
                      {summary?.totalHadir} Hari
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <div className="text-sm text-gray-600">Total Alpha</div>
                    <div className="text-lg font-semibold font-semibold text-[#2E7CF6]">
                      {summary?.totalAlpha} Hari
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <div className="text-sm text-gray-600">Total Izin</div>
                    <div className="text-lg font-semibold font-semibold text-[#2E7CF6]">
                      {summary?.totalIzin} Hari
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <div className="text-sm text-gray-600">Total Jam Kerja</div>
                    <div className="text-lg font-semibold font-semibold text-[#2E7CF6]">
                      {summary?.totalJamKerja.toFixed(1)} Jam
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* End Work Modal */}
      {showEndWorkModal && selectedAbsent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowEndWorkModal(false)}
            />
            
            {/* Modal content */}
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-1 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-semibold font-montserrat mb-4">
                      Selesaikan Absensi
                    </h3>
                    
                    <div className="mb-4">
                      <p className="font-montserrat text-sm text-gray-600 mb-2">
                        Pilih jam pulang untuk absensi:
                      </p>
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="font-montserrat text-sm">
                          <strong>Tanggal:</strong> {formatDate(selectedAbsent.date)}
                        </p>
                        <p className="font-montserrat text-sm">
                          <strong>Jam Masuk:</strong> {formatTime(selectedAbsent.date, selectedAbsent.clockIn)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
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
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <AnimatedButton
                  onClick={handleEndWork}
                  disabled={updating || !endWorkTime}
                  className="w-full sm:w-auto sm:ml-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-montserrat disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {updating ? 'Menyimpan...' : 'Simpan'}
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setShowEndWorkModal(false)}
                  className="w-full sm:w-auto mt-3 sm:mt-0 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-montserrat"
                >
                  Batal
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Absen Modal */}
      {showAbsenModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <FaMapMarkerAlt className="text-blue-600 text-xl" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-montserrat text-gray-900 mb-2">
                  Absen Masuk Hari Ini
                </h3>
                <p className="font-montserrat text-sm text-gray-600 mb-4">
                  Pastikan Anda berada di lokasi kantor untuk melakukan absensi
                </p>

                {locationError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="text-red-500 text-sm mr-2" />
                      <p className="text-red-700 text-sm font-montserrat">{locationError}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="font-montserrat text-sm text-gray-600">
                    <strong>Waktu:</strong> {new Date().toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <AnimatedButton
                onClick={handleAbsenMasuk}
                disabled={checkingLocation}
                className="w-full sm:w-auto sm:ml-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-montserrat disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {checkingLocation ? (
                  <div className="flex items-center justify-center">
                    <LoadingDots />
                    <span className="ml-2">Memproses...</span>
                  </div>
                ) : (
                  'Absen Masuk'
                )}
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowAbsenModal(false);
                  setLocationError(null);
                }}
                className="w-full sm:w-auto mt-3 sm:mt-0 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-montserrat"
              >
                Batal
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CekAbsen;
