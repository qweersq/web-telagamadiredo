import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import useSound from "../../hooks/useSound";
import switchSound from "../../assets/sound/switch.mp3";
import AnimatedButton from "../Design/AnimatedButton";
import { filterRoleButtons, useCurrentUserRole } from '../../utils/roleValidator';

const SwitchRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal1, setShowModal1] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const playSound = useSound();

  // Menentukan role buttons (fixed order)
  const getRoleButtons = () => [
    { role: 'staff', path: '/berandastaff', label: 'Peran Staff', icon: 'clipboard' },
    { role: 'dapur', path: '/berandadapur', label: 'Peran Dapur', icon: 'chef' },
    { role: 'admin', path: '/berandakasir', label: 'Peran Admin', icon: 'cash' },
    { role: 'supervisor', path: '/berandasupervisor', label: 'Peran Supervisor', icon: 'owner' },
    { role: 'owner', path: '/berandaowner', label: 'Peran Pengelola', icon: 'owner' },
  ];

  const getIcon = (iconType) => {
    switch (iconType) {
      case "tools":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
          />
        );
      case "truck":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        );
      case "cash":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
          />
        );
      case "owner":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        );
      case "qc":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      case "clipboard":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
          />
        );
      case "chef":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 9a3 3 0 015.4-1.8 3.75 3.75 0 014.2 0A3 3 0 0119.5 9a3 3 0 01-1.8 2.73V18a1.5 1.5 0 01-1.5 1.5H7.8A1.5 1.5 0 016.3 18v-6.27A3 3 0 014.5 9z"
          />
        );
      default:
        return null;
    }
  };

  const handleSwitch = (index) => {
    // playSound(switchSound);
    if (index === 0) {
      setShowModal1(true);
    } else {
      setShowModal2(true);
    }
  };

  const roleButtons = getRoleButtons();
  const { userRole } = useCurrentUserRole();
  const filteredRoleButtons = filterRoleButtons(roleButtons, userRole);

  // Deteksi current role dari path (untuk exclude role yang sedang aktif - khusus employee)
  const getCurrentRoleFromPath = () => {
    const path = location.pathname;
    if (path.includes("berandasupervisor")) return "supervisor";
    if (path.includes("berandastaff")) return "staff";
    if (path.includes("berandakasir")) return "admin";
    if (path.includes("berandakurir")) return "kurir";
    if (path.includes("berandateknisi")) return "teknisi";
    if (path.includes("berandaqc")) return "qc";
    if (path.includes("berandadapur")) return "dapur";
    if (path.includes("berandaowner")) return "owner";
    return null;
  };

  const currentRole = getCurrentRoleFromPath();

  // Filter untuk employee: exclude role yang sedang aktif
  const finalRoleButtons = filteredRoleButtons;

  return (
    <>
      {finalRoleButtons.length === 0 ? (
        <p className="text-center text-sm font-montserrat text-telaga-900/60 py-3">
          Tidak ada peran lain yang tersedia untuk akun Anda.
        </p>
      ) : (
      <div className="grid grid-cols-2 gap-3 w-full">
        {finalRoleButtons.map((button, index) => {
          const isActive = button.role === currentRole;
          return (
            <AnimatedButton
              key={button.role}
              onClick={() => navigate(button.path)}
              variant="transparent"
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 w-full border-2 transition-all ${isActive
                  ? 'border-telaga-500 bg-telaga-50 text-telaga-700'
                  : 'border-transparent text-telaga-950'
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-telaga-700' : ''}`}
              >
                {getIcon(button.icon)}
              </svg>
              <span className={`font-montserrat font-semibold text-sm truncate ${isActive ? 'text-telaga-800' : ''}`}>
                {button.label}
              </span>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-telaga-600 flex-shrink-0" />
              )}
            </AnimatedButton>
          );
        })}
      </div>
      )}
    </>
  );
};

export default SwitchRole;
