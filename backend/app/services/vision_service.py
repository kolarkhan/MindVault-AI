"""Turns an uploaded image into factual text content the memory processor can extract
from — never invents what's in the picture, just describes what the vision model (or,
in mock mode, a clear placeholder) observes."""
from app.services.ai.provider import LLMProvider


async def describe_image_for_memory(provider: LLMProvider, image_bytes: bytes, mime_type: str) -> str:
    return await provider.describe_image(image_bytes, mime_type)
