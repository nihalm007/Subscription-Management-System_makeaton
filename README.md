# Brightloop Software — Subscription Management System
> Built for the Odoo Makeathon Challenge

A unified software platform that runs the full life of a subscription business: from configuring products, variants, and plans to turning quotes into subscriptions, executing recurring billing runs, collecting multi-method payments, chasing overdue invoices, and providing executive revenue reporting with sub-second performance.

---

## 🚀 Quick Start

### 1. Installation
All dependencies are already installed. If running fresh on another system:
```bash
npm install
npm run seed
npm run build
npm start
```

The application runs at **`http://localhost:5000`**.

### 2. Demo User Switcher
The system includes pre-seeded demo accounts. You can switch between roles with **1 click** in the top navigation bar:

| Role | Name / Company | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** 👑 | Admin Brightloop | `admin@brightloop.com` | `BrightLoop2026!` | Full system control, add staff, create discount & tax rules, view all finance reports |
| **Staff** 💼 | Sarah Jenkins (Sales) | `sarah.sales@brightloop.com` | `BrightLoop2026!` | Prepare quotes, activate subscriptions, run billing, record payments |
| **Customer 1** 👤 | John Smith (Acme Shop) | `john@acmeshop.com` | `BrightLoop2026!` | Customer Portal: view own subscriptions, pay overdue invoices, print invoices |
| **Customer 2** 🏢 | Lisa Wong (MegaCorp) | `lisa@megacorp.io` | `BrightLoop2026!` | Customer Portal: Enterprise contract, self-serve renewals and add-ons |

---

## 📋 Direct Scene-by-Scene Feature Verification

### Scene 1: A New Customer Signs Up & RBAC
- **Strict Password Policy**: Passwords must be **> 8 characters** (at least 9 chars), with at least **one uppercase letter**, **one lowercase letter**, and **one special character**.
- **Unique Account Email**: Every account email is enforced unique.
- **Forgot Password Flow**: Dispatches a secure reset token and reset URL (viewable in the Email & Audit Logs tab).
- **Role-Based Access Control**:
  - **Admin**: Full system control. Only the admin can add new staff members (`/api/users/staff`) and create discount rules.
  - **Internal Staff**: Manages day-to-day operations (quotes, subscriptions, billing, payments). Blocked with 403 Forbidden from adding staff or creating discounts.
  - **Customer**: Access strictly scoped to their own subscriptions and invoices via the dedicated Customer Portal.

### Scene 2: Launching a New Plan & Product Variants
- **Products**: Name, type (*Software*, *Add-on*, *Service*, *Physical*), sales price, cost price, and notes.
- **Variants Support**: Includes brand and tier variants with price surcharges. Specifically includes the **Odoo Brand Edition** with **+₹560 surcharge** (`BD-ODOO`).
- **Subscription Plans**:
  - Billing cadences: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
  - Minimum seat quantities (e.g. 5 seats for Enterprise, 10 for Flex).
  - Availability date windows (`start_date`, `end_date`).
  - **Plan Lifecycle Rules** (configured plan-by-plan):
    - `auto_close_on_end`: Closes automatically when end date is reached.
    - `allow_close_early`: Allows early cancellation.
    - `allow_pause`: Permits pausing recurring billing.
    - `allow_renew`: Permits renewing contract terms.

### Scene 3: Turning a Quote into a Subscription
- **Quotation Templates**: Ready-to-go templates (e.g., *Enterprise SaaS Suite Offer*, *Standard SMB Growth Package*) that bundle default plans and product lines, valid for a set number of days.
- **Subscription Details**: Unique subscription number (`SUB-YYYY-XXXXX`), customer, plan, start date, expiry date, payment terms (*Net 15*, *Net 30*, *Net 60*, *Immediate*), and product lines.
- **State Machine Lifecycle**:
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
  *(With Pause/Resume and Renewal transitions strictly governed by plan rules)*.

### Scene 4: Billing Day Recurring Engine
- **Automated Invoicing**: Scans all active subscriptions due for billing on or before the selected target date.
- **Pre-filled Invoice Lines**: Pulls customer details, product lines, variants, and calculates taxes automatically from admin rules.
- **Idempotency Safeguard**: Ensures **nothing is billed twice or skipped** for the same billing period.
- **Invoice Lifecycle**: $\text{Draft} \longrightarrow \text{Confirmed} \longrightarrow \text{Paid}$ (or Cancelled).
- **Invoice Actions**: Confirm, Send Email, Cancel, Print / Save PDF.

### Scene 5: Discount Rules Engine (Admin-Only)
- **Admin Exclusivity**: Only administrators can create discount rules (staff members are blocked).
- **Discount Rules**:
  - Type: **Fixed Amount** (₹) or **Percentage** (%).
  - Conditions: Minimum purchase amount threshold or Minimum seat quantity threshold.
  - Validity start and end dates.
  - Usage limits with real-time redemption counters.
  - Scope: Can apply to **whole subscriptions** or **specific product lines**.
  - **Automation**: When active, discounts apply automatically to the next invoice and cease when expired or exhausted.

### Scene 6: Payments & Receivables
- **Recording Payments**: Matched directly against invoices with payment method (*Bank Transfer*, *Credit Card*, *Stripe*, *Cash*, *Check*, *UPI*), amount, date, and reference.
- **Status Updates**: Supports partial payments; when amount due drops to ₹0, invoice moves to `Paid`.
- **Overdue Chasing**: Tracks overdue days based on payment terms and provides a 1-click **"Chase Reminder"** dispatch button.

### Scene 7: Finance Lead End-of-Month Analytics Hub
Answers the four core questions for executive review:
1. **How many subscriptions are active?** (Count, customer count, breakdown by plan).
2. **How much revenue came in?** (Total payments collected, Monthly Recurring Revenue MRR, Annualized Run Rate ARR, monthly trajectory chart).
3. **How much is still owed?** (Accounts Receivable total across outstanding invoices).
4. **Which invoices are overdue?** (Interactive overdue list with aging buckets: 1–15 days, 16–30 days, 30+ days overdue).
- **Performance SLA**: Responds in **~1.5 milliseconds** (crushing the `< 2.0s with thousands of subscriptions` requirement).
- **Interactive Load Benchmark**: Built-in *"Test 500 Load"* button in the dashboard that seeds 500 active subscriptions in ~150ms and proves sub-second response times.

### Dedicated Customer Portal
- Small business customers can view their active subscriptions, billing cycle, renewal dates, self-serve pause/renew/cancel (based on plan permissions), view and print invoices, and settle outstanding balances via the **"Pay Now"** checkout simulator without emailing support.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Node.js & Express with `better-sqlite3` embedded relational database running in WAL mode with indexes.
- **Frontend**: React 19, Tailwind CSS v4, Lucide React icons, and Recharts visualization.
- **Security**: JWT tokens, bcryptjs password hashing, role-based authorization middleware.
- **Port**: `http://localhost:5000` (Unified production bundle).

