import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import instance from '../../config/api';
import MembershipPaymentModal from '../Membership/MembershipPaymentModal';
import { getMembershipDiscountDisplay, formatCurrency } from '../../utils/labelFormatter';

const AddMembershipModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  onSuccess,
  title = "Tambah Membership"
}) => {
  const [availableMemberships, setAvailableMemberships] = useState([]);
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available memberships when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableMemberships();
    }
  }, [isOpen]);

  const fetchAvailableMemberships = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/memberships');
      setAvailableMemberships(response.data.data.memberships || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      setError('Gagal memuat data membership');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = () => {
    if (!selectedMembershipId || !customer) {
      setError('Pilih membership program terlebih dahulu');
      return;
    }

    const membership = availableMemberships.find(m => m.id === parseInt(selectedMembershipId));
    if (!membership) {
      setError('Membership program tidak ditemukan');
      return;
    }

    setSelectedMembership(membership);
    setShowPaymentModal(true);
    setError('');
  };

  const handlePaymentSuccess = async (paymentResult) => {
    console.log('✅ AddMembershipModal - Payment successful:', paymentResult);
    
    try {
      setLoading(true);
      
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + selectedMembership.duration_days);

      const payload = {
        customer_id: customer.id,
        membership_id: selectedMembership.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        payment_id: paymentResult.data.payment.id // Link dengan payment yang sudah dibuat
      };

      await instance.post('/customer-memberships', payload);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(customer, selectedMembership, paymentResult);
      }

      // Close modals
      setShowPaymentModal(false);
      handleClose();
      
    } catch (error) {
      console.error('Error assigning membership after payment:', error);
      setError(error.response?.data?.message || 'Gagal menambahkan membership');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMembershipId('');
    setSelectedMembership(null);
    setShowPaymentModal(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 font-montserrat">
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {customer?.name && (
            <p className="text-sm text-gray-600 font-montserrat mt-1">
              untuk <span className="font-semibold text-gray-800">{customer.name}</span>
            </p>
          )}
        </div>

        {/* Content - Scrollable */}
        <div 
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-medium font-montserrat">{error}</p>
          </div>
        )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
              Pilih Program Membership *
            </label>
            <select
              value={selectedMembershipId}
              onChange={(e) => {
                setSelectedMembershipId(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 font-montserrat rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 font-medium"
              required
              disabled={loading}
            >
              <option className="font-montserrat" value="">Pilih membership program</option>
              {availableMemberships
                .filter(membership => membership.is_active)
                .map((membership) => (
                  <option className="font-montserrat" key={membership.id} value={membership.id}>
                    {membership.name} - {getMembershipDiscountDisplay(membership.discount_percentage)} - {formatCurrency(membership.price)}
                  </option>
                ))}
            </select>
          </div>

          {selectedMembershipId && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-bold font-montserrat text-blue-800 text-sm">Preview Membership</h4>
              </div>
              {(() => {
                const selectedMembership = availableMemberships.find(m => m.id === parseInt(selectedMembershipId));
                return selectedMembership ? (
                  <div className="space-y-3">
                    {/* Membership Name with Badge */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-800 font-montserrat">{selectedMembership.name}</h3>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold font-montserrat">
                        {selectedMembership.name}
                      </span>
                    </div>
                    
                    {/* Price & Discount in vertical layout */}
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                      <div className="space-y-2">
                        {/* Price */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-600 font-medium font-montserrat">Harga:</span>
                          <div className="text-lg font-bold text-blue-600 font-montserrat">
                            {formatCurrency(selectedMembership.price)}
                          </div>
                        </div>
                        
                        {/* Discount */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 font-medium font-montserrat">Diskon:</span>
                          <span className="text-sm font-bold text-green-600 font-montserrat">
                            {getMembershipDiscountDisplay(selectedMembership.discount_percentage)}
                          </span>
                        </div>
                        
                        {/* Duration */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-600 font-medium font-montserrat">Durasi:</span>
                          <span className="text-sm font-semibold text-gray-800 font-montserrat">
                            {selectedMembership.duration_days} hari
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {selectedMembership.description && (
                      <div className="bg-white rounded-xl p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 font-medium font-montserrat mb-1">Deskripsi:</p>
                        <p className="text-sm text-gray-700 font-montserrat leading-relaxed">
                          {selectedMembership.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm font-montserrat hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
              disabled={loading}
            >
              Batal
            </button>
            <button
              onClick={handlePaymentClick}
              className="flex-1 px-6 py-3 bg-green-500 border-2 border-green-500 text-white rounded-xl font-semibold text-sm font-montserrat hover:bg-green-600 hover:border-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedMembershipId}
            >
              {loading ? 'Memproses...' : 'Bayar Membership'}
            </button>
          </div>
        </div>
      </div>

      {/* Membership Payment Modal */}
      {showPaymentModal && (
        <MembershipPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMembership(null);
          }}
          onSuccess={handlePaymentSuccess}
          membership={selectedMembership}
          customer={customer}
          membershipPrice={selectedMembership?.price ? parseFloat(selectedMembership.price) : 0}
        />
      )}
    </div>
  );
};

export default AddMembershipModal;
