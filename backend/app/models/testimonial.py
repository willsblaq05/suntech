from enum import Enum
from uuid import UUID, uuid4

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class TestimonialStatus(str, Enum):
    """Publication workflow for customer testimonials.

    Nothing is public until an operator has verified the story and
    explicitly approved it — the website never shows pending/rejected.
    """

    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Testimonial(SQLModel, table=True):
    """A verified customer story shown on the public testimonials section.

    Created as ``pending`` by the admin; ``approved`` items (only) are
    served publicly at ``GET /api/v1/testimonials/public``.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    # Optional link back to the originating lead — this IS the
    # verification record ("real customer confirmed").
    lead_id: UUID | None = Field(
        default=None,
        index=True,
        description="Originating lead, when the story came from a completed project",
    )
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Public display name of the customer",
    )
    location: str = Field(
        max_length=100,
        description="Public area, e.g. 'Independence Layout, Enugu'",
    )
    project_type: str = Field(
        max_length=120,
        description="Project summary, e.g. 'Residential · 5 kW battery upgrade'",
    )
    quote: str = Field(
        max_length=1000,
        description="The customer's words, privacy-checked before approval",
    )
    # Server-relative media URL ("/media/...") set by app.core.media.save_image.
    photo_path: str | None = Field(
        default=None,
        max_length=255,
        description="Optional verified project/customer photograph",
    )
    status: TestimonialStatus = Field(
        default=TestimonialStatus.pending,
        index=True,
        description="Publication status",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
        description="Timestamp when the testimonial was recorded (UTC)",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the testimonial was last updated (UTC)",
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )
