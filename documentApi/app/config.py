from __future__ import annotations

import json
import os
from pathlib import Path

from .models import AppSettings, ChatSettings

_DEFAULT_SETTINGS = AppSettings()
_DEFAULT_CHAT_SETTINGS = ChatSettings()

_PROJECT_DIR = Path(__file__).resolve().parent.parent


def get_base_directory() -> Path:
    return Path.home() / "RAGIngestStudio"


def get_settings_path() -> Path:
    return _PROJECT_DIR / "settings.json"


def get_app_paths() -> dict[str, Path]:
    base = get_base_directory()
    return {
        "base": base,
        "files": base / "files",
        "corpus": base / "corpus",
        "database": base / "index.sqlite",
        "settings": get_settings_path(),
    }


def ensure_directories() -> None:
    paths = get_app_paths()
    paths["base"].mkdir(parents=True, exist_ok=True)
    paths["files"].mkdir(parents=True, exist_ok=True)
    paths["corpus"].mkdir(parents=True, exist_ok=True)


def load_settings() -> AppSettings:
    settings_path = get_app_paths()["settings"]
    try:
        raw = settings_path.read_text(encoding="utf-8")
        data = json.loads(raw)
        return AppSettings(**{**_DEFAULT_SETTINGS.model_dump(by_alias=True), **data})
    except Exception:
        save_settings(_DEFAULT_SETTINGS)
        return _DEFAULT_SETTINGS


def save_settings(settings: AppSettings) -> AppSettings:
    settings_path = get_app_paths()["settings"]
    settings_path.write_text(
        json.dumps(settings.model_dump(by_alias=True), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return settings


def get_chat_settings_path() -> Path:
    return _PROJECT_DIR / "chat_settings.json"


def load_chat_settings() -> ChatSettings:
    path = get_chat_settings_path()
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        return ChatSettings(
            **{**_DEFAULT_CHAT_SETTINGS.model_dump(by_alias=True), **data}
        )
    except Exception:
        save_chat_settings(_DEFAULT_CHAT_SETTINGS)
        return _DEFAULT_CHAT_SETTINGS


def save_chat_settings(settings: ChatSettings) -> ChatSettings:
    path = get_chat_settings_path()
    path.write_text(
        json.dumps(settings.model_dump(by_alias=True), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return settings
