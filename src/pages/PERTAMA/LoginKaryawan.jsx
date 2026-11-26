import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Building2, Users } from "lucide-react";
import instance from '../../config/api';
import { setAuthToken } from '../../config/api';
import AnimatedButton from "../../components/Design/AnimatedButton";
import { getTenantId, clearUserProfileCache } from '../../utils/userProfileHelper';

const LoginKaryawan = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("owner"); // "owner" or "employee"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear user profile cache when login page is opened
  useEffect(() => {
    clearUserProfileCache();

    // Also clear localStorage data to ensure fresh start
    localStorage.removeItem("userData");
    localStorage.removeItem("selectedBranch");
    localStorage.removeItem("selectedRole");
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const checkOnboardingAndRedirect = async () => {
    try {

      // Get tenant_id from user profile
      const tenantId = await getTenantId();

      if (!tenantId) {
        navigate("/pilih-role");
        return;
      }

      // Subscription check will be handled in PilihRole

      // Check onboarding status
      const response = await instance.get(`/tenant-onboarding/status/${tenantId}`);

      if (response.data.success) {
        const { is_completed } = response.data.data;

        if (is_completed) {
          navigate("/pilih-role");
        } else {
          navigate("/onboarding");
        }
      } else {
        navigate("/pilih-role");
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // If error, redirect to pilih-role as fallback
      navigate("/pilih-role");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await instance.post(
        '/login',
        {
          email: formData.email,
          password: formData.password,
          device_type: 'web', // Specify device type for multi-device support
        }
      );


      if (response.data?.data?.token) {
        const token = response.data.data.token;
        const refreshToken = response.data.data.refreshToken; // Get refresh token

        setAuthToken(token);
        localStorage.setItem("token", token);

        // Save refresh token to localStorage
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
          console.log('✅ [LoginKaryawan] Refresh token saved to localStorage');
        }

        // Clear any existing userData and selectedBranch to prevent data contamination
        localStorage.removeItem("userData");
        localStorage.removeItem("selectedBranch");
        localStorage.removeItem("selectedRole");

        // Validate billing after successful login
        try {
          const billingResponse = await instance.post('/billing/validate');

          if (billingResponse.data.success) {

            // Check if any validations need attention
            const validations = billingResponse.data.data?.validations || [];
            const hasErrors = validations.some(v => v.status === 'error');
            const hasExpired = validations.some(v => v.status === 'expired');

            if (hasErrors) {
              console.warn('⚠️ LoginKaryawan - Billing validation has errors:', validations);
            }

            if (hasExpired) {
              console.warn('⚠️ LoginKaryawan - Subscription expired detected:', validations);
            }
          }
        } catch (billingError) {
          console.error('❌ LoginKaryawan - Billing validation failed:', billingError.response?.data || billingError.message);
          // Don't redirect on billing validation errors, just log them
          // The 402 redirect is already handled by axios interceptor
        }

        // Check onboarding status before redirecting
        await checkOnboardingAndRedirect();
      } else {
        setError("Token tidak ditemukan dalam response");
        console.error("Response structure:", response.data);
      }
    } catch (error) {
      console.error("Error login:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });

      // Handle different error status codes
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message;

        // Check if it's account not verified error
        if (errorMessage && errorMessage.includes("belum diverifikasi")) {
          setError(
            <div className="space-y-2">
              <div className="font-semibold">Akun Belum Diverifikasi</div>
              <div className="text-sm">
                Akun Anda belum diverifikasi. Silakan cek WhatsApp untuk link verifikasi atau hubungi support untuk bantuan.
              </div>
            </div>
          );
        } else {
          // Regular login validation error (wrong email/password)
          setError(errorMessage || "Email atau password salah");
        }
      } else if (error.response?.status === 404) {
        setError("URL login tidak ditemukan. Mohon periksa koneksi.");
      } else if (error.response?.status === 401) {
        // This should not happen for login, but handle just in case
        setError("Token tidak valid. Silakan login ulang.");
      } else {
        setError(error.response?.data?.error?.message || error.response?.data?.message || "Terjadi kesalahan saat login");
      }
    } finally {
      setIsLoading(false);
    }

    sessionStorage.clear();

    // sessionStorage.removeItem("fromIzin");
    // sessionStorage.removeItem("fromPresent");
    // sessionStorage.removeItem("previousPage");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-krem px-6 sm:px-0 py-8 overflow-y-auto">
      <div className="w-full sm:w-[390px] p-6 sm:p-8 my-auto bg-white rounded-3xl shadow-xl shadow-telaga-900/5 outline outline-2 outline-telaga-100">
        <div className="text-center mb-6">
          <div className="mb-6 text-center relative">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/images/telagamadiredo-logo.svg"
                alt="Agrowisata Telaga Madiredo"
                className="h-16 w-16"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-montserrat font-light text-telaga-950 mb-2 relative">
              <span className="font-montserrat font-bold">Telaga</span>
              <span className="font-montserrat font-bold text-senja-500"> Madiredo</span>
            </h1>

            {/* Subtitle */}
            <div className="text-[10px] font-montserrat font-light text-telaga-700/70 tracking-[0.18em] uppercase mb-4">
              Spirit of Nature &middot; Pool &amp; Resto
            </div>

            {/* Ornament Bottom */}
            <div className="flex items-center justify-center">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-senja-300 to-transparent"></div>
              <div className="w-1.5 h-1.5 bg-senja-400 rounded-full mx-2"></div>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-telaga-300 to-transparent"></div>
            </div>
          </div>

          {/* Tab Switch - Pengelola / Karyawan */}
          <div className="flex bg-telaga-50 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setLoginType("owner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-montserrat font-medium transition-all duration-200 ${loginType === "owner"
                ? "bg-white text-telaga-700 shadow-sm"
                : "text-telaga-900/50 hover:text-telaga-900/75"
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pengelola</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginType("employee")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-montserrat font-medium transition-all duration-200 ${loginType === "employee"
                ? "bg-white text-telaga-700 shadow-sm"
                : "text-telaga-900/50 hover:text-telaga-900/75"
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Karyawan</span>
            </button>
          </div>

          <p className="text-center text-sm text-telaga-900/60 font-montserrat font-light tracking-wide leading-relaxed">
            {loginType === "owner"
              ? "Masuk sebagai pengelola Telaga Madiredo dengan email yang terdaftar"
              : "Masuk sebagai karyawan dengan email yang diberikan oleh Pengelola"
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-montserrat">
            {typeof error === 'string' ? error : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="text-telaga-600 text-lg">@</span>
            </div>
            <input
              type="email"
              name="email"
              id="email"
              className="block w-full pl-12 pr-3 py-3 sm:py-3.5 border border-telaga-100 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm sm:text-base placeholder:text-sm font-montserrat"
              placeholder="Masukan Email"
              value={formData.email}
              onChange={handleChange}
              required
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-telaga-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              className="placeholder:text-sm block w-full pl-12 pr-12 py-3 sm:py-3.5 border border-telaga-100 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm sm:text-base font-montserrat"
              placeholder="Masukan Kata Sandi"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-telaga-900/40 hover:text-telaga-700 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] py-3 sm:py-3.5 px-4 mt-2 bg-gradient-to-r from-telaga-700 to-telaga-500 text-white rounded-xl opacity-100 font-montserrat font-semibold flex items-center justify-center text-sm shadow-lg shadow-telaga-900/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </div>
            ) : (
              "Masuk"
            )}
          </AnimatedButton>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-senja-600 hover:text-senja-700 font-montserrat font-medium"
          >
            Lupa Password?
          </Link>
        </div>

        {/* CS Contact */}
        <div className="mt-4 text-center">
          <p className="text-xs text-telaga-900/45 font-montserrat">
            Ada kendala saat login?{' '}
            <a
              href="https://wa.me/6285810009211"
              target="_blank"
              rel="noopener noreferrer"
              className="text-senja-600 hover:text-senja-700 font-medium"
            >
              Hubungi Admin Telaga Madiredo
            </a>
          </p>
        </div>
      </div>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 text-xs font-montserrat text-telaga-700/70 hover:text-telaga-800 transition-colors"
      >
        &larr; Kembali ke beranda
      </Link>

      <p className="mt-3 text-[11px] font-montserrat text-telaga-900/35">
        Agrowisata Telaga Madiredo &middot; Desa Madiredo, Pujon, Malang
      </p>
    </div>
  );
};

export default LoginKaryawan;
