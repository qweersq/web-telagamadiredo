import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserProfile } from './userProfileHelper';

/**
 * SubscriptionPlanGuard - Validasi subscription plan untuk route PRO features
 * Block NotaFree (plan_id === 4) dari mengakses route PRO
 */
export default function SubscriptionPlanGuard({ 
  children, 
  redirectTo = "/berandaowner",
  featureName = "Fitur PRO"
}) {
  const [loading, setLoading] = useState(true);
  const [isNotaFree, setIsNotaFree] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkSubscriptionPlan = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // No token, redirect to login
          setShouldRedirect(true);
          setLoading(false);
          return;
        }

        const profileData = await getUserProfile();
        
        if (profileData) {
          // Check if user has NotaFree plan (plan_id === 4)
          const planId = profileData?.subscription?.plan?.id;
          const isFree = planId === 4;
          
          setIsNotaFree(isFree);
          
          if (isFree) {
            setShouldRedirect(true);
          }
        }
      } catch (error) {
        console.error('❌ SubscriptionPlanGuard - Error checking subscription plan:', error);
        // On error, allow access (fail open) untuk avoid blocking legitimate users
        setIsNotaFree(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionPlan();
  }, [featureName]);

  // Show loading while checking subscription
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-montserrat">Memuat data langganan...</p>
        </div>
      </div>
    );
  }

  // Redirect NotaFree users atau user tanpa token
  if (shouldRedirect) {
    if (isNotaFree) {
      // Redirect dengan state untuk show modal PRO feature
      return (
        <Navigate 
          to={redirectTo} 
          replace 
          state={{ 
            showProFeatureModal: true,
            proFeatureName: featureName
          }} 
        />
      );
    } else {
      // No token, redirect to login
      return <Navigate to="/" replace />;
    }
  }

  // Allow access for non-NotaFree users
  return children;
}

