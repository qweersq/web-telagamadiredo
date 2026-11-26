import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Template warna (sama seperti mobile)
const TEMPLATE_COLORS = [
  // Warna wajib
  { name: 'Hitam', value: '#000000' },
  { name: 'Putih', value: '#FFFFFF' },
  // Warna basic
  { name: 'Biru', value: '#5096FC' },
  { name: 'Hijau', value: '#10B981' },
  { name: 'Merah', value: '#EF4444' },
  { name: 'Kuning', value: '#F59E0B' },
  { name: 'Ungu', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Abu-abu', value: '#6B7280' },
  { name: 'Coklat', value: '#92400E' },
  { name: 'Biru Tua', value: '#1E40AF' },
  { name: 'Hijau Tua', value: '#065F46' },
  { name: 'Merah Tua', value: '#991B1B' },
];

const ColorPickerTemplate = ({ currentColor, onSelectColor, label }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor || '#5096FC');

  const handleSelectTemplate = (color) => {
    onSelectColor(color);
    handleCloseModal();
  };

  const handleCustomColor = () => {
    const hexColor = customColor.startsWith('#') ? customColor : `#${customColor}`;
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
      onSelectColor(hexColor);
      handleCloseModal();
    }
  };

  const handleOpenModal = () => {
    setCustomColor(currentColor || '#5096FC');
    setShowCustom(false);
    setShowOverlay(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      setShowModal(true);
    }, 100);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setShowOverlay(false);
      document.body.style.overflow = 'unset';
    }, 300);
    setShowCustom(false);
    setCustomColor(currentColor || '#5096FC');
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showOverlay) {
        handleCloseModal();
      }
    };

    if (showOverlay) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showOverlay]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white"
        >
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
            style={{ backgroundColor: currentColor }}
          />
          <span className="flex-1 text-left text-sm font-medium text-gray-700">
            {currentColor}
          </span>
          <span className="text-sm text-blue-600 font-semibold">Pilih</span>
        </button>
      </div>

      {/* Modal */}
      {showOverlay && (
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-end justify-center z-50
            ${showOverlay ? 'bg-opacity-50' : 'bg-opacity-0'}`}
          onClick={handleCloseModal}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl transform transition-all duration-300
              ${showModal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">{label}</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0">
              {!showCustom ? (
                <>
                  <h4 className="text-base font-semibold text-gray-700 mb-4">
                    Warna Template
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATE_COLORS.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectTemplate(color.value)}
                        className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          currentColor === color.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full mx-auto mb-2 border-2 ${
                            color.value === '#FFFFFF'
                              ? 'border-gray-300'
                              : 'border-white'
                          } shadow-md`}
                          style={{ backgroundColor: color.value }}
                        />
                        <p className="text-xs font-medium text-gray-700 text-center">
                          {color.name}
                        </p>
                        {currentColor === color.value && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setCustomColor(currentColor || '#5096FC');
                      setShowCustom(true);
                    }}
                    className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <span className="text-sm font-semibold text-gray-600">
                      + Warna Custom
                    </span>
                  </button>
                </>
              ) : (
                <div>
                  <h4 className="text-base font-semibold text-gray-700 mb-4">
                    Warna Custom
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-lg border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: customColor }}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                          const hexColor = e.target.value.startsWith('#')
                            ? e.target.value
                            : `#${e.target.value}`;
                          setCustomColor(hexColor);
                        }}
                        placeholder="#5096FC"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Masukkan kode hex warna (contoh: #5096FC)
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCustom(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleCustomColor}
                        disabled={!/^#[0-9A-F]{6}$/i.test(customColor)}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-colors ${
                          /^#[0-9A-F]{6}$/i.test(customColor)
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ColorPickerTemplate;

