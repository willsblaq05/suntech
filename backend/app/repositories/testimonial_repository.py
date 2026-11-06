from uuid import UUID

from sqlmodel import Session, select

from app.models.testimonial import Testimonial, TestimonialStatus


class TestimonialRepository:
    """Repository layer for Testimonial database operations."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, testimonial: Testimonial) -> Testimonial:
        self.session.add(testimonial)
        self.session.commit()
        self.session.refresh(testimonial)
        return testimonial

    def get(self, testimonial_id: UUID) -> Testimonial | None:
        return self.session.get(Testimonial, testimonial_id)

    def list(
        self,
        status: TestimonialStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Testimonial]:
        statement = select(Testimonial)
        if status is not None:
            statement = statement.where(Testimonial.status == status)
        statement = (
            statement.order_by(Testimonial.created_at.desc(), Testimonial.id)
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def list_approved(self, limit: int = 12) -> list[Testimonial]:
        statement = (
            select(Testimonial)
            .where(Testimonial.status == TestimonialStatus.approved)
            .order_by(Testimonial.created_at.desc(), Testimonial.id)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def update(self, testimonial: Testimonial) -> Testimonial:
        self.session.add(testimonial)
        self.session.commit()
        self.session.refresh(testimonial)
        return testimonial

    def delete(self, testimonial_id: UUID) -> tuple[bool, str | None]:
        """Delete a testimonial; returns (existed?, photo URL for cleanup)."""
        testimonial = self.session.get(Testimonial, testimonial_id)
        if testimonial is None:
            return (False, None)
        photo_path = testimonial.photo_path
        self.session.delete(testimonial)
        self.session.commit()
        return (True, photo_path)
