# MindVault AI — Phase 1 API Reference

Base URL: `http://localhost:8000/api/v1` (see `backend/.env` → `API_V1_PREFIX`).
Interactive Swagger docs are always available at `/docs` while the backend is running.

All endpoints except `/auth/register`, `/auth/login`, `/auth/refresh`,
`/auth/forgot-password`, and `/auth/reset-password` require a bearer token:

```
Authorization: Bearer <access_token>
```

Access tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 30 min); use
`/auth/refresh` with the refresh token to get a new pair. The mobile app's API client
handles this automatically on a 401.

## Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Seeds the 11 default categories for the new user |
| POST | `/auth/login` | `{ email, password }` | |
| POST | `/auth/refresh` | `{ refresh_token }` | Returns a new token pair |
| POST | `/auth/forgot-password` | `{ email }` | Always returns the same message, whether or not the email exists. Reset link is logged server-side, not emailed (Phase 1). |
| POST | `/auth/reset-password` | `{ token, new_password }` | |
| GET | `/auth/me` | — | Returns the current user |

## Memories

| Method | Path | Notes |
|---|---|---|
| POST | `/memories/process` | Runs the AI pipeline, stores a `status="draft"` memory, returns extracted fields for review. Never appears in listings until confirmed. |
| POST | `/memories/{id}/confirm` | Finalizes the draft with the user's reviewed/edited fields. |
| GET | `/memories` | Query params: `category`, `favorite`, `archived`, `deleted`, `page`, `page_size`. Only returns `status="confirmed"` memories. |
| GET | `/memories/{id}` | 404 if it belongs to another user. |
| PATCH | `/memories/{id}` | Partial update: `title`, `category`, `tags`, `importance`, `is_favorite`, `is_archived`, `is_deleted`. |
| DELETE | `/memories/{id}` | Soft delete by default (`is_deleted=true`); `?permanent=true` for hard delete. |

## Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | Includes live `memory_count` per category. |
| POST | `/categories` | `{ name, icon?, color?, is_sensitive? }` |
| DELETE | `/categories/{id}` | Default categories can't be deleted (400). |

## Search (RAG)

| Method | Path | Notes |
|---|---|---|
| POST | `/search` | `{ query, top_k? }` → `{ answer, grounded, sources[], provider }`. `grounded=false` and the fixed "I couldn't find that information in your memories." answer when nothing reliable matches — never a fabricated answer. |

## Files

| Method | Path | Notes |
|---|---|---|
| POST | `/files/upload` | Multipart `file` field. Validates type/size (`MAX_UPLOAD_SIZE_MB`). Returns `{ id, filename, content_type, url, size_bytes }` — pass `id` as an `attachment_ids` entry to `/memories/process`. |

## Health

| Method | Path |
|---|---|
| GET | `/health` (no `/api/v1` prefix) |
