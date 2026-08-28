# 🪔 Vinayaka Chavithi Celebration Fund & Event Transparency Portal

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Build-Vite%208-646CFF.svg)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-4169E1.svg)](https://www.sqlalchemy.org/)

> **Core Philosophy**: A 100% transparent, community-driven festival financial management and celebration schedule system. Enables direct donor-to-committee bank transfers with **₹0 payment gateway commissions**, automated live collection tracking, public expense registers, and festive event announcements.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🏛️ System Architecture & Money Flow](#️-system-architecture--money-flow)
- [🧮 Financial Integrity & Formulas](#-financial-integrity--formulas)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quickstart & Local Installation](#-quickstart--local-installation)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
- [🔑 Default Credentials & Portal Routes](#-default-credentials--portal-routes)
- [🌐 Production Deployment Guide](#-production-deployment-guide)
  - [Backend on Render](#backend-on-render)
  - [Frontend on Vercel / Netlify / Render](#frontend-on-vercel--netlify--render)
- [📱 Multi-Screen Responsive Design](#-multi-screen-responsive-design)
- [🔒 Security & Audit Logging](#-security--audit-logging)

---

## ✨ Key Features

### 1. 💸 Zero-Commission Direct UPI Contributions
- **Direct Bank Settlement**: Payments go directly into the committee's bank account via **Dynamic UPI QR Code** (desktop) or **Native UPI App Deep-Linking** (GPay, PhonePe, Paytm, BHIM on mobile devices).
- **Zero Third-Party Cut**: Eliminates 2-3% payment aggregator transaction fees. Every rupee donated goes straight to festival celebrations.

### 2. 🪔 Public Transparency Portal (`/fund/:slug`)
- **Live Goal Progress**: Real-time progress bar tracking total collected vs. target celebration budget.
- **5-Metric Financial Health Bar**: Instant visibility into *Total Collected*, *Total Spent*, *Pending Commitments*, *Available Balance*, and *Committed Balance*.
- **Verified Donor Register**: Public list of verified contributors with donation amounts, timestamps, academic years/roles, and optional public/anonymous visibility.
- **Categorized Expense Register**: Granular breakdown of idol costs, decorations, sound/lighting, Vedic pooja essentials, and community meals (Maha Prasadam).
- **Printable Mandap QR Poster**: Organizers can generate and print a physical poster flyer with a scannable QR code to display at the celebration venue.

### 3. 📅 Celebration Schedule & Festive Announcement System
- **Featured Celebration Cards**: Prominently displays festival timelines including *Ganesh Sthapana & Maha Pooja*, *Inter-Department Rangoli Competition*, *Daily Evening Aarti*, *Maha Prasadam*, and *Grand Visarjan Procession*.
- **Top Announcement Banner**: High-priority alert banner across the public portal for urgent updates and timing changes.
- **Hero Jump Action**: 1-click smooth-scroll button to jump straight into the celebration schedule.
- **Admin Schedule Manager**: Full administrative control at `/admin/schedule` to add, edit, reorder, delete, feature, or 1-click reload festive schedule templates.

### 4. 🛡️ Committee Admin Dashboard (`/admin/dashboard`)
- **Pending Verification Queue**: Match incoming donor transaction references against committee bank statements with 1-click **Confirm & Verify** or **Reject**.
- **Donor Visibility Management**: 1-click toggle to make a donor's name **Public** or **Anonymous** on the public register if requested.
- **Manual Cash Entry**: Fast entry form to record offline cash donations and physical receipts.
- **Expense Recording & Status Tracking**: Track expenses as either `SPENT` (completed payment) or `PENDING` (planned commitment).
- **Fund Settings & Customization**: Update goal target, UPI ID, organizer details, and public URL slug.
- **Immutable Security Audit Trail**: Every transaction creation, verification, rejection, and edit is logged with administrator IDs, timestamps, and previous/new state values.

---

## 🏛️ System Architecture & Money Flow

```
                                  DONOR
                                    │
                                    ▼
                        Public Fund Portal (/fund/:slug)
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
               Scan UPI QR                Tap "Pay via UPI App"
          (Desktop / Laptop)             (Mobile App Deep-Link)
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                      GPay / PhonePe / Paytm / BHIM
                                    │
                                    ▼ (Direct Transfer • ₹0 Commission)
                        Committee Bank Account
                                    │
                                    ▼
                      Donor Enters Transaction Ref
                                    │
                                    ▼
                         FastAPI API (`PENDING`)
                                    │
                                    ▼
                         Admin Verifies Bank Credit
                                    │
                                    ▼
                       Status Updated to `VERIFIED`
                                    │
                                    ▼
                   Live Public Dashboard Automatically Updates
```

---

## 🧮 Financial Integrity & Formulas

The platform guarantees mathematical precision and prevents balance discrepancies:

1. **Total Collected**:
   $$\text{Total Collected} = \sum \text{Amount of all donations where status} = \text{VERIFIED}$$

2. **Total Spent**:
   $$\text{Total Spent} = \sum \text{Amount of all expenses where status} = \text{SPENT}$$

3. **Pending Commitments**:
   $$\text{Pending Expenses} = \sum \text{Amount of all expenses where status} = \text{PENDING}$$

4. **Available Balance**:
   $$\text{Available Balance} = \text{Total Collected} - \text{Total Spent}$$

5. **Committed Net Balance**:
   $$\text{Committed Balance} = \text{Total Collected} - \text{Total Spent} - \text{Pending Expenses}$$

6. **Target Goal Percentage**:
   $$\text{Collection Percentage} = \min\left(100, \frac{\text{Total Collected}}{\text{Target Amount}} \times 100\right)$$

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 8 with Hot Module Replacement (HMR)
- **Styling**: Tailwind CSS v4 with custom Festive Marigold Gold, Saffron, and Glassmorphic themes
- **Routing**: React Router DOM v6
- **Icons & Animation**: Lucide React Icons, Canvas-Confetti, Tailwind micro-animations
- **QR Generation**: `qrcode.react` (SVG & Canvas rendering)
- **HTTP Client**: Axios with automatic JWT Bearer interceptors

### Backend
- **Framework**: Python 3.11+ with FastAPI
- **Data Validation & Schemas**: Pydantic v2
- **ORM & Database**: SQLAlchemy (SQLite for local development, PostgreSQL for production)
- **Database Migrations**: Alembic with idempotent existence checks
- **Security & Authentication**: Passlib with Bcrypt password hashing, PyJWT OAuth2 Bearer Tokens
- **QR Utilities**: Python `qrcode[pil]`

---

## 🚀 Quickstart & Local Installation

### Prerequisites
Make sure you have the following installed:
- **Node.js** (v18.x or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`
- **Git**

---

### 1. Clone Repository

```bash
git clone https://github.com/SatyaTejaChukka/vinayaka_fund.git
cd vinayaka_fund
```

---

### 2. Backend Setup (FastAPI)

1. **Create and activate a Python virtual environment**:
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

2. **Install backend dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Seed database with default admin & festival data**:
   ```bash
   python backend/seed.py
   ```
   *Output confirmation:*
   ```text
   Successfully seeded demo data!
   Default Admin Email: admin@vinayaka.org
   Default Admin Password: admin123
   Default Fund Slug: vinayaka-chavithi-2026
   ```

4. **Run the FastAPI development server**:
   ```bash
   python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```
   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger UI)**: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (React + Vite)

Open a **new terminal window**:

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - **Public Portal**: `http://localhost:5173/fund/vinayaka-chavithi-2026`
   - **Admin Login**: `http://localhost:5173/admin/login`

---

## 🔑 Default Credentials & Portal Routes

| Portal Section | URL Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **Public Transparency Portal** | `/fund/vinayaka-chavithi-2026` | Public | Live goal progress, verified donations, expenses, and festival schedule. |
| **Admin Login** | `/admin/login` | Public | Secure admin login. Default: `admin@vinayaka.org` / `admin123` |
| **Admin Dashboard** | `/admin/dashboard` | Admin | Real-time overview, cash entry, expense recording, and verification queue. |
| **Schedule & Announcements** | `/admin/schedule` | Admin | Manage festival timeline, Rangoli competition, and announcement banners. |
| **Donations Register** | `/admin/donations` | Admin | Full donation history, search, filters, and donor name visibility controls. |
| **Expense Tracker** | `/admin/expenses` | Admin | Expense records, vendor details, and planned commitments. |
| **Fund Settings** | `/admin/fund-settings` | Admin | Target amount, UPI ID, QR setup, and public slug management. |
| **Audit Logs** | `/admin/audit-logs` | Admin | Immutable security and transaction audit trail. |

---

## 🌐 Production Deployment Guide

### Backend on Render
1. Create a **Web Service** pointing to your repository.
2. Set **Root Directory**: `backend`
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `SECRET_KEY`: A secure random secret string.
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`

### Frontend on Vercel / Netlify / Render
1. Set **Root Directory**: `frontend`
2. **Build Command**:
   ```bash
   npm run build
   ```
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://vinayaka-fund-api.onrender.com`).

---

## 📱 Multi-Screen Responsive Design

The user interface has been optimized for all screen sizes:
- **Mobile Phones (320px – 480px)**: Compact layouts, full-width touch targets, stacked metric headers, and horizontal scroll-safe monospace badges.
- **Tablets & Phablets (640px – 1024px)**: 2-column adaptive grids for schedule events and metric cards.
- **Laptops & Large Desktops (1024px – 1920px+)**: 3-column celebration event grids and centered max-width containment (`max-w-7xl`).

---

## 🔒 Security & Audit Logging

- **JWT Authentication**: Secure token authentication with expiration and automatic route protection.
- **Password Security**: Passwords hashed using Bcrypt.
- **Audit Trails**: Non-destructive logging records all critical events (`CREATE`, `UPDATE`, `VERIFY`, `REJECT`, `DELETE`) with admin identity and state diffs.
- **SQL Injection & XSS Protection**: Powered by SQLAlchemy parameterized queries and Pydantic request sanitization.
