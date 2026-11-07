from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user_id, get_db
from app.services.storage_service import StorageError, get_storage_backend, validate_upload

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    content = await file.read()
    try:
        validate_upload(file.filename or "upload", file.content_type or "application/octet-stream", len(content))
    except StorageError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    backend = get_storage_backend()
    stored_key = await backend.save(file.filename or "upload", content, file.content_type or "application/octet-stream")

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": ObjectId(user_id),
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "storage_key": stored_key,
        "memory_id": None,
        "created_at": now,
    }
    result = await db.attachments.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "filename": file.filename,
        "content_type": file.content_type,
        "url": stored_key,
        "size_bytes": len(content),
    }
