"""
LLMProvider: the single interface every AI feature in this app goes through.

Design goals (from the product spec):
  - The AI must never fabricate memories or facts, and must never claim confidence it
    doesn't have.
  - Swapping the underlying model/provider must be a config change, not a code change.
  - The app must remain fully runnable (mock mode) with zero external API key, and it
    must always be obvious to the caller (and, downstream, to the user) which mode
    produced a given result — every AIProcessingResult carries a `provider` field.

Two implementations ship in Phase 1:
  - OpenAIProvider  — real LLM calls (chat completion for extraction/RAG, embeddings API,
                       vision-capable chat completion for images).
  - MockProvider    — deterministic, rule-based extraction (regex for amounts/people/dates,
                       keyword-based tags/category). No network calls. Clearly labeled.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime, timedelta

from app.config import get_settings
from app.schemas.memory import AIProcessingResult, ExtractedAmount, ExtractedDate, ExtractedPerson

logger = logging.getLogger(__name__)
settings = get_settings()

EMBEDDING_DIM = 1536

CATEGORY_NAMES = [
    "Personal", "Work", "Study", "Finance", "Important Documents",
    "Health Information", "Travel", "Ideas", "Relationships", "Tasks", "Other",
]


class LLMProvider(ABC):
    name: str

    @abstractmethod
    async def process_memory(self, content: str, source_type: str) -> AIProcessingResult:
        ...

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        ...

    @abstractmethod
    async def generate_rag_answer(self, query: str, context_snippets: list[str]) -> str:
        ...

    @abstractmethod
    async def describe_image(self, image_bytes: bytes, mime_type: str) -> str:
        """Returns a factual description of image content, to be treated as the memory's
        "original content" input to process_memory — never invented, just observed."""
        ...


# ----------------------------------------------------------------------------------
# Mock provider — deterministic, offline, used automatically when no API key is set.
# ----------------------------------------------------------------------------------

_AMOUNT_RE = re.compile(
    r"(?P<amount>[\d,]+(?:\.\d+)?)\s*(?P<currency>rs\.?|pkr|rupees?|usd|\$|dollars?)",
    re.IGNORECASE,
)
_PERSON_RE = re.compile(
    r"\b(?:to|from|with|for|gave|give|lent|loaned|paid|owes?|borrowed from)\s+"
    r"([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\b"
)
_TXN_VERBS = {
    "gave": "lent", "give": "lent", "lent": "lent", "loaned": "lent",
    "borrowed": "borrowed", "took": "borrowed",
    "received": "received", "got": "received", "collected": "received",
    "spent": "spent", "paid": "spent", "bought": "spent",
}

_DATE_WORDS = {
    "today": 0, "tomorrow": 1, "yesterday": -1,
}

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
    "my", "i", "me", "is", "was", "were", "be", "this", "that", "it", "as", "by", "from",
}


class MockProvider(LLMProvider):
    name = "mock"

    async def process_memory(self, content: str, source_type: str) -> AIProcessingResult:
        text = content.strip()
        lower = text.lower()

        # --- amounts / finance ---
        amounts: list[ExtractedAmount] = []
        is_financial = False
        txn_type = "other"
        for verb, mapped in _TXN_VERBS.items():
            if verb in lower:
                txn_type = mapped
                break

        for match in _AMOUNT_RE.finditer(text):
            is_financial = True
            raw_amount = match.group("amount").replace(",", "")
            currency_raw = match.group("currency").lower()
            currency = "USD" if ("$" in currency_raw or "dollar" in currency_raw or "usd" in currency_raw) else "PKR"
            person_match = _PERSON_RE.search(text)
            amounts.append(
                ExtractedAmount(
                    person=person_match.group(1) if person_match else None,
                    amount=float(raw_amount),
                    currency=currency,
                    transaction_type=txn_type,
                    notes=None,
                )
            )

        # --- people ---
        people: list[ExtractedPerson] = []
        seen_names = set()
        for match in _PERSON_RE.finditer(text):
            name = match.group(1)
            if name not in seen_names:
                seen_names.add(name)
                people.append(ExtractedPerson(name=name, context=None))

        # --- dates ---
        dates: list[ExtractedDate] = []
        uncertainty_notes: list[str] = []
        for word, offset in _DATE_WORDS.items():
            if word in lower:
                resolved = (datetime.utcnow() + timedelta(days=offset)).date().isoformat()
                dates.append(ExtractedDate(label=word, date=resolved, is_uncertain=False))
        for weekday_name in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            if weekday_name in lower:
                dates.append(ExtractedDate(label=weekday_name.capitalize(), date=None, is_uncertain=True))
                uncertainty_notes.append(
                    f"Mentioned '{weekday_name.capitalize()}' — please confirm the exact date."
                )

        # --- category guess ---
        category = "Other"
        if is_financial:
            category = "Finance"
        elif any(w in lower for w in ["meeting", "client", "project", "deadline", "work"]):
            category = "Work"
        elif any(w in lower for w in ["exam", "study", "assignment", "lecture", "course"]):
            category = "Study"
        elif any(w in lower for w in ["flight", "hotel", "trip", "travel", "passport"]):
            category = "Travel"
        elif any(w in lower for w in ["doctor", "medicine", "health", "hospital", "appointment"]):
            category = "Health Information"
        elif any(w in lower for w in ["idea", "concept", "what if"]):
            category = "Ideas"
        elif people and not is_financial:
            category = "Relationships"

        # --- tags (simple keyword extraction) ---
        words = re.findall(r"[a-zA-Z]{4,}", lower)
        tag_candidates = [w for w in words if w not in _STOPWORDS]
        tags = list(dict.fromkeys(tag_candidates))[:5]

        summary = text if len(text) <= 140 else text[:137].rsplit(" ", 1)[0] + "..."

        needs_confirmation = is_financial or any(d.is_uncertain for d in dates)
        if not amounts and not people and not dates:
            uncertainty_notes.append(
                "Mock AI mode: no external LLM key configured, so extraction used simple "
                "pattern matching only. Review the fields below before saving."
            )

        return AIProcessingResult(
            summary=summary,
            suggested_category=category,
            suggested_tags=tags,
            people=people,
            amounts=amounts,
            dates=dates,
            is_financial=is_financial,
            needs_confirmation=needs_confirmation,
            uncertainty_notes=uncertainty_notes,
            provider=self.name,
        )

    async def embed(self, text: str) -> list[float]:
        # Deterministic pseudo-embedding (hash-seeded) so cosine-similarity search is
        # stable and testable offline. NOT semantically meaningful — real embeddings
        # require OPENAI_API_KEY. This keeps keyword/text-index fallback as the primary
        # signal in mock mode (see rag_service.py).
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector = []
        for i in range(EMBEDDING_DIM):
            byte = digest[i % len(digest)]
            vector.append(((byte + i) % 256) / 255.0 - 0.5)
        return vector

    async def generate_rag_answer(self, query: str, context_snippets: list[str]) -> str:
        if not context_snippets:
            return "I couldn't find that information in your memories."
        joined = " / ".join(context_snippets[:3])
        return (
            "Mock AI mode (no LLM key configured) — based on the closest matching memories, "
            f"here's what I found: {joined}"
        )

    async def describe_image(self, image_bytes: bytes, mime_type: str) -> str:
        return (
            "[Mock AI mode] Image received but no vision model is configured — add "
            "OPENAI_API_KEY to enable automatic image understanding. Add a caption manually "
            "for now."
        )


# ----------------------------------------------------------------------------------
# OpenAI provider
# ----------------------------------------------------------------------------------

_EXTRACTION_SYSTEM_PROMPT = """You are the memory-processing engine for a personal memory app.
Given a piece of text the user explicitly wrote or spoke, extract ONLY what is explicitly
stated. Never invent people, amounts, dates, or facts that are not present in the text.
If something is ambiguous (e.g. "Friday" with no date), include it but mark it uncertain.
Respond with strict JSON matching this schema:
{
  "summary": "short one-sentence summary",
  "suggested_category": "one of: Personal, Work, Study, Finance, Important Documents, Health Information, Travel, Ideas, Relationships, Tasks, Other",
  "suggested_tags": ["lowercase", "keywords"],
  "people": [{"name": "string", "context": "string or null"}],
  "amounts": [{"person": "string or null", "amount": number, "currency": "3-letter code, default PKR", "transaction_type": "lent|borrowed|gave|received|spent|other", "notes": "string or null"}],
  "dates": [{"label": "string as mentioned", "date": "YYYY-MM-DD or null if not confidently resolvable", "is_uncertain": boolean}],
  "is_financial": boolean,
  "uncertainty_notes": ["plain-language notes about anything ambiguous or assumed"]
}
Return ONLY the JSON object, no markdown fences, no commentary."""


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self) -> None:
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def process_memory(self, content: str, source_type: str) -> AIProcessingResult:
        response = await self._client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {"role": "system", "content": _EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("OpenAI extraction returned non-JSON output; falling back to summary-only.")
            data = {"summary": content[:140], "suggested_category": "Other"}

        needs_confirmation = bool(data.get("is_financial")) or any(
            d.get("is_uncertain") for d in data.get("dates", [])
        )

        return AIProcessingResult(
            summary=data.get("summary", content[:140]),
            suggested_category=data.get("suggested_category", "Other"),
            suggested_tags=data.get("suggested_tags", []) or [],
            people=[ExtractedPerson(**p) for p in data.get("people", []) or []],
            amounts=[ExtractedAmount(**a) for a in data.get("amounts", []) or []],
            dates=[ExtractedDate(**d) for d in data.get("dates", []) or []],
            is_financial=bool(data.get("is_financial", False)),
            needs_confirmation=needs_confirmation,
            uncertainty_notes=data.get("uncertainty_notes", []) or [],
            provider=self.name,
        )

    async def embed(self, text: str) -> list[float]:
        response = await self._client.embeddings.create(
            model=settings.openai_embedding_model, input=text
        )
        return response.data[0].embedding

    async def generate_rag_answer(self, query: str, context_snippets: list[str]) -> str:
        if not context_snippets:
            return "I couldn't find that information in your memories."

        context_block = "\n---\n".join(context_snippets)
        response = await self._client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Answer the user's question using ONLY the memory excerpts below. "
                        "If the excerpts don't contain a confident answer, say exactly: "
                        "\"I couldn't find that information in your memories.\" "
                        "Never use outside knowledge or invent details."
                    ),
                },
                {"role": "user", "content": f"Memories:\n{context_block}\n\nQuestion: {query}"},
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content or "I couldn't find that information in your memories."

    async def describe_image(self, image_bytes: bytes, mime_type: str) -> str:
        import base64

        b64 = base64.b64encode(image_bytes).decode("utf-8")
        response = await self._client.chat.completions.create(
            model=settings.openai_vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Factually describe exactly what is visible in this image "
                                "(objects, text, people if identifiable by role/context only, "
                                "receipts/documents content). Do not guess anything not visible."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                    ],
                }
            ],
            temperature=0.1,
        )
        return response.choices[0].message.content or ""


def get_ai_provider() -> LLMProvider:
    effective = settings.ai_effective_provider
    if effective == "mock":
        return MockProvider()
    return OpenAIProvider()
