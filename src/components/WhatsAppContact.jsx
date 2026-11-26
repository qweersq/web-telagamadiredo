import { FaWhatsapp, FaPhone, FaEnvelope } from 'react-icons/fa';

const WhatsAppContact = () => {
  const phoneNumber = '6287778942773';
  const message = 'Halo, saya belum menerima kredensial login untuk akun NotaSepatu saya. Mohon bantuannya.';

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = () => {
    window.open(`tel:${phoneNumber}`);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaWhatsapp className="text-blue-600 text-lg" />
        </div>
        <h3 className="text-lg font-montserrat text-blue-800">Hubungi Admin</h3>
      </div>

      <p className="text-sm text-blue-700 font-montserrat mb-4">
        Jika Anda belum menerima kredensial login, silakan hubungi admin untuk mendapatkan bantuan.
      </p>

      <div className="space-y-3">
        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold font-montserrat flex items-center justify-center gap-3 transition-colors duration-200"
        >
          <FaWhatsapp className="text-lg" />
          <span>Chat via WhatsApp</span>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600 font-montserrat text-center">
          Nomor Admin: <strong>+6287778942773</strong>
        </p>
      </div>
    </div>
  );
};

export default WhatsAppContact;
