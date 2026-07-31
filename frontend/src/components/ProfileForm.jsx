import { useState } from 'react';
import { createProfile } from '../api';

// Props:
// onSuccess(profileId) — called when profile is created, passes profileId to parent

export default function ProfileForm({ onSuccess }) {
  // Form field values
  const [form, setForm] = useState({
    ownerName:      '',
    pan:            '',
    businessType:   '',
    monthlyRevenue: '',
  });

  // Field-level error messages
  const [errors, setErrors] = useState({});

  // Loading state while API call is in progress
  const [loading, setLoading] = useState(false);

  // API-level error (e.g. duplicate PAN)
  const [apiError, setApiError] = useState('');

  // Update a single field and clear its error when user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  // Client-side validation before hitting the API
  const validate = () => {
    const newErrors = {};
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!form.ownerName.trim())
      newErrors.ownerName = 'Owner name is required';
    else if (form.ownerName.trim().length < 2)
      newErrors.ownerName = 'Name must be at least 2 characters';

    if (!form.pan.trim())
      newErrors.pan = 'PAN is required';
    else if (!panRegex.test(form.pan.trim().toUpperCase()))
      newErrors.pan = 'PAN must be in format ABCDE1234F (5 letters, 4 digits, 1 letter)';

    if (!form.businessType)
      newErrors.businessType = 'Please select a business type';

    if (!form.monthlyRevenue)
      newErrors.monthlyRevenue = 'Monthly revenue is required';
    else if (isNaN(form.monthlyRevenue) || Number(form.monthlyRevenue) <= 0)
      newErrors.monthlyRevenue = 'Revenue must be a positive number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true = valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return; // stop if client-side validation fails

    setLoading(true);
    try {
      const result = await createProfile({
        ownerName:      form.ownerName.trim(),
        pan:            form.pan.trim().toUpperCase(),
        businessType:   form.businessType,
        monthlyRevenue: Number(form.monthlyRevenue),
      });

      // Pass the profileId up to the parent (App.jsx)
      onSuccess(result.data.profileId);

    } catch (err) {
      // Handle API errors — check for field-level details or show general message
      const data = err.response?.data;
      if (data?.details?.length) {
        // Backend returned field-level errors (e.g. from Joi)
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {/* Owner Name */}
        <div>
          <label className="form-label" htmlFor="ownerName">
            Business owner name
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            placeholder="e.g. Rajesh Kumar"
            value={form.ownerName}
            onChange={handleChange}
            className={errors.ownerName ? 'form-input-error' : 'form-input'}
          />
          {errors.ownerName && <p className="field-error">{errors.ownerName}</p>}
        </div>

        {/* PAN Number */}
        <div>
          <label className="form-label" htmlFor="pan">
            PAN number
          </label>
          <input
            id="pan"
            name="pan"
            type="text"
            placeholder="e.g. ABCDE1234F"
            value={form.pan}
            onChange={(e) => handleChange({
              target: { name: 'pan', value: e.target.value.toUpperCase() }
            })}
            maxLength={10}
            className={`font-mono tracking-widest uppercase ${errors.pan ? 'form-input-error' : 'form-input'}`}
          />
          {errors.pan
            ? <p className="field-error">{errors.pan}</p>
            : <p className="text-xs text-slate-400 mt-1">Format: 5 letters + 4 digits + 1 letter</p>
          }
        </div>

        {/* Business Type */}
        <div>
          <label className="form-label" htmlFor="businessType">
            Business type
          </label>
          <select
            id="businessType"
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            className={errors.businessType ? 'form-input-error' : 'form-input'}
          >
            <option value="">Select business type</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </select>
          {errors.businessType && <p className="field-error">{errors.businessType}</p>}
        </div>

        {/* Monthly Revenue */}
        <div>
          <label className="form-label" htmlFor="monthlyRevenue">
            Monthly revenue (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
            <input
              id="monthlyRevenue"
              name="monthlyRevenue"
              type="number"
              placeholder="500000"
              value={form.monthlyRevenue}
              onChange={handleChange}
              min="1"
              className={`pl-8 ${errors.monthlyRevenue ? 'form-input-error' : 'form-input'}`}
            />
          </div>
          {errors.monthlyRevenue && <p className="field-error">{errors.monthlyRevenue}</p>}
        </div>

        {/* API Error banner */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        {/* Submit button */}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving profile...
            </span>
          ) : 'Continue to loan details →'}
        </button>

      </div>
    </form>
  );
}