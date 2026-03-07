from fastapi import FastAPI, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from urllib.parse import urlparse, parse_qs
from .database import get_session
from .models import Event
from sqlmodel import Session
import httpx

app = FastAPI(title="Ingestion Collector")


class EventIn(BaseModel):
    site_id: Optional[str] = None
    path: Optional[str] = None
    url: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    ip: Optional[str] = None
    timestamp: Optional[str] = None
    session_id: Optional[str] = None
    event_type: Optional[str] = "pageview"
    properties: Optional[Dict] = None


@app.post("/collect", status_code=204)
def collect(event: EventIn, request: Request, session: Session = Depends(get_session)):

    if not event.url and not event.path:
        raise HTTPException(status_code=400, detail="url or path required")

    props = event.properties.copy() if event.properties else {}
    normalized_path = event.path
    try:
        if event.url:
            parsed = urlparse(event.url)
            qs = parse_qs(parsed.query)

            utm = {}
            for k in ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"):
                if k in qs and qs[k]:
                    utm[k] = qs[k][0]
            if utm:
                props.setdefault("utm", {}).update(utm)

            normalized_path = parsed.path or normalized_path
    except Exception:
        pass

    ev = Event(
        site_id=event.site_id,
        path=normalized_path,
        url=event.url,
        referrer=event.referrer,
        user_agent=event.user_agent,
        ip=event.ip or (request.client.host if request.client is not None else None),
        session_id=event.session_id,
        event_type=event.event_type,
        properties=props,
    )

    if event.timestamp:
        try:
            from datetime import datetime

            ev.timestamp = datetime.fromisoformat(event.timestamp)
        except Exception:
            pass
    session.add(ev)
    session.commit()
    try:
        import json
        payload = {
            "site_id": ev.site_id,
            "path": ev.path,
            "url": ev.url,
            "session_id": ev.session_id,
            "event_type": ev.event_type,
            "timestamp": ev.timestamp.isoformat() if getattr(ev, 'timestamp', None) else None,
        }
        try:
            httpx.post("http://realtime:8700/notify", data=json.dumps(payload), timeout=1.0)
        except Exception:
            pass
    except Exception:
        pass
    return None


@app.get("/health")
def health():
    return {"status": "ok"}
