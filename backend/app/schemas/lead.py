from datetime import datetime
from uuid import UUID

from pydantic import (
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)
from sqlmodel import SQLModel

from app.models.lead import BudgetRange, LeadStatus, UserType


def _normalise_phone(value: str) -> str:
    """Strip separators and validate a Nigerian-friendly phone number.

    Accepts international (+234...) and local (0803...) formats up to
    15 digits total, as well as generic international numbers — Enugu is
    the MVP market, but providers may call from anywhere.
    """
    cleaned = "".join(ch for ch in value if ch.isdigit() or ch == "+")
    if cleaned.startswith("+"):
        digits = cleaned[1:]
    else:
        digits = cleaned
    if "+" in digits:
        raise ValueError("phone number must contain at most one '+'")
    if not digits.isdigit() or not 7 <= len(digits) <= 15:
        raise ValueError(
            "phone number must be 7-15 digits, e.g. +2348012345678 or 08012345678"
        )
    return cleaned


class LeadCreate(SQLModel):
    """Schema for creating a new lead (input).

    Internal fields such as id, status, notes, and timestamps are set by
    the system.
    """

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Full name of the customer",
    )
    email: EmailStr | None = Field(
        default=None,
        max_length=255,
        description="Email address (optional — phone is the main channel)",
    )
    phone: str = Field(
        ...,
        description="Phone number (required), e.g. +2348012345678",
    )
    user_type: UserType = Field(
        default=UserType.residential,
        description="Customer type: residential or commercial",
    )
    state: str = Field(
        default="Enugu",
        description="State or province",
        max_length=100,
    )
    city: str | None = Field(
        default=None,
        max_length=100,
        description="City or local government area",
    )
    budget_range: BudgetRange | None = Field(
        default=None,
        description="Rough budget bucket: low, medium, or high",
    )
    system_size_kw: float | None = Field(
        default=None,
        gt=0,
        description="Requested system size in kilowatts (must be > 0 if provided)",
    )
    model_config = ConfigDict(extra="forbid")

    @field_validator("phone")
    @classmethod
    def phone_must_be_a_valid_number(cls, value: str) -> str:
        return _normalise_phone(value)


class LeadRead(SQLModel):
    """Schema for reading lead data — back-office (admin) only.

    Includes internal fields (status, notes) for the operator UI.
    """

    id: UUID
    name: str
    email: str | None = None
    phone: str
    user_type: UserType
    state: str
    city: str | None = None
    budget_range: BudgetRange | None = None
    system_size_kw: float | None = None
    status: LeadStatus
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LeadPublicRead(SQLModel):
    """Schema returned on public submission of a lead.

    Deliberately excludes status, notes, and updated_at — those are
    internal operator data and must not leak to the public-facing app.
    """

    id: UUID
    name: str
    email: str | None = None
    phone: str
    user_type: UserType
    state: str
    city: str | None = None
    budget_range: BudgetRange | None = None
    system_size_kw: float | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LeadUpdate(SQLModel):
    """Schema for updating a lead (partial input).

    Only fields that should be client-updatable are included.
    """

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    email: EmailStr | None = Field(
        default=None,
        max_length=255,
    )
    phone: str | None = Field(
        default=None,
        description="Phone number, e.g. +2348012345678",
    )
    user_type: UserType | None = None
    state: str | None = Field(
        default=None,
        max_length=100,
    )
    city: str | None = Field(
        default=None,
        max_length=100,
        description="City or local government area",
    )
    budget_range: BudgetRange | None = None
    system_size_kw: float | None = Field(
        default=None,
        gt=0,
    )
    model_config = ConfigDict(extra="forbid")

    @field_validator("phone")
    @classmethod
    def phone_must_be_a_valid_number(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalise_phone(value)

    @model_validator(mode="after")
    def reject_nulls_for_required_fields(self) -> "LeadUpdate":
        for field in ("name", "user_type", "state"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class LeadStatusUpdate(SQLModel):
    """Schema for workflow status changes."""

    status: LeadStatus

    model_config = ConfigDict(extra="forbid")
