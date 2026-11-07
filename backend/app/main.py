import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import get_settings
from app.database import ensure_indexes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
    except Exception as exc:  # pragma: no cover - depends on external DB availability
        logger.warning(
            "Could not connect to MongoDB at startup (%s). The API will still start, but "
            "requests that touch the database will fail until MONGODB_URI is reachable.",
            exc,
        )
    yield


app = FastAPI(
    title=settings.app_name,
    description="MindVault AI — AI-powered personal memory assistant API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)

# Serve locally-stored uploads (development only — S3 backend serves files directly from
# the bucket/CDN in production and does not use this).
app.mount("/uploads", StaticFiles(directory=settings.local_storage_dir, check_dir=False), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
