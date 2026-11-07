"""
MongoDB connection management + index setup.

Uses Motor (async driver) against MongoDB Atlas in production/development, and is
swappable for `mongomock_motor` in tests (see tests/conftest.py) so the test suite never
needs a real database.
"""
import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[settings.mongodb_db_name]
    return _db


def set_database(db: AsyncIOMotorDatabase) -> None:
    """Test hook: inject a fake/mock database instance."""
    global _db
    _db = db


async def ensure_indexes() -> None:
    """Create indexes required for correct, efficient, user-isolated queries.

    Safe to call on every startup — `create_index` is idempotent.
    The Atlas Vector Search index (for semantic search) cannot be created through the
    standard driver API and must be created once via Atlas UI/CLI — see README.md.
    """
    db = get_database()

    await db.users.create_index("email", unique=True)

    await db.memories.create_index([("user_id", 1), ("created_at", -1)])
    await db.memories.create_index([("user_id", 1), ("category", 1)])
    await db.memories.create_index([("user_id", 1), ("is_favorite", 1)])
    await db.memories.create_index([("user_id", 1), ("is_archived", 1)])
    await db.memories.create_index([("user_id", 1), ("is_deleted", 1)])
    await db.memories.create_index(
        [("title", "text"), ("content", "text"), ("summary", "text")],
        name="memory_text_search",
    )

    await db.categories.create_index([("user_id", 1), ("name", 1)], unique=True)
    await db.people.create_index([("user_id", 1), ("name", 1)], unique=True)
    await db.attachments.create_index([("user_id", 1), ("memory_id", 1)])

    logger.info("MongoDB indexes ensured.")
