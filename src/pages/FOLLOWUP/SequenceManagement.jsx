import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Edit, Trash2, Users, MessageSquare, Clock } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';
import TutorialModal from './TutorialModal';
import instance from '../../config/api';

const SequenceManagement = () => {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load sequences
  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/followup-sequences');
      
      if (response.data.success) {
        setSequences(response.data.data.sequences || []);
      }
    } catch (error) {
      console.error('Error loading sequences:', error);
      alert('Gagal memuat data sequences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSequence = async (sequence) => {
    try {
      setActionLoading(true);
      const newStatus = !sequence.is_active;
      
      const response = await instance.put(`/followup-sequences/${sequence.id}`, {
        is_active: newStatus
      });

      if (response.data.success) {
        // Update local state
        setSequences(prev => prev.map(seq => 
          seq.id === sequence.id 
            ? { ...seq, is_active: newStatus }
            : seq
        ));
        
        alert(`Sequence ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} berhasil`);
      }
    } catch (error) {
      console.error('Error toggling sequence:', error);
      alert('Gagal mengubah status sequence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSequence = async () => {
    if (!selectedSequence) return;

    try {
      setActionLoading(true);
      const response = await instance.delete(`/followup-sequences/${selectedSequence.id}`);

      if (response.data.success) {
        // Remove from local state
        setSequences(prev => prev.filter(seq => seq.id !== selectedSequence.id));
        alert('Sequence berhasil dihapus');
        setShowDeleteModal(false);
        setSelectedSequence(null);
      }
    } catch (error) {
      console.error('Error deleting sequence:', error);
      alert('Gagal menghapus sequence: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getSequenceStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSequenceStatusIcon = (isActive) => {
    return isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat sequences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Follow-Up Sequences"
        description="Kelola sequence follow-up otomatis"
        showBackButton={true}
        currentTime={currentTime}
        backPath={'/beranda-marketing'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-24">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {sequences.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {sequences.filter(seq => seq.is_active).length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Aktif</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {sequences.reduce((total, seq) => total + (seq.templates?.length || 0), 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Template</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Sequence Button */}
            <div className="mb-4 sm:mb-6">
              <AnimatedButton
                onClick={() => navigate('/followup/sequences/create')}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-montserrat font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                variant="blue"
              >
                <Plus className="w-4 h-4" />
                Buat Sequence Baru
              </AnimatedButton>
            </div>

            {/* Sequences List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Daftar Sequences
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {sequences.length > 0 ? (
                  sequences.map((sequence) => (
                    <div key={sequence.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 font-montserrat truncate">
                              {sequence.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSequenceStatusColor(sequence.is_active)}`}>
                                {getSequenceStatusIcon(sequence.is_active)}
                                {sequence.is_active ? 'Aktif' : 'Nonaktif'}
                              </div>
                              {sequence.is_default && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  ⭐ Default
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 font-montserrat mb-2 sm:mb-3 line-clamp-2">
                            {sequence.description || 'Tidak ada deskripsi'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 font-montserrat">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{sequence.templates?.length || 0} template</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">0 customer aktif</span>
                              <span className="sm:hidden">0 aktif</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Dibuat {new Date(sequence.createdAt).toLocaleDateString('id-ID')}</span>
                              <span className="sm:hidden">{new Date(sequence.createdAt).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-center">
                          <AnimatedButton
                            onClick={() => navigate(`/followup/sequences/${sequence.id}`)}
                            className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat detail"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </AnimatedButton>

                          <AnimatedButton
                            onClick={() => handleToggleSequence(sequence)}
                            disabled={actionLoading}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                              sequence.is_active
                                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={sequence.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {sequence.is_active ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </AnimatedButton>

                          {!sequence.is_default && (
                            <AnimatedButton
                              onClick={() => {
                                setSelectedSequence(sequence);
                                setShowDeleteModal(true);
                              }}
                              disabled={actionLoading}
                              className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus sequence"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </AnimatedButton>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 font-montserrat mb-2">
                      Belum Ada Sequence
                    </h3>
                    <p className="text-sm text-gray-600 font-montserrat mb-4 sm:mb-6 max-w-sm mx-auto px-4">
                      Buat sequence pertama untuk memulai follow-up otomatis
                    </p>
                    
                    {/* Tutorial Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-purple-200 max-w-md mx-auto">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm">?</span>
                        </div>
                        <h4 className="font-semibold text-purple-800 font-montserrat text-sm sm:text-base">Baru pertama kali?</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-purple-700 font-montserrat mb-3 line-clamp-2">
                        Pelajari cara kerja follow-up otomatis dalam 5 menit. Dijamin mudah dipahami!
                      </p>
                      <AnimatedButton
                        onClick={() => setShowTutorialModal(true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-montserrat font-medium flex items-center gap-1 sm:gap-2 mx-auto text-xs sm:text-sm"
                        variant="purple"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="hidden sm:inline">Baca Panduan Dulu</span>
                        <span className="sm:hidden">Panduan</span>
                      </AnimatedButton>
                    </div>

                    <AnimatedButton
                      onClick={() => navigate('/followup/sequences/create')}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium flex items-center gap-2 mx-auto text-sm"
                      variant="blue"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Buat Sequence Pertama</span>
                      <span className="sm:hidden">Buat Sequence</span>
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSequence(null);
        }}
        onConfirm={handleDeleteSequence}
        title="Hapus Sequence"
        message={`Apakah Anda yakin ingin menghapus sequence "${selectedSequence?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        isLoading={actionLoading}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
    </div>
  );
};

export default SequenceManagement;
