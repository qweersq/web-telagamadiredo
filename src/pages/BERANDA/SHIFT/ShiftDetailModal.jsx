import React from 'react';
import { X, Clock, Wallet, Building2, Receipt, TrendingUp } from 'lucide-react';
import { formatPaymentMethod } from '../../../utils/labelFormatter';

const ShiftDetailModal = ({ shift, onClose }) => {
  if (!shift) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${date} · ${formatTime(dateString)}`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (startTime, endTime) => {
    if (!endTime) return 'Berjalan';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours} jam ${diffMinutes} menit`;
  };

  const getStatusBadge = () => {
    if (!shift.end_time) {
      return (
        <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/25">
          <div className="mr-1.5 h-2 w-2 rounded-full bg-telaga-200"></div>
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/25">
        <div className="mr-1.5 h-2 w-2 rounded-full bg-white/60"></div>
        Selesai
      </span>
    );
  };

  const difference = parseFloat(shift.difference || 0);
  const differenceLabel = difference === 0 ? 'Sesuai' : difference > 0 ? 'Lebih' : 'Kurang';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-telaga-700 via-telaga-800 to-telaga-950 px-5 py-4">
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-senja-400/25 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative rounded-lg bg-white/15 p-2 ring-1 ring-white/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="relative text-base font-bold text-white">Rekap Shift #{shift.id}</h2>
                <p className="relative text-xs text-white/70">
                  {shift.employee_shift?.name || 'Karyawan tidak diketahui'}
                  {shift.branch?.name ? ` · ${shift.branch.name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge()}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-3">
              {/* Waktu operasional */}
              <div className="rounded-xl border border-telaga-100 bg-krem p-4">
                <h3 className="mb-3 flex items-center text-sm font-bold text-telaga-950">
                  <Clock className="mr-2 h-4 w-4 text-telaga-700" />
                  Waktu operasional
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Shift dibuka</span>
                    <span className="text-right font-semibold text-telaga-950">{formatDate(shift.start_time)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Shift ditutup</span>
                    <span className="text-right font-semibold text-telaga-950">
                      {shift.end_time ? formatDate(shift.end_time) : 'Belum ditutup'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Durasi</span>
                    <span className="font-semibold text-telaga-950">{getDuration(shift.start_time, shift.end_time)}</span>
                  </div>
                </div>
              </div>

              {/* Kasir & cabang */}
              <div className="rounded-xl border border-telaga-100 bg-krem p-4">
                <h3 className="mb-3 flex items-center text-sm font-bold text-telaga-950">
                  <Building2 className="mr-2 h-4 w-4 text-telaga-700" />
                  Kasir & cabang
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Kasir</span>
                    <span className="text-right font-semibold text-telaga-950">
                      {shift.employee_shift?.name || 'Karyawan tidak diketahui'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Cabang</span>
                    <span className="text-right font-semibold text-telaga-950">
                      {shift.branch?.name || 'Cabang tidak diketahui'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Lokasi</span>
                    <span className="text-right font-medium text-telaga-900/70">{shift.branch?.address || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Rekap kas */}
              <div className="rounded-xl border border-telaga-100 bg-krem p-4">
                <h3 className="mb-3 flex items-center text-sm font-bold text-telaga-950">
                  <Wallet className="mr-2 h-4 w-4 text-telaga-700" />
                  Rekap kas
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Kas awal</span>
                    <span className="font-semibold text-telaga-950">{formatCurrency(shift.cash_initial)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Kas masuk</span>
                    <span className="font-semibold text-telaga-700">{formatCurrency(shift.cash_inflow)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Kas keluar</span>
                    <span className="font-semibold text-red-600">{formatCurrency(shift.cash_outflow)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Kas seharusnya</span>
                    <span className="font-semibold text-telaga-950">{formatCurrency(shift.cash_expected)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3 border-t border-telaga-100 pt-2">
                    <span className="text-telaga-900/50">Kas akhir</span>
                    <span className="font-semibold text-telaga-950">{formatCurrency(shift.cash_actual)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Selisih ({differenceLabel})</span>
                    <span className={`font-bold ${difference === 0 ? 'text-telaga-700' : difference > 0 ? 'text-senja-700' : 'text-red-600'}`}>
                      {formatCurrency(shift.difference)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rekap penjualan */}
              <div className="rounded-xl border border-telaga-100 bg-krem p-4">
                <h3 className="mb-3 flex items-center text-sm font-bold text-telaga-950">
                  <TrendingUp className="mr-2 h-4 w-4 text-telaga-700" />
                  Rekap penjualan
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Pendapatan</span>
                    <span className="font-semibold text-telaga-950">{formatCurrency(shift.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Transaksi</span>
                    <span className="font-semibold text-telaga-950">{shift.transaction || 0}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Item terjual</span>
                    <span className="font-semibold text-telaga-950">{shift.item || 0}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-telaga-900/50">Rata-rata / transaksi</span>
                    <span className="font-semibold text-telaga-950">
                      {formatCurrency(shift.transaction ? parseFloat(shift.total_revenue || 0) / shift.transaction : 0)}
                    </span>
                  </div>
                  {parseFloat(shift.unpaid || 0) > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-telaga-900/50">Belum dibayar</span>
                      <span className="font-semibold text-senja-700">{formatCurrency(shift.unpaid)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {shift.payment_methods && Object.keys(shift.payment_methods).length > 0 && (
            <div className="mb-3">
              <h3 className="mb-2 flex items-center text-sm font-bold text-telaga-950">
                <Receipt className="mr-2 h-4 w-4 text-telaga-700" />
                Metode pembayaran
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(shift.payment_methods).map(([method, data]) => (
                  <div key={method} className="rounded-xl border border-telaga-100 bg-krem p-3">
                    <div className="mb-2 text-sm font-semibold text-telaga-950">
                      {formatPaymentMethod(method)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-telaga-900/50">Transaksi</span>
                        <span className="font-semibold text-telaga-950">{data.count || 0}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-telaga-900/50">Total</span>
                        <span className="font-semibold text-telaga-950">{formatCurrency(data.amount || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          <div>
            <h3 className="mb-2 flex items-center text-sm font-bold text-telaga-950">
              <Receipt className="mr-2 h-4 w-4 text-red-600" />
              Pengeluaran operasional ({shift.expenses?.length || 0})
            </h3>

            {shift.expenses && shift.expenses.length > 0 ? (
              <div className="space-y-2">
                {shift.expenses.map((expense) => (
                  <div key={expense.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-telaga-950">{expense.name}</h4>
                        {expense.description && (
                          <p className="mt-1 text-xs text-telaga-900/50">{expense.description}</p>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-base font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-telaga-900/50">
                      <span>{formatDate(expense.createdAt)}</span>
                      {expense.finance_account?.payment_method?.code && (
                        <span className="rounded-full bg-telaga-50 px-2 py-0.5 font-semibold text-telaga-700">
                          {formatPaymentMethod(expense.finance_account.payment_method.code)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="rounded-xl border border-red-200 bg-red-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-telaga-950">Total pengeluaran</span>
                    <span className="text-base font-bold text-red-600">
                      {formatCurrency(shift.total_expenses)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-telaga-200 bg-white/60 px-6 py-8 text-center">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-telaga-900/20" />
                <p className="text-xs text-telaga-900/55">Tidak ada pengeluaran pada shift ini</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShiftDetailModal;
