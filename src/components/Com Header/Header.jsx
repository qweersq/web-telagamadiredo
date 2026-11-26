import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Clock3 } from "lucide-react";
import ConfirmationModal from "../Modal/ConfirmationModal";
import NavigationModal from "../Modal/NavigationModal";
import LogoutButton from "./LogoutButton";
import UserName from "./UserName";
import BranchActiveChip from "./BranchActiveChip";
import { getUserProfile } from "../../utils/userProfileHelper";
// import SwitchButton from "./SwitchButton";

const Header = ({ 
  onLogout, 
  showBackButton = false, 
  backPath = null, 
  hideLogout = false, 
  hideUserMenu = false,
  title = null,
  description = null,
  currentTime = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showNavModal, setShowNavModal] = useState(false);

  // Load user data from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
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
          setUserData(userData);
        }
      } catch (error) {
        console.error('❌ Header - Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  const handleLogoutConfirm = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login");
    }
    
    setShowLogoutModal(false);
  };

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      // Default back behavior based on user role
      if (userData?.role === 'superadmin') {
        navigate('/berandaowner');
      } else if (userData?.role === 'supervisor') {
        navigate('/berandasupervisor');
      } else if (userData?.role === 'admin') {
        navigate('/berandakasir');
      } else if (userData?.role === 'employee') {
        navigate('/berandastaff');
      } else {
        navigate('/');
      }
    }
  };

  // Function to check if current page is a beranda page
  const isBerandaPage = () => {
    const path = location.pathname;
    return path === "/berandaowner" || 
           path === "/berandakasir" || 
           path === "/berandaqc" || 
           path === "/berandateknisi" || 
           path === "/berandakurir" ||
           path === "/berandasupervisor" ||
           path === "/berandastaff" ||
           path === "/berandadapur" ||
           path === "/berandaadmin";
  };

  const showUserMenu = isBerandaPage() && !hideUserMenu;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-telaga-100 bg-white/90 font-montserrat backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 md:px-6">
          {/* KIRI — tombol kembali, judul halaman, atau badge peran */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showBackButton && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Kembali"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-telaga-900/5 text-telaga-800 transition-colors hover:bg-telaga-900/10 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}

            {title ? (
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold leading-tight text-telaga-950">{title}</h1>
                {description && (
                  <p className="truncate text-[10px] leading-tight text-telaga-900/45">{description}</p>
                )}
              </div>
            ) : (
              !hideLogout && <LogoutButton onClick={() => setShowLogoutModal(true)} />
            )}
          </div>

          {/* TENGAH — chip cabang aktif (khusus beranda tanpa judul) */}
          {!title && isBerandaPage() && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <BranchActiveChip />
            </div>
          )}

          {/* KANAN — jam berjalan & menu */}
          <div className="flex shrink-0 items-center gap-1.5">
            {currentTime && (
              <span className="hidden shrink-0 items-center gap-1 rounded-lg bg-telaga-900/5 px-2 py-1 text-[10px] font-semibold tabular-nums text-telaga-900/50 sm:inline-flex">
                <Clock3 className="h-3 w-3" />
                {currentTime}
              </span>
            )}
            {showUserMenu && (
              <UserName
                name={userData?.name}
                isOpen={isOpen}
                setOpen={setOpen}
                onToggle={(toggled) => {
                  if (toggled) {
                    setShowNavModal(true);
                  } else {
                    setShowNavModal(false);
                  }
                }}
              />
            )}
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
        onClose={() => {
          setShowNavModal(false);
          setOpen(false);
        }}
      />
    </>
  );
};

export default Header;
