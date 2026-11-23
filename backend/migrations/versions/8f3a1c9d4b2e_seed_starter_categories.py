"""seed starter categories

Revision ID: 8f3a1c9d4b2e
Revises: 2191f2e07565
Create Date: 2026-11-23 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '8f3a1c9d4b2e'
down_revision = '2191f2e07565'
branch_labels = None
depends_on = None

STARTER_CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Entertainment",
    "Health",
    "Other",
]


def upgrade():
    conn = op.get_bind()
    for name in STARTER_CATEGORIES:
        exists = conn.execute(
            sa.text("SELECT 1 FROM categories WHERE LOWER(name) = LOWER(:name)"),
            {"name": name},
        ).first()
        if not exists:
            conn.execute(
                sa.text(
                    "INSERT INTO categories (name, created_at) VALUES (:name, NOW())"
                ),
                {"name": name},
            )


def downgrade():
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM categories WHERE name IN :names").bindparams(
            sa.bindparam("names", expanding=True)
        ),
        {"names": STARTER_CATEGORIES},
    )
