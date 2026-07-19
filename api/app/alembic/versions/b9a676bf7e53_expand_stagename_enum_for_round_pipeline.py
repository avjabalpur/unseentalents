"""expand stagename enum for round pipeline

Revision ID: b9a676bf7e53
Revises: b210a8f2718b
Create Date: 2026-07-19 12:47:49.681099

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'b9a676bf7e53'
down_revision = 'b210a8f2718b'
branch_labels = None
depends_on = None


_OLD_VALUES = ("SUBMISSION", "MAIN", "TOP_50", "TOP_10", "TOP_5", "WINNER")
_NEW_VALUES = (
    "BACKSTAGE",
    "MAINSTAGE",
    "TOP_60",
    "TOP_50",
    "TOP_40",
    "TOP_30",
    "TOP_15",
    "TOP_5",
    "WINNER",
)


def upgrade() -> None:
    op.execute("ALTER TABLE stages ALTER COLUMN name TYPE varchar USING name::text")
    op.execute("DROP TYPE stagename")
    sa.Enum(*_NEW_VALUES, name="stagename").create(op.get_bind())
    op.execute("ALTER TABLE stages ALTER COLUMN name TYPE stagename USING name::stagename")


def downgrade() -> None:
    op.execute("ALTER TABLE stages ALTER COLUMN name TYPE varchar USING name::text")
    op.execute("DROP TYPE stagename")
    sa.Enum(*_OLD_VALUES, name="stagename").create(op.get_bind())
    op.execute("ALTER TABLE stages ALTER COLUMN name TYPE stagename USING name::stagename")
