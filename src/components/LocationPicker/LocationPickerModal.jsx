import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, X, AlertCircle } from 'lucide-react';

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect, currentLat, currentLng }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState({
    latitude: currentLat || '',
    longitude: currentLng || '',
    address: ''
  });
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    if (isOpen) {
      setLocation({
        latitude: currentLat || '',
        longitude: currentLng || '',
        address: ''
      });
      setError('');
    }
  }, [isOpen, currentLat, currentLng]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get address from coordinates using reverse geocoding
          const address = await getAddressFromCoordinates(latitude, longitude);
          
          setLocation({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: address
          });
          
          setPermissionStatus('granted');
        } catch (err) {
          setLocation({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: 'Alamat tidak dapat ditemukan'
          });
          setPermissionStatus('granted');
        }
        
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        setPermissionStatus('denied');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Informasi lokasi tidak tersedia.');
            break;
          case error.TIMEOUT:
            setError('Permintaan lokasi timeout. Silakan coba lagi.');
            break;
          default:
            setError('Terjadi kesalahan saat mengambil lokasi.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_API_KEY&language=id&pretty=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
      return 'Alamat tidak dapat ditemukan';
    } catch (error) {
      return 'Alamat tidak dapat ditemukan';
    }
  };

  const handleManualInput = (field, value) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = () => {
    if (!location.latitude || !location.longitude) {
      setError('Latitude dan longitude harus diisi');
      return;
    }

    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Format latitude dan longitude tidak valid');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude harus antara -90 dan 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude harus antara -180 dan 180');
      return;
    }

    onLocationSelect(lat, lng, location.address);
    onClose();
  };

  const handleClose = () => {
    setError('');
    setLocation({
      latitude: currentLat || '',
      longitude: currentLng || '',
      address: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pilih Lokasi</h2>
              <p className="text-sm text-gray-500">Ambil koordinat lokasi outlet</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Current Location Button */}
        <div className="mb-6">
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full py-4 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengambil lokasi...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>Ambil Lokasi Saat Ini</span>
              </>
            )}
          </button>
          
          {permissionStatus === 'denied' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Izin lokasi ditolak</p>
                  <p className="text-xs mt-1">
                    Silakan izinkan akses lokasi di pengaturan browser atau masukkan koordinat secara manual.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="-7.250000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
              value={location.latitude}
              onChange={(e) => handleManualInput('latitude', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="112.750000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
              value={location.longitude}
              onChange={(e) => handleManualInput('longitude', e.target.value)}
            />
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!location.latitude || !location.longitude}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Gunakan Lokasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
