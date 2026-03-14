from __future__ import annotations

from .chat_service import ChatService
from .ingest_service import IngestService

_ingest_service: IngestService | None = None
_chat_service: ChatService | None = None


def set_ingest_service(svc: IngestService) -> None:
    global _ingest_service
    _ingest_service = svc


def get_ingest_service() -> IngestService:
    if _ingest_service is None:
        raise RuntimeError("IngestService not initialized")
    return _ingest_service


def set_chat_service(svc: ChatService) -> None:
    global _chat_service
    _chat_service = svc


def get_chat_service() -> ChatService:
    if _chat_service is None:
        raise RuntimeError("ChatService not initialized")
    return _chat_service
