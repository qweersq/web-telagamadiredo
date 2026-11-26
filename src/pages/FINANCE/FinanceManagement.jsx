import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { 
  Wallet, 
  Tag, 
  CreditCard, 
  FileText,
  ArrowRight,
  Settings
} from 'lucide-react';

const FinanceManagement = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await instance.get('/get-profile');
        setUserData(data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const menuItems = [
    {
      title: 'Akun & Pembayaran',
      description: 'Kelola akun keuangan & metode pembayaran',
      icon: Wallet,
      path: '/finance-accounts',
      color: 'bg-blue-500'
    },
    {
      title: 'Kategori Transaksi',
      description: 'Kelola kategori transaksi',
      icon: Tag,
      path: '/finance-categories',
      color: 'bg-green-500'
    },
    {
      title: 'Transaksi Keuangan',
      description: 'Kelola transaksi keuangan',
      icon: CreditCard,
      path: '/finance-transactions',
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Keuangan" 
        description="Kelola keuangan bisnis Anda dengan mudah"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">


            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                
                return (
                  <AnimatedButton
                    key={index}
                    onClick={() => navigate(item.path)}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200"
                    variant="white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${item.color} text-white`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800 text-lg mb-1">
                            {item.title}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </AnimatedButton>
                );
              })}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default FinanceManagement;