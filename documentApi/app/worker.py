from __future__ import annotations

import hashlib
import os
from typing import Any

try:
    from unstructured.partition.auto import partition
except Exception:
    partition = None

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

from sentence_transformers import SentenceTransformer

_MODEL_CACHE: dict[str, SentenceTransformer] = {}
_BINARY_OFFICE_EXTENSIONS = {".pdf", ".docx", ".pptx"}


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    normalized = " ".join(text.replace("\r", "\n").split())
    if not normalized:
        return []
    chunks: list[str] = []
    cursor = 0
    step_size = max(1, chunk_size - chunk_overlap)
    while cursor < len(normalized):
        chunk = normalized[cursor: cursor + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        cursor += step_size
    return chunks


def parse_document(
    input_path: str, chunk_size: int, chunk_overlap: int
) -> dict[str, Any]:
    if not os.path.exists(input_path):
        return {"ok": False, "error": f"Datei nicht gefunden: {input_path}"}

    text = ""
    extension = os.path.splitext(input_path)[1].lower()

    if partition is not None and extension in {".pdf", ".docx", ".pptx", ".html", ".md", ".txt"}:
        try:
            elements = partition(filename=input_path)
            text = "\n".join(str(el) for el in elements if str(el).strip())
        except Exception:
            text = ""

    if not text and extension == ".pdf" and PdfReader is not None:
        try:
            reader = PdfReader(input_path)
            page_texts: list[str] = []
            for page in reader.pages:
                extracted = (page.extract_text() or "").strip()
                if extracted:
                    page_texts.append(extracted)
            text = "\n".join(page_texts)
        except Exception:
            text = ""

    if not text:
        if extension in _BINARY_OFFICE_EXTENSIONS:
            return {
                "ok": False,
                "error": (
                    "Parsing fehlgeschlagen: Kein lesbarer Text aus Datei extrahiert "
                    f"({extension}). Bitte Parser-Abhaengigkeiten installieren oder "
                    "Datei als TXT/MD bereitstellen."
                ),
            }
        try:
            with open(input_path, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
        except Exception as exc:
            return {"ok": False, "error": f"Parsing fehlgeschlagen: {exc}"}

    if text.lstrip().startswith("%PDF-"):
        return {
            "ok": False,
            "error": "Parsing fehlgeschlagen: PDF-Binaerdaten erkannt statt extrahiertem Text.",
        }

    chunks = chunk_text(text, chunk_size, chunk_overlap)
    chunk_objects: list[dict[str, Any]] = []
    for idx, chunk_value in enumerate(chunks):
        chunk_objects.append(
            {
                "chunkIndex": idx,
                "text": chunk_value,
                "metadata": {
                    "sourcePath": input_path,
                    "extension": extension,
                    "sha256": hashlib.sha256(chunk_value.encode("utf-8")).hexdigest(),
                },
            }
        )
    return {"ok": True, "chunks": chunk_objects}


def _get_model(model_name: str) -> SentenceTransformer:
    if model_name not in _MODEL_CACHE:
        _MODEL_CACHE[model_name] = SentenceTransformer(model_name)
    return _MODEL_CACHE[model_name]


def embed_texts(model_name: str, texts: list[str]) -> dict[str, Any]:
    normalized = [t.strip() for t in texts if isinstance(t, str) and t.strip()]
    if not normalized:
        return {"ok": True, "vectors": []}
    try:
        model = _get_model(model_name)
        vectors: list[list[float]] = []
        for idx, text in enumerate(normalized):
            try:
                vector = model.encode(
                    text, convert_to_numpy=True, normalize_embeddings=True
                )
            except Exception as item_err:
                preview = text[:120].replace("\n", " ")
                return {
                    "ok": False,
                    "error": f"Embedding fehlgeschlagen bei chunk {idx}: {item_err} (text_preview={preview})",
                }

            as_list = vector.tolist() if hasattr(vector, "tolist") else list(vector)
            if isinstance(as_list, list) and as_list and isinstance(as_list[0], list):
                if len(as_list) != 1:
                    return {
                        "ok": False,
                        "error": f"Embedding Rueckgabe unerwartet bei chunk {idx}: batch-groesse {len(as_list)}",
                    }
                vectors.append([float(v) for v in as_list[0]])
            else:
                vectors.append([float(v) for v in as_list])
        return {"ok": True, "vectors": vectors}
    except Exception as exc:
        sample_type = type(normalized[0]).__name__ if normalized else "none"
        return {
            "ok": False,
            "error": f"Embedding fehlgeschlagen: {exc} (texts_count={len(normalized)}, first_type={sample_type})",
        }


def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Python Worker ist bereit."}
