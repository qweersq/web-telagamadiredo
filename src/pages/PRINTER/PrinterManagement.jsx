import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import bluetoothPrinterService from '../../services/bluetoothPrinterService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import { getUserProfile, getBranchId, getTenantId, getBranchName, getTenantBusinessName } from '../../utils/userProfileHelper';
import PrinterExplanationModal from '../../components/Modal/PrinterExplanationModal';
import { 
  FaPrint, 
  FaBluetooth, 
  FaWifi, 
  FaUsb, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCog,
  FaSearch,
  FaPlus,
  FaPlay,
  FaStop,
  FaSignal
} from 'react-icons/fa';

const PrinterManagement = ({ isFromAdmin = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [printers, setPrinters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isFromPengaturanAdmin, setIsFromPengaturanAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentBranchName, setCurrentBranchName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const isFromAdminRef = useRef(false);
  const selectedBranchRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);

  // State untuk explanation modal
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    device_name: '',
    device_id: '',
    service_uuid: '',
    characteristic_uuid: '',
    paper_width: 58,
    encoding: 'CP437',
    printer_type: 'thermal',
    print_capabilities: ['invoice', 'tag'],
    branch_id: ''
  });

  useEffect(() => {
    const initializeData = async () => {
      // Check if coming from pengaturan admin (prop or localStorage)
      const isFromAdminFlag = isFromAdmin || localStorage.getItem('fromPengaturanAdmin') === 'true';
      
      // Fetch user profile first
      const profileData = await fetchUserProfile();
      
      if (profileData) {
        const { user, branch, tenant } = profileData;
        
        // Set refs to prevent changes
        isFromAdminRef.current = isFromAdminFlag;
        if (isFromAdminFlag && branch?.id) {
          selectedBranchRef.current = branch.id;
        }
        
        // Always set state based on current flag
        setIsFromPengaturanAdmin(isFromAdminFlag);
        
        // Auto-set branch_id for admin based on role
        if (user?.role === 'admin' && branch?.id) {
          setSelectedBranch(branch.id);
          setFormData(prev => ({ ...prev, branch_id: branch.id }));
          setCurrentBranchName(branch.name || 'Loading...');
          fetchPrintersForBranchWithTenant(branch.id, tenant?.id);
        } else if (isFromAdminFlag && branch?.id) {
          // Fallback for isFromAdminFlag
          setSelectedBranch(branch.id);
          setFormData(prev => ({ ...prev, branch_id: branch.id }));
          setCurrentBranchName(branch.name || 'Loading...');
          fetchPrintersForBranchWithTenant(branch.id, tenant?.id);
        } else {
          // For superadmin or other roles, don't fetch printers yet
          // Branch will be auto-selected in fetchBranches() and then fetch printers
        }
      } else {
        // Fallback: try to get branch_id from localStorage if API fails
        try {
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (isFromAdminFlag && userData.branch_id) {
              // For admin: use their specific branch
              setSelectedBranch(userData.branch_id);
              setFormData(prev => ({ ...prev, branch_id: userData.branch_id }));
              setCurrentBranchName(userData.branch_name || 'Loading...');
              fetchPrintersForBranch(userData.branch_id);
            } else {
              // For superadmin: don't fetch printers yet, branch will be auto-selected
            }
          } else {
            // No userData in localStorage, wait for branch selection
          }
        } catch (error) {
          console.error('❌ PrinterManagement - Error parsing localStorage fallback:', error);
          // Don't fetch printers yet, wait for branch selection
        }
      }
      
      // Pass profileData to fetchBranches to avoid race condition
      await fetchBranches(profileData);
      checkBluetoothAvailability();
    };

    initializeData();
  }, [isFromAdmin]);



  // Update branch name when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && selectedBranch) {
      const branch = branches.find(b => b.id === selectedBranch);
      if (branch) {
        setCurrentBranchName(branch.name);
      }
    }
  }, [branches, selectedBranch]);

  // Ensure formData.branch_id is set for admin when userProfile is loaded
  useEffect(() => {
    if (userProfile?.user?.role === 'admin' && userProfile?.branch?.id) {
      // If formData.branch_id is empty or different from user's branch, update it
      if (!formData.branch_id || formData.branch_id !== userProfile.branch.id) {
        setFormData(prev => ({ ...prev, branch_id: userProfile.branch.id }));
      }
      // If selectedBranch is empty or different from user's branch, update it
      if (!selectedBranch || selectedBranch !== userProfile.branch.id) {
        setSelectedBranch(userProfile.branch.id);
      }
    }
  }, [userProfile]);

  // Check if explanation modal should be shown
  useEffect(() => {
    const hasSeenExplanation = localStorage.getItem('printer-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  // Handle explanation modal
  const handleExplanationConfirm = () => {
    localStorage.setItem('printer-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      localStorage.removeItem('fromPengaturanAdmin');
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profileData = await getUserProfile();
      if (profileData) {
        setUserProfile(profileData);
      }
      return profileData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const checkBluetoothAvailability = async () => {
    try {
      const available = await bluetoothPrinterService.isBluetoothAvailable();
      setBluetoothAvailable(available);
    } catch (error) {
      console.error('Bluetooth check failed:', error);
      setBluetoothAvailable(false);
    }
  };

  const fetchBranches = async (profileDataParam = null) => {
    try {
      const tenantId = await getTenantId();
      
      const params = tenantId ? { tenant_id: tenantId } : {};
      const response = await instance.get('/branches', { params });
      setBranches(response.data.data || []);
      
      // Use profileDataParam if provided, otherwise fallback to userProfile state
      const currentProfile = profileDataParam || userProfile;
      const isAdmin = currentProfile?.user?.role === 'admin';
      const userBranchId = currentProfile?.branch?.id;
      
      // Auto-select branch logic:
      // 1. If from pengaturan admin OR user is admin: use user's branch (already handled in initializeData)
      // 2. If superadmin: auto-select first branch as default
      // 3. If other roles: auto-select first branch as default
      // IMPORTANT: Don't auto-select if user is admin (they should use their own branch from userProfile)
      if (response.data.data.length > 0 && !isFromPengaturanAdmin && !selectedBranch && !isAdmin) {
        const firstBranch = response.data.data[0];
        setSelectedBranch(firstBranch.id);
        setFormData(prev => ({ ...prev, branch_id: firstBranch.id }));
        setCurrentBranchName(firstBranch.name);
        
        // Immediately fetch printers for the selected branch
        fetchPrintersForBranch(firstBranch.id);
      } else if (response.data.data.length > 0 && isAdmin && userBranchId && !selectedBranch) {
        // For admin: ensure branch_id is set from userProfile (fallback if initializeData didn't set it)
        // Find branch from list that matches user's branch_id
        const adminBranch = response.data.data.find(b => b.id === userBranchId);
        if (adminBranch) {
          console.log('🔍 fetchBranches - Setting admin branch:', adminBranch.id, adminBranch.name);
          setSelectedBranch(adminBranch.id);
          setFormData(prev => ({ ...prev, branch_id: adminBranch.id }));
          setCurrentBranchName(adminBranch.name);
          fetchPrintersForBranch(adminBranch.id);
        } else {
          console.warn('⚠️ fetchBranches - Admin branch not found in branches list:', userBranchId);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const tenantId = await getTenantId();
      const params = { 
        ...(selectedBranch && { branch_id: selectedBranch }),
        ...(tenantId && { tenant_id: tenantId })
      };
      const response = await instance.get('/printers', { params });
      setPrinters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching printers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    setFormData(prev => ({ ...prev, branch_id: branchId }));
    
    // Update current branch name
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      if (branch) {
        setCurrentBranchName(branch.name);
      }
    }
    
    // Fetch printers for the selected branch
    if (branchId) {
      fetchPrintersForBranch(branchId);
    } else {
      // If no branch selected, fetch all printers
      fetchPrinters();
    }
  };

  const fetchPrintersForBranch = async (branchId) => {
    try {
      setLoading(true);
      const tenantId = await getTenantId();
      // For admin, backend will ignore branch_id query param and use req.user.branch_id
      // So we don't need to send branch_id for admin, but we send it anyway for consistency
      // Backend will handle the filtering correctly
      const params = { 
        ...(branchId && { branch_id: branchId }),
        ...(tenantId && { tenant_id: tenantId })
      };
      
      console.log('🔍 fetchPrintersForBranch - Request params:', params);
      console.log('🔍 fetchPrintersForBranch - User role:', userProfile?.user?.role);
      console.log('🔍 fetchPrintersForBranch - User branch_id:', userProfile?.branch?.id);
      
      const response = await instance.get('/printers', { params });
      console.log('🔍 fetchPrintersForBranch - Response data:', response.data.data);
      setPrinters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching printers for branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrintersForBranchWithTenant = async (branchId, tenantId) => {
    try {
      setLoading(true);
      // For admin, backend will ignore branch_id query param and use req.user.branch_id
      // So we don't need to send branch_id for admin, but we send it anyway for consistency
      // Backend will handle the filtering correctly
      const params = { 
        ...(branchId && { branch_id: branchId }),
        ...(tenantId && { tenant_id: tenantId })
      };
      
      console.log('🔍 fetchPrintersForBranchWithTenant - Request params:', params);
      console.log('🔍 fetchPrintersForBranchWithTenant - User role:', userProfile?.user?.role);
      console.log('🔍 fetchPrintersForBranchWithTenant - User branch_id:', userProfile?.branch?.id);
      
      const response = await instance.get('/printers', { params });
      console.log('🔍 fetchPrintersForBranchWithTenant - Response data:', response.data.data);
      setPrinters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching printers for branch with tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverDevices = async () => {
    try {
      setIsDiscovering(true);
      setDiscoveredDevices([]);
      
      const devices = await bluetoothPrinterService.discoverDevices();
      setDiscoveredDevices(devices);
      setShowDiscoveryModal(true);
    } catch (error) {
      console.error('Device discovery failed:', error);
      alert('Gagal mencari perangkat Bluetooth: ' + error.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConnectDevice = async (deviceId) => {
    try {
      setIsConnecting(true);
      
      const result = await bluetoothPrinterService.autoDetectPrinterConfig(deviceId);
      
      if (result.success) {
        const config = result.config;
        
        // Ensure branch_id is set for admin
        // PRIORITY: For admin, always use their branch_id from userProfile (not selectedBranch or formData)
        let branchIdToUse = null;
        if (userProfile?.user?.role === 'admin' && userProfile?.branch?.id) {
          // For admin: always use their assigned branch
          branchIdToUse = userProfile.branch.id;
          console.log('🔍 handleConnectDevice - Admin branch:', branchIdToUse);
        } else {
          // For superadmin or other roles: use selectedBranch or formData.branch_id
          branchIdToUse = selectedBranch || formData.branch_id;
        }
        
        // Fallback: get from localStorage if still empty
        if (!branchIdToUse) {
          try {
            const userDataStr = localStorage.getItem('userData');
            if (userDataStr) {
              const userData = JSON.parse(userDataStr);
              branchIdToUse = userData.branch_id;
            }
          } catch (e) {
            console.error('Error parsing localStorage:', e);
          }
        }
        
        setFormData(prev => ({
          ...prev,
          device_name: config.device_name,
          device_id: config.device_id,
          service_uuid: config.service_uuid,
          characteristic_uuid: config.characteristic_uuid,
          printer_type: config.printer_type,
          paper_width: config.paper_width,
          encoding: config.encoding,
          print_capabilities: config.print_capabilities,
          branch_id: branchIdToUse || prev.branch_id
        }));
        
        setShowDiscoveryModal(false);
        setShowCreateModal(true);
      }
    } catch (error) {
      console.error('Device connection failed:', error);
      alert('Gagal menghubungkan perangkat: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestMode = () => {
    // Ensure branch_id is set from userProfile (PRIORITY: use user's branch, not first branch from list)
    let branchIdToUse = null;
    
    // Priority 1: Use userProfile.branch.id (for admin, this is their assigned branch)
    if (userProfile?.branch?.id) {
      branchIdToUse = userProfile.branch.id;
    }
    // Priority 2: Use selectedBranch (if already set)
    else if (selectedBranch) {
      branchIdToUse = selectedBranch;
    }
    // Priority 3: Use formData.branch_id (if already set)
    else if (formData.branch_id) {
      branchIdToUse = formData.branch_id;
    }
    // Priority 4: Fallback to localStorage for admin
    else if (userProfile?.user?.role === 'admin') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          branchIdToUse = userData.branch_id;
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }

    if (!branchIdToUse) {
      alert('Cabang tidak ditemukan. Silakan refresh halaman dan coba lagi.');
      return;
    }

    // Set dummy data for testing
    setFormData({
      name: '',
      device_name: 'TEST_PRINTER_01',
      device_id: 'TEST_DEVICE_ID_12345',
      service_uuid: '0000ff00-0000-1000-8000-00805f9b34fb',
      characteristic_uuid: '0000ff01-0000-1000-8000-00805f9b34fb',
      paper_width: 58,
      encoding: 'CP437',
      printer_type: 'thermal',
      print_capabilities: ['invoice', 'tag'],
      branch_id: branchIdToUse
    });
    
    setShowCreateModal(true);
  };

  const handleCreatePrinter = async () => {
    try {
      // Ensure branch_id is set for admin before submit
      let branchIdToUse = formData.branch_id || selectedBranch;
      if (!branchIdToUse && userProfile?.branch?.id) {
        branchIdToUse = userProfile.branch.id;
      }
      if (!branchIdToUse && userProfile?.user?.role === 'admin') {
        // Fallback: get from localStorage if still empty
        try {
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            branchIdToUse = userData.branch_id;
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
      
      if (!branchIdToUse) {
        alert('Cabang tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
      }
      
      const dataToSubmit = {
        ...formData,
        branch_id: branchIdToUse
      };
      
      await instance.post('/printers', dataToSubmit);
      setShowCreateModal(false);
      setFormData({
        name: '',
        device_name: '',
        device_id: '',
        service_uuid: '',
        characteristic_uuid: '',
        paper_width: 58,
        encoding: 'CP437',
        printer_type: 'thermal',
        print_capabilities: ['invoice', 'tag'],
        branch_id: branchIdToUse || selectedBranch
      });
      fetchPrintersForBranch(branchIdToUse || selectedBranch);
    } catch (error) {
      console.error('Error creating printer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal membuat printer';
      alert(errorMessage);
    }
  };

  const handleEditPrinter = (printer) => {
    setSelectedPrinter(printer);
    
    // Ensure branch_id is set (use printer.branch_id or fallback to userProfile)
    let branchIdToUse = printer.branch_id;
    if (!branchIdToUse && userProfile?.branch?.id) {
      branchIdToUse = userProfile.branch.id;
    }
    if (!branchIdToUse && userProfile?.user?.role === 'admin') {
      // Fallback: get from localStorage if still empty
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          branchIdToUse = userData.branch_id;
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    
    setFormData({
      name: printer.name,
      device_name: printer.device_name,
      device_id: printer.device_id,
      service_uuid: printer.service_uuid,
      characteristic_uuid: printer.characteristic_uuid,
      paper_width: printer.paper_width,
      encoding: printer.encoding,
      printer_type: printer.printer_type,
      print_capabilities: printer.print_capabilities,
      branch_id: branchIdToUse || printer.branch_id
    });
    setShowEditModal(true);
  };

  const handleUpdatePrinter = async () => {
    try {
      // Ensure branch_id is set before submit
      // For admin: use formData.branch_id (already set from selectedPrinter.branch_id in handleEditPrinter)
      // Backend will validate if printer belongs to admin's branch
      // For superadmin: use formData.branch_id (can be changed by user)
      let branchIdToUse = formData.branch_id || selectedPrinter?.branch_id;
      
      // Fallback only if branch_id is still empty (should not happen if handleEditPrinter worked correctly)
      if (!branchIdToUse && userProfile?.branch?.id) {
        branchIdToUse = userProfile.branch.id;
      }
      if (!branchIdToUse && userProfile?.user?.role === 'admin') {
        // Last resort fallback: get from localStorage
        try {
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            branchIdToUse = userData.branch_id;
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
      
      if (!branchIdToUse) {
        alert('Cabang tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
      }
      
      const dataToSubmit = {
        ...formData,
        branch_id: branchIdToUse
      };
      
      await instance.put(`/printers/${selectedPrinter.id}`, dataToSubmit);
      setShowEditModal(false);
      setSelectedPrinter(null);
      fetchPrintersForBranch(branchIdToUse || selectedBranch);
    } catch (error) {
      console.error('Error updating printer:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Gagal mengupdate printer';
      alert(errorMessage);
    }
  };

  const handleDeletePrinter = async (printerId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus printer ini?')) {
      try {
        await instance.delete(`/printers/${printerId}`);
        fetchPrintersForBranch(selectedBranch);
      } catch (error) {
        console.error('Error deleting printer:', error);
        alert('Gagal menghapus printer: ' + error.message);
      }
    }
  };

  const handleTestConnection = async (printerId) => {
    try {
      await instance.post(`/printers/${printerId}/test-connection`);
      alert('Koneksi printer berhasil!');
      fetchPrintersForBranch(selectedBranch);
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Gagal menguji koneksi printer: ' + error.message);
    }
  };

  const handleSetDefault = async (printerId) => {
    try {
      await instance.put(`/printers/${printerId}/set-default`, {
        branch_id: selectedBranch
      });
      alert('Printer default berhasil diubah!');
      fetchPrintersForBranch(selectedBranch);
    } catch (error) {
      console.error('Error setting default printer:', error);
      alert('Gagal mengubah printer default: ' + error.message);
    }
  };

  const handleTestPrint = async (printer) => {
    try {
      setIsTestingPrint(true);
      
      // Set printer configuration untuk testing
      thermalPrinterService.addPrinterConfig(
        printer.device_name,
        printer.service_uuid,
        printer.characteristic_uuid,
        printer.paper_width
      );
      thermalPrinterService.setCurrentPrinter(printer.device_name);
      
      // Lakukan test print ke printer dengan data lengkap
      console.log('Testing print to printer with data:', printer);
      await thermalPrinterService.testPrintToPrinter(printer);
      
      alert('Test print berhasil! Cek printer untuk melihat hasil print.');
      
      // Update status printer menjadi active
      await instance.put(`/printers/${printer.id}/status`, {
        status: 'active'
      });
      
      // Refresh data printer
      fetchPrintersForBranch(selectedBranch);
      
    } catch (error) {
      console.error('Error testing print:', error);
      alert('Gagal melakukan test print: ' + error.message);
      
      // Update status printer menjadi disconnected
      try {
        await instance.put(`/printers/${printer.id}/status`, {
          status: 'disconnected'
        });
        fetchPrintersForBranch(selectedBranch);
      } catch (updateError) {
        console.error('Error updating printer status:', updateError);
      }
    } finally {
      setIsTestingPrint(false);
    }
  };



  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <FaTimesCircle className="w-4 h-4 text-gray-500" />;
      case 'maintenance':
        return <FaCog className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FaTimesCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-300 font-semibold';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border border-gray-300 font-semibold';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border border-red-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300 font-semibold';
    }
  };

  const getPrinterTypeIcon = (type) => {
    switch (type) {
      case 'thermal':
        return <FaPrint className="w-4 h-4 text-blue-500" />;
      case 'inkjet':
        return <FaPrint className="w-4 h-4 text-purple-500" />;
      case 'laser':
        return <FaPrint className="w-4 h-4 text-orange-500" />;
      default:
        return <FaPrint className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner 
          title="Manajemen Printer"
          description="Kelola printer dan koneksi Bluetooth"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
          hideLogout={true}
          hideUserMenu={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data printer...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Manajemen Printer"
        description="Kelola printer dan koneksi Bluetooth"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
        hideLogout={true}
        hideUserMenu={true}
        // addButton={
        //   <AnimatedButton
        //     onClick={() => setShowCreateModal(true)}
        //     className="px-4 py-3 rounded-xl text-sm bg-blue-500 hover:bg-blue-600 text-white"
        //     variant="blue"
        //   >
        //     <FaPlus className="w-4 h-4" />
        //   </AnimatedButton>
        // }
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-4">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-6">
            
            {/* Branch Filter - Show for superadmin (even from pengaturan admin), hidden for admin */}
            {(() => {
              const isAdminFromPengaturan = userProfile?.user?.role === 'admin' && (isFromPengaturanAdmin || isFromAdminRef.current);
              return !isAdminFromPengaturan;
            })() && (
              <div className="mb-6 mt-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaWifi className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 font-montserrat">Pilih Outlet</h3>
                      <p className="text-xs text-gray-500 font-montserrat">Pilih outlet untuk mengatur printer</p>
                    </div>
                  </div>
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="">Pilih outlet...</option>
                    {(branches || []).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Show current branch info if admin from pengaturan admin */}
            {userProfile?.user?.role === 'admin' && (isFromPengaturanAdmin || isFromAdminRef.current) && selectedBranch && (
              <div className="mb-6 mt-16">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <FaWifi className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800 font-montserrat">Outlet Aktif</h3>
                      <p className="text-xs text-blue-600 font-montserrat">
                        {userProfile?.branch?.name || currentBranchName || 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bluetooth Status */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      bluetoothAvailable ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <FaBluetooth className={`w-5 h-5 ${
                        bluetoothAvailable ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 font-montserrat">
                        Status Bluetooth
                      </h3>
                      <p className={`text-xs font-montserrat ${
                        bluetoothAvailable ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {bluetoothAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Help Button */}
                  <button
                    onClick={() => setShowExplanationModal(true)}
                    className="px-3 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    title="Bantuan & Panduan Printer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <AnimatedButton
                  onClick={handleDiscoverDevices}
                  disabled={!bluetoothAvailable || isDiscovering}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:transform-none disabled:shadow-none"
                  variant="blue"
                >
                  {isDiscovering ? (
                    <>
                      <FaSearch className="w-4 h-4 animate-spin" />
                      <span>Mencari Printer...</span>
                    </>
                  ) : (
                    <>
                      <FaSearch className="w-4 h-4" />
                      <span>Cari Printer Bluetooth</span>
                    </>
                  )}
                </AnimatedButton>
                
                {/* Test Mode Button - Only show in development or with ?test=true */}
                {/* {(process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).get('test') === 'true') && (
                  <AnimatedButton
                    onClick={handleTestMode}
                    className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-3 border-2 border-purple-300"
                    variant="purple"
                    title="Test Mode: Buka modal tambah printer dengan data dummy (untuk testing tanpa printer fisik)"
                  >
                    <FaPlay className="w-4 h-4" />
                    <span>Test Mode (Tanpa Printer)</span>
                  </AnimatedButton>
                )} */}
              </div>
            </div>

            {/* Printer List */}
            <div className="space-y-4">
              {(printers || []).map((printer) => (
                <div key={printer.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all duration-300">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        {getPrinterTypeIcon(printer.printer_type)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-800 font-montserrat">{printer.name}</h3>
                        <p className="text-sm text-gray-500 font-montserrat">{printer.device_name}</p>
                      </div>
                    </div>
                    
                    {/* <div className="flex flex-col items-end gap-2">
                      {printer.is_default && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 font-montserrat">
                          DEFAULT
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 font-montserrat ${getStatusColor(printer.status)}`}>
                        {getStatusIcon(printer.status)} {printer.status.toUpperCase()}
                      </span>
                    </div> */}
                  </div>

                  {/* Printer Details */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-montserrat">Kertas:</span>
                        <span className="font-semibold text-gray-800 font-montserrat">{printer.paper_width}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-montserrat">Encoding:</span>
                        <span className="font-semibold text-gray-800 font-montserrat">{printer.encoding}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600 font-montserrat">Kemampuan:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(Array.isArray(printer.print_capabilities) ? printer.print_capabilities : []).map((capability, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg font-montserrat">
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                      {printer.last_connected && (
                        <div className="col-span-2">
                          <span className="text-gray-600 font-montserrat">Terakhir Terhubung:</span>
                          <p className="text-xs text-gray-500 font-montserrat mt-1">
                            {new Date(printer.last_connected).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={() => handleTestPrint(printer)}
                      disabled={isTestingPrint}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
                      variant="green"
                      title="Test Print"
                    >
                      {isTestingPrint ? (
                        <FaPrint className="w-4 h-4 animate-pulse" />
                      ) : (
                        <FaPrint className="w-4 h-4" />
                      )}
                      <span className="font-semibold font-montserrat">Test</span>
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handleEditPrinter(printer)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      variant="blue"
                      title="Edit Printer"
                    >
                      <FaEdit className="w-4 h-4" />
                      <span className="font-semibold font-montserrat">Edit</span>
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => handleDeletePrinter(printer.id)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      variant="red"
                      title="Hapus Printer"
                    >
                      <FaTrash className="w-4 h-4" />
                      <span className="font-semibold font-montserrat">Hapus</span>
                    </AnimatedButton>
                  </div>

                  {/* Set Default Button */}
                  {!printer.is_default && (
                    <div className="mt-3">
                      <AnimatedButton
                        onClick={() => handleSetDefault(printer.id)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                        variant="purple"
                      >
                        <span className="font-semibold font-montserrat">Set sebagai Default</span>
                      </AnimatedButton>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {printers.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaPrint className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 font-montserrat">Belum ada printer</h3>
                <p className="text-gray-500 text-sm font-montserrat mb-4">Tambahkan printer untuk mulai mencetak</p>
                <div className="text-xs text-gray-400 font-montserrat">
                  Klik "Cari Printer Bluetooth" di atas untuk menambahkan printer
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header - Fixed */}
            <div className="bg-white px-6 py-3 flex-shrink-0 border-b-2 border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 font-montserrat">
                  Tambah Printer
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Nama Printer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  placeholder="Contoh: Printer Kasir 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Pilih Cabang <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  disabled={userProfile?.user?.role === 'admin'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih cabang...</option>
                  {(branches || []).map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Nama Device
                </label>
                <input
                  type="text"
                  value={formData.device_name}
                  onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  placeholder="Contoh: RPP02"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Device ID
                </label>
                <input
                  type="text"
                  value={formData.device_id}
                  onChange={(e) => setFormData({...formData, device_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  placeholder="ID unik device"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Service UUID
                </label>
                <input
                  type="text"
                  value={formData.service_uuid}
                  onChange={(e) => setFormData({...formData, service_uuid: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  placeholder="Service UUID untuk Bluetooth"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                  Characteristic UUID
                </label>
                <input
                  type="text"
                  value={formData.characteristic_uuid}
                  onChange={(e) => setFormData({...formData, characteristic_uuid: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  placeholder="Characteristic UUID untuk Bluetooth"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                    Lebar Kertas
                  </label>
                  <select
                    value={formData.paper_width}
                    onChange={(e) => setFormData({...formData, paper_width: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  >
                    <option value={58}>58mm</option>
                    <option value={80}>80mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                    Encoding
                  </label>
                  <select
                    value={formData.encoding}
                    onChange={(e) => setFormData({...formData, encoding: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                  >
                    <option value="CP437">CP437</option>
                    <option value="UTF-8">UTF-8</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p>Pastikan Nama Printer dan Cabang diisi sebelum menyimpan.</p>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreatePrinter}
                  disabled={!formData.name || !formData.name.trim() || !formData.branch_id}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPrinter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaEdit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Edit Printer</h3>
                <p className="text-sm text-gray-500 font-montserrat">Hanya nama printer yang dapat diubah</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
            {/* Editable Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Nama Printer
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-all duration-200 hover:border-gray-300"
                placeholder="Contoh: Printer Kasir 1"
              />
            </div>

            {/* Branch Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Cabang
              </label>
              <select
                value={formData.branch_id}
                onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                disabled={userProfile?.user?.role === 'admin'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-all duration-200 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Pilih cabang...</option>
                {(branches || []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Read-only Information */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 font-montserrat">Informasi Device (Read-only)</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Nama Device</label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat">
                    {formData.device_name}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Device ID</label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat font-mono break-all">
                    {formData.device_id}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Service UUID</label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat font-mono break-all">
                    {formData.service_uuid}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Characteristic UUID</label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat font-mono break-all">
                    {formData.characteristic_uuid}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Lebar Kertas</label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat">
                      {formData.paper_width}mm
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">Encoding</label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-montserrat">
                      {formData.encoding}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <AnimatedButton
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPrinter(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl text-sm bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                variant="gray"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={handleUpdatePrinter}
                className="flex-1 px-6 py-3 rounded-xl text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                variant="blue"
              >
                Update
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Modal */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header - Fixed */}
            <div className="bg-white px-6 py-3 flex-shrink-0 border-b-2 border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 font-montserrat">
                  Perangkat Bluetooth Ditemukan
                </h3>
                <button
                  onClick={() => setShowDiscoveryModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="px-6 py-4 space-y-3 overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              {(discoveredDevices || []).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FaBluetooth className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-montserrat">Tidak ada perangkat ditemukan</p>
                </div>
              ) : (
                (discoveredDevices || []).map((device) => (
                  <div key={device.id} className="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaBluetooth className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm font-montserrat">{device.name}</p>
                        <p className="text-xs text-gray-500 font-montserrat">{device.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnectDevice(device.id)}
                      disabled={isConnecting}
                      className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isConnecting ? 'Menghubungkan...' : 'Hubungkan'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Explanation Modal */}
      <PrinterExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />
    </div>
  );
};

export default PrinterManagement;
