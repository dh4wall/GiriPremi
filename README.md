# GiriPremi IMS — Monorepo

This monorepo contains both the **frontend** and **backend** for the GiriPremi Inventory Management System.

## Structure

```bash
giri premi/
├── frontend/   # React/Vite frontend
└── backend/    # FastAPI (Python) backend
```

## Getting Started

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .

# Initial database setup (MySQL Server + Workbench)
python init_db.py

# Optional SQL setup for a fresh MySQL database
mysql -u root -p GiriPremi < init.sql
mysql -u root -p GiriPremi < seed.sql

# Run the server
uvicorn app.main:app --reload
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The application will be available at [http://localhost:5173](http://localhost:5173)

For development, select a role and tick **Use demo credentials** on the login page.
This fills the matching demo account. The demo users are created by `python init_db.py`:

- Super Admin: `demo.admin@giripremi.com` / `DemoAdmin@123`
- Store Admin: `demo.store@giripremi.com` / `DemoStore@123`

Member records are visible to administrators for issue/return workflows, but member
accounts cannot log in to the management portal.

The SQL files in `backend/` provide the same database structure and representative
data for stores, categories, equipment, inventory, members, and issue/return orders.
The seed script is safe to run repeatedly and does not remove existing data.

## Features
- **Inventory Management**: Track equipment with detailed metadata.
- **Store & Inventory Tracking**: Product-wise available counts per store with CRUD operations for managing multiple warehouses.
- **Issue & Return Workflow**: Streamlined process for checking out gear to members and handling partial or full returns with automated stock updates.
- **Category Management**: Organized categories with inspection tracking.
- **Excel Import**: Bulk import equipment and categories with robust validation.
- **Uniform Professional UI**: Cohesive, high-polish interface across all modules (Dashboard, Inventory, Return, Members, Inspections, Reports) using a consistent design language and Material Symbols.
