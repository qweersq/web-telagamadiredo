import React from 'react';
import { MessageSquare, FileText, Users, Zap, Edit3, Eye } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const TemplateExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
              <h2 className="text-xl font-bold">Template WA Follow-Up</h2>
              <p className="text-blue-100 text-sm">Panduan penggunaan template WhatsApp</p>
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
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Apa itu Template WA Follow-Up?</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Template WhatsApp ini digunakan untuk follow-up manual kepada customer. 
                    Template-template ini bisa dipilih dan disesuaikan dengan kebutuhan Anda, 
                    serta bisa menggunakan nama customer atau variabel lainnya secara dinamis.
                  </p>
                </div>
              </div>
            </div>

            {/* Fitur Utama */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Fitur Utama
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Follow-Up Manual</h4>
                    <p className="text-gray-600 text-xs">Template bisa digunakan untuk follow-up manual ke customer</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Variabel Dinamis</h4>
                    <p className="text-gray-600 text-xs">Gunakan variabel seperti `customer_name`, `business_name`, `branch_name` untuk personalisasi</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Preview Template</h4>
                    <p className="text-gray-600 text-xs">Lihat preview template dengan data sample sebelum digunakan</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Edit & Customize</h4>
                    <p className="text-gray-600 text-xs">Edit template sesuai kebutuhan dan tambahkan variabel baru</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Penggunaan */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Cara Penggunaan
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Edit3 className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">1. Buat Template</h4>
                    <p className="text-gray-600 text-xs">Klik "Buat Template" untuk membuat template baru dengan variabel yang diinginkan</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Eye className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">2. Preview Template</h4>
                    <p className="text-gray-600 text-xs">Gunakan tombol "Preview" untuk melihat hasil template dengan data sample</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">3. Gunakan untuk Follow-Up</h4>
                    <p className="text-gray-600 text-xs">Copy template dan sesuaikan variabel dengan data customer yang sebenarnya</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Penggunaan */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Tips Penggunaan
              </h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Gunakan variabel yang relevan seperti nama customer, nama bisnis, dan cabang</li>
                <li>• Buat template yang personal dan ramah untuk meningkatkan engagement</li>
                <li>• Test template dengan preview sebelum mengirim ke customer</li>
                <li>• Simpan template yang sering digunakan untuk efisiensi</li>
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
              Mengerti
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateExplanationModal;
