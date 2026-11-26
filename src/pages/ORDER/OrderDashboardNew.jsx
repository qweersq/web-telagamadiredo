import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  ArrowLeft, 
  Phone, 
  MessageCircle,
  Eye,
  Calendar,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Zap,
  Star,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { X } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photoUrlHelper';


const OrderDashboardNew = () => {
  const navigate = useNavigate();
  
  // State untuk UI
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickStats, setShowQuickStats] = useState(true);
  const [showPriorityAlerts, setShowPriorityAlerts] = useState(true);
  
  // Hardcoded data untuk demo
  const quickStats = {
    totalOrders: 15,
    totalRevenue: 2500000,
    urgentOrders: 3,
    completedOrders: 12,
    unpaidOrders: 5,
    inProgressOrders: 7
  };

  const priorityAlerts = [
    {
      id: 1,
      orderId: 'ORD-1234',
      customerName: 'John Doe',
      issue: 'Overdue 2 days',
      priority: 'high',
      amount: 150000,
      status: 'overdue'
    },
    {
      id: 2,
      orderId: 'ORD-1235',
      customerName: 'Jane Smith',
      issue: 'Payment pending Rp 150k',
      priority: 'medium',
      amount: 150000,
      status: 'unpaid'
    },
    {
      id: 3,
      orderId: 'ORD-1236',
      customerName: 'Mike Johnson',
      issue: 'QC failed, needs rework',
      priority: 'high',
      amount: 200000,
      status: 'qc_failed'
    }
  ];

  const sampleOrders = [
    {
      id: 'ORD-1234',
      customer: {
        name: 'John Doe',
        phone: '0812-3456-7890'
      },
      totalPrice: 150000,
      paymentStatus: 'dp',
      orderDetailStatus: 'on_progress',
      entryDate: '2024-01-15',
      dueDate: '2024-01-17',
      isOverdue: true,
      daysOverdue: 2,
      photos: [
        'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=Nike',
        'https://via.placeholder.com/100x100/059669/FFFFFF?text=Air',
        'https://via.placeholder.com/100x100/DC2626/FFFFFF?text=Max'
      ],
      orderDetails: [
        { treatment: { name: 'Deep Clean' }, status: 'on_progress' },
        { treatment: { name: 'Whitening' }, status: 'pending' }
      ],
      creator: { name: 'Alvan' }
    },
    {
      id: 'ORD-1235',
      customer: {
        name: 'Jane Smith',
        phone: '0813-4567-8901'
      },
      totalPrice: 200000,
      paymentStatus: 'unpaid',
      orderDetailStatus: 'pengeringan',
      entryDate: '2024-01-16',
      dueDate: '2024-01-18',
      isOverdue: false,
      photos: [
        'https://via.placeholder.com/100x100/7C3AED/FFFFFF?text=Adidas',
        'https://via.placeholder.com/100x100/EA580C/FFFFFF?text=Stan'
      ],
      orderDetails: [
        { treatment: { name: 'Deep Clean' }, status: 'done' },
        { treatment: { name: 'Color Restoration' }, status: 'pengeringan' }
      ],
      creator: { name: 'Hans' }
    },
    {
      id: 'ORD-1236',
      customer: {
        name: 'Mike Johnson',
        phone: '0814-5678-9012'
      },
      totalPrice: 180000,
      paymentStatus: 'paid',
      orderDetailStatus: 'not_ready',
      entryDate: '2024-01-14',
      dueDate: '2024-01-16',
      isOverdue: true,
      daysOverdue: 1,
      photos: [
        'https://via.placeholder.com/100x100/0891B2/FFFFFF?text=Converse',
        'https://via.placeholder.com/100x100/CA8A04/FFFFFF?text=Chuck'
      ],
      orderDetails: [
        { treatment: { name: 'Deep Clean' }, status: 'not_ready' },
        { treatment: { name: 'Sole Repair' }, status: 'pending' }
      ],
      creator: { name: 'Izar' }
    },
    {
      id: 'ORD-1237',
      customer: {
        name: 'Sarah Wilson',
        phone: '0815-6789-0123'
      },
      totalPrice: 120000,
      paymentStatus: 'paid',
      orderDetailStatus: 'siap',
      entryDate: '2024-01-17',
      dueDate: '2024-01-19',
      isOverdue: false,
      photos: [
        'https://via.placeholder.com/100x100/DB2777/FFFFFF?text=Vans',
        'https://via.placeholder.com/100x100/059669/FFFFFF?text=Old'
      ],
      orderDetails: [
        { treatment: { name: 'Deep Clean' }, status: 'done' },
        { treatment: { name: 'Deodorizing' }, status: 'done' }
      ],
      creator: { name: 'Bella' }
    },
    {
      id: 'ORD-1238',
      customer: {
        name: 'David Brown',
        phone: '0816-7890-1234'
      },
      totalPrice: 250000,
      paymentStatus: 'dp',
      orderDetailStatus: 'antrian',
      entryDate: '2024-01-18',
      dueDate: '2024-01-20',
      isOverdue: false,
      photos: [
        'https://via.placeholder.com/100x100/7C2D12/FFFFFF?text=Jordan',
        'https://via.placeholder.com/100x100/1E40AF/FFFFFF?text=Air'
      ],
      orderDetails: [
        { treatment: { name: 'Deep Clean' }, status: 'antrian' },
        { treatment: { name: 'Color Restoration' }, status: 'pending' },
        { treatment: { name: 'Sole Repair' }, status: 'pending' }
      ],
      creator: { name: 'Fatiq' }
    }
  ];

  const filterTabs = [
    { id: 'all', label: 'All', count: sampleOrders.length, icon: Package },
    { id: 'urgent', label: 'Urgent', count: priorityAlerts.length, icon: AlertTriangle },
    { id: 'unpaid', label: 'Unpaid', count: quickStats.unpaidOrders, icon: DollarSign },
    { id: 'progress', label: 'In Progress', count: quickStats.inProgressOrders, icon: RefreshCw },
    { id: 'done', label: 'Done', count: quickStats.completedOrders, icon: CheckCircle }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-700 border-green-300';
      case 'on_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pengeringan': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'siap': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'not_ready': return 'bg-red-100 text-red-700 border-red-300';
      case 'antrian': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-300';
      case 'unpaid': return 'bg-red-100 text-red-700 border-red-300';
      case 'dp': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on_progress': return 'Proses';
      case 'pengeringan': return 'Pengeringan';
      case 'siap': return 'Siap';
      case 'not_ready': return 'Tidak Lolos QC';
      case 'antrian': return 'Antrian';
      case 'done': return 'Selesai';
      default: return status;
    }
  };

  const getPaymentLabel = (status) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'unpaid': return 'Belum Lunas';
      case 'dp': return 'DP';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOrders = sampleOrders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'urgent') return order.isOverdue;
    if (activeTab === 'unpaid') return order.paymentStatus === 'unpaid';
    if (activeTab === 'progress') return ['on_progress', 'pengeringan', 'antrian'].includes(order.orderDetailStatus);
    if (activeTab === 'done') return order.orderDetailStatus === 'done';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] shadow-sm border-b rounded-b-3xl">
        <div className="flex items-center justify-between px-4 py-4 relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/berandakasir')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow border border-blue-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          
          <div className="flex-1 flex items-center text-center justify-center">
            <h1 className="text-lg font-semibold sm:text-3xl font-montserrat text-center font-normal text-white tracking-wide drop-shadow-md">
              Order Management
            </h1>
          </div>
          
          {/* Quick Order Button */}
          <button
            onClick={() => navigate('/quick-order')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow border border-blue-100 transition-all duration-200 hover:scale-110"
            aria-label="Quick Order"
            title="Quick Order"
          >
            <Plus className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar - Always Visible */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 mx-2 mt-2 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">{quickStats.totalOrders}</span>
              <span className="text-xs text-gray-500">Orders</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Rp {quickStats.totalRevenue.toLocaleString()}</span>
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-gray-700">{quickStats.urgentOrders}</span>
              <span className="text-xs text-gray-500">Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">{quickStats.completedOrders}</span>
              <span className="text-xs text-gray-500">Done</span>
            </div>
          </div>
          <button 
            onClick={() => setShowQuickStats(!showQuickStats)}
            className="text-blue-500 text-xs hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            {showQuickStats ? 'Hide Details' : 'Show Details'}
            {showQuickStats ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Expandable Stats Details */}
        {showQuickStats && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-blue-50 p-3 rounded-lg">
                <div className="font-bold text-blue-600 text-lg">{quickStats.totalOrders}</div>
                <div className="text-gray-600 text-xs">Total Orders</div>
              </div>
              <div className="text-center bg-green-50 p-3 rounded-lg">
                <div className="font-bold text-green-600 text-lg">{quickStats.completedOrders}</div>
                <div className="text-gray-600 text-xs">Completed</div>
              </div>
              <div className="text-center bg-red-50 p-3 rounded-lg">
                <div className="font-bold text-red-600 text-lg">{quickStats.urgentOrders}</div>
                <div className="text-gray-600 text-xs">Urgent</div>
              </div>
              <div className="text-center bg-yellow-50 p-3 rounded-lg">
                <div className="font-bold text-yellow-600 text-lg">{quickStats.unpaidOrders}</div>
                <div className="text-gray-600 text-xs">Unpaid</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Alerts Section */}
      {showPriorityAlerts && priorityAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 mx-2 mt-2 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">🚨 URGENT ACTIONS NEEDED</h3>
            </div>
            <button 
              onClick={() => setShowPriorityAlerts(false)}
              className="text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {priorityAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{alert.orderId}</div>
                    <div className="text-sm text-gray-600">{alert.customerName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">{alert.issue}</div>
                  <div className="text-xs text-gray-500">Rp {alert.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="🔍 Search by: Customer Name, Order ID, Phone, Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Order List */}
      <div className="px-4 mt-4 space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg font-montserrat tracking-wide">
                      {order.id}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium">Order Details</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Payment Status Badge */}
                  <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {getPaymentLabel(order.paymentStatus)}
                  </span>
                  
                  {/* Order Status Badge */}
                  <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(order.orderDetailStatus)}`}>
                    {getStatusLabel(order.orderDetailStatus)}
                  </span>
                  
                  {/* Overdue Badge */}
                  {order.isOverdue && (
                    <span className="px-3 py-1 rounded-full border text-xs font-semibold bg-red-100 text-red-700 border-red-300">
                      ⚠️ {order.daysOverdue} days overdue
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{order.customer.name}</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaWhatsapp className="w-4 h-4" />
                        <span>{order.customer.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">Entry Date</div>
                  <div className="font-medium text-gray-700">{formatDate(order.entryDate)}</div>
                  {order.dueDate && (
                    <>
                      <div className="text-sm text-gray-500 mt-1">Due Date</div>
                      <div className={`font-medium ${order.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatDate(order.dueDate)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Photos Preview */}
              {order.photos && order.photos.length > 0 && (
                <div className="mb-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {order.photos.slice(0, 4).map((url, idx) => {
                      // Normalize URL menggunakan getPhotoUrl untuk handle relative/absolute URLs
                      const normalizedUrl = getPhotoUrl(url);
                      return (
                        <img
                          key={idx}
                          src={normalizedUrl}
                          alt={`Order Photo ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                          onError={(e) => {
                            // Fallback jika gambar gagal load
                            e.target.style.display = 'none';
                          }}
                        />
                      );
                    })}
                    {order.photos.length > 4 && (
                      <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 text-gray-500 font-semibold text-xs border border-gray-200">
                        +{order.photos.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Dicatat oleh: <span className="font-medium text-gray-700">{order.creator.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.orderDetails.length} items
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-lg font-bold text-green-700">
                  <DollarSign className="w-5 h-5" />
                  <span>Rp {order.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Services Preview */}
              <div className="flex flex-wrap gap-2 mb-3">
                {order.orderDetails.slice(0, 3).map((detail, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      detail.status === "done"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {detail.treatment.name}
                  </span>
                ))}
                {order.orderDetails.length > 3 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    +{order.orderDetails.length - 3} more
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/order-detail/${order.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => window.open(`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => navigate('/quick-order')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Order
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-all hover:scale-110"
        onClick={() => navigate('/quick-order')}
        title="Quick Order"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default OrderDashboardNew;
