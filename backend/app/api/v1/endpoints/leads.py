"""Public lead intake and admin-only lead management endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_admin
from app.core.rate_limit import check_lead_create_rate_limit
from app.models.lead import LeadStatus, UserType
from app.schemas.lead import (
    LeadCreate,
    LeadPublicRead,
    LeadRead,
    LeadStatusUpdate,
    LeadUpdate,
)
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])

AdminPrincipal = Depends(get_current_admin)


@router.post(
    "/",
    response_model=LeadPublicRead,
    status_code=201,
    summary="Submit a solar inquiry (public)",
    dependencies=[Depends(check_lead_create_rate_limit)],
)
def create_lead(
    *,
    session: Session = Depends(get_session),
    lead_in: LeadCreate,
) -> LeadPublicRead:
    """Public endpoint used by the website's quote form.

    Returns ``LeadPublicRead`` so internal fields (status, notes,
    updated_at) never echo back to the public app.
    """
    service = LeadService(session)
    return service.create_lead(lead_in=lead_in)


# ---- Admin-only back-office surface ------------------------------------- #


@router.get(
    "/",
    response_model=list[LeadRead],
    dependencies=[AdminPrincipal],
    summary="List leads (admin)",
)
def list_leads(
    status: LeadStatus | None = None,
    user_type: UserType | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> list[LeadRead]:
    """List leads with optional filters and pagination."""
    service = LeadService(session)
    return service.list_leads(
        status=status,
        user_type=user_type,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{lead_id}",
    response_model=LeadRead,
    dependencies=[AdminPrincipal],
    summary="Retrieve a lead (admin)",
)
def get_lead(
    lead_id: UUID,
    session: Session = Depends(get_session),
) -> LeadRead:
    """Retrieve a specific lead by ID."""
    service = LeadService(session)
    lead = service.get_lead(lead_id=lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch(
    "/{lead_id}",
    response_model=LeadRead,
    dependencies=[AdminPrincipal],
    summary="Partially update a lead (admin)",
)
def update_lead(
    lead_id: UUID,
    *,
    session: Session = Depends(get_session),
    lead_in: LeadUpdate,
) -> LeadRead:
    """Partially update a lead."""
    service = LeadService(session)
    lead = service.update_lead(lead_id=lead_id, lead_in=lead_in)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch(
    "/{lead_id}/status",
    response_model=LeadRead,
    dependencies=[AdminPrincipal],
    summary="Update a lead's workflow status (admin)",
)
def update_lead_status(
    lead_id: UUID,
    *,
    session: Session = Depends(get_session),
    status_update: LeadStatusUpdate,
) -> LeadRead:
    """Update a lead's workflow status."""
    service = LeadService(session)
    lead = service.update_lead_status(
        lead_id=lead_id,
        status=status_update.status,
    )
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.delete(
    "/{lead_id}",
    dependencies=[AdminPrincipal],
    summary="Delete a lead (admin)",
)
def delete_lead(
    lead_id: UUID,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    """Delete a lead."""
    service = LeadService(session)
    deleted = service.delete_lead(lead_id=lead_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"detail": "Lead deleted successfully"}
