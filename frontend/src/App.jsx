import { useState } from 'react';
import StepIndicator  from './components/StepIndicator';
import ProfileForm    from './components/ProfileForm';
import LoanForm       from './components/LoanForm';
import DecisionResult from './components/DecisionResult';

export default function App() {
  const [step,          setStep]          = useState(1);
  const [profileId,     setProfileId]     = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  const handleProfileSuccess = (id) => { setProfileId(id); setStep(2); };
  const handleLoanSuccess    = (id) => { setApplicationId(id); setStep(3); };
  const handleReset          = ()   => { setProfileId(null); setApplicationId(null); setStep(1); };

  const headings = [
    null,
    { title: 'Business profile',  sub: 'Tell us about your business to begin the assessment' },
    { title: 'Loan details',      sub: 'Enter the amount and repayment terms you need' },
    { title: 'Credit decision',   sub: 'Based on your financial profile and loan parameters' },
  ];
  const h = headings[step];

  return (
    <div className="page">
      {/* Logo */}
      <div className="logo-row">
        <div className="logo-icon">₹</div>
        <div>
          <div className="logo-text">MSME Lending</div>
          <div className="logo-sub">Credit Decision System</div>
        </div>
      </div>

      {/* Card */}
      <div className="card">
        <StepIndicator currentStep={step} />

        <div className="section-head">
          <h2>{h.title}</h2>
          <p>{h.sub}</p>
        </div>

        {step === 1 && <ProfileForm onSuccess={handleProfileSuccess} />}
        {step === 2 && <LoanForm profileId={profileId} onSuccess={handleLoanSuccess} onBack={() => setStep(1)} />}
        {step === 3 && <DecisionResult applicationId={applicationId} onReset={handleReset} />}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        All data processed in real-time · 5-signal credit model
      </div>
    </div>
  );
}