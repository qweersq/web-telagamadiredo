import React, { useState, useEffect } from 'react';
import { getUserProfile } from './userProfileHelper';

// Helper to get current user role from API
export function useCurrentUserRole() {  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.user) {
          const role = profile.user.role || profile.user.user_role || null;
          setUserRole(role);
        } else {
          console.warn('⚠️ useCurrentUserRole - No user data in profile');
          // Fallback ke localStorage jika profile tidak ada user
          try {
            const userData = localStorage.getItem('userData');
            if (userData) {
              const user = JSON.parse(userData);
              setUserRole(user.role || user.user_role || null);
            }
          } catch (e) {
            console.error('❌ Error parsing localStorage userData:', e);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user role:', error);
        // Fallback to localStorage if API fails
        try {
          const userData = localStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            setUserRole(user.role || user.user_role || null);
          }
        } catch (e) {
          console.error('❌ Error parsing localStorage userData:', e);
          // Jika localStorage juga error, cek token - jika token ada, set role dari token
          const token = localStorage.getItem('token');
          if (!token) {
            // Tidak ada token dan tidak ada data, set null
            setUserRole(null);
          }
          // Jika token ada, jangan set null - biarkan retry atau fallback lain handle
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { userRole, loading };
}

// Supervisor memakai hak akses admin (mirip normalisasi role di server),
// jadi gate yang mengizinkan 'admin' otomatis mengizinkan 'supervisor'.
// Route khusus owner ('superadmin') / superapp tetap tertutup.
export function getEffectiveRole(role) {
  return role === 'supervisor' ? 'admin' : role;
}

// Matriks akses beranda — satu-satunya acuan (dipakai App.jsx & PilihRole).
// owner (superadmin) : semua beranda
// supervisor         : semua beranda kecuali beranda owner
// admin              : beranda admin (kasir) + beranda staff
// employee           : beranda staff saja
export const BERANDA_ACCESS = {
  '/berandaowner': ['superadmin'],
  '/berandasupervisor': ['superadmin', 'supervisor'],
  '/berandakasir': ['superadmin', 'supervisor', 'admin'],
  '/berandastaff': ['superadmin', 'supervisor', 'admin', 'employee'],
  '/berandateknisi': ['superadmin', 'supervisor'],
  '/berandakurir': ['superadmin', 'supervisor'],
  '/berandaqc': ['superadmin', 'supervisor'],
  // Dapur = layar kerja penyiapan pesanan (cafe/resto). Terbuka untuk semua
  // peran operasional karena juru masak biasanya login sebagai employee.
  '/berandadapur': ['superadmin', 'supervisor', 'admin', 'employee'],
  '/beranda-marketing': ['superadmin', 'supervisor'],
};

// Role mentah dari localStorage (dipakai untuk menentukan beranda tujuan saat navigasi fallback)
export function getStoredRole() {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.role || user.user_role || null;
  } catch {
    return null;
  }
}

// Beranda default tiap role, dipakai saat akses ditolak / tombol kembali.
// Sengaja pakai role asli (bukan getEffectiveRole) agar supervisor tidak jatuh ke beranda admin.
export function getHomeBeranda(role) {
  switch (role) {
    case 'superadmin':
      return '/berandaowner';
    case 'supervisor':
      return '/berandasupervisor';
    case 'admin':
      return '/berandakasir';
    case 'employee':
      return '/berandastaff';
    default:
      return '/';
  }
}

// Label & warna badge role untuk daftar karyawan (dipakai web, jadi acuan mobile juga).
// Role yang tidak terdaftar dikembalikan apa adanya agar tidak mengubah perilaku lama.
export const ROLE_LABELS = {
  admin: 'Admin',
  employee: 'Karyawan',
  supervisor: 'Supervisor',
  'superapp-superadmin': 'Super App Admin',
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function getRoleBadgeClass(role) {
  if (role === 'employee') return 'bg-blue-100 text-blue-800';
  if (role === 'supervisor') return 'bg-indigo-100 text-indigo-800';
  return 'bg-purple-100 text-purple-800';
}

// Siapa yang boleh berpindah cabang: owner (superadmin) dan supervisor.
// Harus sama dengan server: POST /switch-branch -> allow([1, 5]).
// Dipakai bersama oleh PilihRole, LogoutButton, dan Header agar tidak beda-beda.
export function canSwitchBranch(role) {
  return role === 'superadmin' || role === 'supervisor';
}

// Component wrapper for role-based rendering
export function WithRole({ allowedRoles, children }) {
  const { userRole, loading } = useCurrentUserRole();
  
  if (loading) {
    return null;
  }
  
  if (userRole && (allowedRoles.includes(userRole) || allowedRoles.includes(getEffectiveRole(userRole)))) {
    return <>{children}</>;
  }
  return null;
} 

// Helper to filter role buttons based on user role
export function filterRoleButtons(roleButtons, userRole) {
  if (userRole === 'superadmin') {
    // Superadmin bisa akses semua peran (Admin, Supervisor, Pengelola)
    return roleButtons;
  }
  if (userRole === 'supervisor') {
    // Semua beranda kecuali beranda owner
    return roleButtons.filter(btn => btn.role !== 'owner');
  }
  if (userRole === 'admin') {
    return roleButtons.filter(btn => ['admin', 'staff', 'dapur'].includes(btn.role));
  }
  if (userRole === 'employee') {
    return roleButtons.filter(btn => ['staff', 'dapur'].includes(btn.role));
  }
  return [];
} 