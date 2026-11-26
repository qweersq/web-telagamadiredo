import { FaUsers, FaBuilding, FaShoppingCart } from 'react-icons/fa';

const PlanLimits = ({ plan, isEditing, onInputChange }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUsers className="text-purple-500 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
          Batasan Paket
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Max Users */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Maksimal User
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plan?.max_users || ''}
                onChange={(e) => onInputChange('max_users', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="5"
                min="1"
              />
              <span className="text-sm text-gray-500 font-montserrat">user</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaUsers className="text-purple-500" />
              <span className="text-lg font-semibold text-gray-900 font-montserrat">
                {plan?.max_users || 'Unlimited'}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Jumlah user maksimal
          </p>
        </div>

        {/* Max Branches */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Maksimal Cabang
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plan?.max_branches || ''}
                onChange={(e) => onInputChange('max_branches', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="1"
                min="1"
              />
              <span className="text-sm text-gray-500 font-montserrat">cabang</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaBuilding className="text-orange-500" />
              <span className="text-lg font-semibold text-gray-900 font-montserrat">
                {plan?.max_branches || 'Unlimited'}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Jumlah cabang maksimal
          </p>
        </div>

        {/* Max Orders Per Month */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Max Order/Bulan
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plan?.max_orders_per_month || ''}
                onChange={(e) => onInputChange('max_orders_per_month', parseInt(e.target.value) || null)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="Unlimited"
                min="1"
              />
              <span className="text-sm text-gray-500 font-montserrat">order</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaShoppingCart className="text-green-500" />
              <span className="text-lg font-semibold text-gray-900 font-montserrat">
                {plan?.max_orders_per_month || 'Unlimited'}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Order maksimal per bulan
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanLimits;
