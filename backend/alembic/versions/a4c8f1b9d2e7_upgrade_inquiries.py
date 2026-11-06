"""upgrade inquiries: third user_type value + existing-system detail columns

Revision ID: a4c8f1b9d2e7
Revises: fd27cd934908
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4c8f1b9d2e7'
down_revision: Union[str, Sequence[str], None] = 'fd27cd934908'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the upgrade service category and its optional detail columns."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # Extend the native enum in place (PG 12+ allows this inside the
        # migration transaction as long as the value is not used in the
        # same transaction; here we only alter the type). SQLite stores
        # enums as VARCHAR, so this step is dialect-gated.
        op.execute("ALTER TYPE usertype ADD VALUE IF NOT EXISTS 'upgrade'")
    op.add_column('lead', sa.Column('improvement_goals', sa.JSON(), nullable=True))
    op.add_column('lead', sa.Column('existing_inverter_kw', sa.Float(), nullable=True))
    op.add_column('lead', sa.Column('existing_battery_type', sa.String(length=40), nullable=True))
    op.add_column('lead', sa.Column('existing_battery_capacity', sa.String(length=50), nullable=True))
    op.add_column('lead', sa.Column('existing_system_notes', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    """Remove the upgrade columns and shrink the usertype enum back."""
    bind = op.get_bind()
    op.drop_column('lead', 'existing_system_notes')
    op.drop_column('lead', 'existing_battery_capacity')
    op.drop_column('lead', 'existing_battery_type')
    op.drop_column('lead', 'existing_inverter_kw')
    op.drop_column('lead', 'improvement_goals')
    if bind.dialect.name == "postgresql":
        # Postgres enums cannot drop values, so rows are rescued to
        # 'residential' and the enum type is rebuilt without 'upgrade'.
        op.execute("UPDATE lead SET user_type = 'residential' WHERE user_type = 'upgrade'")
        op.execute("ALTER TABLE lead ALTER COLUMN user_type TYPE VARCHAR(11) USING user_type::text")
        op.execute("DROP TYPE usertype")
        op.execute("CREATE TYPE usertype AS ENUM ('residential', 'commercial')")
        op.execute("ALTER TABLE lead ALTER COLUMN user_type TYPE usertype USING user_type::text::usertype")
