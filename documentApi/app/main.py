from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .chat_service import ChatService
from .config import ensure_directories, get_app_paths, load_settings
from .crypto_service import CryptoService
from .database import IndexDatabase
from .dependencies import set_chat_service, set_ingest_service
from .file_store import FileStore
from .ingest_service import IngestService
from .routers import chat, corpus, documents, health, jobs, settings
from .vector_service import PostgresVectorService


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_directories()
    paths = get_app_paths()
    app_settings = load_settings()

    db = IndexDatabase(paths["database"])
    fs = FileStore(paths["files"], paths["corpus"])
    vs = PostgresVectorService(
        host=app_settings.db_host,
        port=app_settings.db_port,
        database=app_settings.db_name,
        user=app_settings.db_user,
        password=app_settings.db_password,
    )

    svc = IngestService(db, fs, vs)
    await svc.initialize()
    set_ingest_service(svc)

    crypto = CryptoService()
    chat_svc = ChatService(vs, crypto)
    chat_svc.update_settings(app_settings)
    set_chat_service(chat_svc)

    yield


app = FastAPI(
    title="RAG Ingest API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(corpus.router)
app.include_router(settings.router)
app.include_router(health.router)
app.include_router(jobs.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"name": "RAG Ingest API", "version": "1.0.0"}
