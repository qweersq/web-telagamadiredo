import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getPhotoUrl } from '../../../utils/photoUrlHelper';

const LogoSettings = ({ formData, saving, onToggleShowLogo, onLogoUpload, onRemoveLogo, onTestPrintLogo }) => {
  const previewUrl = formData.logo_url ? getPhotoUrl(formData.logo_url) : null;

  return (
    <div className="mb-6 p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={!!formData.show_logo}
            onChange={(e) => onToggleShowLogo(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="font-semibold text-gray-800">Tampilkan Logo</span>
        </label>
      </div>

      {formData.show_logo && (
        <div className="mt-4 space-y-4">
          {/* Keterangan di atas preview */}
          <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            💡 Pastikan logo sudah include nama dan tagline bisnis Anda. Size kurang dari 2MB (PNG/JPG)
          </p>

          {/* Preview - Full width seperti saat print (384px = 58mm) */}
          {previewUrl ? (
            <div className="w-full border rounded-lg p-2 bg-white" style={{ width: '384px', maxWidth: '100%', margin: '0 auto' }}>
              <img
                src={previewUrl}
                alt="Logo Preview"
                className="w-full h-auto object-contain block"
              />
            </div>
          ) : (
            <div className="w-full text-center text-gray-400 text-sm border rounded-lg py-6 bg-gray-50">
              Belum ada logo
            </div>
          )}

          {/* Keterangan di bawah preview */}
          <p className="text-xs text-gray-600 text-center">
            Logo akan dicetak full lebar kertas (58mm). Anda bisa melakukan edit di aplikasi lain lalu menyesuaikan ukurannya.
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="logo-upload" className="block">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={onLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <div className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-4 rounded-xl font-semibold transition-all">
                {formData.logo_url ? 'Ganti' : 'Upload'}
              </div>
            </label>

            <button
              type="button"
              onClick={onRemoveLogo}
              disabled={!formData.logo_url || saving}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold disabled:opacity-50"
            >
              Hapus
            </button>
          </div>

          {formData.logo_url && (
            <AnimatedButton
              variant="blue"
              onClick={onTestPrintLogo}
              disabled={saving}
              className="w-full px-4 py-3 text-sm font-bold rounded-xl"
            >
              {saving ? '⏳ Printing...' : '🖨️ Test Print'}
            </AnimatedButton>
          )}
        </div>
      )}
    </div>
  );
};

export default LogoSettings;


