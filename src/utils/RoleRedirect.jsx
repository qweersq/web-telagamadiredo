import { Navigate } from 'react-router-dom';
import { useCurrentUserRole, getEffectiveRole, getHomeBeranda } from './roleValidator';
import { triggerBillingValidation } from './billingValidationHelper';
import { getUserProfile } from './userProfileHelper';
import { checkVersionFromProfile } from './versionChecker';
import { useEffect } from 'react';

export default function RoleRedirect({ allowedRoles, children, redirectTo }) {
  const { userRole, loading } = useCurrentUserRole();

  // Initialize user profile and billing validation when component mounts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await triggerBillingValidation();
        
        // Check app version update dari profile yang sudah di-fetch
        try {
          const profileData = await getUserProfile();
          const versionResult = checkVersionFromProfile(profileData);
          if (versionResult && versionResult.hasUpdate) {
            console.log('✅ Version update available:', versionResult);
            // Store update info in sessionStorage to pass to App component
            sessionStorage.setItem('app_version_update', JSON.stringify(versionResult));
            // Trigger custom event to notify App component
            window.dispatchEvent(new CustomEvent('appVersionUpdate', { detail: versionResult }));
          }
        } catch (versionError) {
          console.error('❌ Error checking version:', versionError);
        }
      } catch (error) {
        console.error('❌ RoleRedirect - Error initializing app data:', error);
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      initializeApp();
    }
  }, []);

  // Show loading while fetching user role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-montserrat">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  // Check if user role is allowed
  // Supervisor ditoleransi sebagai 'admin' (hak akses sama dengan admin)
  const isRoleAllowed = (role) => {
    if (!role) return false;
    return allowedRoles.includes(role) || allowedRoles.includes(getEffectiveRole(role));
  };

  // Cek token dulu sebelum redirect - jika token ada tapi userRole null, cek localStorage dulu
  const token = localStorage.getItem('token');
  if (!userRole || !isRoleAllowed(userRole)) {
    // Jika tidak ada token, baru redirect ke "/"
    if (!token) {
      return <Navigate to={redirectTo || "/"} replace />;
    }
    // Jika token ada tapi userRole null, coba fallback ke localStorage
    const fallbackRole = (() => {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) return null;
        const user = JSON.parse(userData);
        return user.role || user.user_role || null;
      } catch (e) {
        console.error('❌ RoleRedirect - Error parsing localStorage:', e);
        return null;
      }
    })();

    // Fallback role valid, allow access
    if (isRoleAllowed(fallbackRole)) {
      return children;
    }

    // Ditolak: arahkan ke beranda default role, bukan landing page,
    // supaya admin/supervisor tidak "hilang" saat membuka beranda yang bukan haknya.
    return <Navigate to={redirectTo || getHomeBeranda(userRole || fallbackRole)} replace />;
  }

  return children;
} 