const buttonStyles = {
  // `blue` dipertahankan sebagai nama variant agar ~80 pemakaian lama tidak perlu
  // diubah satu per satu, tapi warnanya sudah mengikuti brand Telaga Madiredo.
  blue: "bg-gradient-to-r from-[#15803D] to-[#22C55E] text-white font-montserrat rounded-xl text-sm font-semibold shadow-lg shadow-[#14532D]/20",
  telaga: "bg-gradient-to-r from-[#15803D] to-[#22C55E] text-white font-montserrat rounded-xl text-sm font-semibold shadow-lg shadow-[#14532D]/20",
  senja: "bg-gradient-to-r from-[#EA580C] to-[#FB923C] text-white font-montserrat rounded-xl text-sm font-semibold shadow-lg shadow-[#7C2D12]/20",
  green: "bg-gradient-to-r from-[#008A6B] to-[#00A98C] text-white font-montserrat rounded-xl text-sm font-semibold",
  purple: "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-montserrat rounded-xl text-sm font-semibold",
  orange: "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white font-montserrat rounded-xl text-sm font-semibold",
  indigo: "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-montserrat rounded-xl text-sm font-semibold",
  teal: "bg-gradient-to-r from-[#14B8A6] to-[#5EEAD4] text-white font-montserrat rounded-xl text-sm font-semibold",
  red: "bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white font-montserrat rounded-xl text-sm font-semibold",
  grey: "bg-gray-100 text-gray-700 font-montserrat rounded-xl text-sm font-semibold",
  black: "bg-gradient-to-r from-[#000000] to-[#6A6A6A] text-white font-montserrat rounded-xl text-sm font-semibold",
  transparent: "bg-white outline outline-1 outline-black text-black font-montserrat rounded-xl",
  "transparent-blue": "bg-transparent outline outline-2 outline-telaga-500 text-telaga-700 font-montserrat rounded-xl text-sm font-semibold hover:bg-telaga-50 transition-colors",
  disabled:
    "bg-gradient-to-l from-[#CFCFCF] to-[#818181] text-white font-montserrat rounded-xl text-sm font-semibold cursor-not-allowed",
  default: "text-sm",
};

export default buttonStyles;
