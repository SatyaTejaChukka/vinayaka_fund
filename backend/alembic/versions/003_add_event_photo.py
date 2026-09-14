"""Add photo references to event schedules"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '003_add_event_photo'
down_revision: Union[str, None] = '002_add_event_schedules'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('event_schedules', schema=None) as batch_op:
        batch_op.add_column(sa.Column('photo_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('photo_public_id', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('event_schedules', schema=None) as batch_op:
        batch_op.drop_column('photo_public_id')
        batch_op.drop_column('photo_url')