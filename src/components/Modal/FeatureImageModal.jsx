import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const FeatureImageModal = ({ isOpen, onClose, images, initialIndex = 0, featureName = "Feature" }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when modal opens or images change
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      const validIndex = Math.min(initialIndex, images.length - 1);
      setCurrentIndex(validIndex);
    }
  }, [isOpen, initialIndex, images]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images?.length]);

  const handlePrevious = () => {
    if (images && images.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (images && images.length > 0) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
    }
    onClose();
  };

  if (!isOpen || !images || images.length === 0) return null;

  const validCurrentIndex = Math.min(currentIndex, images.length - 1);
  const currentImage = images[validCurrentIndex];

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose(e);
        }}
        className="absolute top-4 right-4 z-50 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          {/* Main Image */}
          <img
            src={currentImage}
            alt={`${featureName} Screenshot ${validCurrentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            style={{ 
              maxHeight: '80vh',
              width: 'auto',
              height: 'auto'
            }}
          />

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              {validCurrentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === validCurrentIndex 
                  ? 'border-white shadow-lg scale-110' 
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeatureImageModal;
