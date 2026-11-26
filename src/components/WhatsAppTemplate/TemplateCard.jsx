import { useState } from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const TemplateCard = ({ 
  template, 
  onEdit, 
  onPreview, 
  onDelete, 
  onDuplicate, 
  onToggleActive, 
  onSetDefault 
}) => {
  const [showActions, setShowActions] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      invoice: 'bg-blue-100 text-blue-800',
      item_done: 'bg-green-100 text-green-800',
      delivery: 'bg-purple-100 text-purple-800',
      pickup: 'bg-orange-100 text-orange-800',
      notification: 'bg-yellow-100 text-yellow-800',
      promotion: 'bg-pink-100 text-pink-800',
      reminder: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      invoice: 'Invoice',
      item_done: 'Item Selesai',
      delivery: 'Pengantaran',
      pickup: 'Pickup',
      notification: 'Notifikasi',
      promotion: 'Promosi',
      reminder: 'Reminder',
      other: 'Lainnya'
    };
    return labels[category] || category;
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {template.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{template.name}</p>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
              {getCategoryLabel(template.category)}
            </span>
            {template.is_default && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Default
              </span>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {template.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
          
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {template.variables?.length || 0} variable
          </span>
          
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {template.branch_id ? `Branch ${template.branch_id}` : 'Semua'}
          </span>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {truncateText(template.description, 120)}
          </p>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-4 bg-gray-50">
        <p className="text-xs text-gray-700 leading-relaxed">
          {truncateText(template.template_content, 150)}
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatedButton
              onClick={() => onPreview(template)}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              👁️ Preview
            </AnimatedButton>
            
            <AnimatedButton
              onClick={() => onEdit(template)}
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              ✏️ Edit
            </AnimatedButton>
          </div>

          <div className="flex items-center gap-1">
            <AnimatedButton
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </AnimatedButton>
          </div>
        </div>

        {/* Expanded Actions */}
        {showActions && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {!template.is_default && (
                <AnimatedButton
                  onClick={() => onSetDefault(template.id)}
                  className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  ⭐ Set Default
                </AnimatedButton>
              )}
              
              <AnimatedButton
                onClick={() => onToggleActive(template)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  template.is_active 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {template.is_active ? '⏸️ Nonaktifkan' : '▶️ Aktifkan'}
              </AnimatedButton>
              
              <AnimatedButton
                onClick={() => onDuplicate(template)}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                📋 Duplicate
              </AnimatedButton>
              
              <AnimatedButton
                onClick={() => onDelete(template.id)}
                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                🗑️ Hapus
              </AnimatedButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
