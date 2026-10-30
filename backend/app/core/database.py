from collections.abc import Iterator

from sqlmodel import create_engine, Session

from .config import settings

# Engine is created once at startup; reused across requests
engine = create_engine(
    settings.POSTGRES_URL,
    echo=False,  # Set to True during dev to see SQL queries
    future=True,
)


def get_session() -> Iterator[Session]:
    """Dependency that yields a SQLModel session per request."""
    with Session(engine) as session:
        yield session