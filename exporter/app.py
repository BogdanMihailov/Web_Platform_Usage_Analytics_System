from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import re
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2  # type: ignore
import io
import csv
from datetime import datetime, timedelta

app = FastAPI(title='Exporter')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn():
    dsn = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/webanalyzer')
    return psycopg2.connect(dsn)


@app.get('/export/events')
def export_events(site_id: str = Query(None), days: int = Query(7, ge=0), format: str = Query('csv')):
    since = datetime.utcnow() - timedelta(days=days)
    params = [since]
    sql = "SELECT id, site_id, path, url, referrer, user_agent, ip, timestamp, session_id, event_type, properties FROM event WHERE timestamp >= %s"
    if site_id:
        sql += " AND site_id = %s"
        params.append(site_id)
    sql += " ORDER BY timestamp DESC"

    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        colnames = [desc[0] for desc in cur.description]
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if format == 'json':
        import json as _json
        res = []
        for r in rows:
            d = dict(zip(colnames, r))
            if d.get('timestamp') and hasattr(d['timestamp'], 'isoformat'):
                d['timestamp'] = d['timestamp'].isoformat()
            res.append(d)
        # return pretty-printed JSON for easier reading when downloaded
        body = _json.dumps(res, ensure_ascii=False, indent=2)
        filename = f"events_{site_id or 'all'}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.json"
        headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
        return StreamingResponse(iter([body.encode('utf-8')]), media_type='application/json; charset=utf-8', headers=headers)

    # default: csv
    def iter_csv():
        # produce UTF-8 encoded CSV chunks with Excel-friendly hints (BOM + sep=,)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(colnames)
        # prefix with UTF-8 BOM and 'sep=,' so Excel on Windows recognizes UTF-8 and comma separator
        first = '\ufeffsep=,\r\n' + buf.getvalue()
        yield first.encode('utf-8')
        buf.seek(0)
        buf.truncate(0)
        for r in rows:
            row = []
            for v in r:
                if isinstance(v, datetime):
                    cell = v.isoformat()
                else:
                    cell = '' if v is None else str(v)
                # Force Excel to treat numeric-looking cells as text so they're left-aligned
                # Use formula-style text: ="123" which Excel will display as text but without a leading apostrophe
                if re.match(r'^-?\d+(?:\.\d+)?$', cell):
                    cell = f'="{cell}"'
                row.append(cell)
            writer.writerow(row)
            yield buf.getvalue().encode('utf-8')
            buf.seek(0)
            buf.truncate(0)

    filename = f"events_{site_id or 'all'}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.csv"
    headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
    return StreamingResponse(iter_csv(), media_type='text/csv; charset=utf-8', headers=headers)


@app.get('/health')
def health():
    return {'status': 'ok'}
