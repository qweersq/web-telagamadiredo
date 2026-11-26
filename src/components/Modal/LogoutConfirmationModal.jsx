import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedButton from '../Design/AnimatedButton';
import { FaSignOutAlt, FaTimes, FaClock } from 'react-icons/fa';
import { clearUserProfileCache, getUserProfile } from '../../utils/userProfileHelper';
import { useState, useEffect } from 'react';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [isAbsent, setIsAbsent] = useState(null);

  // Check user role and attendance status when modal opens
  useEffect(() => {
    if (isOpen) {
      const checkUserStatus = async () => {
        try {
          const profile = await getUserProfile();
          if (profile) {
            const role = profile.user?.role || profile.user?.user_role;
            setUserRole(role);
            setIsAbsent(profile.isAbsent);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      };
      checkUserStatus();
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    // Call logout endpoint to clear refresh token in database
    try {
      const instance = (await import('../../config/api')).default;
      await instance.post('/logout', { device_type: 'web' });
      console.log('✅ [LogoutConfirmationModal] Logout endpoint called successfully');
    } catch (logoutError) {
      // Continue even if logout endpoint fails (network error, etc)
      console.warn('⚠️ [LogoutConfirmationModal] Logout endpoint failed, continuing with local cleanup:', logoutError.message);
    }
    
    // Clear user profile cache
    clearUserProfileCache();
    
    // Clear refresh token from localStorage
    try {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('❌ [LogoutConfirmationModal] Error clearing tokens:', error);
    }
    
    // Close modal first
    onClose();
    
    // Use setTimeout to ensure modal is closed before logout
    setTimeout(() => {
      if (onConfirm) {
        onConfirm();
      } else {
        navigate("/login");
      }
    }, 100); // Small delay to ensure modal closing animation completes
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[200] overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center">
            {/* Background overlay dengan animasi fade */}
            <motion.div 
              className="fixed inset-0 bg-black transition-opacity z-[201]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0, ease: 'easeInOut'}}
              aria-hidden="true"
              onClick={onClose}
            />

            {/* Modal content dengan animasi */}
            <motion.div 
              className="relative w-full max-w-md bg-white rounded-2xl text-left overflow-hidden shadow-xl outline outline-2 outline-telaga-100 z-[202]"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <div className="bg-krem px-5 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-1 text-center sm:mt-0 sm:text-left w-full">
                    {/* Header dengan icon logout */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-red-100 rounded-full p-3">
                        <FaSignOutAlt className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold font-montserrat font-bold mb-2 text-center">
                      Konfirmasi Keluar
                    </h3>
                    
                    <p className="text-sm font-montserrat text-gray-600 text-center mb-4">
                      Apakah Anda yakin ingin keluar dari aplikasi?
                    </p>
                    
                    {/* Additional message for admin/employee */}
                    {(userRole === 'admin' || userRole === 'employee') && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <FaClock className="text-orange-500 text-sm mr-2" />
                          <span className="text-orange-700 text-xs font-montserrat font-medium">
                            Peringatan
                          </span>
                        </div>
                        <p className="text-orange-600 text-xs font-montserrat leading-relaxed text-center">
                          Jangan lupa untuk mengakhiri kerja Anda terlebih dahulu
                        </p>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                      <AnimatedButton 
                        onClick={handleConfirm}
                        className="h-[45px] w-full text-center px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition-colors font-montserrat text-sm text-white font-semibold"
                      >
                        Ya, Keluar
                      </AnimatedButton>
                      
                      <AnimatedButton 
                        onClick={onClose}
                        className="h-[45px] w-full text-center px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors font-montserrat text-sm text-gray-700 font-semibold outline outline-1 outline-gray-300"
                      >
                        Batal
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutConfirmationModal;
