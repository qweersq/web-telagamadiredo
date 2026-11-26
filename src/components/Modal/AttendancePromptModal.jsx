import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';

const AttendancePromptModal = ({ isOpen, onClose, onNavigateToAttendance }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-telaga-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClock className="text-telaga-600 text-lg font-semibold" />
          </div>
          
          <h3 className="text-lg font-montserrat text-gray-900 mb-2">
            Selamat Datang!
          </h3>
          <p className="font-montserrat text-sm text-gray-600 mb-4">
            Silakan lakukan absensi terlebih dahulu sebelum memilih peran kerja Anda
          </p>
          
          <div className="bg-telaga-50 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-center mb-2">
              <FaMapMarkerAlt className="text-telaga-600 text-sm mr-2" />
              <span className="text-telaga-800 text-xs font-montserrat font-medium">
                Absensi Wajib
              </span>
            </div>
            <p className="text-telaga-900/70 text-xs font-montserrat leading-relaxed">
              Pastikan Anda berada di lokasi kantor saat melakukan absensi
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <AnimatedButton
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-xl font-montserrat text-sm"
          >
            Nanti Dulu
          </AnimatedButton>
          <AnimatedButton
            onClick={onNavigateToAttendance}
            className="flex-1 bg-telaga-600 hover:bg-telaga-700 text-white py-3 rounded-xl font-montserrat text-sm"
          >
            Absensi Sekarang
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default AttendancePromptModal;
