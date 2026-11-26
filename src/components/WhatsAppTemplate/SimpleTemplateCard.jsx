import { useState } from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const SimpleTemplateCard = ({ 
  template, 
  onEdit, 
  onPreview, 
  onDelete
}) => {
  const [showActions, setShowActions] = useState(false);

  const getCategoryInfo = (category) => {
    const categories = {
      invoice: {
        label: 'Invoice',
        description: 'Pesan untuk invoice pembayaran',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🧾',
        bgColor: 'bg-blue-50'
      },
      item_done: {
        label: 'Item Selesai',
        description: 'Notifikasi item sudah selesai',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
        bgColor: 'bg-green-50'
      },
      delivery: {
        label: 'Pengantaran',
        description: 'Pesan untuk pengantaran barang',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '🚚',
        bgColor: 'bg-purple-50'
      },
      pickup: {
        label: 'Penjemputan',
        description: 'Pesan untuk penjemputan barang',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '📦',
        bgColor: 'bg-orange-50'
      },
      notification: {
        label: 'Notifikasi',
        description: 'Pesan notifikasi umum',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '🔔',
        bgColor: 'bg-yellow-50'
      },
      promotion: {
        label: 'Promosi',
        description: 'Pesan promosi dan marketing',
        color: 'bg-pink-100 text-pink-800 border-pink-200',
        icon: '🎯',
        bgColor: 'bg-pink-50'
      },
      reminder: {
        label: 'Reminder',
        description: 'Pesan pengingat',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '⏰',
        bgColor: 'bg-red-50'
      },
      other: {
        label: 'Lainnya',
        description: 'Template lainnya',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '📝',
        bgColor: 'bg-gray-50'
      }
    };
    return categories[category] || categories.other;
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const categoryInfo = getCategoryInfo(template.category);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Category Header */}
      <div className={`${categoryInfo.bgColor} px-4 py-3 border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo.icon}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{categoryInfo.label}</h4>
            <p className="text-xs text-gray-600">{categoryInfo.description}</p>
          </div>
          <div className="flex items-center gap-1">
            {template.is_system && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                System
              </span>
            )}
            {template.is_default && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Default
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              template.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
            }`}>
              {template.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
      </div>

      {/* Template Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
            {template.title}
          </h3>
          <p className="text-xs text-gray-500">{template.name}</p>
        </div>

        {/* Content Preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-700 leading-relaxed">
            {truncateText(template.template_content, 120)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatedButton
              onClick={() => onPreview(template)}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              👁️ Lihat
            </AnimatedButton>
          </div>

          <div className="flex items-center gap-1">
            {!template.is_system && (
              <>
                <AnimatedButton
                  onClick={() => onEdit(template)}
                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  ✏️ Edit
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </AnimatedButton>
              </>
            )}
            {template.is_system && (
              <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-lg">
                🔒 System Template
              </span>
            )}
          </div>
        </div>

        {/* Expanded Actions */}
        {showActions && !template.is_system && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <AnimatedButton
                onClick={() => onDelete(template.id)}
                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                🗑️ Hapus
              </AnimatedButton>
              
              <AnimatedButton
                onClick={() => setShowActions(false)}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTemplateCard;
