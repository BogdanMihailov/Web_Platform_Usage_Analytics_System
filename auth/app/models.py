from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Column, JSON


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True)
    hashed_password: str
    is_admin: bool = Field(default=False, index=True)
    role: str = Field(default="viewer", index=True)
    is_blocked: bool = Field(default=False, index=True)
    blocked_reason: Optional[str] = Field(default=None)
    token_version: int = Field(default=0)
    last_seen_at: Optional[datetime] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, index=True)
    username: Optional[str] = Field(default=None, index=True)
    action: str = Field(index=True)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    ip: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
