import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaSave, FaTag, FaBox } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';
import { shoeServiceCategories, shoeServices, discountTemplates, additionalItems } from '../../data/shoeServicesData';

const ServiceSetupModal = ({ isOpen, onClose, onSave }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [customService, setCustomService] = useState({
    name: '',
    description: '',
    basePrice: 0,
    estimatedTime: 30,
    difficulty: 'easy',
    items: []
  });
  const [discounts, setDiscounts] = useState([]);
  const [additionalItemsList, setAdditionalItemsList] = useState([]);
  const [activeTab, setActiveTab] = useState('services');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedService(null);
      setCustomService({
        name: '',
        description: '',
        basePrice: 0,
        estimatedTime: 30,
        difficulty: 'easy',
        items: []
      });
      setDiscounts([]);
      setAdditionalItemsList([]);
      setActiveTab('services');
    }
  }, [isOpen]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCustomService({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      estimatedTime: service.estimatedTime,
      difficulty: service.difficulty,
      items: [...service.items]
    });
  };

  const handleAddItem = () => {
    setCustomService(prev => ({
      ...prev,
      items: [...prev.items, { name: '', price: 0 }]
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setCustomService(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveItem = (index) => {
    setCustomService(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddDiscount = () => {
    setDiscounts(prev => [...prev, {
      id: Date.now(),
      name: '',
      percentage: 0,
      minOrder: 0,
      validDays: 30,
      isActive: true
    }]);
  };

  const handleUpdateDiscount = (id, field, value) => {
    setDiscounts(prev => prev.map(discount => 
      discount.id === id ? { ...discount, [field]: value } : discount
    ));
  };

  const handleRemoveDiscount = (id) => {
    setDiscounts(prev => prev.filter(discount => discount.id !== id));
  };

  const handleAddAdditionalItem = (item) => {
    setAdditionalItemsList(prev => [...prev, {
      ...item,
      id: Date.now(),
      quantity: 1
    }]);
  };

  const handleUpdateAdditionalItemQuantity = (id, quantity) => {
    setAdditionalItemsList(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleRemoveAdditionalItem = (id) => {
    setAdditionalItemsList(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = () => {
    const serviceData = {
      category: selectedCategory,
      service: selectedService,
      customService,
      discounts,
      additionalItems: additionalItemsList,
      totalPrice: calculateTotalPrice()
    };
    
    onSave(serviceData);
    onClose();
  };

  const calculateTotalPrice = () => {
    let total = customService.basePrice;
    
    // Add items price
    customService.items.forEach(item => {
      total += item.price || 0;
    });
    
    // Add additional items price
    additionalItemsList.forEach(item => {
      total += (item.price * item.quantity);
    });
    
    return total;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      case 'expert': return 'Expert';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div 
              className="fixed inset-0 bg-black transition-opacity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div 
              className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform sm:my-8 sm:align-middle sm:max-w-4xl w-full"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="bg-[#F8FCFF] px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold font-montserrat text-gray-900">
                    Atur Layanan Sepatu
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex space-x-1 mt-4">
                  {[
                    { id: 'services', label: 'Layanan', icon: FaBox },
                    { id: 'discounts', label: 'Diskon', icon: FaTag },
                    { id: 'items', label: 'Item Tambahan', icon: FaPlus }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-montserrat text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="bg-white p-6 max-h-96 overflow-y-auto">
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Pilih Kategori Layanan</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {shoeServiceCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`p-4 rounded-lg border-2 transition-colors text-left ${
                              selectedCategory === category.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold">{category.icon}</span>
                              <div>
                                <h5 className="font-semibold text-gray-900">{category.name}</h5>
                                <p className="text-sm text-gray-600">{category.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Service Selection */}
                    {selectedCategory && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Pilih Layanan</h4>
                        <div className="space-y-3">
                          {shoeServices
                            .filter(service => service.category === selectedCategory)
                            .map(service => (
                              <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                                  selectedService?.id === service.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900">{service.name}</h5>
                                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-green-600 font-semibold">
                                        Rp {service.basePrice.toLocaleString()}
                                      </span>
                                      <span className="text-gray-500">
                                        {service.estimatedTime} menit
                                      </span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(service.difficulty)}`}>
                                        {getDifficultyText(service.difficulty)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Service Form */}
                    {selectedService && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Detail Layanan</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
                            <input
                              type="text"
                              value={customService.name}
                              onChange={(e) => setCustomService(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dasar (Rp)</label>
                            <input
                              type="number"
                              value={customService.basePrice}
                              onChange={(e) => setCustomService(prev => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                          <textarea
                            value={customService.description}
                            onChange={(e) => setCustomService(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Items */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">Item yang Dibutuhkan</h5>
                            <AnimatedButton
                              onClick={handleAddItem}
                              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                            >
                              <FaPlus className="w-3 h-3" />
                              Tambah Item
                            </AnimatedButton>
                          </div>
                          
                          <div className="space-y-2">
                            {customService.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Nama item"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                  type="number"
                                  placeholder="Harga"
                                  value={item.price}
                                  onChange={(e) => handleUpdateItem(index, 'price', parseInt(e.target.value) || 0)}
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'discounts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Atur Diskon</h4>
                      <AnimatedButton
                        onClick={handleAddDiscount}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <FaPlus className="w-4 h-4" />
                        Tambah Diskon
                      </AnimatedButton>
                    </div>

                    <div className="space-y-3">
                      {discounts.map(discount => (
                        <div key={discount.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Diskon</label>
                              <input
                                type="text"
                                value={discount.name}
                                onChange={(e) => handleUpdateDiscount(discount.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Persentase (%)</label>
                              <input
                                type="number"
                                value={discount.percentage}
                                onChange={(e) => handleUpdateDiscount(discount.id, 'percentage', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order (Rp)</label>
                                <input
                                  type="number"
                                  value={discount.minOrder}
                                  onChange={(e) => handleUpdateDiscount(discount.id, 'minOrder', parseInt(e.target.value) || 0)}
                                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid (Hari)</label>
                                <input
                                  type="number"
                                  value={discount.validDays}
                                  onChange={(e) => handleUpdateDiscount(discount.id, 'validDays', parseInt(e.target.value) || 0)}
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDiscount(discount.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'items' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Item Tambahan yang Dijual</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {additionalItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleAddAdditionalItem(item)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                        >
                          <h5 className="font-semibold text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <span className="text-green-600 font-semibold">
                            Rp {item.price.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>

                    {additionalItemsList.length > 0 && (
                      <div className="mt-6">
                        <h5 className="font-semibold text-gray-900 mb-3">Item yang Dipilih</h5>
                        <div className="space-y-2">
                          {additionalItemsList.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div>
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="text-gray-600 ml-2">Rp {item.price.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateAdditionalItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                                <button
                                  onClick={() => handleRemoveAdditionalItem(item.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#F8FCFF] px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Total Harga: <span className="font-semibold text-green-600">Rp {calculateTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Batal
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <FaSave className="w-4 h-4" />
                      Simpan Layanan
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServiceSetupModal;
