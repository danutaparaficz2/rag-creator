from __future__ import annotations

from fastapi import APIRouter, Depends

from ..dependencies import get_ingest_service
from ..ingest_service import IngestService
from ..models import AppSettings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(svc: IngestService = Depends(get_ingest_service)):
    return svc.get_settings().model_dump(by_alias=True)


@router.put("")
async def save_settings(
    settings: AppSettings,
    svc: IngestService = Depends(get_ingest_service),
):
    saved = await svc.save_settings(settings)
    return saved.model_dump(by_alias=True)
