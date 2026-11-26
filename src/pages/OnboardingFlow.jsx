import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaUsers, FaCogs, FaPrint, FaShoppingCart, FaCheckCircle, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import AnimatedButton from '../components/Design/AnimatedButton';
import instance from '../config/api';
import { getTenantId } from '../utils/userProfileHelper';
import ServiceSetupModal from '../components/ServiceManagement/ServiceSetupModal';
import QuickSetupModal from '../components/ServiceManagement/QuickSetupModal';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const topRef = useRef(null);
  const [currentStep, setCurrentStep] = useState('branch_setup');
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingData, setOnboardingData] = useState({});
  const [tenantId, setTenantId] = useState(null);

  // OnboardingFlow is now only for new users (first time login)

  // Get tenant_id from API get-profile
  useEffect(() => {
    const fetchTenantId = async () => {
      try {
        setLoading(true);
        console.log('🎯 OnboardingFlow: Fetching tenant_id from get-profile API...');

        const tenantId = await getTenantId();
        if (tenantId) {
          console.log('✅ OnboardingFlow: Tenant ID found:', tenantId);
          setTenantId(tenantId);
        } else {
          console.log('❌ OnboardingFlow: No tenant_id found');
          setError('Tenant ID tidak ditemukan. Silakan login ulang.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ OnboardingFlow: Error fetching tenant_id:', error);
        setError('Gagal mendapatkan data tenant. Silakan login ulang.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantId();
  }, [navigate]);

  // Get onboarding status
  useEffect(() => {
    if (tenantId) {
      getOnboardingStatus();
    }
  }, [tenantId]);

  const getOnboardingStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await instance.get(`/tenant-onboarding/status/${tenantId}`);

      if (response.data.success) {
        const data = response.data.data;
        setCurrentStep(data.current_step);
        setOnboardingData(data.onboarding_data || {});

        // If onboarding is completed, redirect to pilih role
        if (data.is_completed) {
          console.log('🎯 Onboarding completed, redirecting to pilih role');
          navigate('/pilih-role');
        }
      } else {
        setError(response.data.message || 'Gagal mendapatkan status onboarding');
      }
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      if (error.response?.status === 404) {
        setError('Data onboarding tidak ditemukan. Silakan hubungi administrator.');
      } else if (error.response?.status === 401) {
        setError('Sesi telah berakhir. Silakan login ulang.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Gagal mendapatkan status onboarding. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 'branch_setup',
      title: 'Outlet',
      description: 'Pastikan data Outlet sudah benar',
      icon: FaBuilding,
      component: BranchSetupStep
    },
    {
      id: 'user_creation',
      title: 'Karyawan',
      description: 'Pelajari cara menambah karyawan',
      icon: FaUsers,
      component: UserCreationStep
    },
    {
      id: 'service_setup',
      title: 'Informasi',
      description: 'Pelajari cara mengatur layanan laundry',
      icon: FaCogs,
      component: ServiceSetupStep
    },
    {
      id: 'order_management',
      title: 'Pesanan',
      description: 'Pelajari cara membuat order dengan sistem NotaSepatu',
      icon: FaShoppingCart,
      component: OrderManagementStep
    },
    {
      id: 'printer_setup',
      title: 'Printer',
      description: 'Pelajari cara menghubungkan printer',
      icon: FaPrint,
      component: PrinterSetupStep
    },
    {
      id: 'completion',
      title: 'Selesai',
      description: 'Onboarding selesai, siap memulai sistem',
      icon: FaCheckCircle,
      component: CompletionStep
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const currentStepData = steps[currentStepIndex];

  const completeOnboarding = async () => {
    try {
      console.log('🎯 Completing onboarding for tenant:', tenantId);

      const response = await instance.post(`/tenant-onboarding/${tenantId}/complete`);

      if (response.data.success) {
        console.log('✅ Onboarding completed successfully');
        // Redirect to pilih-role after completion
        setTimeout(() => {
          navigate('/pilih-role');
        }, 2000);
      } else {
        console.error('❌ Failed to complete onboarding:', response.data.message);
        setError('Gagal menyelesaikan onboarding. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setError('Gagal menyelesaikan onboarding. Silakan coba lagi.');
    }
  };

  function handleStepComplete(data) {
    console.log('🎯 handleStepComplete called with data:', data);
    console.log('🎯 Current step:', currentStep);

    setOnboardingData(prev => ({ ...prev, ...data }));

    // Show loading animation
    setStepLoading(true);

    // Move to next step locally with delay
    setTimeout(() => {
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      console.log('🎯 Current index:', currentIndex, 'Total steps:', steps.length);

      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        console.log('🎯 Moving to next step:', nextStep.id);
        setCurrentStep(nextStep.id);

        // Scroll to top after step change
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        console.log('🎯 Last step completed, marking onboarding as complete');
        // If it's the last step, mark onboarding as complete
        completeOnboarding();
      }

      setStepLoading(false);
    }, 1000); // 1 second delay
  }

  function handleStepBack() {
    console.log('🎯 handleStepBack called');
    console.log('🎯 Current step:', currentStep);

    const currentIndex = steps.findIndex(step => step.id === currentStep);
    console.log('🎯 Current index:', currentIndex);

    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      console.log('🎯 Moving to previous step:', prevStep.id);
      setCurrentStep(prevStep.id);

      // Scroll to top after step change
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  if (loading && !currentStepData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-montserrat">Memuat onboarding...</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
              Akses Ditolak
            </h2>
            <p className="text-gray-600 font-montserrat mb-6">
              {error || 'Tenant ID tidak ditemukan. Silakan login ulang untuk mengakses panduan onboarding.'}
            </p>
            <AnimatedButton
              onClick={() => navigate('/login')}
              variant="red"
              className="w-full"
            >
              Kembali ke Login
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            {/* {currentStepIndex > 0 && (
              <button
                onClick={handleStepBack}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-montserrat"
                disabled={stepLoading}
              >
                <FaArrowLeft className="text-sm" />
                <span>Kembali</span>
              </button>
            )} */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-2">
                Setup Awal Bisnis
              </h1>
              <p className="text-gray-600 font-montserrat">
                Langkah pertama untuk memulai aplikasi NotaSepatu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 ${isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                    {isCompleted ? (
                      <FaCheckCircle className="text-sm md:text-lg" />
                    ) : (
                      <Icon className="text-sm md:text-lg" />
                    )}
                  </div>
                  <span className={`text-xs md:text-xs font-montserrat text-center leading-tight ${isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
            <div
              className="bg-blue-500 h-1.5 md:h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {stepLoading ? (
            <div className="text-center py-12">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-montserrat">Memuat step berikutnya...</p>
            </div>
          ) : (
            currentStepData && (
              <currentStepData.component
                tenantId={tenantId}
                onboardingData={onboardingData}
                onComplete={handleStepComplete}
                onBack={handleStepBack}
                onError={setError}
                loading={loading}
                setLoading={setLoading}
                stepLoading={stepLoading}
                currentStepIndex={currentStepIndex}
              />
            )
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <FaSpinner className="text-sm" />
              <span className="font-montserrat">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Branch Setup Step Component
const BranchSetupStep = ({ tenantId, onboardingData, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const [outletData, setOutletData] = useState(null);
  const [outletLoading, setOutletLoading] = useState(true);
  const [outletError, setOutletError] = useState(null);

  // Fetch outlet data when component mounts
  useEffect(() => {
    if (tenantId) {
      fetchOutletData();
    }
  }, [tenantId]);

  const fetchOutletData = async () => {
    try {
      setOutletLoading(true);
      setOutletError(null);

      console.log('🔍 Fetching outlet data for tenant:', tenantId);
      const response = await instance.get('/branches');

      if (response.data.success && response.data.data.length > 0) {
        const outlet = response.data.data[0]; // Use first outlet
        console.log('✅ Outlet data fetched:', outlet);
        setOutletData(outlet);
      } else {
        console.log('⚠️ No outlet data found');
        setOutletError('Data outlet tidak ditemukan');
      }
    } catch (error) {
      console.error('❌ Error fetching outlet data:', error);
      setOutletError('Gagal memuat data outlet');
    } finally {
      setOutletLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <FaBuilding className="text-4xl text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
          Informasi Outlet
        </h2>
        <p className="text-gray-600 font-montserrat">
          Pastikan data Outlet sudah benar sebelum melanjutkan
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-slate-800 font-montserrat mb-3">
          Outlet Sudah Dibuat Otomatis
        </h3>
        <p className="text-sm text-slate-600 font-montserrat">
          Outlet pertama untuk bisnis Anda sudah dibuat otomatis. Data Outlet sudah tersimpan dengan benar.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-slate-800 font-montserrat mb-6 text-lg">
          Informasi Outlet
        </h3>

        {outletLoading ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-semibold text-slate-700 font-montserrat mb-1">Nama Outlet:</p>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-semibold text-slate-700 font-montserrat mb-1">Alamat:</p>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-300 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-semibold text-slate-700 font-montserrat mb-1">Telepon:</p>
                <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : outletError ? (
          <div className="space-y-4 text-sm font-montserrat">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-red-600 mb-1">Error:</p>
                <p className="text-red-600">{outletError}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Nama Outlet:</p>
                <p className="text-slate-600">Outlet Utama</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Alamat:</p>
                <p className="text-slate-600">Alamat Outlet sudah tersimpan</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Telepon:</p>
                <p className="text-slate-600">Nomor telepon Outlet</p>
              </div>
            </div>
          </div>
        ) : outletData ? (
          <div className="space-y-4 text-sm font-montserrat">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Nama Outlet:</p>
                <p className="text-slate-600">{outletData.name || 'Outlet Utama'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Alamat:</p>
                <p className="text-slate-600">{outletData.address || 'Alamat Outlet sudah tersimpan'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Telepon:</p>
                <p className="text-slate-600">{outletData.phone || 'Nomor telepon Outlet'}</p>
              </div>
            </div>
            {outletData.city && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Kota:</p>
                  <p className="text-slate-600">{outletData.city}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-sm font-montserrat">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Nama Outlet:</p>
                <p className="text-slate-600">Outlet Utama</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Alamat:</p>
                <p className="text-slate-600">Alamat Outlet sudah tersimpan</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Telepon:</p>
                <p className="text-slate-600">Nomor telepon Outlet</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {currentStepIndex > 0 && (
          <AnimatedButton
            onClick={onBack}
            variant="transparent"
            className="flex-1 py-3 text-lg font-semibold font-montserrat"
            disabled={stepLoading}
          >
            {/* <FaArrowLeft className="mr-2" /> */}
            Kembali
          </AnimatedButton>
        )}
        <AnimatedButton
          onClick={() => onComplete({ branch: 'completed' })}
          variant="green"
          className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
          disabled={stepLoading}
        >
          {stepLoading ? 'Memuat...' : 'Lanjutkan ke Step Berikutnya'}
        </AnimatedButton>
      </div>
    </div>
  );
};

// User Creation Step Component
const UserCreationStep = ({ tenantId, onboardingData, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const handleContinue = () => {
    console.log('🎯 UserCreationStep: handleContinue called');
    onComplete({ users: 'completed' });
  };

  return (
    <div>
      <div className="text-center mb-6">
        <FaUsers className="text-4xl text-green-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
          Informasi Karyawan & Role
        </h2>
        <p className="text-gray-600 font-montserrat">
          Pelajari peran dan tanggung jawab karyawan dalam sistem NotaSepatu
        </p>
      </div>
      {/* How to Add Users */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
          Cara Menambah Karyawan & Role
        </h3>
        <div className="space-y-4 text-sm font-montserrat">
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-slate-700">Masuk ke menu <strong>"Manajemen Karyawan"</strong> di beranda owner</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <p className="text-slate-700">Klik tombol <strong>"Tambah Karyawan"</strong></p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-slate-700">Isi data karyawan (nama, email, nomor HP, role)</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-4">
        {/* Employee Role Information */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 font-montserrat mb-8 text-xl text-center">
            Peran Karyawan dalam Sistem
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TEKNISI */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">🔧</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">TEKNISI</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Mencuci dan memperbaiki sepatu</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Lihat item yang belum dikerjakan dan sedang dalam proses</p>
                <p>• Ubah status: Belum dikerjakan → Sedang dikerjakan → Selesai</p>
                <p>• Wajib foto setiap perubahan status sebagai bukti</p>
              </div>
            </div>

            {/* KURIR */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">🚚</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">KURIR</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Mengantar dan menjemput sepatu</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Lihat item yang perlu dijemput atau diantar</p>
                <p>• Ubah status: Jemput → Selesai jemput atau Antar → Selesai antar</p>
                <p>• Wajib foto sebagai bukti pengiriman</p>
              </div>
            </div>

            {/* QC */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Quality Check</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Mengecek kualitas item setelah pengeringan</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Lihat item yang sudah dicuci dan siap dicek</p>
                <p>• Ubah status: Pengeringan → Siap atau Kembali ke teknisi</p>
                <p>• Kelola customer, layanan, item, diskon, dan printer</p>
                <p>• Wajib foto setiap perubahan status sebagai bukti</p>
              </div>
            </div>

            {/* ADMIN/KASIR */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">👤</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">ADMIN/KASIR</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Mengelola pesanan dan kontrol kualitas</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Input pesanan baru dan edit pesanan yang sudah ada</p>
                <p>• Lihat item yang sudah dicuci dan siap dicek</p>
                <p>• Kelola customer, layanan, item, diskon, dan printer</p>
              </div>
            </div>
          </div>

          {/* OWNER - Full Width */}
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-600 font-bold text-lg">👑</span>
              </div>
              <h4 className="font-bold text-slate-800 font-montserrat text-lg">OWNER</h4>
            </div>
            <p className="text-slate-600 font-montserrat mb-4">Mengatur semua aspek bisnis</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500 font-montserrat">
              <div>
                <p>• Akses penuh ke semua menu dan pengaturan</p>
                <p>• Kelola cabang, karyawan, keuangan, dan semua pengaturan sistem</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-100 rounded-xl">
            <p className="text-sm text-slate-600 text-center font-montserrat">
              <strong>Catatan Penting:</strong> Setiap perubahan status akan tercatat untuk customer.
            </p>
          </div>
        </div>




        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <AnimatedButton
              onClick={onBack}
              variant="grey"
              className="flex-1 py-3 text-lg font-semibold font-montserrat flex items-center justify-center"
              disabled={stepLoading}
            >
              <FaArrowLeft className="mr-2 text-sm" />
              Kembali
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={handleContinue}
            variant="green"
            className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
            disabled={stepLoading}
          >
            {stepLoading ? 'Memuat...' : 'Lanjutkan'}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

// Service Setup Step Component
const ServiceSetupStep = ({ tenantId, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showQuickSetupModal, setShowQuickSetupModal] = useState(false);
  const [savedServices, setSavedServices] = useState([]);
  const [quickSetupData, setQuickSetupData] = useState(null);

  const handleServiceSave = (serviceData) => {
    console.log('💾 Service saved:', serviceData);
    setSavedServices(prev => [...prev, serviceData]);
  };

  const handleQuickSetupComplete = (setupData) => {
    console.log('🚀 Quick setup completed:', setupData);
    setQuickSetupData(setupData);
  };

  const handleContinue = () => {
    onComplete({ services: 'completed' });
  };

  return (
    <div>
      <div className="text-center mb-6">
        <FaCogs className="text-4xl text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
          Informasi data default
        </h2>
        <p className="text-gray-600 font-montserrat">
          Konfigurasi data default untuk bisnis Anda
        </p>
      </div>

      <div className="space-y-6">

        {/* Default Data Information */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 font-montserrat mb-8 text-xl text-center">
            Data Default yang Sudah Dibuat
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TREATMENTS */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">🧽</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Treatment</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">5 layanan populer sudah siap pakai</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Deep Clean (Rp 40.000)</p>
                <p>• Outside Clean (Rp 30.000)</p>
                <p>• Reglue Minor (Rp 15.000)</p>
                <p>• Sandals Clean (Rp 15.000)</p>
                <p>• Bag Clean (Rp 35.000)</p>
              </div>
              <p className="text-xs text-slate-400 font-montserrat mt-3">
                Bisa diubah sesuai kebutuhan bisnis
              </p>
            </div>

            {/* ITEMS */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">👟</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Item Template</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">5 contoh sepatu sebagai template</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Air Force 1 (Nike)</p>
                <p>• Converse</p>
                <p>• Ultraboost (Adidas)</p>
                <p>• New Balance</p>
                <p>• Sandal Casual</p>
              </div>
              <p className="text-xs text-slate-400 font-montserrat mt-3">
                Bisa diubah
              </p>
            </div>

            {/* MEMBERSHIP */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">💎</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Sistem Poin & Membership</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Sistem membership sudah aktif</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• PREMIUM (10% discount)</p>
                <p>• Harga: Rp 100.000/tahun</p>
                <p>• Berlaku 365 hari</p>
              </div>
              <p className="text-xs text-slate-400 font-montserrat mt-3">
                Bisa ditambah jenis membership lain
              </p>
            </div>

            {/* FINANCE */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">💰</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Finance Setup</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">Akun keuangan sudah dikonfigurasi</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Bank BCA (Global)</p>
                <p>• QRIS Gateway (Global)</p>
                <p>• Cash Box (Branch)</p>
                <p>• 3 Kategori keuangan</p>
              </div>
              <p className="text-xs text-slate-400 font-montserrat mt-3">
                Siap untuk transaksi harian
              </p>
            </div>
          </div>

          {/* DISCOUNTS & CAMPAIGN */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">🏷️</span>
                </div>
                <h4 className="font-bold text-slate-800 font-montserrat text-lg">Discount</h4>
              </div>
              <p className="text-slate-600 font-montserrat mb-4">2 jenis diskon siap pakai</p>
              <div className="space-y-2 text-sm text-slate-500 font-montserrat">
                <p>• Discount 10% (Percent)</p>
                <p>• Discount Rp 5.000 (Nominal)</p>
              </div>
              <p className="text-xs text-slate-400 font-montserrat mt-3">
                Bisa disesuaikan dengan kebutuhan bisnis
              </p>
            </div>


          </div>

          <div className="mt-8 p-6 bg-slate-100 rounded-xl">
            <p className="text-sm text-slate-600 text-center font-montserrat">
              <strong>Catatan:</strong> Semua data default sudah siap pakai dan bisa diubah sesuai kebutuhan bisnis Anda.
            </p>
          </div>
        </div>


        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <AnimatedButton
              onClick={onBack}
              variant="grey"
              className="flex-1 py-3 text-lg font-semibold font-montserrat flex items-center justify-center"
              disabled={stepLoading}
            >
              <FaArrowLeft className="mr-2 text-sm" />
              Kembali
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={handleContinue}
            variant="green"
            className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
            disabled={stepLoading}
          >
            {stepLoading ? 'Memuat...' : 'Lanjutkan'}
          </AnimatedButton>
        </div>
      </div>

      {/* Service Setup Modal */}
      <ServiceSetupModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSave={handleServiceSave}
      />

      {/* Quick Setup Modal */}
      <QuickSetupModal
        isOpen={showQuickSetupModal}
        onClose={() => setShowQuickSetupModal(false)}
        onComplete={handleQuickSetupComplete}
        tenantId={tenantId}
      />
    </div>
  );
};

// Printer Setup Step Component
const PrinterSetupStep = ({ tenantId, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const handleContinue = () => {
    onComplete({ printer: 'completed' });
  };

  return (
    <div>
      <div className="text-center mb-6">
        <FaPrint className="text-4xl text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
          Setup Printer
        </h2>
        <p className="text-gray-600 font-montserrat">
          Pelajari cara menghubungkan printer untuk struk
        </p>
      </div>

      <div className="space-y-6">
        {/* Printer Setup */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
            Setup Printer
          </h3>
          <div className="space-y-4 text-sm font-montserrat">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <p className="text-slate-700">Masuk ke menu <strong>"Pengaturan Printer"</strong></p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <p className="text-slate-700">Klik <strong>"Cari Printer"</strong> untuk menambah printer baru</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <p className="text-slate-700">Isi nama printer</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <p className="text-slate-700">Test print untuk memastikan printer berfungsi</p>
            </div>
          </div>
        </div>


        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <AnimatedButton
              onClick={onBack}
              variant="grey"
              className="flex-1 py-3 text-lg font-semibold font-montserrat flex items-center justify-center"
              disabled={stepLoading}
            >
              <FaArrowLeft className="mr-2 text-sm" />
              Kembali
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={handleContinue}
            variant="green"
            className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
            disabled={stepLoading}
          >
            {stepLoading ? 'Memuat...' : 'Lanjutkan'}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

// Order Management Step Component
const OrderManagementStep = ({ tenantId, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const handleContinue = () => {
    onComplete({ order_management: 'completed' });
  };

  return (
    <div>
      <div className="text-center mb-6">
        <FaShoppingCart className="text-4xl text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
          Buat Order
        </h2>
        <p className="text-gray-600 font-montserrat">
          Pelajari cara membuat order dengan sistem NotaSepatu
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Management Overview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
            Sistem Order Management
          </h3>
          <div className="space-y-3 text-sm text-slate-700 font-montserrat">
            <p>• <strong>Quick Order:</strong> Input pesanan tanpa detail item</p>
            <p>• <strong>Order Detail:</strong> Input lengkap dengan detail item spesifik</p>
            <p>• <strong>Tracking:</strong> Pantau status setiap item secara detail</p>
            <p>• <strong>Payment:</strong> Kelola pembayaran DP dan lunas</p>
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-6 text-lg">
            Jenis Order
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">Quick Order</h4>
              <ul className="space-y-2 text-sm text-slate-600 font-montserrat">
                <li>• Input cepat tanpa detail item</li>
                <li>• Cocok untuk pelanggan terburu-buru</li>
                <li>• Langsung ke pembayaran</li>
                <li>• Print receipt otomatis</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">Order Detail</h4>
              <ul className="space-y-2 text-sm text-slate-600 font-montserrat">
                <li>• Input detail item lengkap</li>
                <li>• Upload foto item</li>
                <li>• Tracking status per item</li>
                <li>• Tambah item setelah order dibuat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Create Order */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
            Cara Membuat Order
          </h3>
          <div className="space-y-4 text-sm font-montserrat">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <p className="text-slate-700">Masuk ke menu <strong>"Tambah Pesanan"</strong> di beranda</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <p className="text-slate-700">Pilih Pelanggan, treatment, dan quantity</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <p className="text-slate-700">Atur metode pembayaran dan jumlah</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <p className="text-slate-700">Tambahkan detail item jika diperlukan</p>
            </div>
          </div>
        </div>



        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <AnimatedButton
              onClick={onBack}
              variant="grey"
              className="flex-1 py-3 text-lg font-semibold font-montserrat flex items-center justify-center"
              disabled={stepLoading}
            >
              <FaArrowLeft className="mr-2 text-sm" />
              Kembali
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={handleContinue}
            variant="blue"
            className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
            disabled={stepLoading}
          >
            {stepLoading ? 'Memuat...' : 'Lanjutkan'}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

// Completion Step Component
const CompletionStep = ({ tenantId, onComplete, onBack, onError, loading, setLoading, stepLoading, currentStepIndex }) => {
  const navigate = useNavigate();

  const handleStartSystem = async () => {
    try {
      // Mark onboarding as completed
      await onComplete({ completion: 'completed' });

      // Navigate to pilih-role
      navigate('/pilih-role');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <FaCheckCircle className="text-6xl text-green-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 font-montserrat mb-4">
          Selamat! Onboarding Selesai
        </h2>
        <p className="text-gray-600 font-montserrat text-lg">
          Anda telah menyelesaikan panduan onboarding NotaSepatu
        </p>
      </div>

      <div className="space-y-6">
        {/* Success Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
            Yang Sudah Dipelajari
          </h3>
          <div className="space-y-3 text-sm text-slate-700 font-montserrat">
            <p>• <strong>Outlet:</strong> Data outlet sudah dikonfirmasi</p>
            <p>• <strong>Karyawan:</strong> Peran dan cara menambah karyawan</p>
            <p>• <strong>Layanan:</strong> Data default sudah siap pakai</p>
            <p>• <strong>Pesanan:</strong> Cara membuat order dan tracking</p>
            <p>• <strong>Printer:</strong> Setup printer untuk struk</p>
          </div>
        </div>

        {/* Feedback Request */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 font-montserrat mb-4 text-lg">
            Bantu Kami Berkembang
          </h3>
          <p className="text-slate-700 font-montserrat mb-4">
            Feedback dan masukan Anda sangat berharga untuk pengembangan fitur NotaSepatu.
            Bantu kami membuat sistem yang lebih efektif untuk bisnis laundry sepatu.
          </p>
          <p className="text-sm text-slate-600 font-montserrat">
            Anda dapat memberikan feedback melalui menu "Feedback" di beranda owner.
          </p>
        </div>

        {/* Ready to Start */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 font-montserrat mb-3 text-lg">
            Siap Memulai Sistem
          </h3>
          <p className="text-green-700 font-montserrat">
            Semua sudah siap! Anda dapat mulai menggunakan sistem NotaSepatu untuk mengelola bisnis laundry sepatu.
          </p>
        </div>

        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <AnimatedButton
              onClick={onBack}
              variant="grey"
              className="flex-1 py-3 text-lg font-semibold font-montserrat flex items-center justify-center"
              disabled={stepLoading}
            >
              <FaArrowLeft className="mr-2 text-sm" />
              Kembali
            </AnimatedButton>
          )}
          <AnimatedButton
            onClick={handleStartSystem}
            variant="green"
            className={`py-3 text-lg font-semibold font-montserrat ${currentStepIndex > 0 ? 'flex-1' : 'w-full'}`}
            disabled={stepLoading}
          >
            {stepLoading ? 'Memuat...' : 'Mulai Sistem'}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
