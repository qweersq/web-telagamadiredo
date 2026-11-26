import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock,
  FaTicketAlt,
  FaArrowRight,
  FaChevronDown,
  FaInstagram,
  FaTiktok,
  FaBars,
  FaTimes,
  FaSwimmer,
  FaUtensils,
  FaShip,
  FaTree,
  FaFish,
  FaParking,
  FaCamera,
  FaLeaf,
  FaStar,
  FaPhone,
  FaMountain,
  FaSun,
  FaCheckCircle,
  FaUsers,
  FaCalendarAlt,
} from 'react-icons/fa';

const WHATSAPP_NUMBER = '6285810009211';
const WHATSAPP_DISPLAY = '0858-1000-9211';
const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Agrowisata+Telaga+Madiredo+Pujon+Malang';
const INSTAGRAM_URL = 'https://www.instagram.com/telagamadiredo_/';
const TIKTOK_URL = 'https://www.tiktok.com/@telaga.madiredo';

const waLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const NAV_LINKS = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'pool-resto', label: 'Pool & Resto' },
  { id: 'wahana', label: 'Wahana' },
  { id: 'tiket', label: 'Tiket' },
  { id: 'lokasi', label: 'Lokasi' },
  { id: 'faq', label: 'FAQ' },
];

const HIGHLIGHTS = [
  {
    icon: FaSwimmer,
    title: 'Kolam Alami',
    desc: 'Air dingin langsung dari kaki Gunung Panderman, jernih dan menyegarkan.',
    tone: 'green',
  },
  {
    icon: FaUtensils,
    title: 'Resto & Kafe',
    desc: 'Ikan bakar, kopi, dan camilan khas desa dengan pemandangan telaga.',
    tone: 'orange',
  },
  {
    icon: FaMountain,
    title: 'Panorama Pegunungan',
    desc: 'Hamparan sawah Pujon dan siluet Gunung Panderman dari dek tepi telaga.',
    tone: 'green',
  },
  {
    icon: FaShip,
    title: 'Perahu Telaga',
    desc: 'Menyusuri telaga sambil memberi makan ikan, cocok untuk keluarga.',
    tone: 'orange',
  },
  {
    icon: FaTree,
    title: 'Taman & Playground',
    desc: 'Area hijau luas dan permainan anak yang aman di udara pegunungan.',
    tone: 'green',
  },
  {
    icon: FaCamera,
    title: 'Spot Foto',
    desc: 'Gapura bambu, dek tepi air, dan latar sawah untuk foto & prewedding.',
    tone: 'orange',
  },
  {
    icon: FaFish,
    title: 'Terapi Ikan',
    desc: 'Sensasi geli di kolam terapi ikan, favorit anak-anak dan dewasa.',
    tone: 'green',
  },
  {
    icon: FaParking,
    title: 'Parkir & Fasilitas',
    desc: 'Parkir motor dan mobil, mushola, toilet, serta ruang ganti bersih.',
    tone: 'orange',
  },
];

const TICKETS = [
  {
    name: 'Tiket Masuk Weekday',
    price: '10.000',
    unit: 'per orang',
    note: 'Berlaku Senin sampai Jumat. Sudah termasuk akses seluruh area telaga, taman, dan playground.',
    items: ['Senin – Jumat', 'Anak & dewasa tarif sama', 'Bayar tunai / QRIS di loket'],
    featured: false,
  },
  {
    name: 'Tiket Masuk Weekend',
    price: '15.000',
    unit: 'per orang',
    note: 'Berlaku Sabtu, Minggu, dan hari libur nasional. Harga dapat menyesuaikan saat event besar.',
    items: ['Sabtu – Minggu', 'Termasuk libur nasional', 'Bayar tunai / QRIS di loket'],
    featured: true,
    badge: 'Weekend',
  },
];

const FACILITIES = [
  'Kolam alami & pemandian',
  'Resto, kafe & ikan bakar',
  'Dek & gazebo tepi telaga',
  'Perahu keliling telaga',
  'Playground anak',
  'Spot foto & prewedding',
  'Area piknik keluarga',
  'Mushola',
  'Toilet & ruang ganti',
  'Parkir motor & mobil',
];

