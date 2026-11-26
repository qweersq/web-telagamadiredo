import { useEffect, useState } from "react";
import { getCurrentBranchLabel } from "../../utils/userProfileHelper";

/**
 * Chip kecil "Cabang Aktif" untuk dipasang di tengah header beranda.
 *
 * Dipakai semua beranda: admin, teknisi, qc, kurir, supervisor, dan owner
 * (`Header.jsx` & `HeaderBerandaOwner.jsx`).
 *
 * Teksnya diambil dari `getCurrentBranchLabel()` — sumber yang sama dengan
 * modal "Ganti Cabang", jadi teksnya tidak pernah beda. Pemanggilan ini
 * memakai cache profil 5 menit, jadi tidak menambah request baru.
 */
const BranchActiveChip = () => {
  const [label, setLabel] = useState("");

  useEffect(() => {
    let mounted = true;

    getCurrentBranchLabel()
      .then((name) => {
        if (mounted) setLabel(name || "");
      })
      .catch(() => {
        if (mounted) setLabel("");
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!label) return null;

  return (
    <span
      title={`Lokasi aktif: ${label}`}
      className="inline-flex items-center gap-1.5 max-w-[35vw] px-3 py-1 rounded-full bg-telaga-50 border border-telaga-100"
    >
      <svg
        className="w-3.5 h-3.5 text-telaga-600 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-xs font-semibold font-montserrat text-telaga-900 truncate">{label}</span>
    </span>
  );
};

export default BranchActiveChip;
