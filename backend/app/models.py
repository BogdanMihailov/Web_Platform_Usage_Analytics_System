from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    site_id: Optional[str] = Field(default=None, index=True)
    path: Optional[str] = Field(default=None, index=True)
    url: Optional[str] = Field(default=None)
    referrer: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    ip: Optional[str] = Field(default=None, index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    session_id: Optional[str] = Field(default=None, index=True)
    event_type: Optional[str] = Field(default="pageview", index=True)
    properties: Optional[dict] = Field(default=None, sa_column=Column(JSON))