const FAQS = [
  {
    q: 'Di mana lokasi Agrowisata Telaga Madiredo?',
    a: 'Dusun Lebo, Desa Madiredo, Kecamatan Pujon, Kabupaten Malang, Jawa Timur 65391. Sekitar 1 sampai 1,5 jam dari pusat Kota Malang, dan aksesnya bebas macet.',
  },
  {
    q: 'Jam berapa Telaga Madiredo buka?',
    a: 'Senin sampai Jumat sekitar pukul 09.00–16.00 WIB, sedangkan Sabtu–Minggu lebih panjang yaitu 08.00–17.00 WIB. Jam operasional bisa berubah pada hari libur atau saat ada acara.',
  },
  {
    q: 'Berapa harga tiket masuknya?',
    a: 'Tiket masuk Rp10.000 per orang pada hari kerja dan Rp15.000 per orang pada Sabtu, Minggu, serta hari libur nasional. Tarif anak dan dewasa sama, dan tiket sudah termasuk akses area telaga, taman, serta playground.',
  },
  {
    q: 'Apakah bisa reservasi rombongan?',
    a: 'Bisa. Untuk rombongan sekolah, kantor, atau keluarga besar, cukup konfirmasi jumlah orang lewat WhatsApp agar loket dan area parkir disiapkan. Saat ini pembelian hanya untuk tiket masuk harian.',
  },
  {
    q: 'Apakah bisa berenang di telaga?',
    a: 'Pengunjung bisa menikmati kolam alami dan wahana air. Anak-anak wajib didampingi dan menggunakan pelampung yang tersedia di lokasi.',
  },
];

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const HeroScene = () => (
  <svg
    viewBox="0 0 600 440"
    className="h-full w-full"
    role="img"
    aria-label="Ilustrasi telaga dikelilingi pegunungan dan persawahan"
  >
    <defs>
      <linearGradient id="tm-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFBF5" />
        <stop offset="60%" stopColor="#FFF7ED" />
        <stop offset="100%" stopColor="#FED7AA" />
      </linearGradient>
      <linearGradient id="tm-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="45%" stopColor="#16A34A" />
        <stop offset="100%" stopColor="#14532D" />
      </linearGradient>
      <linearGradient id="tm-hill-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#BBF7D0" />
        <stop offset="100%" stopColor="#4ADE80" />
      </linearGradient>
      <linearGradient id="tm-hill-near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#15803D" />
        <stop offset="100%" stopColor="#14532D" />
      </linearGradient>
    </defs>

    <rect width="600" height="440" fill="url(#tm-sky)" />
    <circle cx="452" cy="118" r="72" fill="#FDBA74" opacity="0.3" />
    <circle cx="452" cy="118" r="44" fill="#FB923C" opacity="0.95" />

    <path
      d="M0 236 L118 122 L206 214 L300 146 L418 248 L520 176 L600 238 V310 H0 Z"
      fill="url(#tm-hill-far)"
      opacity="0.9"
    />
    <path
      d="M0 268 L92 206 L172 268 L268 200 L364 272 L472 220 L600 284 V330 H0 Z"
      fill="url(#tm-hill-near)"
    />

    {[
      { x: 66, y: 268, s: 1 },
      { x: 132, y: 276, s: 0.8 },
      { x: 486, y: 272, s: 0.9 },
      { x: 536, y: 282, s: 0.7 },
    ].map((tree, index) => (
      <g key={index} transform={`translate(${tree.x} ${tree.y}) scale(${tree.s})`}>
        <rect x="-2" y="14" width="4" height="16" fill="#14532D" opacity="0.7" />
        <path d="M0 -16 L12 16 H-12 Z" fill="#166534" />
        <path d="M0 -4 L15 26 H-15 Z" fill="#15803D" />
      </g>
    ))}

    <rect y="316" width="600" height="124" fill="url(#tm-water)" />
    <path
      d="M22 344c34 12 66 12 100 0s66-12 100 0 66 12 100 0 66-12 100 0 44 8 44 8"
      stroke="#DCFCE7"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />
    <path
      d="M0 382c40 14 78 14 118 0s78-14 118 0 78 14 118 0 78-14 118 0 78 14 128 0"
      stroke="#BBF7D0"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
    <path
      d="M0 414c46 14 92 14 138 0s92-14 138 0 92 14 138 0 92-14 138 0 92 14 138 0"
      stroke="#86EFAC"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.28"
    />

    {/* Perahu kecil di telaga */}
    <g transform="translate(250 352)">
      <path d="M0 0h86l-14 20H16Z" fill="#7C2D12" />
      <path d="M0 0h86l-6 8H7Z" fill="#9A3412" />
      <rect x="46" y="-22" width="4" height="22" fill="#7C2D12" />
      <path d="M50 -22l24 14-24 6Z" fill="#FED7AA" />
      <circle cx="26" cy="-8" r="6" fill="#FFFBF5" />
      <path d="M20 -2h12l-2 10H22Z" fill="#FFFBF5" />
    </g>
  </svg>
);

