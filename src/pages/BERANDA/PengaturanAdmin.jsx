import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Info,
  ChevronRight,
  Ticket,
  Tags,
  Users,
  Printer,
} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';

const PengaturanAdmin = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  // State untuk NotaFree (plan_id === 4) dan Pro Feature Modal
  const [isNotaFree, setIsNotaFree] = useState(false);
  const [showProFeatureModal, setShowProFeatureModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const { data } = await instance.get('/get-profile');
        const profileData = data.data;
        setUserData(profileData);

        // NotaFree (plan_id = 4) belum bisa akses fitur PRO
        const planId = profileData?.subscription?.plan?.id;
        setIsNotaFree(planId === 4);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('workStartTime');
    sessionStorage.removeItem('fromPresent');
    sessionStorage.removeItem('fromIzin');
    navigate('/');
  };

  // Menu disesuaikan untuk Agrowisata Telaga Madiredo.
  // Disembunyikan: FollowUp Manual & Template FU (PRO, khusus laundry)
  // dan Manajemen Membership (langganan laundry).
  const menuSections = [
    {
      title: 'Katalog & Harga',
      items: [
        {
          title: 'Tiket & Paket Wisata',
          description: 'Atur tiket masuk, paket wisata & sewa',
          Icon: Ticket,
          path: '/treatment-management',
          accent: 'from-telaga-600 to-telaga-500',
          tone: 'telaga',
        },
        // Produk & Menu disembunyikan (fokus tiket & paket wisata Telaga)
        {
          title: 'Promo & Diskon',
          description: 'Buat promo tiket dan paket wisata',
          Icon: Tags,
          path: '/discount-management',
          accent: 'from-telaga-500 to-telaga-400',
          tone: 'telaga',
        },
      ],
    },
    {
      title: 'Pelanggan & Operasional',
      items: [
        {
          title: 'Data Pengunjung',
          description: 'Kelola data pengunjung dan kontak',
          Icon: Users,
          path: '/customer-management',
          accent: 'from-telaga-700 to-telaga-600',
          tone: 'telaga',
        },
        {
          title: 'Printer Struk',
          description: 'Kelola printer tiket & koneksi Bluetooth',
          Icon: Printer,
          path: '/printer-management-admin',
          accent: 'from-senja-600 to-senja-500',
          tone: 'senja',
        },
      ],
    },
  ];

  // Handle click menu dengan gating fitur PRO
  const handleMenuClick = (item) => {
    if (item.isProFeature && isNotaFree) {
      setProFeatureName(item.title);
      setShowProFeatureModal(true);
      return;
    }

    navigate(item.path, { state: { from: 'pengaturan-admin' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-krem flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-600 mx-auto"></div>
          <p className="mt-4 text-telaga-700 font-montserrat">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krem">
      {/* Header */}
      <HeaderBerandaOwner
        title="Pengaturan"
        showBackButton={true}
        onLogout={handleLogout}
        userData={userData}
        hideUserMenu={true}
        backPath={'/berandakasir'}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-10">
          <div className="max-w-[390px] md:max-w-3xl mx-auto mt-[50px] space-y-6">

            {/* Intro disembunyikan (khusus Telaga)
            <div className="rounded-2xl border border-telaga-100 bg-gradient-to-br from-telaga-50 via-white to-senja-50/60 p-4">
              <h2 className="text-base font-bold text-telaga-900 font-montserrat">
                Pengaturan Operasional
              </h2>
              <p className="mt-1 text-xs text-telaga-700/80 font-montserrat">
                Kelola tiket, produk, dan data pengunjung Agrowisata Telaga Madiredo.
              </p>
            </div>
            */}

            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-wider text-telaga-600 font-montserrat">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((item) => {
                    const Icon = item.Icon;
                    const isSenja = item.tone === 'senja';
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleMenuClick(item)}
                        className="group flex w-full items-center gap-3.5 rounded-2xl border border-telaga-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-telaga-200 hover:shadow-md active:scale-[0.99]"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-semibold text-telaga-900 font-montserrat">
                              {item.title}
                            </h4>
                            {item.isProFeature && (
                              <span className="inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-senja-500 to-senja-400 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-telaga-700/70 font-montserrat">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                            isSenja ? 'text-senja-400' : 'text-telaga-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>
      </main>

      {/* Pro Feature Modal */}
      {showProFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-500 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-telaga-900 font-montserrat">
                    Fitur {proFeatureName}
                  </h3>
                  <p className="text-sm text-telaga-600 font-montserrat">
                    Hanya untuk paket berbayar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProFeatureModal(false)}
                className="p-2 rounded-full bg-telaga-50 hover:bg-telaga-100 text-telaga-700 transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="bg-senja-50 border border-senja-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-senja-800 font-montserrat font-medium mb-2">
                  Fitur ini memungkinkan Anda untuk:
                </p>
                <ul className="space-y-2 text-sm text-senja-700 font-montserrat">
                  {proFeatureName === 'FollowUp Manual' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengelola follow-up pengunjung secara manual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengirim pesan follow-up ke pengunjung lama</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengatur jadwal dan catatan follow-up</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Meningkatkan kunjungan ulang</span>
                      </li>
                    </>
                  )}
                  {proFeatureName === 'Template FU' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Membuat template pesan WhatsApp untuk follow-up</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengelola berbagai template pesan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Menggunakan template untuk follow-up yang lebih efisien</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-senja-600 mt-0.5">•</span>
                        <span>Mengatur template sesuai kebutuhan bisnis</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-sm text-telaga-700 font-montserrat text-center">
                Upgrade ke paket berbayar untuk mengakses fitur ini dan fitur premium lainnya.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <AnimatedButton
                variant="grey"
                onClick={() => setShowProFeatureModal(false)}
                className="flex-1 px-4 py-2 text-sm font-montserrat"
              >
                Tutup
              </AnimatedButton>
              <AnimatedButton
                variant="telaga"
                onClick={() => {
                  setShowProFeatureModal(false);
                  navigate('/billing-active-tenant-payment');
                }}
                className="flex-1 px-4 py-2 text-sm font-montserrat"
              >
                Lihat Paket
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PengaturanAdmin;
