import { FaCrown, FaStar, FaGem, FaInfoCircle } from 'react-icons/fa';

const PlanBasicInfo = ({ plan, isEditing, onInputChange }) => {
  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('basic')) return <FaStar className="text-yellow-500" />;
    if (name.includes('premium')) return <FaCrown className="text-purple-500" />;
    if (name.includes('enterprise')) return <FaGem className="text-blue-500" />;
    return <FaStar className="text-gray-500" />;
  };

  const getPlanColor = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('basic')) return 'from-yellow-100 to-orange-100 border-yellow-200';
    if (name.includes('premium')) return 'from-purple-100 to-pink-100 border-purple-200';
    if (name.includes('enterprise')) return 'from-blue-100 to-cyan-100 border-blue-200';
    return 'from-gray-100 to-slate-100 border-gray-200';
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaInfoCircle className="text-blue-500 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
          Informasi Dasar
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Icon & Name */}
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-gradient-to-r ${getPlanColor(plan?.name)} rounded-xl border`}>
            {getPlanIcon(plan?.name)}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={plan?.name || ''}
                onChange={(e) => onInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-lg font-semibold"
                placeholder="Nama paket"
              />
            ) : (
              <h4 className="text-lg font-semibold text-gray-900 font-montserrat">
                {plan?.name || 'Nama paket'}
              </h4>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Deskripsi
          </label>
          {isEditing ? (
            <textarea
              value={plan?.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat text-sm"
              rows="3"
              placeholder="Deskripsi paket"
            />
          ) : (
            <p className="text-sm text-gray-600 font-montserrat">
              {plan?.description || 'Tidak ada deskripsi'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanBasicInfo;
