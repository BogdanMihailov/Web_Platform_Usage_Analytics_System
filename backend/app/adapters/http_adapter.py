import httpx
from .base import Adapter


class HTTPAdapter(Adapter):
    def fetch(self, url: str) -> dict:
        try:
            r = httpx.get(url, timeout=15.0)
            return {"status_code": r.status_code, "headers": dict(r.headers), "text_snippet": r.text[:2000]}
        except Exception as e:
            return {"error": str(e)}
