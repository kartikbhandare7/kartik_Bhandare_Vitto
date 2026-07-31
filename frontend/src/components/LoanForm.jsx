import { useState } from 'react';
import { applyForLoan } from '../api';

// Props:
// profileId   — from step 1, needed to link this loan to the profile
// onSuccess(applicationId) — called when loan is submitted
// onBack()   — go back to step 1

export default function LoanForm({ profileId, onSuccess, onBack }) {
  const [form, setForm] = useState({
    amount:       '',
    tenureMonths: '',
    purpose:      '',
  });

  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  // Live EMI estimate — simple division, no interest rate (same as backend)
  const emiEstimate = form.amount && form.tenureMonths && Number(form.tenureMonths) > 0
    ? Math.round(Number(form.amount) / Number(form.tenureMonths))
    : null;

  const validate = () => {
    const newErrors = {};

    if (!form.amount)
      newErrors.amount = 'Loan amount is required';
    else if (isNaN(form.amount) || Number(form.amount) < 1000)
      newErrors.amount = 'Minimum loan amount is ₹1,000';

    if (!form.tenureMonths)
      newErrors.tenureMonths = 'Tenure is required';
    else if (!Number.isInteger(Number(form.tenureMonths)) || Number(form.tenureMonths) < 1)
      newErrors.tenureMonths = 'Tenure must be at least 1 month';
    else if (Number(form.tenureMonths) > 360)
      newErrors.tenureMonths = 'Tenure cannot exceed 360 months';

    if (!form.purpose.trim())
      newErrors.purpose = 'Loan purpose is required';
    else if (form.purpose.trim().length < 5)
      newErrors.purpose = 'Please describe the purpose (at least 5 characters)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await applyForLoan({
        profileId,
        amount:       Number(form.amount),
        tenureMonths: Number(form.tenureMonths),
        purpose:      form.purpose.trim(),
      });

      onSuccess(result.data.applicationId);

    } catch (err) {
      const data = err.response?.data;
      if (data?.details?.length) {
        const fieldErrors = {};
        data.details.forEach(d => { fieldErrors[d.field] = d.message; });
        setErrors(fieldErrors);
      } else {
        setApiError(data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format numbers with Indian commas — 500000 → 5,00,000
  const formatINR = (num) => {
    if (!num) return '';
    return Number(num).toLocaleString('en-IN');
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {/* Loan Amount */}
        <div>
          <label className="form-label" htmlFor="amount">
            Loan amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
            <input
              id="amount"
              name="amount"
              type="number"
              placeholder="2000000"
              value={form.amount}
              onChange={handleChange}
              min="1000"
              className={`pl-8 ${errors.amount ? 'form-input-error' : 'form-input'}`}
            />
          </div>
          {errors.amount
            ? <p className="field-error">{errors.amount}</p>
            : form.amount && <p className="text-xs text-slate-400 mt-1">₹ {formatINR(form.amount)}</p>
          }
        </div>

        {/* Tenure */}
        <div>
          <label className="form-label" htmlFor="tenureMonths">
            Repayment tenure (months)
          </label>
          <input
            id="tenureMonths"
            name="tenureMonths"
            type="number"
            placeholder="24"
            value={form.tenureMonths}
            onChange={handleChange}
            min="1"
            max="360"
            className={errors.tenureMonths ? 'form-input-error' : 'form-input'}
          />
          {errors.tenureMonths
            ? <p className="field-error">{errors.tenureMonths}</p>
            : form.tenureMonths && (
              <p className="text-xs text-slate-400 mt-1">
                {Number(form.tenureMonths)} months
                {Number(form.tenureMonths) >= 12
                  ? ` (${(Number(form.tenureMonths) / 12).toFixed(1)} years)`
                  : ''}
              </p>
            )
          }
        </div>

        {/* Live EMI estimate */}
        {emiEstimate && (
          <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl">
            <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">
              Estimated monthly payment
            </p>
            <p className="text-2xl font-bold text-brand-700">
              ₹ {formatINR(emiEstimate)}
              <span className="text-sm font-normal text-brand-500 ml-1">/ month</span>
            </p>
            <p className="text-xs text-brand-500 mt-1">
              Simple division — actual EMI will include interest
            </p>
          </div>
        )}

        {/* Purpose */}
        <div>
          <label className="form-label" htmlFor="purpose">
            Purpose of loan
          </label>
          <textarea
            id="purpose"
            name="purpose"
            rows={3}
            placeholder="e.g. Purchase new machinery for production expansion"
            value={form.purpose}
            onChange={handleChange}
            className={`resize-none ${errors.purpose ? 'form-input-error' : 'form-input'}`}
          />
          {errors.purpose
            ? <p className="field-error">{errors.purpose}</p>
            : <p className="text-xs text-slate-400 mt-1">{form.purpose.length}/500</p>
          }
        </div>

        {/* API error */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onBack} className="btn-secondary w-auto px-5">
            ← Back
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Submitting...
              </span>
            ) : 'Get credit decision →'}
          </button>
        </div>

      </div>
    </form>
  );
}