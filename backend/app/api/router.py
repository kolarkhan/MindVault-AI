from fastapi import APIRouter

from app.api import auth, categories, files, memories, search

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(memories.router)
api_router.include_router(categories.router)
api_router.include_router(search.router)
api_router.include_router(files.router)
