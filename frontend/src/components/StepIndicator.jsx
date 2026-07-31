const steps = [
  { number: 1, label: 'Business profile' },
  { number: 2, label: 'Loan details' },
  { number: 3, label: 'Decision' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="steps">
      {steps.map((step, index) => (
        <div key={step.number} style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div className="step">
            <div className={`step-circle ${
              currentStep > step.number ? 'done'
              : currentStep === step.number ? 'active'
              : 'idle'
            }`}>
              {currentStep > step.number
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                : step.number
              }
            </div>
            <span className={`step-label ${currentStep === step.number ? 'active' : ''}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`step-line ${currentStep > step.number ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}