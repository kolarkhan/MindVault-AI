# MindVault AI

An AI-powered personal memory assistant — capture text, photos, and camera shots; let AI
summarize, tag, and extract the useful facts (people, dates, amounts); and ask natural
questions to get answers grounded in your own saved memories.

This is the **Phase 1 MVP**: a real, working core (auth, capture, AI processing +
confirmation, browse, search, timeline) built on an architecture designed for the fuller
product spec (voice, OCR, people/finance screens, insights, subscriptions) to slot into
later. See [Phase 1 scope](#phase-1-scope-what-is-and-isnt-built) below for the exact
boundary.

## Project layout

```
mindvault-ai/
├── backend/   FastAPI + MongoDB API (see backend/README below)
├── mobile/    Expo + React Native + TypeScript app (Expo Router)
└── docs/
    └── API.md   Phase 1 endpoint reference
```

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: paste your MONGODB_URI, set JWT_SECRET_KEY, optionally OPENAI_API_KEY
uvicorn app.main:app --reload
```

The API is now at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`,
health check at `http://localhost:8000/health`.

Run the test suite (fully offline — no MongoDB or OpenAI key required):

```bash
python -m pytest
```

### 2. Mobile app

```bash
cd mobile
npm install
cp .env.example .env
# edit .env if your backend isn't at http://localhost:8000 (see comments in the file)
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator/emulator.

> **Device networking note:** `localhost` in `.env` only works when the app runs on the
> same machine as the backend (iOS Simulator). For a physical phone on the same Wi-Fi,
> set `EXPO_PUBLIC_API_URL` to `http://<your-computer's-LAN-IP>:8000/api/v1`. For an
> Android emulator, use `http://10.0.2.2:8000/api/v1`.

## Database setup (MongoDB Atlas)

1. Create a free account and an M0 (free tier) cluster at https://cloud.mongodb.com.
2. Create a database user and allow network access from your IP (or `0.0.0.0/0` for local
   development only).
3. Copy the connection string into `backend/.env` as `MONGODB_URI`.
4. On first run, `uvicorn` automatically creates all standard indexes (see
   `backend/app/database.py`).
5. **Vector Search index** (needed for real semantic search): in the Atlas UI, go to your
   cluster → **Atlas Search** → **Create Search Index** → **Vector Search** → JSON editor,
   select the `memories` collection, and use:

   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1536,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "user_id"
       }
     ]
   }
   ```

   Name the index `memory_vector_index` (or update `VECTOR_INDEX_NAME` in `.env` to match).

   **Until you create this index, search still works** — `rag_service.py` automatically
   falls back to an in-Python cosine-similarity scan over the signed-in user's memories.
   It's slower at scale but functionally identical for development.

## AI provider setup

Add `OPENAI_API_KEY` to `backend/.env` to enable real AI processing (extraction,
embeddings, RAG answers, image understanding). **Leave it blank and the backend runs in
mock mode automatically** — deterministic, rule-based extraction with zero external calls,
clearly labeled everywhere it surfaces in the app (a "Mock AI mode" badge). This means the
whole app is runnable and testable before you have a key.

## Phase 1 scope: what is and isn't built

**Built and working end-to-end:**
- Registration, login, JWT refresh, forgot/reset password (reset link is logged
  server-side — no email provider wired up yet)
- Text, photo-library, and camera memory capture
- AI processing pipeline: summary, category, tags, people, dates, financial amounts —
  with a mandatory Memory Confirmation screen before anything is saved
- Semantic search with grounded answers (RAG) and the "I couldn't find that" fallback for
  unmatched queries
- Dashboard, All Memories (filter/favorite/archive/trash), Memory Detail, Categories,
  Timeline, Settings, Profile
- Per-user data isolation, default + custom categories, local or S3-compatible file
  storage

**Deliberately deferred to Phase 2** (not stubbed with fake data — simply not built yet):
voice capture + speech-to-text, PDF/document upload + OCR, a dedicated People index and
Person Detail screen, a dedicated Finance Memories list (finance *extraction* already
works — see Memory Detail's finance card), Memory Connections / Insights / Smart Recall,
Subscription screens + usage-limit enforcement, real email delivery, rate limiting, and
full data-export/account-deletion flows.

## Security notes

Every memory/category/search endpoint requires a valid JWT and filters by the
authenticated user's ID — see `backend/app/core/deps.py`. Passwords are bcrypt-hashed,
never logged. No secrets are hardcoded anywhere — both `.env.example` files list every
variable the app reads, and real `.env` files are gitignored. File uploads are validated
by type and size (`backend/app/services/storage_service.py`).

## Testing

- Backend: `cd backend && python -m pytest` — covers auth, JWT refresh, per-user data
  isolation, favorite/soft-delete, and the mock AI provider's deterministic extraction
  (including the "never fabricate" guarantee).
- Mobile: `cd mobile && npm run typecheck` for strict TypeScript checking, and
  `npx expo export --platform ios` as a bundler-level smoke test (catches missing
  imports/native-module wiring issues without needing a simulator).

## Roadmap (Phase 2+)

Voice capture and speech-to-text, PDF/document upload with OCR, People index + Person
Detail, dedicated Finance Memories screen, Memory Connections/Insights/Smart Recall,
Subscription screens with real payment integration and usage-limit enforcement, real
email delivery for verification/reset, rate limiting, full privacy controls (data export,
account deletion), S3 bucket wired to a real provider, CI pipeline, and deployment docs.
