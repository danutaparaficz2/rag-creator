from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_chat_service
from ..chat_service import ChatService
from ..models import ChatRequest, ChatResponse, ChatSettings

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    svc: ChatService = Depends(get_chat_service),
):
    try:
        response = await svc.chat(request)
        return response.model_dump(by_alias=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/settings")
async def get_chat_settings(
    svc: ChatService = Depends(get_chat_service),
):
    return svc.get_chat_settings().model_dump(by_alias=True)


@router.put("/settings")
async def save_chat_settings(
    settings: ChatSettings,
    svc: ChatService = Depends(get_chat_service),
):
    svc.update_chat_settings(settings)
    return svc.get_chat_settings().model_dump(by_alias=True)
