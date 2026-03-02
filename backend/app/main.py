from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .api import router as api_router
from .api.collect import router as collect_router
from .api.analytics import router as analytics_router
from .api.admin import router as admin_router
from .database import get_engine
from sqlmodel import SQLModel
from fastapi.responses import Response

app = FastAPI(title="Web Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(collect_router, prefix="/api")
app.include_router(analytics_router)
app.include_router(admin_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    engine = get_engine()
    SQLModel.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
        return Response(status_code=200, headers=headers)

    response = await call_next(request)
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    response.headers.setdefault("Access-Control-Allow-Headers", "*")
    return response
