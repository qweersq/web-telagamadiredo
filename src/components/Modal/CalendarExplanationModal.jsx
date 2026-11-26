import { X, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const CalendarExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('calendar_explanation_seen', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-6 sm:p-8"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-telaga-100 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-telaga-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-telaga-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-telaga-950 font-montserrat">
                  Kalender Operasional
                </h2>
                <p className="text-sm text-telaga-900/60 font-montserrat">
                  Pantau deadline item dan pembayaran dengan mudah
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-telaga-100 rounded-lg flex items-center justify-center hover:bg-telaga-200 transition-colors"
            >
              <X className="w-4 h-4 text-telaga-900/60" />
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
            {/* Tujuan Fitur */}
            <div className="bg-telaga-50 rounded-xl p-4 border border-telaga-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <div>
                  <h3 className="font-bold text-telaga-900 mb-1 text-sm font-montserrat">Tujuan Fitur</h3>
                  <p className="text-xs text-telaga-800 font-montserrat">
                    Calendar membantu Anda <strong>memonitor deadline</strong> item dan pembayaran dalam satu tampilan kalender. Identifikasi cepat item yang sudah selesai, pending, atau terlambat.
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Tanggal Selesai */}
            <div className="bg-telaga-50 rounded-xl p-4 border border-telaga-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-telaga-900 mb-1 text-sm font-montserrat">Tab "Tanggal Selesai"</h3>
                  <p className="text-xs text-telaga-800 mb-2 font-montserrat">
                    Menampilkan <strong>deadline pengerjaan item</strong> berdasarkan tanggal selesai yang ditetapkan:
                  </p>
                  <ul className="text-xs text-telaga-800 space-y-1 font-montserrat">
                    <li>• <strong className="text-telaga-900">Hijau:</strong> Semua item selesai</li>
                    <li>• <strong className="text-senja-700">Kuning:</strong> Ada item pending</li>
                    <li>• <strong className="text-red-700">Merah:</strong> Ada item terlambat</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tab Tanggal Bayar */}
            <div className="bg-senja-50 rounded-xl p-4 border border-senja-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-senja-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-senja-900 mb-1 text-sm font-montserrat">Tab "Tanggal Bayar"</h3>
                  <p className="text-xs text-senja-800 mb-2 font-montserrat">
                    Menampilkan <strong>deadline pembayaran</strong> berdasarkan tanggal masuk pesanan:
                  </p>
                  <ul className="text-xs text-senja-800 space-y-1 font-montserrat">
                    <li>• <strong className="text-telaga-900">Hijau:</strong> Semua pembayaran lunas</li>
                    <li>• <strong className="text-senja-700">Kuning:</strong> Ada pembayaran pending</li>
                    <li>• <strong className="text-red-700">Merah:</strong> Ada pembayaran terlambat</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Detail Tanggal */}
            <div className="bg-senja-50 rounded-xl p-4 border border-senja-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-senja-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-senja-900 mb-1 text-sm font-montserrat">Detail Tanggal</h3>
                  <p className="text-xs text-senja-800 font-montserrat">
                    Klik tanggal di kalender untuk melihat <strong>daftar lengkap item/pesanan</strong> pada tanggal tersebut. Anda bisa langsung cek status, update pembayaran, atau lihat detail pesanan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-telaga-50/40 px-6 py-4 border-t border-telaga-100 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-telaga-600 hover:bg-telaga-700 text-white rounded-xl font-semibold text-sm transition-colors font-montserrat"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarExplanationModal;

