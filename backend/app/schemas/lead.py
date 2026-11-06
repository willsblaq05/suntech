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

ALLOWED_IMPROVEMENT_GOALS = frozenset(
    {
        "capacity",      # increase solar capacity
        "batteries",     # battery upgrades
        "backup",        # longer backup duration
        "inverter",      # replace or upgrade the inverter
        "performance",   # troubleshoot an underperforming system
        "expansion",     # expand the existing installation
    }
)

ALLOWED_BATTERY_TYPES = frozenset({"lithium", "agm", "gel", "tubular"})


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
    # ---- Existing-system details (upgrade inquiries only) ------------------ #
    improvement_goals: list[str] | None = Field(
        default=None,
        description="What the customer wants to improve (upgrade inquiries only)",
    )
    existing_inverter_kw: float | None = Field(
        default=None,
        gt=0,
        description="Inverter capacity of the existing system, if known",
    )
    existing_battery_type: str | None = Field(
        default=None,
        max_length=40,
        description="Battery chemistry of the existing system; omit when the customer does not know",
    )
    existing_battery_capacity: str | None = Field(
        default=None,
        max_length=50,
        description="Battery capacity with units, e.g. 5 kWh or 100 Ah",
    )
    existing_system_notes: str | None = Field(
        default=None,
        min_length=10,
        max_length=1000,
        description="Description of the current system or the problem (required for upgrades)",
    )
    model_config = ConfigDict(extra="forbid")

    @field_validator("phone")
    @classmethod
    def phone_must_be_a_valid_number(cls, value: str) -> str:
        return _normalise_phone(value)

    @field_validator("existing_battery_type")
    @classmethod
    def battery_type_must_be_known(
        cls, value: str | None
    ) -> str | None:
        """Normalise the chemistry; missing/None means the customer is unsure."""
        if value is None:
            return None
        cleaned = value.strip().lower()
        if cleaned == "":
            return None
        if cleaned not in ALLOWED_BATTERY_TYPES:
            raise ValueError(
                "existing_battery_type must be one of: lithium, agm, gel, tubular "
                "(or omit it when not known)"
            )
        return cleaned

    @model_validator(mode="after")
    def validate_upgrade_details(self) -> "LeadCreate":
        """Keep inquiries coherent: upgrade details only on upgrade inquiries.

        Non-upgrade inquiries carrying existing-system fields are rejected
        outright rather than silently discarded, so nothing the customer
        submitted is lost without a clear server response.
        """
        upgrade_fields = (
            self.improvement_goals,
            self.existing_inverter_kw,
            self.existing_battery_type,
            self.existing_battery_capacity,
            self.existing_system_notes,
        )

        if self.user_type is not UserType.upgrade:
            if any(value is not None for value in upgrade_fields):
                raise ValueError(
                    "existing-system details are only valid when user_type is 'upgrade'"
                )
            return self

        goals = self.improvement_goals or []
        if not goals:
            raise ValueError(
                "select at least one improvement goal (improvement_goals) for upgrade inquiries"
            )
        invalid = [goal for goal in goals if goal not in ALLOWED_IMPROVEMENT_GOALS]
        if invalid:
            raise ValueError(
                "improvement_goals must be a subset of: "
                + ", ".join(sorted(ALLOWED_IMPROVEMENT_GOALS))
            )
        if not self.existing_system_notes:
            raise ValueError(
                "existing_system_notes is required for upgrade inquiries "
                "(describe the current system or the problem)"
            )
        return self


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
    improvement_goals: list[str] | None = None
    existing_inverter_kw: float | None = None
    existing_battery_type: str | None = None
    existing_battery_capacity: str | None = None
    existing_system_notes: str | None = None
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
    improvement_goals: list[str] | None = None
    existing_inverter_kw: float | None = None
    existing_battery_type: str | None = None
    existing_battery_capacity: str | None = None
    existing_system_notes: str | None = None
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
    improvement_goals: list[str] | None = None
    existing_inverter_kw: float | None = Field(
        default=None,
        gt=0,
    )
    existing_battery_type: str | None = Field(
        default=None,
        max_length=40,
    )
    existing_battery_capacity: str | None = Field(
        default=None,
        max_length=50,
    )
    existing_system_notes: str | None = Field(
        default=None,
        min_length=10,
        max_length=1000,
    )
    model_config = ConfigDict(extra="forbid")

    @field_validator("phone")
    @classmethod
    def phone_must_be_a_valid_number(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalise_phone(value)

    @field_validator("existing_battery_type")
    @classmethod
    def battery_type_must_be_known(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if cleaned == "":
            return None
        if cleaned not in ALLOWED_BATTERY_TYPES:
            raise ValueError(
                "existing_battery_type must be one of: lithium, agm, gel, tubular "
                "(or null when not known)"
            )
        return cleaned

    @model_validator(mode="after")
    def validate_upgrade_goals(self) -> "LeadUpdate":
        """Any explicitly-set improvement goals must be from the allowed set."""
        if self.improvement_goals is not None:
            invalid = [
                goal for goal in self.improvement_goals
                if goal not in ALLOWED_IMPROVEMENT_GOALS
            ]
            if invalid:
                raise ValueError(
                    "improvement_goals must be a subset of: "
                    + ", ".join(sorted(ALLOWED_IMPROVEMENT_GOALS))
                )
        return self

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
