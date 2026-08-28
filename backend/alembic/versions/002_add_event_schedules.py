"""Add event_schedules table and banner columns on funds

Revision ID: 002_add_event_schedules
Revises: 001_initial_schema
Create Date: 2026-08-28 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_event_schedules'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'

    # Add schedule and banner columns to funds table
    with op.batch_alter_table('funds', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('is_schedule_published', sa.Boolean(), nullable=False, server_default=sa.text('0' if is_sqlite else 'false'))
        )
        batch_op.add_column(
            sa.Column('is_banner_active', sa.Boolean(), nullable=False, server_default=sa.text('0' if is_sqlite else 'false'))
        )
        batch_op.add_column(
            sa.Column('banner_headline', sa.String(), nullable=True, server_default='✨ Festival Schedule & Competitions Announced!')
        )
        batch_op.add_column(
            sa.Column('banner_message', sa.String(), nullable=True, server_default='🪔 Maha Ganapati Pooja at 9:00 AM | 🎨 Inter-Batch Rangoli Competition at 2:00 PM')
        )

    # Create event_schedules table
    op.create_table(
        'event_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fund_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False, server_default='POOJA'),
        sa.Column('event_date', sa.String(), nullable=False),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=True),
        sa.Column('venue', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_highlighted', sa.Boolean(), nullable=False, server_default=sa.text('0' if is_sqlite else 'false')),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['fund_id'], ['funds.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_schedules_id'), 'event_schedules', ['id'], unique=False)
    op.create_index(op.f('ix_event_schedules_fund_id'), 'event_schedules', ['fund_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_event_schedules_fund_id'), table_name='event_schedules')
    op.drop_index(op.f('ix_event_schedules_id'), table_name='event_schedules')
    op.drop_table('event_schedules')

    with op.batch_alter_table('funds', schema=None) as batch_op:
        batch_op.drop_column('banner_message')
        batch_op.drop_column('banner_headline')
        batch_op.drop_column('is_banner_active')
        batch_op.drop_column('is_schedule_published')
