from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..database import get_engine
from sqlalchemy import text
from pydantic import BaseModel
import os
import subprocess
import json
import threading

router = APIRouter()

ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', None)
_demo_lock = threading.Lock()
_demo_processes = {}


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


class GenerateDemoTraffic(BaseModel):
    site_id: str
    count: int = 200
    days: int = 7


class StopDemoTraffic(BaseModel):
    site_id: str


@router.post('/admin/generate-demo-traffic')
def generate_demo_traffic(payload: GenerateDemoTraffic):
    if payload.count < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='count must be >= 1')
    if payload.days < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='days must be >= 1')

    site_id = (payload.site_id or '').strip()
    if not site_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='site_id is required')

    proc = None
    try:
        cmd = [
            'python', '/tools/generate_demo_traffic.py',
            '--base', 'http://ingestion:8000',
            '--site', site_id,
            '--count', str(payload.count),
            '--days', str(payload.days),
            '--path', '/collect'
        ]

        with _demo_lock:
            active = _demo_processes.get(site_id)
            if active is not None and active.poll() is None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='generation already running for this site')
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            _demo_processes[site_id] = proc

        stdout, stderr = proc.communicate()

        if proc.returncode != 0:
            if proc.returncode in (-15, -9):
                return {
                    'status': 'stopped',
                    'site_id': site_id,
                    'count': payload.count,
                    'days': payload.days,
                }
            raise Exception(f'Script failed: {stderr}')

        return {
            'status': 'ok',
            'site_id': site_id,
            'count': payload.count,
            'days': payload.days,
            'output': stdout
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to generate traffic: {str(e)}')
    finally:
        if proc is not None:
            with _demo_lock:
                active = _demo_processes.get(site_id)
                if active is proc:
                    _demo_processes.pop(site_id, None)


@router.post('/admin/stop-demo-traffic')
def stop_demo_traffic(payload: StopDemoTraffic):
    site_id = (payload.site_id or '').strip()
    if not site_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='site_id is required')

    proc = None
    with _demo_lock:
        proc = _demo_processes.get(site_id)

    if proc is None or proc.poll() is not None:
        return {'status': 'not_running', 'site_id': site_id}

    try:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        return {'status': 'stopped', 'site_id': site_id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Failed to stop generation: {str(e)}')
