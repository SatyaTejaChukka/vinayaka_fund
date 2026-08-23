"""Initial schema with users, funds, donations, expenses, audit_logs

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-23 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='ADMIN'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1' if op.get_bind().dialect.name == 'sqlite' else 'true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. funds table
    op.create_table(
        'funds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_amount', sa.Float(), nullable=False, server_default='100000.0'),
        sa.Column('upi_id', sa.String(), nullable=False, server_default='vinayaka@upi'),
        sa.Column('upi_name', sa.String(), nullable=False, server_default='Vinayaka Chavithi Committee'),
        sa.Column('public_slug', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1' if op.get_bind().dialect.name == 'sqlite' else 'true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_funds_id'), 'funds', ['id'], unique=False)
    op.create_index(op.f('ix_funds_admin_id'), 'funds', ['admin_id'], unique=False)
    op.create_index(op.f('ix_funds_public_slug'), 'funds', ['public_slug'], unique=True)

    # 3. donations table
    op.create_table(
        'donations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fund_id', sa.Integer(), nullable=False),
        sa.Column('donor_name', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('donation_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(), nullable=False, server_default='UPI'),
        sa.Column('upi_transaction_id', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.Column('show_donor_name', sa.Boolean(), nullable=False, server_default=sa.text('1' if op.get_bind().dialect.name == 'sqlite' else 'true')),
        sa.Column('student_year', sa.String(), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('void_reason', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['fund_id'], ['funds.id'], ),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_donations_id'), 'donations', ['id'], unique=False)
    op.create_index(op.f('ix_donations_fund_id'), 'donations', ['fund_id'], unique=False)
    op.create_index(op.f('ix_donations_status'), 'donations', ['status'], unique=False)
    op.create_index(op.f('ix_donations_upi_transaction_id'), 'donations', ['upi_transaction_id'], unique=False)

    # 4. expenses table
    op.create_table(
        'expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fund_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('purpose', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('handled_by', sa.String(), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='SPENT'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('voided_at', sa.DateTime(), nullable=True),
        sa.Column('voided_by', sa.Integer(), nullable=True),
        sa.Column('void_reason', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['fund_id'], ['funds.id'], ),
        sa.ForeignKeyConstraint(['voided_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_fund_id'), 'expenses', ['fund_id'], unique=False)
    op.create_index(op.f('ix_expenses_status'), 'expenses', ['status'], unique=False)

    # 5. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('old_data', sa.JSON(), nullable=True),
        sa.Column('new_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('expenses')
    op.drop_table('donations')
    op.drop_table('funds')
    op.drop_table('users')
