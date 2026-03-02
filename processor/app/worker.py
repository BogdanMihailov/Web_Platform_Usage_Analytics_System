import os
import time
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field, Session, create_engine, select, Column
from sqlmodel import JSON

from user_agents import parse as parse_ua # type: ignore


DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/webanalyzer")
engine = create_engine(DATABASE_URL, echo=False)


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

    # enrichment columns (may be added by migration)
    ua_family: Optional[str] = Field(default=None)
    ua_version: Optional[str] = Field(default=None)
    device_type: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    region: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None)
    processed_at: Optional[datetime] = Field(default=None)
    enrichment_version: Optional[int] = Field(default=1)


def ensure_schema():
        with engine.connect() as conn:
                # Add columns if they don't exist (Postgres supports IF NOT EXISTS)
                conn.exec_driver_sql(
                        """
                        ALTER TABLE event
                            ADD COLUMN IF NOT EXISTS ua_family text,
                            ADD COLUMN IF NOT EXISTS ua_version text,
                            ADD COLUMN IF NOT EXISTS device_type text,
                            ADD COLUMN IF NOT EXISTS country text,
                            ADD COLUMN IF NOT EXISTS region text,
                            ADD COLUMN IF NOT EXISTS city text,
                            ADD COLUMN IF NOT EXISTS processed_at timestamptz NULL,
                            ADD COLUMN IF NOT EXISTS enrichment_version integer DEFAULT 1
                        """
                )
                conn.commit()


def enrich_event(ev: Event):
    try:
        ua = parse_ua(ev.user_agent or "")
        ev.ua_family = ua.browser.family
        ev.ua_version = ua.browser.version_string or None
        if ua.is_mobile:
            ev.device_type = "mobile"
        elif ua.is_tablet:
            ev.device_type = "tablet"
        elif ua.is_pc:
            ev.device_type = "desktop"
        else:
            ev.device_type = "other"
    except Exception:
        pass


def process_batch(batch_size: int = 100):
    with Session(engine) as session:
        stmt = select(Event).where(Event.processed_at == None).order_by(Event.id).limit(batch_size)
        # apply FOR UPDATE SKIP LOCKED
        stmt = stmt.with_for_update(skip_locked=True)
        rows = session.exec(stmt).all()
        if not rows:
            return 0
        for ev in rows:
            try:
                enrich_event(ev)
                ev.processed_at = datetime.utcnow()
            except Exception:
                # don't break processing; mark processed to avoid stuck rows
                ev.processed_at = datetime.utcnow()
        session.commit()
        return len(rows)


def main_loop():
    ensure_schema()
    print("Processor started, connecting to DB...")
    while True:
        try:
            processed = process_batch(200)
            if processed:
                print(f"Processed batch: {processed}")
            else:
                time.sleep(1)
        except Exception as e:
            print("Processor error:", e)
            time.sleep(2)


if __name__ == "__main__":
    main_loop()
