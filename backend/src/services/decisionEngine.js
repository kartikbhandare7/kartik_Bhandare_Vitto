// ── Signal 1: Revenue-to-EMI ratio ─────────────────────────────
// EMI = loan amount / tenure months (simple division, no interest rate)
// ratio = monthly revenue / EMI
// Higher ratio = better (business earns much more than it pays monthly)
function scoreRevenueEmiRatio(monthlyRevenue, emi) {
  const ratio = monthlyRevenue / emi;
  if (ratio >= 3.0) return { score: 100, ratio };  // Very safe
  if (ratio >= 2.0) return { score: 75,  ratio };  // Good
  if (ratio >= 1.5) return { score: 50,  ratio };  // Acceptable
  if (ratio >= 1.0) return { score: 25,  ratio };  // Risky
  return              { score: 0,   ratio };         // Cannot afford
}

// ── Signal 2: Loan-to-revenue multiple ─────────────────────────
// multiple = loan amount / monthly revenue
// Lower multiple = better (not borrowing too much vs income)
function scoreLoanToRevenue(loanAmount, monthlyRevenue) {
  const multiple = loanAmount / monthlyRevenue;
  if (multiple <= 6)  return { score: 100, multiple };  // Conservative
  if (multiple <= 12) return { score: 75,  multiple };  // Reasonable
  if (multiple <= 18) return { score: 50,  multiple };  // High
  if (multiple <= 24) return { score: 25,  multiple };  // Very high
  return                { score: 0,   multiple };        // Overleveraged
}

// ── Signal 3: Tenure risk ───────────────────────────────────────
// 12-60 months = ideal range
// Too short = very high EMI burden
// Too long = too much exposure and uncertainty
function scoreTenureRisk(tenureMonths) {
  if (tenureMonths >= 12 && tenureMonths <= 60)  return 100;
  if (tenureMonths >= 6  && tenureMonths <= 84)  return 65;
  if (tenureMonths >= 1  && tenureMonths <= 120) return 30;
  return 0;
}

// ── Signal 4: Business type ─────────────────────────────────────
// Based on historical MSME default rates by industry
function scoreBusinessType(businessType) {
  const map = { services: 100, manufacturing: 80, retail: 70, other: 50 };
  return map[businessType] ?? 50;
}

// ── Signal 5: Fraud / sanity checks ────────────────────────────
// Returns a score and list of checks that failed
function scoreFraudChecks(loanAmount, monthlyRevenue, tenureMonths) {
  const failed = [];

  // Loan more than 50x monthly revenue is almost certainly a data error
  if (loanAmount > monthlyRevenue * 50) {
    failed.push('extreme_loan_amount');
  }

  // Very small loan but very long tenure makes no sense
  if (loanAmount < monthlyRevenue && tenureMonths > 12) {
    failed.push('low_loan_long_tenure');
  }

  const score = Math.max(0, 100 - failed.length * 25);
  return { score, failedChecks: failed };
}

// ── Scale raw score (0-100) to credit score range (300-850) ────
function scaleToCreditScore(rawScore) {
  return Math.round(300 + (rawScore / 100) * (850 - 300));
}

// ── Build reason codes from all signal results ──────────────────
function buildReasonCodes(signals, creditScore, tenureMonths, businessType) {
  const codes = [];

  if (signals.revenueEmiRatioResult.ratio < 1.5)     codes.push('LOW_REVENUE_EMI_RATIO');
  if (signals.loanToRevenueResult.multiple > 18)      codes.push('HIGH_LOAN_RATIO');
  if (signals.loanToRevenueResult.multiple > 50)      codes.push('EXTREME_LOAN_AMOUNT');
  if (tenureMonths < 6)                                codes.push('SHORT_TENURE_RISK');
  if (tenureMonths > 84)                               codes.push('LONG_TENURE_RISK');
  if (businessType === 'other')                        codes.push('BUSINESS_TYPE_HIGH_RISK');
  if (signals.fraudResult.failedChecks.length >= 2)   codes.push('DATA_INCONSISTENCY');

  // If nothing is wrong, add a positive code
  if (codes.length === 0) {
    codes.push(creditScore >= 700 ? 'APPROVED_STRONG_PROFILE' : 'APPROVED_ACCEPTABLE_RISK');
  }

  return codes;
}

// ── Main function — call this from the controller ───────────────
function runDecisionEngine(profile, loan) {
  const startTime = Date.now();

  const monthlyRevenue = parseFloat(profile.monthlyRevenue);
  const loanAmount     = parseFloat(loan.amount);
  const tenureMonths   = parseInt(loan.tenureMonths);
  const businessType   = profile.businessType;

  // EMI = simple division (assumption: interest-free for scoring purposes)
  const emi = loanAmount / tenureMonths;

  // Run all 5 signals
  const revenueEmiRatioResult = scoreRevenueEmiRatio(monthlyRevenue, emi);
  const loanToRevenueResult   = scoreLoanToRevenue(loanAmount, monthlyRevenue);
  const tenureRiskScore       = scoreTenureRisk(tenureMonths);
  const businessTypeScore     = scoreBusinessType(businessType);
  const fraudResult           = scoreFraudChecks(loanAmount, monthlyRevenue, tenureMonths);

  // Weighted average
  const weightedTotal =
    revenueEmiRatioResult.score * 0.35 +
    loanToRevenueResult.score   * 0.30 +
    tenureRiskScore             * 0.15 +
    businessTypeScore           * 0.10 +
    fraudResult.score           * 0.10;

  const creditScore = scaleToCreditScore(weightedTotal);
  const status      = creditScore >= 650 ? 'APPROVED' : 'REJECTED';

  const signals = { revenueEmiRatioResult, loanToRevenueResult, fraudResult };
  const reasonCodes = buildReasonCodes(signals, creditScore, tenureMonths, businessType);

  return {
    status,
    creditScore,
    reasonCodes,
    breakdown: {
      revenueEmiRatio:       revenueEmiRatioResult.score,
      loanToRevenueMultiple: loanToRevenueResult.score,
      tenureRiskScore,
      businessTypeScore,
      fraudCheckScore:       fraudResult.score,
      weightedTotal:         Math.round(weightedTotal * 100) / 100,
    },
    inputs: {
      monthlyRevenue,
      loanAmount,
      tenureMonths,
      businessType,
      emi: Math.round(emi * 100) / 100,
    },
    processingTimeMs: Date.now() - startTime,
  };
}

module.exports = { runDecisionEngine };