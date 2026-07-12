# AssetFlow ERP 🏢

> **Enterprise Asset & Resource Management System** — Built for the Odoo Hackathon

AssetFlow is a full-stack, production-grade ERP platform that helps organizations digitize and manage their physical assets, shared resources, maintenance workflows, audits, and more — all in one elegant interface.

---

## 🌐 Live Demo

> Deploy to Vercel using the button below ⬇️

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nikunj-1812/Oddo-Hackthon-AssetFlow-Enterprise-Asset-Resource-Management-System)

---

## ✨ Features

### 🔐 Authentication & RBAC
- Secure sign-up, login, forgot-password, and reset-password flows
- JWT-based sessions via **NextAuth v5**
- Role-Based Access Control with **4 roles**: Admin, Asset Manager, Department Head, Employee
- Signup always creates Employee accounts — Admin promotes via panel

### 📊 Role-Based Dashboards
- **Admin Dashboard** — Organization-wide KPIs, charts, recent activity
- **Asset Manager Dashboard** — Allocation, maintenance, transfer summaries
- **Department Head Dashboard** — Department-scoped asset and booking view
- **Employee Dashboard** — My assets, my bookings, raise requests

### 🏷️ Asset Management
- Register assets with auto-generated **Asset Tags** (e.g., `AF-0001`)
- Fields: Name, Category, Serial Number, Cost (₹), Acquisition Date, Location, Condition, Images, Documents
- Full **Asset Lifecycle**: Available → Allocated → Under Maintenance → Retired / Disposed
- QR Code generation & scanning per asset
- Complete history trail — never deleted

### 📦 Allocation Module
- Allocate assets to employees with expected return dates
- Overdue detection and return flow with condition check
- One asset → One owner (no double allocation enforced)

### 🔧 Maintenance Module
- Employee raises a maintenance request
- **Kanban-style workflow board**: Pending → Approved → Technician Assigned → In Progress → Resolved
- Full drag-and-drop Kanban with real-time card movement (dnd-kit)
- Asset status automatically changes to `UNDER_MAINTENANCE` on approval

### 🗓️ Resource Booking
- Calendar-based booking for shared resources (meeting rooms, vehicles, equipment)
- Overlap detection — no double-bookings allowed
- Statuses: Upcoming, Ongoing, Completed, Cancelled

### 🔄 Transfers & Returns
- Employee requests asset transfer to another department/employee
- Manager or Department Head approves
- Return requests with condition verification

### 🔍 Audit Module
- Create audit cycles scoped to department or location
- Assign auditors, verify assets (Verified / Missing / Damaged)
- Generate discrepancy reports — audit closure locks records permanently

### 📈 Reports
- Asset Utilization, Maintenance Frequency, Idle Assets
- Department Summary, Booking Heatmap

### 🔔 Notifications & Activity Logs
- Auto-generated notifications for all key workflow events
- Immutable activity log: User, Action, Timestamp, Target, Old Value → New Value

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | TailwindCSS v4 + shadcn/ui |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Forms** | React Hook Form + Zod |
| **Tables** | TanStack Table |
| **Charts** | Recharts |
| **Auth** | NextAuth v5 (beta) |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL (Neon) |
| **QR Code** | qrcode.react + jsqr |
| **Package Manager** | Bun |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ or **Bun** v1.2+
- **PostgreSQL** database (local or [Neon](https://neon.tech))
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/Nikunj-1812/Oddo-Hackthon-AssetFlow-Enterprise-Asset-Resource-Management-System.git
cd Oddo-Hackthon-AssetFlow-Enterprise-Asset-Resource-Management-System
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** Generate a secure secret with `openssl rand -hex 32`

### 4. Set up the database

```bash
# Push the Prisma schema to your database
bunx prisma db push

# (Optional) Seed initial data
bunx prisma db seed
```

### 5. Run the development server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📂 Project Structure

```
assetflow/
├── app/
│   ├── api/              # API route handlers
│   ├── dashboard/        # All dashboard pages (role-based)
│   │   ├── assets/
│   │   ├── allocations/
│   │   ├── bookings/
│   │   ├── maintenance/
│   │   ├── transfers/
│   │   ├── return-requests/
│   │   ├── audits/
│   │   ├── reports/
│   │   ├── organization/
│   │   ├── notifications/
│   │   ├── activity-logs/
│   │   └── scanner/
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── page.tsx          # Landing page
├── features/             # Feature-based business logic
├── components/           # Shared UI components
├── lib/                  # Utilities, auth config, Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── providers/            # React context providers
└── middleware.ts         # Auth & route protection
```

---

## 🚢 Deployment (Vercel)

### Manual Vercel deployment

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the following **Environment Variables** in Vercel project settings:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
   | `NEXTAUTH_SECRET` | Random secret string (min 32 chars) |
   | `NEXTAUTH_URL` | Your production URL (e.g., `https://yourapp.vercel.app`) |

4. After deploying, run the database migration:
   ```bash
   bunx prisma db push
   ```

> **Note:** Use [Neon](https://neon.tech) for a free serverless PostgreSQL database that works seamlessly with Vercel.

---

## 👥 User Roles

| Role | Description |
|---|---|
| **Admin** | Full access — manage org, promote roles, view analytics, create audit cycles |
| **Asset Manager** | Register & allocate assets, approve transfers, maintenance & returns |
| **Department Head** | Approve departmental allocations, book shared resources |
| **Employee** | View own assets, book resources, raise maintenance/transfer/return requests |

> **Default:** Every signup creates an Employee account. Admins promote users via the Organization panel.

---

## 🗃️ Database Schema Highlights

- **Users** — with RBAC roles and department association
- **Assets** — full lifecycle with status enums and history
- **Allocations** — with return tracking and overdue detection
- **MaintenanceRequests** — workflow with Kanban statuses
- **Bookings** — calendar-based with overlap prevention
- **Transfers** — department/employee asset movement
- **AuditCycles** — scoped audits with discrepancy reports
- **Notifications** — auto-generated event notifications
- **ActivityLogs** — immutable audit trail

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Nikunj** — [@Nikunj-1812](https://github.com/Nikunj-1812)

Built with ❤️ for the Odoo Hackathon 2026
