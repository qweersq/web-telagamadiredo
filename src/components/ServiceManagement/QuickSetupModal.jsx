import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaRocket, FaCheck, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';
import instance from '../../config/api';
import { quickSetupTemplates } from '../../data/quickSetupTemplates';

const QuickSetupModal = ({ isOpen, onClose, onComplete, tenantId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState({ current: 0, total: 0, message: '' });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setLoading(false);
      setSetupProgress({ current: 0, total: 0, message: '' });
    }
  }, [isOpen]);

  // Menggunakan template data dari file terpisah
  const setupTemplates = quickSetupTemplates;

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleQuickSetup = async () => {
    if (!selectedTemplate || !tenantId) return;

    setLoading(true);
    const totalItems = selectedTemplate.services.length + selectedTemplate.discounts.length + selectedTemplate.items.length;
    setSetupProgress({ current: 0, total: totalItems, message: 'Memulai setup...' });

    try {
      let current = 0;

      // Create Treatments
      setSetupProgress({ current, total: totalItems, message: 'Membuat layanan...' });
      for (const service of selectedTemplate.services) {
        try {
          await instance.post('/treatments', {
            name: service.name,
            price: service.price,
            type_item: service.type_item,
            type_service: service.type_service,
            description: service.description,
            // Default aman: masak di outlet penjual, jangan ikut default kolom DB ('central')
            production_mode: 'outlet'
          });
          current++;
          setSetupProgress({ current, total: totalItems, message: `Membuat layanan: ${service.name}` });
        } catch (error) {
          console.error('Error creating treatment:', error);
        }
      }

      // Create Discounts
      setSetupProgress({ current, total: totalItems, message: 'Membuat diskon...' });
      for (const discount of selectedTemplate.discounts) {
        try {
          await instance.post('/discounts', {
            name: discount.name,
            type: discount.type,
            discount: discount.discount
          });
          current++;
          setSetupProgress({ current, total: totalItems, message: `Membuat diskon: ${discount.name}` });
        } catch (error) {
          console.error('Error creating discount:', error);
        }
      }

      // Create Items
      setSetupProgress({ current, total: totalItems, message: 'Membuat item...' });
      for (const item of selectedTemplate.items) {
        try {
          await instance.post('/items', {
            name: item.name,
            brand: item.brand,
            type: item.type,
            color: item.color,
            material: item.material
          });
          current++;
          setSetupProgress({ current, total: totalItems, message: `Membuat item: ${item.name}` });
        } catch (error) {
          console.error('Error creating item:', error);
        }
      }

      setSetupProgress({ current: totalItems, total: totalItems, message: 'Setup selesai!' });
      
      // Complete after a short delay
      setTimeout(() => {
        onComplete({
          template: selectedTemplate.name,
          services: selectedTemplate.services.length,
          discounts: selectedTemplate.discounts.length,
          items: selectedTemplate.items.length
        });
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error during quick setup:', error);
      setSetupProgress({ current: 0, total: totalItems, message: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const getTemplateColor = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
    };
    return colors[color] || 'border-gray-200 bg-gray-50 hover:bg-gray-100';
  };

  const getSelectedColor = (color) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-100',
      orange: 'border-orange-500 bg-orange-100',
      purple: 'border-purple-500 bg-purple-100'
    };
    return colors[color] || 'border-gray-500 bg-gray-100';
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
                  <div className="flex items-center gap-3">
                    <FaRocket className="text-lg font-semibold text-blue-600" />
                    <h3 className="text-lg font-semibold font-montserrat text-gray-900">
                      Quick Setup Layanan
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    disabled={loading}
                  >
                    <FaTimes className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 font-montserrat mt-2">
                  Pilih template berdasarkan data populer dari database untuk mempercepat setup
                </p>
              </div>

              {/* Content */}
              <div className="bg-white p-6 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Setup dalam Progress...</h4>
                    <p className="text-gray-600 font-montserrat mb-4">{setupProgress.message}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(setupProgress.current / setupProgress.total) * 100}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-500 font-montserrat">
                      {setupProgress.current} dari {setupProgress.total} item
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Info Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-800 mb-2">Tentang Quick Setup</h4>
                          <p className="text-sm text-blue-700 font-montserrat">
                            Template ini dibuat berdasarkan data populer dari database. 
                            Anda akan mendapatkan layanan, diskon, dan item yang sudah terbukti digunakan oleh bisnis sepatu lainnya.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Template Selection */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Pilih Template</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {setupTemplates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className={`p-6 rounded-xl border-2 transition-colors text-left ${
                              selectedTemplate?.id === template.id
                                ? getSelectedColor(template.color)
                                : getTemplateColor(template.color)
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">{template.icon}</span>
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{template.name}</h5>
                                <p className="text-sm text-gray-600">{template.description}</p>
                              </div>
                              {selectedTemplate?.id === template.id && (
                                <FaCheck className="text-blue-600 text-xl" />
                              )}
                            </div>
                            
                            <div className="space-y-2 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Layanan:</span>
                                <span className="font-semibold">{template.services.length} item</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Diskon:</span>
                                <span className="font-semibold">{template.discounts.length} item</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Item:</span>
                                <span className="font-semibold">{template.items.length} item</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Template Details */}
                    {selectedTemplate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">Detail Template: {selectedTemplate.name}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <h6 className="font-semibold text-gray-700 mb-2">Layanan ({selectedTemplate.services.length})</h6>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {selectedTemplate.services.map((service, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  • {service.name} - Rp {service.price.toLocaleString()}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-700 mb-2">Diskon ({selectedTemplate.discounts.length})</h6>
                            <div className="space-y-1">
                              {selectedTemplate.discounts.map((discount, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  • {discount.name} - {discount.type === 'percent' ? `${discount.discount}%` : `Rp ${discount.discount.toLocaleString()}`}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-700 mb-2">Item ({selectedTemplate.items.length})</h6>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {selectedTemplate.items.map((item, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  • {item.name} ({item.brand})
                                </div>
                              ))}
                            </div>
                          </div>
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
                    {selectedTemplate ? (
                      <span>
                        Total: <span className="font-semibold text-green-600">
                          {selectedTemplate.services.length + selectedTemplate.discounts.length + selectedTemplate.items.length} item
                        </span>
                      </span>
                    ) : (
                      <span>Pilih template untuk melanjutkan</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Batal
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleQuickSetup}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      disabled={!selectedTemplate || loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          Setup...
                        </>
                      ) : (
                        <>
                          <FaRocket className="w-4 h-4" />
                          Quick Setup
                        </>
                      )}
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

export default QuickSetupModal;
