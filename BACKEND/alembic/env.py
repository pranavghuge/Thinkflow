from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 1. Import your app settings, Base, and models so Alembic can see them
from app.config import settings
from app.database import Base
from app.models import *  # Imports all your models (User, ApiKey, Problem, etc.)
import sys
from pathlib import Path

# Add the parent directory (backend root) to sys.path so Python can find 'app'
current_dir = Path(__file__).resolve().parent
backend_root = current_dir.parent
sys.path.insert(0, str(backend_root))

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Now these imports will resolve correctly!
from app.config import settings
from app.database import Base
from app.models import *
# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 2. Dynamically inject your application's database URL into Alembic's config
# Escape '%' characters in the database URL (handling URL-encoded passwords)
db_url = settings.database_url.replace("%", "%%")
config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Point target_metadata to your SQLAlchemy models' metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
