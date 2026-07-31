thsi sit he read me file


 * CREDIT SCORING MODEL — Document this in your README and defend it in interviews
 *
 * 5 signals, each scored 0-100, then weighted:
 *
 * Signal                    Weight   What it checks
 * Revenue-to-EMI ratio       35%    Can the business afford monthly payments?
 * Loan-to-revenue multiple   30%    Is the loan amount too large vs income?
 * Tenure risk                15%    Is the repayment period too short or too long?
 * Business type stability    10%    How risky is this industry historically?
 * Fraud / sanity checks      10%    Do the numbers make logical sense?
 *
 * Final: weighted score (0-100) → scaled to 300-850 credit score range
 * Threshold: score >= 650 = APPROVED, score < 650 = REJECTED
 

