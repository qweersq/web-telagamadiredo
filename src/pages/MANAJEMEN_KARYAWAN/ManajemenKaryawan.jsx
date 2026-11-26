import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';

const ManajemenKaryawan = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Data Karyawan',
      description: 'Kelola informasi dan data karyawan',
      icon: '👤',
      color: 'bg-blue-500',
      onClick: () => navigate('/analisis-karyawan')
    },
    {
      title: 'Absensi Karyawan',
      description: 'Kelola kehadiran dan jam kerja karyawan',
      icon: '⏰',
      color: 'bg-green-500',
      onClick: () => navigate('/absensi-karyawan')
    },
    {
      title: 'Jadwal Kerja',
      description: 'Atur jam masuk & pulang per hari (weekday/weekend)',
      icon: '🗓️',
      color: 'bg-orange-500',
      onClick: () => navigate('/jadwal-kerja')
    }
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Karyawan" 
        description="Kelola data dan absensi karyawan"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">


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

export default ManajemenKaryawan;
