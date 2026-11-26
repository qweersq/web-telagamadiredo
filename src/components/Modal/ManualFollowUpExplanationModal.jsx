import React from 'react';
import { MessageSquare, Users, Clock, Copy, CheckCircle, Filter, Eye } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const ManualFollowUpExplanationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Modal Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Manual Follow-Up Customer</h2>
              <p className="text-blue-100 text-sm">Panduan follow-up pelanggan lama</p>
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
          <div className="space-y-6">
            {/* Penjelasan Utama */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Apa itu Manual Follow-Up?</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Fitur ini memungkinkan Anda untuk follow-up pelanggan lama yang sudah tidak order kembali. 
                    Anda bisa menawarkan promo atau menanyakan kondisi item yang sudah pernah dicuci, 
                    dan sistem akan menandai customer yang sudah di-follow up.
                  </p>
                </div>
              </div>
            </div>

            {/* Fitur Utama */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Fitur Utama
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Follow-Up Pelanggan Lama</h4>
                    <p className="text-gray-600 text-xs">Target pelanggan yang sudah lama tidak order untuk ditawarkan promo atau ditanyakan kondisi item</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Template WhatsApp</h4>
                    <p className="text-gray-600 text-xs">Gunakan template pesan yang sudah disiapkan dengan variabel dinamis untuk personalisasi</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Tracking Follow-Up</h4>
                    <p className="text-gray-600 text-xs">Sistem akan menandai customer yang sudah di-follow up dan tidak akan muncul di follow-up selanjutnya</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Filter Periode</h4>
                    <p className="text-gray-600 text-xs">Pilih periode dormant customer (20-30 hari, 30-40 hari, dst.) untuk fokus follow-up</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Penggunaan */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500" />
                Cara Penggunaan
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Filter className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">1. Pilih Filter</h4>
                    <p className="text-gray-600 text-xs">Klik "Pilih Filter Follow-Up" untuk memilih periode dormant dan template WhatsApp</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Eye className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">2. Preview Pesan</h4>
                    <p className="text-gray-600 text-xs">Gunakan tombol "Preview" untuk melihat pesan yang akan dikirim ke customer</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Copy className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">3. Copy Pesan</h4>
                    <p className="text-gray-600 text-xs">Klik "Copy" untuk menyalin pesan ke clipboard, lalu kirim manual di WhatsApp</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">4. Buka WhatsApp</h4>
                    <p className="text-gray-600 text-xs">Klik "WA" untuk langsung membuka WhatsApp dengan pesan yang sudah disiapkan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking System */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Sistem Tracking
              </h3>
              <div className="text-green-700 text-sm space-y-2">
                <p>• <strong>Copy Chat:</strong> Customer akan ditandai sebagai "Terkirim" dan tidak muncul di follow-up selanjutnya</p>
                <p>• <strong>Buka WA:</strong> Customer juga akan ditandai sebagai "Terkirim" setelah membuka WhatsApp</p>
                <p>• <strong>Reload Data:</strong> Gunakan tombol "Reload" untuk melihat data terbaru setelah follow-up</p>
                <p>• <strong>Next Follow-Up:</strong> Customer yang sudah di-follow up akan masuk ke periode follow-up selanjutnya</p>
              </div>
            </div>

            {/* Tips Penggunaan */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Tips Penggunaan
              </h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Pilih periode yang tepat (semakin lama tidak order, semakin penting untuk di-follow up)</li>
                <li>• Gunakan template yang personal dan ramah untuk meningkatkan engagement</li>
                <li>• Preview pesan sebelum mengirim untuk memastikan konten sesuai</li>
                <li>• Follow-up secara berkala untuk menjaga hubungan dengan customer</li>
                <li>• Tawarkan promo atau diskon khusus untuk menarik customer kembali</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <AnimatedButton
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all duration-200"
            >
              Tutup
            </AnimatedButton>
            <AnimatedButton
              onClick={onConfirm}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-200"
            >
              Mulai Follow-Up
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualFollowUpExplanationModal;
