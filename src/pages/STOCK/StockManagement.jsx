import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  History,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  X,
  Warehouse,
} from "lucide-react";
import HeaderBerandaOwner from "../../components/Com Header/HeaderBerandaOwner";
import { branchService } from "../../services/branchService";
import { stockService } from "../../services/stockService";
import { useCurrentUserRole, getHomeBeranda } from "../../utils/roleValidator";

/**
 * Halaman "Stok Barang" untuk owner, supervisor, dan admin.
 *
 * Sumber data:
 *  - `GET /stocks`           → daftar barang + sisa stok per outlet
 *  - `GET /stocks/movements` → riwayat keluar-masuk stok
 *  - `POST /stocks/restock`  → tambah stok masuk
 *  - `POST /stocks/adjust`   → koreksi stok fisik (stock opname)
 *  - `POST /stocks/transfer` → pindah stok antar outlet
 *  - `POST /stocks`          → mulai track stok sebuah barang
 *
 * Master barang memakai tabel `treatment`. Barang tanpa baris stok di outlet
 * terpilih berstatus "Belum di-track" dan penjualannya tidak memotong stok.
 */

const STATUS_META = {
  out: { label: "Habis", chip: "bg-red-50 text-red-600 ring-red-100", dot: "bg-red-500" },
  low: { label: "Menipis", chip: "bg-senja-50 text-senja-700 ring-senja-100", dot: "bg-senja-500" },
  safe: { label: "Aman", chip: "bg-telaga-50 text-telaga-700 ring-telaga-100", dot: "bg-telaga-500" },
  untracked: {
    label: "Belum di-track",
    chip: "bg-telaga-900/5 text-telaga-900/45 ring-telaga-100",
    dot: "bg-telaga-200",
  },
  inactive: {
    label: "Nonaktif",
    chip: "bg-telaga-900/5 text-telaga-900/45 ring-telaga-100",
    dot: "bg-telaga-300",
  },
};

const MOVEMENT_META = {
  in: { label: "Stok masuk", tone: "text-telaga-700" },
  sale: { label: "Terjual", tone: "text-senja-600" },
  adjust: { label: "Koreksi", tone: "text-telaga-950" },
  transfer_in: { label: "Transfer masuk", tone: "text-telaga-700" },
  transfer_out: { label: "Transfer keluar", tone: "text-red-600" },
  void: { label: "Order batal", tone: "text-telaga-700" },
};

const inputClass =
  "w-full rounded-xl border border-telaga-100 bg-krem/50 px-3 py-2 text-sm font-semibold text-telaga-950 outline-none focus:border-telaga-400";

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const signed = (qty) => `${Number(qty) > 0 ? "+" : ""}${Number(qty || 0)}`;

const pad = (n) => String(n).padStart(2, "0");

const fmtDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toDateStr = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const todayStr = () => toDateStr(new Date());

const monthAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return toDateStr(d);
};

/* ─────────────────────────── komponen kecil ─────────────────────────── */

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.untracked;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 backdrop-blur-sm sm:items-center">
    <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-telaga-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-telaga-950">{title}</h3>
          {subtitle && <p className="truncate text-[10px] text-telaga-900/45">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-telaga-900/40 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[65vh] overflow-y-auto px-4 py-3">{children}</div>

      {footer && <div className="border-t border-telaga-100 px-4 py-3">{footer}</div>}
    </div>
  </div>
);

const Field = ({ label, children, hint }) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">{label}</label>
    <div className="mt-1">{children}</div>
    {hint && <p className="mt-1 text-[10px] text-telaga-900/35">{hint}</p>}
  </div>
);

const ErrorText = ({ children }) =>
  children ? (
    <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-700 ring-1 ring-red-100">{children}</p>
  ) : null;

const SubmitButton = ({ onClick, disabled, saving, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || saving}
    className="flex w-full items-center justify-center gap-2 rounded-xl bg-telaga-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-telaga-800 disabled:opacity-60"
  >
    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
);

/* ─────────────────────────── modal stok masuk ─────────────────────────── */

