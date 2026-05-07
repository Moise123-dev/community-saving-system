# Community Saving System (MERN Stack)

A full-featured community savings group management system built with MongoDB, Express, React, and Node.js.

## Features

- **Authentication** — JWT-based login/register with role-based access (Manager / Member)
- **Members** — Register, view, edit, and deactivate members
- **Savings** — Record deposits and withdrawals per member per month
- **Loans** — Request, approve/reject loans with interest calculation and repayment tracking
- **Penalties** — Assign and track penalties; auto-apply for meeting absences
- **Attendance** — Record meeting attendance with automatic absence penalties
- **Accounting** — Full transaction ledger with cash flow monitoring
- **Reports** — Financial, member, and loan reports with charts
- **Settings** — Configure contribution amounts, interest rates, penalty rules
- **Audit Trail** — Complete log of all system activities

## Project Structure

```
Community_saving/
├── backend/          # Node.js + Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── server.js
└── frontend/         # React + Vite
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

The API will run on **http://localhost:5000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will run on **http://localhost:5173**

## First-Time Setup

1. Start both backend and frontend
2. Go to `http://localhost:5173/register`
3. Register the first user — they automatically become **Manager**
4. Login and go to **Settings → Initialize Settings** to set defaults
5. Start adding members, recording savings, etc.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/members | List members |
| POST | /api/savings | Record saving |
| POST | /api/loans | Request loan |
| PUT | /api/loans/:id/approve | Approve loan |
| POST | /api/loans/:id/repay | Record repayment |
| POST | /api/penalties | Assign penalty |
| POST | /api/attendance | Record attendance |
| GET | /api/accounting/dashboard | Dashboard stats |
| GET | /api/reports/financial | Financial report |

## Default Settings (after init)

| Setting | Default |
|---------|---------|
| Monthly Contribution | TZS 1,000 |
| Loan Interest Rate | 10% |
| Absence Penalty | TZS 500 |
| Late Payment Penalty | TZS 200 |
| Max Loan Multiplier | 3× savings |
| Currency | TZS |
