"""
Pluggable file storage: local disk in development, S3-compatible in production.
Selected via STORAGE_BACKEND env var — callers never know which backend is active.
"""
from __future__ import annotations

import logging
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_MIME_PREFIXES = ("image/", "application/pdf", "audio/")
ALLOWED_DOC_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


class StorageError(Exception):
    pass


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, filename: str, content: bytes, content_type: str) -> str:
        """Returns a URL or path the file can later be retrieved from."""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...


class LocalStorageBackend(StorageBackend):
    def __init__(self) -> None:
        self.root = Path(settings.local_storage_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    async def save(self, filename: str, content: bytes, content_type: str) -> str:
        ext = Path(filename).suffix
        key = f"{uuid.uuid4().hex}{ext}"
        path = self.root / key
        path.write_bytes(content)
        return f"/uploads/{key}"

    async def delete(self, key: str) -> None:
        path = self.root / Path(key).name
        if path.exists():
            path.unlink()


class S3StorageBackend(StorageBackend):
    def __init__(self) -> None:
        import boto3

        self._bucket = settings.s3_bucket_name
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url or None,
            aws_access_key_id=settings.s3_access_key_id or None,
            aws_secret_access_key=settings.s3_secret_access_key or None,
            region_name=settings.s3_region,
        )

    async def save(self, filename: str, content: bytes, content_type: str) -> str:
        ext = Path(filename).suffix
        key = f"uploads/{uuid.uuid4().hex}{ext}"
        self._client.put_object(
            Bucket=self._bucket, Key=key, Body=content, ContentType=content_type
        )
        return key

    async def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)


def validate_upload(filename: str, content_type: str, size_bytes: int) -> None:
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        raise StorageError(f"File exceeds the {settings.max_upload_size_mb}MB limit.")
    if not (content_type.startswith(ALLOWED_MIME_PREFIXES) or content_type in ALLOWED_DOC_MIME_TYPES):
        raise StorageError(f"File type '{content_type}' is not allowed.")


def get_storage_backend() -> StorageBackend:
    if settings.storage_backend == "s3":
        return S3StorageBackend()
    return LocalStorageBackend()
