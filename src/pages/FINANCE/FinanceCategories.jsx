import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import FinanceCategoriesExplanationModal from '../../components/Modal/FinanceCategoriesExplanationModal';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { 
  Plus, 
  Edit, 
  Tag, 
  Search,
  ArrowUp,
  ArrowDown,
  Lock
} from 'lucide-react';

const FinanceCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    type: 'debit',
    description: ''
  });

  const categoryTypes = [
    { value: 'debit', label: 'Pengeluaran', icon: ArrowDown, color: 'text-red-600' },
    { value: 'credit', label: 'Pemasukan', icon: ArrowUp, color: 'text-green-600' }
  ];

  useEffect(() => {
    loadUserData();
    
    // Check if user has seen the explanation modal
    const hasSeenExplanation = localStorage.getItem('finance-categories-explanation-seen');
    if (!hasSeenExplanation) {
      setShowExplanationModal(true);
    }
  }, []);

  useEffect(() => {
    if (userData) {
      fetchCategories();
    }
  }, [userData]);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, categories]);

  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
    } catch (error) {
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Use tenant_id from userData if available
      const tenantId = userData?.tenant?.id;
      const url = tenantId ? `/finance-categories?tenant_id=${tenantId}` : '/finance-categories';
      
      const { data } = await instance.get(url);
      setCategories(data.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchTerm) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await instance.post('/finance-categories', formData);
      setShowCreateModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await instance.put(`/finance-categories/${selectedCategory.id}`, formData);
      setShowEditModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
    }
  };

  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'debit',
      description: ''
    });
    setSelectedCategory(null);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm(); // Reset form before opening create modal
    setShowCreateModal(true);
  };


  const getCategoryIcon = (type) => {
    const categoryType = categoryTypes.find(t => t.value === type);
    return categoryType ? categoryType.icon : Tag;
  };

  const getCategoryColor = (type) => {
    const categoryType = categoryTypes.find(t => t.value === type);
    return categoryType ? categoryType.color : 'text-gray-600';
  };

  const getCategoryBgColor = (type) => {
    return type === 'credit' ? 'bg-green-50' : 'bg-red-50';
  };

  const getCategoryTextColor = (type) => {
    return type === 'credit' ? 'text-green-700' : 'text-red-700';
  };

  // Handle explanation modal confirmation
  const handleExplanationConfirm = () => {
    localStorage.setItem('finance-categories-explanation-seen', 'true');
    setShowExplanationModal(false);
  };

  // Handle explanation modal close
  const handleExplanationClose = () => {
    setShowExplanationModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <HeaderBerandaOwner 
        title="Kategori" 
        showBackButton={true}
        backPath="/berandaowner"
        showLogout={true}
        showUserMenu={true}
      />

      <div className="p-4 md:p-6 mt-[80px]">

        {/* Action Buttons - Tokopedia Style */}
        <div className="mb-6 flex gap-3">
          {/* Add Category Button - Primary */}
          <button
            onClick={openCreateModal}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </div>
            <span>Tambah Kategori</span>
          </button>
          
          {/* Help Button - Secondary */}
          <button
            onClick={() => setShowExplanationModal(true)}
            className="px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center justify-center"
            title="Bantuan & Panduan Kategori"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Summary Info - Tokopedia Style */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold font-montserrat text-gray-800">Semua Kategori</h3>
                <p className="text-gray-600 font-montserrat text-sm">{categories.length} kategori tersedia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search - Compact with Button */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 mt-4">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-0 outline-none text-gray-900 placeholder-gray-500 text-sm font-montserrat"
            />
            <AnimatedButton
              variant="gray"
              className="px-3 py-2 text-xs font-montserrat"
              onClick={() => {
                // Trigger search
                const filtered = categories.filter(category =>
                  category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.description?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setFilteredCategories(filtered);
              }}
            >
              Cari
            </AnimatedButton>
          </div>
        </div>

        {/* Categories List - Redesigned */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat kategori...</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => {
                const IconComponent = getCategoryIcon(category.type);
                const colorClass = getCategoryColor(category.type);
                const bgColorClass = getCategoryBgColor(category.type);
                const textColorClass = getCategoryTextColor(category.type);
                
                return (
                  <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {category.name}
                          </h4>
                          {category.is_system && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Lock className="w-3 h-3 mr-1" />
                              System
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${textColorClass} ${bgColorClass} whitespace-nowrap`}>
                            {categoryTypes.find(t => t.value === category.type)?.label || category.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <IconComponent className={`w-3 h-3 ${colorClass}`} />
                            <span className="text-xs">
                              {category.type === 'credit' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </div>
                        </div>
                        
                        {category.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 ml-4">
                        {category.is_system ? (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md text-center">
                            System
                          </span>
                        ) : (
                          <AnimatedButton
                            onClick={() => openEditModal(category)}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
                            title="Edit kategori"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="text-xs font-medium">Edit</span>
                          </AnimatedButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Tidak Ada Kategori
              </h3>
              <p className="text-gray-600 mb-4">
                Belum ada kategori yang dibuat
              </p>
              <AnimatedButton
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Tambah Kategori
              </AnimatedButton>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh]">
            <div className="p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">TAMBAH KATEGORI</h2>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <form onSubmit={handleCreate} className="space-y-3" id="create-category-form">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  placeholder="Contoh: Makanan & Minuman"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Tipe Kategori *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  required
                >
                  {categoryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  placeholder="Deskripsi kategori (opsional)"
                  rows="2"
                />
              </div>
              </form>
            </div>

            <div className="flex gap-2 p-6 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-montserrat"
              >
                Batal
              </button>
              <button
                type="submit"
                form="create-category-form"
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-montserrat"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCategory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[85vh]">
            <div className="p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">EDIT KATEGORI</h2>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <form onSubmit={handleEdit} className="space-y-3" id="edit-category-form">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  placeholder="Contoh: Makanan & Minuman"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Tipe Kategori *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  required
                >
                  {categoryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-montserrat">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat"
                  placeholder="Deskripsi kategori (opsional)"
                  rows="2"
                />
              </div>
              </form>
            </div>

            <div className="flex gap-2 p-6 border-t-2 border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-montserrat"
              >
                Batal
              </button>
              <button
                type="submit"
                form="edit-category-form"
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-montserrat"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <FinanceCategoriesExplanationModal
        isOpen={showExplanationModal}
        onClose={handleExplanationClose}
        onConfirm={handleExplanationConfirm}
      />
    </div>
  );
};

export default FinanceCategories;
