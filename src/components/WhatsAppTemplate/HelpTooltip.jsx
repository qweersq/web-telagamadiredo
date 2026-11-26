import { useState } from 'react';
import AnimatedButton from '../Design/AnimatedButton';
import { X } from 'lucide-react';

const HelpTooltip = ({ 
  title, 
  content, 
  position = 'top',
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <>
      <AnimatedButton
        onClick={() => setIsOpen(true)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </AnimatedButton>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 p-[max(1.5rem,env(safe-area-inset-top))] sm:p-8"
          style={{
            paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className={`bg-white rounded-2xl shadow-xl ${sizeClasses[size]} w-full mx-auto flex flex-col max-h-[85vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-6 py-3 border-b-2 border-gray-200 rounded-t-2xl bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-montserrat font-bold text-gray-800">{title}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto px-6 py-4"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="text-sm text-gray-700 leading-relaxed">
                {content}
              </div>
            </div>
            
            {/* Fixed Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t-2 border-gray-200 rounded-b-2xl bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpTooltip;
