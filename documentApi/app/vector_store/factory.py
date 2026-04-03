from __future__ import annotations

import logging
import sys
from pathlib import Path

from ..models import PostgresEnvironment
from .postgres_store import PostgresVectorStore
from .sqlite_embedded import SqliteEmbeddedVectorStore
from .unavailable_store import UnavailableVectorStore

_logger = logging.getLogger(__name__)


def resolve_sqlite_path(env: PostgresEnvironment, base_dir: Path) -> Path:
    raw = (env.sqlite_file_path or "").strip()
    if raw:
        p = Path(raw)
        if not p.is_absolute():
            p = base_dir / p
        return p
    return base_dir / "vector_sqlite" / f"{env.environment_id}.sqlite"


def resolve_qdrant_path(env: PostgresEnvironment, base_dir: Path) -> Path:
    raw = (env.qdrant_local_path or "").strip()
    if raw:
        p = Path(raw)
        if not p.is_absolute():
            p = base_dir / p
        return p
    return base_dir / "vector_qdrant" / env.environment_id


def create_vector_store(env: PostgresEnvironment, base_dir: Path):
    backend = env.vector_backend
    if backend == "postgres":
        return PostgresVectorStore(
            host=env.db_host,
            port=env.db_port,
            database=env.db_name,
            user=env.db_user,
            password=env.db_password,
            schema=env.db_schema,
        )
    if backend == "sqlite_embedded":
        return SqliteEmbeddedVectorStore(resolve_sqlite_path(env, base_dir))
    if backend == "qdrant_embedded":
        try:
            from .qdrant_embedded import QdrantEmbeddedVectorStore

            return QdrantEmbeddedVectorStore(resolve_qdrant_path(env, base_dir))
        except ImportError as exc:
            msg = (
                f"qdrant-client fehlt: {exc}. Installiere in der API-Umgebung: "
                f"\"{sys.executable}\" -m pip install qdrant-client"
            )
            _logger.warning("%s", msg)
            return UnavailableVectorStore(msg)
        except Exception as exc:
            msg = (
                f"Qdrant embedded konnte nicht geoeffnet werden: {exc}. "
                "Haeufig: zweiter Prozess haelt die Sperre auf dem Speicherordner "
                "(z. B. zweites Terminal, oder uvicorn --reload mit Ueberlappung). "
                "Alle documentApi-Prozesse beenden, ohne --reload starten, oder DOCUMENT_API_RELOAD nicht setzen."
            )
            _logger.warning("%s", msg)
            return UnavailableVectorStore(msg)
    raise ValueError(f"Unbekannter vectorBackend: {backend}")
