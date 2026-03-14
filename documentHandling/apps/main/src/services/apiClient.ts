import fs from "node:fs/promises";
import path from "node:path";
import type { AppSettings, DocumentRecord, JobRecord, ProgressEventPayload, UploadOptions } from "@rag/shared";

const DEFAULT_BASE_URL = "http://localhost:8000";

export class ApiClient {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  public constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async listDocuments(): Promise<DocumentRecord[]> {
    return this.get<DocumentRecord[]>("/api/documents");
  }

  public async listJobs(): Promise<JobRecord[]> {
    return this.get<JobRecord[]>("/api/jobs");
  }

  public async uploadFiles(filePaths: string[], options: UploadOptions): Promise<{ queuedDocIds: string[] }> {
    const formData = new FormData();

    for (const filePath of filePaths) {
      const buffer = await fs.readFile(filePath);
      const blob = new Blob([buffer]);
      const fileName = path.basename(filePath);
      formData.append("files", blob, fileName);
    }

    formData.append("tags", options.tags.join(","));
    formData.append("source", options.source || "lokal");

    const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upload fehlgeschlagen: ${response.status} ${body}`);
    }
    return response.json() as Promise<{ queuedDocIds: string[] }>;
  }

  public async removeDocument(docId: string): Promise<{ ok: true }> {
    await this.delete(`/api/documents/${encodeURIComponent(docId)}`);
    return { ok: true };
  }

  public async removeDocuments(docIds: string[]): Promise<{ ok: true }> {
    await this.post("/api/documents/remove-bulk", { docIds });
    return { ok: true };
  }

  public async reindexDocument(docId: string): Promise<{ ok: true }> {
    await this.post(`/api/documents/${encodeURIComponent(docId)}/reindex`);
    return { ok: true };
  }

  public async reindexDocuments(docIds: string[]): Promise<{ ok: true }> {
    await this.post("/api/documents/reindex-bulk", { docIds });
    return { ok: true };
  }

  public async getCorpus(docId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/corpus/${encodeURIComponent(docId)}`);
    if (!response.ok) {
      throw new Error(`Corpus laden fehlgeschlagen: ${response.status}`);
    }
    return response.text();
  }

  public async saveCorpus(docId: string, jsonlContent: string): Promise<{ ok: true }> {
    await this.put(`/api/corpus/${encodeURIComponent(docId)}`, { content: jsonlContent });
    return { ok: true };
  }

  public async getSettings(): Promise<AppSettings> {
    return this.get<AppSettings>("/api/settings");
  }

  public async saveSettings(settings: AppSettings): Promise<AppSettings> {
    return this.put<AppSettings>("/api/settings", settings);
  }

  public async testDatabaseConnection(): Promise<{ status: "ok" | "error"; message: string }> {
    return this.post<{ status: "ok" | "error"; message: string }>("/api/database/test-connection");
  }

  public async getDatabaseConnectionState(): Promise<{ ready: boolean }> {
    return this.get<{ ready: boolean }>("/api/database/connection-state");
  }

  public async runHealthCheck(): Promise<{
    postgres: { status: "ok" | "error"; message: string };
    pythonWorker: { status: "ok" | "error"; message: string };
  }> {
    return this.get("/api/health");
  }

  public async exportDocumentsCsv(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/documents/export/csv`);
    if (!response.ok) {
      throw new Error(`CSV Export fehlgeschlagen: ${response.status}`);
    }
    return response.text();
  }

  public subscribeProgress(handler: (event: ProgressEventPayload) => void): () => void {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const connect = () => {
      fetch(`${this.baseUrl}/api/jobs/progress`, { signal, headers: { Accept: "text/event-stream" } })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            return;
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            let currentEventType = "";
            for (const line of lines) {
              if (line.startsWith("event:")) {
                currentEventType = line.slice(6).trim();
              } else if (line.startsWith("data:") && currentEventType === "progress") {
                const data = line.slice(5).trim();
                if (data) {
                  try {
                    handler(JSON.parse(data) as ProgressEventPayload);
                  } catch {
                    // skip malformed events
                  }
                }
                currentEventType = "";
              }
            }
          }

          if (!signal.aborted) {
            setTimeout(connect, 2000);
          }
        })
        .catch(() => {
          if (!signal.aborted) {
            setTimeout(connect, 2000);
          }
        });
    };

    connect();

    return () => {
      this.abortController?.abort();
      this.abortController = null;
    };
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`GET ${path} fehlgeschlagen: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST ${path} fehlgeschlagen: ${response.status} ${text}`);
    }
    return response.json() as Promise<T>;
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PUT ${path} fehlgeschlagen: ${response.status} ${text}`);
    }
    return response.json() as Promise<T>;
  }

  private async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, { method: "DELETE" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DELETE ${path} fehlgeschlagen: ${response.status} ${text}`);
    }
  }
}
