import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import instance from '../../config/api';
import {getUserProfile} from '../../utils/userProfileHelper';
import {getRoleLabel} from '../../utils/roleValidator';
import {FaClock, FaCheckCircle, FaMapMarkerAlt, FaExclamationTriangle, FaCalendarAlt, FaUserClock, FaEdit, FaTrash, FaFilter, FaTimes} from 'react-icons/fa';

const AbsensiKaryawan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userRole, setUserRole] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [branches, setBranches] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    clock_in: '',
    clock_out: '',
    status: '',
    notes: ''
  });

  useEffect(() => {
    // Ambil role, tenant_id, dan data user dari profil
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        setUserRole(profile?.user?.role || '');
        setTenantId(profile?.tenant?.id || '');
        setUserData(profile);
      } catch (error) {
        console.error('❌ AbsensiKaryawan - Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (tenantId && userData) {
      fetchBranches();
    }
  }, [tenantId, userData]);

  useEffect(() => {
    if (selectedBranch && tenantId) {
      fetchEmployees();
    }
  }, [selectedBranch, tenantId]);

  useEffect(() => {
    if (selectedEmployee && selectedBranch && tenantId) {
      fetchAttendanceData();
    }
  }, [selectedEmployee, selectedBranch, selectedMonth, selectedYear, tenantId]);

  const fetchBranches = async () => {
    try {
      const { data } = await instance.get('/branches', {
        params: { tenant_id: tenantId }
      });
      
      if (data && data.success && Array.isArray(data.data)) {
        setBranches(data.data);
        
        // Set default selected branch
        if (data.data.length > 0) {
          let defaultBranchId;
          
          // For superadmin, select first branch
          // For other roles, select their assigned branch
          if (userRole === 'superadmin') {
            defaultBranchId = data.data[0].id;
          } else if (userData?.branch?.id) {
            defaultBranchId = userData.branch.id;
          } else {
            defaultBranchId = data.data[0].id; // Fallback to first branch
          }
          
          setSelectedBranch(defaultBranchId);
          
          // Immediately fetch employees for the default branch
          if (defaultBranchId && tenantId) {
            await fetchEmployeesForBranch(defaultBranchId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchEmployeesForBranch = async (branchId) => {
    if (!branchId || !tenantId) return;
    
    try {
      setLoadingEmployees(true);
      
      const { data } = await instance.get('/users', {
        params: { 
          tenant_id: tenantId,
          branch_id: branchId,
          status: 'active'
        }
      });
      
      
      // Filter only active employees from current tenant and branch with specific roles
      const activeEmployees = (data.data || []).filter(employee => 
        (employee.status === 'active' || employee.is_active === true) &&
        employee.tenant_id === parseInt(tenantId) &&
        employee.branch_id === parseInt(branchId) &&
        (employee.role === 'employee' || employee.role === 'admin')
      );
      
      setEmployees(activeEmployees);
      
      // Set default employee (first one) only if no employee is currently selected
      if (activeEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(activeEmployees[0].id);
      } else if (activeEmployees.length === 0) {
        setSelectedEmployee('');
      } else {
        // Check if currently selected employee is still valid for this branch
        const currentEmployeeValid = activeEmployees.find(emp => emp.id === parseInt(selectedEmployee));
        if (!currentEmployeeValid && activeEmployees.length > 0) {
          // If current selection is invalid, set to first available
          setSelectedEmployee(activeEmployees[0].id);
        }
      }
    } catch (error) {
      setEmployees([]);
      setSelectedEmployee('');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchEmployees = async () => {
    if (!selectedBranch || !tenantId) return;
    await fetchEmployeesForBranch(selectedBranch);
  };

  const fetchAttendanceData = async () => {
    if (!selectedEmployee || !selectedBranch || !tenantId) return;
    
    try {
      setLoadingData(true);
      const { data } = await instance.get(`/absents-user/${selectedEmployee}`, {
        params: { 
          month: selectedMonth, 
          year: selectedYear,
          tenant_id: tenantId,
          branch_id: selectedBranch
        }
      });
      
      if (data && data.success && Array.isArray(data.data)) {
        const mapped = data.data.map(absen => ({
          id: absen.id,
          date: absen.date,
          start_time: absen.clock_in,
          end_time: absen.clock_out,
          status: absen.status,
          notes: absen.description,
          isLate: absen.is_late,
          lateMinutes: absen.late_minutes,
          expectedIn: absen.expected_clock_in,
          expectedOut: absen.expected_clock_out,
          aiInStatus: absen.ai_clock_in_status,
          aiInVerdict: absen.ai_clock_in_verdict,
          aiInScore: absen.ai_clock_in_score,
          aiOutStatus: absen.ai_clock_out_status,
          aiOutVerdict: absen.ai_clock_out_verdict,
          aiOutScore: absen.ai_clock_out_score
        }));
        setAttendanceList(mapped);
      } else {
        setAttendanceList([]);
      }
    } catch (error) {
      setAttendanceList([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEdit = (attendance) => {
    if (userRole !== 'superadmin') return;
    
    setEditingAttendance(attendance);
    // Format date to YYYY-MM-DD for input type="date"
    const dateValue = attendance.date ? new Date(attendance.date).toISOString().split('T')[0] : '';
    setEditForm({
      date: dateValue,
      clock_in: attendance.start_time || '',
      clock_out: attendance.end_time || '',
      status: attendance.status || 'Present',
      notes: attendance.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (attendanceId) => {
    if (userRole !== 'superadmin') return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
      try {
        await instance.delete(`/absents/${attendanceId}`);
        fetchAttendanceData();
      } catch (error) {
        alert('Gagal menghapus data absensi');
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      const clockOut = editForm.clock_out === '00:00' || editForm.clock_out === '00:00:00' ? null : editForm.clock_out;
      
      // Calculate work_duration if both clock_in and clock_out are present
      let workDuration = null;
      if (editForm.date && editForm.clock_in && clockOut) {
        workDuration = calculateWorkDuration(editForm.date, editForm.clock_in, clockOut);
      }
      
      const updateData = {
        date: editForm.date,
        clock_in: editForm.clock_in,
        clock_out: clockOut,
        status: editForm.status,
        work_duration: workDuration,
        description: editForm.notes,
        tenant_id: tenantId
      };
      
      await instance.put(`/absents/${editingAttendance.id}`, updateData);
      setShowEditModal(false);
      fetchAttendanceData();
    } catch (error) {
      alert('Gagal memperbarui data absensi');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'text-telaga-800 bg-telaga-100';
      case 'Late':
        return 'text-senja-800 bg-senja-100';
      case 'Absent':
        return 'text-red-700 bg-red-100';
      case 'PersonalLeave':
        return 'text-senja-700 bg-senja-50';
      default:
        return 'text-telaga-900/60 bg-telaga-50';
    }
  };

  const getAiBadgeColor = (verdict) => {
    switch (verdict) {
      case 'verified':
        return 'text-telaga-800 bg-telaga-100';
      case 'review':
        return 'text-senja-800 bg-senja-100';
      case 'reject':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-telaga-900/60 bg-telaga-50';
    }
  };

  const getAiBadgeText = (verdict) => {
    switch (verdict) {
      case 'verified':
        return 'cocok';
      case 'review':
        return 'perlu dicek';
      case 'reject':
        return 'tidak cocok';
      default:
        return verdict;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Present':
        return 'Hadir';
      case 'Late':
        return 'Terlambat';
      case 'Absent':
        return 'Tidak Hadir';
      case 'PersonalLeave':
        return 'Izin';
      default:
        return status;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    
    // Handle different time formats
    if (timeString.includes('T')) {
      // ISO format
      return new Date(timeString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Direct time format (HH:MM:SS)
      return timeString.substring(0, 5);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateWorkHours = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    
    try {
      let start, end;
      
      // Handle different time formats
      if (startTime.includes('T')) {
        start = new Date(startTime);
      } else {
        // Direct time format (HH:MM:SS)
        const today = new Date().toISOString().split('T')[0];
        start = new Date(`${today}T${startTime}`);
      }
      
      if (endTime.includes('T')) {
        end = new Date(endTime);
      } else {
        // Direct time format (HH:MM:SS)
        const today = new Date().toISOString().split('T')[0];
        end = new Date(`${today}T${endTime}`);
      }
      
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHours}j ${diffMinutes}m`;
    } catch (error) {
        return '-';
    }
  };

  // Calculate work_duration in HH:mm:ss format for API
  const calculateWorkDuration = (date, clockIn, clockOut) => {
    if (!date || !clockIn || !clockOut) return null;
    
    try {
      // Combine date and time
      const startDateTime = new Date(`${date}T${clockIn}`);
      const endDateTime = new Date(`${date}T${clockOut}`);
      
      // Calculate difference in milliseconds
      const diffMs = endDateTime - startDateTime;
      
      // If negative, return null (invalid)
      if (diffMs < 0) return null;
      
      // Calculate hours, minutes, seconds
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      // Format as HH:mm:ss
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating work duration:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Absensi Karyawan"
          description="Kelola kehadiran & jam kerja karyawan"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
          hideLogout={true}
          hideUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-telaga-100 border-b-telaga-600 mx-auto"></div>
            <p className="mt-4 text-sm text-telaga-900/55">Memuat data absensi...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Absensi Karyawan"
        description="Kelola kehadiran & jam kerja karyawan"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
        hideLogout={true}
        hideUserMenu={true}
      />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Summary */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Hadir</p>
                <p className="text-lg font-bold text-telaga-950">
                  {attendanceList.filter((a) => a.status === 'Present').length}
                </p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Izin</p>
                <p className="text-lg font-bold text-senja-700">
                  {attendanceList.filter((a) => a.status === 'PersonalLeave').length}
                </p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Hari</p>
                <p className="text-lg font-bold text-telaga-950">{attendanceList.length}</p>
              </div>
            </div>

            {/* Filter Card */}
            <div className="mb-3 rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-telaga-950">Filter Absensi</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setShowFilterModal(true);
                      if (selectedBranch && tenantId && employees.length === 0) {
                        fetchEmployeesForBranch(selectedBranch);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-telaga-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-telaga-800"
                  >
                    <FaFilter className="h-3.5 w-3.5" />
                    Ubah Filter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-krem px-2.5 py-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                    <FaMapMarkerAlt className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Cabang</p>
                    <p className="truncate text-xs font-semibold text-telaga-950">
                      {selectedBranch
                        ? branches.find((branch) => branch.id === parseInt(selectedBranch))?.name || 'Cabang terpilih'
                        : 'Belum dipilih'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-krem px-2.5 py-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                    <FaUserClock className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Karyawan</p>
                    <p className="truncate text-xs font-semibold text-telaga-950">
                      {selectedEmployee
                        ? employees.find((emp) => emp.id === parseInt(selectedEmployee))?.name || 'Karyawan terpilih'
                        : 'Belum dipilih'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-krem px-2.5 py-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                    <FaCalendarAlt className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Periode</p>
                    <p className="truncate text-xs font-semibold text-telaga-950">
                      {new Date(0, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long' })} {selectedYear}
                    </p>
                  </div>
                </div>
              </div>

              {selectedBranch && employees.length === 0 && !loadingEmployees && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-senja-200 bg-senja-50 px-3 py-2">
                  <FaExclamationTriangle className="h-3.5 w-3.5 flex-shrink-0 text-senja-600" />
                  <div>
                    <p className="text-xs font-semibold text-senja-800">Tidak ada karyawan aktif</p>
                    <p className="text-[11px] text-senja-600">di cabang ini</p>
                  </div>
                </div>
              )}

              {selectedBranch && employees.length > 0 && !selectedEmployee && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-telaga-100 bg-telaga-50 px-3 py-2">
                  <FaUserClock className="h-3.5 w-3.5 flex-shrink-0 text-telaga-600" />
                  <div>
                    <p className="text-xs font-semibold text-telaga-900">Pilih karyawan</p>
                    <p className="text-[11px] text-telaga-700">untuk melihat data absensi</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Employee Info */}
            {selectedEmployee && selectedBranch && employees.length > 0 && (
              <div className="relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-telaga-700 via-telaga-800 to-telaga-950 p-4 text-white shadow-sm">
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-senja-400/25 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-bold ring-1 ring-white/25">
                    {(employees.find((emp) => emp.id === parseInt(selectedEmployee))?.name || 'K').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold leading-tight">
                      {employees.find((emp) => emp.id === parseInt(selectedEmployee))?.name || 'Karyawan terpilih'}
                    </h3>
                    <p className="truncate text-xs text-white/70">
                      {branches.find((branch) => branch.id === parseInt(selectedBranch))?.name || 'Cabang terpilih'}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/25">
                      {getRoleLabel(employees.find((emp) => emp.id === parseInt(selectedEmployee))?.role || 'employee')}
                    </span>
                    <span className="text-[10px] text-white/55">
                      {new Date(0, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'short' })} {selectedYear}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance List */}
            <div className="space-y-2">
              {loadingData ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-telaga-100" />
                  ))}
                </div>
              ) : !selectedBranch ? (
                <div className="rounded-2xl border border-dashed border-telaga-200 bg-white/60 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-telaga-50 text-telaga-600">
                    <FaMapMarkerAlt className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-telaga-950">Pilih Cabang</h3>
                  <p className="mt-1 text-xs text-telaga-900/55">Pilih cabang dulu untuk melihat data absensi</p>
                </div>
              ) : !selectedEmployee ? (
                <div className="rounded-2xl border border-dashed border-telaga-200 bg-white/60 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-telaga-50 text-telaga-600">
                    <FaUserClock className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-telaga-950">Pilih Karyawan</h3>
                  <p className="mt-1 text-xs text-telaga-900/55">Pilih karyawan untuk melihat data absensi</p>
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-telaga-200 bg-white/60 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-telaga-50 text-telaga-600">
                    <FaCalendarAlt className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-telaga-950">Tidak ada data</h3>
                  <p className="mt-1 text-xs text-telaga-900/55">Belum ada absensi pada periode ini</p>
                </div>
              ) : (
                attendanceList.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm transition-colors hover:border-telaga-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                            <FaCalendarAlt className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-telaga-950">{formatDate(attendance.date)}</p>
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(attendance.status)}`}>
                            {getStatusText(attendance.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-krem px-2 py-1.5">
                            <p className="flex items-center gap-1 text-[10px] font-medium text-telaga-900/45">
                              <FaClock className="h-2.5 w-2.5" /> Masuk
                            </p>
                            <p className="text-xs font-semibold text-telaga-950">{formatTime(attendance.start_time)}</p>
                          </div>
                          <div className="rounded-lg bg-krem px-2 py-1.5">
                            <p className="flex items-center gap-1 text-[10px] font-medium text-telaga-900/45">
                              <FaCheckCircle className="h-2.5 w-2.5" /> Keluar
                            </p>
                            <p className="text-xs font-semibold text-telaga-950">{formatTime(attendance.end_time)}</p>
                          </div>
                          <div className="rounded-lg bg-telaga-50 px-2 py-1.5">
                            <p className="text-[10px] font-medium text-telaga-700">Jam kerja</p>
                            <p className="text-xs font-semibold text-telaga-800">
                              {calculateWorkHours(attendance.start_time, attendance.end_time)}
                            </p>
                          </div>
                        </div>

                        {(attendance.isLate || attendance.lateMinutes > 0 ||
                          attendance.aiInVerdict || attendance.aiOutVerdict ||
                          attendance.aiInStatus === 'pending' || attendance.aiInStatus === 'processing' ||
                          attendance.aiOutStatus === 'pending' || attendance.aiOutStatus === 'processing') && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {(attendance.isLate || attendance.lateMinutes > 0) && (
                              <span className="rounded-full bg-senja-100 px-2 py-0.5 text-[10px] font-semibold text-senja-700">
                                Telat {attendance.lateMinutes} mnt
                                {attendance.expectedIn ? ` · jadwal ${String(attendance.expectedIn).slice(0, 5)}` : ''}
                              </span>
                            )}
                            {['pending', 'processing'].includes(attendance.aiInStatus) && (
                              <span className="rounded-full bg-telaga-100 px-2 py-0.5 text-[10px] font-semibold text-telaga-700">
                                AI menilai foto masuk...
                              </span>
                            )}
                            {attendance.aiInVerdict && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getAiBadgeColor(attendance.aiInVerdict)}`}>
                                Foto masuk: {getAiBadgeText(attendance.aiInVerdict)}
                                {attendance.aiInScore != null ? ` (${attendance.aiInScore})` : ''}
                              </span>
                            )}
                            {['pending', 'processing'].includes(attendance.aiOutStatus) && (
                              <span className="rounded-full bg-telaga-100 px-2 py-0.5 text-[10px] font-semibold text-telaga-700">
                                AI menilai foto pulang...
                              </span>
                            )}
                            {attendance.aiOutVerdict && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getAiBadgeColor(attendance.aiOutVerdict)}`}>
                                Foto pulang: {getAiBadgeText(attendance.aiOutVerdict)}
                                {attendance.aiOutScore != null ? ` (${attendance.aiOutScore})` : ''}
                              </span>
                            )}
                          </div>
                        )}

                        {attendance.notes && (
                          <div className="mt-2 rounded-lg border border-senja-200 bg-senja-50 px-2 py-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-senja-700">Catatan</p>
                            <p className="text-xs text-senja-800">{attendance.notes}</p>
                          </div>
                        )}
                      </div>

                      {userRole === 'superadmin' && (
                        <div className="flex flex-shrink-0 flex-col gap-1.5">
                          <button
                            onClick={() => handleEdit(attendance)}
                            className="rounded-lg border border-telaga-100 bg-telaga-50 p-1.5 text-telaga-700 transition-colors hover:bg-telaga-100"
                            title="Edit Absensi"
                          >
                            <FaEdit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(attendance.id)}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100"
                            title="Hapus Absensi"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Edit Modal - Tokopedia Style */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-telaga-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-telaga-950">
                Edit Data Absensi
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-telaga-50 text-telaga-900/60 transition-colors hover:bg-telaga-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                >
                  <option value="Present">Hadir</option>
                  <option value="PersonalLeave">Izin</option>
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={editForm.clock_in}
                  onChange={(e) => setEditForm({ ...editForm, clock_in: e.target.value })}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Jam Keluar
                </label>
                <input
                  type="time"
                  value={editForm.clock_out}
                  onChange={(e) => setEditForm({ ...editForm, clock_out: e.target.value })}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Catatan
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-xl border border-telaga-200 px-4 py-3 text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl bg-telaga-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-telaga-800"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal - Tokopedia Style */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-telaga-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-telaga-950">
                Filter Data Absensi
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-telaga-50 text-telaga-900/60 transition-colors hover:bg-telaga-100"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Pilih Cabang
                </label>
                <select
                  value={selectedBranch}
                  onChange={async (e) => {
                    const newBranchId = e.target.value;
                    const currentBranchId = selectedBranch;
                    
                    setSelectedBranch(newBranchId);
                    
                    // Only reset employee selection if branch actually changed
                    if (currentBranchId !== newBranchId) {
                      setSelectedEmployee('');
                    }
                    
                    // Fetch employees for the new branch
                    if (newBranchId && tenantId) {
                      await fetchEmployeesForBranch(newBranchId);
                    } else {
                      setEmployees([]);
                    }
                  }}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                >
                  <option value="">Pilih cabang...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                  Pilih Karyawan
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  disabled={!selectedBranch || loadingEmployees}
                >
                  <option value="">
                    {loadingEmployees ? 'Memuat karyawan...' : 'Pilih karyawan...'}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({getRoleLabel(employee.role)})
                    </option>
                  ))}
                </select>
                {!selectedBranch && (
                  <p className="mt-2 text-xs text-telaga-900/45">Pilih cabang terlebih dahulu</p>
                )}
                {selectedBranch && employees.length === 0 && !loadingEmployees && (
                  <p className="mt-2 text-xs text-telaga-900/45">Tidak ada karyawan aktif di cabang ini</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                    Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-semibold text-telaga-900/70">
                    Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-telaga-100 bg-krem px-4 py-3 text-sm font-montserrat transition-colors focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 rounded-xl border border-telaga-200 px-4 py-3 text-sm font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  // Fetch attendance data with current selections
                  fetchAttendanceData();
                }}
                className="flex-1 rounded-xl bg-telaga-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-telaga-800"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AbsensiKaryawan;
