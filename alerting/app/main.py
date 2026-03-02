import os
import time
import json
from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import FastAPI, BackgroundTasks, Response
from sqlmodel import create_engine, Session, select, SQLModel, Column

from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST


DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/webanalyzer")
CHECK_INTERVAL = int(os.environ.get("CHECK_INTERVAL_SECONDS", "60"))
ALERT_WINDOW_MIN = int(os.environ.get("ALERT_WINDOW_MINUTES", "5"))
BASELINE_WINDOW_MIN = int(os.environ.get("BASELINE_WINDOW_MINUTES", "60"))
THRESHOLD_MULTIPLIER = float(os.environ.get("THRESHOLD_MULTIPLIER", "3.0"))
ALERT_WEBHOOK = os.environ.get("ALERT_WEBHOOK_URL")

engine = create_engine(DATABASE_URL, echo=False)

app = FastAPI(title="Alerting Service")

# Prometheus metrics
alerts_sent = Counter("alerting_alerts_sent_total", "Number of alerts sent")
last_checked = Gauge("alerting_last_checked_ts", "Timestamp of last check (unix)")
last_window_count = Gauge("alerting_last_window_count", "Events counted in last window")


def count_events_in_window(session: Session, since: datetime, until: datetime) -> int:
    # query basic count from event table by timestamp
    try:
        stmt = select(["count(*)"]).select_from("event").where(f"timestamp >= '{since.isoformat()}' AND timestamp < '{until.isoformat()}'")
        # Use raw SQL because SQLModel doesn't map a simple count helper here
        res = session.exec(stmt).one()
        return int(res)
    except Exception:
        # fallback raw SQL
        q = f"SELECT count(*) FROM event WHERE timestamp >= '{since.isoformat()}' AND timestamp < '{until.isoformat()}';"
        r = session.exec(q).one()
        return int(r)


def send_webhook(payload: dict):
    if not ALERT_WEBHOOK:
        print("ALERT: ", json.dumps(payload))
        return
    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(ALERT_WEBHOOK, json=payload)
            print("Alert sent, status:", r.status_code)
    except Exception as e:
        print("Failed to send alert webhook:", e)


def check_once():
    now = datetime.utcnow()
    window = timedelta(minutes=ALERT_WINDOW_MIN)
    baseline = timedelta(minutes=BASELINE_WINDOW_MIN)
    window_start = now - window
    baseline_start = now - baseline

    with Session(engine) as session:
        # compute count in alert window
        try:
            stmt = f"SELECT count(*) FROM event WHERE timestamp >= '{window_start.isoformat()}' AND timestamp < '{now.isoformat()}';"
            cur = session.exec(stmt).one()
            cur_count = int(cur)
        except Exception:
            cur_count = 0

        # compute baseline average per alert-window
        try:
            stmt2 = f"SELECT count(*) FROM event WHERE timestamp >= '{baseline_start.isoformat()}' AND timestamp < '{now.isoformat()}';"
            total_baseline = int(session.exec(stmt2).one())
        except Exception:
            total_baseline = 0

        windows_in_baseline = max(1, int(BASELINE_WINDOW_MIN / ALERT_WINDOW_MIN))
        expected = total_baseline / windows_in_baseline

        last_window_count.set(cur_count)
        last_checked.set(int(now.timestamp()))

        triggered = False
        reason = None
        if expected > 0:
            if cur_count > expected * THRESHOLD_MULTIPLIER:
                triggered = True
                reason = "spike"
            elif cur_count < expected / THRESHOLD_MULTIPLIER:
                triggered = True
                reason = "drop"
        else:
            if cur_count > 0:
                triggered = True
                reason = "spike"

        if triggered:
            payload = {
                "type": "alert",
                "reason": reason,
                "timestamp": now.isoformat(),
                "window_minutes": ALERT_WINDOW_MIN,
                "count": cur_count,
                "expected": expected,
            }
            print("ALERT triggered:", payload)
            send_webhook(payload)
            alerts_sent.inc()


@app.on_event("startup")
def startup_loop():
    # start background checker in new thread via BackgroundTasks
    def background():
        print("Alerting service started, checking every", CHECK_INTERVAL, "seconds")
        while True:
            try:
                check_once()
            except Exception as e:
                print("Alerting check error:", e)
            time.sleep(CHECK_INTERVAL)

    import threading

    t = threading.Thread(target=background, daemon=True)
    t.start()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8300)
