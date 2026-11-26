import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedButton from '../Design/AnimatedButton';
// import OpenShiftModal from '../../pages/BERANDA/SHIFT/OpenShiftModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { useState, useEffect } from 'react';
import { FaBook, FaSignOutAlt, FaCalendarAlt, FaTruck, FaBug, FaComments, FaUser, FaPlay, FaLightbulb, FaHeadset, FaStar } from 'react-icons/fa';
import { getUserProfile, clearUserProfileCache } from '../../utils/userProfileHelper';

const NavigationModal = ({ isOpen, onClose, onLogout }) => {
  const navigate = useNavigate();
  // const [showShiftModal, setShowShiftModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user role on component mount
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const profile = await getUserProfile();
        const role = profile?.user?.role || profile?.user?.user_role;
        setUserRole(role);
      } catch (error) {
        console.error('❌ NavigationModal - Error loading user role:', error);
        setUserRole('employee'); // Default fallback to full menu
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadUserRole();
    }
  }, [isOpen]);

  // Dynamic menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { 
        name: 'Keluar', 
        action: 'logout',
        icon: FaSignOutAlt,
        isLogout: true
      }
    ];
    
    // Add superadmin-specific bug report menu
    if (userRole === 'superadmin') {
      // baseItems.unshift(
      //   { 
      //     name: 'Laporan Bug Sistem', 
      //     path: '/bug-report',
      //     icon: FaBug,
      //     isBugReport: true
      //   }
      // );
    }
    
    // Add role-specific items (hide for superadmin)
    // Supervisor juga tidak absen & tidak memakai transport, jadi diperlakukan
    // sama seperti owner (superadmin).
    if (userRole !== 'superadmin' && userRole !== 'supervisor') {
      baseItems.unshift(
        { 
          name: 'Kehadiran', 
          path: '/attendance',
          icon: FaCalendarAlt,
          isAttendance: true
        },
        { 
          name: 'Transport', 
          path: '/transport',
          icon: FaTruck,
          isTransport: true
        }
      );
    }
    
    // Extra menu items (before Keluar)
    const extraItems = [
      { name: 'Panduan Video', action: 'video-guide', icon: FaPlay },
      { name: 'Usulan Fitur', action: 'feature-request', icon: FaLightbulb },
      { name: 'Hubungi Support', action: 'contact-support', icon: FaHeadset },
      { name: 'Review Aplikasi', action: 'app-review', icon: FaStar },
    ];
    extraItems.forEach(item => baseItems.splice(baseItems.length - 1, 0, item));
    
    // Add profile menu for all authenticated users (paling atas)
    baseItems.unshift(
      { 
        name: 'Profile', 
        path: '/profile',
        icon: FaUser,
        isProfile: true
      }
    );
    
    // Add feedback menu for all authenticated users
    // baseItems.unshift(
    //   { 
    //     name: 'Feedback', 
    //     path: '/feedback',
    //     icon: FaComments,
    //     isFeedback: true
    //   }
    // );
    
    // Add bug report form for all authenticated users
    // baseItems.unshift(
    //   { 
    //     name: 'Laporkan Bug', 
    //     path: '/bug-report-form',
    //     icon: FaBug,
    //     isBugReportForm: true
    //   }
    // );
    
    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleNavigate = (path) => {
    // Simpan halaman asal sebelum navigasi
    const currentPath = window.location.pathname;
    sessionStorage.setItem('previousPage', currentPath);
    
    navigate(path);
    onClose();
  };

  const handleExtraMenuClick = (action) => {
    console.log(`🔵 NavigationModal - Menu clicked: ${action}`);
    
    switch (action) {
      case 'video-guide':
        window.open('https://youtube.com/playlist?list=PLkRhBUfc-msrwpGzxTaQeUwBGxP2tcXu-&si=qLyEH2aEy8Bwfng7', '_blank');
        break;
      case 'feature-request':
        window.open('https://wa.me/6287778942773?text=Halo%20tim%20NotaSepatu%2C%20saya%20ingin%20memberikan%20usulan%20fitur%3A', '_blank');
        break;
      case 'contact-support':
        window.open('https://wa.me/6287778942773', '_blank');
        break;
      case 'app-review':
        window.open('https://play.google.com/store/apps/details?id=com.notasepatu.app', '_blank');
        break;
      default:
        break;
    }
    
    onClose();
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    // Call logout endpoint to clear refresh token in database
    try {
      const instance = (await import('../../config/api')).default;
      await instance.post('/logout', { device_type: 'web' });
      console.log('✅ [NavigationModal] Logout endpoint called successfully');
    } catch (logoutError) {
      // Continue even if logout endpoint fails (network error, etc)
      console.warn('⚠️ [NavigationModal] Logout endpoint failed, continuing with local cleanup:', logoutError.message);
    }
    
    // Clear all authentication data from localStorage
    try {
      // Remove token
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken'); // Ensure refresh token is cleared
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Remove user profile cache
      clearUserProfileCache();
      
      // Remove any other auth-related data
      localStorage.removeItem('user');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('tenant');
      localStorage.removeItem('branch');
        
    } catch (error) {
      console.error('❌ NavigationModal - Error clearing localStorage:', error);
    }
    
    // Close logout modal first
    setShowLogoutModal(false);
    
    // Close NavigationModal
    onClose();
    
    // Execute logout
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 pl-10 pr-10">
              {/* Background overlay dengan animasi fade */}
              <motion.div 
                className="fixed inset-0 bg-black transition-opacity z-[101]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0, ease: 'easeInOut'}}
                aria-hidden="true"
                onClick={onClose}
              />

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal content dengan animasi */}
              <motion.div 
                className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform sm:my-8 sm:align-middle sm:max-w-md w-full z-[102]"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-telaga-800 to-telaga-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-montserrat">
                        Menu Lainnya
                      </h3>
                      <p className="text-telaga-100 text-sm font-montserrat">
                        Pilih menu yang ingin Anda akses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white px-6 py-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-telaga-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-telaga-600"></div>
                        </div>
                        <p className="text-telaga-900/60 font-montserrat text-sm">Memuat menu...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {menuItems.map((item) => (
                        <AnimatedButton 
                          key={item.path || item.action}
                          onClick={() => {
                            if (item.isLogout) return handleLogoutClick();
                            if (item.action && !item.path) return handleExtraMenuClick(item.action);
                            return handleNavigate(item.path);
                          }}
                          className={`w-full h-12 text-left px-4 py-3 rounded-xl transition-all duration-200 font-montserrat text-sm flex items-center justify-start group ${
                            item.isLogout 
                              ? 'bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300' 
                              : item.isBugReport
                              ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300'
                              : 'bg-telaga-50/60 hover:bg-telaga-50 border border-telaga-100 hover:border-telaga-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.isLogout 
                                ? 'bg-red-100 group-hover:bg-red-200' 
                                : item.isBugReport
                                ? 'bg-orange-100 group-hover:bg-orange-200'
                                : 'bg-telaga-100 group-hover:bg-telaga-200'
                            }`}>
                              <item.icon className={`w-4 h-4 ${
                                item.isLogout 
                                  ? 'text-red-600' 
                                  : item.isBugReport
                                  ? 'text-orange-600'
                                  : 'text-telaga-700'
                              }`} />
                            </div>
                            <span className={`font-semibold font-montserrat ${
                              item.isLogout 
                                ? 'text-red-700' 
                                : item.isBugReport
                                ? 'text-orange-700'
                                : 'text-telaga-900'
                            }`}>
                              {item.name}
                            </span>
                            <div className="ml-auto">
                              <svg className={`w-4 h-4 ${
                                item.isLogout 
                                  ? 'text-red-400' 
                                  : item.isBugReport
                                  ? 'text-orange-400'
                                  : 'text-telaga-400'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </AnimatedButton>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-krem px-6 py-4 border-t border-telaga-100">
                  <AnimatedButton 
                    type="button"
                    onClick={onClose}
                    variant="default"
                    className="w-full h-11 inline-flex justify-center items-center rounded-xl font-semibold text-sm font-montserrat shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Tutup
                  </AnimatedButton>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal Shift */}
      {/* <OpenShiftModal open={showShiftModal} onClose={() => setShowShiftModal(false)} /> */}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default NavigationModal; 