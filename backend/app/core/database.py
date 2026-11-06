from collections.abc import Iterator

from sqlmodel import create_engine, Session

from .config import get_database_url

# Engine is created once at startup; reused across requests.
# pool_pre_ping discards dead pooled connections — required for
# Neon's serverless suspend/resume, which drops idle connections.
engine = create_engine(
    get_database_url(),
    echo=False,  # Set to True during dev to see SQL queries
    future=True,
    pool_pre_ping=True,
)


def get_session() -> Iterator[Session]:
    """Dependency that yields a SQLModel session per request."""
    with Session(engine) as session:
        yield session