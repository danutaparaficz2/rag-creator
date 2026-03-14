from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse

from ..dependencies import get_ingest_service
from ..ingest_service import IngestService

router = APIRouter(prefix="/api/corpus", tags=["corpus"])


@router.get("/{doc_id}")
async def get_corpus(
    doc_id: str,
    svc: IngestService = Depends(get_ingest_service),
):
    try:
        content = await svc.get_corpus(doc_id)
        return PlainTextResponse(content=content)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/{doc_id}")
async def save_corpus(
    doc_id: str,
    body: dict,
    svc: IngestService = Depends(get_ingest_service),
):
    jsonl_content = body.get("content", "")
    try:
        await svc.save_corpus(doc_id, jsonl_content)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"ok": True}
