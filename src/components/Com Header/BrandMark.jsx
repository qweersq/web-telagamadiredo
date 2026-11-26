/**
 * Logo + wordmark Telaga Madiredo untuk header beranda.
 * Dipakai `Header.jsx` dan `HeaderBerandaOwner.jsx` supaya branding konsisten.
 */
const BrandMark = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
      <img
        src="/images/telagamadiredo-logo.svg"
        alt="Agrowisata Telaga Madiredo"
        className={compact ? "h-8 w-8" : "h-9 w-9"}
      />
      <div className="hidden sm:block leading-tight min-w-0">
        <div className="text-[9px] font-montserrat font-light uppercase tracking-[0.18em] text-telaga-700/60">
          Agrowisata
        </div>
        <div className="text-sm font-semibold font-montserrat text-telaga-950 truncate">
          Telaga Madiredo
        </div>
      </div>
    </div>
  );
};

export default BrandMark;
