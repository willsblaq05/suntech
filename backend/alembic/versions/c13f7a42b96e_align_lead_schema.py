"""Align the lead table with the current model.

Revision ID: c13f7a42b96e
Revises: 70863f0d7b0b
"""

from datetime import datetime, timezone
from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision: str = "c13f7a42b96e"
down_revision: Union[str, Sequence[str], None] = "70863f0d7b0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _as_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def upgrade() -> None:
    """Convert existing leads to UUIDs and the current column layout."""
    bind = op.get_bind()
    old_table = sa.Table("lead", sa.MetaData(), autoload_with=bind)
    new_table = op.create_table(
        "lead_new",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("user_type", sa.String(length=11), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("budget_range", sa.String(length=20), nullable=True),
        sa.Column("system_size_kw", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=9), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    rows = bind.execute(sa.select(old_table)).mappings()
    migrated_rows = [
        {
            "id": uuid4(),
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "user_type": row["user_type"],
            "state": "Enugu",
            "city": row["location"],
            "budget_range": row["budget_range"],
            "system_size_kw": row["system_size_kw"],
            "status": row["status"],
            "notes": row["notes"],
            "created_at": _as_utc(row["created_at"]),
            "updated_at": _as_utc(row["updated_at"]),
        }
        for row in rows
    ]
    if migrated_rows:
        bind.execute(new_table.insert(), migrated_rows)

    op.drop_table("lead")
    op.rename_table("lead_new", "lead")


def downgrade() -> None:
    """Restore the legacy columns.

    UUIDs become sequential integers, and state/city are combined into location.
    """
    bind = op.get_bind()
    current_table = sa.Table("lead", sa.MetaData(), autoload_with=bind)
    legacy_table = op.create_table(
        "lead_legacy",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("user_type", sa.String(), nullable=False),
        sa.Column("budget_range", sa.String(), nullable=True),
        sa.Column("system_size_kw", sa.Float(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    rows = bind.execute(
        sa.select(current_table).order_by(current_table.c.created_at, current_table.c.id)
    ).mappings()
    restored_rows = [
        {
            "id": index,
            "name": row["name"],
            "email": row["email"] or "",
            "phone": row["phone"],
            "user_type": row["user_type"],
            "budget_range": row["budget_range"],
            "system_size_kw": row["system_size_kw"],
            "location": row["city"] or row["state"],
            "status": row["status"],
            "notes": row["notes"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for index, row in enumerate(rows, start=1)
    ]
    if restored_rows:
        bind.execute(legacy_table.insert(), restored_rows)

    op.drop_table("lead")
    op.rename_table("lead_legacy", "lead")
