from uuid import UUID

from sqlmodel import Session

from app.models.testimonial import Testimonial, TestimonialStatus
from app.repositories.testimonial_repository import TestimonialRepository
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate


class TestimonialService:
    """Service layer with business logic for Testimonial operations."""

    def __init__(self, session: Session):
        self.repository = TestimonialRepository(session)

    def create_testimonial(
        self, data_in: TestimonialCreate, photo_path: str | None = None
    ) -> Testimonial:
        """Record a verified story — always starts as pending review.

        ``photo_path`` is a server /media URL produced by
        ``app.core.media.save_image``; the schema never accepts one.
        """
        testimonial = Testimonial(**data_in.model_dump(), photo_path=photo_path)
        return self.repository.create(testimonial)

    def get_testimonial(self, testimonial_id: UUID) -> Testimonial | None:
        return self.repository.get(testimonial_id)

    def list_testimonials(
        self,
        status: TestimonialStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Testimonial]:
        return self.repository.list(status=status, limit=limit, offset=offset)

    def list_public(self, limit: int = 12) -> list[Testimonial]:
        """Approved stories only — this is the website's feed."""
        return self.repository.list_approved(limit=limit)

    def update_testimonial(
        self, testimonial_id: UUID, data_in: TestimonialUpdate
    ) -> Testimonial | None:
        testimonial = self.repository.get(testimonial_id)
        if testimonial is None:
            return None
        for field, value in data_in.model_dump(exclude_unset=True).items():
            setattr(testimonial, field, value)
        return self.repository.update(testimonial)

    def attach_photo(self, testimonial_id: UUID, photo_path: str) -> str | None:
        """Set (or replace) the photo; returns the replaced path for cleanup.

        ``testimonial_id`` must exist — check via ``get_testimonial`` first,
        otherwise this silently no-ops into a missing-row race.
        """
        testimonial = self.repository.get(testimonial_id)
        if testimonial is None:
            return None
        previous = testimonial.photo_path
        testimonial.photo_path = photo_path
        self.repository.update(testimonial)
        return previous

    def delete_testimonial(self, testimonial_id: UUID) -> tuple[bool, str | None] | None:
        """Delete the row; ``None`` when it does not exist, else
        ``(True, photo_path | None)`` so the caller can remove the file."""
        return self.repository.delete(testimonial_id)
