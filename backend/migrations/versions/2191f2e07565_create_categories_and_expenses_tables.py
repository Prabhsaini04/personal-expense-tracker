"""create categories and expenses tables

Revision ID: 2191f2e07565
Revises: 
Create Date: 2026-11-23 07:53:04.631528

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2191f2e07565'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100, collation='utf8mb4_0900_ai_ci'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('expenses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=True),
    sa.Column('expense_date', sa.Date(), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_expenses_date', 'expenses', ['expense_date'])
    op.create_index('idx_expenses_category_id', 'expenses', ['category_id'])


def downgrade():
    # Drop the table first: MySQL refuses to drop an index that backs a
    # foreign key constraint, and dropping the table removes its indexes too.
    op.drop_table('expenses')
    op.drop_table('categories')
