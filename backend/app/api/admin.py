from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..database import get_engine
from sqlalchemy import text
from pydantic import BaseModel
import os

router = APIRouter()

ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', None)


@router.post('/admin/clear-events')
def clear_events(request: Request):
    auth = request.headers.get('Authorization')
    if ADMIN_TOKEN:
        if not auth or not auth.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing auth token')
        token = auth.split(' ', 1)[1]
        if token != ADMIN_TOKEN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid token')
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin token not configured')

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text('TRUNCATE TABLE "event" CASCADE;'))
    return {'status': 'ok'}


@router.post('/admin/clear-all')
def clear_all(request: Request):
    auth = request.headers.get('Authorization')
    if ADMIN_TOKEN:
        if not auth or not auth.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing auth token')
        token = auth.split(' ', 1)[1]
        if token != ADMIN_TOKEN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid token')
    engine = get_engine()
    with engine.begin() as conn:
        try:
            conn.execute(text('DROP SCHEMA public CASCADE'))
        except Exception:
            pass
        conn.execute(text('CREATE SCHEMA public'))
        try:
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        except Exception:
            pass
        try:
            conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        except Exception:
            pass
    return {'status': 'ok'}


class ClearSite(BaseModel):
    site_id: str


@router.post('/admin/clear-site')
def clear_site(payload: ClearSite):
    engine = get_engine()
    deleted = None
    with engine.begin() as conn:
        res = conn.execute(text('DELETE FROM "event" WHERE site_id = :site_id'), {"site_id": payload.site_id})
        try:
            deleted = res.rowcount
        except Exception:
            deleted = None
    try:
        import httpx, json
        notify_payload = {"type": "site_cleared", "site_id": payload.site_id}
        try:
            httpx.post("http://realtime:8700/notify", data=json.dumps(notify_payload), timeout=1.0)
        except Exception:
            pass
    except Exception:
        pass

    return {"status": "ok", "site_id": payload.site_id, "deleted": deleted}
