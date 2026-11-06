from uuid import UUID
from datetime import datetime

from pydantic import ConfigDict, Field, field_validator
from sqlmodel import SQLModel

from app.models.testimonial import TestimonialStatus


def _clean_text(value: str) -> str:
    return value.strip()


class TestimonialCreate(SQLModel):
    """Schema for recording a verified customer story (admin input)."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Public display name",
    )
    location: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Public area, e.g. 'Independence Layout, Enugu'",
    )
    project_type: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Project summary shown as a chip, e.g. 'Residential · 5 kW'",
    )
    quote: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="The customer's words — check for contact details before approving",
    )
    lead_id: UUID | None = Field(
        default=None,
        description="Originating lead, when the story came from a completed project",
    )
    model_config = ConfigDict(extra="forbid")

    @field_validator("name", "location", "project_type", "quote")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        return _clean_text(value)


class TestimonialUpdate(SQLModel):
    """Partial admin update: text edits and/or a status decision."""

    name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, min_length=2, max_length=100)
    project_type: str | None = Field(default=None, min_length=2, max_length=120)
    quote: str | None = Field(default=None, min_length=10, max_length=1000)
    status: TestimonialStatus | None = None
    model_config = ConfigDict(extra="forbid")

    @field_validator("name", "location", "project_type", "quote")
    @classmethod
    def strip_whitespace(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_text(value)


class TestimonialRead(SQLModel):
    """Back-office view — includes workflow status and timestamps."""

    id: UUID
    lead_id: UUID | None = None
    name: str
    location: str
    project_type: str
    quote: str
    photo_path: str | None = None
    status: TestimonialStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TestimonialPublicRead(SQLModel):
    """Public view — deliberately excludes workflow internals.

    Consistent with ``LeadPublicRead``: pending/rejected state and
    bookkeeping timestamps never leave the admin surface.
    """

    id: UUID
    name: str
    location: str
    project_type: str
    quote: str
    photo_path: str | None = None
    model_config = ConfigDict(from_attributes=True)
