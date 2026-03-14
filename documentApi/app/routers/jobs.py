from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from ..dependencies import get_ingest_service
from ..ingest_service import IngestService
from ..models import ProgressEventPayload

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(svc: IngestService = Depends(get_ingest_service)):
    jobs = svc.list_jobs()
    return [job.model_dump(by_alias=True) for job in jobs]


@router.get("/progress")
async def job_progress_stream(svc: IngestService = Depends(get_ingest_service)):
    queue: asyncio.Queue[ProgressEventPayload] = asyncio.Queue()

    def on_progress(event: ProgressEventPayload) -> None:
        queue.put_nowait(event)

    unsubscribe = svc.subscribe_progress(on_progress)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {
                        "event": "progress",
                        "data": json.dumps(event.model_dump(by_alias=True)),
                    }
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
        finally:
            unsubscribe()

    return EventSourceResponse(event_generator())
