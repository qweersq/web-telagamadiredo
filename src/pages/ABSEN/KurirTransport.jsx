import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../config/api";
import FuelCalculationModal from "../../components/FuelCalculationModal";
import AnimatedButton from "../../components/Design/AnimatedButton";
import { getUserProfile } from "../../utils/userProfileHelper";
import { resizeImageFile } from "../ORDER/components/OrderDetail/ImageResizeUtil";
// import imageCompression from "browser-image-compression";

const KurirTransport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    odoStart: "",
    odoEnd: "",
    quantity: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [photos, setPhotos] = useState({
    odoStart: null,
    odoEnd: null
  });
  const [previews, setPreviews] = useState({
    odoStart: null,
    odoEnd: null
  });
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [showInitialModal, setShowInitialModal] = useState(true);

  useEffect(() => {
    setShowInitialModal(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setError("");
    }
  };

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 2) {
      setError("Harap upload 2 foto sekaligus (ODO Mulai dan ODO Selesai)");
      return;
    }
    setError("");
    setLoading(true);

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        
        // Resize foto sebelum processing
        const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
        const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [index === 0 ? 'odoStart' : 'odoEnd']: reader.result
          }));
        };
        reader.readAsDataURL(resizedFile);

        setPhotos(prev => ({
          ...prev,
          [index === 0 ? 'odoStart' : 'odoEnd']: resizedFile
        }));
      }
    } catch (err) {
      setError("Gagal resize foto. Silakan coba lagi.");
      console.error("Resize error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // Validasi input
    if (!formData.odoStart.trim() || !formData.odoEnd.trim() || !formData.quantity.trim()) {
      setError("Semua field harus diisi");
      return;
    }

    if (!photos.odoStart || !photos.odoEnd) {
      setError("Harap upload foto ODO Mulai dan ODO Selesai");
      return;
    }

    const odoStartNum = parseInt(formData.odoStart);
    const odoEndNum = parseInt(formData.odoEnd);

    if (isNaN(odoStartNum) || isNaN(odoEndNum)) {
      setError("ODO Mulai dan ODO Selesai harus berupa angka");
      return;
    }

    if (odoStartNum >= odoEndNum) {
      setError("ODO Selesai harus lebih besar dari ODO Mulai");
      return;
    }

    // Jika semua validasi berhasil
    setError("");
    setShowModal(true);
  };

  // Fungsi untuk cek status absen dan handle logout
  const handleNoTransport = async () => {
    try {
      // Ambil user data dari API
      const profile = await getUserProfile();
      if (!profile) {
              // Jika tidak ada profile, langsung logout
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("workStartTime");
      sessionStorage.removeItem("fromPresent");
      sessionStorage.removeItem("fromIzin");
      window.location.href = "/";
        return;
      }

      const user = JSON.parse(userData);
      const employeeId = user.id;

      // Biarkan user akses halaman tanpa cek absensi
      setShowInitialModal(false);
      navigate("/end-work");
    } catch (error) {
      console.error("Error checking absent status:", error);
      // Jika error, langsung logout
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("workStartTime");
      sessionStorage.removeItem("fromPresent");
      sessionStorage.removeItem("fromIzin");
      window.location.href = "/";
    }
  };

  const handleConfirm = async (fuelCost) => {
    try {
      setLoading(true);

      // 1. Upload photos to /deliveries (field: photos, multiple)
      const uploadForm = new FormData();
      uploadForm.append('photos', photos.odoStart);
      uploadForm.append('photos', photos.odoEnd);
      
      let uploadRes;
      try {
        uploadRes = await instance.post('/uploads-odo', uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        
        // Handle specific upload errors
        if (uploadError.response?.data?.error?.message === "File too large") {
          throw new Error("File foto terlalu besar. Silakan gunakan foto dengan ukuran lebih kecil.");
        } else if (uploadError.response?.data?.message) {
          throw new Error(uploadError.response.data.message);
        } else {
          throw new Error("Gagal upload foto. Silakan coba lagi.");
        }
      }
      
      const uploadedUrls = uploadRes.data?.data || [];
      if (!uploadedUrls[0] || !uploadedUrls[1]) {
        throw new Error('Gagal upload foto, URL tidak ditemukan');
      }

      // 2. Compose payload for /deliveries-odo
      const profile = await getUserProfile();
      const user = profile ? {
        id: profile.user?.id,
        name: profile.user?.name,
        branch_id: profile.branch?.id,
        tenant_id: profile.tenant?.id
      } : {};
      const odoStartNum = parseInt(formData.odoStart);
      const odoEndNum = parseInt(formData.odoEnd);
      const quantityNum = parseInt(formData.quantity);
      const totalDistance = odoEndNum - odoStartNum;
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        users_id: user.id,
        quantity: quantityNum,
        date: today,
        odoStart: odoStartNum,
        odoEnd: odoEndNum,
        totalDistance: totalDistance,
        totalCost: fuelCost,
        odoStartPhoto: uploadedUrls[0].url_photo,
        odoEndPhoto: uploadedUrls[1].url_photo,
      };

      const response = await instance.post('/deliveries-odo', payload);
      if (response.data.success && response.data.statusCode === 200) {
        navigate("/end-work");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      
      // Handle specific API error messages
      let errorMessage = "Terjadi kesalahan saat menyimpan data";
      
      if (error.response?.data?.error?.message === "File too large") {
        errorMessage = "File foto terlalu besar. Silakan gunakan foto dengan ukuran lebih kecil.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleEditPhoto = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        try {
          // Resize foto sebelum processing
          const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
          const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews(prev => ({
              ...prev,
              [type]: reader.result
            }));
            setPhotos(prev => ({
              ...prev,
              [type]: resizedFile
            }));
          };
          reader.readAsDataURL(resizedFile);
        } catch (err) {
          setError("Gagal resize foto. Silakan coba lagi.");
          console.error("Resize error:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  return (
    <div className="h-screen overflow-y-auto bg-white p-4 pb-2 h-auto pb-20 flex flex-col items-center">
      {/* Initial Modal */}
      {showInitialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center w-[90%] max-w-xs shadow-lg animate-fadeInUp">
            <h2 className="font-montserrat text-xl text-gray-800 mt-2 mb-4 text-center">Konfirmasi Antar Jemput</h2>
            <p className="font-montserrat text-gray-700 text-center mb-6 text-sm">
              Apakah hari ini ada antar jemput sepatu?
            </p>
            <div className="flex gap-4 w-full">
              <AnimatedButton
                variant="grey"
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
                onClick={handleNoTransport}
              >
                Tidak Ada
              </AnimatedButton>
              <AnimatedButton
                variant="blue"
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
                onClick={() => setShowInitialModal(false)}
              >
                Ada
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto h-max pb-20" style={{ filter: showInitialModal ? 'blur(2px)' : 'none', pointerEvents: showInitialModal ? 'none' : 'auto' }}>

        <h1 className="text-3xl font-montserrat text-center mb-2 mt-10">
          Pendataan Biaya Transportasi
        </h1>

        <p className="font-montserrat text-center text-gray-600 mb-4 max-w-xs mx-auto text-sm">
          Data pada ODO Meter harus sesuai dengan bukti yang akan diupload setelahnya!
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4 max-w-xs font-montserrat text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 p-4 max-w-xs mx-auto overflow-y-auto h-auto pb-14">
          <div>
            <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold">
              ODO Mulai
            </label>
            <input
              type="text"
              name="odoStart"
              value={formData.odoStart}
              onChange={handleInputChange}
              className="h-10 w-full p-3 rounded-xl font-montserrat outline outline-1 outline-gray-200 placeholder:text-sm"
              placeholder="Masukkan jarak mulai"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold mt-6">
              ODO Selesai
            </label>
            <input
              type="text"
              name="odoEnd"
              value={formData.odoEnd}
              onChange={handleInputChange}
              className="h-10 w-full p-3 rounded-xl outline outline-1 outline-gray-200 placeholder:text-sm font-montserrat"
              placeholder="Masukkan jarak selesai"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold mt-6">
              Jumlah Antar Jemput (Quantity)
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="h-10 w-full p-3 rounded-xl font-montserrat outline outline-1 outline-gray-200 placeholder:text-sm"
              placeholder="Masukkan jumlah pengantaran"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-montserrat text-sm text-gray-600 mb-2 font-semibold mt-6">
              Foto ODO Mulai & Selesai
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="odoPhotos"
              multiple
              required
            />
            <label
              htmlFor="odoPhotos"
              className="block w-full border-2 border-dashed border-[#5096FC] rounded-xl cursor-pointer hover:border-blue-400 transition-colors p-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Preview ODO Start */}
                <div className="relative h-[100px]">
                  {previews.odoStart ? (
                    <>
                      <img
                        src={previews.odoStart}
                        alt="ODO Start Preview"
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedPreview(previews.odoStart)}
                      />
                      <button
                        variant-="blue"
                        onClick={() => handleEditPhoto('odoStart')}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full rounded-lg outline outline-1 outline-gray-200 p-2 font-montserrat">
                      <span className="text-gray-500 text-sm text-center">
                        Foto ODO Mulai
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview ODO End */}
                <div className="relative h-[100px]">
                  {previews.odoEnd ? (
                    <>
                      <img
                        src={previews.odoEnd}
                        alt="ODO End Preview"
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedPreview(previews.odoEnd)}
                      />
                      <button
                        onClick={() => handleEditPhoto('odoEnd')}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full rounded-lg outline outline-1 outline-gray-200 p-2 font-montserrat">
                      <span className="text-gray-500 text-sm text-center">
                        Foto ODO Selesai
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4 font-montserrat">
                Silahkan upload 2 foto sekaligus
                (ODO Mulai & Selesai)
              </p>
            </label>
          </div>

          <AnimatedButton
            onClick={handleSubmit}
            variant="blue"
            disabled={loading || !photos.odoStart || !photos.odoEnd}
            className={`h-10 w-full py-3 mt-6 font-montserrat text-center text-sm flex items-center justify-center ${(loading || !photos.odoStart || !photos.odoEnd) ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-90"
              }`}
          >
            {loading ? "Menyimpan..." : "Selanjutnya"}
          </AnimatedButton>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
          <div className="max-w-3xl max-h-[80vh] bg-white rounded-3xl overflow-hidden outline outline-2 outline-white">
            <img
              src={selectedPreview}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="p-4 bg-white flex justify-center">
              <AnimatedButton
                variant="blue"
                onClick={() => setSelectedPreview(null)}
                className="px-6 py-2"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      <FuelCalculationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        data={formData}
      />
    </div>
  );
};

export default KurirTransport;
