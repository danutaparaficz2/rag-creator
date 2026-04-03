from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class VectorStore(Protocol):
    """Gemeinsames Interface für pgvector, SQLite embedded und Qdrant embedded."""

    def health_check(self) -> dict: ...

    def ensure_schema(self, table_name: str) -> None: ...

    def remove_document(self, table_name: str, doc_id: str) -> None: ...

    def upsert_document_chunks(
        self,
        table_name: str,
        doc_id: str,
        vectors: list[list[float]],
        payloads: list[dict],
    ) -> None: ...

    def similarity_search(
        self,
        table_name: str,
        query_vector: list[float],
        top_k: int = 5,
    ) -> list[dict]: ...
