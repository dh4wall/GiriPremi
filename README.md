# 🏔️ GiriPremi — Expedition Equipment & Inventory Management System

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/TiDB_Cloud-F32B56?style=for-the-badge&logo=databricks&logoColor=white" alt="TiDB" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render" />
</p>

<p align="center">
  <strong>Mission-critical inventory, multi-store allocation, and equipment lifecycle tracking engineered for the pioneer mountaineering expeditions of GiriPremi.</strong>
</p>

---

## 📌 Overview

**GiriPremi IMS** is a production-grade, full-stack inventory and gear-management platform designed for mountaineering, trekking, and search-and-rescue organizations. It provides real-time multi-depot stock allocation, barcode/SKU tracking, lifecycle and condition audits, automated safety inspections, and member equipment dispatch/return workflows with complete audit trails.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Vercel CDN)"]
        UI["React 18 SPA (Vite 6)"]
        State["Auth & Inventory Context"]
        Routing["Client-Side Routing (vercel.json)"]
    end

    subgraph GatewayLayer["🌐 Network & Security Gateway"]
        HTTPS["TLS / HTTPS Encryption"]
        CORS["CORS Dynamic Regex (*.vercel.app)"]
    end

    subgraph ServiceLayer["⚡ Backend Web Service (Render Free Tier)"]
        FastAPI["FastAPI REST API (Uvicorn Async)"]
        JWT["JWT Auth & Role Guard (OAuth2)"]
        Routers["Modular Routers (Inventory, Orders, Telemetry)"]
        SQLA["SQLAlchemy ORM + Connection Pool"]
    end

    subgraph DataLayer["☁️ Cloud Database (TiDB Serverless)"]
        TiDB["Distributed MySQL 8.0 Cluster"]
        Pool["Auto-Wake Serverless Storage (AWS ap-southeast-1)"]
    end

    UI --> Routing --> GatewayLayer
    GatewayLayer --> HTTPS --> CORS --> FastAPI
    FastAPI --> JWT --> Routers --> SQLA
    SQLA -->|SSL / Pool Pre-Ping| TiDB
```

---

## 🗄️ Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    STORE ||--o{ EQUIPMENT_QTY : "maintains stock in"
    STORE ||--o{ ORDER_ITEMS : "fulfills from"
    CATEGORY ||--o{ EQUIPMENT : "classifies"
    EQUIPMENT ||--o{ EQUIPMENT_QTY : "distributed across"
    EQUIPMENT ||--o{ ORDER_ITEMS : "dispatched in"
    USER_DETAILS ||--o{ ORDER_DETAILS : "issued to (member)"
    USER_DETAILS ||--o{ ORDER_DETAILS : "approved by (admin)"
    ORDER_DETAILS ||--|{ ORDER_ITEMS : "contains items"

    STORE {
        bigint id PK
        varchar name
        varchar contact_person
        varchar contact_number
        boolean is_active
    }

    CATEGORY {
        int id PK
        varchar name
        varchar parent_category_type
        varchar tracking_type
        boolean requires_inspection
        int inspection_frequency_months
        float product_life_year
        text description
    }

    EQUIPMENT {
        varchar_36 id PK "SKU / Code"
        varchar equipment_name
        int category_id FK
        varchar brand
        date date_of_manufacturing
        date date_of_expiry
        date purchase_date
        bigint current_store_id FK
        boolean is_available
        text general_remark
    }

    EQUIPMENT_QTY {
        varchar_36 id PK
        varchar_36 equipment_id FK
        bigint store_id FK
        int quantity
        varchar curr_condition "NEW | MODERATE | SERVICE_DUE"
    }

    USER_DETAILS {
        int id PK
        varchar email
        varchar password "Bcrypt Hash"
        varchar full_name
        varchar user_type "superAdmin | storeAdmin | member"
        varchar contact_number
        varchar id_proof_type
        varchar id_proof_number
        int total_issues
        int total_penalties
        decimal total_penalty_amount
        boolean is_active
    }

    ORDER_DETAILS {
        int id PK
        int user_id FK
        int approved_by_user_id FK
        varchar issued_to_name
        varchar approved_by_name
        date issue_date
        date expected_return_date
        date actual_return_date
        varchar purpose "Training | Expedition | Trek"
        varchar status "ISSUED | COMPLETED | PENDING"
        text remarks
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        varchar_36 equipment_id FK
        bigint store_id FK
        int quantity_issued
        int quantity_returned
        int quantity_pending
        int quantity_lost
        varchar return_condition
    }
```

