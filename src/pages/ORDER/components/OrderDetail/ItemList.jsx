import React from 'react';
import { ArrowLeft, Plus, X, Edit2 } from 'lucide-react';

const ItemList = ({
  items,
  expandedItem,
  onExpandItem,
  onShowTreatmentModal,
  onShowItemDetail,
  onRemoveTreatment,
  onEditTreatment
}) => {
  // Tambahkan helper badge status (copy dari OrderCard)
  const getStatusColor = (status) => {
      switch (status) {
          case "done":
              return "bg-green-100 text-green-700 border-green-300";
          case "pending":
              return "bg-yellow-100 text-yellow-700 border-yellow-300";
          case "processing":
              return "bg-blue-100 text-blue-700 border-blue-300";
          case "not_yet":
              return "bg-gray-200 text-gray-700 border-gray-400";
          case "antrian":
              return "bg-blue-100 text-blue-700 border-blue-300";
          case "on_progress":
              return "bg-yellow-100 text-yellow-700 border-yellow-300";
          case "pengeringan":
              return "bg-cyan-100 text-cyan-700 border-cyan-300";
          case "siap":
              return "bg-indigo-100 text-indigo-700 border-indigo-300";
          case "siap_diambil":
              return "bg-purple-100 text-purple-700 border-purple-300";
          case "not_ready":
              return "bg-red-100 text-red-700 border-red-300";
          case "cancelled":
              return "bg-gray-300 text-gray-500 border-gray-400";
          default:
              return "bg-gray-100 text-gray-700 border-gray-300";
      }
  };
  const getOrderDetailStatusLabel = (status) => {
      switch (status) {
          case 'not_yet': return 'Belum Dikerjakan';
          case 'antrian': return 'Antrian';
          case 'on_progress': return 'Proses';
          case 'pengeringan': return 'Pengeringan';
          case 'siap': return 'Siap';
          case 'siap_diambil': return 'Siap Diambil';
          case 'siap_dikirim': return 'Siap Dikirim';
          case 'not_ready': return 'Tidak Lolos QC';
          case 'done': return 'Selesai';
          case 'cancelled': return 'Dibatalkan';
          default: return status?.charAt(0).toUpperCase() + status?.slice(1);
      }
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="border-2 border-gray-200 rounded-2xl p-0 overflow-hidden shadow-md bg-white">
          {/* Header Item */}
          <div
            className="flex justify-between items-center cursor-pointer p-4 hover:bg-telaga-50 transition relative"
            onClick={() => onShowItemDetail(item)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base text-gray-800 truncate font-montserrat">{item.name}</div>
              <div className="text-xs text-gray-500 font-montserrat truncate">{item.brand} - {item.color}</div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={e => { e.stopPropagation(); onShowTreatmentModal(index); }}
                className="px-3 py-2 bg-telaga-500 text-white rounded-xl text-sm font-semibold font-montserrat shadow hover:bg-telaga-600 transition-all"
              >
                <Plus className="w-5 h-5 inline-block mr-1" /> Layanan
              </button>
              <button
                onClick={e => { e.stopPropagation(); onExpandItem(item.id === expandedItem ? null : item.id); }}
                className={`ml-2 p-2 rounded-full hover:bg-telaga-100 relative ${!item.photos?.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={expandedItem === item.id ? 'Tutup Foto' : 'Lihat Foto'}
                disabled={!item.photos?.length}
              >
                <ArrowLeft className={`w-5 h-5 transition-transform ${expandedItem === item.id ? 'rotate-90' : '-rotate-90'}`} />
                {item.photos?.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-telaga-500 text-white text-xs rounded-full px-1 min-w-[18px] text-center">{item.photos.length}</span>
                )}
              </button>
            </div>
          </div>
          {/* Photos Dropdown */}
          {expandedItem === item.id && item.photos && item.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto p-4 border-t bg-gray-50 transition-all duration-300">
              {item.photos.map(photo => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview}
                    alt="Item"
                    className="w-20 h-20 object-cover rounded-xl border"
                  />
                </div>
              ))}
            </div>
          )}
          {/* Treatment List */}
          {item.treatments && item.treatments.length > 0 && (
            <div className="space-y-2 px-4 pb-4">
              {item.treatments.map((treatment, tIndex) => (
                <div key={treatment.id} className="flex items-center justify-between p-3 bg-telaga-50 rounded-xl shadow-sm mt-2 font-montserrat">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-telaga-800 text-sm truncate flex items-center gap-2">
                      {treatment.treatment.name}
                      {treatment.status && (
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold shadow-sm ${getStatusColor(treatment.status)}`}
                          style={{ fontSize: '11px', minWidth: 'unset' }}>
                          {getOrderDetailStatusLabel(treatment.status)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                      <span>Due: <span className="font-semibold text-gray-700">{treatment.due_date}</span></span>
                      {treatment.discount > 0 && <span>Diskon: <span className="text-green-600">Rp {treatment.discount.toLocaleString()}</span></span>}
                      <span>Harga: <span className="text-telaga-700 font-semibold">Rp {treatment.final_price.toLocaleString()}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => onEditTreatment && onEditTreatment(index, tIndex)}
                      className="p-2 rounded-full bg-white border border-telaga-200 text-telaga-600 hover:bg-telaga-100 shadow-sm transition-all"
                      aria-label="Edit Layanan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveTreatment(index, tIndex)}
                      className="p-2 rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-100 shadow-sm transition-all"
                      aria-label="Hapus Layanan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {/* Add New Item Button */}
      <button
        onClick={() => onShowTreatmentModal('addItem')}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-telaga-300 rounded-xl text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400 transition-all font-montserrat text-base font-semibold mt-2"
      >
        <Plus className="w-6 h-6" />
        Tambah Item Baru
      </button>
    </div>
  );
};

export default ItemList; 