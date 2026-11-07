"""Thin wrapper around the active LLMProvider's embedding call — kept as its own module
so Phase 2 can add chunking/batching here without touching callers."""
from app.services.ai.provider import LLMProvider


async def embed_text(provider: LLMProvider, text: str) -> list[float]:
    # Guard against embedding empty strings (wastes a call / breaks some providers).
    cleaned = text.strip()
    if not cleaned:
        return []
    return await provider.embed(cleaned)
