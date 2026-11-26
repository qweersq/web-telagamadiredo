import React, { useState, useEffect, useRef } from 'react';

import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoGalleryModal = ({ isOpen, onClose, photos, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {  // minimum 50px swipe
      diff > 0 ? handleNext() : handlePrevious();
    }
    touchStartX.current = null;
  };


  // Reset index when modal opens or photos change
  useEffect(() => {
    if (isOpen && photos && photos.length > 0) {
      // Ensure initialIndex is within bounds
      const validIndex = Math.min(initialIndex, photos.length - 1);
      setCurrentIndex(validIndex);
    }
  }, [isOpen, initialIndex, photos]);

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
  }, [isOpen, currentIndex, photos?.length]);

  const handlePrevious = () => {
    if (photos && photos.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (photos && photos.length > 0) {
      setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const handleClose = (e) => {
    // Prevent event bubbling to parent modal
    if (e) {
      e.stopPropagation();
    }
    onClose();
  };

  if (!isOpen || !photos || photos.length === 0) return null;

  // Additional safety check to ensure currentIndex is valid
  const validCurrentIndex = Math.min(currentIndex, photos.length - 1);
  const currentPhoto = photos[validCurrentIndex];

  // If somehow currentPhoto is still undefined, don't render
  if (!currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Don't close on backdrop click to prevent closing parent modal
      }}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose(e);
        }}
        className="absolute z-50 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
        style={{
          top: 'max(1rem, env(safe-area-inset-top))',
          right: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute top-1/2 -translate-y-1/2 z-50 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
            style={{
              left: 'max(1rem, env(safe-area-inset-left))'
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute top-1/2 -translate-y-1/2 z-50 p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110"
            style={{
              right: 'max(1rem, env(safe-area-inset-right))'
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Photo Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        <div className="relative max-w-4xl max-h-full">
          {/* Main Photo */}
          <img
            src={currentPhoto.url_photo}
            alt={`Photo ${validCurrentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            style={{ 
              maxHeight: '80vh',
              width: 'auto',
              height: 'auto'
            }}
          />

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              {validCurrentIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {photos.length > 1 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4"
          style={{
            bottom: 'max(2rem, env(safe-area-inset-bottom))'
          }}
        >
          {photos.map((photo, index) => (
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
                src={photo.url_photo}
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

export default PhotoGalleryModal; 