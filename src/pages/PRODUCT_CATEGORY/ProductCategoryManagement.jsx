import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Trash2, Layers, X } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import instance from '../../config/api';

const emptyForm = {
  name: '',
  description: '',
  order_mode: '',
};

const ORDER_MODE_OPTIONS = [
  { value: '', label: 'Semua outlet' },
  { value: 'loket', label: 'Loket' },
  { value: 'cafe', label: 'Cafe' },
];

const orderModeLabel = (value) =>
  ORDER_MODE_OPTIONS.find((option) => option.value === (value || ''))?.label || 'Semua outlet';

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.error?.message || error?.message || fallback;

const ProductCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get('/product-categories', {
        params: { page: 1, pageSize: 200 }
      });
      setCategories(data?.data?.categories || []);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setFormData(emptyForm);
    setFormError('');
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    resetFormState();
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category) => {
    setFormData({
      name: category.name || '',
      description: category.description || '',
      order_mode: category.order_mode || '',
    });
    setFormError('');
    setIsSubmitting(false);
    setShowCreateModal(false);
    setEditingCategory(category);
  };

  const closeModals = () => {
    resetFormState();
    setShowCreateModal(false);
    setEditingCategory(null);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    description: formData.description.trim() || null,
    order_mode: formData.order_mode || null,
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.name.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const payload = buildPayload();

      if (editingCategory) {
        await instance.put(`/product-categories/${editingCategory.id}`, payload);
      } else {
        await instance.post('/product-categories', payload);
      }

      closeModals();
      fetchCategories();
    } catch (error) {
      console.error('Error saving product category:', error);
      setFormError(getApiErrorMessage(error, 'Gagal menyimpan kategori.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await instance.patch(`/product-categories/${category.id}/toggle-status`);
      fetchCategories();
    } catch (error) {
      alert(getApiErrorMessage(error, 'Gagal mengubah status kategori.'));
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      setIsSubmitting(true);
      await instance.delete(`/product-categories/${deletingCategory.id}`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      alert(getApiErrorMessage(error, 'Gagal menghapus kategori.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = categories.filter((category) => category.is_active).length;
  const inactiveCount = categories.filter((category) => !category.is_active).length;

  const filteredCategories = useMemo(() => {
    const byTab = categories.filter((category) =>
      activeTab === 'active' ? category.is_active : !category.is_active
    );

    const term = searchTerm.trim().toLowerCase();
    if (!term) return byTab;

    return byTab.filter((category) =>
      category.name?.toLowerCase().includes(term)
      || category.description?.toLowerCase().includes(term)
    );
  }, [categories, activeTab, searchTerm]);

  const modalOpen = showCreateModal || Boolean(editingCategory);

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Kategori Produk"
          description="Kelola kategori produk & paket"
          showBackButton={true}
          fromBerandaOwner={true}
        />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telaga-600 mx-auto"></div>
            <p className="mt-4 text-telaga-900/60">Memuat kategori...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Kategori Produk"
        description="Kelola kategori produk & paket"
        showBackButton={true}
        fromBerandaOwner={true}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-10">
          <div className="max-w-[430px] md:max-w-3xl mx-auto mt-16">

            {/* Action */}
            <div className="mb-6">
              <button
                onClick={openCreateModal}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-telaga-600 hover:bg-telaga-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            {/* Ringkasan */}
            <div className="mb-4 rounded-xl border border-telaga-100 bg-telaga-50/40 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-telaga-600 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-telaga-950">Kategori Produk</p>
                  <p className="text-xs text-telaga-900/60">
                    {categories.length} kategori · {activeCount} aktif · {inactiveCount} nonaktif
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-telaga-900/35 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-telaga-100 bg-telaga-50/40 rounded-xl text-sm text-telaga-900 focus:outline-none focus:border-telaga-400 focus:bg-white focus:ring-2 focus:ring-telaga-400/25"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-telaga-900/40 hover:text-telaga-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-2 rounded-xl border border-telaga-100 bg-white p-1.5">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'active'
                    ? 'bg-telaga-50 text-telaga-700 ring-1 ring-telaga-200'
                    : 'text-telaga-900/50 hover:bg-telaga-50/60'
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'inactive'
                    ? 'bg-senja-50 text-senja-700 ring-1 ring-senja-200'
                    : 'text-telaga-900/50 hover:bg-telaga-50/60'
                }`}
              >
                Nonaktif ({inactiveCount})
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredCategories.length === 0 ? (
                <div className="rounded-xl border border-telaga-100 bg-white p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-telaga-50 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-6 h-6 text-telaga-300" />
                  </div>
                  <p className="text-sm font-semibold text-telaga-950 mb-1">
                    {searchTerm ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                  </p>
                  <p className="text-xs text-telaga-900/55">
                    {searchTerm ? 'Coba kata kunci lain' : 'Tambahkan kategori pertama untuk merapikan katalog'}
                  </p>
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-telaga-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-telaga-950 truncate">{category.name}</h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              category.order_mode === 'loket'
                                ? 'bg-senja-50 text-senja-700'
                                : category.order_mode === 'cafe'
                                  ? 'bg-telaga-100 text-telaga-700'
                                  : 'bg-telaga-50/80 text-telaga-900/50'
                            }`}
                          >
                            {orderModeLabel(category.order_mode)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-telaga-900/55">
                          {category.product_count} produk
                          {category.description ? ` · ${category.description}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="flex-1 px-3 py-2 rounded-lg border border-telaga-200 bg-telaga-50 text-telaga-700 text-xs font-semibold hover:bg-telaga-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          category.is_active
                            ? 'border-senja-200 bg-senja-50 text-senja-700 hover:bg-senja-100'
                            : 'border-telaga-200 bg-telaga-50 text-telaga-700 hover:bg-telaga-100'
                        }`}
                      >
                        {category.is_active ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" />
                            Aktifkan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeletingCategory(category)}
                        disabled={category.product_count > 0}
                        title={category.product_count > 0 ? 'Masih dipakai produk' : 'Hapus kategori'}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center ${
                          category.product_count > 0
                            ? 'border-telaga-100 bg-telaga-50/40 text-telaga-900/25 cursor-not-allowed'
                            : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal tambah / edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/50 p-6">
          <div className="w-full max-w-md flex flex-col max-h-[85vh] rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-telaga-100 p-5">
              <h2 className="text-base font-bold text-telaga-950">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button
                onClick={closeModals}
                className="w-8 h-8 rounded-lg bg-telaga-50 text-telaga-700 hover:bg-telaga-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-telaga-700">
                  Nama Kategori <span className="text-senja-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  maxLength={100}
                  placeholder="Contoh: Makanan Berat"
                  className="w-full rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm text-telaga-900 placeholder:text-telaga-900/35 focus:outline-none focus:border-telaga-400 focus:bg-white focus:ring-2 focus:ring-telaga-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-telaga-700">
                  Deskripsi <span className="font-medium normal-case tracking-normal text-telaga-900/40">(opsional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={3}
                  placeholder="Contoh: Nasi, mie, ayam, sate"
                  className="w-full resize-none rounded-xl border border-telaga-100 bg-telaga-50/40 px-3 py-2.5 text-sm text-telaga-900 placeholder:text-telaga-900/35 focus:outline-none focus:border-telaga-400 focus:bg-white focus:ring-2 focus:ring-telaga-400/25"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-telaga-700">
                  Tampil di Outlet
                </label>
                <div className="flex gap-2">
                  {ORDER_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      onClick={() => handleFieldChange('order_mode', option.value)}
                      className={`flex-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                        (formData.order_mode || '') === option.value
                          ? 'border-telaga-400 bg-telaga-50 text-telaga-700 ring-1 ring-telaga-300'
                          : 'border-telaga-100 bg-telaga-50/40 text-telaga-900/55 hover:bg-telaga-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-telaga-900/45">
                  Kategori hanya muncul di outlet sesuai pilihan. &quot;Semua outlet&quot; tampil di loket &amp; cafe.
                </p>
              </div>

              {formError && (
                <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-telaga-100 p-5">
              <button
                onClick={closeModals}
                className="flex-1 rounded-xl border border-telaga-200 px-4 py-2.5 text-sm font-semibold text-telaga-800 hover:bg-telaga-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'bg-telaga-300 text-white cursor-not-allowed'
                    : 'bg-telaga-600 text-white hover:bg-telaga-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/50 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-telaga-950">Hapus kategori?</h3>
            <p className="mt-2 text-sm text-telaga-900/60">
              Kategori <span className="font-semibold text-telaga-900">{deletingCategory.name}</span> akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 rounded-xl border border-telaga-200 px-4 py-2.5 text-sm font-semibold text-telaga-800 hover:bg-telaga-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                  isSubmitting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategoryManagement;
