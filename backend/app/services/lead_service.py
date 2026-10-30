from uuid import UUID

from sqlmodel import Session

from app.models.lead import Lead, LeadStatus, UserType
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreate, LeadUpdate


class LeadService:
    """Service layer with business logic for Lead operations."""

    def __init__(self, session: Session):
        self.repository = LeadRepository(session)

    def create_lead(self, lead_in: LeadCreate) -> Lead:
        """Create a new lead from a validated schema.

        System-managed fields (id, status, notes, timestamps) are left at
        their model defaults — the schema cannot supply them.
        """
        lead = Lead(**lead_in.model_dump())
        return self.repository.create(lead)

    def get_lead(self, lead_id: UUID) -> Lead | None:
        """Retrieve a lead by ID."""
        return self.repository.get(lead_id)

    def list_leads(
        self,
        status: LeadStatus | None = None,
        user_type: UserType | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Lead]:
        """List leads with optional filters and pagination."""
        return self.repository.list(
            status=status,
            user_type=user_type,
            limit=limit,
            offset=offset,
        )

    def update_lead(self, lead_id: UUID, lead_in: LeadUpdate) -> Lead | None:
        """Update a lead partially, under a row lock (PostgreSQL)."""
        lead = self.repository.get_for_update(lead_id)
        if lead is None:
            return None
        update_data = lead_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lead, field, value)
        return self.repository.update(lead)

    def update_lead_status(self, lead_id: UUID, status: LeadStatus) -> Lead | None:
        """Update a lead's workflow status, under a row lock (PostgreSQL)."""
        lead = self.repository.get_for_update(lead_id)
        if lead is None:
            return None
        lead.status = status
        return self.repository.update(lead)

    def delete_lead(self, lead_id: UUID) -> bool:
        """Delete a lead."""
        return self.repository.delete(lead_id)
