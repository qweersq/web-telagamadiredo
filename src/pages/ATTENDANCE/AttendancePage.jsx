import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '../../config/api';
import Header from '../../components/Com Header/Header';
import AnimatedButton from '../../components/Design/AnimatedButton';
import LoadingDots from '../../components/Design/LoadingDots';
import { getUserProfile } from '../../utils/userProfileHelper';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaSignOutAlt } from 'react-icons/fa';

const AttendancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [endWorkTime, setEndWorkTime] = useState('');
  const [updating, setUpdating] = useState(false);

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
      
      // Check for unfinished absent from yesterday
      if (data.data.hasUnfinishedAbsent) {
        setShowWarning(true);
      }
      
      // Check if user hasn't absent today
      if (data.data.isAbsent === false) {
        setShowWarning(true);
      }
      
    } catch (error) {
      console.error('Error checking attendance:', error);
      setError('Gagal memeriksa status kehadiran');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to attendance list for actions
  const handleGoToAttendanceList = () => {
    navigate('/cekabsen');
  };

  // Handle end work submission
  const handleEndWork = async () => {
    if (!endWorkTime) {
      alert('Silakan pilih jam pulang');
      return;
    }

    try {
      setUpdating(true);
      
      const userData = getUserData();
      if (!userData) {
        alert('User data not found');
        return;
      }

      // Update the unfinished absent with clock_out time
      const updateData = {
        clock_out: endWorkTime,
        description: 'Manual end work - User input'
      };

      await instance.put(`/absent/${attendanceData.unfinishedAbsentData.id}`, updateData);
      
      // Refresh attendance data
      await checkAttendanceStatus();
      setShowEndWorkModal(false);
      alert('Absensi berhasil diupdate');
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-semibold font-montserrat text-center mb-6">Status Kehadiran</h1>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
                <div>
                  <h3 className="font-montserrat text-red-800">Error!</h3>
                  <p className="font-montserrat text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for unfinished absent */}
          {showWarning && !error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 text-xl mr-3" />
                <div>
                  <h3 className="font-montserrat text-yellow-800">Perhatian!</h3>
                  <p className="font-montserrat text-sm text-yellow-700">
                    {attendanceData?.hasUnfinishedAbsent 
                      ? "Anda lupa absen pulang kemarin. Silakan selesaikan absensi kemarin terlebih dahulu."
                      : "Anda belum absen hari ini. Silakan lakukan absensi."
                    }
                  </p>
                  {attendanceData?.hasUnfinishedAbsent && attendanceData?.unfinishedAbsentData && (
                    <div className="mt-2 text-xs text-yellow-600">
                      <p>Tanggal: {attendanceData.unfinishedAbsentData.date}</p>
                      <p>Jam Masuk: {attendanceData.unfinishedAbsentData.clock_in}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="mb-4">
                {attendanceData?.isAbsent ? (
                  <FaCheckCircle className="text-green-500 text-4xl mx-auto" />
                ) : (
                  <FaClock className="text-orange-500 text-4xl mx-auto" />
                )}
              </div>
              
              <h2 className="text-xl font-montserrat mb-2">
                {attendanceData?.isAbsent ? "Sudah Absen" : "Belum Absen"}
              </h2>
              
              <p className="font-montserrat text-gray-600 mb-4">
                {attendanceData?.isAbsent 
                  ? "Anda sudah melakukan absensi hari ini"
                  : "Anda belum melakukan absensi hari ini"
                }
              </p>

              {/* Action Button - Navigate to attendance list */}
              <AnimatedButton
                onClick={handleGoToAttendanceList}
                className="w-full py-3 px-4 rounded-lg font-montserrat bg-blue-500 hover:bg-blue-600 text-white"
              >
                Kelola Kehadiran
              </AnimatedButton>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-montserrat text-lg mb-3">Informasi Kehadiran</h3>
            <div className="space-y-2 font-montserrat text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={attendanceData?.isAbsent ? "text-green-600" : "text-orange-600"}>
                  {attendanceData?.isAbsent ? "Hadir" : "Belum Hadir"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span>{new Date().toLocaleDateString('id-ID')}</span>
              </div>
              {attendanceData?.hasUnfinishedAbsent && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Catatan:</span>
                  <span className="text-red-600">Ada absensi kemarin yang belum selesai</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* End Work Modal */}
      {showEndWorkModal && (
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
                        Pilih jam pulang untuk absensi kemarin:
                      </p>
                      {attendanceData?.unfinishedAbsentData && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="font-montserrat text-sm">
                            <strong>Tanggal:</strong> {attendanceData.unfinishedAbsentData.date}
                          </p>
                          <p className="font-montserrat text-sm">
                            <strong>Jam Masuk:</strong> {attendanceData.unfinishedAbsentData.clock_in}
                          </p>
                        </div>
                      )}
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
    </div>
  );
};

export default AttendancePage;
