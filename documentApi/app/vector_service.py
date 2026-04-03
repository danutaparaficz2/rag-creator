"""Abwaertskompatibilitaet: frueher PostgresVectorService."""

from __future__ import annotations

from .vector_store.postgres_store import PostgresVectorStore as PostgresVectorService

__all__ = ["PostgresVectorService"]
