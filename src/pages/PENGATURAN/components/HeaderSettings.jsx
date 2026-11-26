import AnimatedButton from '../../../components/Design/AnimatedButton';

const HeaderSettings = ({ tenantName, formData, onChange, onTestPrintHeader }) => {
  const effectiveName = formData.custom_business_name?.trim() || tenantName || 'NOTASEPATU';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Nama Bisnis</h3>

      {/* Default + Override */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Default: <span className="font-semibold">{tenantName || '-'}</span></p>
        <input
          type="text"
          value={formData.custom_business_name || ''}
          onChange={(e) => onChange('custom_business_name', e.target.value)}
          placeholder={`Kosongkan untuk pakai "${tenantName || 'NOTASEPATU'}"`}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-xl p-3 border overflow-hidden">
        <pre className="whitespace-pre-wrap break-words text-center font-mono text-sm max-w-full mx-auto">{effectiveName}</pre>
      </div>

      <div className="mt-3">
        <AnimatedButton
          variant="orange"
          onClick={() => onTestPrintHeader?.(effectiveName, formData)}
          className="w-full px-4 py-3 text-sm font-bold rounded-xl"
        >
          🖨️ TEST PRINT TITLE
        </AnimatedButton>
      </div>
    </div>
  );
};

export default HeaderSettings;


