import { useState, useEffect } from 'react';
import { getDecision } from '../api';

const REASON_LABELS = {
  LOW_REVENUE_EMI_RATIO:   'Monthly revenue is less than 1.5× the EMI',
  HIGH_LOAN_RATIO:         'Loan amount exceeds 18× monthly revenue',
  EXTREME_LOAN_AMOUNT:     'Loan amount is disproportionate to revenue',
  SHORT_TENURE_RISK:       'Tenure under 6 months — very high EMI burden',
  LONG_TENURE_RISK:        'Tenure over 84 months — long exposure risk',
  BUSINESS_TYPE_HIGH_RISK: 'Business category carries higher default risk',
  DATA_INCONSISTENCY:      'Multiple sanity checks flagged inconsistencies',
  APPROVED_STRONG_PROFILE: 'All financial signals are healthy',
  APPROVED_ACCEPTABLE_RISK:'Profile meets thresholds with minor concerns',
};

const BREAKDOWN = [
  { key: 'revenueEmiRatio',       label: 'Revenue-to-EMI ratio',     weight: '35%' },
  { key: 'loanToRevenueMultiple', label: 'Loan-to-revenue multiple', weight: '30%' },
  { key: 'tenureRiskScore',       label: 'Tenure risk',              weight: '15%' },
  { key: 'businessTypeScore',     label: 'Business type stability',  weight: '10%' },
  { key: 'fraudCheckScore',       label: 'Fraud and sanity checks',  weight: '10%' },
];

function barClass(s) { return s >= 75 ? 'bar-high' : s >= 50 ? 'bar-mid' : 'bar-low'; }
function formatINR(n) { return '₹ ' + Number(n).toLocaleString('en-IN'); }

export default function DecisionResult({ applicationId, onReset }) {
  const [decision, setDecision] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    getDecision(applicationId)
      .then(r => setDecision(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load decision.'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) return (
    <div className="loading-box">
      <span className="loading-icon spin">↻</span>
      <div className="loading-title">Running credit assessment</div>
      <div className="loading-sub">Analysing 5 financial signals</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div className="api-error" style={{ marginBottom: 16 }}>{error}</div>
      <button className="btn-secondary" onClick={onReset}>Start over</button>
    </div>
  );

  const approved = decision.status === 'APPROVED';
  const pct = Math.round(((decision.creditScore - 300) / 550) * 100);

  return (
    <div>
      {/* Banner */}
      <div className={`result-banner ${approved ? 'approved' : 'rejected'}`}>
        <div className={`result-icon ${approved ? 'approved' : 'rejected'}`}>
          {approved
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>}
        </div>
        <div className={`result-status ${approved ? 'approved' : 'rejected'}`}>
          {approved ? 'Application approved' : 'Application rejected'}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 6px' }}>Credit score</div>
        <div className={`result-score ${approved ? 'approved' : 'rejected'}`}>{decision.creditScore}</div>
        <div className="result-score-sub">out of 850</div>
        <div className="score-track">
          <div className="score-bar-bg">
            <div className={`score-bar-fill ${approved ? 'approved' : 'rejected'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="score-range">
            <span>300</span><span>Threshold: 650</span><span>850</span>
          </div>
        </div>
      </div>

      {/* Reason codes */}
      <div className="info-card">
        <h3>Decision reasons</h3>
        {decision.reasonCodes.map(code => {
          const good = code.startsWith('APPROVED');
          return (
            <div key={code} className="reason-item">
              <div className={`reason-dot ${good ? 'good' : 'bad'}`}>{good ? '✓' : '!'}</div>
              <div>
                <div className="reason-text">{REASON_LABELS[code] || code}</div>
                <div className="reason-code">{code}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score breakdown */}
      <div className="info-card">
        <h3>Score breakdown</h3>
        {BREAKDOWN.map(b => {
          const score = decision.breakdown?.[b.key] ?? 0;
          return (
            <div key={b.key} className="breakdown-item">
              <div className="breakdown-row">
                <span className="breakdown-lbl">{b.label} <span className="breakdown-wt">({b.weight})</span></span>
                <span className="breakdown-score">{score}/100</span>
              </div>
              <div className="bar-bg">
                <div className={`bar-fill ${barClass(score)}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
        <div style={{ paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
          <span style={{ color: '#6b7280' }}>Weighted total</span>
          <span style={{ fontWeight: 600 }}>{decision.breakdown?.weightedTotal}/100</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="info-card">
        <h3>Application inputs</h3>
        {[
          ['Monthly revenue',  formatINR(decision.inputs?.monthlyRevenue)],
          ['Loan amount',      formatINR(decision.inputs?.loanAmount)],
          ['Tenure',           `${decision.inputs?.tenureMonths} months`],
          ['Business type',    decision.inputs?.businessType],
          ['Estimated EMI',    formatINR(decision.inputs?.emi)],
        ].map(([k, v]) => (
          <div key={k} className="input-row">
            <span className="input-key">{k}</span>
            <span className="input-val">{v}</span>
          </div>
        ))}
      </div>

      <div className="meta-line">
        Threshold: 650 · Score range: 300–850 · Processed in {decision.processingTimeMs}ms
      </div>

      <div className="btn-row">
        <button className="btn-primary" onClick={onReset}>Start new application</button>
      </div>
    </div>
  );
}