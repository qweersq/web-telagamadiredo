import React from 'react';
import { Camera, X } from 'lucide-react';

const QuickOrderPhotoInput = ({
  photos, setPhotos, fileInputRef, handlePhotoCapture, handleFileSelect, removePhoto
}) => (
  <div>
    <h3 className="font-medium mb-2">Foto Item</h3>
    <div className="flex gap-2 overflow-x-auto mb-3">
      {photos.map(photo => (
        <div key={photo.id} className="relative">
          <img
            src={photo.preview}
            alt="Item"
            className="w-16 h-16 object-cover rounded-lg"
          />
          <button
            onClick={() => removePhoto(photo.id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
    <button
      onClick={handlePhotoCapture}
      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
    >
      <Camera className="w-5 h-5" />
      Ambil Foto
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      onChange={handleFileSelect}
      className="hidden"
    />
  </div>
);

export default QuickOrderPhotoInput;
