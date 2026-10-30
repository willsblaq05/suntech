from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/", summary="Health check")
def health() -> dict[str, str]:
    """Return service health status."""
    return {"status": "healthy"}