"""odstrani izdaje brez isbn

Revision ID: d44be40b95a8
Revises: 1379afa5413b
Create Date: 2026-11-08 18:21:54.666611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd44be40b95a8'
down_revision: Union[str, Sequence[str], None] = '1379afa5413b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Iz kataloga odstrani knjige iz Open Library brez ISBN (shranjene pred tem pravilom).

    Brise samo izdaje in dela, ki jih ne uporablja noben uporabnik (knjiznica, branje).
    """
    op.execute("""
        DELETE FROM editions e
        WHERE e.isbn IS NULL
          AND e.openlibrary_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM library_books lb WHERE lb.edition_id = e.id)
          AND NOT EXISTS (SELECT 1 FROM reading_sessions rs WHERE rs.edition_id = e.id)
    """)
    op.execute("""
        DELETE FROM works w
        WHERE w.openlibrary_key IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM editions e WHERE e.work_id = w.id)
          AND NOT EXISTS (SELECT 1 FROM reading_entries re WHERE re.work_id = w.id)
    """)


def downgrade() -> None:
    """Izbrisanih podatkov ni mogoce obnoviti; knjige se ob iskanju znova shranijo."""
    pass
