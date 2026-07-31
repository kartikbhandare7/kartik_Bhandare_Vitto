import { useState } from 'react';
import { applyForLoan } from '../api';

export default function LoanForm({ profileId, onSuccess, onBack }) {
  const [form, setForm] = useState({ amount: '', tenureMonths: '', purpose: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const emi = form.amount && form.tenureMonths && Number(form.tenureMonths) > 0
    ? Math.round(Number(form.amount) / Number(form.tenureMonths))
    : null;

  const formatINR = (n) => Number(n).toLocaleString('en-IN');

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) < 1000)
      e.amount = 'Minimum loan amount is ₹1,000';
    if (!form.tenureMonths || Number(form.tenureMonths) < 1 || Number(form.tenureMonths) > 360)
      e.tenureMonths = 'Tenure must be between 1 and 360 months';
    if (!form.purpose.trim() || form.purpose.trim().length < 5)
      e.purpose = 'Describe the loan purpose (min 5 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await applyForLoan({
        profileId,
        amount: Number(form.amount),
        tenureMonths: Number(form.tenureMonths),
        purpose: form.purpose.trim(),
      });
      onSuccess(res.data.applicationId);
    } catch (err) {
      const data = err.response?.data;
      if (data?.details?.length) {
        const fe = {};
        data.details.forEach(d => { fe[d.field] = d.message; });
        setErrors(fe);
      } else {
        setApiError(data?.message || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="amount">Loan amount</label>
        <div className="prefix-wrap">
          <span className="prefix">₹</span>
          <input id="amount" name="amount" type="number" placeholder="2000000"
            min="1000" value={form.amount} onChange={handleChange} />
        </div>
        {errors.amount
          ? <div className="error">{errors.amount}</div>
          : form.amount && <div className="hint">₹ {formatINR(form.amount)}</div>}
      </div>

      <div className="field">
        <label htmlFor="tenureMonths">Tenure (months)</label>
        <input id="tenureMonths" name="tenureMonths" type="number" placeholder="24"
          min="1" max="360" value={form.tenureMonths} onChange={handleChange} />
        {errors.tenureMonths
          ? <div className="error">{errors.tenureMonths}</div>
          : form.tenureMonths && Number(form.tenureMonths) >= 12
            && <div className="hint">{(Number(form.tenureMonths)/12).toFixed(1)} years</div>}
      </div>

      {emi && (
        <div className="emi-card">
          <div>
            <div className="emi-label">Estimated monthly payment</div>
            <div className="emi-value">₹ {formatINR(emi)}</div>
          </div>
          <div className="emi-note">Simple division · actual EMI includes interest</div>
        </div>
      )}

      <div className="field">
        <label htmlFor="purpose">Purpose of loan</label>
        <textarea id="purpose" name="purpose" rows={3}
          placeholder="Purchase machinery for production expansion"
          value={form.purpose} onChange={handleChange} />
        {errors.purpose
          ? <div className="error">{errors.purpose}</div>
          : <div className="hint">{form.purpose.length}/500</div>}
      </div>

      {apiError && <div className="api-error">{apiError}</div>}

      <div className="btn-row">
        <button type="button" onClick={onBack} className="btn-secondary">← Back</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? <><span className="spin">↻</span> Submitting...</>
            : <>Get decision →</>}
        </button>
      </div>
    </form>
  );
}