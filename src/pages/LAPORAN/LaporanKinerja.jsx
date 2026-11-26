import React, { useState, useEffect } from 'react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import EmployeePerformancePanel from '../../components/EmployeePerformance/EmployeePerformancePanel';

/**
 * Halaman "Laporan Kinerja" milik owner.
 *
 * Isi tabel (kolom, modal detail, cara hitung) sekarang ada di
 * `components/EmployeePerformance/EmployeePerformancePanel.jsx` supaya bisa
 * dipakai ulang di tab "Kinerja Karyawan" pada detail cabang beranda Supervisor.
 *
 * Halaman ini tetap menampilkan SATU TANGGAL (start_date = end_date = tanggal
 * yang dipilih), jadi tampilannya sama seperti sebelumnya.
 */
const LaporanKinerja = () => {
  const today = new Date().toISOString().split('T')[0];

  // Filter state
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        if (profile?.branch?.id) {
          setSelectedBranch(String(profile.branch.id));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadInitial();
  }, []);

  // Load branches when profile ready
  useEffect(() => {
    if (!userProfile?.tenant?.id) return;

    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const res = await instance.get(`/branches?tenant_id=${userProfile.tenant.id}`);
        if (res.data.success) {
          setBranches(res.data.data.map(b => ({ id: b.id, name: b.name })));
        }
      } catch (err) {
        console.error('Error loading branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [userProfile]);

  const selectedBranchName =
    branches.find(b => String(b.id) === String(selectedBranch))?.name || '';

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Laporan Kinerja"
        description="Laporan kinerja harian karyawan"
        hideLogout={true}
        hideUserMenu={true}
        showBackButton={true}
        backPath="/berandaowner"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
          <div className="max-w-[1200px] mx-auto">

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                {/* Date Filter */}
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Pilih Tanggal
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm bg-gray-50"
                  />
                </div>

                {/* Branch Filter */}
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Pilih Cabang
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm bg-gray-50 min-w-[200px]"
                    disabled={loadingBranches}
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Report */}
            {userProfile ? (
              <EmployeePerformancePanel
                branchId={selectedBranch}
                startDate={selectedDate}
                endDate={selectedDate}
                branchName={selectedBranchName}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaporanKinerja;
