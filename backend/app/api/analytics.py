from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func, text
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from ..models import Event
from ..database import get_session

router = APIRouter(prefix="/api/analytics")


@router.get("/top-pages")
def top_pages(days: int = Query(7, ge=1, le=365), limit: int = Query(10, ge=1, le=100), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        since = datetime.utcnow() - timedelta(days=days)
        stmt = select(Event.path, func.count()).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        stmt = stmt.group_by(Event.path).order_by(func.count().desc()).limit(limit)
        res = session.exec(stmt).all()
        return [{"path": r[0], "views": int(r[1])} for r in res]

@router.get("/peak-hours")
def peak_hours(days: int = Query(7, ge=1, le=365), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        since = datetime.utcnow() - timedelta(days=days)
        bind = session.get_bind()
        dialect = bind.dialect.name if bind is not None else "sqlite"

        if dialect == "postgresql":
                hour_expr = func.date_part("hour", Event.timestamp).label("hour")
        else:
                hour_expr = func.strftime("%H", Event.timestamp).label("hour")

        stmt = select(hour_expr, func.count()).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        stmt = stmt.group_by(text("hour")).order_by(text("hour"))
        res = session.exec(stmt).all()

        hours: Dict[int, int] = {}
        for r in res:
                raw_hour = r[0]
                try:
                        h = int(raw_hour)
                except Exception:
                        h = int(str(raw_hour))
                hours[h] = int(r[1])

        return [{"hour": h, "views": hours.get(h, 0)} for h in range(24)]

@router.get('/overview')
def overview(days: int = Query(7, ge=1, le=365), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        """Return an overview: total views, unique pages, unique sessions, avg views per session."""
        since = datetime.utcnow() - timedelta(days=days)
        base_q = select(func.count()).where(Event.timestamp >= since)
        if site_id:
                base_q = base_q.where(Event.site_id == site_id)
        total_views = int(session.exec(base_q).one())

        pages_q = select(func.count(func.distinct(Event.path))).where(Event.timestamp >= since)
        if site_id:
                pages_q = pages_q.where(Event.site_id == site_id)
        unique_pages = int(session.exec(pages_q).one())

        sessions_q = select(func.count(func.distinct(Event.session_id))).where(Event.timestamp >= since)
        if site_id:
                sessions_q = sessions_q.where(Event.site_id == site_id)
        unique_sessions = int(session.exec(sessions_q).one())

        avg_views_per_session = (total_views / unique_sessions) if unique_sessions > 0 else 0.0

        ses_stmt = select(
                Event.session_id,
                func.count().label('cnt'),
                func.min(Event.timestamp).label('first_ts'),
                func.max(Event.timestamp).label('last_ts'),
        ).where(Event.timestamp >= since)
        if site_id:
                ses_stmt = ses_stmt.where(Event.site_id == site_id)
        ses_stmt = ses_stmt.group_by(Event.session_id)
        ses_res = session.exec(ses_stmt).all()
        total_sess = 0
        single_event_sess = 0
        total_events_for_sessions = 0

        session_ids: List = []
        counts_by_session = {}
        for r in ses_res:
                sid = r[0]
                cnt = int(r[1])
                if sid is None:
                        continue
                session_ids.append(sid)
                counts_by_session[sid] = cnt
                total_events_for_sessions += cnt
                total_sess += 1
                if cnt == 1:
                        single_event_sess += 1

        SESSION_TIMEOUT = 30 * 60
        durations: List[float] = []

        if session_ids:

                ev_stmt = select(Event.session_id, Event.timestamp).where(Event.timestamp >= since).where(Event.session_id.in_(session_ids)).order_by(Event.session_id, Event.timestamp)
                ev_res = session.exec(ev_stmt).all()

                cur_sid = None
                times: List[datetime] = []
                for sid, ts in ev_res:
                        if sid != cur_sid:

                                if cur_sid is not None and times:

                                        seg_start = times[0]
                                        prev = times[0]
                                        cnt = 1
                                        for t in times[1:]:
                                                gap = (t - prev).total_seconds()
                                                if gap <= SESSION_TIMEOUT:
                                                        prev = t
                                                        cnt += 1
                                                else:
                                                        if cnt > 1:
                                                                durations.append(max(0.0, (prev - seg_start).total_seconds()))
                                                        seg_start = t
                                                        prev = t
                                                        cnt = 1
                                        if cnt > 1:
                                                durations.append(max(0.0, (prev - seg_start).total_seconds()))

                                cur_sid = sid
                                times = []

                        if ts is not None:
                                times.append(ts)

                if cur_sid is not None and times:
                        seg_start = times[0]
                        prev = times[0]
                        cnt = 1
                        for t in times[1:]:
                                gap = (t - prev).total_seconds()
                                if gap <= SESSION_TIMEOUT:
                                        prev = t
                                        cnt += 1
                                else:
                                        if cnt > 1:
                                                durations.append(max(0.0, (prev - seg_start).total_seconds()))
                                        seg_start = t
                                        prev = t
                                        cnt = 1
                        if cnt > 1:
                                durations.append(max(0.0, (prev - seg_start).total_seconds()))

        bounce_rate = (single_event_sess / total_sess * 100.0) if total_sess > 0 else 0.0

        avg_session_duration = (sum(durations) / len(durations)) if len(durations) > 0 else 0.0

        return {
                'total_views': total_views,
                'unique_pages': unique_pages,
                'unique_sessions': unique_sessions,
                'avg_views_per_session': round(avg_views_per_session, 2),
                'avg_session_duration': round(avg_session_duration, 2),
                'bounce_rate_percent': round(bounce_rate, 2),
        }

@router.get('/referrers')
def referrers(days: int = Query(7, ge=1, le=365), limit: int = Query(10, ge=1, le=100), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        since = datetime.utcnow() - timedelta(days=days)
        stmt = select(Event.referrer, func.count()).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        stmt = stmt.group_by(Event.referrer).order_by(func.count().desc()).limit(limit)
        res = session.exec(stmt).all()

        def norm(r):
                ref = r[0] or '(direct)'
                return {'referrer': ref, 'count': int(r[1])}

        return [norm(r) for r in res]

@router.get('/campaigns')
def campaigns(days: int = Query(7, ge=1, le=365), limit: int = Query(20, ge=1, le=100), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        """Return breakdown by UTM campaign/source/medium (if present in properties->utm)."""
        since = datetime.utcnow() - timedelta(days=days)

        stmt = select(Event.properties).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        res = session.exec(stmt).all()
        buckets = {}
        for row in res:
                # row may be a tuple like (props,), a mapping, or an object with .properties
                if isinstance(row, (list, tuple)):
                        props = row[0]
                elif isinstance(row, dict):
                        props = row.get('properties')
                elif hasattr(row, 'properties'):
                        props = getattr(row, 'properties')
                else:
                        props = row

                if not props or not isinstance(props, dict):
                        k = '(no_campaign)'
                else:
                        utm = props.get('utm')
                        k = utm.get('utm_campaign') if isinstance(utm, dict) and 'utm_campaign' in utm else '(no_campaign)'
                buckets[k] = buckets.get(k, 0) + 1
        items = sorted(buckets.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{'campaign': k, 'count': v} for k, v in items]

@router.get('/browsers')
def browsers(days: int = Query(7, ge=1, le=365), limit: int = Query(10, ge=1, le=100), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        """Very simple user-agent parsing: group by substring tokens (Chrome, Firefox, Safari, Edge)."""
        since = datetime.utcnow() - timedelta(days=days)
        stmt = select(Event.user_agent, func.count()).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        stmt = stmt.group_by(Event.user_agent)
        res = session.exec(stmt).all()
        buckets = {}
        for ua, cnt in res:
                ua_str = (ua or 'unknown').lower()
                if 'chrome' in ua_str and 'chromium' not in ua_str and 'edge' not in ua_str:
                        name = 'Chrome'
                elif 'firefox' in ua_str:
                        name = 'Firefox'
                elif 'safari' in ua_str and 'chrome' not in ua_str:
                        name = 'Safari'
                elif 'edge' in ua_str or 'edg/' in ua_str:
                        name = 'Edge'
                else:
                        name = 'Other'
                buckets[name] = buckets.get(name, 0) + int(cnt)

        items = sorted(buckets.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{'browser': k, 'count': v} for k, v in items]

@router.get('/sessions')
def sessions(days: int = Query(7, ge=1, le=365), site_id: Optional[str] = None, session: Session = Depends(get_session)):
        """Return simple session metrics: average length (events count), and sessions with most pages"""
        since = datetime.utcnow() - timedelta(days=days)
        stmt = select(Event.session_id, func.count(), func.count(func.distinct(Event.path))).where(Event.timestamp >= since)
        if site_id:
                stmt = stmt.where(Event.site_id == site_id)
        stmt = stmt.group_by(Event.session_id).order_by(func.count().desc()).limit(50)
        res = session.exec(stmt).all()
        sessions = []
        total_events = 0
        for r in res:
                sid = r[0]
                events = int(r[1])
                pages = int(r[2])
                total_events += events
                sessions.append({'session_id': sid, 'events': events, 'unique_pages': pages})

        avg_len = (total_events / len(sessions)) if sessions else 0.0
        return {'avg_events_per_session': round(avg_len, 2), 'top_sessions': sessions}
