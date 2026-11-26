import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { branchService } from '../../services/branchService';
import { invalidateUserProfileCache } from '../../utils/userProfileHelper';

const BranchSelectionModal = ({ isOpen, onClose, onConfirm, selectedRole }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get branches from API
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      
      const fetchBranches = async () => {
        try {
          const response = await branchService.getBranches();
          if (response.success) {
            // Filter only active branches for selection
            const activeBranches = response.data.filter(branch => 
              ['active', 'maintenance', 'suspended'].includes(branch.status)
            );
            setBranches(activeBranches);
          } else {
            setError('Gagal memuat data cabang');
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          setError('Gagal memuat data cabang. Silakan coba lagi.');
        } finally {
          setLoading(false);
        }
      };

      fetchBranches();
    }
  }, [isOpen]);


  const handleConfirm = (branch, role) => {
    // Invalidate user profile cache before confirming
    invalidateUserProfileCache();
    onConfirm(branch, role);
  };

  if (!isOpen) return null;

  // Portal ke body: header memakai backdrop-blur sehingga position: fixed
  // di dalamnya ikut terkurung ke kotak header (modal jadi tidak di tengah).
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-telaga-950 font-montserrat">
            Pilih Cabang
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-telaga-50 hover:bg-telaga-100 text-telaga-700 transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-telaga-900/60 text-sm font-montserrat mb-4">
            Pilih cabang untuk role {selectedRole}:
          </p>

          {/* Branch List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telaga-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 font-montserrat mb-4">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  setLoading(true);
                  const fetchBranches = async () => {
                    try {
                      const response = await branchService.getBranches();
                      if (response.success) {
                        const activeBranches = response.data.filter(branch => 
                          ['active', 'maintenance', 'suspended'].includes(branch.status)
                        );
                        setBranches(activeBranches);
                      } else {
                        setError('Gagal memuat data cabang');
                      }
                    } catch (error) {
                      console.error('Error fetching branches:', error);
                      setError('Gagal memuat data cabang. Silakan coba lagi.');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchBranches();
                }}
                className="px-4 py-2 bg-telaga-600 text-white rounded-xl hover:bg-telaga-700 transition-colors font-montserrat text-sm"
              >
                Coba Lagi
              </button>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-telaga-900/50">
              <p className="font-montserrat">Tidak ada cabang tersedia</p>
            </div>
          ) : (
            branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleConfirm(branch, selectedRole)}
                className="w-full p-3 text-left bg-telaga-50/60 hover:bg-telaga-50 rounded-xl border border-telaga-100 hover:border-telaga-300 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-telaga-950 font-montserrat group-hover:text-telaga-700">
                      {branch.name}
                    </h4>
                    {branch.address && (
                      <p className="text-sm text-telaga-900/60 font-montserrat mt-1">
                        {branch.address}
                      </p>
                    )}
                    {branch.city && (
                      <p className="text-xs text-telaga-900/45 font-montserrat">
                        {branch.city}
                      </p>
                    )}
                  </div>
                  <div className="text-telaga-600 group-hover:text-telaga-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-telaga-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-montserrat bg-telaga-50 hover:bg-telaga-100 text-telaga-800 rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BranchSelectionModal;
