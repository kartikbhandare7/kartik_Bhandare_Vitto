import { useState, useEffect } from 'react';
import { getDecision } from '../api';

// Props:
// applicationId — from step 2, used to fetch the decision
// onReset()     — called when user clicks "Start new application"

// Maps raw reason codes to human-readable text
const REASON_LABELS = {
  LOW_REVENUE_EMI_RATIO:   'Monthly revenue is less than 1.5× the EMI amount',
  HIGH_LOAN_RATIO:         'Loan amount is more than 18× monthly revenue',
  EXTREME_LOAN_AMOUNT:     'Loan amount is disproportionately large vs revenue',
  SHORT_TENURE_RISK:       'Repayment period is too short (under 6 months)',
  LONG_TENURE_RISK:        'Repayment period is very long (over 84 months)',
  BUSINESS_TYPE_HIGH_RISK: 'Business category carries higher default risk',
  DATA_INCONSISTENCY:      'Multiple data checks flagged inconsistencies',
  APPROVED_STRONG_PROFILE: 'All financial signals are healthy',
  APPROVED_ACCEPTABLE_RISK:'Profile meets minimum thresholds with minor concerns',
};

// The 5 scoring signals shown in the breakdown
const BREAKDOWN_LABELS = {
  revenueEmiRatio:       { label: 'Revenue-to-EMI ratio',      weight: '35%' },
  loanToRevenueMultiple: { label: 'Loan-to-revenue multiple',  weight: '30%' },
  tenureRiskScore:       { label: 'Tenure risk',               weight: '15%' },
  businessTypeScore:     { label: 'Business type stability',   weight: '10%' },
  fraudCheckScore:       { label: 'Fraud & sanity checks',     weight: '10%' },
};

// Color a breakdown score bar
function scoreColor(score) {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-400';
  if (score >= 25) return 'bg-orange-400';
  return 'bg-red-500';
}

// Format number as Indian currency
function formatINR(num) {
  return Number(num).toLocaleString('en-IN');
}

export default function DecisionResult({ applicationId, onReset }) {
  const [decision, setDecision] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Fetch the decision when this component mounts
  useEffect(() => {
    const fetchDecision = async () => {
      try {
        const result = await getDecision(applicationId);
        setDecision(result.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch decision. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDecision();
  }, [applicationId]);

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg className="animate-spin w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-slate-500 font-medium">Running credit assessment...</p>
        <p className="text-xs text-slate-400">Analysing 5 financial signals</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium mb-1">Could not load decision</p>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={onReset} className="btn-secondary w-auto px-6 mx-auto">
          Start over
        </button>
      </div>
    );
  }

  const isApproved = decision.status === 'APPROVED';

  // ── Result screen ─────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Big status banner */}
      <div className={`
        rounded-2xl p-6 text-center border-2
        ${isApproved
          ? 'bg-approved-bg border-approved-border'
          : 'bg-rejected-bg border-rejected-border'
        }
      `}>
        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3
          ${isApproved ? 'bg-green-100' : 'bg-red-100'}
        `}>
          {isApproved ? (
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Status text */}
        <p className={`text-2xl font-bold mb-1 ${isApproved ? 'text-approved-text' : 'text-rejected-text'}`}>
          {isApproved ? 'Application Approved' : 'Application Rejected'}
        </p>

        {/* Credit score */}
        <p className="text-slate-500 text-sm mb-3">Credit score</p>
        <p className={`text-6xl font-bold tabular-nums ${isApproved ? 'text-approved-text' : 'text-rejected-text'}`}>
          {decision.creditScore}
        </p>
        <p className="text-xs text-slate-400 mt-1">out of 850</p>

        {/* Score bar */}
        <div className="mt-4 mx-auto max-w-xs">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isApproved ? 'bg-green-500' : 'bg-red-400'}`}
              style={{ width: `${((decision.creditScore - 300) / 550) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>300</span>
            <span className="text-slate-500 font-medium">Threshold: 650</span>
            <span>850</span>
          </div>
        </div>
      </div>

      {/* Reason codes */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
          Decision reasons
        </h3>
        <ul className="space-y-2">
          {decision.reasonCodes.map((code) => (
            <li key={code} className="flex items-start gap-2.5">
              <span className={`
                mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${code.startsWith('APPROVED')
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-500'
                }
              `}>
                {code.startsWith('APPROVED') ? '✓' : '!'}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {REASON_LABELS[code] || code}
                </p>
                <p className="text-xs text-slate-400 font-mono">{code}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Score breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
          Score breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(BREAKDOWN_LABELS).map(([key, { label, weight }]) => {
            const score = decision.breakdown?.[key] ?? 0;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <div>
                    <span className="text-sm text-slate-700">{label}</span>
                    <span className="text-xs text-slate-400 ml-2">({weight})</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-800">
                    {score}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weighted total */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
          <span className="text-sm font-medium text-slate-600">Weighted total</span>
          <span className="text-sm font-bold text-slate-800">
            {decision.breakdown?.weightedTotal}/100
          </span>
        </div>
      </div>

      {/* Input summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
          Application inputs used
        </h3>
        <dl className="space-y-2.5">
          {[
            { label: 'Monthly revenue',        value: `₹ ${formatINR(decision.inputs?.monthlyRevenue)}` },
            { label: 'Loan amount',             value: `₹ ${formatINR(decision.inputs?.loanAmount)}` },
            { label: 'Tenure',                  value: `${decision.inputs?.tenureMonths} months` },
            { label: 'Business type',           value: decision.inputs?.businessType },
            { label: 'Monthly EMI (estimated)', value: `₹ ${formatINR(decision.inputs?.emi)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800 capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Processing info */}
      <p className="text-center text-xs text-slate-400">
        Decision processed in {decision.processingTimeMs}ms ·
        Application ID: <span className="font-mono">{applicationId.slice(0, 8)}...</span>
      </p>

      {/* Start over */}
      <button onClick={onReset} className="btn-secondary">
        Start new application
      </button>

    </div>
  );
}