import React from "react";

export default function ValidationFloatingIcon({ count = 0, onClick }) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-4 top-1/2 z-50 flex flex-col items-center justify-center transform -translate-y-1/2 bg-yellow-400 shadow-lg rounded-full w-11 h-11 p-0.5 active:scale-95 transition-all border-2 border-white"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
      aria-label="Show validation messages"
    >
      <span className="relative flex items-center justify-center w-full h-full">
        {/* Warning icon (exclamation mark) */}
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#facc15" />
          <path d="M12 7v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.2" fill="#fff" />
        </svg>
        {/* Badge count */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center border border-white">
          {count}
        </span>
      </span>
    </button>
  );
} 