import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AnimatedButton from "../Design/AnimatedButton";

const Modal = ({ isOpen, onClose, title, children }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-telaga-950 transition-opacity duration-300 flex items-center justify-center z-[9999] px-4 py-6
        ${showOverlay ? "bg-opacity-60" : "bg-opacity-0"}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-3xl p-6 w-full max-w-md ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 transition-all duration-300
          ${
            showModal
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 scale-95"
          }`}
      >
        <button
          className="absolute top-4 right-4 text-telaga-400 hover:text-telaga-700 text-3xl leading-none"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-semibold font-montserrat text-telaga-950 mb-1 pr-8">{title}</h2>
        <p className="text-xs font-montserrat text-telaga-900/50 mb-1">Telaga Madiredo</p>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
