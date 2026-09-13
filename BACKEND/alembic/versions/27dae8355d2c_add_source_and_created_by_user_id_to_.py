"""add source and created_by_user_id to problems

Revision ID: 27dae8355d2
Revises: 2319010fcad6
Create Date: 2026-09-13 09:45:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "27dae8355d2c"
down_revision = "2319010fcad6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "problems",
        sa.Column(
            "source",
            sa.String(length=20),
            nullable=False,
            server_default="curated",
        ),
    )

    op.add_column(
        "problems",
        sa.Column(
            "created_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_problems_created_by_user_id",
        source_table="problems",
        referent_table="users",
        local_cols=["created_by_user_id"],
        remote_cols=["id"],
        ondelete="CASCADE",
    )

    op.create_index(
        "ix_problems_source",
        "problems",
        ["source"],
    )

    op.create_index(
        "ix_problems_created_by_user_id",
        "problems",
        ["created_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_problems_created_by_user_id", table_name="problems")
    op.drop_index("ix_problems_source", table_name="problems")
    op.drop_constraint("fk_problems_created_by_user_id", "problems", type_="foreignkey")
    op.drop_column("problems", "created_by_user_id")
    op.drop_column("problems", "source")