from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, leads

router = APIRouter()

router.include_router(auth.router)
router.include_router(health.router)
router.include_router(leads.router)
