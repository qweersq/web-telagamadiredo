import React, { useRef, useEffect } from "react";

export default function ValidationModal({ open, onClose, errors = [], warnings = [], info = [] }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-[90vw] max-w-md max-h-[80vh] p-4 flex flex-col font-montserrat"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-2 flex items-center gap-2">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-yellow-400"><circle cx="12" cy="12" r="12" fill="#facc15" /><path d="M12 7v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="16" r="1.2" fill="#fff" /></svg>
          <span className="font-semibold text-lg font-montserrat">Validasi</span>
        </div>
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {errors.length > 0 && (
            <div>
              <div className="font-bold text-red-600 mb-1 font-montserrat">Error</div>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((msg, i) => (
                  <li key={"err-"+i} className="text-red-600 text-sm font-montserrat">{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <div className="font-bold text-yellow-600 mb-1 font-montserrat">Warning</div>
              <ul className="list-disc pl-5 space-y-1">
                {warnings.map((msg, i) => (
                  <li key={"warn-"+i} className="text-yellow-700 text-sm font-montserrat">{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {info.length > 0 && (
            <div>
              <div className="font-bold text-blue-600 mb-1 font-montserrat">Info</div>
              <ul className="list-disc pl-5 space-y-1">
                {info.map((msg, i) => (
                  <li key={"info-"+i} className="text-blue-700 text-sm font-montserrat">{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {errors.length === 0 && warnings.length === 0 && info.length === 0 && (
            <div className="text-gray-500 text-center font-montserrat">Tidak ada validasi.</div>
          )}
        </div>
      </div>
    </div>
  );
} 