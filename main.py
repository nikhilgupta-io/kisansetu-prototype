"""
KisanSetu — FastAPI Application Entry Point.

Configures CORS, registers all route modules, and creates
the database tables on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

# Import all models so they are registered with Base.metadata
import models  # noqa: F401

# Import routers
from routers import farmer, slots, queue, mandi, admin, allocation, sync, crops, ivr, prediction

# ------------------------------------------------------------------ #
# Logging                                                             #
# ------------------------------------------------------------------ #

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-28s  %(levelname)-7s  %(message)s",
)
logger = logging.getLogger("kisansetu")


# ------------------------------------------------------------------ #
# Lifespan — create tables on startup                                 #
# ------------------------------------------------------------------ #

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables when the app starts."""
    logger.info("Creating database tables …")
    Base.metadata.create_all(bind=engine)
    logger.info("Database ready.")
    yield
    logger.info("Shutting down.")


# ------------------------------------------------------------------ #
# FastAPI app                                                         #
# ------------------------------------------------------------------ #

app = FastAPI(
    title="KisanSetu API",
    description=(
        "Backend for KisanSetu — Smart Procurement Management System. "
        "SIH 2026 · PS 26032"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------ #
# CORS — allow the Vite dev server (and any localhost origin)         #
# ------------------------------------------------------------------ #

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",    # In case of CRA
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------ #
# Register routers                                                    #
# ------------------------------------------------------------------ #

app.include_router(farmer.router)
app.include_router(slots.router)
app.include_router(queue.router)
app.include_router(mandi.router)
app.include_router(admin.router)
app.include_router(allocation.router)
app.include_router(sync.router)
app.include_router(crops.router)
app.include_router(ivr.router)
app.include_router(prediction.router)


# ------------------------------------------------------------------ #
# Health check                                                        #
# ------------------------------------------------------------------ #

@app.get("/", tags=["Health"])
def root():
    """Health-check endpoint."""
    return {
        "service": "KisanSetu API",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/api/health", tags=["Health"])
def health():
    """API health-check endpoint."""
    return {"status": "ok"}