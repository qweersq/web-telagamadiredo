import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, FileText, Calendar, Clock } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const PrintChecklistModal = ({ isOpen, onClose, order, onPrintAll, onPrintSelected }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [printAll, setPrintAll] = useState(true);

  // Generate available items from order data
  const generateAvailableItems = (orderData) => {
    const items = [];
    let globalIndex = 0;
    
    (orderData?.order_details || []).forEach(group => {
      (group.items || []).forEach(item => {
        items.push({
          id: `${group.treatment?.id}-${group.discount?.id || 'no-discount'}-${globalIndex}`,
          groupKey: `${group.treatment?.id}-${group.discount?.id || 'no-discount'}`,
          treatment: group.treatment?.name || 'Unknown Treatment',
          processTime: group.process_time || 'standard',
          dueDate: group.due_date || new Date().toISOString().slice(0, 10),
          item: {
            brand: item.brand || '',
            name: item.name || '',
            color: item.color || '',
            parfum: item.parfum || '',
            notes: item.notes || item.description || ''
          },
          globalIndex: globalIndex
        });
        globalIndex++;
      });
    });
    
    return items;
  };

  const availableItems = generateAvailableItems(order);
  const totalItems = availableItems.length;

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      // Reset selections when modal opens
      setPrintAll(true);
      setSelectedItems([]);
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handlePrintAllToggle = useCallback(() => {
    setPrintAll(true);
    setSelectedItems([]);
  }, []);

  const handleSelectItem = useCallback((itemId) => {
    console.log('🔍 Select Item Debug - Function Called:', {
      itemId,
      currentSelected: selectedItems,
      isCurrentlySelected: selectedItems.includes(itemId),
      willBeSelected: !selectedItems.includes(itemId)
    });
    
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
    setPrintAll(false);
    
    // Debug after state update - removed setTimeout to prevent timing issues
    console.log('🔍 After selection update - Function Executed:', {
      newSelectedItems: selectedItems.includes(itemId) 
        ? selectedItems.filter(id => id !== itemId)
        : [...selectedItems, itemId],
      printAll: false
    });
  }, [selectedItems]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === totalItems) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
    }
    setPrintAll(false);
  }, [selectedItems.length, totalItems, availableItems]);

  const handlePrint = useCallback(() => {
    console.log('🔍 Print Debug:', {
      printAll,
      selectedItems,
      selectedItemsLength: selectedItems.length,
      onPrintAll: typeof onPrintAll,
      onPrintSelected: typeof onPrintSelected
    });
    
    if (printAll) {
      console.log('📝 Calling onPrintAll');
      onPrintAll();
    } else {
      console.log('📝 Calling onPrintSelected with items:', selectedItems);
      onPrintSelected(selectedItems);
    }
    onClose();
  }, [printAll, selectedItems, onPrintAll, onPrintSelected, onClose]);

  const formatProcessTime = useCallback((processTime) => {
    if (processTime === 'same_day') return 'Same Day';
    if (processTime === '2_days') return '2 Hari';
    if (processTime === '3_days') return '3 Hari';
    if (processTime === '1_week') return '1 Minggu';
    return processTime;
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  if (!showOverlay) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-montserrat">
                Print Tag
              </h2>
              <p className="text-xs text-gray-600 font-montserrat">
                Pilih item yang akan dicetak tag-nya
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
        <div className="space-y-6">
          {/* Print All Option */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="printOption"
                checked={printAll}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrintAllToggle();
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm text-gray-900 font-montserrat">
                    Print Semua Item
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-montserrat mt-1">
                  Cetak tag untuk semua {totalItems} item dalam order ini
                </p>
              </div>
            </label>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500 font-montserrat font-medium">ATAU</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Select Specific Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 font-montserrat">
                Pilih Item Tertentu
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectAll();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-montserrat font-medium"
              >
                {selectedItems.length === totalItems ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            {/* Items List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {availableItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Item Click Debug:', {
                      itemId: item.id,
                      currentSelected: selectedItems,
                      isCurrentlySelected: selectedItems.includes(item.id)
                    });
                    handleSelectItem(item.id);
                  }}
                  className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                    selectedItems.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      readOnly
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 font-montserrat">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 font-montserrat">
                          {item.treatment}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatProcessTime(item.processTime)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700 font-montserrat">
                            {item.item.brand} {item.item.name}
                          </span>
                          {item.item.color && (
                            <span className="text-xs text-gray-500 font-montserrat">
                              ({item.item.color})
                            </span>
                          )}
                        </div>
                        
                        {item.item.parfum && (
                          <div className="text-xs text-gray-600 font-montserrat">
                            Parfum: {item.item.parfum}
                          </div>
                        )}
                        
                        {item.item.notes && (
                          <div className="text-xs text-gray-600 font-montserrat">
                            Catatan: {item.item.notes}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Due: {formatDate(item.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-montserrat"
          >
            Batal
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 Button Click Debug:', {
                printAll,
                selectedItems,
                selectedItemsLength: selectedItems.length,
                isDisabled: !printAll && selectedItems.length === 0
              });
              handlePrint();
            }}
            disabled={!printAll && selectedItems.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
          >
            {printAll 
              ? `Print Semua Tag (${totalItems} items)` 
              : `Print Tag Terpilih (${selectedItems.length} items)`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintChecklistModal;
