import os
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, Request, Path
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import Optional

from .database import engine, init_db
from .models import User
from .security import hash_password, verify_password, create_access_token, decode_access_token


ADMIN_USER = os.environ.get("AUTH_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("AUTH_ADMIN_PASSWORD", "admin")

app = FastAPI(title="Auth/Admin Service")

app.mount("/static", StaticFiles(directory="./app/static"), name="static")


class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str


class AdminCreate(UserCreate):
    is_admin: Optional[bool] = False


class UserUpdate(BaseModel):
    email: Optional[str]
    is_admin: Optional[bool]
    password: Optional[str]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    stmt = select(User).where(User.username == username)
    return session.exec(stmt).first()


def get_current_user(request: Request) -> Optional[User]:
    auth = request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing auth")
    token = auth.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    username = payload.get("sub")
    with Session(engine) as session:
        user = get_user_by_username(session, username)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user


@app.on_event("startup")
def on_startup():
    init_db()
    # ensure admin user exists
    from sqlmodel import Session
    with Session(engine) as session:
        if not get_user_by_username(session, ADMIN_USER):
            u = User(username=ADMIN_USER, email=None, hashed_password=hash_password(ADMIN_PASSWORD), is_admin=True)
            session.add(u)
            session.commit()
            print("Created default admin user:", ADMIN_USER)


@app.post("/auth/register", response_model=Token)
def register(payload: UserCreate):
    with Session(engine) as session:
        if get_user_by_username(session, payload.username):
            raise HTTPException(status_code=400, detail="User exists")
        u = User(username=payload.username, email=payload.email, hashed_password=hash_password(payload.password))
        session.add(u)
        session.commit()
        token = create_access_token(u.username)
        return {"access_token": token}


@app.post("/auth/login", response_model=Token)
def login(payload: UserCreate):
    with Session(engine) as session:
        user = get_user_by_username(session, payload.username)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token(user.username)
        return {"access_token": token}


@app.get("/admin/users")
def list_users(current = Depends(get_current_user)):
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="admin required")
    with Session(engine) as session:
        stmt = select(User)
        users = session.exec(stmt).all()
        return [ {"id":u.id, "username":u.username, "email":u.email, "is_admin":u.is_admin, "created_at":u.created_at.isoformat()} for u in users ]


@app.post("/admin/users")
def admin_create_user(payload: AdminCreate, current = Depends(get_current_user)):
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="admin required")
    with Session(engine) as session:
        if get_user_by_username(session, payload.username):
            raise HTTPException(status_code=400, detail="User exists")
        u = User(username=payload.username, email=payload.email, hashed_password=hash_password(payload.password), is_admin=bool(payload.is_admin))
        session.add(u)
        session.commit()
        session.refresh(u)
        return {"id": u.id, "username": u.username, "email": u.email, "is_admin": u.is_admin}


@app.put("/admin/users/{user_id}")
def admin_update_user(user_id: int = Path(..., ge=1), payload: UserUpdate = None, current = Depends(get_current_user)):
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="admin required")
    with Session(engine) as session:
        stmt = select(User).where(User.id == user_id)
        user = session.exec(stmt).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if payload is None:
            raise HTTPException(status_code=400, detail="No payload")
        if payload.email is not None:
            user.email = payload.email
        if payload.is_admin is not None:
            user.is_admin = bool(payload.is_admin)
        if payload.password:
            user.hashed_password = hash_password(payload.password)
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"id": user.id, "username": user.username, "email": user.email, "is_admin": user.is_admin}


@app.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: int = Path(..., ge=1), current = Depends(get_current_user)):
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="admin required")
    with Session(engine) as session:
        stmt = select(User).where(User.id == user_id)
        user = session.exec(stmt).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        session.delete(user)
        session.commit()
        return {"status": "deleted", "id": user_id}


@app.get("/health")
def health():
    return {"status":"ok"}


@app.get("/", response_class=HTMLResponse)
def admin_index():
    with open("./app/static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())
