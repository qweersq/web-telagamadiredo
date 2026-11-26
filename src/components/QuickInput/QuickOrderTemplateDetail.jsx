import React from 'react';
import { Clock } from 'lucide-react';

const QuickOrderTemplateDetail = ({ template }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <h4 className="font-medium mb-2">{template.name}</h4>
    <div className="space-y-1">
      {template.treatments.map(treatment => (
        <div key={treatment.id} className="flex justify-between text-sm">
          <span>{treatment.name}</span>
          <span>Rp {treatment.price.toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t pt-1 mt-2">
        <div className="flex justify-between text-sm">
          <span>Process Time</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Next Day
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default QuickOrderTemplateDetail;
