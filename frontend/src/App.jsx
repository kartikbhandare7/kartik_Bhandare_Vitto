import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import StepIndicator from './components/StepIndicator';
import ProfileForm   from './components/ProfileForm';
import LoanForm      from './components/LoanForm';
import DecisionResult from './components/DecisionResult';

export default function App() {
  // Which step are we on: 1 = profile form, 2 = loan form, 3 = result
  const [currentStep, setCurrentStep] = useState(1);

  // These are set as the user progresses through the steps
  const [profileId,     setProfileId]     = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  // Called by ProfileForm when profile is successfully created
  const handleProfileSuccess = (id) => {
    setProfileId(id);
    setCurrentStep(2);
    toast.success('Profile created! Now add your loan details.');
  };

  // Called by LoanForm when application is successfully submitted
  const handleLoanSuccess = (id) => {
    setApplicationId(id);
    setCurrentStep(3);
    // No toast here — the decision screen itself is the payoff
  };

  // Reset everything to start a fresh application
  const handleReset = () => {
    setProfileId(null);
    setApplicationId(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">

      {/* Toast notifications (top-right corner) */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Page header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          {/* Simple rupee icon */}
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
            ₹
          </div>
          <span className="font-semibold text-slate-800 text-lg">MSME Lending</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Credit Decision System
        </h1>
        <p className="text-slate-500 text-sm">
          Get an instant credit assessment for your MSME loan application
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-lg mx-auto">
        <div className="card p-8">

          {/* Step indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Step heading */}
          <div className="mb-6">
            {currentStep === 1 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">Business profile</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Tell us about your business to begin the assessment
                </p>
              </>
            )}
            {currentStep === 2 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">Loan details</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the loan amount and repayment terms you need
                </p>
              </>
            )}
            {currentStep === 3 && (
              <>
                <h2 className="text-xl font-bold text-slate-900">Credit decision</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Based on your financial profile and loan parameters
                </p>
              </>
            )}
          </div>

          {/* Render the correct step */}
          {currentStep === 1 && (
            <ProfileForm onSuccess={handleProfileSuccess} />
          )}

          {currentStep === 2 && (
            <LoanForm
              profileId={profileId}
              onSuccess={handleLoanSuccess}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <DecisionResult
              applicationId={applicationId}
              onReset={handleReset}
            />
          )}

        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          All data is processed in real-time · Scores use our 5-signal model
        </p>
      </div>

    </div>
  );
}