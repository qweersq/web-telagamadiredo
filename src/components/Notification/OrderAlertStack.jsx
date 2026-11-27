import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { BellRing, X } from 'lucide-react';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number(value) || 0
  );

// Tanggal tidak valid akan membuat `format` melempar RangeError dan mematikan
// seluruh beranda, jadi jam ditampilkan hanya kalau tanggalnya benar.
const formatTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return format(date, 'HH:mm', { locale: localeId });
};

/**
 * Tumpukan kartu "pesanan baru" yang muncul bersamaan dengan bel.
 * `toasts` berasal dari `useOrderAlert`.
 */
const OrderAlertStack = ({ toasts = [], onDismiss, onSelect }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,20rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl border border-amber-200 bg-white shadow-lg shadow-amber-100/60 overflow-hidden"
        >
          <div className="flex items-start gap-2 px-3 py-2.5">
            <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <BellRing className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900">Pesanan baru masuk</p>
              <p className="mt-0.5 truncate text-[11px] text-gray-600">
                {[toast.orderCode, toast.sellingBranchName].filter(Boolean).join(' • ') || 'Order'}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {[toast.customerName || 'Pelanggan Umum', toast.tableNumber ? `Meja ${toast.tableNumber}` : null]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              {toast.summary && (
                <p className="mt-1 line-clamp-2 text-[11px] text-gray-700">{toast.summary}</p>
              )}
              <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                <span>{formatRupiah(toast.totalAmount)}</span>
                <span>
                  {formatTime(toast.createdAt)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(toast)}
              className="w-full border-t border-amber-100 bg-amber-50/60 px-3 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
            >
              Lihat pesanan
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderAlertStack;
