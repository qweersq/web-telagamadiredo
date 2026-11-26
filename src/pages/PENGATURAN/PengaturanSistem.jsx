import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';

const PengaturanSistem = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Setup WhatsApp',
      description: 'Konfigurasi WhatsApp untuk setiap cabang',
      icon: '📱',
      color: 'bg-green-500',
      onClick: () => navigate('/wa-setup')
    }
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Pengaturan Sistem"
        description="Konfigurasi sistem dan pengaturan"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-lg font-semibold font-bold text-gray-800 mb-2">
                Pengaturan Sistem
              </h1>
              <p className="text-gray-600">
                Kelola konfigurasi dan pengaturan sistem
              </p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white text-xl`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-gray-400">
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
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default PengaturanSistem;