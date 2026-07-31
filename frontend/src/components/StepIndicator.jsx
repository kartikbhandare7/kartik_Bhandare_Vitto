// Props:
// currentStep — number 1, 2, or 3 (which step the user is on)

const steps = [
  { number: 1, label: 'Business Profile' },
  { number: 2, label: 'Loan Details' },
  { number: 3, label: 'Decision' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">

          {/* Circle with step number */}
          <div className="flex flex-col items-center">
            <div
              className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${currentStep > step.number
                  ? 'bg-brand-500 text-white'           // completed — filled blue
                  : currentStep === step.number
                  ? 'bg-brand-500 text-white ring-4 ring-brand-100'  // current — blue with glow
                  : 'bg-slate-100 text-slate-400'        // upcoming — grey
                }
              `}
            >
              {/* Show checkmark for completed steps, number for rest */}
              {currentStep > step.number ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>

            {/* Label below the circle */}
            <span
              className={`
                mt-1.5 text-xs font-medium whitespace-nowrap
                ${currentStep >= step.number ? 'text-brand-500' : 'text-slate-400'}
              `}
            >
              {step.label}
            </span>
          </div>

          {/* Connecting line between circles (not after last step) */}
          {index < steps.length - 1 && (
            <div
              className={`
                w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all duration-500
                ${currentStep > step.number ? 'bg-brand-500' : 'bg-slate-200'}
              `}
            />
          )}

        </div>
      ))}
    </div>
  );
}