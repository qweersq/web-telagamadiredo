import { FaToggleOn, FaToggleOff, FaSort, FaInfoCircle } from 'react-icons/fa';

const PlanStatus = ({ plan, isEditing, onInputChange }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaToggleOn className="text-green-500 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
          Status & Pengaturan
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Status Paket
          </label>
          {isEditing ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onInputChange('is_active', true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors font-montserrat text-sm font-semibold ${
                  plan?.is_active
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                }`}
              >
                <FaToggleOn className="text-sm" />
                Aktif
              </button>
              <button
                onClick={() => onInputChange('is_active', false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors font-montserrat text-sm font-semibold ${
                  !plan?.is_active
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                }`}
              >
                <FaToggleOff className="text-sm" />
                Tidak Aktif
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                plan?.is_active
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {plan?.is_active ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-600" />}
                {plan?.is_active ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Status paket saat ini
          </p>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
            Urutan Tampil
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={plan?.sort_order || 0}
                onChange={(e) => onInputChange('sort_order', parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="0"
                min="0"
              />
              <span className="text-sm text-gray-500 font-montserrat">urutan</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaSort className="text-blue-500" />
              <span className="text-lg font-semibold text-gray-900 font-montserrat">
                {plan?.sort_order || 0}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Urutan tampil di daftar paket
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <FaInfoCircle className="text-blue-500 text-sm mt-0.5" />
          <div className="text-xs text-blue-800 font-montserrat">
            <p className="font-semibold mb-1">Catatan:</p>
            <ul className="space-y-1 text-xs">
              <li>• Paket yang tidak aktif tidak akan muncul di daftar pilihan tenant</li>
              <li>• Urutan tampil menentukan posisi paket di daftar (angka lebih kecil = posisi lebih atas)</li>
              <li>• Perubahan status akan langsung mempengaruhi ketersediaan paket</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanStatus;
