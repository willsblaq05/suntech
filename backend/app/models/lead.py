from enum import Enum
from uuid import UUID, uuid4

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class UserType(str, Enum):
    """Accepted customer types for solar installation referrals."""

    residential = "residential"
    commercial = "commercial"


class LeadStatus(str, Enum):
    """Accepted status values for a solar lead."""

    pending = "pending"
    contacted = "contacted"
    qualified = "qualified"
    closed = "closed"


class BudgetRange(str, Enum):
    """Broad budget buckets used to route leads to providers."""

    low = "low"
    medium = "medium"
    high = "high"


class Lead(SQLModel, table=True):
    """Model representing a solar installation referral lead."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(
        min_length=2,
        max_length=100,
        description="Full name of the customer",
    )
    email: str | None = Field(
        default=None,
        max_length=255,
        description="Email address",
    )
    phone: str = Field(
        min_length=7,
        max_length=20,
        description="Phone number (required in Enugu — the main contact channel)",
    )
    user_type: UserType = Field(
        default=UserType.residential,
        index=True,
        description="Customer type: residential or commercial",
    )
    state: str = Field(
        default="Enugu",
        description="State or province (defaults to Enugu for MVP)",
        max_length=100,
    )
    city: str | None = Field(
        default=None,
        description="City or local government area",
        max_length=100,
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
    status: LeadStatus = Field(
        default=LeadStatus.pending,
        index=True,
        description="Current status of the lead",
    )
    notes: str | None = Field(
        default=None,
        max_length=500,
        description="Additional notes",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
        description="Timestamp when the lead was created (UTC, timezone-aware)",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the lead was last updated (UTC, timezone-aware)",
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )
