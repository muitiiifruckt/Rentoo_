"""File upload utilities."""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from app.config import settings


def ensure_upload_dir(subdir: str) -> Path:
    """Ensure upload directory exists."""
    upload_path = Path(settings.upload_dir) / subdir
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


async def save_uploaded_file(file: UploadFile, subdir: str) -> Optional[str]:
    """Save uploaded file and return URL path."""
    if not file.content_type or file.content_type not in settings.allowed_image_types:
        return None
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Ensure directory exists
    upload_dir = ensure_upload_dir(subdir)
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        content = await file.read()
        if len(content) > settings.max_upload_size:
            return None
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return relative path for URL
        return f"/static/uploads/{subdir}/{unique_filename}"
    except Exception:
        return None


def delete_file(file_url: str) -> bool:
    """Delete a file by URL."""
    try:
        # Remove /static prefix if present
        if file_url.startswith("/static/"):
            file_path = Path(settings.upload_dir) / file_url.replace("/static/uploads/", "")
        else:
            file_path = Path(settings.upload_dir) / file_url
        
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    except Exception:
        return False



