import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../Design/AnimatedButton";

const ROLE_META = {
  staff: { label: "Staff", desc: "Absensi & tugas harian", icon: "clipboard" },
  teknisi: { label: "Petugas Tiket", desc: "Check-in & validasi tiket masuk", icon: "ticket" },
  kurir: { label: "Petugas Wahana", desc: "Perahu, pelampung & area air", icon: "boat" },
  qc: { label: "Pemeriksa Area", desc: "Cek kebersihan & fasilitas", icon: "check" },
  dapur: { label: "Dapur", desc: "Siapkan & selesaikan pesanan", icon: "chef" },
  admin: { label: "Admin", desc: "Penjualan tiket & rekap harian", icon: "cash" },
  supervisor: { label: "Supervisor", desc: "Awasi operasional harian", icon: "shield" },
  owner: { label: "Pengelola", desc: "Manajemen bisnis dan analisis", icon: "user" },
  "superapp-admin": { label: "Admin Sistem", desc: "Kelola semua unit usaha", icon: "building" },
};

const ROLE_ICON_PATHS = {
  clipboard: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  ticket: "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z",
  boat: "M3 16.5l1.5-1.5 1.5 1.5 1.5-1.5L9 16.5l1.5-1.5L12 16.5l1.5-1.5L15 16.5l1.5-1.5L18 16.5l1.5-1.5L21 16.5M4.5 12h15l-1.5-4.5h-12L4.5 12zm6-4.5v-3h3v3",
  check: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cash: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  building: "M3.75 21h16.5M4.5 3h15l-1.5 18h-12L4.5 3zM9 9h6m-6 4h6m-6 4h6",
  chef: "M4.5 9a3 3 0 015.4-1.8 3.75 3.75 0 014.2 0A3 3 0 0119.5 9a3 3 0 01-1.8 2.73V18a1.5 1.5 0 01-1.5 1.5H7.8A1.5 1.5 0 016.3 18v-6.27A3 3 0 014.5 9z",
};

const RoleIcon = ({ name, className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={ROLE_ICON_PATHS[name] || ROLE_ICON_PATHS.user}
    />
  </svg>
);

const ConfirmRoleModal = ({ isOpen, onClose, onConfirm, selectedRole }) => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const roleMeta = ROLE_META[selectedRole] || {
    label: "",
    desc: "",
    icon: "user",
  };

  const getBranch = () => {
    const selectedBranch = localStorage.getItem("selectedBranch");
    if (!selectedBranch) return null;
    try {
      return JSON.parse(selectedBranch);
    } catch (error) {
      console.error("❌ ConfirmRoleModal - Gagal membaca data cabang:", error);
      return null;
    }
  };

  const handleConfirm = () => {
    const branchData = getBranch();
    if (branchData) {
      localStorage.setItem("selectedBranchId", branchData.id);
      localStorage.setItem("selectedBranchName", branchData.name);
    }

    if (typeof onConfirm === "function") {
      onConfirm();
    } else {
      switch (selectedRole) {
        case "staff":
          navigate("/berandastaff");
          break;
        case "teknisi":
          navigate("/berandateknisi");
          break;
        case "kasir":
        case "admin":
          navigate("/berandakasir");
          break;
        case "kurir":
          navigate("/berandakurir");
          break;
        case "qc":
          navigate("/berandaqc");
          break;
        case "dapur":
          navigate("/berandadapur");
          break;
        case "owner":
          navigate("/berandaowner");
          break;
        case "supervisor":
          navigate("/berandasupervisor");
          break;
        case "superapp-admin":
          navigate("/superapp-dashboard");
          break;
        default:
          break;
      }
    }

    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      setTimeout(() => {
        setShowModal(true);
      }, 100);
    } else {
      setShowModal(false);
      setTimeout(() => {
        setShowOverlay(false);
      }, 300);
    }
  }, [isOpen]);

  if (!showOverlay) return null;

  return (
    <div
      className={`fixed inset-0 bg-telaga-950 transition-opacity duration-300 flex items-center justify-center z-[9999] px-4 py-6
        ${showOverlay ? "bg-opacity-60" : "bg-opacity-0"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-3xl p-6 w-full max-w-sm ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 transition-all duration-300
          ${showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <img
              src="/images/telagamadiredo-logo.svg"
              alt="Agrowisata Telaga Madiredo"
              className="h-12 w-12"
            />
          </div>
          <div className="text-[9px] font-montserrat font-light text-telaga-700/70 tracking-[0.18em] uppercase">
            Spirit of Nature &middot; Pool &amp; Resto
          </div>
        </div>

        <h2 className="text-lg font-semibold font-montserrat text-center text-telaga-950 mb-1">
          Konfirmasi Peran
        </h2>
        <p className="text-center mb-5 font-montserrat text-xs text-telaga-900/60">
          Pastikan peran yang Anda pilih sudah benar
        </p>

        <div className="rounded-2xl border border-telaga-100 bg-gradient-to-r from-telaga-50 to-white p-3 flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-telaga-100 text-telaga-700 shrink-0">
            <RoleIcon name={roleMeta.icon} />
          </div>
          <div className="text-left font-montserrat min-w-0">
            <h3 className="font-semibold text-sm text-telaga-950 truncate">
              {roleMeta.label}
            </h3>
            <p className="text-[10px] text-telaga-900/50 truncate">{roleMeta.desc}</p>
          </div>
        </div>

        {(() => {
          const branch = getBranch();
          if (!branch) return null;
          return (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-senja-50 border border-senja-100 px-3 py-2 mb-4">
              <span className="text-[10px] font-montserrat uppercase tracking-wider text-senja-700/70">
                Lokasi
              </span>
              <span className="text-xs font-semibold font-montserrat text-senja-800 truncate">
                {branch.name}
              </span>
            </div>
          );
        })()}

        <p className="text-center mb-5 font-montserrat text-xs text-telaga-900/60 leading-relaxed">
          Anda akan masuk ke beranda{" "}
          <span className="font-semibold text-telaga-800">{roleMeta.label}</span>.
          Lanjutkan?
        </p>

        <div className="flex gap-3">
          <AnimatedButton
            onClick={onClose}
            className="flex-1 py-2.5 px-4 items-center justify-center rounded-xl bg-white outline outline-2 outline-telaga-100 text-telaga-800 font-montserrat text-sm font-semibold hover:bg-telaga-50 transition-colors"
            variant="default"
          >
            Batal
          </AnimatedButton>
          <AnimatedButton
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 items-center justify-center"
            variant="telaga"
          >
            Lanjutkan
          </AnimatedButton>
        </div>

        <p className="mt-4 text-center text-[10px] font-montserrat text-telaga-900/35">
          Agrowisata Telaga Madiredo &middot; Pujon, Malang
        </p>
      </div>
    </div>
  );
};

export default ConfirmRoleModal;
