import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AnimatedButton from '../Design/AnimatedButton';
import useSound from '../../hooks/useSound';
import akhirSound from '../../assets/sound/akhir.mp3';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya', cancelText = 'Batal' }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const playSound = useSound();

  // Modifikasi handler untuk onConfirm
  const handleConfirm = async () => {
    try {
      // await playSound(akhirSound);
      onConfirm();
    } catch (error) {
      console.error("Error saat memainkan suara dan konfirmasi:", error);
      onConfirm(); // Tetap jalankan onConfirm meskipun suara gagal
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      setTimeout(() => {
        setShowModal(true);
      }, 100);
    } else {
      setShowModal(false);
      setTimeout(() => {
        setShowOverlay(false);
      }, 300);
    }
  }, [isOpen]);

  if (!showOverlay) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-telaga-950 transition-opacity duration-300 px-4 py-6
        ${showOverlay ? 'bg-opacity-60' : 'bg-opacity-0'}`}
    >
      <div 
        className={`bg-white rounded-3xl p-6 w-full max-w-md ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 transition-all duration-300
          ${showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <h3 className="text-lg font-semibold font-montserrat text-telaga-950 mb-2">{title}</h3>
        <p className="text-sm text-telaga-900/60 mb-6 font-montserrat">{message}</p>
        <div className="flex justify-end gap-3">
          <AnimatedButton
            onClick={onClose}
            variant="default"
            className="px-4 py-2.5 font-montserrat rounded-xl bg-white outline outline-2 outline-telaga-100 text-telaga-800 text-sm font-semibold hover:bg-telaga-50 transition-colors"
          >
            {cancelText}
          </AnimatedButton>
          <AnimatedButton
            onClick={handleConfirm}
            variant="telaga"
            className="px-4 py-2.5 font-montserrat"
          >
            {confirmText}
          </AnimatedButton>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal; 