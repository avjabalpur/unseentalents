"""add moderator role

Revision ID: d4a96917e1f4
Revises: 4ea3c4edb0b3
Create Date: 2026-08-11 00:08:08.717148

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'd4a96917e1f4'
down_revision = '4ea3c4edb0b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres enum value additions can't run inside the same transaction that uses
    # the new value, but adding it alone in its own migration transaction is fine.
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'MODERATOR'")


def downgrade() -> None:
    # Postgres has no direct "remove enum value" operation; downgrading would require
    # rebuilding the type and every column/constraint that references it. Left as a
    # no-op — reverting this migration on a DB that has MODERATOR users is unsafe anyway.
    pass
