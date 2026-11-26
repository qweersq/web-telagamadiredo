import React from 'react';

const QuickOrderTemplateSelect = ({ templates, selectedTemplate, onSelect }) => (
  <div>
    <h3 className="font-medium mb-2">Pilih Template Layanan</h3>
    <div className="grid grid-cols-2 gap-2">
      {templates.map(template => (
        <div
          key={template.id}
          onClick={() => onSelect(template)}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedTemplate?.id === template.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-sm">{template.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {template.treatments.length} layanan
          </div>
          <div className="text-blue-600 font-medium text-sm mt-1">
            Rp {template.total.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default QuickOrderTemplateSelect;
