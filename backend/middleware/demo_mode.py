"""Demo mode middleware for MegalodonMD.

Intercepts requests with x-demo-mode header or ?demo=true query param
and routes them to pre-built demo handlers that return realistic mock data
without hitting any external APIs (except Discord webhook for alerts).
"""
import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from demo_data import DEMO_ROUTES, DEMO_PREFIX_ROUTES

logger = logging.getLogger(__name__)


class DemoModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        demo = (
            request.headers.get("x-demo-mode") == "true"
            or request.query_params.get("demo") == "true"
        )
        request.state.demo = demo

        if demo:
            method = request.method
            path = request.url.path

            # Exact match
            handler = DEMO_ROUTES.get((method, path))
            if handler:
                result = await handler(request)
                if result is not None:
                    return result

            # Prefix match (for /api/trends/{drug}, /api/sparklines/{drug})
            for (m, prefix), handler in DEMO_PREFIX_ROUTES.items():
                if method == m and path.startswith(prefix):
                    result = await handler(request)
                    if result is not None:
                        return result

        return await call_next(request)
