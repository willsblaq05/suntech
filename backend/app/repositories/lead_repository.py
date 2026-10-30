from uuid import UUID

from sqlmodel import Session, select

from app.models.lead import Lead, LeadStatus, UserType


class LeadRepository:
    """Repository layer for Lead database operations."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, lead: Lead) -> Lead:
        """Create a new lead in the database."""
        self.session.add(lead)
        self.session.commit()
        self.session.refresh(lead)
        return lead

    def get(self, lead_id: UUID) -> Lead | None:
        """Retrieve a lead by its ID."""
        return self.session.get(Lead, lead_id)

    def get_for_update(self, lead_id: UUID) -> Lead | None:
        """Retrieve a lead, taking a row lock on dialects that support it.

        On PostgreSQL this issues SELECT ... FOR UPDATE so two operators
        editing the same lead never overwrite each other's committed work.
        SQLite ignores the FOR UPDATE clause (single-writer database), so
        it stays a no-op during local development and tests.
        """
        statement = select(Lead).where(Lead.id == lead_id).with_for_update()
        return self.session.exec(statement).first()

    def list(
        self,
        status: LeadStatus | None = None,
        user_type: UserType | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Lead]:
        """List leads with optional filters and pagination."""
        statement = select(Lead)
        if status is not None:
            statement = statement.where(Lead.status == status)
        if user_type is not None:
            statement = statement.where(Lead.user_type == user_type)
        statement = (
            statement.order_by(Lead.created_at.desc(), Lead.id)
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def update(self, lead: Lead) -> Lead:
        """Update an existing lead."""
        self.session.add(lead)
        self.session.commit()
        self.session.refresh(lead)
        return lead

    def delete(self, lead_id: UUID) -> bool:
        """Delete a lead by ID. Returns True if deleted, False if not found."""
        lead = self.session.get(Lead, lead_id)
        if lead:
            self.session.delete(lead)
            self.session.commit()
            return True
        return False
