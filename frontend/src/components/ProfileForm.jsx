import { useState } from 'react';
import { createProfile } from '../api';

export default function ProfileForm({ onSuccess }) {
  const [form, setForm] = useState({ ownerName: '', pan: '', businessType: '', monthlyRevenue: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = name === 'pan' ? value.toUpperCase() : value;
    setForm(p => ({ ...p, [name]: next }));
    setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.ownerName.trim() || form.ownerName.trim().length < 2)
      e.ownerName = 'Enter a valid owner name (min 2 characters)';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.trim()))
      e.pan = 'PAN must be in format ABCDE1234F';
    if (!form.businessType)
      e.businessType = 'Select a business type';
    if (!form.monthlyRevenue || Number(form.monthlyRevenue) <= 0)
      e.monthlyRevenue = 'Enter a valid monthly revenue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await createProfile({
        ownerName: form.ownerName.trim(),
        pan: form.pan.trim(),
        businessType: form.businessType,
        monthlyRevenue: Number(form.monthlyRevenue),
      });
      onSuccess(res.data.profileId);
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
        <label htmlFor="ownerName">Business owner name</label>
        <input id="ownerName" name="ownerName" type="text"
          placeholder="Rajesh Kumar" value={form.ownerName} onChange={handleChange} />
        {errors.ownerName && <div className="error">{errors.ownerName}</div>}
      </div>

      <div className="field">
        <label htmlFor="pan">PAN number</label>
        <input id="pan" name="pan" type="text" placeholder="ABCDE1234F"
          value={form.pan} onChange={handleChange} maxLength={10}
          style={{ fontFamily: 'Courier New, monospace', letterSpacing: '0.1em' }} />
        {errors.pan
          ? <div className="error">{errors.pan}</div>
          : <div className="hint">Format: 5 letters + 4 digits + 1 letter</div>}
      </div>

      <div className="field">
        <label htmlFor="businessType">Business type</label>
        <select id="businessType" name="businessType" value={form.businessType} onChange={handleChange}>
          <option value="">Select a type</option>
          <option value="retail">Retail</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="services">Services</option>
          <option value="other">Other</option>
        </select>
        {errors.businessType && <div className="error">{errors.businessType}</div>}
      </div>

      <div className="field">
        <label htmlFor="monthlyRevenue">Monthly revenue</label>
        <div className="prefix-wrap">
          <span className="prefix">₹</span>
          <input id="monthlyRevenue" name="monthlyRevenue" type="number"
            placeholder="500000" min="1" value={form.monthlyRevenue} onChange={handleChange} />
        </div>
        {errors.monthlyRevenue && <div className="error">{errors.monthlyRevenue}</div>}
      </div>

      {apiError && <div className="api-error">{apiError}</div>}

      <div className="btn-row">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? <><span className="spin">↻</span> Saving...</>
            : <>Continue <span>→</span></>}
        </button>
      </div>
    </form>
  );
}