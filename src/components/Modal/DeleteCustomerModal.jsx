import { useEffect, useState } from 'react';
import { FaTimes, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';

/**
 * Modal konfirmasi hapus customer.
 * Menghapus customer akan ikut menghapus (soft delete) seluruh order,
 * payment, payment detail, transaksi finance (saldo direverse),
 * poin, membership, dan data relasi lainnya.
 */
const DeleteCustomerModal = ({ isOpen, onClose, customer, onConfirm }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    setIsChecked(false);
    setIsSubmitting(false);
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const totalOrders = customer.total_orders || 0;
  const hasMembership = !!customer.current_membership;

  const handleConfirm = async () => {
    if (!isChecked) return;
    setIsSubmitting(true);
    try {
      await onConfirm(customer);
      onClose();
    } catch (error) {
      // error sudah ditangani oleh pemanggil (alert)
      console.error('Error deleting customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Hapus Customer</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <FaTimes className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-red-600 font-bold text-lg">
                {customer.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{customer.name}</h3>
            <p className="text-gray-600 text-sm">{customer.phone}</p>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-2">
                  Tindakan ini tidak dapat dibatalkan!
                </p>
                <p className="text-xs text-red-600 mb-3">
                  Data berikut akan ikut terhapus:
                </p>
                <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                  <li>
                    <strong>{totalOrders} pesanan</strong>
                    {totalOrders > 0 && ' beserta detail layanan & notasinya'}
                  </li>
                  {totalOrders > 0 && (
                    <li>Transaksi keuangan terkait akan di-<strong>reverse</strong> (saldo akun dikembalikan)</li>
                  )}
                  <li>Poin pelanggan ({customer.points || 0} poin)</li>
                  {hasMembership && <li>Membership aktif: {customer.current_membership.membership?.name}</li>}
                  <li>Catatan & data follow-up pelanggan</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none mb-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer"
            />
            <span className="text-xs text-gray-700">
              Saya mengerti dan yakin ingin menghapus <strong>{customer.name}</strong> beserta seluruh datanya.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <AnimatedButton
            onClick={onClose}
            disabled={isSubmitting}
            variant="grey"
            className="flex-1 py-2.5 disabled:opacity-50"
          >
            Batal
          </AnimatedButton>
          <AnimatedButton
            onClick={handleConfirm}
            disabled={!isChecked || isSubmitting}
            variant={!isChecked || isSubmitting ? 'disabled' : 'red'}
            className="flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <FaTrashAlt className="w-3.5 h-3.5" />
                Hapus
              </>
            )}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default DeleteCustomerModal;
