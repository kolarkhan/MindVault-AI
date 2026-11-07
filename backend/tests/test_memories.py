import pytest
from httpx import AsyncClient


def _auth_headers(user: dict) -> dict:
    return {"Authorization": f"Bearer {user['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_default_categories_seeded_on_register(client: AsyncClient, registered_user):
    r = await client.get("/api/v1/categories", headers=_auth_headers(registered_user))
    assert r.status_code == 200
    names = {c["name"] for c in r.json()}
    assert "Finance" in names and "Personal" in names and len(names) == 11


@pytest.mark.asyncio
async def test_process_then_confirm_financial_memory(client: AsyncClient, registered_user):
    headers = _auth_headers(registered_user)

    r = await client.post(
        "/api/v1/memories/process",
        headers=headers,
        json={"source_type": "text", "content": "I gave Ahmed 15000 rupees on Friday.", "importance": "normal"},
    )
    assert r.status_code == 200
    draft = r.json()
    assert draft["result"]["is_financial"] is True
    assert draft["result"]["provider"] == "mock"
    assert any(a["amount"] == 15000 for a in draft["result"]["amounts"])
    assert draft["result"]["needs_confirmation"] is True

    draft_id = draft["draft_id"]
    confirm_payload = {
        "title": "Gave Ahmed money",
        "category": "Finance",
        "tags": ["ahmed", "loan"],
        "people": draft["result"]["people"],
        "amounts": draft["result"]["amounts"],
        "dates": draft["result"]["dates"],
        "importance": "high",
    }
    r = await client.post(
        f"/api/v1/memories/{draft_id}/confirm", headers=headers, json=confirm_payload
    )
    assert r.status_code == 200
    confirmed = r.json()
    assert confirmed["category"] == "Finance"
    assert confirmed["is_financial"] is True

    r = await client.get("/api/v1/memories", headers=headers)
    assert r.status_code == 200
    listing = r.json()
    assert listing["total"] == 1
    assert listing["items"][0]["title"] == "Gave Ahmed money"


@pytest.mark.asyncio
async def test_draft_not_visible_in_listing_until_confirmed(client: AsyncClient, registered_user):
    headers = _auth_headers(registered_user)
    await client.post(
        "/api/v1/memories/process",
        headers=headers,
        json={"source_type": "text", "content": "Just a random thought about design.", "importance": "normal"},
    )
    r = await client.get("/api/v1/memories", headers=headers)
    assert r.json()["total"] == 0


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_memory(client: AsyncClient, registered_user):
    headers_a = _auth_headers(registered_user)
    r = await client.post(
        "/api/v1/memories/process",
        headers=headers_a,
        json={"source_type": "text", "content": "My secret note.", "importance": "normal"},
    )
    draft_id = r.json()["draft_id"]
    await client.post(
        f"/api/v1/memories/{draft_id}/confirm",
        headers=headers_a,
        json={"title": "Secret", "category": "Personal", "tags": [], "people": [], "amounts": [], "dates": []},
    )

    other_register = await client.post(
        "/api/v1/auth/register",
        json={"name": "Bilal", "email": "bilal@example.com", "password": "anotherpassword1"},
    )
    headers_b = {"Authorization": f"Bearer {other_register.json()['tokens']['access_token']}"}

    r = await client.get(f"/api/v1/memories/{draft_id}", headers=headers_b)
    assert r.status_code == 404

    r = await client.get("/api/v1/memories", headers=headers_b)
    assert r.json()["total"] == 0


@pytest.mark.asyncio
async def test_favorite_and_soft_delete(client: AsyncClient, registered_user):
    headers = _auth_headers(registered_user)
    r = await client.post(
        "/api/v1/memories/process",
        headers=headers,
        json={"source_type": "text", "content": "Buy groceries tomorrow.", "importance": "normal"},
    )
    draft_id = r.json()["draft_id"]
    r = await client.post(
        f"/api/v1/memories/{draft_id}/confirm",
        headers=headers,
        json={"title": "Groceries", "category": "Tasks", "tags": [], "people": [], "amounts": [], "dates": []},
    )
    memory_id = r.json()["id"]

    r = await client.patch(f"/api/v1/memories/{memory_id}", headers=headers, json={"is_favorite": True})
    assert r.json()["is_favorite"] is True

    r = await client.delete(f"/api/v1/memories/{memory_id}", headers=headers)
    assert r.status_code == 204

    r = await client.get("/api/v1/memories", headers=headers)
    assert r.json()["total"] == 0
