import { X, UserPlus, CheckCircle } from 'lucide-react';

const ReferralExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('referral_explanation_seen', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Sistem Referral
                </h2>
                <p className="text-sm text-gray-600 font-montserrat">
                  Track customer yang merefer order ini
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
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
            {/* Cara Penggunaan */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-1 text-sm font-montserrat">Cara Penggunaan</h3>
                  <p className="text-xs text-purple-800 mb-2 font-montserrat">
                    Sistem referral memungkinkan customer untuk saling merefer:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>Kode Referral = Nomor HP</strong><br/>
                        Setiap customer punya kode referral melalui nomor HP mereka
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>Customer Merefer ke Teman/Keluarga</strong><br/>
                        Customer bisa menawarkan kode referral (nomor HP) ke teman atau keluarga. Admin/Kasir akan memberikan potongan/reward di bagian pembayaran jika diperlukan
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>Input Nomor HP Referrer</strong><br/>
                        Saat customer baru order, masukkan nomor HP customer yang merefer untuk tracking
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>Potongan Manual oleh Admin/Kasir</strong><br/>
                        Jika ingin berikan reward/potongan, Admin/Kasir dapat memilih diskon di bagian pembayaran secara manual
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Kerja */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 mb-1 text-sm font-montserrat">Cara Kerja</h3>
                  <p className="text-xs text-green-800 mb-2 font-montserrat">
                    Sistem referral membantu tracking customer yang merefer order:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>1️⃣ Input Nomor HP:</strong> Masukkan nomor HP customer yang merefer order ini
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>2️⃣ Klik "Cek":</strong> Sistem akan mencari customer dengan nomor HP tersebut
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>3️⃣ Otomatis Tersimpan:</strong> Jika customer ditemukan, data referral otomatis tersimpan untuk tracking
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manfaat */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1 text-sm font-montserrat">Manfaat</h3>
                  <p className="text-xs text-blue-800 font-montserrat">
                    Dengan sistem referral, Anda bisa:
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1 font-montserrat list-disc list-inside">
                    <li>Track customer yang paling aktif merefer</li>
                    <li>Analisis efektivitas program referral</li>
                    <li>Data untuk Admin/Kasir memberikan reward/potongan manual</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1 text-sm font-montserrat">Catatan</h3>
                  <p className="text-xs text-yellow-800 font-montserrat">
                    • Field referral hanya muncul untuk customer baru (belum pernah order)<br/>
                    • Nomor HP referral bersifat opsional<br/>
                    • Format nomor HP: 08XX atau 628XX (otomatis dinormalisasi)<br/>
                    • Saat ini sistem referral hanya untuk tracking. Potongan/reward diberikan manual oleh Admin/Kasir di bagian pembayaran
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-lg hover:from-[#4088EB] hover:to-[#6BC1ED] transition-all font-montserrat font-semibold"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralExplanationModal;

