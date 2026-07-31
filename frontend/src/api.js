import axios from 'axios';

// This reads from .env file — create frontend/.env with:
// VITE_API_URL=http://localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 seconds — fail gracefully if backend is down
});

// ── API functions — one per backend endpoint ─────────────────────

/**
 * Step 1: Create a business profile
 * POST /api/v1/profile
 */
export const createProfile = async (profileData) => {
  const response = await api.post('/profile', profileData);
  return response.data; // { success: true, data: { profileId, ... } }
};

/**
 * Step 2: Submit a loan application
 * POST /api/v1/loan/apply
 */
export const applyForLoan = async (loanData) => {
  const response = await api.post('/loan/apply', loanData);
  return response.data; // { success: true, data: { applicationId, ... } }
};

/**
 * Step 3: Run the credit decision engine
 * POST /api/v1/decision/:applicationId
 */
export const getDecision = async (applicationId) => {
  const response = await api.post(`/decision/${applicationId}`);
  return response.data; // { success: true, data: { status, creditScore, reasonCodes, ... } }
};