import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Users, MessageSquare, Calendar, Zap } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const tutorialSteps = [
    // Step 0: Intro
    {
      title: "🎉 Selamat Datang di Follow-Up Otomatis!",
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 font-montserrat">
            Apa itu Follow-Up Otomatis?
          </h3>
          <p className="text-gray-600 font-montserrat mb-4">
            Follow-up otomatis adalah <strong>robot pintar</strong> yang akan mengingatkan customer lama untuk datang lagi ke toko Anda.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 font-montserrat">
              <strong>Bayangkan:</strong> Ada asisten yang bekerja 24/7, mengingat semua customer, dan otomatis kirim pesan WA ke mereka di waktu yang tepat. Tanpa Anda perlu repot!
            </p>
          </div>
        </div>
      )
    },

    // Step 1: Sequence Concept
    {
      title: "📋 Apa itu Sequence?",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
              Sequence = Rangkaian Pesan Berurutan
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Hari ke-7</p>
                <p className="text-sm text-gray-600 font-montserrat">"Halo! Sudah seminggu nih, kapan cuci sepatu lagi?"</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Hari ke-14</p>
                <p className="text-sm text-gray-600 font-montserrat">"Ada promo spesial buat customer setia seperti kamu!"</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Hari ke-30</p>
                <p className="text-sm text-gray-600 font-montserrat">"Last chance! Diskon 20% berakhir besok!"</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-montserrat">
              <strong>Analogi Sederhana:</strong> Seperti alarm yang berbeda-beda. Alarm 1 bunyi hari ke-7, alarm 2 bunyi hari ke-14, dst. Tapi yang bunyi bukan alarm, melainkan pesan WA otomatis!
            </p>
          </div>
        </div>
      )
    },

    // Step 2: How it works
    {
      title: "⚙️ Bagaimana Cara Kerjanya?",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
              System Bekerja Otomatis 24/7
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Customer Order Terakhir</p>
                <p className="text-sm text-gray-600 font-montserrat">Misalnya: Budi cuci sepatu tanggal 1 Januari</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">System Mulai Hitung</p>
                <p className="text-sm text-gray-600 font-montserrat">Robot: "OK, Budi akan dapat pesan pertama tanggal 8 Januari"</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Pesan Otomatis Terkirim</p>
                <p className="text-sm text-gray-600 font-montserrat">Tanggal 8 Januari jam 9 pagi: "Halo Budi! Sudah seminggu nih..."</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">4</div>
              <div>
                <p className="font-medium text-gray-800 font-montserrat">Berlanjut Otomatis</p>
                <p className="text-sm text-gray-600 font-montserrat">Robot lanjut hitung: "Pesan ke-2 akan dikirim tanggal 15 Januari"</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-4">
            <p className="text-sm text-green-800 font-montserrat">
              <strong>🤖 Yang Keren:</strong> Kalau Budi order lagi di tengah jalan, robot langsung reset hitungan dari awal. Jadi Budi nggak spam pesan!
            </p>
          </div>
        </div>
      )
    },

    // Step 3: Benefits
    {
      title: "💰 Keuntungan untuk Bisnis Anda",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
              Manfaat Nyata yang Akan Anda Rasakan
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">💰</div>
                <h4 className="font-semibold text-blue-800 font-montserrat">Omset Naik 30-50%</h4>
              </div>
              <p className="text-sm text-blue-700 font-montserrat">
                Customer lama yang sudah lupa, jadi ingat lagi dan balik ke toko Anda
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">⏰</div>
                <h4 className="font-semibold text-green-800 font-montserrat">Hemat Waktu 90%</h4>
              </div>
              <p className="text-sm text-green-700 font-montserrat">
                Nggak perlu manual WA satu-satu. Robot yang kerja, Anda fokus ke hal lain
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center">🎯</div>
                <h4 className="font-semibold text-purple-800 font-montserrat">Tepat Sasaran</h4>
              </div>
              <p className="text-sm text-purple-700 font-montserrat">
                Pesan dikirim di waktu yang tepat, saat customer mulai butuh cuci sepatu lagi
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">📈</div>
                <h4 className="font-semibold text-orange-800 font-montserrat">Bisnis Lebih Profesional</h4>
              </div>
              <p className="text-sm text-orange-700 font-montserrat">
                Customer merasa diperhatikan dan dilayani dengan baik
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Step 4: Case Study
    {
      title: "📖 Studi Kasus: Toko Pak Joko",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-semibold">👨‍💼</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
              Kisah Sukses Nyata
            </h3>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-semibold text-red-800 font-montserrat mb-2">😰 Sebelum Pakai Follow-Up:</h4>
              <ul className="text-sm text-red-700 font-montserrat space-y-1">
                <li>• Customer lama sering lupa dan nggak balik</li>
                <li>• Pak Joko sibuk, lupa WA customer satu-satu</li>
                <li>• Omset stagnan, customer baru susah dapat</li>
                <li>• Pesaing dapet customer lama Pak Joko</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 font-montserrat mb-2">😊 Setelah Pakai Follow-Up:</h4>
              <ul className="text-sm text-green-700 font-montserrat space-y-1">
                <li>• Customer lama otomatis balik 60% lebih banyak</li>
                <li>• Pak Joko fokus layani customer di toko</li>
                <li>• Omset naik 40% dalam 3 bulan pertama</li>
                <li>• Customer bilang: "Wah, Pak Joko perhatian banget!"</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 font-montserrat mb-2">📊 Angka Konkret (3 bulan):</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-blue-700">150</p>
                  <p className="text-blue-600 font-montserrat">Customer di-follow-up</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-green-700">90</p>
                  <p className="text-green-600 font-montserrat">Customer balik order</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-purple-700">600</p>
                  <p className="text-purple-600 font-montserrat">Pesan otomatis</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-bold text-orange-700">40%</p>
                  <p className="text-orange-600 font-montserrat">Kenaikan omset</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
              <p className="text-sm text-yellow-800 font-montserrat">
                <strong>"Sekarang toko saya jalan otomatis. Customer lama pada balik, yang baru juga banyak. Follow-up ini game changer banget!"</strong> - Pak Joko
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Step 5: How to Start
    {
      title: "🚀 Cara Memulai (Super Mudah!)",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
              3 Langkah Mudah untuk Memulai
            </h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="font-semibold text-gray-800 font-montserrat">Klik "Buat Sequence"</h4>
                <p className="text-sm text-gray-600 font-montserrat">Kasih nama, misal: "Follow-up Customer Lama"</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="font-semibold text-gray-800 font-montserrat">Tulis 3 Pesan Template</h4>
                <p className="text-sm text-gray-600 font-montserrat">Kita sudah siapin template, tinggal edit dikit sesuai gaya Anda</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">3</div>
              <div>
                <h4 className="font-semibold text-gray-800 font-montserrat">Aktifkan & Selesai!</h4>
                <p className="text-sm text-gray-600 font-montserrat">Robot langsung bekerja otomatis. Anda tinggal duduk manis menunggu customer balik!</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="text-center">
              <p className="text-sm text-gray-700 font-montserrat mb-3">
                <strong>⏱️ Total waktu setup: Cuma 5 menit!</strong>
              </p>
              <p className="text-xs text-gray-600 font-montserrat">
                Setelah itu, robot bekerja 24/7 selama bertahun-tahun tanpa perlu maintenance
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Step 6: Ready to Start
    {
      title: "🎯 Siap Mulai Tingkatkan Bisnis?",
      content: (
        <div>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 font-montserrat">
              Saatnya Action!
            </h3>
            <p className="text-gray-600 font-montserrat mb-4">
              Sudah siap merasakan customer lama yang balik dan omset yang naik otomatis?
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 font-montserrat mb-2">✅ Yang Akan Anda Dapatkan:</h4>
              <ul className="text-sm text-green-700 font-montserrat space-y-1">
                <li>• Customer lama otomatis balik tanpa effort</li>
                <li>• Omset naik 30-50% dalam 3 bulan</li>
                <li>• Hemat waktu 90% untuk marketing</li>
                <li>• Bisnis jalan otomatis 24/7</li>
                <li>• Pelayanan customer lebih profesional</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
              <p className="text-sm text-blue-800 font-montserrat">
                <strong>🎁 Bonus:</strong> Template pesan sudah ready, tinggal pakai!
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200 text-center">
            <p className="text-sm text-orange-800 font-montserrat">
              <strong>⚡ Pro Tip:</strong> Mulai dengan 1 sequence sederhana dulu. Kalau sudah terasa manfaatnya, baru bikin yang lebih kompleks!
            </p>
          </div>
        </div>
      )
    }
  ];

  // Scroll to top whenever step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTo({
            top: 0,
            behavior: 'auto'
          });
        }
      }, 100);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const closeTutorial = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{currentStep + 1}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
              Panduan Follow-Up Otomatis
            </h2>
          </div>
          <button
            onClick={closeTutorial}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 font-montserrat">
              Step {currentStep + 1} dari {tutorialSteps.length}
            </span>
            <span className="text-xs text-gray-500 font-montserrat">
              {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% selesai
            </span>
          </div>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
        >
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 font-montserrat">
            {tutorialSteps[currentStep].title}
          </h3>
          <div className="text-gray-600 text-sm sm:text-base">
            {tutorialSteps[currentStep].content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 border-t border-gray-200">
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 py-3 px-6">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-4 pb-4">
            <AnimatedButton
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat text-sm"
              variant="gray"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </AnimatedButton>

            {/* Step Counter - Center */}
            <div className="text-center">
              <span className="text-xs text-gray-500 font-montserrat">
                {currentStep + 1}/{tutorialSteps.length}
              </span>
            </div>

            {currentStep === tutorialSteps.length - 1 ? (
              <AnimatedButton
                onClick={closeTutorial}
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-montserrat font-medium text-sm"
                variant="blue"
              >
                <span className="hidden sm:inline">Mulai Sekarang!</span>
                <span className="sm:hidden">Mulai</span>
                <span className="text-sm">🚀</span>
              </AnimatedButton>
            ) : (
              <AnimatedButton
                onClick={nextStep}
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium text-sm"
                variant="blue"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
