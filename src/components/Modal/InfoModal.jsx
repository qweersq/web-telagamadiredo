import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  items = [], 
  footerInfo = null,
  buttonText = "Tutup",
  maxWidth = "max-w-md"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl p-6 ${maxWidth} w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font font-semibold font-montserrat text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 ${item.bgColor || 'bg-gray-50'} rounded-lg`}>
              <div className={`w-3 h-3 ${item.dotColor || 'bg-gray-500'} rounded-full`}></div>
              <div>
                <div className={`font-semibold ${item.titleColor || 'text-gray-700'}`}>
                  {item.title}
                </div>
                <div className="text-sm text-gray-600">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer Info */}
        {footerInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {footerInfo.icon && <span className="text-lg">{footerInfo.icon}</span>}
              <div className="text-sm text-gray-700">
                {footerInfo.text}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer Button */}
        <div className="mt-4 flex justify-end">
          <AnimatedButton
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-['Montserrat'] font-semibold hover:bg-blue-600 transition-colors"
          >
            {buttonText}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
