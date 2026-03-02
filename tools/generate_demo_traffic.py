import argparse
import json
import random
import time
import uuid
from datetime import datetime, timedelta

try:
    from urllib import request
except Exception:
    import urllib.request as request


def send(base, payload, timeout=6):
    path = getattr(send, 'path_override', '/api/collect')
    url = base.rstrip('/') + path
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except Exception as e:
        return None, str(e)


def make_url(path, utm=None):
    base = 'https://example.local'
    if utm:
        qs = '&'.join(f'{k}={v}' for k, v in utm.items())
        return f'{base}{path}?{qs}'
    return f'{base}{path}'


def random_user_agent():
    choices = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        'curl/7.68.0',
        'test-bot/1.0',
    ]
    return random.choice(choices)


def run(args):
    paths = ['/', '/about', '/contact', '/products', '/products/1', '/blog', '/blog/post-1', '/pricing']
    campaigns = [None, {'utm_source': 'newsletter', 'utm_medium': 'email', 'utm_campaign': 'weekly'},
                 {'utm_source': 'google', 'utm_medium': 'cpc', 'utm_campaign': 'promo-fall'},
                 {'utm_source': 'facebook', 'utm_medium': 'social', 'utm_campaign': 'social-summer'}]

    now = datetime.utcnow()
    sent = 0
    sessions_created = 0

    target = args.count

    while sent < target:
        if random.random() < 0.35:
            events_in_session = 1
        else:
            events_in_session = random.randint(2, 6)

        sid = str(uuid.uuid4())
        sessions_created += 1

        utm = random.choice(campaigns)

        minutes_back = random.randint(0, max(1, args.days * 24 * 60))
        session_start = now - timedelta(minutes=minutes_back)

        for i in range(events_in_session):
            offset_minutes = random.randint(0, min(30, args.days * 24 * 60))
            ts = session_start + timedelta(minutes=offset_minutes)
            path = random.choice(paths)

            payload = {
                'site_id': args.site,
                'path': path,
                'url': make_url(path, utm if i == 0 and utm else None),
                'referrer': None if random.random() < 0.7 else 'https://ref.example',
                'user_agent': random_user_agent(),
                'ip': None,
                'timestamp': ts.isoformat() + '+00:00',
                'session_id': sid,
                'event_type': 'pageview',
                'properties': {'demo': True}
            }

            status, body = send(args.base, payload)
            sent += 1
            print(f'[{sent}/{target}] session={sid[:8]} events={events_in_session} utm={utm and utm.get("utm_campaign")} ->', status)
            if args.delay:
                time.sleep(args.delay)
            if sent >= target:
                break

    print(f'Done: Sent {sent} events across {sessions_created} sessions')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://localhost:8200', help='Backend base URL')
    parser.add_argument('--site', default='example', help='site_id')
    parser.add_argument('--count', type=int, default=200, help='Total events to send')
    parser.add_argument('--days', type=int, default=7, help='Distribute events across last N days')
    parser.add_argument('--delay', type=float, default=0.02, help='Optional delay between events (seconds)')
    parser.add_argument('--path', default='/collect', help='Endpoint path to POST events to (default /collect)')
    args = parser.parse_args()
    send.path_override = args.path
    run(args)