---

## 🎨 Tech Stack Matrix

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite 6** | High-performance SPA with fast HMR |
| **Styling & UX** | **Vanilla CSS + Material Symbols** | Premium dark-mode alpine aesthetics, responsive layouts, glassmorphism |
| **Backend Framework** | **FastAPI (Python 3.12)** | Asynchronous, type-safe REST API endpoints |
| **Database & ORM** | **SQLAlchemy + PyMySQL** | Relational mapping, connection resilience (`pool_pre_ping`, `pool_recycle`) |
| **Cloud Database** | **TiDB Cloud Serverless** | Scalable, auto-waking MySQL 8.0-compatible distributed cloud cluster |
| **Security & Auth** | **JWT (python-jose) + Passlib (Bcrypt)** | Stateless token-based role-based access control (RBAC) |
| **Frontend Hosting** | **Vercel** | Global edge network with zero-config single page app rewrites |
| **Backend Hosting** | **Render (Web Service)** | Containerized Linux cloud runner for Python/Uvicorn |

---

## ✨ Core Features

- 📊 **Executive Telemetry Dashboard**: Real-time metrics for available gear, active dispatches, category share distributions, and dynamic safety compliance health bars.
- 🏬 **Multi-Depot Inventory Engine**: Track physical inventory balances across HQ, regional depots, and forward high-altitude base camps.
- 🎒 **Issue & Return Dispatch Console**: Full checkout workflow with member identity verification, purpose logging, expected return timelines, and condition assessments upon check-in.
- 🔍 **Safety Health & Inspection Alerts**: Automated calculation of approaching expiry dates (within 48 days) for ropes, helmets, harnesses, and alpine hardware.
- 📁 **Excel Import / Export**: Bulk-upload equipment catalog and category trees with schema validation.
- 🛡️ **Role-Based Security**: Segregated interfaces and access rules for **Super Admins**, **Store Managers**, and **Expedition Members**.

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & **npm**
- **MySQL 8.0** or **TiDB Cloud Serverless** connection

---

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Configure `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/<dbname>
SECRET_KEY=your-custom-jwt-secret-key-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FRONTEND_ORIGINS=http://localhost:5173
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Create environment file
cp .env.example .env
```

Configure `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment Guide

### A. Deploy Backend on Render
1. Create a **New Web Service** from your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Environment Variables:
   - `DATABASE_URL`: `mysql+pymysql://<user>:<password>@<host>:4000/giripremi`
   - `SECRET_KEY`: `giripremi-super-secret-jwt-key-change-in-production-2024`
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `480`
   - `FRONTEND_ORIGINS`: `http://localhost:5173` *(Vercel production and preview subdomains are auto-allowed by dynamic CORS regex)*

### B. Deploy Frontend on Vercel
1. Import repository into Vercel.
2. Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com` *(no trailing slash)*

---

## 🔑 Default Seed Accounts

The database includes pre-configured demo and administrative accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@giripremi.com` | `Admin@123` | Full System & Configuration Control |
| **Store Admin** | `store@giripremi.com` | `Store@123` | Inventory, Issues & Depot Operations |
| **Demo Admin** | `demo.admin@giripremi.com` | `DemoAdmin@123` | Read/Write Evaluation Profile |
| **Demo Store** | `demo.store@giripremi.com` | `DemoStore@123` | Warehouse Operations Evaluation |

---

## 📜 Database Seeding & Schema Scripts

The `backend/sql/` directory contains full SQL initialization scripts:
- [`backend/sql/init.sql`](backend/sql/init.sql): Schema creation for all 7 tables with indexing, foreign key constraints, and cascade delete rules.
- [`backend/sql/seed.sql`](backend/sql/seed.sql): Rich initial dataset featuring 3 stores, 8 mountaineering gear categories, 16 equipment models, 18 stock distributions (218 total items), and issue/return order records.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Developed with pride for the mountaineers and explorers of **GiriPremi**.
