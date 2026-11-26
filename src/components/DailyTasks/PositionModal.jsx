import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import instance from "../../config/api";
import { taskTemplateService } from "../../services/dailyTaskService";

/**
 * Modal kecil untuk mengisi `users.position` seorang karyawan.
 *
 * Kenapa perlu: modul Tugas Harian mencocokkan template berdasarkan posisi
 * (kebersihan / dapur / taman / keamanan). Karyawan tanpa posisi hanya dapat
 * template generik, jadi supervisor butuh jalan pintas mengisinya dari panel
 * tugas tanpa harus membuka halaman Karyawan.
 *
 * Posisi disimpan lowercase oleh server (UserController.normalizePosition).
 */
const PositionModal = ({ isOpen, onClose, employee, onSaved }) => {
  const [value, setValue] = useState("");
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setValue(employee?.position || "");
    setError("");

    let active = true;
    taskTemplateService
      .getPositions()
      .then((response) => {
        if (!active || !response?.success) return;
        setOptions((response.data || []).map((item) => item.position).filter(Boolean));
      })
      .catch((err) => console.error("❌ PositionModal - gagal memuat posisi:", err));

    return () => {
      active = false;
    };
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!employee?.user_id) return;

    setSaving(true);
    setError("");
    try {
      const response = await instance.put(`/users/${employee.user_id}`, {
        position: value.trim(),
      });

      if (response.data?.success) {
        if (onSaved) onSaved(value.trim().toLowerCase());
        onClose();
      } else {
        setError(response.data?.error?.message || "Gagal menyimpan posisi");
      }
    } catch (err) {
      console.error("❌ PositionModal - gagal menyimpan posisi:", err);
      setError(err?.response?.data?.error?.message || "Gagal menyimpan posisi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-telaga-950/60 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 font-montserrat shadow-xl ring-2 ring-telaga-100"
      >
        <h3 className="text-lg font-semibold text-telaga-950">Posisi kerja</h3>
        <p className="mt-1 text-xs text-telaga-900/55">
          {employee?.name ? `${employee.name} · ` : ""}dipakai untuk mencocokkan template tugas harian.
        </p>

        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-wider text-telaga-900/45">Posisi</span>
          <input
            autoFocus
            list="task-position-options"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="mis. kebersihan"
            className="mt-1 w-full rounded-xl border border-telaga-100 bg-krem px-3 py-2 text-sm text-telaga-950 placeholder:text-telaga-900/35 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
          />
          <datalist id="task-position-options">
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-telaga-100 bg-white px-4 py-2.5 text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-telaga-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-telaga-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
};

export default PositionModal;
