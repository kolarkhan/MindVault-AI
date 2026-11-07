"""Auto-upserts lightweight people records from AI-extracted names.

Phase 1 keeps this minimal (name + mention count + last-mentioned memory) — the full
People index / Person Detail screens are Phase 2. This exists now so that data isn't
lost and Phase 2 can build directly on it.
"""
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def upsert_people(db: AsyncIOMotorDatabase, user_id: str, names: list[str], memory_id: str) -> None:
    now = datetime.now(timezone.utc)
    for name in names:
        clean = name.strip()
        if not clean:
            continue
        await db.people.update_one(
            {"user_id": ObjectId(user_id), "name": clean},
            {
                "$set": {"last_mentioned_at": now, "last_memory_id": ObjectId(memory_id)},
                "$inc": {"mention_count": 1},
                "$setOnInsert": {
                    "user_id": ObjectId(user_id),
                    "name": clean,
                    "created_at": now,
                },
            },
            upsert=True,
        )
