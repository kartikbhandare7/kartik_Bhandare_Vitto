# MSME Lending Decision System

A full-stack, end-to-end credit decision system for Micro, Small and Medium Enterprise (MSME) loan applications. Built as a 1-day sprint technical assessment — accepts business profiles and loan inputs, runs them through a custom-built credit scoring engine, and returns a structured decision with score, reason codes, and full breakdown.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Decision Engine — How It Works](#decision-engine--how-it-works)
- [API Reference](#api-reference)
- [Edge Case Handling](#edge-case-handling)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Git Commit History](#git-commit-history)
- [What I Would Improve With More Time](#what-i-would-improve-with-more-time)
- [Author](#author)

---

## Project Overview

Indian MSMEs often face lengthy, opaque loan approval processes. This project simulates how a digital lender would process MSME loan applications in real time — using a transparent, rule-based credit scoring engine that any applicant or reviewer can understand.

**The user flow:**

```
Step 1 — Business owner fills in their profile (name, PAN, business type, monthly revenue)
Step 2 — Submits loan details (amount, tenure, purpose)
Step 3 — System runs scoring engine → returns APPROVED or REJECTED with full reasoning
```

**What makes this different from a simple form:**
- Credit score is computed from 5 weighted signals, not a blackbox
- Every decision comes with human-readable reason codes
- Full audit trail is maintained in MongoDB for every submission and decision
- Input validation happens on both frontend (instant feedback) and backend (Joi schemas)
- Rate limiting protects the decision endpoint from abuse

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://msme-lending.vercel.app |
| Backend API | https://msme-lending-api.onrender.com |
| Health check | https://msme-lending-api.onrender.com/health |

> **Note:** Backend is deployed on Render free tier. First request may take 30–50 seconds to wake up.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev server, modern JSX, small bundle |
| Styling | Tailwind CSS + custom CSS | Utility-first, responsive out of the box |
| HTTP client | Axios | Clean API layer, interceptors, timeout support |
| Backend | Node.js + Express | Lightweight, non-blocking, fast to scaffold |
| Primary DB | PostgreSQL + Sequelize | Relational data — profiles and loan applications with FK constraints |
| Document DB | MongoDB + Mongoose | Flexible nested documents — decisions and audit logs |
| Validation | Joi | Declarative schemas, field-level error messages |
| Rate limiting | express-rate-limit | Protect decision endpoint from spam |
| Logging | Winston + Morgan | Structured JSON logs, HTTP request logging |
| Containers | Docker + Docker Compose | One-command local environment setup |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Frontend                              │
│   ProfileForm → LoanForm → DecisionResult                           │
│   (Vite + Tailwind · Axios · Client-side validation)               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API calls (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Node.js / Express                              │
│                                                                     │
│  Middleware stack (left → right per request):                       │
│  CORS → JSON parser → Morgan logger → General rate limiter          │
│                                                                     │
│  Routes:                                                            │
│  POST /api/v1/profile      → profile.controller                     │
│  POST /api/v1/loan/apply   → loan.controller                        │
│  POST /api/v1/decision/:id → decision.controller (rate limited)     │
│  GET  /api/v1/decision/:id → decision.controller                    │
│                                                                     │
│  Per-route middleware:                                              │
│  Joi validation → Controller → Error handler                        │
└──────────┬─────────────────────────────┬────────────────────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐    ┌────────────────────────────────────────┐
│     PostgreSQL        │    │              MongoDB                   │
│  (Sequelize ORM)      │    │           (Mongoose ODM)               │
│                       │    │                                        │
│  business_profiles    │    │  decisions collection                  │
│  loan_applications    │    │  - status, creditScore, reasonCodes    │
│  (FK enforced)        │    │  - breakdown{}, inputs{}               │
│                       │    │                                        │
│                       │    │  audit_logs collection                 │
│                       │    │  - every event timestamped             │
│                       │    │  - TTL: auto-delete after 90 days      │
└──────────────────────┘    └────────────────────────────────────────┘
```

**Why two databases?**

PostgreSQL stores structured, relational data — profiles and loan applications have a clear relationship (one profile → many applications) and need foreign key constraints. MongoDB stores decision results because they contain deeply nested objects (`breakdown`, `inputs`, `reasonCodes[]`) that are awkward to normalize into SQL tables. Audit logs also go to MongoDB because they are write-heavy, schema-flexible, and can safely expire.

---

## Project Structure

```
msme-lending/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── postgres.js        ← Sequelize connection + sync
│   │   │   ├── mongo.js           ← Mongoose connection
│   │   │   └── logger.js          ← Winston structured logger
│   │   │
│   │   ├── models/
│   │   │   ├── pg/
│   │   │   │   ├── BusinessProfile.js   ← PostgreSQL: owner, PAN, type, revenue
│   │   │   │   └── LoanApplication.js   ← PostgreSQL: amount, tenure, purpose, status
│   │   │   └── mongo/
│   │   │       ├── Decision.js          ← MongoDB: score, status, reasonCodes, breakdown
│   │   │       └── AuditLog.js          ← MongoDB: every action logged with timestamp
│   │   │
│   │   ├── middleware/
│   │   │   ├── validate.js        ← Joi schemas for profile + loan input
│   │   │   ├── rateLimiter.js     ← Decision endpoint: 20 req/min
│   │   │   └── errorHandler.js    ← Global error catcher + 404 handler
│   │   │
│   │   ├── controllers/
│   │   │   ├── profile.controller.js   ← createProfile, getProfile
│   │   │   ├── loan.controller.js      ← applyForLoan, getLoan
│   │   │   └── decision.controller.js  ← makeDecision, getDecision
│   │   │
│   │   ├── routes/
│   │   │   ├── profile.routes.js
│   │   │   ├── loan.routes.js
│   │   │   └── decision.routes.js
│   │   │
│   │   ├── services/
│   │   │   └── decisionEngine.js  ← ★ Core scoring logic (5 signals)
│   │   │
│   │   └── app.js                 ← Express app + DB startup
│   │
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StepIndicator.jsx    ← 3-step progress indicator
│   │   │   ├── ProfileForm.jsx      ← Step 1: business profile form
│   │   │   ├── LoanForm.jsx         ← Step 2: loan details + live EMI
│   │   │   └── DecisionResult.jsx   ← Step 3: score, reasons, breakdown
│   │   │
│   │   ├── api.js           ← All axios calls in one place
│   │   ├── App.jsx          ← Root: step state + routing between forms
│   │   ├── main.jsx         ← React entry point
│   │   └── index.css        ← Global styles + component classes
│   │
│   ├── .env
│   └── package.json
│
├── docker-compose.yml       ← postgres + mongo + backend in one command
└── README.md
```

---

## Database Design

### PostgreSQL Tables

**`business_profiles`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| ownerName | VARCHAR(100) | Required |
| pan | VARCHAR(10) | Unique. Format: ABCDE1234F |
| businessType | ENUM | retail / manufacturing / services / other |
| monthlyRevenue | DECIMAL(15,2) | Must be > 0 |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

**`loan_applications`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| profileId | UUID (FK) | References business_profiles.id |
| amount | DECIMAL(15,2) | Min ₹1,000 |
| tenureMonths | INTEGER | 1–360 months |
| purpose | VARCHAR(500) | Min 5 characters |
| status | ENUM | pending → processing → decided |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

> Sequelize `sync({ alter: true })` automatically creates and migrates these tables on startup. No manual SQL needed.

### MongoDB Collections

**`decisions`**

```json
{
  "applicationId": "uuid",
  "profileId": "uuid",
  "status": "APPROVED | REJECTED",
  "creditScore": 712,
  "reasonCodes": ["APPROVED_STRONG_PROFILE"],
  "breakdown": {
    "revenueEmiRatio": 75,
    "loanToRevenueMultiple": 100,
    "tenureRiskScore": 100,
    "businessTypeScore": 70,
    "fraudCheckScore": 100,
    "weightedTotal": 88.5
  },
  "inputs": {
    "monthlyRevenue": 500000,
    "loanAmount": 2000000,
    "tenureMonths": 24,
    "businessType": "retail",
    "emi": 83333.33
  },
  "processingTimeMs": 12,
  "createdAt": "2026-07-31T10:00:00Z"
}
```

**`auditlogs`**

```json
{
  "event": "DECISION_COMPLETED",
  "applicationId": "uuid",
  "profileId": "uuid",
  "payload": {},
  "result": { "status": "APPROVED", "creditScore": 712 },
  "ip": "103.x.x.x",
  "userAgent": "Mozilla/5.0...",
  "durationMs": 14,
  "createdAt": "2026-07-31T10:00:00Z"
}
```

> Audit logs have a TTL index — MongoDB automatically deletes records older than 90 days.

---

## Decision Engine — How It Works

The decision engine is the core of this project. It lives in `backend/src/services/decisionEngine.js` and is a pure function — it takes profile + loan data and returns a decision. No side effects, no database calls.

### Scoring Model

Five signals are scored independently (0–100), combined with weights, then scaled to a 300–850 credit score range.

```
Credit Score = scale(
  (signal1 × 0.35) +
  (signal2 × 0.30) +
  (signal3 × 0.15) +
  (signal4 × 0.10) +
  (signal5 × 0.10)
)

scale(rawScore) = 300 + (rawScore / 100) × 550
```

**Threshold: Score ≥ 650 → APPROVED. Score < 650 → REJECTED.**

---

### Signal 1 — Revenue-to-EMI Ratio (Weight: 35%)

**What it checks:** Can the business comfortably afford the monthly payment?

```
EMI = loanAmount / tenureMonths   (simple division — see Assumption #1)
ratio = monthlyRevenue / EMI
```

| Ratio | Score | Meaning |
|---|---|---|
| ≥ 3.0 | 100 | Revenue is 3× EMI — very safe |
| ≥ 2.0 | 75 | Good buffer |
| ≥ 1.5 | 50 | Acceptable |
| ≥ 1.0 | 25 | Risky — barely covers EMI |
| < 1.0 | 0 | Cannot afford monthly payment |

This is the highest-weight signal because affordability is the single most important factor in whether a borrower will default.

---

### Signal 2 — Loan-to-Revenue Multiple (Weight: 30%)

**What it checks:** Is the loan amount proportionate to the business's income?

```
multiple = loanAmount / monthlyRevenue
```

| Multiple | Score | Meaning |
|---|---|---|
| ≤ 6× | 100 | Conservative ask |
| ≤ 12× | 75 | Reasonable |
| ≤ 18× | 50 | High but acceptable |
| ≤ 24× | 25 | Very high risk |
| > 24× | 0 | Overleveraged |

**Example:** ₹5L monthly revenue, ₹50L loan = 10× multiple → Score 75 (reasonable).

---

### Signal 3 — Tenure Risk (Weight: 15%)

**What it checks:** Is the repayment period in a sensible range?

| Tenure | Score | Reasoning |
|---|---|---|
| 12–60 months | 100 | Ideal range for MSME loans |
| 6–84 months | 65 | Slightly outside ideal but acceptable |
| 1–120 months | 30 | Very short (high EMI burden) or very long (high exposure) |
| > 120 months | 0 | Unrealistic for MSME context |

---

### Signal 4 — Business Type Stability (Weight: 10%)

**What it checks:** How risky is this industry historically for defaults?

| Business Type | Score | Reasoning |
|---|---|---|
| Services | 100 | Low asset requirements, steady cash flow (IT, consulting, etc.) |
| Manufacturing | 80 | Higher capital intensity but more predictable |
| Retail | 70 | Seasonal variation, inventory risk |
| Other | 50 | Unknown profile, higher uncertainty |

---

### Signal 5 — Fraud and Sanity Checks (Weight: 10%)

**What it checks:** Do the input numbers make logical sense together?

Each failed check deducts 25 points from 100:

| Check | Trigger | What it signals |
|---|---|---|
| Extreme loan amount | Loan > 50× monthly revenue | Almost certainly a data error or fraud attempt |
| Low loan + long tenure | Loan < 1× revenue AND tenure > 12 months | Economically illogical combination |

---

### Reason Codes

Every decision returns one or more reason codes. These are human-readable explanations of what drove the score.

| Code | Triggered When |
|---|---|
| `LOW_REVENUE_EMI_RATIO` | Revenue-to-EMI ratio < 1.5 |
| `HIGH_LOAN_RATIO` | Loan > 18× monthly revenue |
| `EXTREME_LOAN_AMOUNT` | Loan > 50× monthly revenue |
| `SHORT_TENURE_RISK` | Tenure < 6 months |
| `LONG_TENURE_RISK` | Tenure > 84 months |
| `BUSINESS_TYPE_HIGH_RISK` | Business type is 'other' |
| `DATA_INCONSISTENCY` | 2+ sanity checks failed |
| `APPROVED_STRONG_PROFILE` | No negative signals, score ≥ 700 |
| `APPROVED_ACCEPTABLE_RISK` | No negative signals, score 650–699 |

---

### Scoring Example

**Business:** Retail shop, monthly revenue ₹5,00,000
**Loan:** ₹20,00,000 for 24 months

```
EMI = 20,00,000 / 24 = ₹83,333

Signal 1 — Revenue/EMI ratio: 5,00,000 / 83,333 = 6.0  → Score: 100 × 0.35 = 35.0
Signal 2 — Loan/Revenue:      20,00,000 / 5,00,000 = 4× → Score: 100 × 0.30 = 30.0
Signal 3 — Tenure (24 months, ideal range)              → Score: 100 × 0.15 = 15.0
Signal 4 — Business type: retail                        → Score:  70 × 0.10 =  7.0
Signal 5 — Fraud checks: none failed                    → Score: 100 × 0.10 = 10.0

Weighted total = 97.0 / 100
Credit score   = 300 + (97/100) × 550 = 833.5 → 834

Decision: APPROVED ✓
Reason:   APPROVED_STRONG_PROFILE
```

---

### Key Assumptions

1. **No interest rate in EMI calculation.** EMI = loan amount ÷ tenure. A production system would use compound interest formula: `EMI = P × r × (1+r)^n / ((1+r)^n - 1)`. Kept simple intentionally for transparency and easy validation.

2. **PAN enforced as unique.** One business profile per PAN number. Duplicate PANs return 409 Conflict.

3. **Re-processing blocked.** Once an application reaches `decided` status, calling the decision endpoint again returns the cached result. The score will not change for the same application.

4. **Business type scores are relative, not absolute.** The scores (100, 80, 70, 50) are ordinal rankings of stability, not statistical default probabilities from real data. A production system would use actual industry-level default rate data from credit bureaus.

5. **Audit logs are non-blocking.** If MongoDB is slow or unavailable, audit log writes fail silently. They use `.catch(() => {})` so the actual response to the user is never delayed or broken because of logging.

---

## API Reference

### Base URL

```
http://localhost:5000/api/v1
```

All responses follow this envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

All error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "What went wrong",
  "details": [ { "field": "pan", "message": "PAN must be in format ABCDE1234F" } ]
}
```

---

### GET /health

Health check — used by deployment platforms to verify the server is up.

**Response 200:**
```json
{ "status": "ok", "timestamp": "2026-07-31T10:00:00.000Z" }
```

---

### POST /api/v1/profile

Create a new business profile.

**Request body:**
```json
{
  "ownerName": "Rajesh Kumar",
  "pan": "ABCDE1234F",
  "businessType": "retail",
  "monthlyRevenue": 500000
}
```

**Validations:**
- `ownerName`: required, 2–100 characters
- `pan`: required, must match `/^[A-Z]{5}[0-9]{4}[A-Z]$/` — e.g. `ABCDE1234F`
- `businessType`: must be one of `retail`, `manufacturing`, `services`, `other`
- `monthlyRevenue`: required, positive number > 0

**Response 201:**
```json
{
  "success": true,
  "message": "Business profile created successfully",
  "data": {
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "ownerName": "Rajesh Kumar",
    "pan": "ABCDE1234F",
    "businessType": "retail",
    "monthlyRevenue": 500000,
    "createdAt": "2026-07-31T10:00:00.000Z"
  }
}
```

**Error responses:**
- `400 VALIDATION_ERROR` — invalid fields
- `409 DUPLICATE_ENTRY` — PAN already registered

---

### GET /api/v1/profile/:id

Fetch a profile with all its loan applications.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ownerName": "Rajesh Kumar",
    "pan": "ABCDE1234F",
    "businessType": "retail",
    "monthlyRevenue": "500000.00",
    "applications": [
      { "id": "uuid", "amount": "2000000.00", "status": "decided", "createdAt": "..." }
    ]
  }
}
```

**Error responses:**
- `404 PROFILE_NOT_FOUND`

---

### POST /api/v1/loan/apply

Submit a loan application linked to a profile.

**Request body:**
```json
{
  "profileId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 2000000,
  "tenureMonths": 24,
  "purpose": "Purchase new machinery for production line"
}
```

**Validations:**
- `profileId`: required, valid UUID, must exist in DB
- `amount`: required, minimum ₹1,000
- `tenureMonths`: required, integer, 1–360
- `purpose`: required, 5–500 characters

**Response 201:**
```json
{
  "success": true,
  "message": "Loan application submitted successfully",
  "data": {
    "applicationId": "uuid",
    "profileId": "uuid",
    "amount": 2000000,
    "tenureMonths": 24,
    "purpose": "Purchase new machinery for production line",
    "status": "pending",
    "createdAt": "2026-07-31T10:00:00.000Z",
    "nextStep": "POST /api/v1/decision/uuid"
  }
}
```

**Error responses:**
- `400 VALIDATION_ERROR`
- `404 PROFILE_NOT_FOUND`

---

### POST /api/v1/decision/:applicationId

Run the credit scoring engine on a loan application.

⚠️ **Rate limited: 20 requests per minute per IP.**

**Response 200:**
```json
{
  "success": true,
  "message": "application approved",
  "data": {
    "applicationId": "uuid",
    "status": "APPROVED",
    "creditScore": 712,
    "reasonCodes": ["APPROVED_STRONG_PROFILE"],
    "breakdown": {
      "revenueEmiRatio": 75,
      "loanToRevenueMultiple": 100,
      "tenureRiskScore": 100,
      "businessTypeScore": 70,
      "fraudCheckScore": 100,
      "weightedTotal": 88.5
    },
    "inputs": {
      "monthlyRevenue": 500000,
      "loanAmount": 2000000,
      "tenureMonths": 24,
      "businessType": "retail",
      "emi": 83333.33
    },
    "processingTimeMs": 11,
    "decidedAt": "2026-07-31T10:00:00.000Z"
  }
}
```

**Special behaviour:** If the application was already decided, returns `alreadyProcessed: true` with the cached result instead of re-running the engine.

**Error responses:**
- `404 APPLICATION_NOT_FOUND`
- `429 RATE_LIMIT_EXCEEDED`

---

### GET /api/v1/decision/:applicationId

Retrieve an existing decision without re-running the engine.

**Error responses:**
- `404 DECISION_NOT_FOUND` — decision hasn't been run yet

---

## Edge Case Handling

| Scenario | Where handled | Response |
|---|---|---|
| Missing required fields | Joi middleware | `400 VALIDATION_ERROR` with field-level details |
| Invalid PAN format | Joi regex + DB model | `400` with `PAN must be in format ABCDE1234F` |
| Negative revenue or loan amount | Joi `.positive()` | `400 VALIDATION_ERROR` |
| Non-numeric values in number fields | Joi type coercion | `400 VALIDATION_ERROR` |
| Duplicate PAN | PostgreSQL unique constraint | `409 DUPLICATE_ENTRY` |
| profileId not in DB | Controller check before insert | `404 PROFILE_NOT_FOUND` |
| Loan > 50× revenue | Decision engine fraud check | `REJECTED` + `EXTREME_LOAN_AMOUNT` reason code |
| Already decided application | Decision controller | Returns cached result, `alreadyProcessed: true` |
| Engine crash mid-flight | try/catch in controller | Rolls status back to `pending`, user can retry |
| Rate limit exceeded | express-rate-limit | `429` + logs event to AuditLog |
| Unknown route | notFound middleware | `404 NOT_FOUND` |
| Unhandled DB errors | Global errorHandler | Mapped to clean 400/409/500 responses |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ running locally
- MongoDB 7+ running locally
- Git

### Option A — Docker (easiest, no manual DB setup)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/msme-lending.git
cd msme-lending

# 2. Copy env file
cp backend/.env.example backend/.env

# 3. Start everything (postgres + mongo + backend)
docker-compose up --build

# 4. In a separate terminal, start frontend
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

### Option B — Manual setup

**Backend:**

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/msme-lending.git
cd msme-lending/backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Open .env and fill in your PostgreSQL credentials

# 4. Make sure PostgreSQL and MongoDB are running, then:
npm run dev
```

You should see:
```
✅ PostgreSQL connected
✅ MongoDB connected
🚀 Server running at http://localhost:5000
```

**Frontend:**

```bash
cd ../frontend
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000" > .env

npm run dev
```

Open http://localhost:5173

---

## Environment Variables

**`backend/.env`**

```bash
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DB=msme_lending
PG_USER=postgres
PG_PASSWORD=postgres

# MongoDB
MONGO_URI=mongodb://localhost:27017/msme_lending

# Rate limiting (decision endpoint)
RATE_LIMIT_WINDOW_MS=60000    # 1 minute window
RATE_LIMIT_MAX=20             # max 20 requests per window
```

**`frontend/.env`**

```bash
VITE_API_URL=http://localhost:5000
```

---

## Testing the API (Postman / Thunder Client)

Import this flow to test all 3 steps:

**Step 1 — Create profile:**
```
POST http://localhost:5000/api/v1/profile
Content-Type: application/json

{
  "ownerName": "Rajesh Kumar",
  "pan": "ABCDE1234F",
  "businessType": "retail",
  "monthlyRevenue": 500000
}

→ Copy profileId from response
```

**Step 2 — Apply for loan:**
```
POST http://localhost:5000/api/v1/loan/apply
Content-Type: application/json

{
  "profileId": "PASTE_PROFILE_ID_HERE",
  "amount": 2000000,
  "tenureMonths": 24,
  "purpose": "Purchase new machinery for production line"
}

→ Copy applicationId from response
```

**Step 3 — Get decision:**
```
POST http://localhost:5000/api/v1/decision/PASTE_APPLICATION_ID_HERE

→ Returns creditScore, status, reasonCodes, breakdown
```

**Test rejection scenario:**
```
Step 1 — Use PAN: ZZZZZ9999Z, monthlyRevenue: 100000
Step 2 — amount: 50000000, tenureMonths: 3
→ Expect: REJECTED with LOW_REVENUE_EMI_RATIO + SHORT_TENURE_RISK
```

---

## Git Commit History

```
feat: project setup and database config
  - Node/Express backend scaffold
  - PostgreSQL config with Sequelize
  - MongoDB config with Mongoose
  - Winston logger setup
  - Docker Compose with postgres:15 + mongo:7
  - .env.example

feat: PostgreSQL and MongoDB models
  - BusinessProfile model (PAN validation, unique constraint)
  - LoanApplication model (FK → profile, status enum)
  - Decision model (score, reasonCodes, breakdown)
  - AuditLog model (events enum, TTL index 90 days)

feat: credit decision engine - 5 signal scoring model
  - Revenue-to-EMI ratio (35%), Loan-to-revenue (30%)
  - Tenure risk (15%), Business type (10%), Fraud checks (10%)
  - Score range 300-850, threshold 650
  - 9 reason codes fully documented

feat: validation middleware and error handler
  - Joi schemas for createProfile and createLoan
  - PAN format regex, abortEarly: false
  - Global errorHandler with Sequelize + Mongoose mapping
  - 404 notFound middleware

feat: profile, loan and decision controllers
  - createProfile + getProfile with applications join
  - applyForLoan with profile existence check
  - makeDecision: engine → Decision → status update → audit
  - Duplicate decision prevention (returns cached result)
  - Error rollback for failed decision runs

feat: routes and main Express app
  - All 3 route files wired
  - Rate limiter on decision endpoint (20/min)
  - CORS, JSON parser, Morgan HTTP logger
  - Health check endpoint at GET /health
  - Graceful startup: PG then Mongo then listen

feat: frontend setup - Vite + React + Tailwind CSS
feat: API service layer - axios instance with timeout
feat: step indicator with progress states
feat: ProfileForm with PAN regex + client validation
feat: LoanForm with live EMI estimate preview
feat: DecisionResult with score bars and reason codes
feat: root App component with step flow state
```

---

## What I Would Improve With More Time

### 1. Async Decision Processing (Bonus feature)
Currently the decision engine runs synchronously inside the HTTP request. For a production system with ML-based scoring or external bureau calls, this would time out. I would:
- Use **Bull + Redis** to queue decision jobs
- Return `202 Accepted` with `{ jobId }` immediately
- Poll `GET /api/v1/decision/status/:jobId` or push via WebSocket
- Already scaffolded the `status` field in LoanApplication for this

### 2. Real Credit Bureau Integration
The scoring model is rule-based and uses only self-reported data. A production system would call:
- **CIBIL / Experian** for actual credit history
- **GST API** to verify declared revenue
- **MCA21** to verify business registration
Self-reported data is a fraud risk — bureau data is essential.

### 3. Interest-Adjusted EMI
Current EMI = `amount / tenure` (no interest). A real EMI calculation:
```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
```
where `r` = monthly interest rate. This would make the affordability signal much more accurate.

### 4. JWT Authentication
There is no auth currently. In production:
- Loan officers log in with `POST /auth/login` → get JWT
- All routes protected with `authenticate` middleware
- Admin routes for reviewing all applications

### 5. Comprehensive Test Suite
No unit or integration tests were written due to time constraints. Would add:
- Unit tests for `decisionEngine.js` — all score branches
- Integration tests for all API endpoints using **Jest + Supertest**
- Edge case coverage: duplicate PAN, extreme inputs, engine failure

### 6. Frontend Loading State Feedback
The loading spinner is basic. Would improve with:
- Animated progress — "Checking revenue signals... Analysing tenure..." with real delays
- Skeleton loaders on the result cards
- Toast notifications for step completions

### 7. Application History
Currently no UI to see past applications. Would add:
- `GET /api/v1/profile/:id` — already returns applications list
- History tab in the frontend showing all past applications for a PAN

---

## Author

Kartik Bhandare
B.Tech CSE 2026 — Ajeenkya DY Patil University, Pune
Java Full Stack Developer

- GitHub: kartikbhandare7(https://github.com/kartikbhandare7)
- Email: kartikbhandare57@gmail.com

---

> This project was built as a 1-day technical assessment for Vitto. All scoring logic is original and fully documented above. The codebase follows production-grade conventions: modular architecture, layered error handling, audit logging, rate limiting, and a clean commit history.
