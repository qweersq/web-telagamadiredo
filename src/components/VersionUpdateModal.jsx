import { RefreshCw, AlertCircle } from 'lucide-react';

const VersionUpdateModal = ({ updateInfo, onUpdate }) => {
  if (!updateInfo || !updateInfo.forceUpdate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Wajib</h2>
            <p className="text-sm text-gray-500">Versi baru tersedia</p>
          </div>
        </div>

        <div className="mb-6">
          {updateInfo.updateMessage && (
            <p className="text-gray-700 mb-3">{updateInfo.updateMessage}</p>
          )}
          
          {updateInfo.features && Array.isArray(updateInfo.features) && updateInfo.features.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Fitur baru:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {updateInfo.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Versi saat ini: <span className="font-semibold">{updateInfo.latestVersion || 'Unknown'}</span>
          </p>
        </div>

        <button
          onClick={onUpdate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Reload Sekarang
        </button>
      </div>
    </div>
  );
};

export default VersionUpdateModal;

