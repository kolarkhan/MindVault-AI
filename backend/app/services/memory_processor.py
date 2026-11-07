"""
Orchestrates the AI processing pipeline for a single memory:
  1. Resolve "original content" (raw text, or a factual image description for image/camera).
  2. Run extraction (summary, category, tags, people, amounts, dates) via the active provider.
  3. Compute an embedding for later semantic search.

This is called from POST /memories/process (AI Processing screen) and returns a draft the
client must explicitly confirm via POST /memories/{id}/confirm (Memory Confirmation screen)
before anything is treated as final — this is the spec's "ask for confirmation before saving
important extracted facts" requirement.
"""
from __future__ import annotations

from app.schemas.memory import AIProcessingResult
from app.services.ai.provider import LLMProvider
from app.services.embedding_service import embed_text
from app.services.vision_service import describe_image_for_memory


async def resolve_original_content(
    provider: LLMProvider, source_type: str, text_content: str, image_bytes: bytes | None, mime_type: str | None
) -> str:
    """The original content the user provided must always be preserved as-is. For images,
    "original content" is the user's caption (if any) plus a factual AI description of the
    image, clearly attributable to the AI — never presented as something the user typed."""
    if source_type in ("image", "camera") and image_bytes:
        description = await describe_image_for_memory(provider, image_bytes, mime_type or "image/jpeg")
        if text_content.strip():
            return f"{text_content.strip()}\n\n[AI image description]: {description}"
        return f"[AI image description]: {description}"
    return text_content


async def process_memory_content(provider: LLMProvider, content: str, source_type: str) -> AIProcessingResult:
    return await provider.process_memory(content, source_type)


async def compute_embedding(provider: LLMProvider, content: str, summary: str) -> list[float]:
    # Embed summary + content together for a slightly richer semantic signal.
    text = f"{summary}\n{content}".strip()
    return await embed_text(provider, text)
