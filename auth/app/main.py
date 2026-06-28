import hashlib
import json
import os
import re
import secrets
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Path, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import or_, text
from sqlmodel import Session, delete, func, select

from .database import engine, init_db
from .models import ActivityLog, LoginThrottle, User
from .security import create_access_token, decode_access_token, hash_password, verify_password


ADMIN_USER = os.environ.get("AUTH_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("AUTH_ADMIN_PASSWORD", "admin")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
REALTIME_NOTIFY_URL = os.environ.get("REALTIME_NOTIFY_URL", "http://realtime:8700/notify")
SMTP_HOST = os.environ.get("AUTH_SMTP_HOST", "").strip()
SMTP_PORT = int(os.environ.get("AUTH_SMTP_PORT", "587"))
SMTP_USER = os.environ.get("AUTH_SMTP_USER", "").strip()
SMTP_PASSWORD = os.environ.get("AUTH_SMTP_PASSWORD", "").strip()
SMTP_FROM = os.environ.get("AUTH_SMTP_FROM", SMTP_USER or "no-reply@example.com").strip()
SMTP_USE_TLS = os.environ.get("AUTH_SMTP_USE_TLS", "1").strip() not in {"0", "false", "False"}

DEFAULT_ROLE = "viewer"
ALLOWED_ROLES = {"admin", "analyst", "viewer"}
ADMIN_ASSIGNABLE_ROLES = {"viewer", "analyst"}
LOGIN_MAX_ATTEMPTS = int(os.environ.get("AUTH_LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_LOCK_MINUTES = int(os.environ.get("AUTH_LOGIN_LOCK_MINUTES", "15"))
EMAIL_VERIFICATION_TTL_MINUTES = int(os.environ.get("AUTH_EMAIL_VERIFICATION_TTL_MINUTES", "1440"))
PASSWORD_RESET_TTL_MINUTES = int(os.environ.get("AUTH_PASSWORD_RESET_TTL_MINUTES", "60"))
MIN_PASSWORD_LENGTH = int(os.environ.get("AUTH_MIN_PASSWORD_LENGTH", "8"))

SERVICE_HEALTH_URLS = {
    "auth": os.environ.get("AUTH_HEALTH_URL", "http://auth:8400/health"),
    "backend": os.environ.get("BACKEND_HEALTH_URL", "http://backend:8000/health"),
    "ingestion": os.environ.get("INGESTION_HEALTH_URL", "http://ingestion:8000/health"),
    "exporter": os.environ.get("EXPORTER_HEALTH_URL", "http://exporter:8600/health"),
    "realtime": os.environ.get("REALTIME_STATUS_URL", "http://realtime:8700/status"),
    "alerting": os.environ.get("ALERTING_HEALTH_URL", "http://alerting:8300/health"),
}

app = FastAPI(title="Auth/Admin Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminCreate(UserCreate):
    role: Optional[str] = DEFAULT_ROLE
    is_admin: Optional[bool] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None
    is_blocked: Optional[bool] = None
    blocked_reason: Optional[str] = None
    password: Optional[str] = None


class RoleAssign(BaseModel):
    role: str


class BlockUser(BaseModel):
    blocked: bool = True
    reason: Optional[str] = None


class ForceLogout(BaseModel):
    reason: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None


class PasswordResetConfirmRequest(BaseModel):
    token: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def normalize_role(role: Optional[str]) -> str:
    role_value = (role or DEFAULT_ROLE).strip().lower()
    if role_value not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Unsupported role: {role_value}")
    return role_value


def ensure_admin_assignable_role(role_value: str) -> None:
    if role_value not in ADMIN_ASSIGNABLE_ROLES:
        raise HTTPException(status_code=403, detail="Admin can only assign viewer/analyst roles")


def normalize_username(value: str) -> str:
    return (value or "").strip()


def normalize_email(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def generate_secret_token() -> str:
    return secrets.token_urlsafe(32)


def hash_secret_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_frontend_link(param_name: str, token: str) -> str:
    base = FRONTEND_URL.rstrip("/")
    return f"{base}/?{param_name}={token}"


def send_email_message(to_email: str, subject: str, body: str) -> None:
    recipient = normalize_email(to_email)
    if not recipient:
        return

    if not SMTP_HOST:
        print(f"[auth-email] To: {recipient}\nSubject: {subject}\n{body}")

        return

    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
        if SMTP_USE_TLS:
            smtp.starttls()
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)


def password_strength_errors(password: str) -> list[str]:
    errors: list[str] = []
    if len(password or "") < MIN_PASSWORD_LENGTH:
        errors.append(f"Пароль должен быть не короче {MIN_PASSWORD_LENGTH} символов")
    if not re.search(r"[a-zа-я]", password or "", re.IGNORECASE):
        errors.append("Пароль должен содержать буквы")
    if not re.search(r"[A-ZА-Я]", password or ""):
        errors.append("Пароль должен содержать хотя бы одну заглавную букву")
    if not re.search(r"\d", password or ""):
        errors.append("Пароль должен содержать хотя бы одну цифру")
    if not re.search(r"[^A-Za-zА-Яа-я0-9]", password or ""):
        errors.append("Пароль должен содержать хотя бы один специальный символ")
    return errors


def require_strong_password(password: str) -> None:
    errors = password_strength_errors(password)
    if errors:
        raise HTTPException(status_code=400, detail={"message": "Weak password", "errors": errors})


def issue_email_verification_token(user: User) -> str:
    token = generate_secret_token()
    user.email_verified = False
    user.email_verification_token_hash = hash_secret_token(token)
    user.email_verification_sent_at = datetime.utcnow()
    user.email_verified_at = None
    return token


def issue_password_reset_token(user: User) -> str:
    token = generate_secret_token()
    user.password_reset_token_hash = hash_secret_token(token)
    user.password_reset_sent_at = datetime.utcnow()
    return token


def send_verification_email(user: User, token: str) -> None:
    if not user.email:
        return
    link = build_frontend_link("verify_email_token", token)
    send_email_message(
        user.email,
        "Подтверждение электронной почты",
        (
            f"Здравствуйте, {user.username}!\n\n"
            f"Подтвердите электронную почту по ссылке:\n{link}\n\n"
            "Если вы не создавали аккаунт, просто игнорируйте это письмо."
        ),
    )


def send_password_reset_email(user: User, token: str) -> None:
    if not user.email:
        return
    link = build_frontend_link("reset_token", token)
    send_email_message(
        user.email,
        "Сброс пароля",
        (
            f"Здравствуйте, {user.username}!\n\n"
            f"Сбросьте пароль по ссылке:\n{link}\n\n"
            "Если вы не запрашивали сброс, просто игнорируйте это письмо."
        ),
    )


def get_throttle(session: Session, key: str) -> LoginThrottle:
    row = session.get(LoginThrottle, key)
    if row is None:
        row = LoginThrottle(key=key)
        session.add(row)
        session.flush()
    return row


def clear_login_failures(session: Session, *keys: str) -> None:
    for key in keys:
        row = session.get(LoginThrottle, key)
        if row is None:
            continue
        session.delete(row)


def register_login_failure(session: Session, *keys: str) -> None:
    now = datetime.utcnow()
    for key in keys:
        if not key:
            continue
        row = get_throttle(session, key)
        if row.locked_until and row.locked_until > now:
            continue
        row.failed_attempts = int(row.failed_attempts or 0) + 1
        row.updated_at = now
        if row.failed_attempts >= LOGIN_MAX_ATTEMPTS:
            row.locked_until = now + timedelta(minutes=LOGIN_LOCK_MINUTES)
        session.add(row)


def assert_not_rate_limited(session: Session, *keys: str) -> None:
    now = datetime.utcnow()
    locked_keys = []
    for key in keys:
        if not key:
            continue
        row = session.get(LoginThrottle, key)
        if not row:
            continue
        if row.locked_until and row.locked_until > now:
            locked_keys.append(key)
            continue
        if row.failed_attempts >= LOGIN_MAX_ATTEMPTS:
            locked_keys.append(key)
    if locked_keys:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")


def ensure_user_email_verified(user: User) -> None:
    if user.email and not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def password_reset_token_is_expired(user: User) -> bool:
    if not user.password_reset_sent_at:
        return True
    return utc_now() - user.password_reset_sent_at > timedelta(minutes=PASSWORD_RESET_TTL_MINUTES)


def email_verification_token_is_expired(user: User) -> bool:
    if not user.email_verification_sent_at:
        return True
    return utc_now() - user.email_verification_sent_at > timedelta(minutes=EMAIL_VERIFICATION_TTL_MINUTES)

def user_is_admin(user: User) -> bool:
    return bool(user.is_admin) or (user.role or "").lower() == "admin"


def is_primary_admin_account(user: User) -> bool:
    return (user.username or "").strip().lower() == ADMIN_USER.strip().lower()


def ensure_mutable_target(user: User) -> None:
    if is_primary_admin_account(user):
        raise HTTPException(status_code=403, detail="Primary admin account is protected")


def user_to_dict(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": bool(user.is_admin),
        "role": user.role,
        "email_verified": bool(user.email_verified),
        "is_blocked": bool(user.is_blocked),
        "blocked_reason": user.blocked_reason,
        "token_version": int(user.token_version or 0),
        "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def get_client_ip(request: Request) -> Optional[str]:
    if request.client is None:
        return None
    return request.client.host


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    stmt = select(User).where(User.username == username)
    return session.exec(stmt).first()


def log_activity(
    session: Session,
    action: str,
    *,
    user: Optional[User] = None,
    username: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip: Optional[str] = None,
) -> None:
    entry = ActivityLog(
        user_id=user.id if user else None,
        username=username or (user.username if user else None),
        action=action,
        details=details or None,
        ip=ip,
    )
    session.add(entry)
    try:
        httpx.post(
            REALTIME_NOTIFY_URL,
            data=json.dumps(
                {
                    "type": "auth_activity",
                    "action": action,
                    "username": username or (user.username if user else None),
                    "created_at": datetime.utcnow().isoformat(),
                }
            ),
            timeout=0.8,
        )
    except Exception:
        # Realtime notify failures must not break auth flows.
        pass


def require_admin(user: User) -> None:
    if not user_is_admin(user):
        raise HTTPException(status_code=403, detail="admin required")


def ensure_schema() -> None:
    # SQLModel create_all creates new tables; this handles adding columns in existing DBs.
    with engine.begin() as conn:
        conn.exec_driver_sql(
            """
            ALTER TABLE "user"
                ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer',
                ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
                ADD COLUMN IF NOT EXISTS email_verification_token_hash text,
                ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamptz NULL,
                ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL,
                ADD COLUMN IF NOT EXISTS password_reset_token_hash text,
                ADD COLUMN IF NOT EXISTS password_reset_sent_at timestamptz NULL,
                ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
                ADD COLUMN IF NOT EXISTS blocked_reason text,
                ADD COLUMN IF NOT EXISTS token_version integer DEFAULT 0,
                ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL
            """
        )
        conn.exec_driver_sql(
            """
            UPDATE "user"
               SET role = 'admin'
             WHERE is_admin = TRUE
               AND role <> 'admin'
            """
        )
        conn.exec_driver_sql(
            """
            UPDATE "user"
               SET role = 'viewer'
             WHERE role IS NULL
                OR role NOT IN ('admin', 'analyst', 'viewer')
            """
        )
        conn.exec_driver_sql(
            """
            UPDATE "user"
               SET is_admin = CASE WHEN role = 'admin' THEN TRUE ELSE FALSE END
             WHERE is_admin IS DISTINCT FROM (role = 'admin')
            """
        )
        conn.execute(
            text(
                """
                UPDATE "user"
                   SET email_verified = TRUE,
                       email_verified_at = COALESCE(email_verified_at, created_at)
                 WHERE username = :admin_user
                """
            ),
            {"admin_user": ADMIN_USER},
        )
        conn.exec_driver_sql(
            """
            CREATE TABLE IF NOT EXISTS loginthrottle (
                key VARCHAR PRIMARY KEY,
                failed_attempts INTEGER NOT NULL DEFAULT 0,
                locked_until TIMESTAMPTZ NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )


def get_current_user(request: Request) -> User:
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing auth")

    token = auth.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        token_version = int(payload.get("ver", 0))
    except Exception:
        token_version = 0

    with Session(engine) as session:
        user = get_user_by_username(session, username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if int(user.token_version or 0) != token_version:
            raise HTTPException(status_code=401, detail="Session was revoked")

        if user.is_blocked:
            raise HTTPException(status_code=403, detail="User is blocked")

        if user.last_seen_at and getattr(user.last_seen_at, "tzinfo", None) is not None:
            now = datetime.now(user.last_seen_at.tzinfo)
        else:
            now = datetime.utcnow()

        if not user.last_seen_at or (now - user.last_seen_at).total_seconds() > 60:
            user.last_seen_at = now
            session.add(user)
            session.commit()
            session.refresh(user)

        return user


def probe_http_service(name: str, url: str) -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        response = httpx.get(url, timeout=2.5)
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        state = "up" if 200 <= response.status_code < 400 else "degraded"
        return {
            "name": name,
            "kind": "http",
            "status": state,
            "url": url,
            "http_status": response.status_code,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "name": name,
            "kind": "http",
            "status": "down",
            "url": url,
            "http_status": None,
            "latency_ms": latency_ms,
            "error": str(exc),
        }


def check_db_status() -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "name": "db",
            "kind": "database",
            "status": "up",
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "name": "db",
            "kind": "database",
            "status": "down",
            "latency_ms": latency_ms,
            "error": str(exc),
        }


def check_processor_status() -> Dict[str, Any]:
    # Processor работает с БД - проверяем доступность таблицы event
    started = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT COUNT(*) FROM event LIMIT 1"))
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "name": "processor",
            "kind": "worker",
            "status": "up",
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "name": "processor",
            "kind": "worker",
            "status": "down",
            "latency_ms": latency_ms,
            "error": str(exc),
        }


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    ensure_schema()

    with Session(engine) as session:
        admin = get_user_by_username(session, ADMIN_USER)
        if not admin:
            admin = User(
                username=ADMIN_USER,
                email=None,
                hashed_password=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                role="admin",
                email_verified=True,
                token_version=0,
            )
            session.add(admin)
            session.commit()
            print("Created default admin user:", ADMIN_USER)
        else:
            admin.is_admin = True
            admin.role = "admin"
            admin.hashed_password = hash_password(ADMIN_PASSWORD)
            admin.email_verified = True
            admin.email_verified_at = admin.email_verified_at or datetime.utcnow()
            admin.is_blocked = False
            admin.blocked_reason = None
            session.add(admin)
            session.commit()


@app.post("/auth/register", response_model=MessageResponse)
def register(payload: RegisterRequest, request: Request) -> Dict[str, str]:
    with Session(engine) as session:
        username = normalize_username(payload.username)
        email = normalize_email(payload.email)

        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        if get_user_by_username(session, username):
            raise HTTPException(status_code=400, detail="User exists")
        if session.exec(select(User).where(User.email == email)).first():
            raise HTTPException(status_code=400, detail="Email exists")

        require_strong_password(payload.password)

        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(payload.password),
            role=DEFAULT_ROLE,
            is_admin=False,
            email_verified=False,
            token_version=0,
        )
        session.add(user)
        token = issue_email_verification_token(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "user_registered",
            user=user,
            details={"email": email},
            ip=get_client_ip(request),
        )
        session.commit()

        send_verification_email(user, token)
        return {"message": "Registration complete. Check your email to verify the account."}


@app.post("/auth/verify-email", response_model=MessageResponse)
def verify_email(payload: VerifyEmailRequest) -> Dict[str, str]:
    token_hash = hash_secret_token((payload.token or "").strip())
    if not token_hash:
        raise HTTPException(status_code=400, detail="Invalid token")

    with Session(engine) as session:
        user = session.exec(
            select(User).where(User.email_verification_token_hash == token_hash)
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        if user.email_verification_sent_at and email_verification_token_is_expired(user):
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        user.email_verification_token_hash = None
        user.email_verification_sent_at = None
        session.add(user)
        session.commit()

        log_activity(session, "email_verified", user=user)
        session.commit()

        return {"message": "Email verified successfully"}


@app.post("/auth/resend-verification", response_model=MessageResponse)
def resend_verification(payload: ResendVerificationRequest) -> Dict[str, str]:
    with Session(engine) as session:
        user = None
        if payload.username:
            user = get_user_by_username(session, normalize_username(payload.username))
        if user is None and payload.email:
            user = session.exec(select(User).where(User.email == normalize_email(payload.email))).first()

        if not user or not user.email or user.email_verified:
            return {"message": "If the account exists, a verification email has been sent."}

        token = issue_email_verification_token(user)
        session.add(user)
        session.commit()
        send_verification_email(user, token)
        return {"message": "Verification email sent"}


@app.post("/auth/password-reset/request", response_model=MessageResponse)
def request_password_reset(payload: PasswordResetRequest) -> Dict[str, str]:
    with Session(engine) as session:
        user = None
        if payload.username:
            user = get_user_by_username(session, normalize_username(payload.username))
        if user is None and payload.email:
            user = session.exec(select(User).where(User.email == normalize_email(payload.email))).first()

        if not user or not user.email:
            return {"message": "If the account exists, a reset email has been sent."}

        token = issue_password_reset_token(user)
        session.add(user)
        session.commit()
        send_password_reset_email(user, token)
        log_activity(session, "password_reset_requested", user=user)
        session.commit()
        return {"message": "Password reset email sent"}


@app.post("/auth/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(payload: PasswordResetConfirmRequest) -> Dict[str, str]:
    require_strong_password(payload.password)

    token_hash = hash_secret_token((payload.token or "").strip())
    if not token_hash:
        raise HTTPException(status_code=400, detail="Invalid token")

    with Session(engine) as session:
        user = session.exec(
            select(User).where(User.password_reset_token_hash == token_hash)
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        if password_reset_token_is_expired(user):
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user.hashed_password = hash_password(payload.password)
        user.password_reset_token_hash = None
        user.password_reset_sent_at = None
        user.token_version = int(user.token_version or 0) + 1
        session.add(user)
        session.commit()

        log_activity(session, "password_reset_confirmed", user=user)
        session.commit()

        return {"message": "Password updated successfully"}


@app.post("/auth/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, current: User = Depends(get_current_user)) -> Dict[str, str]:
    require_strong_password(payload.new_password)
    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == current.id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_password(payload.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Invalid current password")

        user.hashed_password = hash_password(payload.new_password)
        user.token_version = int(user.token_version or 0) + 1
        user.password_reset_token_hash = None
        user.password_reset_sent_at = None
        session.add(user)
        session.commit()

        log_activity(session, "password_changed", user=user)
        session.commit()

        return {"message": "Password changed successfully. Please sign in again."}


@app.post("/auth/login", response_model=Token)
def login(payload: LoginRequest, request: Request) -> Dict[str, str]:
    with Session(engine) as session:
        username = normalize_username(payload.username)
        client_ip = get_client_ip(request)
        throttle_keys = [f"username:{username.lower()}"]
        if client_ip:
            throttle_keys.append(f"ip:{client_ip}")

        assert_not_rate_limited(session, *throttle_keys)

        user = get_user_by_username(session, username)
        if not user or not verify_password(payload.password, user.hashed_password):
            register_login_failure(session, *throttle_keys)
            log_activity(
                session,
                "login_failed",
                username=username,
                details={"reason": "invalid_credentials"},
                ip=client_ip,
            )
            session.commit()
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if user.is_blocked:
            log_activity(
                session,
                "login_blocked",
                user=user,
                details={"reason": user.blocked_reason or "blocked"},
                ip=get_client_ip(request),
            )
            session.commit()
            raise HTTPException(status_code=403, detail="User is blocked")

        if user.username.lower() != ADMIN_USER.lower() and user.email and not user.email_verified:
            register_login_failure(session, *throttle_keys)
            session.commit()
            raise HTTPException(status_code=403, detail="Email not verified")

        clear_login_failures(session, *throttle_keys)

        user.last_seen_at = datetime.utcnow()
        session.add(user)

        token = create_access_token(user.username, token_version=user.token_version, role=user.role)
        log_activity(session, "login_success", user=user, ip=client_ip)
        session.commit()

        return {"access_token": token}


@app.get("/auth/me")
def auth_me(current: User = Depends(get_current_user)) -> Dict[str, Any]:
    return user_to_dict(current)


@app.get("/admin/users")
def list_users(
    query: Optional[str] = Query(default=None, max_length=100),
    role: Optional[str] = Query(default=None),
    blocked: Optional[bool] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)

        if query and query.strip():
            search_like = f"%{query.strip()}%"
            filt = or_(User.username.ilike(search_like), User.email.ilike(search_like))
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)

        if role:
            role_value = normalize_role(role)
            stmt = stmt.where(User.role == role_value)
            count_stmt = count_stmt.where(User.role == role_value)

        if blocked is not None:
            stmt = stmt.where(User.is_blocked == blocked)
            count_stmt = count_stmt.where(User.is_blocked == blocked)

        total = int(session.exec(count_stmt).one())
        users = session.exec(stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)).all()

        return {
            "items": [user_to_dict(u) for u in users],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


@app.get("/admin/users/search")
def search_users(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=50, ge=1, le=200),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        if q.strip():
            search_like = f"%{q.strip()}%"
            stmt = select(User).where(or_(User.username.ilike(search_like), User.email.ilike(search_like)))
        else:
            stmt = select(User)
        users = session.exec(stmt.order_by(User.created_at.desc()).limit(limit)).all()
        return {"items": [user_to_dict(u) for u in users], "limit": limit}


@app.post("/admin/users")
def admin_create_user(payload: AdminCreate, current: User = Depends(get_current_user)) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        if get_user_by_username(session, payload.username):
            raise HTTPException(status_code=400, detail="User exists")

        role_value = payload.role
        if role_value is None and payload.is_admin is not None:
            role_value = "admin" if payload.is_admin else DEFAULT_ROLE
        role_value = normalize_role(role_value)
        ensure_admin_assignable_role(role_value)

        user = User(
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            role=role_value,
            is_admin=(role_value == "admin"),
            token_version=0,
            is_blocked=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "admin_user_created",
            user=current,
            details={"target_user_id": user.id, "target_username": user.username, "role": user.role},
        )
        session.commit()

        return user_to_dict(user)


@app.put("/admin/users/{user_id}")
def admin_update_user(
    user_id: int = Path(..., ge=1),
    payload: UserUpdate = None,
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)
    if payload is None:
        raise HTTPException(status_code=400, detail="No payload")

    with Session(engine) as session:
        stmt = select(User).where(User.id == user_id)
        user = session.exec(stmt).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_mutable_target(user)

        changed_fields = []

        if payload.email is not None:
            user.email = payload.email
            changed_fields.append("email")

        if payload.role is not None:
            role_value = normalize_role(payload.role)
            ensure_admin_assignable_role(role_value)
            user.role = role_value
            user.is_admin = role_value == "admin"
            changed_fields.extend(["role", "is_admin"])
        elif payload.is_admin is not None:
            if bool(payload.is_admin):
                raise HTTPException(status_code=403, detail="Admin role cannot be granted")
            user.is_admin = bool(payload.is_admin)
            if user.is_admin:
                user.role = "admin"
            elif user.role == "admin":
                user.role = DEFAULT_ROLE
            changed_fields.extend(["is_admin", "role"])

        if payload.is_blocked is not None:
            user.is_blocked = bool(payload.is_blocked)
            if user.is_blocked:
                user.token_version = int(user.token_version or 0) + 1
            changed_fields.append("is_blocked")

        if payload.blocked_reason is not None:
            user.blocked_reason = payload.blocked_reason
            changed_fields.append("blocked_reason")

        if payload.password:
            user.hashed_password = hash_password(payload.password)
            user.token_version = int(user.token_version or 0) + 1
            changed_fields.extend(["password", "token_version"])

        session.add(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "admin_user_updated",
            user=current,
            details={
                "target_user_id": user.id,
                "target_username": user.username,
                "changed_fields": changed_fields,
            },
        )
        session.commit()

        return user_to_dict(user)


@app.post("/admin/users/{user_id}/role")
def admin_assign_role(
    payload: RoleAssign,
    user_id: int = Path(..., ge=1),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_mutable_target(user)

        new_role = normalize_role(payload.role)
        ensure_admin_assignable_role(new_role)
        user.role = new_role
        user.is_admin = new_role == "admin"
        session.add(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "admin_role_assigned",
            user=current,
            details={"target_user_id": user.id, "target_username": user.username, "role": user.role},
        )
        session.commit()

        return user_to_dict(user)


@app.post("/admin/users/{user_id}/block")
def admin_block_user(
    payload: BlockUser,
    user_id: int = Path(..., ge=1),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_mutable_target(user)

        if current.id == user_id and payload.blocked:
            raise HTTPException(status_code=400, detail="You cannot block yourself")

        user.is_blocked = bool(payload.blocked)
        user.blocked_reason = payload.reason if payload.blocked else None
        if user.is_blocked:
            user.token_version = int(user.token_version or 0) + 1

        session.add(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "admin_block_user" if payload.blocked else "admin_unblock_user",
            user=current,
            details={
                "target_user_id": user.id,
                "target_username": user.username,
                "reason": payload.reason,
            },
        )
        session.commit()

        return user_to_dict(user)


@app.post("/admin/users/{user_id}/force-logout")
def admin_force_logout(
    payload: ForceLogout,
    user_id: int = Path(..., ge=1),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_mutable_target(user)

        user.token_version = int(user.token_version or 0) + 1
        session.add(user)
        session.commit()
        session.refresh(user)

        log_activity(
            session,
            "admin_force_logout",
            user=current,
            details={
                "target_user_id": user.id,
                "target_username": user.username,
                "reason": payload.reason,
            },
        )
        session.commit()

        return {"status": "ok", "user": user_to_dict(user)}


@app.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: int = Path(..., ge=1), current: User = Depends(get_current_user)) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        stmt = select(User).where(User.id == user_id)
        user = session.exec(stmt).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        ensure_mutable_target(user)

        if current.id == user_id:
            raise HTTPException(status_code=400, detail="You cannot delete yourself")

        deleted_payload = {"id": user.id, "username": user.username}
        session.delete(user)

        log_activity(
            session,
            "admin_user_deleted",
            user=current,
            details={"target_user_id": deleted_payload["id"], "target_username": deleted_payload["username"]},
        )
        session.commit()

        return {"status": "deleted", **deleted_payload}


@app.get("/admin/activity")
def admin_activity(
    user_id: Optional[int] = Query(default=None),
    action: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current: User = Depends(get_current_user),
) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        stmt = select(ActivityLog)
        if user_id is not None:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if action:
            stmt = stmt.where(ActivityLog.action == action)

        rows = session.exec(stmt.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)).all()

        items = [
            {
                "id": row.id,
                "user_id": row.user_id,
                "username": row.username,
                "action": row.action,
                "details": row.details,
                "ip": row.ip,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
        return {"items": items, "limit": limit, "offset": offset}


@app.get("/admin/activity/summary")
def admin_activity_summary(current: User = Depends(get_current_user)) -> Dict[str, Any]:
    require_admin(current)

    since = datetime.utcnow() - timedelta(hours=24)
    with Session(engine) as session:
        actions_rows = session.exec(
            select(ActivityLog.action, func.count())
            .where(ActivityLog.created_at >= since)
            .group_by(ActivityLog.action)
            .order_by(func.count().desc())
        ).all()
        action_counts = [{"action": row[0], "count": int(row[1])} for row in actions_rows]

        active_users = int(
            session.exec(
                select(func.count(func.distinct(ActivityLog.username))).where(
                    ActivityLog.created_at >= since,
                    ActivityLog.username.is_not(None),
                )
            ).one()
        )

        total_events = int(sum(item["count"] for item in action_counts))
        blocked_users = int(session.exec(select(func.count()).select_from(User).where(User.is_blocked == True)).one())

        return {
            "window_hours": 24,
            "total_events": total_events,
            "active_users": active_users,
            "blocked_users": blocked_users,
            "actions": action_counts,
        }


@app.delete("/admin/activity")
def admin_clear_activity(current: User = Depends(get_current_user)) -> Dict[str, Any]:
    require_admin(current)

    with Session(engine) as session:
        deleted_count = session.exec(select(func.count()).select_from(ActivityLog)).one()
        table_name = ActivityLog.__table__.name
        dialect = session.get_bind().dialect.name

        if dialect == "postgresql":
            # Fully clear table and reset autoincrement IDs.
            session.exec(text(f'TRUNCATE TABLE "{table_name}" RESTART IDENTITY'))
        else:
            session.exec(delete(ActivityLog))
            if dialect == "sqlite":
                session.exec(text(f"DELETE FROM sqlite_sequence WHERE name = '{table_name}'"))
        session.commit()

    try:
        httpx.post(
            REALTIME_NOTIFY_URL,
            data=json.dumps(
                {
                    "type": "auth_activity_cleared",
                    "deleted": int(deleted_count),
                    "created_at": datetime.utcnow().isoformat(),
                }
            ),
            timeout=0.8,
        )
    except Exception:
        # Realtime notify failures must not break admin clear action.
        pass

    return {"deleted": int(deleted_count), "message": "All activity logs cleared"}


@app.get("/admin/services/status")
def admin_services_status(current: User = Depends(get_current_user)) -> Dict[str, Any]:
    require_admin(current)

    statuses = [check_db_status(), check_processor_status()]
    for name, url in SERVICE_HEALTH_URLS.items():
        statuses.append(probe_http_service(name, url))

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "services": statuses,
    }


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def index_page() -> RedirectResponse:
    return RedirectResponse(url=FRONTEND_URL, status_code=307)


@app.get("/admin-panel")
def admin_panel_page() -> RedirectResponse:
    return RedirectResponse(url=FRONTEND_URL, status_code=307)
