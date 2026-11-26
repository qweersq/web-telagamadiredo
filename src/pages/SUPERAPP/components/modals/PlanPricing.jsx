import { FaDollarSign, FaCalendarAlt } from 'react-icons/fa';

const PlanPricing = ({ plan, isEditing, onInputChange }) => {
  const formatNumberWithDots = (value) => {
    if (!value) return '';
    // Convert to number first to handle decimal strings like "99000.00"
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    // Format as integer (remove decimal part)
    const integerValue = Math.floor(numericValue).toString();
    return integerValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumberFromDots = (value) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  };

  const formatDuration = (days) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} tahun`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} bulan`;
    } else {
      return `${days} hari`;
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaDollarSign className="text-green-500 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
          Harga & Durasi
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Harga Paket
          </label>
          {isEditing ? (
            <div className="relative">
              <input
                type="text"
                value={formatNumberWithDots(plan?.price || '')}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  const parsedValue = parseNumberFromDots(numericValue);
                  onInputChange('price', parseFloat(parsedValue) || 0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-montserrat">
                IDR
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-green-600 font-montserrat">
              IDR {formatNumberWithDots(plan?.price || 0)}
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Harga per periode
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Durasi Paket
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plan?.duration_days || ''}
                onChange={(e) => onInputChange('duration_days', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="30"
                min="1"
              />
              <span className="text-sm text-gray-500 font-montserrat">hari</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              <span className="text-lg font-semibold text-gray-900 font-montserrat">
                {formatDuration(plan?.duration_days || 0)}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Durasi berlangganan
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanPricing;
