from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    icon: str = "folder"
    color: str = "#8E8E93"
    is_sensitive: bool = False


class CategoryOut(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    is_default: bool
    is_sensitive: bool
    memory_count: int = 0
    created_at: datetime
