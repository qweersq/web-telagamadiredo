import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmationModal from "../Modal/ConfirmationModal";
import NavigationModal from "../Modal/NavigationModal";
import LogoutButton from "./LogoutButton";
import BranchActiveChip from "./BranchActiveChip";
import { FaBars } from "react-icons/fa";
import { clearUserProfileCache } from "../../utils/userProfileHelper";

const HeaderBerandaOwner = ({ 
  onLogout, 
  showBackButton = false, 
  backPath = null, 
  hideLogout = false, 
  hideUserMenu = true,
  title = null,
  description = null,
  currentTime = null,
  addButton = null,
  fromPengaturanAdmin = false,
  fromBerandaOwner = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);

  const handleLogoutConfirm = () => {
    // Close logout modal first
    setShowLogoutModal(false);
    
    // Clear user profile cache
    clearUserProfileCache();
    
    // Use setTimeout to ensure modal is closed before logout
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        navigate("/login");
      }
    }, 100); // Small delay to ensure modal closing animation completes
  };

  const handleNavigationLogout = () => {
    // This function will be called from NavigationModal
    // Close NavigationModal first
    setShowNavModal(false);
    
    // Clear user profile cache
    clearUserProfileCache();
    
    // Use setTimeout to ensure modal is closed before logout
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        navigate("/login");
      }
    }, 100); // Small delay to ensure modal closing animation completes
  };

  const handleBack = () => {
    // Get location state to determine where we came from
    const fromPage = location.state?.from;
    
    if (fromPage === 'pengaturan-admin') {
      // Jika datang dari pengaturan admin, kembali ke pengaturan admin
      navigate('/pengaturan-admin');
    } else if (fromPage === 'beranda-owner') {
      // Jika datang dari beranda owner, kembali ke beranda owner
      navigate('/berandaowner');
    } else if (backPath === "-1" || backPath === -1) {
      // Navigate back to previous page
      navigate(-1);
    } else if (backPath) {
      // Fallback ke backPath jika ada
      navigate(backPath);
    } else if (fromPengaturanAdmin) {
      // Legacy prop support
      navigate('/pengaturan-admin');
    } else if (fromBerandaOwner) {
      // Legacy prop support
      navigate('/berandaowner');
    } else {
      // Default back behavior untuk owner
      navigate('/berandaowner');
    }
  };


  // Function to check if current page is a beranda page
  const isBerandaPage = () => {
    const path = location.pathname;
    return path === "/berandaowner" || 
           path === "/berandakasir" || 
           path === "/berandateknisi" || 
           path === "/berandakurir" ||
           path === "/berandaqc" ||
           path === "/berandasupervisor" ||
           path === "/berandaadmin";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 font-montserrat">
        <div className="border-b border-telaga-100 bg-white/90 shadow-sm shadow-telaga-900/5 backdrop-blur-xl">
          <div className="mx-auto px-4 py-3 md:px-10">
            <div className="relative flex items-center justify-between">
              {/* Cabang aktif — chip kecil di tengah (hanya halaman beranda, tanpa title) */}
              {isBerandaPage() && !title && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <BranchActiveChip />
                </div>
              )}

              {/* Kiri: tombol kembali, judul, peran/pengelola */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {showBackButton && (
                  <button
                    onClick={handleBack}
                    title="Kembali"
                    className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-telaga-50"
                  >
                    <svg className="h-5 w-5 text-telaga-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                )}

                {title && (
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate font-montserrat text-lg font-semibold text-telaga-950">
                      {title}
                    </h1>
                    {description && (
                      <p className="mt-1 truncate font-montserrat text-sm text-telaga-900/60">
                        {description}
                      </p>
                    )}
                  </div>
                )}

                {!hideLogout && <LogoutButton onClick={() => setShowLogoutModal(true)} />}
              </div>

              {/* Kanan: aksi tambahan, lalu menu */}
              <div className="flex shrink-0 items-center gap-1.5">
                {addButton}
                {!hideUserMenu && (
                  <button
                    onClick={() => setShowNavModal(true)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-telaga-100 bg-white px-2.5 text-telaga-800 transition-all hover:border-telaga-200 hover:bg-telaga-50 active:scale-95"
                    title="Menu"
                  >
                    <FaBars className="h-4 w-4 text-telaga-700" />
                    <span className="hidden text-[11px] font-semibold uppercase tracking-wide sm:inline">
                      Menu
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar?"
      />

      <NavigationModal
        isOpen={showNavModal}
        onClose={() => setShowNavModal(false)}
        onLogout={handleNavigationLogout}
      />
    </>
  );
};

export default HeaderBerandaOwner;
