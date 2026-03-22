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
from routers.insights import router as insights_router
from routers.demo_alert import router as demo_alert_router
from routers.tts import router as tts_router
from routers.nl_search import router as nl_search_router
from routers.stats import router as stats_router
from services import supermemory_mem

logger = logging.getLogger(__name__)


def _cors_origin_list() -> list[str]:
    raw = (settings.cors_origins or "").strip()
    if not raw:
        return ["http://localhost:3005"]
    return [o.strip() for o in raw.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    await check_tinyfish_health(settings.tinyfish_api_key)
    health_task = asyncio.create_task(
        periodic_health_check(
            tinyfish_key=settings.tinyfish_api_key,
            exa_key=settings.exa_api_key,
            openrouter_key=settings.openrouter_api_key,
            proxy_url=settings.brightdata_proxy_url,
            interval=300,
        )
    )
    yield
    health_task.cancel()
    stop_scheduler()


app = FastAPI(title="Megladon MD API", version="0.1.0", lifespan=lifespan)

# Flexible CORS: If CORS_ORIGINS is "*" or not set, allow all but disable credentials
# (Browsers disallow "*" + allow_credentials=True)
origins = _cors_origin_list()
allow_all = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not allow_all,
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
app.include_router(insights_router)
app.include_router(demo_alert_router)
app.include_router(tts_router)
app.include_router(nl_search_router)
app.include_router(stats_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "megladon_md",
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
