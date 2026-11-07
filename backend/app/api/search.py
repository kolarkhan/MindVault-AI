from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user_id, get_db
from app.schemas.memory import SearchRequest, SearchResponse
from app.services.ai.provider import get_ai_provider
from app.services.rag_service import search_memories

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search(
    payload: SearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    provider = get_ai_provider()
    return await search_memories(db, provider, user_id, payload.query, payload.top_k)
