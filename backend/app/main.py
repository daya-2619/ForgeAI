import logging
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import engine, Base
from app.routers import auth, startups, debate, analytics

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Run SQLite migrations out-of-the-box on import
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas created successfully.")
except Exception as e:
    logger.error(f"Error during schema migration: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="The Operating System for AI-Native Startups",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register APIRouters under standard prefix /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(startups.router, prefix=settings.API_V1_STR)
app.include_router(debate.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router) # includes /metrics and /api/v1/analytics/costs

# --- WebSocket Progress Streaming ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, startup_id: str, websocket: WebSocket):
        await websocket.accept()
        if startup_id not in self.active_connections:
            self.active_connections[startup_id] = []
        self.active_connections[startup_id].append(websocket)

    def disconnect(self, startup_id: str, websocket: WebSocket):
        if startup_id in self.active_connections:
            self.active_connections[startup_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_startup(self, startup_id: str, message: str):
        if startup_id in self.active_connections:
            for connection in self.active_connections[startup_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/api/v1/startups/{startup_id}/stream")
async def websocket_endpoint(websocket: WebSocket, startup_id: str):
    await manager.connect(startup_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast_to_startup(startup_id, f"Progress update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(startup_id, websocket)
