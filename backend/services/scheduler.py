"""APScheduler service for recurring monitoring jobs"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the APScheduler."""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started")


def stop_scheduler():
    """Stop the APScheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")


def add_monitor_job(job_id: str, func, interval_minutes: int, **kwargs):
    """Add a recurring monitoring job."""
    scheduler.add_job(
        func,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id=job_id,
        replace_existing=True,
        kwargs=kwargs,
    )
    logger.info(f"Added monitor job {job_id} (every {interval_minutes}m)")


def remove_monitor_job(job_id: str):
    """Remove a monitoring job."""
    try:
        scheduler.remove_job(job_id)
        logger.info(f"Removed monitor job {job_id}")
    except Exception:
        pass
