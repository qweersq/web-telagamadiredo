import React from 'react';
import { Check } from 'lucide-react';

const stepLabels = ['Pelanggan', 'Item', 'Review', 'Pembayaran'];

const StepperHeader = ({ currentStep, totalSteps }) => (
  <div className="rounded-2xl border border-telaga-100 bg-white px-3 py-4 shadow-sm font-montserrat">
    <div className="flex items-start">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const done = step < currentStep;
        const active = step === currentStep;

        return (
          <React.Fragment key={step}>
            {/* Garis penghubung */}
            {step > 1 && (
              <div
                className="mt-5 h-0.5 flex-1 rounded-full"
                style={{
                  background: step <= currentStep
                    ? 'linear-gradient(to right, #4ADE80, #15803D)'
                    : '#E5E7EB',
                }}
              />
            )}
            <div className="flex w-[68px] shrink-0 flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'border-telaga-600 bg-telaga-600 text-white shadow-md shadow-telaga-900/20'
                    : active
                      ? 'border-telaga-600 bg-telaga-50 text-telaga-700 shadow-md ring-4 ring-telaga-100'
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {done ? <Check className="h-5 w-5" /> : step}
              </div>
              <span
                className={`mt-2 text-center text-[11px] font-semibold tracking-wide transition-colors duration-300 ${
                  active ? 'text-telaga-700' : done ? 'text-telaga-500' : 'text-gray-400'
                }`}
              >
                {stepLabels[step - 1]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

export default StepperHeader;
