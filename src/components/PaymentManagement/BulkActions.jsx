import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const BulkActions = ({ selectedCount, onBulkApprove, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-montserrat text-sm">{selectedCount}</span>
          </div>
          <p className="text-blue-800 font-montserrat font-medium">
            {selectedCount} payment(s) selected
          </p>
        </div>
        <div className="flex gap-3">
          <AnimatedButton
            onClick={onBulkApprove}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-montserrat text-sm shadow-lg"
          >
            Bulk Approve
          </AnimatedButton>
          <AnimatedButton
            onClick={onClearSelection}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-montserrat text-sm shadow-lg"
          >
            Clear Selection
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
