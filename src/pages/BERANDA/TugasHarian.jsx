import { useCallback, useEffect, useState } from "react";
import Header from "../../components/Com Header/Header";
import DailyTaskPanel from "../../components/DailyTasks/DailyTaskPanel";
import { branchService } from "../../services/branchService";

/**
 * Halaman Tugas Harian (dibuka dari menu di Beranda Supervisor).
 *
 * Dipisah dari beranda supaya beranda tetap ringkas: beranda hanya menampilkan
 * menu, sedangkan semua CRUD tugas (buat dari template, tandai selesai, hapus,
 * atur posisi, tugaskan manual) dilakukan di sini.
 *
 * Shell halaman sengaja sama dengan beranda lain (Header fixed + mt-[50px])
 * agar perpindahan dari beranda terasa tanpa jeda.
 */
const TugasHarian = () => {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      // Endpoint: GET /tenants/:tenant_id/branches (tenant selalu dari token)
      const response = await branchService.getBranches();
      setBranches(response?.success && Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("❌ TugasHarian - Gagal memuat daftar cabang:", error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <Header showBackButton title="Tugas Harian" />

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
            {loadingBranches && branches.length === 0 ? (
              <div className="animate-pulse space-y-3">
                <div className="h-40 rounded-2xl bg-telaga-100/60" />
              </div>
            ) : (
              <DailyTaskPanel branches={branches} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TugasHarian;
