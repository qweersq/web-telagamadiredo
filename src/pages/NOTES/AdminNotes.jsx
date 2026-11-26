import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, ChevronDown, Circle, X, Check } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getUserProfile } from '../../utils/userProfileHelper';
import { formatDate } from '../../utils/labelFormatter';
import instance from '../../config/api';

const AdminNotes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [branchId, setBranchId] = useState(null);
  const [markingDone, setMarkingDone] = useState({});
  const [reopeningNote, setReopeningNote] = useState({});
  const [updatingPriority, setUpdatingPriority] = useState({});
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState({});
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('pending'); // Default: pending
  const [selectedNote, setSelectedNote] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Handle modal open/close with body overflow
  useEffect(() => {
    if (showNoteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showNoteModal]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showNoteModal) {
        setShowNoteModal(false);
      }
    };

    if (showNoteModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNoteModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getUserProfile();

        // Fetch notes
        if (profile?.branch?.id) {
          setBranchId(profile.branch.id);
          const response = await instance.get('/admin-notes', {
            params: {
              page: 1,
              pageSize: 50,
              branch_id: profile.branch.id,
              status: statusFilter === 'all' ? 'all' : statusFilter
            }
          });

          if (response.data?.success) {
            setNotes(response.data.data.notes || []);
          }
        }

        // Fetch pending count
        if (profile?.branch?.id) {
          const countResponse = await instance.get('/admin-notes/pending-count', {
            params: {
              branch_id: profile.branch.id
            }
          });
          
          if (countResponse.data?.success) {
            setPendingCount(countResponse.data.data.count || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setPriorityDropdownOpen({});
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Truncate content for preview
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Format relative date (Hari ini, Kemarin, 2 hari lalu, etc)
  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today - noteDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays > 1 && diffDays <= 30) return `${diffDays} hari lalu`;
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      if (months === 1) return '1 bulan lalu';
      return `${months} bulan lalu`;
    }
    return formatDate(dateString, { format: 'short' });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle mark as done
  const handleMarkAsDone = async (noteId, e) => {
    e.stopPropagation(); // Prevent card click
    setMarkingDone(prev => ({ ...prev, [noteId]: true }));
    
    try {
      const response = await instance.put(`/admin-notes/${noteId}/mark-done`);
      
      if (response.data?.success) {
        // Refresh notes list and pending count
        const profile = await getUserProfile();
        if (profile?.branch?.id) {
          const [notesResponse, countResponse] = await Promise.all([
            instance.get('/admin-notes', {
              params: {
                page: 1,
                pageSize: 50,
                branch_id: profile.branch.id,
                status: 'all'
              }
            }),
            instance.get('/admin-notes/pending-count', {
              params: {
                branch_id: profile.branch.id
              }
            })
          ]);
          
          if (notesResponse.data?.success) {
            setNotes(notesResponse.data.data.notes || []);
          }
          
          if (countResponse.data?.success) {
            setPendingCount(countResponse.data.data.count || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error marking note as done:', error);
      alert('Gagal menandai catatan sebagai selesai');
    } finally {
      setMarkingDone(prev => ({ ...prev, [noteId]: false }));
    }
  };

  // Handle update priority
  const handleUpdatePriority = async (noteId, newPriority, e) => {
    if (e) e.stopPropagation();
    setUpdatingPriority(prev => ({ ...prev, [noteId]: true }));
    setPriorityDropdownOpen(prev => ({ ...prev, [noteId]: false }));
    
    try {
      const response = await instance.put(`/admin-notes/${noteId}`, {
        priority: newPriority
      });
      
      if (response.data?.success) {
        // Refresh notes list
        const profile = await getUserProfile();
        if (profile?.branch?.id) {
          const [notesResponse, countResponse] = await Promise.all([
            instance.get('/admin-notes', {
              params: {
                page: 1,
                pageSize: 50,
                branch_id: profile.branch.id,
                status: statusFilter === 'all' ? 'all' : statusFilter
              }
            }),
            instance.get('/admin-notes/pending-count', {
              params: {
                branch_id: profile.branch.id
              }
            })
          ]);
          
          if (notesResponse.data?.success) {
            setNotes(notesResponse.data.data.notes || []);
          }
        }
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Gagal mengubah prioritas');
    } finally {
      setUpdatingPriority(prev => ({ ...prev, [noteId]: false }));
    }
  };

  // Toggle priority dropdown
  const togglePriorityDropdown = (noteId, e) => {
    if (e) e.stopPropagation();
    setPriorityDropdownOpen(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white border-b border-gray-300 px-4 md:px-10 py-4 relative"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/berandakasir')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Kembali"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-[#2C2C2C]">Catatan Admin</h1>
          </div>
          <AnimatedButton
            onClick={() => navigate('/admin-notes/new')}
            variant="blue"
            className="p-2 flex items-center justify-center shadow-sm hover:shadow-md"
            title="Tambah Catatan"
          >
            <Plus size={18} />
          </AnimatedButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Tab Filter - Notebook Style */}
            <div className="mb-6 flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2.5 text-sm transition-all relative ${
                  statusFilter === 'pending'
                    ? 'bg-transparent text-[#2C2C2C] font-bold border-b-2'
                    : 'text-[#4A4A4A] hover:text-[#2C2C2C] font-medium'
                }`}
                style={{
                  borderBottom: statusFilter === 'pending' ? '2px solid #5096FC' : '1px solid transparent',
                  borderBottomStyle: statusFilter === 'pending' ? 'solid' : 'dashed'
                }}
              >
                Pending
                {pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded-full border border-red-200">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-4 py-2.5 text-sm transition-all ${
                  statusFilter === 'done'
                    ? 'bg-transparent text-[#2C2C2C] font-bold border-b-2'
                    : 'text-[#4A4A4A] hover:text-[#2C2C2C] font-medium'
                }`}
                style={{
                  borderBottom: statusFilter === 'done' ? '2px solid #5096FC' : '1px solid transparent',
                  borderBottomStyle: statusFilter === 'done' ? 'solid' : 'dashed'
                }}
              >
                Selesai
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2.5 text-sm transition-all ${
                  statusFilter === 'all'
                    ? 'bg-transparent text-[#2C2C2C] font-bold border-b-2'
                    : 'text-[#4A4A4A] hover:text-[#2C2C2C] font-medium'
                }`}
                style={{
                  borderBottom: statusFilter === 'all' ? '2px solid #5096FC' : '1px solid transparent',
                  borderBottomStyle: statusFilter === 'all' ? 'solid' : 'dashed'
                }}
              >
                Semua
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
                  <p className="text-[#4A4A4A]">
                    {statusFilter === 'pending' 
                      ? 'Tidak ada catatan pending' 
                      : statusFilter === 'done'
                      ? 'Tidak ada catatan selesai'
                      : 'Belum ada catatan'}
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden pl-4 pr-6 py-6"
                    onClick={() => {
                      setSelectedNote(note);
                      setShowNoteModal(true);
                    }}
                  >
                    {/* Left Border - Blue Accent */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-400 w-2 rounded-l-lg"
                    />

                    {/* Content */}
                    <div className="relative ml-4">
                      {/* Title with Relative Date (top right) */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 
                          className="text-lg font-semibold text-[#2C2C2C] flex-1"
                          style={{ 
                            lineHeight: '24px'
                          }}
                        >
                          {note.title}
                        </h3>
                        
                        {/* Relative Date - Top Right */}
                        <span className="text-[10px] text-[#4A4A4A] ml-2 px-2 py-0.5 border border-gray-300 rounded" style={{ 
                          whiteSpace: 'nowrap'
                        }}>
                          {formatRelativeDate(note.createdAt)}
                        </span>
                      </div>

                      {/* Created By - Above Content */}
                      <div className="mb-2">
                        <span className="text-[10px] text-[#4A4A4A]">
                          Dibuat oleh {note.creator?.name || 'Unknown'}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <p 
                        className="text-[#4A4A4A] text-xs mb-3"
                        style={{ 
                          lineHeight: '20px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {note.content || ''}
                      </p>

                      {/* Footer - Priority and Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200" style={{ borderTopStyle: 'dashed', borderTopWidth: '1px' }}>
                        {/* Priority Dropdown - Left */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#4A4A4A]">Prioritas:</span>
                          <div className="relative">
                            <button
                              onClick={(e) => togglePriorityDropdown(note.id, e)}
                              className={`inline-flex items-center text-[10px] font-medium ${
                                note.priority === 'high' 
                                  ? 'text-red-600' 
                                  : note.priority === 'normal' 
                                  ? 'text-blue-600' 
                                  : 'text-gray-600'
                              } hover:opacity-80 transition-opacity`}
                              style={{ 
                                borderBottom: `1px solid ${
                                  note.priority === 'high' 
                                    ? '#EF4444' 
                                    : note.priority === 'normal' 
                                    ? '#3B82F6' 
                                    : '#6B7280'
                                }`,
                                paddingBottom: '1px',
                                cursor: 'pointer'
                              }}
                            >
                              <span className="mr-1" style={{ fontSize: '10px' }}>
                                {note.priority === 'high' ? '🔴' : note.priority === 'normal' ? '🔵' : '⚪'}
                              </span>
                              <span>
                                {note.priority === 'high' 
                                  ? 'Urgent' 
                                  : note.priority === 'normal' 
                                  ? 'Normal' 
                                  : 'Tidak Urgent'}
                              </span>
                              <ChevronDown size={10} className="ml-1" />
                            </button>

                            {/* Priority Dropdown Menu */}
                            {priorityDropdownOpen[note.id] && (
                              <div 
                                className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[120px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleUpdatePriority(note.id, 'low', e)}
                                  disabled={updatingPriority[note.id]}
                                  className={`w-full text-left px-3 py-2 text-[10px] hover:bg-gray-50 flex items-center gap-2 ${
                                    note.priority === 'low' ? 'bg-gray-50 font-semibold' : ''
                                  }`}
                                >
                                  <span>⚪</span>
                                  <span>Tidak Urgent</span>
                                </button>
                                <button
                                  onClick={(e) => handleUpdatePriority(note.id, 'normal', e)}
                                  disabled={updatingPriority[note.id]}
                                  className={`w-full text-left px-3 py-2 text-[10px] hover:bg-gray-50 flex items-center gap-2 ${
                                    note.priority === 'normal' ? 'bg-gray-50 font-semibold' : ''
                                  }`}
                                >
                                  <span>🔵</span>
                                  <span>Normal</span>
                                </button>
                                <button
                                  onClick={(e) => handleUpdatePriority(note.id, 'high', e)}
                                  disabled={updatingPriority[note.id]}
                                  className={`w-full text-left px-3 py-2 text-[10px] hover:bg-gray-50 flex items-center gap-2 ${
                                    note.priority === 'high' ? 'bg-gray-50 font-semibold' : ''
                                  }`}
                                >
                                  <span>🔴</span>
                                  <span>Urgent</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Display - Right */}
                        <div className="flex items-center gap-2">
                          {note.status === 'pending' ? (
                            <span className="text-[10px] text-yellow-600 font-medium">
                              Pending
                            </span>
                          ) : (
                            <span className={`text-[10px] font-medium ${
                              note.status === 'done' 
                                ? 'text-blue-600' 
                                : 'text-gray-600'
                            }`}>
                              {note.status === 'done' ? 'Selesai' : 'Archived'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Note Detail Modal */}
      {showNoteModal && selectedNote && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNoteModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed/Floating */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-white">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{selectedNote.title}</h2>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  navigate(`/admin-notes/${selectedNote.id}/edit`);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                title="Edit"
              >
                <Edit size={18} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto p-6 bg-white"
            >
              {/* Info */}
              <div className="mb-4">
                <div className="flex items-center gap-3 flex-wrap text-sm text-[#4A4A4A]">
                  <span>Dibuat oleh: {selectedNote.creator?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{formatRelativeDate(selectedNote.createdAt)}</span>
                </div>
              </div>

              {/* Priority Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedNote.priority === 'high' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : selectedNote.priority === 'normal' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {selectedNote.priority === 'high' ? '🔴 Urgent' : selectedNote.priority === 'normal' ? '🔵 Normal' : '⚪ Tidak Urgent'}
                </span>
                <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedNote.status === 'done' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : selectedNote.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {selectedNote.status === 'done' ? 'Selesai' : selectedNote.status === 'pending' ? 'Pending' : 'Archived'}
                </span>
              </div>

              {/* Customer & Order Info */}
              {(selectedNote.customer || selectedNote.order) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {selectedNote.customer && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">Customer:</span>
                      <span className="ml-2 text-sm text-gray-700">
                        {selectedNote.customer.name} {selectedNote.customer.phone && `(${selectedNote.customer.phone})`}
                      </span>
                    </div>
                  )}
                  {selectedNote.order && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Order:</span>
                      <span className="ml-2 text-sm text-gray-700">
                        Order #{selectedNote.order.id}
                        {selectedNote.order.customer && ` • ${selectedNote.order.customer.name}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                <div 
                  className="text-[#4A4A4A] text-sm whitespace-pre-wrap"
                  style={{ 
                    lineHeight: '24px'
                  }}
                >
                  {selectedNote.content}
                </div>
              </div>

              {/* Footer Info */}
              {selectedNote.done_by && selectedNote.done_at && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-700">
                    <span className="font-medium">Selesai oleh:</span> {selectedNote.doneBy?.name || 'Unknown'}
                    <span className="ml-2">•</span>
                    <span className="ml-2">{formatDate(selectedNote.done_at, { format: 'short' })}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer - Fixed */}
            <div className="flex justify-between items-center gap-3 p-4 border-t border-gray-200 flex-shrink-0 bg-white" style={{ borderTopStyle: 'dashed', borderTopWidth: '1px' }}>
              <AnimatedButton
                type="button"
                onClick={() => setShowNoteModal(false)}
                variant="transparent"
                className="px-4 py-2"
              >
                Tutup
              </AnimatedButton>
              {selectedNote.status === 'pending' && (
                <AnimatedButton
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      setMarkingDone(prev => ({ ...prev, [selectedNote.id]: true }));
                      const response = await instance.put(`/admin-notes/${selectedNote.id}/mark-done`);
                      
                      if (response.data?.success) {
                        // Refresh notes list and pending count
                        const profile = await getUserProfile();
                        if (profile?.branch?.id) {
                          const [notesResponse, countResponse] = await Promise.all([
                            instance.get('/admin-notes', {
                              params: {
                                page: 1,
                                pageSize: 50,
                                branch_id: profile.branch.id,
                                status: statusFilter === 'all' ? 'all' : statusFilter
                              }
                            }),
                            instance.get('/admin-notes/pending-count', {
                              params: {
                                branch_id: profile.branch.id
                              }
                            })
                          ]);
                          
                          if (notesResponse.data?.success) {
                            setNotes(notesResponse.data.data.notes || []);
                          }
                          
                          if (countResponse.data?.success) {
                            setPendingCount(countResponse.data.data.count || 0);
                          }
                        }
                        // Update selected note
                        setSelectedNote(prev => prev ? { ...prev, status: 'done', done_by: response.data.data.done_by, done_at: response.data.data.done_at } : null);
                      }
                    } catch (error) {
                      console.error('Error marking note as done:', error);
                      alert('Gagal menandai catatan sebagai selesai');
                    } finally {
                      setMarkingDone(prev => ({ ...prev, [selectedNote.id]: false }));
                    }
                  }}
                  disabled={markingDone[selectedNote.id]}
                  variant="blue"
                  className="px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={14} />
                  <span>Tandai Selesai</span>
                </AnimatedButton>
              )}
              {selectedNote.status === 'done' && (
                <AnimatedButton
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      setReopeningNote(prev => ({ ...prev, [selectedNote.id]: true }));
                      const response = await instance.put(`/admin-notes/${selectedNote.id}`, {
                        status: 'pending'
                      });
                      
                      if (response.data?.success) {
                        // Refresh notes list and pending count
                        const profile = await getUserProfile();
                        if (profile?.branch?.id) {
                          const [notesResponse, countResponse] = await Promise.all([
                            instance.get('/admin-notes', {
                              params: {
                                page: 1,
                                pageSize: 50,
                                branch_id: profile.branch.id,
                                status: statusFilter === 'all' ? 'all' : statusFilter
                              }
                            }),
                            instance.get('/admin-notes/pending-count', {
                              params: {
                                branch_id: profile.branch.id
                              }
                            })
                          ]);
                          
                          if (notesResponse.data?.success) {
                            setNotes(notesResponse.data.data.notes || []);
                          }
                          
                          if (countResponse.data?.success) {
                            setPendingCount(countResponse.data.data.count || 0);
                          }
                        }
                        // Update selected note
                        setSelectedNote(prev => prev ? { ...prev, status: 'pending', done_by: null, done_at: null } : null);
                      }
                    } catch (error) {
                      console.error('Error reopening note:', error);
                      alert('Gagal mengembalikan catatan ke pending');
                    } finally {
                      setReopeningNote(prev => ({ ...prev, [selectedNote.id]: false }));
                    }
                  }}
                  disabled={reopeningNote[selectedNote.id]}
                  variant="orange"
                  className="px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} />
                  <span>Kembalikan ke Pending</span>
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotes;
