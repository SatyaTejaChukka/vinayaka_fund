"""Add optional registration links to event schedules"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '004_add_event_registration_url'
down_revision: Union[str, None] = '003_add_event_photo'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('event_schedules', schema=None) as batch_op:
        batch_op.add_column(sa.Column('registration_url', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('event_schedules', schema=None) as batch_op:
        batch_op.drop_column('registration_url')