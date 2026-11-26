import { AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmModal - Reusable modal for delete confirmation
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onConfirm - Callback when delete is confirmed
 * @param {string} props.title - Modal title (default: "Hapus Data")
 * @param {string} props.message - Confirmation message
 * @param {string} props.itemName - Name of item being deleted (optional)
 * @param {boolean} props.isDeleting - Loading state for delete button
 */
const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Hapus Data",
  message = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  itemName = null,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Icon & Header */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
                {title}
              </h3>
              {itemName && (
                <p className="text-sm text-gray-500 font-montserrat mt-1">
                  {itemName}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 font-montserrat">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-montserrat font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-montserrat font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

