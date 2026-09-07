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
pip install -r requirements.txt

# Initial database setup (MariaDB)
python init_db.py

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

## Features
- **Inventory Management**: Track equipment with detailed metadata.
- **Store & Inventory Tracking**: Product-wise available counts per store with CRUD operations for managing multiple warehouses.
- **Issue & Return Workflow**: Streamlined process for checking out gear to members and handling partial or full returns with automated stock updates.
- **Category Management**: Organized categories with inspection tracking.
- **Excel Import**: Bulk import equipment and categories with robust validation.
- **Uniform Professional UI**: Cohesive, high-polish interface across all modules (Dashboard, Inventory, Return, Members, Inspections, Reports) using a consistent design language and Material Symbols.

