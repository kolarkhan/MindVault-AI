"""
Retrieval-Augmented Generation for the AI Search Assistant.

Grounding contract (from the product spec): every answer must be backed by the user's
own retrieved memories, and if nothing reliable is found the fixed fallback message is
returned verbatim — the LLM is instructed never to answer from outside knowledge, and
this service never calls generate_rag_answer with an empty context unless it truly found
nothing.
"""
from __future__ import annotations

import math

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import get_settings
from app.schemas.memory import SearchResponse, SearchSourceCard
from app.services.ai.provider import LLMProvider

settings = get_settings()

MIN_RELEVANCE_SCORE = 0.15  # below this, a match is treated as unreliable and dropped


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def _vector_search_atlas(
    db: AsyncIOMotorDatabase, user_id: str, query_embedding: list[float], top_k: int
) -> list[dict] | None:
    """Tries the Atlas $vectorSearch aggregation. Returns None (not []) if the index
    doesn't exist yet, so the caller knows to fall back rather than reporting zero
    results incorrectly."""
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": settings.vector_index_name,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": max(top_k * 10, 50),
                    "limit": top_k,
                    "filter": {"user_id": ObjectId(user_id)},
                }
            },
            {"$addFields": {"score": {"$meta": "vectorSearchScore"}}},
        ]
        cursor = db.memories.aggregate(pipeline)
        return [doc async for doc in cursor]
    except Exception:
        # Index not configured yet, or Atlas Search unavailable (e.g. local MongoDB).
        return None


async def _cosine_fallback_search(
    db: AsyncIOMotorDatabase, user_id: str, query_embedding: list[float], top_k: int
) -> list[dict]:
    cursor = db.memories.find(
        {"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}, "embedding": {"$exists": True}}
    )
    scored = []
    async for doc in cursor:
        score = _cosine_similarity(query_embedding, doc.get("embedding", []))
        scored.append((score, doc))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    results = []
    for score, doc in scored[:top_k]:
        doc["score"] = score
        results.append(doc)
    return results


async def search_memories(
    db: AsyncIOMotorDatabase,
    provider: LLMProvider,
    user_id: str,
    query: str,
    top_k: int = 6,
) -> SearchResponse:
    query_embedding = await provider.embed(query)

    results = await _vector_search_atlas(db, user_id, query_embedding, top_k)
    if results is None:
        results = await _cosine_fallback_search(db, user_id, query_embedding, top_k)

    reliable = [r for r in results if r.get("score", 0) >= MIN_RELEVANCE_SCORE]

    if not reliable:
        return SearchResponse(
            answer="I couldn't find that information in your memories.",
            grounded=False,
            sources=[],
            provider=provider.name,
        )

    context_snippets = [
        f"Title: {r.get('title', '')}\nContent: {r.get('content', '')}\nSummary: {r.get('summary', '')}"
        for r in reliable
    ]
    answer = await provider.generate_rag_answer(query, context_snippets)

    sources = [
        SearchSourceCard(
            memory_id=str(r["_id"]),
            title=r.get("title") or "(untitled)",
            snippet=(r.get("content") or "")[:160],
            category=r.get("category", "Other"),
            score=round(float(r.get("score", 0)), 4),
            created_at=r["created_at"],
        )
        for r in reliable
    ]

    return SearchResponse(answer=answer, grounded=True, sources=sources, provider=provider.name)
