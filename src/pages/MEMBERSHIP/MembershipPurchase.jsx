import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, CheckCircle } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';
import MembershipCustomerSelect from './components/MembershipCustomerSelect';
import MembershipCustomerSearchModal from './components/MembershipCustomerSearchModal';
import MembershipSelection from './components/MembershipSelection';
import MembershipReview from './components/MembershipReview';
import MembershipPaymentStep from './components/MembershipPaymentStep';
import { getCustomers, searchCustomers } from '../ORDER/api/orderApi';
import instance from '../../config/api';
import CustomerDetailApi from '../../services/customerDetailApi';
import { useShift } from '../../contexts/ShiftContext';

const steps = [
  { label: 'Pilih Customer & Membership', key: 'select' },
  { label: 'Review & Info', key: 'review' },
  { label: 'Pembayaran', key: 'payment' },
];

const MembershipPurchase = () => {
  const navigate = useNavigate();
  const { user, shift } = useShift();
  
  // Step management
  const [step, setStep] = useState(0);
  
  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerDetail, setCustomerDetail] = useState(null);
  
  // Membership state
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  
  // Payment state
  const [paymentData, setPaymentData] = useState({
    finance_account_id: null,
    amount: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const cust = await getCustomers();
        setCustomers(cust || []);
      } catch (err) {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch memberships (only with price > 0)
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoadingMemberships(true);
        const { data } = await instance.get('/memberships');
        const allMemberships = data.data.memberships || [];
        // Filter: price > 0 and is_active = true
        const purchasableMemberships = allMemberships.filter(
          m => parseFloat(m.price) > 0 && m.is_active === true
        );
        setMemberships(purchasableMemberships);
      } catch (error) {
        console.error('❌ Error fetching memberships:', error);
        setMemberships([]);
      } finally {
        setLoadingMemberships(false);
      }
    };
    fetchMemberships();
  }, []);

  // Fetch customer detail when customer is selected
  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (!selectedCustomer?.id) {
        setCustomerDetail(null);
        return;
      }
      
      try {
        const response = await CustomerDetailApi.getCustomerDetailSummary(selectedCustomer.id);
        setCustomerDetail(response?.data || null);
      } catch (error) {
        console.error('❌ Error fetching customer detail:', error);
        setCustomerDetail(null);
      }
    };
    
    fetchCustomerDetail();
  }, [selectedCustomer?.id]);

  // Handle customer search
  const handleCustomerSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      const cust = await getCustomers();
      setCustomers(cust || []);
      return;
    }
    
    setLoadingCustomers(true);
    try {
      const results = await searchCustomers(term);
      setCustomers(results || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Handle customer select
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
  };

  // Handle customer remove
  const handleCustomerRemove = () => {
    setSelectedCustomer(null);
    setCustomerDetail(null);
  };

  // Handle customer update
  const handleCustomerUpdate = (updatedCustomer) => {
    setSelectedCustomer(updatedCustomer);
  };

  // Handle membership select
  const handleMembershipSelect = (membership) => {
    setSelectedMembership(membership);
    // Auto-set amount to membership price
    const price = parseFloat(membership.price) || 0;
    setPaymentData(prev => ({
      ...prev,
      amount: price.toString()
    }));
  };

  // Handle next step
  const handleNext = () => {
    if (step === 0) {
      // Validate: customer and membership must be selected
      if (!selectedCustomer) {
        alert('Pilih customer terlebih dahulu');
        return;
      }
      if (!selectedMembership) {
        alert('Pilih membership terlebih dahulu');
        return;
      }
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setShowSuccess(true);
    // Auto redirect after 2 seconds
    setTimeout(() => {
      navigate('/berandakasir');
    }, 2000);
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert(error || 'Gagal memproses pembayaran membership');
  };

  // Stepper progress (same as QuickOrder)
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200
            ${idx < step ? 'bg-blue-500 text-white' : idx === step ? 'bg-blue-700 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>{idx + 1}</div>
          {idx < steps.length - 1 && <div className={`w-8 h-1 ${idx < step ? 'bg-blue-500' : 'bg-gray-200'} rounded-full`}></div>}
        </div>
      ))}
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Customer Selection */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-blue-700 font-montserrat tracking-wide mt-8">
                Pilih Customer
              </h3>
              <MembershipCustomerSelect
                selectedCustomer={selectedCustomer}
                onSelect={() => setShowCustomerSearch(true)}
                onRemove={handleCustomerRemove}
                onCustomerUpdate={handleCustomerUpdate}
              />
            </div>

            {/* Membership Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-blue-700 font-montserrat tracking-wide">
                  Pilih Membership
                </h3>
                <button
                  onClick={() => navigate('/membership-management')}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-montserrat"
                >
                  Buat Membership di sini
                </button>
              </div>
              <MembershipSelection
                memberships={memberships}
                selectedMembership={selectedMembership}
                onSelect={handleMembershipSelect}
                loading={loadingMemberships}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <MembershipReview
            customer={selectedCustomer}
            customerDetail={customerDetail}
            membership={selectedMembership}
          />
        );

      case 2:
        return (
          <MembershipPaymentStep
            customer={selectedCustomer}
            membership={selectedMembership}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Same as QuickOrder */}
      <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] shadow-sm border-b rounded-b-3xl">
        <div className="flex items-center justify-between px-4 py-4 relative">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow border border-blue-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div className="flex-1 flex items-center text-center justify-center">
            <h1 className="text-lg font-semibold sm:text-3xl font-montserrat text-center font-normal text-white tracking-wide drop-shadow-md">Daftarkan Member</h1>
          </div>
          {/* Info Button - Optional, bisa diisi nanti jika perlu */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100">
          {/* Progress */}
          <div className="px-6 pt-6">
            {renderProgress()}
          </div>

          {/* Step Content */}
          <div className="px-6 pb-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            {/* Buttons */}
            <div className="flex gap-3">
              {step > 0 && (
                <AnimatedButton
                  variant="grey"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3"
                >
                  Kembali
                </AnimatedButton>
              )}

              {step < steps.length - 1 && (
                <AnimatedButton
                  variant="blue"
                  onClick={handleNext}
                  disabled={
                    (step === 0 && (!selectedCustomer || !selectedMembership)) ||
                    isSubmitting
                  }
                  className="flex-1 py-3"
                >
                  Lanjut
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <MembershipCustomerSearchModal
          customers={customers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelect={handleCustomerSelect}
          onClose={() => setShowCustomerSearch(false)}
          loading={loadingCustomers}
          onSearch={handleCustomerSearch}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-montserrat">
              Pembayaran Berhasil!
            </h3>
            <p className="text-gray-600 mb-4 font-montserrat">
              Membership berhasil ditambahkan ke customer.
            </p>
            <AnimatedButton
              variant="blue"
              onClick={() => navigate('/berandakasir')}
              className="w-full py-3 rounded-xl font-semibold font-montserrat"
            >
              Kembali ke Beranda
            </AnimatedButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipPurchase;

