"""Authentication endpoints: register, login, refresh, forgot/reset password.

Password reset in Phase 1 logs the reset link server-side instead of sending a real
email (no SMTP/email provider wired yet) — the API never claims an email was sent when
it wasn't; the response says the link was generated, not delivered.
"""
import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import get_current_user, get_db
from app.core.security import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    UserOut,
)
from app.utils.defaults import DEFAULT_CATEGORIES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        email_verified=user.get("email_verified", False),
        plan=user.get("plan", "free"),
        created_at=user["created_at"],
    )


async def _seed_default_categories(db: AsyncIOMotorDatabase, user_id: ObjectId) -> None:
    now = datetime.now(timezone.utc)
    docs = [
        {**cat, "user_id": user_id, "created_at": now, "updated_at": now}
        for cat in DEFAULT_CATEGORIES
    ]
    if docs:
        await db.categories.insert_many(docs)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "email_verified": False,
        "plan": "free",
        "insights_enabled": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    await _seed_default_categories(db, result.inserted_id)

    tokens = TokenPair(
        access_token=create_access_token(str(result.inserted_id)),
        refresh_token=create_refresh_token(str(result.inserted_id)),
    )
    return AuthResponse(user=_user_to_out(user_doc), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")

    tokens = TokenPair(
        access_token=create_access_token(str(user["_id"])),
        refresh_token=create_refresh_token(str(user["_id"])),
    )
    return AuthResponse(user=_user_to_out(user), tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        user_id = decode_token(payload.refresh_token, TokenType.REFRESH)
    except InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")

    return TokenPair(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": payload.email.lower()})
    # Always return the same response whether or not the email exists, to avoid
    # leaking which emails are registered.
    if user:
        reset_token = create_password_reset_token(str(user["_id"]))
        # Phase 1: no email provider configured yet — log the link instead of sending it.
        logger.info("Password reset requested for %s — reset token: %s", user["email"], reset_token)
    return {"message": "If that email is registered, a password reset link has been generated."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        user_id = decode_token(payload.token, TokenType.ACCESS)
    except InvalidTokenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token.") from exc

    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": hash_password(payload.new_password), "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    return {"message": "Password updated successfully."}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _user_to_out(user)
