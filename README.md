# 📦 StockPilot — Enterprise Inventory Management System

StockPilot is a full-stack inventory management system built to demonstrate core **enterprise data engineering principles** — Data Integrity, Reliability, Availability, and Scalability — rather than just basic CRUD operations. It manages products, categories, suppliers, customers, purchase orders, and sales, with role-based access control and a fully audited transaction trail.

> Academic project (5th Semester Mini Project) — but built with production-grade patterns: RBAC, database triggers, ACID transactions, and OTP-based email verification.

---

## 🔗 Live Demo

- **Frontend:** https://inventory-management-system-three-teal.vercel.app
- **Backend API:** https://inventory-management-system-production-702e.up.railway.app
- **Demo login:** create an account via Register, or use a seeded demo account (see below)

---

## ✨ Key Features

### Enterprise Concepts (the actual point of this project)
- **ACID Transactions** — stock movements, sales, and purchase orders are wrapped in transactions with automatic rollback on failure (`execute_transaction()` helper + manual transaction blocks for multi-step operations)
- **Role-Based Access Control (RBAC)** — `Admin`, `Manager`, and `Staff` roles, enforced server-side via a `@require_permission()` decorator that checks against a `roles` → `role_permissions` → `permissions` join, not just hidden UI buttons
- **Audit Logging via Triggers** — 12 MySQL triggers automatically log every `INSERT`/`UPDATE`/`DELETE` on core tables into an `audit_logs` table (`table_name`, `record_id`, `action_type`, `changed_by`, `old_data`, `new_data`, `timestamp`) — the application code never writes audit logs directly
- **Data Integrity** — foreign key constraints across the schema (products → categories/suppliers, orders → customers, purchase orders → suppliers), enforced at the database level, not just in application logic
- **OTP Email Verification** — real 6-digit OTP sent via Gmail SMTP on registration; accounts are unusable until verified

### Application Features
- Product, Category, and Supplier management (full CRUD)
- **Sales** — create an order against a customer, which atomically deducts stock and logs a `Stock Out` inventory transaction in the same DB transaction
- **Purchases** — create a purchase order against a supplier with multiple line items and auto-calculated totals
- **Inventory Management** — manual Stock In / Stock Out / Adjust, with full transaction history
- Live dashboard (total products, low stock count, inventory value, recent transactions)
- Global search across products, suppliers, and customers from the navbar
- Role selection at registration (Admin / Manager / Staff)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Python, Flask |
| Database | MySQL (InnoDB) |
| Auth | Bearer token (signed via `itsdangerous`), bcrypt password hashing |
| Email | Gmail SMTP (`smtplib`) for OTP delivery |
| Rate Limiting | Flask-Limiter |
| Dev Tools | VS Code, MySQL Workbench, Git, Postman |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│   (Vite + Tailwind, Bearer token in localStorage) │
└───────────────────────┬───────────────────────────┘
                         │ REST API (JSON)
┌───────────────────────▼───────────────────────────┐
│                Flask Application Layer             │
│  Routes → @require_permission → business logic     │
└───────────────────────┬───────────────────────────┘
                         │ mysql-connector
┌───────────────────────▼───────────────────────────┐
│              MySQL (InnoDB) — Core Engine           │
│  Tables + FK constraints + 12 audit triggers        │
└─────────────────────────────────────────────────────┘
```

The database is treated as a **generic core engine** (RBAC + audit logging + transaction safety), with the inventory-specific tables (products, orders, purchase orders...) built on top of it — the same pattern real enterprise systems use so the audit/RBAC layer can be reused across modules.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0+ (InnoDB support)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for OTP emails)

### 1. Clone the repo
```bash
git clone https://github.com/Kunal8954/Inventory-management-system.git
cd Inventory-management-system
```

### 2. Database setup
```sql
CREATE DATABASE ims;
-- Import the schema (tables, triggers, seed roles/permissions) from /database/schema.sql
```

### 3. Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=ims
SECRET_KEY=generate_a_random_secret_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

Run the server:
```bash
python3 app.py
```
Backend runs at `http://localhost:5000`.

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (sends OTP email) |
| POST | `/api/auth/verify-otp` | Verify OTP, returns auth token |
| POST | `/api/auth/login` | Login (requires verified email) |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product *(requires `products.create`)* |
| POST | `/api/orders` | Create a sale — deducts stock atomically |
| POST | `/api/purchase-orders` | Create a purchase order |
| POST | `/api/inventory/in` \| `/out` \| `/adjust` | Manual stock movements |
| GET | `/health` | Health check |

Full route list in `backend/app.py`.

---

## 🔐 Roles & Permissions

| Role | Typical Access |
|---|---|
| **Admin** | Full access — products, users, all modules |
| **Manager** | Day-to-day operations — products, orders, purchases |
| **Staff** | Limited — view + record stock movements |

Permissions are stored in the database (`roles`, `permissions`, `role_permissions`) and checked server-side on every protected route — not just hidden in the UI.

---

## 📌 Planned / Future Improvements
- Barcode field on Add Product + barcode-scanner-driven Sales entry (scanner acts as a keyboard input; the `products.barcode` column already exists)
- Product image upload
- Dedicated stock-alert notifications (email/push) instead of computed low-stock views
- Order status workflow (Pending → Shipped → Completed / Cancelled)
- Automated tests

---

