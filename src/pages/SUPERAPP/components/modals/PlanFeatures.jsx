import { FaCog, FaCheck, FaStar, FaWhatsapp, FaChartBar, FaShieldAlt, FaBell, FaFileInvoice, FaCreditCard, FaCamera } from 'react-icons/fa';

const PlanFeatures = ({ plan, isEditing, onFeaturesChange }) => {
  // Features template dengan icon dan deskripsi
  const featuresTemplate = {
    daily_reports: { 
      name: 'Laporan Harian', 
      icon: FaChartBar, 
      description: 'Laporan penjualan dan transaksi harian',
      category: 'Laporan'
    },
    multi_payment: { 
      name: 'Multi Payment', 
      icon: FaCreditCard, 
      description: 'Berbagai metode pembayaran',
      category: 'Pembayaran'
    },
    photo_tracking: { 
      name: 'Photo Tracking', 
      icon: FaCamera, 
      description: 'Tracking sepatu dengan foto',
      category: 'Tracking'
    },
    digital_invoice: { 
      name: 'Digital Invoice', 
      icon: FaFileInvoice, 
      description: 'Invoice digital otomatis',
      category: 'Invoice'
    },
    priority_support: { 
      name: 'Support Prioritas', 
      icon: FaStar, 
      description: 'Dukungan pelanggan prioritas',
      category: 'Support'
    },
    role_based_access: { 
      name: 'Role Based Access', 
      icon: FaShieldAlt, 
      description: 'Akses berdasarkan peran pengguna',
      category: 'Keamanan'
    },
    whatsapp_integration: { 
      name: 'Integrasi WhatsApp', 
      icon: FaWhatsapp, 
      description: 'Notifikasi dan komunikasi via WhatsApp',
      category: 'Komunikasi'
    },
    follow_up_features: { 
      name: 'Follow Up Otomatis', 
      icon: FaBell, 
      description: 'Sistem follow up pelanggan otomatis',
      category: 'Marketing'
    },
    advanced_reporting: { 
      name: 'Laporan Advanced', 
      icon: FaChartBar, 
      description: 'Laporan analisis mendalam dan insights',
      category: 'Laporan'
    }
  };

  const features = plan?.features || {};

  const handleToggleFeature = (featureKey) => {
    const updatedFeatures = {
      ...features,
      [featureKey]: !features[featureKey]
    };
    onFeaturesChange(updatedFeatures);
  };


  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <FaCog className="text-indigo-500 text-sm" />
        <h3 className="text-sm font-semibold text-gray-900 font-montserrat">
          Fitur Paket
        </h3>
      </div>

      {/* Features Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(featuresTemplate).map(([key, feature]) => {
          const IconComponent = feature.icon;
          const isEnabled = features[key] || false;
          
          return (
            <div
              key={key}
              className={`flex items-center gap-2 p-2 bg-white rounded-lg border transition-all ${
                isEnabled 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* Feature Icon */}
              <div className={`p-1 rounded ${
                isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <IconComponent className="text-xs" />
              </div>

              {/* Feature Name */}
              <div className="flex-1 min-w-0">
                <h5 className={`text-xs font-medium truncate font-montserrat ${
                  isEnabled ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {feature.name}
                </h5>
              </div>

              {/* Toggle Button */}
              {isEditing && (
                <button
                  onClick={() => handleToggleFeature(key)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isEnabled
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {isEnabled && <FaCheck className="text-xs" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Features Summary - Compact */}
      {!isEditing && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-800 font-montserrat">
              <span className="font-semibold">
                {Object.values(features).filter(f => f === true).length}
              </span> dari{' '}
              <span className="font-semibold">
                {Object.keys(featuresTemplate).length}
              </span> fitur aktif
            </p>
            <div className="text-xs font-bold text-blue-600 font-montserrat">
              {Math.round((Object.values(features).filter(f => f === true).length / Object.keys(featuresTemplate).length) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanFeatures;
