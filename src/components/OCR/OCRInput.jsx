import React, { useState, useRef } from 'react';
import { Camera, Upload, FileText, X, Check, Loader } from 'lucide-react';

const OCRInput = ({ onResult, onCancel }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
    }
  };

  const captureImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processOCR = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      // Mock OCR processing - nanti diganti dengan API OCR yang sebenarnya
      // Contoh: Google Cloud Vision API, Tesseract.js, atau API OCR lainnya
      
      // Simulasi delay processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock result berdasarkan nama file atau random
      const mockResults = [
        {
          brand: 'Nike',
          model: 'Air Force 1',
          color: 'White',
          material: 'Leather'
        },
        {
          brand: 'Adidas',
          model: 'Ultraboost',
          color: 'Black',
          material: 'Mesh'
        },
        {
          brand: 'New Balance',
          model: '574',
          color: 'Grey',
          material: 'Suede'
        }
      ];

      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setOcrResult(randomResult);
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseResult = () => {
    if (ocrResult) {
      onResult(ocrResult);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setOcrResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">OCR Item Recognition</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Image Capture/Upload */}
          {!selectedImage ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-3">
                  Ambil foto atau upload gambar item untuk mendeteksi informasi otomatis
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={captureImage}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm">Ambil Foto</span>
                </button>
                
                <button
                  onClick={captureImage}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm">Upload Gambar</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Selected"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={handleRetake}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Process Button */}
              {!ocrResult && (
                <button
                  onClick={processOCR}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Deteksi Informasi Item
                    </>
                  )}
                </button>
              )}

              {/* OCR Results */}
              {ocrResult && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800 mb-2 font-medium">
                      Informasi Terdeteksi:
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Brand:</span>
                        <span className="font-medium">{ocrResult.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Model:</span>
                        <span className="font-medium">{ocrResult.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Color:</span>
                        <span className="font-medium">{ocrResult.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Material:</span>
                        <span className="font-medium">{ocrResult.material}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUseResult}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <Check className="w-4 h-4" />
                      Gunakan Hasil
                    </button>
                    <button
                      onClick={handleRetake}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                      Ambil Ulang
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Tips untuk hasil terbaik:</div>
            <ul className="space-y-1">
              <li>• Pastikan gambar jelas dan tidak blur</li>
              <li>• Fokus pada bagian yang menampilkan brand/model</li>
              <li>• Pastikan pencahayaan cukup</li>
              <li>• Hindari bayangan yang mengganggu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRInput; 