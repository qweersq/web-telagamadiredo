import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../../components/Design/AnimatedButton';
import api from '../../config/api';
import { FaArrowLeft, FaEye, FaCheck, FaTimes, FaClock, FaUser, FaBuilding } from 'react-icons/fa';

const SuperAppFeedbackManagement = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    pending: <FaClock className="w-4 h-4" />,
    in_progress: <FaEye className="w-4 h-4" />,
    resolved: <FaCheck className="w-4 h-4" />,
    closed: <FaTimes className="w-4 h-4" />
  };

  const fetchFeedbacks = async (page = 1, status = 'all', append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await api.get(`/feedback?${params.toString()}`);
      
      if (response.data.success) {
        const newFeedbacks = response.data.data.feedbacks;
        const pagination = response.data.data.pagination;
        
        if (append) {
          setFeedbacks(prev => [...prev, ...newFeedbacks]);
        } else {
          setFeedbacks(newFeedbacks);
        }
        
        setTotalPages(pagination.total_pages);
        setCurrentPage(pagination.current_page);
        setHasMore(pagination.current_page < pagination.total_pages);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      alert('Gagal memuat data feedback');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      const response = await api.put(`/feedback/${feedbackId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        // Update local state
        setFeedbacks(prev => 
          prev.map(feedback => 
            feedback.id === feedbackId 
              ? { ...feedback, status: newStatus }
              : feedback
          )
        );
        
        // Update selected feedback if it's the same
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
          setSelectedFeedback(prev => ({ ...prev, status: newStatus }));
        }
        
        alert('Status feedback berhasil diupdate');
      } else {
        throw new Error(response.data.error?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating feedback status:', error);
      alert('Gagal mengupdate status feedback');
    }
  };

  useEffect(() => {
    setFeedbacks([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchFeedbacks(1, statusFilter);
  }, [statusFilter]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchFeedbacks(currentPage + 1, statusFilter, true);
    }
  };

  const handleStatusChange = (feedbackId, newStatus) => {
    if (window.confirm(`Yakin ingin mengubah status menjadi ${newStatus}?`)) {
      updateFeedbackStatus(feedbackId, newStatus);
    }
  };

  const handleViewDetail = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <AnimatedButton
              onClick={() => navigate(-1)}
              variant="grey"
              className="p-2 rounded-lg"
            >
              <FaArrowLeft className="w-5 h-5" />
            </AnimatedButton>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-montserrat">
                Feedback Management
              </h1>
              <p className="text-gray-600 font-montserrat">
                Kelola feedback dari semua tenant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 font-montserrat">
              Filter Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-montserrat">Memuat data...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-montserrat">Tidak ada feedback ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 font-montserrat">
                          {feedback.subject}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[feedback.status]}`}>
                          {statusIcons[feedback.status]}
                          {getStatusLabel(feedback.status)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 font-montserrat text-sm mb-3 line-clamp-2">
                        {feedback.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-montserrat">
                        <div className="flex items-center gap-1">
                          <FaUser className="w-3 h-3" />
                          {feedback.user?.name || 'Unknown User'}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaBuilding className="w-3 h-3" />
                          {feedback.tenant?.business_name || 'Unknown Tenant'}
                        </div>
                        <div>
                          {formatDate(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <AnimatedButton
                        onClick={() => handleViewDetail(feedback)}
                        variant="blue"
                        className="px-3 py-1 text-xs font-montserrat flex items-center"
                      >
                        <FaEye className="w-3 h-3 mr-1" />
                        Detail
                      </AnimatedButton>
                      
                      <select
                        value={feedback.status}
                        onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent font-montserrat"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <AnimatedButton
              onClick={handleLoadMore}
              variant="blue"
              className="px-6 py-3 font-montserrat font-semibold flex items-center gap-2"
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memuat...
                </>
              ) : (
                'Load More'
              )}
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Detail Feedback
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                    Subject
                  </label>
                  <p className="text-gray-900 font-montserrat">{selectedFeedback.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                    Message
                  </label>
                  <p className="text-gray-900 font-montserrat whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                      User
                    </label>
                    <p className="text-gray-900 font-montserrat">
                      {selectedFeedback.user?.name || 'Unknown User'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                      Tenant
                    </label>
                    <p className="text-gray-900 font-montserrat">
                      {selectedFeedback.tenant?.business_name || 'Unknown Tenant'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                      Status
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusColors[selectedFeedback.status]}`}>
                      {statusIcons[selectedFeedback.status]}
                      {getStatusLabel(selectedFeedback.status)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-1">
                      Created At
                    </label>
                    <p className="text-gray-900 font-montserrat">
                      {formatDate(selectedFeedback.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <AnimatedButton
                  onClick={() => setShowDetailModal(false)}
                  variant="grey"
                  className="px-4 py-2 font-montserrat"
                >
                  Tutup
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAppFeedbackManagement;
