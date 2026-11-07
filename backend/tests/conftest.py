"""
Test configuration: swaps the real MongoDB connection for `mongomock_motor`'s in-memory
async-compatible fake, and forces the AI provider into mock mode — so the whole test
suite runs offline, deterministically, with no external services required.
"""
import os

os.environ.setdefault("AI_PROVIDER", "mock")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("STORAGE_BACKEND", "local")
os.environ.setdefault("LOCAL_STORAGE_DIR", "storage/uploads_test")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database import set_database
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def fake_db():
    client = AsyncMongoMockClient()
    db = client["mindvault_ai_test"]
    set_database(db)
    yield db


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient):
    payload = {"name": "Kolar Khan", "email": "kolar@example.com", "password": "supersecret123"}
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()
