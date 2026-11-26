import React from 'react';
import { X, Clock, TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ShiftExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('shift_explanation_seen', 'true');
    onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('shift_explanation_seen', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 w-full max-w-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-telaga-600 to-senja-500 px-6 py-5 rounded-t-3xl flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-montserrat mb-1">
                  Panduan Shift
                </h2>
                <p className="text-sm text-telaga-100 font-montserrat leading-relaxed">
                  Sistem tracking kas untuk periode kerja kasir
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-5">
            {/* Konsep Shift */}
            <div className="bg-telaga-50 rounded-xl p-4 border-2 border-telaga-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-telaga-950 font-montserrat text-base mb-1">
                    Apa itu Shift?
                  </h3>
                  <p className="text-sm text-telaga-900 font-montserrat leading-relaxed">
                    Shift adalah periode kerja kasir dengan sistem tracking kas otomatis. 
                    Setiap shift dimulai dengan saldo awal kas (Uang dilaci) dan diakhiri dengan saldo akhir kas (Uang dilaci).
                  </p>
                </div>
              </div>
            </div>

            {/* Flow Kerja */}
            <div>
              <h3 className="font-bold text-telaga-950 font-montserrat text-base mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-telaga-600" />
                Alur Kerja Shift
              </h3>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Buka Shift',
                    desc: 'Input saldo awal kas (uang modal di laci kas saat mulai shift)',
                    color: 'blue'
                  },
                  {
                    step: '2',
                    title: 'Terima Pembayaran',
                    desc: 'Uang Masuk bertambah otomatis saat customer bayar cash',
                    color: 'green'
                  },
                  {
                    step: '3',
                    title: 'Catat Pengeluaran',
                    desc: 'Klik "+ Tambah Pengeluaran" untuk pengeluaran operasional (beli bensin, bayar listrik, dll)',
                    color: 'yellow'
                  },
                  {
                    step: '4',
                    title: 'Monitor Real-time',
                    desc: 'Saldo Akhir dihitung otomatis: Saldo Awal + Uang Masuk - Uang Keluar',
                    color: 'purple'
                  },
                  {
                    step: '5',
                    title: 'End Shift',
                    desc: 'Hitung kas fisik di laci, input Kas Akhir (harus sama dengan Saldo Akhir)',
                    color: 'red'
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 bg-telaga-50/40 rounded-lg p-3 border border-telaga-100">
                    <div className={`w-7 h-7 bg-${item.color}-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm font-montserrat`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-telaga-950 text-sm font-montserrat mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-telaga-900/70 font-montserrat leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Angka-angka Penting */}
            <div>
              <h3 className="font-bold text-telaga-950 font-montserrat text-base mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-telaga-600" />
                Penjelasan Angka
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    icon: <DollarSign className="w-4 h-4 text-telaga-900/70" />,
                    label: 'Saldo Awal',
                    desc: 'Modal awal kas yang diinput saat buka shift',
                    example: 'Contoh: Rp 1.000.000'
                  },
                  {
                    icon: <TrendingUp className="w-4 h-4 text-telaga-600" />,
                    label: 'Uang Masuk',
                    desc: 'Total pembayaran CASH dari customer (otomatis)',
                    example: 'Update real-time saat terima bayar'
                  },
                  {
                    icon: <TrendingDown className="w-4 h-4 text-red-600" />,
                    label: 'Uang Keluar',
                    desc: 'Total pengeluaran operasional yang dicatat',
                    example: 'Beli minum, bayar kurir, dll'
                  },
                  {
                    icon: <DollarSign className="w-4 h-4 text-telaga-600" />,
                    label: 'Saldo Akhir',
                    desc: 'Hasil perhitungan: Saldo Awal + Masuk - Keluar',
                    example: 'Harus SAMA dengan kas fisik!'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border-2 border-telaga-100">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-telaga-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-telaga-950 text-sm font-montserrat mb-1">
                          {item.label}
                        </h4>
                        <p className="text-xs text-telaga-900/70 font-montserrat leading-relaxed mb-1">
                          {item.desc}
                        </p>
                        <p className="text-xs text-telaga-900/60 font-montserrat italic">
                          {item.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fitur Tambahan */}
            <div>
              <h3 className="font-bold text-telaga-950 font-montserrat text-base mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-senja-600" />
                Fitur Penting
              </h3>
              <div className="space-y-3">
                <div className="bg-senja-50 rounded-lg p-3 border border-senja-200">
                  <h4 className="font-semibold text-telaga-950 text-sm font-montserrat mb-2 flex items-center gap-2">
                    📊 Lihat Detail Pembayaran
                  </h4>
                  <p className="text-xs text-telaga-900 font-montserrat leading-relaxed">
                    Breakdown lengkap per akun keuangan (Cash, QRIS, Bank). Menampilkan:
                  </p>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li className="text-xs text-telaga-900/70 font-montserrat">• Uang Masuk & Keluar per akun</li>
                    <li className="text-xs text-telaga-900/70 font-montserrat">• Net Flow (selisih masuk-keluar)</li>
                    <li className="text-xs text-telaga-900/70 font-montserrat">• List transaksi lengkap dengan detail order & customer</li>
                  </ul>
                </div>

                <div className="bg-telaga-50 rounded-lg p-3 border border-telaga-200">
                  <h4 className="font-semibold text-telaga-950 text-sm font-montserrat mb-2 flex items-center gap-2">
                    ➕ Tambah Pengeluaran
                  </h4>
                  <p className="text-xs text-telaga-900 font-montserrat leading-relaxed">
                    Catat pengeluaran operasional selama shift. Pilih metode pembayaran (Cash/QRIS/Bank), 
                    input nominal, dan tambahkan catatan untuk tracking lengkap.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Penting */}
            <div className="bg-gradient-to-br from-senja-50 to-senja-50 rounded-xl p-4 border-2 border-senja-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-senja-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-senja-900 font-montserrat text-sm mb-2">
                    ⚠️ Tips Penting
                  </h3>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-senja-800 font-montserrat leading-relaxed">
                      • <strong>Angka di ringkasan adalah CASH-ONLY</strong>, bukan total semua metode
                    </li>
                    <li className="text-xs text-senja-800 font-montserrat leading-relaxed">
                      • <strong>Saldo Akhir harus match</strong> dengan kas fisik saat end shift
                    </li>
                    <li className="text-xs text-senja-800 font-montserrat leading-relaxed">
                      • <strong>Pengeluaran bisa pakai metode apapun</strong> (Cash/QRIS/Bank)
                    </li>
                    <li className="text-xs text-senja-800 font-montserrat leading-relaxed">
                      • <strong>Validasi ketat saat end shift</strong> untuk mencegah fraud/error
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-telaga-50 rounded-xl p-4 border-2 border-telaga-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-telaga-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-telaga-900 font-montserrat text-sm mb-1">
                    Siap Mulai Shift!
                  </h3>
                  <p className="text-xs text-telaga-700 font-montserrat leading-relaxed">
                    Dengan sistem ini, tracking kas jadi transparan dan akurat. 
                    Semua transaksi tercatat otomatis, jadi kamu fokus melayani customer! 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-telaga-50/40 px-6 py-4 border-t border-telaga-100 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleDontShowAgain}
              className="flex-1 px-4 py-3 bg-telaga-200 hover:bg-telaga-300 text-telaga-900 rounded-xl font-semibold text-sm font-montserrat transition-colors"
            >
              Jangan Tampilkan Lagi
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-telaga-500 hover:bg-telaga-600 text-white rounded-xl font-semibold text-sm font-montserrat transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftExplanationModal;
