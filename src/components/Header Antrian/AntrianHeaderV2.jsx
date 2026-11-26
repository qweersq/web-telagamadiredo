import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../Design/AnimatedButton';

const AntrianHeaderV2 = ({ onSearch, searchQuery, setSearchQuery, title = 'Antrian', rightAction = null }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-white shadow-lg">
      <div className="mx-auto px-4 py-4 md:px-10">
        <div className="flex flex-col gap-4">
          {/* Header dengan Back Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Kembali"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold font-montserrat text-gray-800">{title}</h1>
            </div>

            {/* Slot opsional di kanan judul (mis. tombol "Riwayat") */}
            {rightAction ? <div className="flex items-center">{rightAction}</div> : null}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari nama pelanggan, nomor HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <AnimatedButton
              onClick={onSearch}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold text-sm"
            >
              Cari
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntrianHeaderV2;
