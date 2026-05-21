"""add plan to users

Revision ID: 171df7514290
Revises: 0c41a2164fb3
Create Date: 2026-05-05 06:41:02.553655

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '171df7514290'
down_revision = '0c41a2164fb3'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE users SET plan = 'free' WHERE plan IS NULL")
    op.alter_column('users', 'plan',
        existing_type=sa.VARCHAR(length=20),
        server_default='free',
        nullable=False
    )

def downgrade():
    op.alter_column('users', 'plan',
        existing_type=sa.VARCHAR(length=20),
        server_default=None,
        nullable=True
    )
