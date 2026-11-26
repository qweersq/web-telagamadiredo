import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import instance from '../../config/api';
import AnimatedButton from "../../components/Design/AnimatedButton";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError("Token reset password tidak valid");
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const validatePassword = () => {
    if (formData.password.length < 8) {
      setError("Password harus minimal 8 karakter");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await instance.post('/reset-password', {
        token: token,
        password: formData.password,
      });

      if (response.data?.success) {
        setSuccess("Password berhasil direset. Anda akan diarahkan ke halaman login...");
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Password berhasil direset. Silakan login dengan password baru." }
          });
        }, 2000);
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error reset password:", error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || "Terjadi kesalahan saat reset password";
      
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        setError("Link reset password sudah kadaluarsa atau tidak valid. Silakan request reset password baru.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="h-[100dvh] flex flex-col justify-center items-center bg-white px-10 sm:px-0 overflow-y-auto">
        <div className="w-full sm:w-[380px] p-6 sm:p-8 my-auto bg-white rounded-3xl p-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold sm:text-2xl font-montserrat font-normal text-gray-800 tracking-wide mb-4">
              Token Tidak Valid
            </h2>
            <p className="text-sm text-gray-500 font-montserrat font-light">
              Link reset password tidak valid atau sudah kadaluarsa.
            </p>
          </div>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-montserrat font-medium"
            >
              Request Reset Password Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col justify-center items-center bg-white px-10 sm:px-0 overflow-y-auto">
      <div className="w-full sm:w-[380px] p-6 sm:p-8 my-auto bg-white rounded-3xl p-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold sm:text-2xl font-montserrat font-normal text-gray-800 tracking-wide mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-500 font-montserrat font-light tracking-wide leading-relaxed">
            Masukkan password baru Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-montserrat">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-montserrat">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
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
              className="placeholder:text-sm block w-full pl-12 pr-12 py-3 sm:py-3.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base font-montserrat"
              placeholder="Password Baru (min. 8 karakter)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
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
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              className="placeholder:text-sm block w-full pl-12 pr-12 py-3 sm:py-3.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base font-montserrat"
              placeholder="Konfirmasi Password Baru"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="w-full h-[40px] py-3 sm:py-3.5 px-4 mt-2 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-xl opacity-100 font-montserrat font-semibold flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mereset Password...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </AnimatedButton>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-montserrat font-medium"
          >
            ← Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

