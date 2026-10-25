from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import category_router
from app.routers import equipment_router
from app.routers import user_details_router
from app.routers import order_router
from app.routers import equipment_qty_router
from app.routers import store_router
from app.routers import inventory_router
from app.routers import dashboard_router
from app.routers import auth_router
from app.config import get_settings

app = FastAPI(
    title="GiriPremi IMS API",
    description="Inventory Management System for Giripremi mountaineering store",
    version="2.0.0",
)

settings = get_settings()

configured_origins = [origin.strip() for origin in settings.frontend_origins.split(",") if origin.strip()]
origins = configured_origins if configured_origins else ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router (public — no JWT required)
app.include_router(auth_router.router)

# Resource routers
app.include_router(equipment_router.router)
app.include_router(category_router.router)
app.include_router(user_details_router.router)
app.include_router(order_router.router)
app.include_router(equipment_qty_router.router)
app.include_router(store_router.router)
app.include_router(inventory_router.router)
app.include_router(dashboard_router.router)