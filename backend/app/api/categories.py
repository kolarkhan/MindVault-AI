from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user_id, get_db
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


def _to_out(doc: dict, count: int = 0) -> CategoryOut:
    return CategoryOut(
        id=str(doc["_id"]),
        name=doc["name"],
        icon=doc.get("icon", "folder"),
        color=doc.get("color", "#8E8E93"),
        is_default=doc.get("is_default", False),
        is_sensitive=doc.get("is_sensitive", False),
        memory_count=count,
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    user_id: str = Depends(get_current_user_id), db: AsyncIOMotorDatabase = Depends(get_db)
):
    cursor = db.categories.find({"user_id": ObjectId(user_id)}).sort("name", 1)
    categories = [doc async for doc in cursor]
    counts = {
        row["_id"]: row["count"]
        async for row in db.memories.aggregate(
            [
                {"$match": {"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            ]
        )
    }
    return [_to_out(c, counts.get(c["name"], 0)) for c in categories]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": ObjectId(user_id),
        "name": payload.name.strip(),
        "icon": payload.icon,
        "color": payload.color,
        "is_default": False,
        "is_sensitive": payload.is_sensitive,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.categories.insert_one(doc)
    except Exception as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, "A category with this name already exists.") from exc
    doc["_id"] = result.inserted_id
    return _to_out(doc)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    category = await db.categories.find_one({"_id": ObjectId(category_id), "user_id": ObjectId(user_id)})
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")
    if category.get("is_default"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Default categories cannot be deleted.")
    await db.categories.delete_one({"_id": ObjectId(category_id)})
