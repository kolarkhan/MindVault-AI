from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

SourceType = Literal["text", "image", "camera", "voice", "pdf", "document", "audio"]
Importance = Literal["low", "normal", "high"]


class ExtractedPerson(BaseModel):
    name: str
    context: str | None = None


class ExtractedAmount(BaseModel):
    person: str | None = None
    amount: float
    currency: str = "PKR"
    transaction_type: Literal["lent", "borrowed", "gave", "received", "spent", "other"] = "other"
    notes: str | None = None


class ExtractedDate(BaseModel):
    label: str
    date: str | None = None  # ISO date string; null if the AI could not confidently resolve it
    is_uncertain: bool = False


class AIProcessingResult(BaseModel):
    """What the AI pipeline produces. Always kept separate from user-authored content —
    the app must never blur "what the user said" with "what the AI inferred"."""

    summary: str
    suggested_category: str
    suggested_tags: list[str] = Field(default_factory=list)
    people: list[ExtractedPerson] = Field(default_factory=list)
    amounts: list[ExtractedAmount] = Field(default_factory=list)
    dates: list[ExtractedDate] = Field(default_factory=list)
    is_financial: bool = False
    needs_confirmation: bool = False
    uncertainty_notes: list[str] = Field(default_factory=list)
    provider: str  # "openai" or "mock" — always shown to the user, never hidden


class MemoryCreate(BaseModel):
    source_type: SourceType
    title: str | None = None
    content: str = Field(description="Original user content: raw text, or a caption for media")
    location: str | None = None
    importance: Importance = "normal"
    attachment_ids: list[str] = Field(default_factory=list)


class MemoryConfirm(BaseModel):
    """Payload the client sends after the user reviews/edits the AI-extracted fields on the
    Memory Confirmation screen."""

    title: str
    category: str
    tags: list[str] = Field(default_factory=list)
    people: list[ExtractedPerson] = Field(default_factory=list)
    amounts: list[ExtractedAmount] = Field(default_factory=list)
    dates: list[ExtractedDate] = Field(default_factory=list)
    importance: Importance = "normal"


class MemoryUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    importance: Importance | None = None
    is_favorite: bool | None = None
    is_archived: bool | None = None
    is_deleted: bool | None = None


class MemoryOut(BaseModel):
    id: str
    source_type: SourceType
    title: str
    content: str
    summary: str | None = None
    category: str
    tags: list[str] = Field(default_factory=list)
    people: list[ExtractedPerson] = Field(default_factory=list)
    amounts: list[ExtractedAmount] = Field(default_factory=list)
    dates: list[ExtractedDate] = Field(default_factory=list)
    is_financial: bool = False
    location: str | None = None
    importance: Importance = "normal"
    is_favorite: bool = False
    is_archived: bool = False
    is_deleted: bool = False
    attachment_ids: list[str] = Field(default_factory=list)
    ai_provider: str | None = None
    created_at: datetime
    updated_at: datetime


class MemoryListResponse(BaseModel):
    items: list[MemoryOut]
    total: int
    page: int
    page_size: int


class ProcessMemoryResponse(BaseModel):
    """Returned by POST /memories/process — the AI Processing screen polls/awaits this,
    then routes to Memory Confirmation pre-filled with these values."""

    draft_id: str
    result: AIProcessingResult
    original_content: str


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=6, ge=1, le=20)


class SearchSourceCard(BaseModel):
    memory_id: str
    title: str
    snippet: str
    category: str
    score: float
    created_at: datetime


class SearchResponse(BaseModel):
    answer: str
    grounded: bool  # false when no reliable memory was found — answer is the fixed fallback
    sources: list[SearchSourceCard]
    provider: str
