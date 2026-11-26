import { X, RefreshCw } from 'lucide-react';

const VersionUpdateBanner = ({ updateInfo, onUpdate, onDismiss }) => {
  if (!updateInfo || !updateInfo.hasUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <RefreshCw className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-semibold">Update Tersedia!</p>
              {updateInfo.updateMessage && (
                <p className="text-sm text-blue-100 mt-1">{updateInfo.updateMessage}</p>
              )}
              {updateInfo.features && Array.isArray(updateInfo.features) && updateInfo.features.length > 0 && (
                <div className="text-xs text-blue-100 mt-1">
                  <strong>Fitur baru:</strong> {updateInfo.features.join(', ')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUpdate}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Reload Sekarang
            </button>
            {!updateInfo.forceUpdate && (
              <button
                onClick={onDismiss}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionUpdateBanner;

