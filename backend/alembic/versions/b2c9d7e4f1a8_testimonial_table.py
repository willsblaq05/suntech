"""testimonial table for verified customer stories

Revision ID: b2c9d7e4f1a8
Revises: a4c8f1b9d2e7
Create Date: 2026-11-02

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c9d7e4f1a8'
down_revision: Union[str, Sequence[str], None] = 'a4c8f1b9d2e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the testimonial table (workflow status = pending by default)."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # Native enum for the publication workflow, matching the pattern
        # used for the lead status/user-type enums. SQLite stores enums
        # as VARCHAR, so this step is dialect-gated.
        op.execute(
            "CREATE TYPE testimonialstatus "
            "AS ENUM ('pending', 'approved', 'rejected')"
        )
        status_column = sa.Enum(
            "pending",
            "approved",
            "rejected",
            name="testimonialstatus",
            native_enum=True,
            create_type=False,
        )
    else:
        status_column = sa.String(length=9)

    op.create_table(
        'testimonial',
        sa.Column('id', sa.Uuid(as_uuid=True), nullable=False),
        sa.Column('lead_id', sa.Uuid(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=False),
        sa.Column('project_type', sa.String(length=120), nullable=False),
        sa.Column('quote', sa.String(length=1000), nullable=False),
        sa.Column('photo_path', sa.String(length=255), nullable=True),
        sa.Column('status', status_column, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_testimonial_status'), 'testimonial', ['status'], unique=False
    )
    op.create_index(
        op.f('ix_testimonial_lead_id'), 'testimonial', ['lead_id'], unique=False
    )
    op.create_index(
        op.f('ix_testimonial_created_at'), 'testimonial', ['created_at'], unique=False
    )


def downgrade() -> None:
    """Drop the testimonial table and (on Postgres) its enum type."""
    bind = op.get_bind()
    op.drop_index(op.f('ix_testimonial_created_at'), table_name='testimonial')
    op.drop_index(op.f('ix_testimonial_lead_id'), table_name='testimonial')
    op.drop_index(op.f('ix_testimonial_status'), table_name='testimonial')
    op.drop_table('testimonial')
    if bind.dialect.name == "postgresql":
        sa.Enum(
            'pending', 'approved', 'rejected', name='testimonialstatus'
        ).drop(bind, checkfirst=True)
