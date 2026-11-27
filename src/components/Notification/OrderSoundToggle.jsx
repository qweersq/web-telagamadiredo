import { Bell, BellOff } from 'lucide-react';
import useOrderSound from '../../hooks/useOrderSound';

/**
 * Tombol kecil untuk menyalakan bel pesanan.
 *
 * Selain menyimpan preferensi, klik di sini juga menjadi gesture yang
 * membuka izin audio browser (Chrome/Safari memblokir play() tanpa gesture).
 */
const OrderSoundToggle = ({ className = '' }) => {
  const { enabled, unlocked, setEnabled } = useOrderSound();

  const active = enabled && unlocked;
  const needsGesture = enabled && !unlocked;

  const label = active
    ? 'Bel pesanan aktif'
    : needsGesture
      ? 'Klik untuk mengaktifkan bel'
      : 'Bel pesanan mati';

  const tone = active
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    : needsGesture
      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100';

  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      title={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${tone} ${className}`}
    >
      {active ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default OrderSoundToggle;
