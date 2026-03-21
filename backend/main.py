from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from services.scheduler import start_scheduler, stop_scheduler
from routers.search import router as search_router
from routers.prices import router as prices_router
from routers.alerts import router as alerts_router
from routers.monitor import router as monitor_router
from routers.optimize import router as optimize_router
from routers.ocr import router as ocr_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="MediScrape API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(prices_router)
app.include_router(alerts_router)
app.include_router(monitor_router)
app.include_router(optimize_router)
app.include_router(ocr_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mediscrape"}