const SectionHeading = ({ eyebrow, title, description, align = 'center' }) => (
  <div
    className={`max-w-2xl ${
      align === 'center' ? 'mx-auto text-center' : 'text-left'
    }`}
  >
    <span className="inline-flex items-center gap-2 rounded-full bg-telaga-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-telaga-800">
      <FaLeaf className="text-[10px]" />
      {eyebrow}
    </span>
    <h2 className="mt-4 font-bebas text-3xl leading-tight tracking-wide text-telaga-950 sm:text-4xl md:text-5xl">
      {title}
    </h2>
    {description && (
      <p className="mt-3 font-montserrat text-sm leading-relaxed text-telaga-900/70 sm:text-base">
        {description}
      </p>
    )}
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToSection = (id) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <div className="min-h-screen bg-krem font-montserrat text-telaga-950">
      {/* NAVBAR */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-krem/95 shadow-[0_10px_30px_-24px_rgba(20,83,45,0.7)] backdrop-blur'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
          >
            <img
              src="/images/telagamadiredo-logo.svg"
              alt="Logo Agrowisata Telaga Madiredo"
              className="h-10 w-10"
            />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold text-telaga-950">
                Telaga Madiredo
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-senja-600">
                Spirit of Nature
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => goToSection(link.id)}
                className="rounded-full px-3 py-2 text-sm font-medium text-telaga-900/80 transition hover:bg-telaga-100 hover:text-telaga-900"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full border border-telaga-200 px-4 py-2 text-sm font-semibold text-telaga-800 transition hover:border-telaga-400 hover:bg-telaga-50"
            >
              Masuk Staf
            </button>
            <a
              href={waLink('Halo Telaga Madiredo, saya ingin bertanya soal kunjungan.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-senja-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-senja-500/30 transition hover:bg-senja-600"
            >
              <FaWhatsapp />
              Pesan Tiket
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-telaga-200 text-telaga-800 lg:hidden"
            aria-label="Buka menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-telaga-100 bg-krem px-4 pb-5 pt-3 lg:hidden">
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => goToSection(link.id)}
                  className="rounded-xl px-3 py-2 text-left text-sm font-medium text-telaga-900 transition hover:bg-telaga-100"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl border border-telaga-200 px-3 py-2 text-sm font-semibold text-telaga-800"
              >
                Masuk Staf
              </button>
              <a
                href={waLink('Halo Telaga Madiredo, saya ingin bertanya soal kunjungan.')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-senja-500 px-3 py-2 text-sm font-semibold text-white"
              >
                <FaWhatsapp />
                Pesan
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 520px at 78% -10%, rgba(249,115,22,0.16), transparent 60%), radial-gradient(900px 520px at 8% 8%, rgba(34,197,94,0.2), transparent 62%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-senja-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-senja-700">
              <FaMapMarkerAlt className="text-[10px]" />
              Pujon &middot; Kabupaten Malang
            </span>

            <h1 className="mt-5 font-bebas text-[42px] leading-[0.95] tracking-wide text-telaga-950 sm:text-6xl lg:text-7xl">
              Agrowisata
              <br />
              <span className="text-telaga-700">Telaga</span>{' '}
              <span className="text-senja-500">Madiredo</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-telaga-900/75 sm:text-base">
              Telaga alami, kolam air pegunungan, dan resto keluarga di ketinggian
              Pujon. Hanya sekitar satu jam dari Kota Malang &mdash; datang, makan,
              berenang, lalu pulang dengan pikiran yang lebih ringan.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={waLink(
                  'Halo Telaga Madiredo, saya ingin memesan tiket / bertanya jadwal kunjungan.'
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-telaga-700 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-telaga-700/25 transition hover:bg-telaga-800"
              >
                <FaTicketAlt />
                Pesan Tiket via WhatsApp
              </a>
              <button
                type="button"
                onClick={() => goToSection('wahana')}
                className="inline-flex items-center gap-2 rounded-full border border-telaga-200 bg-white px-6 py-3 text-sm font-semibold text-telaga-800 transition hover:border-telaga-400"
              >
                Lihat Wahana
                <FaArrowRight className="text-xs" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-telaga-900/70 sm:text-sm">
              {[
                { icon: FaClock, text: 'Buka 08.00 – 17.00 WIB' },
                { icon: FaTicketAlt, text: 'Tiket mulai Rp10.000' },
                { icon: FaStar, text: '4,6 di Google Maps' },
              ].map((item) => (
                <span key={item.text} className="inline-flex items-center gap-2">
                  <item.icon className="text-telaga-600" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-white/70 shadow-[0_40px_80px_-40px_rgba(20,83,45,0.55)]">
              <HeroScene />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-telaga-950/70 to-transparent px-5 pb-4 pt-10 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-telaga-100">
                  Air dari Gunung Panderman
                </p>
                <p className="text-sm font-medium">Sejuk, jernih, dan tenang.</p>
              </div>
            </div>

            <div className="absolute -left-3 top-6 rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-telaga-900/10 sm:-left-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-telaga-600">
                Tiket masuk
              </p>
              <p className="font-bebas text-2xl leading-none text-telaga-950">10K</p>
            </div>

            <div className="absolute -right-2 bottom-10 rounded-2xl bg-senja-500 px-4 py-3 text-white shadow-xl shadow-senja-600/30 sm:-right-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-senja-100">
                Pool &amp; Resto
              </p>
              <p className="text-sm font-semibold">Satu tempat</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INFO */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 rounded-3xl border border-telaga-100 bg-white p-4 shadow-[0_24px_60px_-48px_rgba(20,83,45,0.6)] sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
          {[
            {
              icon: FaClock,
              label: 'Jam Operasional',
              value: '09.00 – 16.00 WIB',
              sub: 'Weekend 08.00 – 17.00',
            },
            {
              icon: FaTicketAlt,
              label: 'Tiket Masuk',
              value: 'Rp10.000',
              sub: 'Weekend Rp15.000',
            },
            {
              icon: FaMapMarkerAlt,
              label: 'Lokasi',
              value: 'Desa Madiredo, Pujon',
              sub: '± 1 jam dari Kota Malang',
            },
            {
              icon: FaPhone,
              label: 'Reservasi',
              value: WHATSAPP_DISPLAY,
              sub: 'WhatsApp marketing',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-2xl p-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-telaga-50 text-telaga-700">
                <item.icon />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-telaga-600">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-telaga-950">{item.value}</p>
                <p className="text-xs text-telaga-900/60">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TENTANG */}
      <section id="tentang" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Tentang Telaga"
              title="Surga kecil di antara sawah Pujon"
              description="Telaga Madiredo dikelola warga melalui BUMDes Madani Desa Madiredo. Berawal dari sumber air alami, kawasan ini ditata menjadi agrowisata yang tetap menjaga suasana desa: hijau, tenang, dan apa adanya."
              align="left"
            />
            <p className="mt-4 text-sm leading-relaxed text-telaga-900/70 sm:text-base">
              Legenda setempat menyebut air telaga ini dipercaya membuat awet muda.
              Percaya atau tidak, yang pasti udara pegunungan dan suara airnya cukup
              untuk memulihkan tenaga setelah seminggu bekerja.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { icon: FaMountain, text: 'Berada di kaki Gunung Panderman' },
                { icon: FaLeaf, text: 'Dikelilingi sawah dan pepohonan' },
                { icon: FaUsers, text: 'Dikelola Pokdarwis & BUMDes desa' },
                { icon: FaSun, text: 'Cocok untuk keluarga dan rombongan' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-2xl border border-telaga-100 bg-white px-4 py-3"
                >
                  <item.icon className="text-senja-500" />
                  <span className="text-sm text-telaga-900/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { value: '1 jam', label: 'Dari Kota Malang', tone: 'green' },
              { value: '10K', label: 'Tiket masuk weekday', tone: 'orange' },
              { value: '08–17', label: 'Jam buka weekend', tone: 'orange' },
              { value: '09–16', label: 'Jam buka weekday', tone: 'green' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-3xl p-6 ${
                  stat.tone === 'green'
                    ? 'bg-telaga-700 text-white'
                    : 'bg-senja-100 text-senja-900'
                }`}
              >
                <p className="font-bebas text-4xl leading-none tracking-wide">
                  {stat.value}
                </p>
                <p
                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                    stat.tone === 'green' ? 'text-telaga-100' : 'text-senja-700'
                  }`}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POOL & RESTO */}
      <section
        id="pool-resto"
        className="scroll-mt-24 bg-gradient-to-b from-telaga-50 to-krem py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pool & Resto"
            title="Berenang dulu, makan kemudian"
            description="Dua alasan utama orang datang ke Telaga Madiredo: airnya dan makanannya. Keduanya tersedia dalam satu kawasan, jadi tidak perlu pindah tempat."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-telaga-100 bg-white shadow-[0_30px_60px_-50px_rgba(20,83,45,0.8)]">
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-telaga-500 via-telaga-700 to-telaga-950">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-telaga-950/60 to-transparent" />
                <FaSwimmer className="absolute bottom-6 left-6 text-5xl text-telaga-100" />
                <span className="absolute right-5 top-5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Kolam Alami
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-telaga-950">
                  Kolam &amp; wahana air
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-telaga-900/70">
                  Air dingin alami dari pegunungan, kolam untuk anak, serta perahu
                  yang bisa disewa untuk mengelilingi telaga sambil memberi makan
                  ikan.
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-telaga-900/80">
                  {[
                    'Kolam alami & area bermain air',
                    'Penyewaan perahu keliling telaga',
                    'Pelampung & ruang bilas',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <FaCheckCircle className="mt-0.5 shrink-0 text-telaga-500" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-senja-100 bg-white shadow-[0_30px_60px_-50px_rgba(124,45,18,0.8)]">
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-senja-300 via-senja-500 to-senja-700">
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-senja-900/50 to-transparent" />
                <FaUtensils className="absolute bottom-6 left-6 text-5xl text-senja-50" />
                <span className="absolute right-5 top-5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Resto &amp; Kafe
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-telaga-950">
                  Makan di tepi telaga
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-telaga-900/70">
                  Ikan bakar, nasi jagung, kopi, dan camilan khas desa. Duduk di gazebo
                  menghadap air sambil menikmati angin Pujon.
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-telaga-900/80">
                  {[
                    'Ikan bakar & menu rumahan',
                    'Kafe, kopi, dan camilan',
                    'Gazebo & tempat bakar ikan',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <FaCheckCircle className="mt-0.5 shrink-0 text-senja-500" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WAHANA */}
      <section id="wahana" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Wahana & Fasilitas"
          title="Dari main air sampai kulineran"
          description="Semua ada dalam satu kawasan, tinggal pilih mau santai atau main air."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-telaga-100 bg-white p-6 transition hover:-translate-y-1 hover:border-telaga-300 hover:shadow-xl hover:shadow-telaga-900/5"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${
                  item.tone === 'green'
                    ? 'bg-telaga-50 text-telaga-700'
                    : 'bg-senja-50 text-senja-600'
                }`}
              >
                <item.icon />
              </span>
              <h3 className="mt-4 text-base font-bold text-telaga-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-telaga-900/65">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TIKET */}
      <section id="tiket" className="scroll-mt-24 bg-telaga-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-telaga-100">
              <FaTicketAlt className="text-[10px]" />
              Harga Tiket Masuk
            </span>
            <h2 className="mt-4 font-bebas text-3xl tracking-wide sm:text-4xl md:text-5xl">
              Cukup bayar tiket masuk
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-telaga-100/75 sm:text-base">
              Saat ini hanya tiket masuk harian yang diberlakukan. Parkir dan
              wahana air dibayar terpisah langsung di lokasi.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {TICKETS.map((ticket) => (
              <div
                key={ticket.name}
                className={`relative flex flex-col rounded-3xl p-6 ${
                  ticket.featured
                    ? 'bg-senja-500 text-white shadow-2xl shadow-senja-900/40'
                    : 'bg-white/5 text-white ring-1 ring-white/10'
                }`}
              >
                {ticket.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    {ticket.badge}
                  </span>
                )}
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-telaga-100/90">
                  {ticket.name}
                </h3>
                <p className="mt-3 font-bebas text-4xl leading-none tracking-wide">
                  <span className="align-top text-lg">Rp</span>
                  {ticket.price}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    ticket.featured ? 'text-white/80' : 'text-telaga-100/60'
                  }`}
                >
                  {ticket.unit}
                </p>
                <p
                  className={`mt-3 text-xs leading-relaxed ${
                    ticket.featured ? 'text-white/85' : 'text-telaga-100/65'
                  }`}
                >
                  {ticket.note}
                </p>
                <ul className="mt-4 grid gap-2 text-xs">
                  {ticket.items.map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <FaCheckCircle
                        className={`mt-0.5 shrink-0 ${
                          ticket.featured ? 'text-white' : 'text-telaga-400'
                        }`}
                      />
                      <span
                        className={
                          ticket.featured ? 'text-white/90' : 'text-telaga-100/80'
                        }
                      >
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(
                    `Halo Telaga Madiredo, saya ingin bertanya tentang ${ticket.name}.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                    ticket.featured
                      ? 'bg-white text-senja-700 hover:bg-senja-50'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <FaWhatsapp />
                  Tanya Tiket
                </a>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-telaga-100/55">
            <FaLeaf className="mt-0.5 shrink-0" />
            Harga tiket masuk dapat berubah pada hari libur atau saat ada acara.
            Konfirmasi tarif terbaru lewat WhatsApp sebelum berkunjung.
          </p>
        </div>
      </section>

      {/* FASILITAS LIST */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-telaga-100 bg-white p-6 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md">
              <h2 className="font-bebas text-3xl tracking-wide text-telaga-950">
                Fasilitas di lokasi
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-telaga-900/65">
                Semua yang kamu butuhkan untuk setengah hari libur sudah tersedia.
                Cukup bawa baju ganti dan kamera.
              </p>
            </div>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-full bg-telaga-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-telaga-800"
            >
              <FaMapMarkerAlt />
              Buka di Maps
            </a>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FACILITIES.map((facility) => (
              <div
                key={facility}
                className="flex items-center gap-3 rounded-xl bg-telaga-50/60 px-4 py-3 text-sm text-telaga-900/80"
              >
                <FaCheckCircle className="shrink-0 text-telaga-500" />
                {facility}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOKASI */}
      <section
        id="lokasi"
        className="scroll-mt-24 bg-gradient-to-b from-krem to-senja-50 py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Lokasi & Jam Buka"
              title="Mudah dijangkau, jauh dari macet"
              description="Berada di jalur wisata Pujon, dekat dengan Batu dan Kota Malang. Jalan sudah beraspal sampai area parkir."
              align="left"
            />

            <div className="mt-8 grid gap-3">
              <div className="flex items-start gap-4 rounded-2xl border border-telaga-100 bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-telaga-50 text-telaga-700">
                  <FaMapMarkerAlt />
                </span>
                <div>
                  <p className="text-sm font-semibold text-telaga-950">Alamat</p>
                  <p className="mt-1 text-sm leading-relaxed text-telaga-900/70">
                    Dusun Lebo, Desa Madiredo, Kecamatan Pujon,
                    <br />
                    Kabupaten Malang, Jawa Timur 65391
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-telaga-100 bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-senja-50 text-senja-600">
                  <FaClock />
                </span>
                <div>
                  <p className="text-sm font-semibold text-telaga-950">
                    Jam operasional
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-telaga-900/70">
                    Senin – Jumat: 09.00 – 16.00 WIB
                    <br />
                    Sabtu – Minggu: 08.00 – 17.00 WIB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-telaga-100 bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-telaga-50 text-telaga-700">
                  <FaCalendarAlt />
                </span>
                <div>
                  <p className="text-sm font-semibold text-telaga-950">
                    Reservasi &amp; rombongan
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-telaga-900/70">
                    WhatsApp {WHATSAPP_DISPLAY}
                    <br />
                    Disarankan konfirmasi dulu untuk rombongan besar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-telaga-100 bg-white p-6 shadow-[0_30px_70px_-55px_rgba(20,83,45,0.9)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.14),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(249,115,22,0.14),transparent_55%)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-telaga-600">
                Rute singkat
              </p>
              <ol className="mt-4 grid gap-4">
                {[
                  'Dari Kota Malang arah Batu / Pujon, sekitar 31 km atau 1 jam berkendara.',
                  'Masuk ke Desa Madiredo, ikuti papan penunjuk Agrowisata Telaga Madiredo.',
                  'Parkir di area loket utama, tiket dibeli di loket sebelum masuk kawasan.',
                  'Untuk rombongan bus, konfirmasi dulu agar area parkir disiapkan.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-telaga-700 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-telaga-900/75">{step}</p>
                  </li>
                ))}
              </ol>

              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-telaga-200 px-5 py-2.5 text-sm font-semibold text-telaga-800 transition hover:border-telaga-400"
              >
                <FaMapMarkerAlt />
                Lihat rute di Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Pertanyaan yang sering ditanya"
          description="Belum ketemu jawabannya? Chat kami lewat WhatsApp."
        />

        <div className="mt-10 grid gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-telaga-100 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-telaga-950">
                    {faq.q}
                  </span>
                  <FaChevronDown
                    className={`shrink-0 text-xs text-telaga-600 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="border-t border-telaga-50 px-5 py-4 text-sm leading-relaxed text-telaga-900/70">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-telaga-700 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-telaga-500/30" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-senja-500/30" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-telaga-100">
              Rencanakan kunjunganmu
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-bebas text-3xl leading-tight tracking-wide sm:text-4xl md:text-5xl">
              Akhir pekan lebih tenang dimulai dari sini
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-telaga-50/80">
              Tanya jam buka, harga tiket masuk, atau konfirmasi kedatangan
              rombongan. Tim kami balas lewat WhatsApp pada jam operasional.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(
                  'Halo Telaga Madiredo, saya ingin merencanakan kunjungan. Bisa dibantu?'
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-senja-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-senja-900/30 transition hover:bg-senja-600"
              >
                <FaWhatsapp />
                Chat WhatsApp
              </a>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FaMapMarkerAlt />
                Petunjuk arah
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-telaga-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/images/telagamadiredo-logo.svg"
                alt="Logo Telaga Madiredo"
                className="h-11 w-11"
              />
              <div>
                <p className="text-base font-bold text-telaga-950">
                  Agrowisata Telaga Madiredo
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-senja-600">
                  Spirit of Nature
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-telaga-900/65">
              Kawasan wisata alam dan kuliner keluarga di Desa Madiredo, Pujon,
              Kabupaten Malang. Dikelola bersama warga desa.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram Telaga Madiredo"
                className="grid h-10 w-10 place-items-center rounded-full bg-telaga-50 text-telaga-700 transition hover:bg-telaga-100"
              >
                <FaInstagram />
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok Telaga Madiredo"
                className="grid h-10 w-10 place-items-center rounded-full bg-telaga-50 text-telaga-700 transition hover:bg-telaga-100"
              >
                <FaTiktok />
              </a>
              <a
                href={waLink('Halo Telaga Madiredo.')}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp Telaga Madiredo"
                className="grid h-10 w-10 place-items-center rounded-full bg-senja-50 text-senja-600 transition hover:bg-senja-100"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-telaga-600">
              Jelajahi
            </p>
            <div className="mt-4 grid gap-2 text-sm text-telaga-900/70">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => goToSection(link.id)}
                  className="w-fit text-left transition hover:text-telaga-900"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-telaga-600">
              Kontak
            </p>
            <div className="mt-4 grid gap-3 text-sm text-telaga-900/70">
              <p className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-telaga-500" />
                Dusun Lebo, Desa Madiredo, Kec. Pujon, Kab. Malang 65391
              </p>
              <p className="flex items-center gap-2">
                <FaPhone className="shrink-0 text-telaga-500" />
                {WHATSAPP_DISPLAY}
              </p>
              <p className="flex items-center gap-2">
                <FaClock className="shrink-0 text-telaga-500" />
                08.00 – 17.00 WIB
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-telaga-200 px-4 py-2 text-xs font-semibold text-telaga-800 transition hover:border-telaga-400"
            >
              Masuk Staf / Kasir
              <FaArrowRight className="text-[10px]" />
            </button>
          </div>
        </div>

        <div className="border-t border-telaga-50 px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-telaga-900/50 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} Agrowisata Telaga Madiredo. Dikelola
              BUMDes Madani Desa Madiredo.
            </p>
            <p className="flex items-center gap-1.5">
              <FaLeaf className="text-telaga-500" />
              Jaga kebersihan, nikmati alamnya.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
