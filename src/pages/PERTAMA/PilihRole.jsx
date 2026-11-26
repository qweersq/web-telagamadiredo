import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmRoleModal from "../../components/Modal/ConfirmRoleModal";
import BranchSelectionModal from "../../components/Modal/BranchSelectionModal";
import RoleExplanationModal from "../../components/Modal/RoleExplanationModal";
import AttendancePromptModal from "../../components/Modal/AttendancePromptModal";
import AnimatedButton from "../../components/Design/AnimatedButton";
import { WithRole, BERANDA_ACCESS } from '../../utils/roleValidator';
import { canSwitchBranch } from '../../utils/roleValidator';
import { getUserProfile, getBranchId, getTenantId, switchBranch } from '../../utils/userProfileHelper';
import instance, { setAuthToken } from '../../config/api';

const PilihRole = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showRoleExplanationModal, setShowRoleExplanationModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRequired, setAttendanceRequired] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        // alert(profile);
        if (profile) {
          setUserProfile(profile);
        
        }
      } catch (error) {
        console.error('❌ Error fetching user profile in PilihRole:', error);
        
        // Let API interceptor handle all 402 errors automatically
        
        // For other errors, try to get user data from localStorage
        try {
          const userData = localStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            const fallbackProfile = {
              user: user,
              branch: null,
              tenant: null
            };
            setUserProfile(fallbackProfile);
            
          }
        } catch (fallbackError) {
          console.error('❌ Error parsing localStorage userData:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Check attendance status after userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      const userRole = userProfile.user?.role || userProfile.user?.user_role;
      if (userRole === 'admin' || userRole === 'employee') {
        checkAttendanceStatus();
      } else {
      }
    } else {
    }
  }, [userProfile]);

  // Check attendance status for Admin/Employee users
  const checkAttendanceStatus = () => {
    try {

      // If user hasn't attended today, show attendance modal
      if (userProfile?.isAbsent === false) {
        setAttendanceRequired(true);
        setShowAttendanceModal(true);
      } else {
        setAttendanceRequired(false);
      }
      
    } catch (error) {
      console.error('❌ Error checking attendance status:', error);
      // If error, don't show attendance modal
      setAttendanceRequired(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    
    // Show explanation modal for all roles, only once per role
    const userRole = userProfile?.user?.role || userProfile?.user?.user_role;
    
    // Get array of roles that user has already seen explanations for
    const seenRolesString = localStorage.getItem('seenRoleExplanations');
    const seenRoles = seenRolesString ? JSON.parse(seenRolesString) : [];
    const hasSeenThisRole = seenRoles.includes(role);
    
    
    if (!hasSeenThisRole) {
      // Just show the modal, don't mark as seen yet
      localStorage.setItem('selectedRoleForExplanation', role);
      setShowRoleExplanationModal(true);
    }
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      alert("Please select a role first");
      return;
    }
    
    if (!userProfile) {
      console.error('User profile not loaded yet');
      return;
    }
    
    // Check if role requires branch selection
    const rolesRequiringBranch = ['teknisi', 'kurir', 'kasir', 'admin', 'qc', 'supervisor', 'staff', 'dapur'];
    
    // Get user data from profile
    const userRole = userProfile.user?.role || userProfile.user?.user_role || null;
    const userTenantId = userProfile.tenant?.id || null;
    const userBranchId = userProfile.branch?.id || null;

    // Additional validation: Check if user is trying to access owner role without superadmin permission
    if (selectedRole === 'owner' && userRole !== 'superadmin') {
      console.error('❌ Access denied: User with role', userRole, 'tried to access owner role');
      alert('Anda tidak memiliki izin untuk mengakses role Owner');
      return;
    }
    
    // Logic untuk menentukan apakah perlu pilih cabang:
    // 1. superadmin & supervisor: bisa pilih cabang untuk peran yang butuh cabang
    // 2. employee: langsung ke role yang dipilih (sudah ada branch_id)
    // 3. Role lain: langsung ke role yang dipilih
    const userCanSwitchBranch = canSwitchBranch(userRole);

    const needsBranchSelection = 
      (userCanSwitchBranch && rolesRequiringBranch.includes(selectedRole)) ||
      (userRole === 'employee' && rolesRequiringBranch.includes(selectedRole) && !userBranchId);
    
    if (needsBranchSelection) {
      setShowBranchModal(true);
    } else {
      // Navigate directly to the selected role's dashboard
      navigateToRole(selectedRole, userBranchId);
    }
  };

  const navigateToRole = async (role, branchId = null) => {
    
    // Save role selection to localStorage for the session
    localStorage.setItem('selectedRole', role);
    if (branchId) {
      localStorage.setItem('selectedBranchId', branchId.toString());
    }
    
    // Navigate to appropriate dashboard
    switch (role) {
      case 'staff':
        navigate('/berandastaff');
        break;
      case 'teknisi':
        navigate('/berandateknisi');
        break;
      case 'kurir':
        navigate('/berandakurir');
        break;
      case 'admin':
        navigate('/berandakasir');
        break;
      case 'qc':
        navigate('/berandaqc');
        break;
      case 'dapur':
        navigate('/berandadapur');
        break;
      case 'owner':
        navigate('/berandaowner');
        break;
      case 'supervisor':
        navigate('/berandasupervisor');
        break;
      case 'superapp-admin':
        navigate('/superapp-dashboard');
        break;
      default:
        console.warn('❌ Unknown role:', role);
        navigate('/berandakasir'); // Default fallback
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setAttendanceRequired(false);
  };

  const handleNavigateToAttendance = () => {
    // Save current page to return after attendance
    sessionStorage.setItem('returnAfterAttendance', '/pilih-role');
    navigate('/attendance');
    setShowAttendanceModal(false);
  };

  const handleCloseBranchModal = () => {
    setShowBranchModal(false);
  };

  const handleCloseRoleExplanationModal = () => {
    setShowRoleExplanationModal(false);
    // Don't clear localStorage - keep the flag so modal won't show again
  };

  const handleConfirmRoleFromModal = () => {
    // Mark this role as seen when user clicks "Pilih Peran Ini"
    const seenRolesString = localStorage.getItem('seenRoleExplanations');
    const seenRoles = seenRolesString ? JSON.parse(seenRolesString) : [];
    
    if (!seenRoles.includes(selectedRole)) {
      const updatedSeenRoles = [...seenRoles, selectedRole];
      localStorage.setItem('seenRoleExplanations', JSON.stringify(updatedSeenRoles));
      
    }
    
    // Close modal and continue with role selection
    setShowRoleExplanationModal(false);
    
    // Continue with the normal flow
    handleContinue();
  };

  const handleBranchConfirm = async (selectedBranch, role) => {
    
    try {
      // Get current user role to determine if we need to switch branch
      const userRole = userProfile?.user?.role || userProfile?.user?.user_role;
      
      // Superadmin (owner) dan supervisor perlu switch branch via API
      if (canSwitchBranch(userRole)) {
        
        // Call API to switch branch using the same function as LogoutButton
        const updatedUserData = await switchBranch(selectedBranch.id);
        
        
        // Update userProfile state with new branch data
        setUserProfile(prev => ({
          ...prev,
          user: {
            ...prev.user,
            branch_id: updatedUserData.branch_id
          },
          branch: {
            id: updatedUserData.branch_id,
            name: updatedUserData.branch_name,
            address: updatedUserData.branch_address
          }
        }));
      }
      
      // Save selected branch to localStorage (same as LogoutButton)
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
      localStorage.setItem('selectedBranchId', selectedBranch.id.toString());
      localStorage.setItem('selectedBranchName', selectedBranch.name);
      localStorage.setItem('selectedRole', role);
      
      // Close branch modal
      setShowBranchModal(false);
      
      // Navigate to role (same as LogoutButton logic)
      navigateToRole(role, selectedBranch.id);
      
    } catch (error) {
      console.error('❌ Error switching branch:', error);
      alert('Gagal mengubah cabang. Silakan coba lagi.');
    }
  };

  // 🧪 TEMPORARY: Test refresh token functions
  const testInvalidAccessToken = () => {
    try {
      console.log('🧪 [Test] ========================================');
      console.log('🧪 [Test] SETTING INVALID ACCESS TOKEN');
      console.log('🧪 [Test] NO API CALL - ONLY UPDATE STORAGE');
      console.log('🧪 [Test] ========================================');
      
      // Set access token to invalid
      const invalidToken = 'invalid_access_token_12345';
      setAuthToken(invalidToken);
      localStorage.setItem('token', invalidToken);
      
      console.log('✅ [Test] Access token set to: invalid_access_token_12345');
      console.log('✅ [Test] Refresh token: TETAP VALID (tidak diubah)');
      console.log('✅ [Test] Tokens updated in localStorage only');
      console.log('✅ [Test] NO API CALL triggered by this button');
      console.log('ℹ️ [Test] Next: Navigate to other pages to trigger API calls');
      console.log('ℹ️ [Test] Expected: API call → 401 → auto refresh → success (if refresh token valid)');
      console.log('🧪 [Test] ========================================');
      
      alert(
        '✅ Test Setup Complete\n\n' +
        'Access token invalid telah di-set.\n\n' +
        'TIDAK ADA API CALL yang di-trigger.\n\n' +
        'Untuk melihat efeknya, buka menu/page lain untuk trigger API call.\n\n' +
        'App akan:\n' +
        '1. API call → 401\n' +
        '2. Auto refresh → success (jika refresh token valid)\n' +
        '3. Request retry dengan token baru → success'
      );
    } catch (error) {
      console.error('❌ [Test] Error setting invalid access token:', error);
      alert('Error: ' + error.message);
    }
  };

  const testInvalidRefreshToken = () => {
    try {
      console.log('🧪 [Test] ========================================');
      console.log('🧪 [Test] SETTING EXPIRED REFRESH TOKEN');
      console.log('🧪 [Test] ACCESS TOKEN: TETAP VALID (tidak diubah)');
      console.log('🧪 [Test] REFRESH TOKEN: EXPIRED');
      console.log('🧪 [Test] NO API CALL - ONLY UPDATE STORAGE');
      console.log('🧪 [Test] ========================================');
      
      // Get current access token (keep it valid)
      const currentAccessToken = localStorage.getItem('token');
      
      // Only set refresh token to expired - access token remains valid
      localStorage.setItem('refreshToken', 'expired_refresh_token_12345');
      
      console.log('✅ [Test] Access token: TETAP VALID (tidak diubah)');
      console.log('✅ [Test] Access token current:', currentAccessToken ? currentAccessToken.substring(0, 30) + '...' : 'null');
      console.log('✅ [Test] Refresh token set to: expired_refresh_token_12345');
      console.log('✅ [Test] Tokens updated in localStorage only');
      console.log('✅ [Test] NO API CALL triggered by this button');
      console.log('ℹ️ [Test] Next: Navigate to other pages');
      console.log('ℹ️ [Test] Expected flow:');
      console.log('   1. API call dengan access token valid → sukses (tidak 401)');
      console.log('   2. Jika access token expired nanti → 401');
      console.log('   3. Auto refresh dengan refresh token expired → gagal');
      console.log('   4. Logout otomatis');
      console.log('🧪 [Test] ========================================');
      
      alert(
        '✅ Test Setup Complete\n\n' +
        'Refresh token expired telah di-set.\n\n' +
        'Access token: TETAP VALID (tidak diubah)\n\n' +
        'TIDAK ADA API CALL yang di-trigger.\n\n' +
        'Sekarang buka menu/page lain.\n\n' +
        'Ketika access token expired nanti:\n' +
        '1. API call → 401\n' +
        '2. Auto refresh → gagal (refresh token expired)\n' +
        '3. Logout otomatis'
      );
    } catch (error) {
      console.error('❌ [Test] Error setting expired refresh token:', error);
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-krem px-6 py-10">
        <div className="w-full sm:w-[390px] p-6 sm:p-8 my-auto bg-white rounded-3xl shadow-xl shadow-telaga-900/5 outline outline-2 outline-telaga-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telaga-600 mx-auto mb-4"></div>
            <p className="text-telaga-900/60 text-sm font-montserrat">Memuat data pengguna...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-krem px-6 py-10">
        <div className="w-full sm:w-[390px] p-6 sm:p-8 my-auto bg-white rounded-3xl shadow-xl shadow-telaga-900/5 outline outline-2 outline-telaga-100">
          <div className="text-center">
            <p className="text-red-600 text-sm font-montserrat">Gagal memuat data pengguna. Silakan coba lagi.</p>
            <AnimatedButton
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                navigate('/login');
              }}
              className="mt-4 px-4 py-2 text-white rounded-xl font-montserrat text-sm"
              variant="telaga"
            >
              Kembali ke Login
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-krem px-6 py-10">
      <div className="w-full sm:w-[390px] p-6 sm:p-8 my-auto bg-white rounded-3xl shadow-xl shadow-telaga-900/5 outline outline-2 outline-telaga-100">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/images/telagamadiredo-logo.svg"
              alt="Agrowisata Telaga Madiredo"
              className="h-14 w-14"
            />
          </div>
          <div className="text-[10px] font-montserrat font-light text-telaga-700/70 tracking-[0.18em] uppercase mb-3">
            Spirit of Nature &middot; Pool &amp; Resto
          </div>
          <h1 className="text-lg font-semibold font-montserrat text-telaga-950 text-center mb-2">
            Pilih peran Anda
          </h1>
          <p className="text-center text-telaga-900/60 text-sm font-montserrat">
            Pilih peran sesuai posisi Anda di Telaga Madiredo
          </p>
        </div>

        <div className="space-y-3">
          {/* Staff Button - Karyawan non-kasir (kebersihan, dapur, taman, keamanan) */}
          <WithRole allowedRoles={BERANDA_ACCESS['/berandastaff']}>
            <button
              onClick={() => handleRoleSelect("staff")}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "staff"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "staff" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "staff" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Staff</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Absensi &amp; tugas harian
                </p>
              </div>
            </button>
          </WithRole>

          {/* Dapur Button - Layar kerja penyiapan pesanan cafe & resto */}
          <WithRole allowedRoles={BERANDA_ACCESS['/berandadapur']}>
            <button
              onClick={() => handleRoleSelect("dapur")}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "dapur"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "dapur" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "dapur" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 9a3 3 0 015.4-1.8 3.75 3.75 0 014.2 0A3 3 0 0119.5 9a3 3 0 01-1.8 2.73V18a1.5 1.5 0 01-1.5 1.5H7.8A1.5 1.5 0 016.3 18v-6.27A3 3 0 014.5 9z"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Dapur</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Siapkan &amp; selesaikan pesanan
                </p>
              </div>
            </button>
          </WithRole>

          {/* Admin Button - Only for Admin & Superadmin */}
          <WithRole allowedRoles={BERANDA_ACCESS['/berandakasir']}>
            <button
              onClick={() => handleRoleSelect("admin")}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "admin"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "admin" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "admin" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Admin</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Penjualan tiket &amp; rekap harian
                </p>
              </div>
            </button>
          </WithRole>

          {/* Supervisor Button - Only for Supervisor & Superadmin */}
          <WithRole allowedRoles={BERANDA_ACCESS['/berandasupervisor']}>
            <button
              onClick={() => handleRoleSelect("supervisor")}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "supervisor"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "supervisor" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "supervisor" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Supervisor</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Awasi operasional harian
                </p>
              </div>
            </button>
          </WithRole>

          {/* Owner Button - Only for Superadmin */}
          <WithRole allowedRoles={BERANDA_ACCESS['/berandaowner']}>
            <button
              onClick={() => {
                handleRoleSelect("owner");
              }}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "owner"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "owner" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "owner" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Pengelola</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Manajemen bisnis dan analisis
                </p>
              </div>
            </button>
          </WithRole>

          {/* Admin Sistem Button - Only for Superapp-Superadmin */}
          <WithRole allowedRoles={['superapp-superadmin']}>
            <button
              onClick={() => handleRoleSelect("superapp-admin")}
              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 hover:shadow-md ${selectedRole === "superapp-admin"
                ? "border-telaga-500 bg-gradient-to-r from-telaga-50 to-white shadow-sm"
                : "border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/50"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${selectedRole === "superapp-admin" ? "bg-telaga-100" : "bg-telaga-50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke={selectedRole === "superapp-admin" ? "#16A34A" : "currentColor"}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15l-1.5 18h-12L4.5 3zM9 9h6m-6 4h6m-6 4h6"
                  />
                </svg>
              </div>
              <div className="text-left font-montserrat">
                <h3 className="font-semibold text-sm text-telaga-950">Admin Sistem</h3>
                <p className="text-[10px] text-telaga-900/50">
                  Kelola semua unit usaha
                </p>
              </div>
            </button>
          </WithRole>

        </div>

        <AnimatedButton
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold mt-6"
          variant="telaga"
        >
          Lanjutkan
        </AnimatedButton>

        {/* 🧪 TEMPORARY: Test Refresh Token Buttons - HIDDEN */}
        {false && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-montserrat mb-3 text-center">
              🧪 Test Refresh Token (Temporary)
            </p>
            <div className="space-y-2">
              <button
                onClick={testInvalidAccessToken}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold font-montserrat bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                🔴 Test Invalid Access Token
              </button>
              <button
                onClick={testInvalidRefreshToken}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold font-montserrat bg-purple-500 hover:bg-purple-600 text-white transition-colors"
              >
                ⏰ Test Invalid Refresh Token
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem('selectedRole');
          localStorage.removeItem('selectedBranchId');
          navigate('/login');
        }}
        className="mt-6 text-xs font-montserrat text-telaga-700/70 hover:text-telaga-800 transition-colors"
      >
        &larr; Keluar &amp; kembali ke login
      </button>

      <p className="mt-3 text-[11px] font-montserrat text-telaga-900/35">
        Agrowisata Telaga Madiredo &middot; Desa Madiredo, Pujon, Malang
      </p>

      <ConfirmRoleModal
        isOpen={showModal}
        onClose={handleCloseModal}
        selectedRole={selectedRole}
        onConfirm={() => {
          const userBranchId = userProfile?.branch?.id || null;
          navigateToRole(selectedRole, userBranchId);
          setShowModal(false);
        }}
      />
      
      <BranchSelectionModal
        isOpen={showBranchModal}
        onClose={handleCloseBranchModal}
        onConfirm={handleBranchConfirm}
        selectedRole={selectedRole}
      />
      
      <RoleExplanationModal
        isOpen={showRoleExplanationModal}
        onClose={handleCloseRoleExplanationModal}
        onConfirm={handleConfirmRoleFromModal}
        selectedRole={selectedRole}
      />
      
      <AttendancePromptModal
        isOpen={showAttendanceModal}
        onClose={handleCloseAttendanceModal}
        onNavigateToAttendance={handleNavigateToAttendance}
      />
    </div>
  );
};

export default PilihRole;
