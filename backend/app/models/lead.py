from enum import Enum
from uuid import UUID, uuid4

from datetime import datetime, timezone

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class UserType(str, Enum):
    """Accepted customer types for solar installation referrals.

    ``upgrade`` marks an inquiry about an existing system the customer wants
    to improve — capacity, batteries, backup, inverter, or expansion.
    """

    residential = "residential"
    commercial = "commercial"
    upgrade = "upgrade"


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
    # ---- Existing-system details (upgrade inquiries only) ------------------ #
    improvement_goals: list[str] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
        description="Selected upgrade goals (values from app.schemas.lead.IMPROVEMENT_GOALS)",
    )
    existing_inverter_kw: float | None = Field(
        default=None,
        gt=0,
        description="Inverter capacity of the existing system in kW, if known",
    )
    existing_battery_type: str | None = Field(
        default=None,
        max_length=40,
        description="Battery chemistry of the existing system (lithium, agm, gel, or tubular); null = customer does not know",
    )
    existing_battery_capacity: str | None = Field(
        default=None,
        max_length=50,
        description="Battery capacity of the existing system with units, e.g. '5 kWh' or '100 Ah'",
    )
    existing_system_notes: str | None = Field(
        default=None,
        max_length=1000,
        description="Customer description of the current system or the problem they are seeing (required for upgrades)",
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
