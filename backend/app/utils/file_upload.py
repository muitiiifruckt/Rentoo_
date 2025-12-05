"""File upload utilities."""
import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from app.config import settings

logger = logging.getLogger(__name__)


def ensure_upload_dir(subdir: str) -> Path:
    """Ensure upload directory exists."""
    # Use absolute path like in main.py
    backend_dir = Path(__file__).parent.parent.parent.resolve()
    upload_dir_path = (backend_dir / settings.upload_dir).resolve()
    upload_path = upload_dir_path / subdir
    logger.info(f"💾 [FileUpload] ensure_upload_dir: subdir={subdir}, path={upload_path}")
    upload_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"💾 [FileUpload] ✅ Directory exists: {upload_path.exists()}")
    return upload_path


async def save_uploaded_file(file: UploadFile, subdir: str) -> Optional[str]:
    """Save uploaded file and return URL path."""
    logger.info(f"💾 [FileUpload] save_uploaded_file called: subdir={subdir}, filename={file.filename}")
    logger.info(f"💾 [FileUpload] File details: content_type={file.content_type}, size={file.size if hasattr(file, 'size') else 'unknown'}")
    
    # Check content type
    if not file.content_type:
        logger.error(f"💾 [FileUpload] ❌ No content_type provided")
        return None
    
    logger.info(f"💾 [FileUpload] Allowed types: {settings.allowed_image_types}")
    if file.content_type not in settings.allowed_image_types:
        logger.error(f"💾 [FileUpload] ❌ Invalid content_type: {file.content_type} not in {settings.allowed_image_types}")
        return None
    
    logger.info(f"💾 [FileUpload] ✅ Content type validated")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    logger.info(f"💾 [FileUpload] Generated filename: {unique_filename}")
    
    # Ensure directory exists
    upload_dir = ensure_upload_dir(subdir)
    file_path = upload_dir / unique_filename
    logger.info(f"💾 [FileUpload] Full file path: {file_path}")
    
    # Save file
    try:
        logger.info(f"💾 [FileUpload] Reading file content...")
        content = await file.read()
        content_size = len(content)
        logger.info(f"💾 [FileUpload] Content read: {content_size} bytes, max allowed: {settings.max_upload_size}")
        
        if content_size > settings.max_upload_size:
            logger.error(f"💾 [FileUpload] ❌ File too large: {content_size} > {settings.max_upload_size}")
            return None
        
        logger.info(f"💾 [FileUpload] ✅ File size validated, writing to disk...")
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"💾 [FileUpload] ✅ File written successfully")
        logger.info(f"💾 [FileUpload] Verifying file exists: {file_path.exists()}")
        if file_path.exists():
            actual_size = file_path.stat().st_size
            logger.info(f"💾 [FileUpload] File size on disk: {actual_size} bytes")
        
        # Return relative path for URL
        # Note: upload_dir is mounted as /static, so path should be /static/{subdir}/{filename}
        url_path = f"/static/{subdir}/{unique_filename}"
        logger.info(f"💾 [FileUpload] ✅ Returning URL path: {url_path}")
        return url_path
    except Exception as e:
        logger.error(f"💾 [FileUpload] ❌ Exception while saving file: {e}", exc_info=True)
        return None


def delete_file(file_url: str) -> bool:
    """Delete a file by URL."""
    try:
        logger.info(f"🗑️ [FileUpload] delete_file called: file_url={file_url}")
        
        # Get absolute path to uploads directory (same logic as in main.py)
        from pathlib import Path as PathLib
        import os
        # Get backend directory (assuming this file is in app/utils/)
        backend_dir = PathLib(__file__).parent.parent.parent.resolve()
        upload_dir_path = (backend_dir / settings.upload_dir).resolve()
        
        # Remove /static prefix if present
        if file_url.startswith("/static/"):
            # Remove /static/ prefix to get relative path from upload_dir
            relative_path = file_url.replace("/static/", "")
        else:
            relative_path = file_url
        
        file_path = upload_dir_path / relative_path
        
        logger.info(f"🗑️ [FileUpload] Backend dir: {backend_dir}")
        logger.info(f"🗑️ [FileUpload] Upload dir: {upload_dir_path}")
        logger.info(f"🗑️ [FileUpload] Relative path: {relative_path}")
        logger.info(f"🗑️ [FileUpload] Resolved file path: {file_path}")
        
        if file_path.exists():
            logger.info(f"🗑️ [FileUpload] File exists, deleting...")
            file_path.unlink()
            logger.info(f"🗑️ [FileUpload] ✅ File deleted successfully: {file_path}")
            return True
        else:
            logger.warning(f"🗑️ [FileUpload] ⚠️ File not found: {file_path}")
            return False
    except Exception as e:
        logger.error(f"🗑️ [FileUpload] ❌ Exception while deleting file: {e}", exc_info=True)
        return False



