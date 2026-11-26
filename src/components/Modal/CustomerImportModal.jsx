import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import instance from '../../config/api';
import { cleanPhoneNumber } from '../../utils/phoneValidation';

const CustomerImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFile(null);
      setFileName('');
      setParsedData([]);
      setValidationResults(null);
      setImportResult(null);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('File harus berformat CSV (.csv)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File terlalu besar. Maksimal 10MB');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV: ' + results.errors[0].message);
          return;
        }

        if (results.data.length === 0) {
          setError('File CSV kosong atau tidak memiliki data');
          return;
        }

        // Validate and parse data
        const validated = validateAndParseData(results.data);
        setParsedData(validated.validData);
        setValidationResults(validated);
        setStep(2); // Move to preview step
      },
      error: (error) => {
        setError('Error membaca file: ' + error.message);
      }
    });
  };

  const validateAndParseData = (data) => {
    const validData = [];
    const errors = [];
    const warnings = [];
    const processedPhones = new Set();

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 karena header + 1-based index
      const rowErrors = [];
      const rowWarnings = [];

      // Normalize column names (case-insensitive)
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toLowerCase();
        normalizedRow[normalizedKey] = row[key] ? String(row[key]).trim() : '';
      });

      // Extract fields
      const name = normalizedRow['nama'] || normalizedRow['name'] || '';
      const phone = normalizedRow['telepon'] || normalizedRow['phone'] || normalizedRow['nomor'] || normalizedRow['hp'] || '';
      const address = normalizedRow['alamat'] || normalizedRow['address'] || '';

      // Validate name
      if (!name || name.length < 2) {
        rowErrors.push('Nama wajib diisi dan minimal 2 karakter');
      } else if (name.length > 100) {
        rowErrors.push('Nama maksimal 100 karakter');
      }

      // Validate phone
      if (!phone || phone.trim() === '') {
        rowErrors.push('Nomor telepon wajib diisi');
      } else {
        const cleanedPhone = cleanPhoneNumber(phone);
        if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 15) {
          rowErrors.push('Format nomor telepon tidak valid (min 10, max 15 digit)');
        } else {
          // Check duplicate in file
          if (processedPhones.has(cleanedPhone)) {
            rowWarnings.push('Nomor telepon duplikat dalam file');
          } else {
            processedPhones.add(cleanedPhone);
          }
        }
      }

      // Validate address
      if (address && address.length > 500) {
        rowErrors.push('Alamat maksimal 500 karakter');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
          data: { name, phone, address }
        });
      } else if (rowWarnings.length > 0) {
        warnings.push({
          row: rowNumber,
          warnings: rowWarnings,
          data: { name, phone, address }
        });
        // Still add to valid data but with warning
        validData.push({
          name,
          phone: cleanPhoneNumber(phone),
          address: address || null
        });
      } else {
        validData.push({
          name,
          phone: cleanPhoneNumber(phone),
          address: address || null
        });
      }
    });

    return {
      validData,
      errors,
      warnings,
      totalRows: data.length,
      validCount: validData.length,
      errorCount: errors.length,
      warningCount: warnings.length
    };
  };

  const handleImport = async () => {
    if (!file || parsedData.length === 0) {
      setError('Tidak ada data yang valid untuk diimport');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await instance.post('/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data.data);
      setStep(3); // Move to result step

      // Call success callback to refresh customer list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing customers:', error);
      setError(error.response?.data?.message || 'Gagal mengimport data customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      ['Nama', 'Telepon', 'Alamat'],
      ['John Doe', '6281234567890', 'Jl. Contoh No. 123'],
      ['Jane Smith', '6281234567891', 'Jl. Test No. 456']
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_customer.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 font-montserrat">
            {step === 1 && 'Import Customer dari CSV'}
            {step === 2 && 'Preview Data'}
            {step === 3 && 'Hasil Import'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload File CSV</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pilih file CSV yang berisi data customer. Format: Nama, Telepon, Alamat
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-sm font-semibold text-gray-700 mb-2">
                    Klik untuk memilih file CSV
                  </span>
                  <span className="text-xs text-gray-500">
                    atau drag & drop file di sini
                  </span>
                </label>
                {fileName && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">File: {fileName}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && validationResults && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Ringkasan Validasi</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Baris</p>
                    <p className="text-lg font-bold text-gray-800">{validationResults.totalRows}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valid</p>
                    <p className="text-lg font-bold text-green-600">{validationResults.validCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Error</p>
                    <p className="text-lg font-bold text-red-600">{validationResults.errorCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Warning</p>
                    <p className="text-lg font-bold text-yellow-600">{validationResults.warningCount}</p>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">Preview Data (Maksimal 10 baris pertama)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">No</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Nama</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Telepon</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Alamat</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 10).map((row, index) => {
                          const hasWarning = validationResults.warnings.some(w => w.row === index + 2);
                          return (
                            <tr key={index} className={hasWarning ? 'bg-yellow-50' : 'bg-white'}>
                              <td className="px-4 py-2 border-b border-gray-200">{index + 1}</td>
                              <td className="px-4 py-2 border-b border-gray-200">{row.name}</td>
                              <td className="px-4 py-2 border-b border-gray-200">{row.phone}</td>
                              <td className="px-4 py-2 border-b border-gray-200">{row.address || '-'}</td>
                              <td className="px-4 py-2 border-b border-gray-200">
                                {hasWarning ? (
                                  <span className="text-yellow-600 text-xs">⚠ Warning</span>
                                ) : (
                                  <span className="text-green-600 text-xs">✓ Valid</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 10 && (
                    <div className="bg-gray-50 p-3 text-center text-xs text-gray-600">
                      Menampilkan 10 dari {parsedData.length} baris valid
                    </div>
                  )}
                </div>
              )}

              {/* Errors List */}
              {validationResults.errors.length > 0 && (
                <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 p-3 border-b border-red-200">
                    <h4 className="font-semibold text-red-800">Baris dengan Error (Tidak akan diimport)</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {validationResults.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-3 border-b border-red-100 bg-white">
                        <p className="text-sm font-medium text-red-800">Baris {error.row}:</p>
                        <ul className="list-disc list-inside text-xs text-red-600 mt-1">
                          {error.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {validationResults.errors.length > 10 && (
                    <div className="bg-red-50 p-3 text-center text-xs text-red-600">
                      Dan {validationResults.errors.length - 10} error lainnya
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && importResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-16 h-16 ${importResult.success_count > 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {importResult.success_count > 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {importResult.success_count > 0 ? 'Import Berhasil!' : 'Import Gagal'}
                </h3>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Import</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Baris</p>
                    <p className="text-lg font-bold text-gray-800">{importResult.total_rows}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Berhasil</p>
                    <p className="text-lg font-bold text-green-600">{importResult.success_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gagal</p>
                    <p className="text-lg font-bold text-red-600">{importResult.failed_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Di-skip</p>
                    <p className="text-lg font-bold text-yellow-600">{importResult.skipped_count}</p>
                  </div>
                </div>
              </div>

              {/* Errors from backend */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border-2 border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 p-3 border-b border-red-200">
                    <h4 className="font-semibold text-red-800">Error dari Server</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-3 border-b border-red-100 bg-white">
                        <p className="text-sm font-medium text-red-800">Baris {error.row} - {error.field}:</p>
                        <p className="text-xs text-red-600 mt-1">{error.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="border-2 border-yellow-200 rounded-xl overflow-hidden">
                  <div className="bg-yellow-50 p-3 border-b border-yellow-200">
                    <h4 className="font-semibold text-yellow-800">Warning</h4>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {importResult.warnings.slice(0, 10).map((warning, index) => (
                      <div key={index} className="p-3 border-b border-yellow-100 bg-white">
                        <p className="text-sm font-medium text-yellow-800">Baris {warning.row} - {warning.field}:</p>
                        <p className="text-xs text-yellow-600 mt-1">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0">
          {step === 1 && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all duration-200"
            >
              Batal
            </button>
          )}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all duration-200"
              >
                Kembali
              </button>
              <button
                onClick={handleImport}
                disabled={loading || parsedData.length === 0}
                className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || parsedData.length === 0
                    ? 'bg-gray-400 border-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 hover:border-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengimport...
                  </>
                ) : (
                  'Import Data'
                )}
              </button>
            </>
          )}
          {step === 3 && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-blue-500 border-2 border-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerImportModal;
