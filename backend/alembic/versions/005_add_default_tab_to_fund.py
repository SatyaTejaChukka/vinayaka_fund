"""Add default_tab to funds table

Revision ID: 005_add_default_tab_to_fund
Revises: 004_add_event_registration_url
Create Date: 2026-09-17 08:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '005_add_default_tab_to_fund'
down_revision: Union[str, None] = '004_add_event_registration_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('funds')]

    with op.batch_alter_table('funds', schema=None) as batch_op:
        if 'default_tab' not in existing_columns:
            batch_op.add_column(sa.Column('default_tab', sa.String(length=20), nullable=False, server_default='donations'))


def downgrade() -> None:
    with op.batch_alter_table('funds', schema=None) as batch_op:
        batch_op.drop_column('default_tab')
