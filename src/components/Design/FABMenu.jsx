import React, { useState } from 'react';
import { useCurrentUserRole } from '../../utils/roleValidator';

const menuItems = [
  {
    key: 'orders',
    label: 'Orders',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
    superadminOnly: true, // Mark this menu as superadmin only
  },
  {
    key: 'shift',
    label: 'Shift',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M2 11h20"/></svg>
    ),
  },
];

const FABMenu = ({ onOrder, onFinance, onQC, onShift }) => {
  const [open, setOpen] = useState(false);
  
  // Get current user role
  const { userRole } = useCurrentUserRole();
  const isSuperAdmin = userRole === 'superadmin';
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.superadminOnly && !isSuperAdmin) {
      return false; // Hide superadmin-only items for non-superadmin users
    }
    return true; // Show all other items
  });
  
  // Debug logging
  console.log('FABMenu - User role:', userRole, 'Is superadmin:', isSuperAdmin, 'Filtered items:', filteredMenuItems.length);

  const handleClick = (key) => {
    setOpen(false);
    if (key === 'orders' && onOrder) onOrder();
    if (key === 'finance' && onFinance) onFinance();
    if (key === 'shift' && onShift) onShift();
  };

  return (
    <>
      {/* Overlay untuk klik di luar menu, z-40 (menu z-50) */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Speed dial menu */}
        <div className={`flex flex-col items-end mb-2 transition-all duration-200 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
          {filteredMenuItems.map((item, idx) => (
            <button
              key={item.key}
              onClick={() => handleClick(item.key)}
              className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl bg-white shadow-lg text-gray-800 font-montserrat text-sm hover:bg-blue-50 active:scale-95 transition-all min-w-[110px]"
              style={{ transitionDelay: open ? `${idx * 40}ms` : '0ms' }}
            >
              <span className="text-blue-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        {/* FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-16 h-16 rounded-full bg-blue-500 shadow-xl flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all duration-150 ${open ? 'rotate-45' : ''}`}
          aria-label="Menu Utama"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </>
  );
};

export default FABMenu; 