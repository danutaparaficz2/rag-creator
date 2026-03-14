from __future__ import annotations

from fastapi import APIRouter, Depends

from ..dependencies import get_ingest_service
from ..ingest_service import IngestService

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(svc: IngestService = Depends(get_ingest_service)):
    return await svc.run_health_check()


@router.post("/database/test-connection")
async def test_database_connection(
    svc: IngestService = Depends(get_ingest_service),
):
    return await svc.test_database_connection()


@router.get("/database/connection-state")
async def connection_state(svc: IngestService = Depends(get_ingest_service)):
    return {"ready": svc.is_database_connection_ready()}