const RestockModal = ({ item, onClose, onDone }) => {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    const amount = parseInt(qty, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Jumlah stok harus lebih dari 0");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await stockService.restock({
        branchId: item.branch_id,
        treatmentId: item.treatment_id,
        qty: amount,
        note: note || undefined,
      });
      onDone(`${amount} ${item.name} ditambahkan ke stok`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Gagal menambah stok");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tambah Stok"
      subtitle={item.name}
      onClose={onClose}
      footer={
        <SubmitButton onClick={submit} saving={saving} icon={<PackagePlus className="h-4 w-4" />}>
          Simpan
        </SubmitButton>
      }
    >
      <div className="mb-3 rounded-xl bg-telaga-50/70 px-3 py-2 text-[11px] text-telaga-900/60">
        Stok sekarang: <span className="font-bold text-telaga-950">{item.stock ?? 0}</span>
      </div>

      <Field label="Jumlah masuk">
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="mis. 24"
          className={inputClass}
        />
      </Field>

      <Field label="Catatan (opsional)">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="mis. Beli dari supplier"
          className={inputClass}
        />
      </Field>

      <ErrorText>{error}</ErrorText>
    </Modal>
  );
};

/* ─────────────────────────── modal koreksi stok ─────────────────────────── */

const AdjustModal = ({ item, onClose, onDone }) => {
  const [physical, setPhysical] = useState(String(item.stock ?? 0));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const diff = (parseInt(physical, 10) || 0) - Number(item.stock ?? 0);

  const submit = async () => {
    const value = parseInt(physical, 10);
    if (Number.isNaN(value) || value < 0) {
      setError("Stok fisik tidak boleh kosong atau negatif");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await stockService.adjust({
        branchId: item.branch_id,
        treatmentId: item.treatment_id,
        physicalStock: value,
        note: note || undefined,
      });
      onDone(
        diff === 0 ? "Stok fisik sama, tidak ada perubahan" : `Stok ${item.name} dikoreksi ${signed(diff)}`
      );
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Gagal mengoreksi stok");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Koreksi Stok"
      subtitle={`${item.name} · stock opname`}
      onClose={onClose}
      footer={
        <SubmitButton onClick={submit} saving={saving} icon={<ClipboardList className="h-4 w-4" />}>
          Simpan koreksi
        </SubmitButton>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-telaga-50/70 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-telaga-900/40">Stok sistem</p>
          <p className="text-base font-bold tabular-nums text-telaga-950">{item.stock ?? 0}</p>
        </div>
        <div className="rounded-xl bg-krem px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-telaga-900/40">Selisih</p>
          <p
            className={`text-base font-bold tabular-nums ${
              diff === 0 ? "text-telaga-900/40" : diff > 0 ? "text-telaga-700" : "text-red-600"
            }`}
          >
            {signed(diff)}
          </p>
        </div>
      </div>

      <Field label="Stok fisik hasil hitung">
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={physical}
          onChange={(e) => setPhysical(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Catatan (opsional)">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="mis. Selisih karena rusak"
          className={inputClass}
        />
      </Field>

      <ErrorText>{error}</ErrorText>
    </Modal>
  );
};

/* ─────────────────────────── modal transfer ─────────────────────────── */

const TransferModal = ({ item, branches, onClose, onDone }) => {
  const others = branches.filter((b) => Number(b.id) !== Number(item.branch_id));
  const [target, setTarget] = useState(others[0] ? String(others[0].id) : "");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    const amount = parseInt(qty, 10);
    if (!target) {
      setError("Pilih outlet tujuan");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Jumlah transfer harus lebih dari 0");
      return;
    }
    if (amount > Number(item.stock ?? 0)) {
      setError(`Stok tersedia hanya ${item.stock ?? 0}`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await stockService.transfer({
        fromBranchId: item.branch_id,
        toBranchId: Number(target),
        treatmentId: item.treatment_id,
        qty: amount,
        note: note || undefined,
      });
      const targetName = others.find((b) => Number(b.id) === Number(target))?.name || "outlet tujuan";
      onDone(`${amount} ${item.name} dipindah ke ${targetName}`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Gagal memindahkan stok");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Transfer Stok"
      subtitle={`${item.name} · dari ${item.branch_name}`}
      onClose={onClose}
      footer={
        <SubmitButton
          onClick={submit}
          saving={saving}
          disabled={!others.length}
          icon={<ArrowRightLeft className="h-4 w-4" />}
        >
          Pindahkan
        </SubmitButton>
      }
    >
      {others.length === 0 ? (
        <p className="rounded-xl bg-senja-50 px-3 py-2 text-[11px] text-senja-700 ring-1 ring-senja-100">
          Belum ada outlet lain. Tambah outlet dulu di menu Outlet.
        </p>
      ) : (
        <>
          <div className="mb-3 rounded-xl bg-telaga-50/70 px-3 py-2 text-[11px] text-telaga-900/60">
            Stok di outlet ini: <span className="font-bold text-telaga-950">{item.stock ?? 0}</span>
          </div>

          <Field label="Outlet tujuan">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              {others.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Jumlah">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="mis. 10"
              className={inputClass}
            />
          </Field>

          <Field label="Catatan (opsional)">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. Kirim ke cafe bawah"
              className={inputClass}
            />
          </Field>

          <ErrorText>{error}</ErrorText>
        </>
      )}
    </Modal>
  );
};

/* ─────────────────────── modal mulai track stok ─────────────────────── */

const TrackModal = ({ item, onClose, onDone }) => {
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    const startStock = parseInt(stock, 10);
    const min = parseInt(minStock, 10);

    if (Number.isNaN(startStock) || startStock < 0) {
      setError("Stok awal tidak valid");
      return;
    }
    if (Number.isNaN(min) || min < 0) {
      setError("Minimal stok tidak valid");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await stockService.startTracking({
        branchId: item.branch_id,
        treatmentId: item.treatment_id,
        stock: startStock,
        minStock: min,
      });
      onDone(`Stok ${item.name} mulai di-track`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Gagal memulai tracking stok");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Track Stok Barang"
      subtitle={`${item.name} · ${item.branch_name}`}
      onClose={onClose}
      footer={
        <SubmitButton onClick={submit} saving={saving} icon={<Package className="h-4 w-4" />}>
          Mulai track
        </SubmitButton>
      }
    >
      <p className="mb-3 rounded-xl bg-telaga-50/70 px-3 py-2 text-[11px] text-telaga-900/60">
        Setelah di-track, setiap penjualan barang ini otomatis mengurangi stok outlet.
      </p>

      <Field label="Stok awal" hint="Isi 0 kalau barang belum tersedia.">
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Minimal stok" hint="Di bawah angka ini status jadi “Menipis”.">
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
          className={inputClass}
        />
      </Field>

      <ErrorText>{error}</ErrorText>
    </Modal>
  );
};

/* ─────────────────────── modal tambah barang baru ─────────────────────── */

const NewProductModal = ({ branchId, onClose, onDone }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [typeItem, setTypeItem] = useState("Barang");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Nama barang wajib diisi");
      return;
    }
    const harga = Number(price);
    if (Number.isNaN(harga) || harga <= 0) {
      setError("Harga jual wajib diisi");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await stockService.createProduct({
        name: name.trim(),
        price: harga,
        typeItem,
        typeService: "F&B",
      });

      const treatmentId = created?.data?.id;
      if (!treatmentId) throw new Error("Barang tersimpan tapi ID tidak diterima");

      await stockService.startTracking({
        branchId,
        treatmentId,
        stock: parseInt(stock, 10) || 0,
        minStock: parseInt(minStock, 10) || 0,
      });

      onDone(`${name.trim()} ditambahkan & mulai di-track`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || "Gagal menambah barang");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tambah Barang"
      subtitle="Barang jualan baru (Indomie, Popmie, minuman, …)"
      onClose={onClose}
      footer={
        <SubmitButton onClick={submit} saving={saving} icon={<Plus className="h-4 w-4" />}>
          Simpan barang
        </SubmitButton>
      }
    >
      <Field label="Nama barang">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="mis. Popmie Goreng"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Harga jual">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="8000"
            className={inputClass}
          />
        </Field>
        <Field label="Jenis">
          <select value={typeItem} onChange={(e) => setTypeItem(e.target.value)} className={inputClass}>
            <option value="Barang">Barang</option>
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
            <option value="Snack">Snack</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Stok awal">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Minimal stok">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <ErrorText>{error}</ErrorText>
    </Modal>
  );
};

/* ─────────────────────────────── halaman ─────────────────────────────── */

export default function StockManagement() {
  const [tab, setTab] = useState("stok");
  const { userRole } = useCurrentUserRole();

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");

  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [movements, setMovements] = useState([]);
  const [movementSummary, setMovementSummary] = useState(null);
  const [movementPagination, setMovementPagination] = useState(null);
  const [moveType, setMoveType] = useState("");
  const [moveSearch, setMoveSearch] = useState("");
  const [moveStart, setMoveStart] = useState(monthAgoStr());
  const [moveEnd, setMoveEnd] = useState(todayStr());
  const [movePage, setMovePage] = useState(1);
  const [moveLoading, setMoveLoading] = useState(false);

  const [notice, setNotice] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  // ---------- Outlet ----------
  useEffect(() => {
    const load = async () => {
      try {
        const res = await branchService.getBranches();
        if (res?.success && Array.isArray(res.data)) {
          const list = res.data.map((b) => ({ id: b.id, name: b.name }));
          setBranches(list);
          setBranchId((prev) => prev || (list[0] ? String(list[0].id) : ""));
        }
      } catch (err) {
        console.error("❌ StockManagement - Gagal memuat outlet:", err);
      }
    };
    load();
  }, []);

  // ---------- Stok ----------
  const fetchStocks = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await stockService.getStocks({ branchId, search: search.trim() || undefined });

      if (res?.success) {
        setStocks(res.data?.stocks || []);
        setSummary(res.data?.summary || null);
      } else {
        setStocks([]);
        setSummary(null);
        setError("Gagal memuat data stok.");
      }
    } catch (err) {
      console.error("❌ StockManagement - Gagal memuat stok:", err);
      setStocks([]);
      setSummary(null);
      setError(err?.response?.data?.error?.message || "Gagal memuat data stok. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [branchId, search]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // ---------- Riwayat ----------
  const fetchMovements = useCallback(async () => {
    if (!branchId) return;
    if (moveStart && moveEnd && moveStart > moveEnd) {
      // Rentang terbalik: jangan query, biarkan pesan validasi yang tampil.
      setMovements([]);
      setMovementSummary(null);
      setMovementPagination(null);
      return;
    }
    setMoveLoading(true);
    try {
      const res = await stockService.getMovements({
        branchId,
        type: moveType || undefined,
        search: moveSearch.trim() || undefined,
        startDate: moveStart || undefined,
        endDate: moveEnd || undefined,
        page: movePage,
        pageSize: 30,
      });

      if (res?.success) {
        setMovements(res.data?.movements || []);
        setMovementSummary(res.data?.summary || null);
        setMovementPagination(res.data?.pagination || null);
      } else {
        setMovements([]);
      }
    } catch (err) {
      console.error("❌ StockManagement - Gagal memuat riwayat stok:", err);
      setMovements([]);
    } finally {
      setMoveLoading(false);
    }
  }, [branchId, moveType, moveSearch, moveStart, moveEnd, movePage]);

  useEffect(() => {
    if (tab !== "riwayat") return;
    fetchMovements();
  }, [tab, fetchMovements]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const branchName = useMemo(
    () => branches.find((b) => String(b.id) === String(branchId))?.name || "—",
    [branches, branchId]
  );

  const dateRangeInvalid = Boolean(moveStart && moveEnd && moveStart > moveEnd);

  const reloadCurrentTab = () => {
    if (tab === "riwayat") {
      fetchMovements();
      return;
    }
    fetchStocks();
  };

  // Filter "hanya menipis / habis" dilakukan di klien
  const visibleStocks = useMemo(() => {
    if (!onlyLow) return stocks;
    return stocks.filter((s) => s.stock_status === "low" || s.stock_status === "out");
  }, [stocks, onlyLow]);

  const soldToday = useMemo(() => stocks.reduce((sum, s) => sum + Number(s.sold_today || 0), 0), [stocks]);

  const cards = [
    { key: "items", label: "Barang di-track", value: summary?.tracked ?? 0, tone: "text-telaga-950" },
    { key: "out", label: "Habis", value: summary?.out ?? 0, tone: "text-red-600" },
    { key: "low", label: "Menipis", value: summary?.low ?? 0, tone: "text-senja-600" },
    { key: "safe", label: "Aman", value: summary?.safe ?? 0, tone: "text-telaga-700" },
    { key: "sold", label: "Terjual hari ini", value: soldToday, tone: "text-telaga-950" },
  ];

  const closeModal = () => setActiveModal(null);

  const handleDone = (message) => {
    setActiveModal(null);
    setNotice(message);
    fetchStocks();
    if (tab === "riwayat") fetchMovements();
  };

  // Baris tabel hanya menyimpan treatment_id; modal butuh outlet aktif
  const withBranch = (item) => ({ ...item, branch_id: Number(branchId), branch_name: branchName });

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <HeaderBerandaOwner
        title="Stok Barang"
        description="Pantau sisa stok & pergerakan barang per outlet"
        showBackButton={true}
        backPath={getHomeBeranda(userRole)}
        currentTime={new Date().toLocaleTimeString()}
      />

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-[4.5rem] md:px-10">
          {/* Judul + aksi */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-telaga-950">Stok Barang</h1>
              <p className="truncate text-[11px] text-telaga-900/45">{branchName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={reloadCurrentTab}
                disabled={loading || moveLoading}
                className="flex items-center gap-1.5 rounded-xl border border-telaga-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-telaga-700 transition-colors hover:border-telaga-300 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${tab === "riwayat" ? (moveLoading ? "animate-spin" : "") : loading ? "animate-spin" : ""}`}
                />
                Muat ulang
              </button>
              <button
                type="button"
                onClick={() => setActiveModal({ type: "new" })}
                className="flex items-center gap-1.5 rounded-xl bg-telaga-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-telaga-800"
              >
                <Plus className="h-3 w-3" />
                Barang
              </button>
            </div>
          </div>

          {/* Notifikasi */}
          {notice && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-telaga-50 px-3 py-2 text-[11px] text-telaga-700 ring-1 ring-telaga-100">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1">{notice}</span>
              <button type="button" onClick={() => setNotice(null)} className="shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Filter */}
          <div className="mb-3 rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Outlet
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className={`mt-1 ${inputClass}`}
                >
                  {branches.length === 0 && <option value="">Memuat outlet…</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {tab === "stok" ? (
                <div className="min-w-0 flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                    Cari barang
                  </label>
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-telaga-900/30" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nama barang"
                      className="w-full rounded-xl border border-telaga-100 bg-krem/50 py-2 pl-8 pr-3 text-sm text-telaga-950 outline-none focus:border-telaga-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Dari
                      </label>
                      <input
                        type="date"
                        value={moveStart}
                        max={moveEnd || undefined}
                        onChange={(e) => {
                          setMovePage(1);
                          setMoveStart(e.target.value);
                        }}
                        className={`mt-1 ${inputClass} ${dateRangeInvalid ? "border-red-300 focus:border-red-400" : ""}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Sampai
                      </label>
                      <input
                        type="date"
                        value={moveEnd}
                        min={moveStart || undefined}
                        onChange={(e) => {
                          setMovePage(1);
                          setMoveEnd(e.target.value);
                        }}
                        className={`mt-1 ${inputClass} ${dateRangeInvalid ? "border-red-300 focus:border-red-400" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {[
                      { label: "Hari ini", days: 0 },
                      { label: "7 hari", days: 6 },
                      { label: "30 hari", days: 29 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const end = todayStr();
                          const from = new Date();
                          from.setDate(from.getDate() - preset.days);
                          setMovePage(1);
                          setMoveStart(toDateStr(from));
                          setMoveEnd(end);
                        }}
                        className="rounded-lg bg-telaga-50 px-2 py-1 text-[10px] font-semibold text-telaga-700 transition-colors hover:bg-telaga-100"
                      >
                        {preset.label}
                      </button>
                    ))}
                    {(moveStart !== monthAgoStr() || moveEnd !== todayStr()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMovePage(1);
                          setMoveStart(monthAgoStr());
                          setMoveEnd(todayStr());
                        }}
                        className="rounded-lg px-2 py-1 text-[10px] font-semibold text-telaga-900/40 underline decoration-dotted transition-colors hover:text-telaga-700"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {dateRangeInvalid && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">
                      Tanggal "Dari" tidak boleh melewati "Sampai".
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab */}
          <div className="mb-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab("stok")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                tab === "stok" ? "bg-telaga-700 text-white" : "bg-white text-telaga-900/50 ring-1 ring-telaga-100"
              }`}
            >
              <Package className="h-3 w-3" />
              Stok
            </button>
            <button
              type="button"
              onClick={() => setTab("riwayat")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                tab === "riwayat"
                  ? "bg-telaga-700 text-white"
                  : "bg-white text-telaga-900/50 ring-1 ring-telaga-100"
              }`}
            >
              <History className="h-3 w-3" />
              Riwayat
            </button>
          </div>

          {tab === "stok" ? (
            <>
              {/* Ringkasan */}
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {cards.map((card) => (
                  <div
                    key={card.key}
                    className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">
                      {card.label}
                    </p>
                    <p className={`text-lg font-bold tabular-nums ${card.tone}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Tabel stok */}
              <div className="overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-telaga-100 bg-telaga-50/60 px-4 py-2.5">
                  <p className="text-[11px] font-bold text-telaga-900">Daftar barang</p>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-telaga-900/50">
                    <input
                      type="checkbox"
                      checked={onlyLow}
                      onChange={(e) => setOnlyLow(e.target.checked)}
                      className="h-3 w-3 rounded border-telaga-200 text-telaga-700 focus:ring-telaga-300"
                    />
                    Hanya menipis / habis
                  </label>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-telaga-900/50">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat stok…
                  </div>
                ) : error ? (
                  <div className="p-4">
                    <div className="rounded-xl bg-red-50 px-3 py-2.5 text-[11px] text-red-700 ring-1 ring-red-100">
                      {error}
                    </div>
                  </div>
                ) : visibleStocks.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <Warehouse className="mx-auto mb-2 h-8 w-8 text-telaga-200" />
                    <p className="text-sm font-semibold text-telaga-900/60">Belum ada barang</p>
                    <p className="mt-0.5 text-[11px] text-telaga-900/35">
                      Klik “Barang” di kanan atas untuk menambah barang jualan
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-telaga-100 bg-white">
                          <th className="w-10 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            No
                          </th>
                          <th className="min-w-[170px] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Barang
                          </th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Harga
                          </th>
                          <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Stok
                          </th>
                          <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Min
                          </th>
                          <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Terjual
                          </th>
                          <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Status
                          </th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-telaga-50">
                        {visibleStocks.map((item, idx) => (
                          <tr key={item.treatment_id} className="transition-colors hover:bg-telaga-50/40">
                            <td className="px-3 py-2.5 text-[11px] tabular-nums text-telaga-900/35">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="truncate text-xs font-bold text-telaga-950">{item.name}</p>
                              <p className="truncate text-[10px] text-telaga-900/40">
                                {item.type_item || "—"}
                                {item.type_service ? ` · ${item.type_service}` : ""}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums text-telaga-950">
                              {rupiah(item.price)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {item.is_tracked ? (
                                <span
                                  className={`text-sm font-bold tabular-nums ${
                                    item.stock_status === "out"
                                      ? "text-red-600"
                                      : item.stock_status === "low"
                                      ? "text-senja-600"
                                      : "text-telaga-950"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                              ) : (
                                <span className="text-xs text-telaga-900/25">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs tabular-nums text-telaga-900/50">
                              {item.is_tracked ? item.min_stock : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <p className="text-xs font-semibold tabular-nums text-telaga-950">
                                {item.sold_today}
                              </p>
                              <p className="text-[9px] text-telaga-900/35">{item.sold_7d} / 7h</p>
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={item.stock_status} />
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {item.is_tracked ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setActiveModal({ type: "restock", item: withBranch(item) })}
                                      className="rounded-lg bg-telaga-50 px-2 py-1.5 text-[10px] font-bold text-telaga-700 transition-colors hover:bg-telaga-100"
                                    >
                                      + Stok
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveModal({ type: "adjust", item: withBranch(item) })}
                                      className="rounded-lg bg-krem px-2 py-1.5 text-[10px] font-bold text-telaga-900/60 transition-colors hover:bg-telaga-50"
                                    >
                                      Koreksi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveModal({ type: "transfer", item: withBranch(item) })}
                                      title="Transfer ke outlet lain"
                                      className="rounded-lg bg-krem p-1.5 text-telaga-900/50 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
                                    >
                                      <ArrowRightLeft className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setActiveModal({ type: "track", item: withBranch(item) })}
                                    className="rounded-lg bg-senja-50 px-2 py-1.5 text-[10px] font-bold text-senja-700 transition-colors hover:bg-senja-100"
                                  >
                                    Track stok
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Ringkasan pergerakan */}
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { key: "in", label: "Stok masuk", tone: "text-telaga-700", value: movementSummary?.in },
                  { key: "sale", label: "Terjual", tone: "text-senja-600", value: movementSummary?.sale },
                  { key: "adjust", label: "Koreksi", tone: "text-telaga-950", value: movementSummary?.adjust },
                  {
                    key: "transfer",
                    label: "Transfer",
                    tone: "text-telaga-950",
                    value: Number(movementSummary?.transfer_in || 0) + Number(movementSummary?.transfer_out || 0),
                  },
                ].map((card) => (
                  <div
                    key={card.key}
                    className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">
                      {card.label}
                    </p>
                    <p className={`text-lg font-bold tabular-nums ${card.tone}`}>{signed(card.value || 0)}</p>
                  </div>
                ))}
              </div>

              {/* Tabel riwayat */}
              <div className="overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-telaga-100 bg-telaga-50/60 px-4 py-2.5">
                  <p className="text-[11px] font-bold text-telaga-900">Riwayat pergerakan stok</p>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={moveType}
                      onChange={(e) => {
                        setMovePage(1);
                        setMoveType(e.target.value);
                      }}
                      className="rounded-lg border border-telaga-100 bg-white px-2 py-1 text-[10px] font-semibold text-telaga-900/70 outline-none focus:border-telaga-400"
                    >
                      <option value="">Semua tipe</option>
                      <option value="in">Stok masuk</option>
                      <option value="sale">Terjual</option>
                      <option value="adjust">Koreksi</option>
                      <option value="transfer_in">Transfer masuk</option>
                      <option value="transfer_out">Transfer keluar</option>
                      <option value="void">Order batal</option>
                    </select>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-telaga-900/30" />
                      <input
                        type="text"
                        value={moveSearch}
                        onChange={(e) => {
                          setMovePage(1);
                          setMoveSearch(e.target.value);
                        }}
                        placeholder="Cari barang"
                        className="w-32 rounded-lg border border-telaga-100 bg-white py-1 pl-6 pr-2 text-[10px] text-telaga-950 outline-none focus:border-telaga-400"
                      />
                    </div>
                  </div>
                </div>

                {moveLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-telaga-900/50">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat riwayat…
                  </div>
                ) : movements.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <History className="mx-auto mb-2 h-8 w-8 text-telaga-200" />
                    <p className="text-sm font-semibold text-telaga-900/60">Belum ada pergerakan stok</p>
                    <p className="mt-0.5 text-[11px] text-telaga-900/35">
                      Riwayat muncul setelah ada stok masuk, penjualan, atau koreksi
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                      <thead>
                        <tr className="border-b border-telaga-100 bg-white">
                          {["Waktu", "Barang", "Tipe", "Qty", "Stok", "Oleh", "Catatan"].map((head, i) => (
                            <th
                              key={head}
                              className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-telaga-900/40 ${
                                i >= 3 && i <= 4 ? "text-center" : "text-left"
                              }`}
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-telaga-50">
                        {movements.map((row) => {
                          const meta = MOVEMENT_META[row.type] || {
                            label: row.type,
                            tone: "text-telaga-900/60",
                          };
                          return (
                            <tr key={row.id} className="transition-colors hover:bg-telaga-50/40">
                              <td className="whitespace-nowrap px-3 py-2.5 text-[11px] tabular-nums text-telaga-900/50">
                                {fmtDateTime(row.created_at)}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="truncate text-xs font-semibold text-telaga-950">
                                  {row.treatment_name || "—"}
                                </p>
                                {row.ref_type === "order" && row.ref_id && (
                                  <p className="text-[9px] text-telaga-900/35">order #{row.ref_id}</p>
                                )}
                              </td>
                              <td className={`whitespace-nowrap px-3 py-2.5 text-[11px] font-bold ${meta.tone}`}>
                                {meta.label}
                              </td>
                              <td className={`px-3 py-2.5 text-center text-xs font-bold tabular-nums ${meta.tone}`}>
                                {signed(row.qty)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-center text-[11px] tabular-nums text-telaga-900/50">
                                {row.stock_before} → {row.stock_after}
                              </td>
                              <td className="px-3 py-2.5 text-[11px] text-telaga-900/50">
                                {row.user_name || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-[11px] text-telaga-900/50">
                                <span className="line-clamp-1">{row.note || "—"}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {movementPagination && movementPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 border-t border-telaga-100 px-4 py-2">
                    <p className="text-[10px] text-telaga-900/40">
                      Halaman {movementPagination.currentPage} dari {movementPagination.totalPages} ·{" "}
                      {movementPagination.totalItems} baris
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMovePage((p) => Math.max(p - 1, 1))}
                        disabled={movementPagination.currentPage <= 1 || moveLoading}
                        className="rounded-lg border border-telaga-100 px-2.5 py-1 text-[10px] font-bold text-telaga-700 disabled:opacity-40"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() => setMovePage((p) => Math.min(p + 1, movementPagination.totalPages))}
                        disabled={movementPagination.currentPage >= movementPagination.totalPages || moveLoading}
                        className="rounded-lg border border-telaga-100 px-2.5 py-1 text-[10px] font-bold text-telaga-700 disabled:opacity-40"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Catatan konsep */}
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-telaga-100 bg-white px-3 py-2.5 text-[10px] leading-relaxed text-telaga-900/50">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-senja-500" />
            <p>
              Stok dipotong otomatis saat transaksi di POS keluar. Barang berstatus{" "}
              <span className="font-bold text-telaga-900/70">Belum di-track</span> (tiket masuk, parkir, sewa
              perahu) tidak dihitung stoknya.
            </p>
          </div>
        </div>
      </main>

      {/* Modal */}
      {activeModal?.type === "restock" && (
        <RestockModal item={activeModal.item} onClose={closeModal} onDone={handleDone} />
      )}
      {activeModal?.type === "adjust" && (
        <AdjustModal item={activeModal.item} onClose={closeModal} onDone={handleDone} />
      )}
      {activeModal?.type === "transfer" && (
        <TransferModal item={activeModal.item} branches={branches} onClose={closeModal} onDone={handleDone} />
      )}
      {activeModal?.type === "track" && (
        <TrackModal item={activeModal.item} onClose={closeModal} onDone={handleDone} />
      )}
      {activeModal?.type === "new" && (
        <NewProductModal branchId={branchId} onClose={closeModal} onDone={handleDone} />
      )}
    </div>
  );
}
