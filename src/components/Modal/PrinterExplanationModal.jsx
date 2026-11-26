import React from 'react';
import { Printer, Bluetooth, Smartphone, Wifi, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const PrinterExplanationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8 font-montserrat"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Modal Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-montserrat">Manajemen Printer</h2>
              <p className="text-blue-100 text-sm font-montserrat">Panduan setup printer Bluetooth dan koneksi perangkat</p>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Penjelasan Utama */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Printer className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2 font-montserrat">Apa itu Manajemen Printer?</h3>
                  <p className="text-blue-700 text-sm leading-relaxed font-montserrat">
                    Manajemen Printer adalah fitur untuk mengatur printer Bluetooth di setiap cabang. 
                    Anda dapat menghubungkan printer thermal 58mm dengan perangkat melalui Bluetooth, 
                    melakukan test print, dan mengatur printer default untuk setiap outlet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spesifikasi Printer */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Settings className="w-5 h-5 text-green-500" />
              Spesifikasi Printer Wajib
            </h3>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2 font-montserrat">Printer Thermal 58mm</h4>
                  <p className="text-green-700 text-sm leading-relaxed font-montserrat">
                    Gunakan printer thermal dengan lebar kertas 58mm yang mendukung Bluetooth. 
                    Printer ini cocok untuk mencetak struk transaksi, invoice, dan dokumen bisnis lainnya.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Requirements */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Smartphone className="w-5 h-5 text-purple-500" />
              Persyaratan Browser
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">📱</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">iOS (iPhone/iPad)</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan browser <strong>Bluefy</strong> untuk mengakses fitur printer Bluetooth. Chrome dan Safari tidak mendukung Bluetooth di iOS.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs font-bold">🤖</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Android</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan <strong>Google Chrome</strong> untuk mengakses fitur printer. Chrome mendukung Bluetooth secara native di Android.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur Utama */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Bluetooth className="w-5 h-5 text-blue-500" />
              Fitur Manajemen Printer
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Setup Printer per Cabang</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Atur printer khusus untuk setiap outlet/cabang dengan konfigurasi yang sesuai</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Koneksi Bluetooth</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Cari dan hubungkan printer melalui Bluetooth dengan mudah</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Test Print</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Uji koneksi printer dengan melakukan test print untuk memastikan printer berfungsi</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Printer Default</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Set printer default untuk setiap cabang agar transaksi otomatis menggunakan printer yang tepat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cara Penggunaan */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Wifi className="w-5 h-5 text-orange-500" />
              Cara Penggunaan
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Pilih Cabang</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pilih outlet/cabang yang akan diatur printernya</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Cari Printer</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Klik "Cari Printer" untuk mencari printer Bluetooth yang tersedia</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Hubungkan Printer</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pilih printer dari daftar dan hubungkan. Device ID akan auto-generate</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Test & Set Default</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Lakukan test print dan set sebagai printer default untuk cabang</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Penting */}
          <div className="mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2 font-montserrat">
              <AlertCircle className="w-5 h-5" />
              Informasi Penting
            </h3>
            <div className="text-yellow-700 text-sm space-y-2 font-montserrat">
              <p>• <strong>Nama Printer:</strong> Hanya nama printer yang bisa diubah, device ID auto-generate saat koneksi</p>
              <p>• <strong>Bluetooth:</strong> Pastikan Bluetooth aktif dan printer dalam jangkauan</p>
              <p>• <strong>Browser:</strong> iOS wajib pakai Bluefy, Android pakai Chrome</p>
              <p>• <strong>Spesifikasi:</strong> Printer thermal 58mm dengan dukungan Bluetooth</p>
              <p>• <strong>Test Print:</strong> Selalu lakukan test print setelah setup untuk memastikan printer berfungsi</p>
            </div>
          </div>

          {/* Contoh Setup */}
          <div className="mb-6">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 font-montserrat">
              <Info className="w-5 h-5" />
              Contoh Setup Printer
            </h3>
            <div className="text-green-700 text-sm space-y-2 font-montserrat">
              <p>• <strong>Cabang A:</strong> "Printer Kasir 1" → Printer thermal 58mm → Set Default</p>
              <p>• <strong>Cabang B:</strong> "Printer Utama" → Printer thermal 58mm → Set Default</p>
              <p>• <strong>Cabang C:</strong> "Printer Backup" → Printer thermal 58mm → Set Default</p>
              <p>• <strong>Test Print:</strong> Cek hasil print struk, invoice, dan dokumen lainnya</p>
            </div>
          </div>

          {/* Manfaat */}
          <div className="mb-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">📊</span>
              Manfaat Manajemen Printer
            </h3>
            <ul className="text-blue-700 text-sm space-y-1 font-montserrat">
              <li>• Setup printer khusus per cabang/outlet</li>
              <li>• Koneksi Bluetooth yang mudah dan cepat</li>
              <li>• Test print untuk memastikan printer berfungsi</li>
              <li>• Printer default otomatis untuk setiap transaksi</li>
              <li>• Dukungan printer thermal 58mm standar industri</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <AnimatedButton
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all duration-200 font-montserrat"
            >
              Tutup
            </AnimatedButton>
            <AnimatedButton
              onClick={onConfirm}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-200 font-montserrat"
            >
              Mulai Setup Printer
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterExplanationModal;
