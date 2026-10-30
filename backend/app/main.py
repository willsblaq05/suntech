import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from starlette.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

logger = logging.getLogger("suntech")

app = FastAPI(
    title="SUNTECH PROJECTS API",
    description="Solar installation referral platform for residential & commercial customers in Enugu, Nigeria",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — required so the React frontend can call the API. Origins come
# from BACKEND_CORS_ORIGINS (comma-separated values in .env).
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    logger.warning("BACKEND_CORS_ORIGINS is empty — browsers cannot call this API yet")


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Map unexpected DB constraint failures to a clean 409."""
    logger.error("IntegrityError on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=409, content={"detail": "Data conflict"})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Log full detail internally; return a JSON-safe summary.

    ``exc.errors()`` can embed values that are not JSON-serializable:
    raw exception objects in ``ctx``, and ``bytes`` in ``input`` when a
    non-JSON request body (e.g. form-encoded) fails parsing. Strip them.
    """
    logger.info(
        "Validation error on %s %s: %s", request.method, request.url.path, exc.errors()
    )
    detail = []
    for error in exc.errors():
        cleaned = error.copy()
        cleaned.pop("ctx", None)
        input_value = cleaned.get("input")
        if isinstance(input_value, bytes):
            cleaned["input"] = input_value.decode("utf-8", errors="replace")
        detail.append(cleaned)
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Log full detail internally; return a generic, safe message."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/")
def root() -> dict[str, str]:
    """Root endpoint returning a welcome message."""
    return {"message": "Welcome to SUNTECH PROJECTS API"}


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint (infra-level, kept outside the versioned API)."""
    return {"status": "healthy"}


app.include_router(api_v1_router, prefix=settings.API_V1_STR)
