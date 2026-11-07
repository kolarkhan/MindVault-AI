import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    register_payload = {"name": "Ayesha", "email": "ayesha@example.com", "password": "strongpassword1"}
    r = await client.post("/api/v1/auth/register", json=register_payload)
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["email"] == "ayesha@example.com"
    assert "access_token" in body["tokens"]

    r = await client.post(
        "/api/v1/auth/login", json={"email": "ayesha@example.com", "password": "strongpassword1"}
    )
    assert r.status_code == 200
    assert r.json()["user"]["name"] == "Ayesha"


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(client: AsyncClient, registered_user):
    r = await client.post(
        "/api/v1/auth/login", json={"email": "kolar@example.com", "password": "wrongpassword"}
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_registration_rejected(client: AsyncClient, registered_user):
    r = await client.post(
        "/api/v1/auth/register",
        json={"name": "Another", "email": "kolar@example.com", "password": "somepassword1"},
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_protected_route_requires_token(client: AsyncClient):
    r = await client.get("/api/v1/memories")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint_returns_current_user(client: AsyncClient, registered_user):
    token = registered_user["tokens"]["access_token"]
    r = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "kolar@example.com"


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient, registered_user):
    refresh_token = registered_user["tokens"]["refresh_token"]
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()

    access_token = registered_user["tokens"]["access_token"]
    r = await client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_does_not_leak_existence(client: AsyncClient, registered_user):
    r1 = await client.post("/api/v1/auth/forgot-password", json={"email": "kolar@example.com"})
    r2 = await client.post("/api/v1/auth/forgot-password", json={"email": "doesnotexist@example.com"})
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json() == r2.json()
