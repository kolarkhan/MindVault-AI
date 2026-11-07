"""
Memory endpoints: AI processing draft → confirmation → CRUD.

Flow (matches the mobile Create Memory → AI Processing → Memory Confirmation screens):
  1. POST /memories/process   — runs the AI pipeline, stores a `status="draft"` memory,
                                  returns the extracted fields for review.
  2. POST /memories/{id}/confirm — the user has reviewed/edited the fields; this finalizes
                                  the memory (status="confirmed"), upserts people, and makes
                                  it show up everywhere else (dashboard, timeline, search).
A draft that's never confirmed simply sits with status="draft" and is excluded from every
other listing/search — nothing is "saved" from the user's point of view until confirmed.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user_id, get_db
from app.schemas.memory import (
    MemoryConfirm,
    MemoryCreate,
    MemoryListResponse,
    MemoryOut,
    MemoryUpdate,
    ProcessMemoryResponse,
)
from app.services.ai.provider import get_ai_provider
from app.services.memory_processor import (
    compute_embedding,
    process_memory_content,
    resolve_original_content,
)
from app.services.people_service import upsert_people
from app.services.storage_service import get_storage_backend

router = APIRouter(prefix="/memories", tags=["memories"])


def _to_out(doc: dict) -> MemoryOut:
    return MemoryOut(
        id=str(doc["_id"]),
        source_type=doc["source_type"],
        title=doc.get("title") or "(untitled)",
        content=doc["content"],
        summary=doc.get("summary"),
        category=doc.get("category", "Other"),
        tags=doc.get("tags", []),
        people=doc.get("people", []),
        amounts=doc.get("amounts", []),
        dates=doc.get("dates", []),
        is_financial=doc.get("is_financial", False),
        location=doc.get("location"),
        importance=doc.get("importance", "normal"),
        is_favorite=doc.get("is_favorite", False),
        is_archived=doc.get("is_archived", False),
        is_deleted=doc.get("is_deleted", False),
        attachment_ids=[str(a) for a in doc.get("attachment_ids", [])],
        ai_provider=doc.get("ai_provider"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post("/process", response_model=ProcessMemoryResponse)
async def process_memory(
    payload: MemoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    provider = get_ai_provider()

    image_bytes = None
    mime_type = None
    if payload.source_type in ("image", "camera") and payload.attachment_ids:
        attachment = await db.attachments.find_one(
            {"_id": ObjectId(payload.attachment_ids[0]), "user_id": ObjectId(user_id)}
        )
        if attachment:
            mime_type = attachment.get("content_type")
            backend = get_storage_backend()
            try:
                from pathlib import Path

                from app.config import get_settings

                settings = get_settings()
                key = attachment["storage_key"].split("/")[-1]
                local_path = Path(settings.local_storage_dir) / key
                if local_path.exists():
                    image_bytes = local_path.read_bytes()
            except Exception:
                image_bytes = None

    original_content = await resolve_original_content(
        provider, payload.source_type, payload.content, image_bytes, mime_type
    )

    result = await process_memory_content(provider, original_content, payload.source_type)
    embedding = await compute_embedding(provider, original_content, result.summary)

    now = datetime.now(timezone.utc)
    draft_doc = {
        "user_id": ObjectId(user_id),
        "source_type": payload.source_type,
        "status": "draft",
        "title": payload.title or result.summary[:60],
        "content": original_content,
        "summary": result.summary,
        "category": result.suggested_category,
        "tags": result.suggested_tags,
        "people": [p.model_dump() for p in result.people],
        "amounts": [a.model_dump() for a in result.amounts],
        "dates": [d.model_dump() for d in result.dates],
        "is_financial": result.is_financial,
        "location": payload.location,
        "importance": payload.importance,
        "is_favorite": False,
        "is_archived": False,
        "is_deleted": False,
        "attachment_ids": [ObjectId(a) for a in payload.attachment_ids],
        "ai_provider": result.provider,
        "embedding": embedding,
        "created_at": now,
        "updated_at": now,
    }
    insert_result = await db.memories.insert_one(draft_doc)

    return ProcessMemoryResponse(
        draft_id=str(insert_result.inserted_id),
        result=result,
        original_content=original_content,
    )


@router.post("/{memory_id}/confirm", response_model=MemoryOut)
async def confirm_memory(
    memory_id: str,
    payload: MemoryConfirm,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.memories.find_one({"_id": ObjectId(memory_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Memory draft not found.")

    now = datetime.now(timezone.utc)
    update = {
        "status": "confirmed",
        "title": payload.title.strip() or doc.get("title", "(untitled)"),
        "category": payload.category,
        "tags": payload.tags,
        "people": [p.model_dump() for p in payload.people],
        "amounts": [a.model_dump() for a in payload.amounts],
        "dates": [d.model_dump() for d in payload.dates],
        "is_financial": len(payload.amounts) > 0,
        "importance": payload.importance,
        "updated_at": now,
    }
    await db.memories.update_one({"_id": ObjectId(memory_id)}, {"$set": update})

    if payload.people:
        await upsert_people(db, user_id, [p.name for p in payload.people], memory_id)

    updated = await db.memories.find_one({"_id": ObjectId(memory_id)})
    return _to_out(updated)


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    category: str | None = None,
    favorite: bool | None = None,
    archived: bool = False,
    deleted: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {
        "user_id": ObjectId(user_id),
        "status": "confirmed",
        "is_archived": archived,
        "is_deleted": deleted,
    }
    if category:
        query["category"] = category
    if favorite is not None:
        query["is_favorite"] = favorite

    total = await db.memories.count_documents(query)
    cursor = (
        db.memories.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = [_to_out(doc) async for doc in cursor]
    return MemoryListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{memory_id}", response_model=MemoryOut)
async def get_memory(
    memory_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.memories.find_one({"_id": ObjectId(memory_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Memory not found.")
    return _to_out(doc)


@router.patch("/{memory_id}", response_model=MemoryOut)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.memories.find_one({"_id": ObjectId(memory_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Memory not found.")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.memories.update_one({"_id": ObjectId(memory_id)}, {"$set": updates})

    updated = await db.memories.find_one({"_id": ObjectId(memory_id)})
    return _to_out(updated)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    permanent: bool = False,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db.memories.find_one({"_id": ObjectId(memory_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Memory not found.")

    if permanent:
        await db.memories.delete_one({"_id": ObjectId(memory_id)})
    else:
        await db.memories.update_one(
            {"_id": ObjectId(memory_id)},
            {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
        )
