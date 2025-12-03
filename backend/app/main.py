"""Main FastAPI application."""
import logging
import os
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
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

# Static files - Get absolute path to uploads directory FIRST
# __file__ is app/main.py, so parent.parent gives backend directory
backend_dir = Path(__file__).parent.parent.resolve()
upload_dir_path = (backend_dir / settings.upload_dir).resolve()

# Ensure directory exists
upload_dir_path.mkdir(parents=True, exist_ok=True)

logger.info(f"Upload directory path: {upload_dir_path}")
logger.info(f"Upload directory exists: {upload_dir_path.exists()}")
if upload_dir_path.exists():
    items_dir = upload_dir_path / "items"
    logger.info(f"Items directory exists: {items_dir.exists()}")
    if items_dir.exists():
        files = list(items_dir.glob("*.jpg"))
        logger.info(f"Found {len(files)} image files in items directory")

# Static file endpoint - MUST be before routers to catch /static/ requests
@app.get("/static/{file_path:path}")
async def serve_static_file(file_path: str):
    """Serve static files."""
    try:
        logger.info(f"🔍 Static endpoint called: {file_path}")
        file_full_path = upload_dir_path / file_path
        logger.info(f"📁 Full path: {file_full_path}")
        logger.info(f"✅ Exists: {file_full_path.exists()}")
        
        if not file_full_path.exists():
            logger.warning(f"❌ File not found: {file_full_path}")
            return Response(status_code=404, content="File not found")
        
        if not file_full_path.is_file():
            logger.warning(f"❌ Not a file: {file_full_path}")
            return Response(status_code=404, content="Not a file")
        
        # Security check
        try:
            file_full_path.resolve().relative_to(upload_dir_path.resolve())
        except ValueError:
            logger.warning(f"🚫 Security check failed: {file_path}")
            return Response(status_code=403, content="Forbidden")
        
        logger.info(f"✅ Serving file: {file_path}")
        return FileResponse(str(file_full_path))
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)
        return Response(status_code=500, content="Internal server error")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


