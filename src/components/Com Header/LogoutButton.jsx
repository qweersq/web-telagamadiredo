import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Modal from "../Modal/SwitchModal";
import SwitchRole from "./SwitchRole";
import AnimatedButton from "../Design/AnimatedButton";
import { FaSignOutAlt, FaExchangeAlt } from "react-icons/fa";
import BranchSelectionModal from "../Modal/BranchSelectionModal";
import { getUserProfile, switchBranch, invalidateUserProfileCache } from "../../utils/userProfileHelper";
import { canSwitchBranch } from "../../utils/roleValidator";

const LogoutButton = ({ onClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  // Get user data from API
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
        console.error('❌ LogoutButton - Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  const getTitleByPath = () => {
    const path = location.pathname;

    if (path.includes("berandakasir")) {
      return "Admin";
    } else if (path.includes("berandastaff")) {
      return "Staff";
    } else if (path.includes("berandakurir")) {
      return "Petugas Wahana";
    } else if (path.includes("berandateknisi")) {
      return "Petugas Tiket";
    } else if (path.includes("berandaqc")) {
      return "Pemeriksa Area";
    } else if (path.includes("berandadapur")) {
      return "Dapur";
    } else if (path.includes("berandasupervisor")) {
      return "Supervisor";
    } else if (path.includes("berandaowner") || path.includes("analisis-karyawan")) {
      return "Pengelola";
    }
    return null;
  };

  const title = getTitleByPath();

  // Boleh ganti cabang: owner (superadmin) dan supervisor
  const canSwitch = canSwitchBranch(userData?.role);

  // Get current branch name for display
  // Urutan sama dengan getCurrentBranchLabel() di userProfileHelper
  // supaya teks di modal ini & di beranda tidak pernah beda.
  const getCurrentBranchName = () => {
    if (userData?.branch_name) {
      return userData.branch_name;
    }
    const stored = localStorage.getItem('selectedBranchName');
    if (stored) {
      return stored;
    }
    return "Pilih Cabang";
  };

  // Handle branch selection
  const handleBranchSelect = async (selectedBranch) => {
    try {
      
      // Call API to switch branch
      const updatedUserData = await switchBranch(selectedBranch.id);
      
      // Update local state with new data
      setUserData(updatedUserData);
      
      // Store selected branch in localStorage for session
      localStorage.setItem('selectedBranchId', selectedBranch.id.toString());
      localStorage.setItem('selectedBranchName', selectedBranch.name);
      
      // Close modal
      setIsBranchModalOpen(false);
      
      // Reload page to apply changes across all components
      window.location.reload();
    } catch (error) {
      console.error('❌ Error switching branch:', error);
      alert('Gagal mengganti cabang. Silakan coba lagi.');
    }
  };

  // Jika title tidak ada judul page, return null
  if (!title) return null;

  return (
    <>
      <div className="flex h-9 items-center rounded-xl border border-telaga-100 bg-telaga-50/70 px-2.5 transition-all hover:border-telaga-200 hover:bg-telaga-100">
        <AnimatedButton
          onClick={() => setIsModalOpen(true)}
          className="flex cursor-pointer items-center gap-1.5"
        >
          <FaExchangeAlt className="text-[13px] text-telaga-700" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-telaga-800 sm:inline">
            {title}
          </span>
        </AnimatedButton>
      </div>

      {/* Role selection modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pilih peran"
      >
        <div className="mt-4 mb-2">
          <SwitchRole />
          
          {/* Branch selection for owner / supervisor inside modal */}
          {canSwitch && (
            <div className="mt-4 pt-4 border-t border-telaga-100">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold font-montserrat text-telaga-950">Ganti Cabang</h3>
                <span className="text-xs font-montserrat text-telaga-900/60 truncate">
                  {getCurrentBranchName()}
                </span>
              </div>
              <AnimatedButton
                onClick={() => {
                  setIsModalOpen(false);
                  setIsBranchModalOpen(true);
                }}
                variant="default"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white outline outline-2 outline-telaga-100 text-telaga-800 font-montserrat text-sm font-semibold hover:bg-telaga-50 transition-colors"
              >
                <FaExchangeAlt className="w-4 h-4 flex-shrink-0" />
                <span className="font-montserrat font-semibold text-sm truncate">Pilih Cabang Lain</span>
              </AnimatedButton>
            </div>
          )}
        </div>
      </Modal>

      {/* Branch selection modal for owner / supervisor */}
      {canSwitch && (
        <BranchSelectionModal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          onConfirm={handleBranchSelect}
          selectedRole={userData?.selected_role || 'superadmin'}
        />
      )}
    </>
  );
};

export default LogoutButton;
