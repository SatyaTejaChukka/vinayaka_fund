# 🪔 Vinayaka Chavithi Fund Transparency System

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC.svg)](https://tailwindcss.com/)

> **Central Principle**: The celebration fund itself is the immutable source of truth, while the web platform provides a 100% transparent, real-time, read-only public view of all verified donations and festival expenses with **₹0 payment gateway commission**.

---

## 🌟 Key Features & Highlights

- **Zero Payment Gateway Commission**: Donors pay directly to the committee's bank account via **UPI QR Code** or native **mobile UPI app deep-linking** (GPay, PhonePe, Paytm, BHIM).
- **Donor Submission & Admin Verification Flow**: Donors submit transaction reference details after paying $\rightarrow$ creates a `PENDING` record $\rightarrow$ Admin verifies credit against bank statements $\rightarrow$ reflects publicly as `VERIFIED`.
- **Public Read-Only Transparency Dashboard**:
  - Live Collection Progress visualizer (`Collected / Target`).
  - Real-time calculations: Total Collected, Total Spent, Pending Expense Commitments, Available Balance, and Committed Balance.
  - Public Donor Register with option for anonymous donor privacy listing.
  - Expense Utilization Breakdown (Spent vs. Planned Commitments).
- **Printable Transparency QR Flyer**: Dynamically generates a printable poster flyer with QR code linking to the public page so organizers can print and post it near the mandap.
- **Admin Control Portal**:
  - Secure JWT Bearer Token Authentication.
  - Pending Donation Verification Queue with 1-click **Confirm & Verify** or **Reject** actions.
  - Manual Entry for cash/offline contributions.
  - Soft Transaction Voiding with mandatory reason requirement (financial history is preserved).
  - Target amount, UPI ID, UPI Name, and Public Slug configuration.
  - Immutable Security Audit Trail.

---

## 📐 System Architecture & Money Flow

```
                      DONOR
                        │
                        ▼
            Website Donation Modal
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   Scan UPI QR            Tap "Pay via UPI App"
 (Desktop / 2nd Device)     (Direct Mobile Deep-Link)
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
         GPay / PhonePe / Paytm / BHIM
                        │
                        ▼ (₹0 Commission Direct Transfer)
            Committee Bank Account
                        │
                        ▼
          Donor Submits Reference Details
                        │
                        ▼
                FastAPI Backend (PENDING)
                        │
                        ▼
           Admin Verifies Bank Credit
                        │
                        ▼
                Status: VERIFIED
                        │
                        ▼
         Public Transparency Dashboard Updates
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & Theme** | Tailwind CSS v4 (Festive Marigold Gold & Saffron Glassmorphism) |
| **Icons & Visuals** | Lucide Icons + Canvas-Confetti |
| **Backend API** | Python 3.11 + FastAPI + Pydantic v2 |
| **Database & ORM** | SQLite (default out-of-the-box) / PostgreSQL compatible via SQLAlchemy |
| **Security & Auth** | Passlib (Bcrypt) + PyJWT OAuth2 Bearer Tokens |
| **QR Generation** | `qrcode.react` (Frontend) + `qrcode[pil]` (Backend API) |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
Make sure you have installed on your machine:
- **Node.js** (v18+ recommended) & `npm`
- **Python** (v3.10+ recommended) & `pip`
- **Git**

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/SatyaTejaChukka/vinayaka_fund.git
cd vinayaka_fund
```

*(If using SSH: `git clone git@github.com:SatyaTejaChukka/vinayaka_fund.git`)*

---

### Step 2: Setup & Run Backend (FastAPI)

1. Navigate to the project root:
   ```bash
   # Make sure you are in the vinayaka_fund directory
   ```

2. Create a Python Virtual Environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv backend/venv
     .\backend\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv backend/venv
     source backend/venv/bin/activate
     ```

3. Install Backend Dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Seed Default Admin User & Demo Celebration Data:
   ```bash
   python backend/seed.py
   ```
   *Output*:
   > Successfully seeded demo data!  
   > Default Admin Email: `admin@vinayaka.org`  
   > Default Admin Password: `admin123`  
   > Default Fund Slug: `vinayaka-chavithi-2026`

5. Start the FastAPI Backend Dev Server:
   ```bash
   python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
   - API Running at: `http://127.0.0.1:8000`
   - Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

### Step 3: Setup & Run Frontend (React + Vite)

Open a **new terminal window**:

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node Dependencies:
   ```bash
   npm install
   ```

3. Start the Frontend Vite Development Server:
   ```bash
   npm run dev -- --port 5173
   ```
   - App Running at: `http://localhost:5173/fund/vinayaka-chavithi-2026`

---

## 🔑 Default Credentials & Public URLs

| Page | URL Path | Access |
| :--- | :--- | :--- |
| **Public Transparency Page** | `http://localhost:5173/fund/vinayaka-chavithi-2026` | Public (No login required) |
| **Committee Admin Login** | `http://localhost:5173/admin/login` | Email: `admin@vinayaka.org`<br>Password: `admin123` |
| **Admin Control Dashboard** | `http://localhost:5173/admin/dashboard` | Admin Only |
| **Donations Verification** | `http://localhost:5173/admin/donations` | Admin Only |
| **Expense Tracker** | `http://localhost:5173/admin/expenses` | Admin Only |
| **Fund Settings & UPI Setup** | `http://localhost:5173/admin/fund-settings` | Admin Only |
| **Audit Logs** | `http://localhost:5173/admin/audit-logs` | Admin Only |

---

## 🧮 Financial Formula Definitions

1. **Total Collected**:
   $$\text{Total Collected} = \sum \text{amount for all donations where status} = \text{`VERIFIED`}$$

2. **Total Spent**:
   $$\text{Total Spent} = \sum \text{amount for all expenses where status} = \text{`SPENT`}$$

3. **Pending Commitments**:
   $$\text{Pending Expenses} = \sum \text{amount for all expenses where status} = \text{`PENDING`}$$

4. **Available Balance**:
   $$\text{Available Balance} = \text{Total Collected} - \text{Total Spent}$$

5. **Committed Balance**:
   $$\text{Committed Balance} = \text{Total Collected} - \text{Total Spent} - \text{Pending Expenses}$$

---

## 🛠️ GitHub Push Instructions (If encountering SSH key error)

If `git push -u origin main` gives a `Permission denied (publickey)` error, use the HTTPS remote URL or set the main branch:

```bash
# Rename current branch to main
git branch -M main

# Change remote URL to HTTPS if SSH key is not added to GitHub:
git remote set-url origin https://github.com/SatyaTejaChukka/vinayaka_fund.git

# Push to GitHub
git push -u origin main
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE). Built for community trust and 100% financial transparency. 🪔
