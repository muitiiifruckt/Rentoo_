"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import (
    auth, users, items, rentals, messages, notifications, categories
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
try:
    app.mount("/static", StaticFiles(directory=settings.upload_dir), name="static")
except Exception:
    # Directory might not exist yet
    pass


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    try:
        logger.info("Starting application...")
        await connect_to_mongo()
        logger.info("Backend started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    await close_mongo_connection()


# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(items.router)
app.include_router(rentals.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(categories.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Rentoo API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


