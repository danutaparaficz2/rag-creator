from __future__ import annotations

import json
import re

import psycopg2
import psycopg2.pool

from .file_store import create_sha256


class PostgresVectorService:
    def __init__(
        self,
        host: str = "localhost",
        port: int = 5432,
        database: str = "rag",
        user: str = "postgres",
        password: str = "",
    ) -> None:
        self._config = {
            "host": host,
            "port": port,
            "dbname": database,
            "user": user,
            "password": password,
        }
        self._pool: psycopg2.pool.SimpleConnectionPool | None = None
        self._try_create_pool()

    def _try_create_pool(self) -> None:
        try:
            self._pool = psycopg2.pool.SimpleConnectionPool(1, 10, **self._config)
        except Exception:
            self._pool = None

    def update_connection_config(
        self,
        host: str,
        port: int,
        database: str,
        user: str,
        password: str,
    ) -> None:
        if self._pool:
            try:
                self._pool.closeall()
            except Exception:
                pass
        self._config = {
            "host": host,
            "port": port,
            "dbname": database,
            "user": user,
            "password": password,
        }
        self._try_create_pool()

    @staticmethod
    def _safe_table_name(name: str) -> str:
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name):
            raise ValueError(f"Ungueltiger Tabellenname: {name}")
        return f'"{name}"'

    def health_check(self) -> dict:
        try:
            conn = self._get_conn()
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                return {"status": "ok", "message": "Postgres erreichbar."}
            finally:
                self._put_conn(conn)
        except Exception as exc:
            return {"status": "error", "message": f"Postgres Fehler: {exc}"}

    def ensure_schema(self, table_name: str) -> None:
        safe = self._safe_table_name(table_name)
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cur.execute(
                    f"""CREATE TABLE IF NOT EXISTS {safe} (
                        point_id text PRIMARY KEY,
                        document_id text NOT NULL,
                        chunk_index integer NOT NULL,
                        embedding vector NOT NULL,
                        source_path text NOT NULL,
                        source_modified_unix_seconds bigint NOT NULL,
                        text_content text NOT NULL,
                        tags jsonb NOT NULL,
                        source text NOT NULL,
                        file_name text NOT NULL
                    )"""
                )
                cur.execute(
                    f'CREATE INDEX IF NOT EXISTS {table_name}_document_id_idx ON {safe} (document_id)'
                )
            conn.commit()
        finally:
            self._put_conn(conn)

    def remove_document(self, table_name: str, doc_id: str) -> None:
        safe = self._safe_table_name(table_name)
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {safe} WHERE document_id = %s", (doc_id,))
            conn.commit()
        finally:
            self._put_conn(conn)

    def upsert_document_chunks(
        self,
        table_name: str,
        doc_id: str,
        vectors: list[list[float]],
        payloads: list[dict],
    ) -> None:
        if len(vectors) != len(payloads):
            raise ValueError("Anzahl von Vektoren und Payloads muss identisch sein.")

        safe = self._safe_table_name(table_name)
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                for idx, (vector, payload) in enumerate(zip(vectors, payloads)):
                    point_id = create_sha256(f"{doc_id}:{idx}")
                    vector_literal = f"[{','.join(str(v) for v in vector)}]"
                    cur.execute(
                        f"""INSERT INTO {safe} (
                            point_id, document_id, chunk_index, embedding,
                            source_path, source_modified_unix_seconds,
                            text_content, tags, source, file_name
                        ) VALUES (
                            %s, %s, %s, %s::vector, %s, %s, %s, %s::jsonb, %s, %s
                        )
                        ON CONFLICT (point_id) DO UPDATE SET
                            document_id = EXCLUDED.document_id,
                            chunk_index = EXCLUDED.chunk_index,
                            embedding = EXCLUDED.embedding,
                            source_path = EXCLUDED.source_path,
                            source_modified_unix_seconds = EXCLUDED.source_modified_unix_seconds,
                            text_content = EXCLUDED.text_content,
                            tags = EXCLUDED.tags,
                            source = EXCLUDED.source,
                            file_name = EXCLUDED.file_name""",
                        (
                            point_id,
                            payload["documentId"],
                            payload["chunkIndex"],
                            vector_literal,
                            payload["sourcePath"],
                            payload["sourceModifiedUnixSeconds"],
                            payload["text"],
                            json.dumps(payload["tags"]),
                            payload["source"],
                            payload["fileName"],
                        ),
                    )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._put_conn(conn)

    def similarity_search(
        self,
        table_name: str,
        query_vector: list[float],
        top_k: int = 5,
    ) -> list[dict]:
        safe = self._safe_table_name(table_name)
        vector_literal = f"[{','.join(str(v) for v in query_vector)}]"
        conn = self._get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT text_content, document_id, file_name, chunk_index,
                               1 - (embedding <=> %s::vector) AS similarity
                        FROM {safe}
                        ORDER BY embedding <=> %s::vector
                        LIMIT %s""",
                    (vector_literal, vector_literal, top_k),
                )
                rows = cur.fetchall()
            return [
                {
                    "text": row[0],
                    "documentId": row[1],
                    "fileName": row[2],
                    "chunkIndex": row[3],
                    "similarity": float(row[4]),
                }
                for row in rows
            ]
        finally:
            self._put_conn(conn)

    def _get_conn(self):
        if not self._pool:
            self._try_create_pool()
        if not self._pool:
            raise ConnectionError("Keine Postgres-Verbindung verfuegbar.")
        return self._pool.getconn()

    def _put_conn(self, conn) -> None:
        if self._pool:
            self._pool.putconn(conn)
