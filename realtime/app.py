from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from typing import List
import asyncio
import logging

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("realtime")


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info("WS client connected (total=%d)", len(self.active))

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
            logger.info("WS client disconnected (total=%d)", len(self.active))

    async def broadcast(self, message: str):
        to_remove = []
        sent = 0
        for ws in list(self.active):
            try:
                await ws.send_text(message)
                sent += 1
            except Exception:
                to_remove.append(ws)
        for ws in to_remove:
            self.disconnect(ws)
        logger.info("Broadcasted message to %d clients (active=%d)", sent, len(self.active))


manager = ConnectionManager()


@app.post("/notify")
async def notify(request: Request):
    data = await request.body()
    # broadcast raw bytes as text
    await manager.broadcast(data.decode('utf-8'))
    return JSONResponse({"status": "ok"})


@app.get("/status")
async def status():
    return JSONResponse({"connections": len(manager.active)})


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # keep connection open; ignore incoming
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        manager.disconnect(ws)
