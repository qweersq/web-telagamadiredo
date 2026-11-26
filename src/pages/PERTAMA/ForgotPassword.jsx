import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import instance from '../../config/api';
import AnimatedButton from "../../components/Design/AnimatedButton";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await instance.post('/forgot-password', {
        email: formData.email.trim(),
      });

      if (response.data?.success) {
        setSuccess("Jika email terdaftar, link reset password telah dikirim ke email Anda.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error forgot password:", error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || "Terjadi kesalahan saat mengirim email reset password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col justify-center items-center bg-white px-10 sm:px-0 overflow-y-auto">
      <div className="w-full sm:w-[380px] p-6 sm:p-8 my-auto bg-white rounded-3xl p-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold sm:text-2xl font-montserrat font-normal text-gray-800 tracking-wide mb-2">
            Lupa Password
          </h2>
          <p className="text-sm text-gray-500 font-montserrat font-light tracking-wide leading-relaxed">
            Masukkan email Anda untuk menerima link reset password
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
              <span className="text-gray-500 text-lg">@</span>
            </div>
            <input
              type="email"
              name="email"
              id="email"
              className="block w-full pl-12 pr-3 py-3 sm:py-3.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base placeholder:text-sm font-montserrat"
              placeholder="Masukan Email"
              value={formData.email}
              onChange={handleChange}
              required
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>

          <AnimatedButton
            type="submit"
            disabled={isLoading}
            className="w-full h-[40px] py-3 sm:py-3.5 px-4 mt-2 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-xl opacity-100 font-montserrat font-semibold flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim...</span>
              </div>
            ) : (
              "Kirim Link Reset"
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

export default ForgotPassword;

