import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import settings
from database import init_db
from services.scheduler import start_scheduler, stop_scheduler
from services.health import check_tinyfish_health, periodic_health_check, get_health_status
from routers.search import router as search_router
from routers.prices import router as prices_router
from routers.alerts import router as alerts_router
from routers.monitor import router as monitor_router
from routers.optimize import router as optimize_router
from routers.ocr import router as ocr_router
from routers.memory import router as memory_router
from services import supermemory_mem

logger = logging.getLogger(__name__)


def _cors_origin_list() -> list[str]:
    """Parse comma-separated CORS origins from settings."""
    return [o.strip() for o in settings.cors_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    # Initial health check
    await check_tinyfish_health(settings.tinyfish_api_key)
    # Start periodic health check (every 5 min)
    health_task = asyncio.create_task(periodic_health_check(settings.tinyfish_api_key, interval=300))
    yield
    health_task.cancel()
    stop_scheduler()


app = FastAPI(title="MediScrape API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origin_list(),
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
app.include_router(memory_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "mediscrape",
        "supermemory_configured": supermemory_mem.is_enabled(),
    }


@app.get("/health/services")
async def services_health():
    return get_health_status()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
