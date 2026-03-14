import type { AppSettings, DocumentRecord, JobRecord, ProgressEventPayload, UploadOptions } from "@rag/shared";

declare global {
  interface Window {
    ragApi: {
      listDocuments: () => Promise<DocumentRecord[]>;
      listJobs: () => Promise<JobRecord[]>;
      pickAndUploadDocuments: (options: UploadOptions) => Promise<{ queuedDocIds: string[] }>;
      uploadFiles: (filePaths: string[], options: UploadOptions) => Promise<{ queuedDocIds: string[] }>;
      reindexDocument: (docId: string) => Promise<{ ok: true }>;
      reindexDocuments: (docIds: string[]) => Promise<{ ok: true }>;
      removeDocument: (docId: string) => Promise<{ ok: true }>;
      removeDocuments: (docIds: string[]) => Promise<{ ok: true }>;
      getCorpus: (docId: string) => Promise<string>;
      saveCorpus: (docId: string, jsonlContent: string) => Promise<{ ok: true }>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<AppSettings>;
      testDatabaseConnection: () => Promise<{ status: "ok" | "error"; message: string }>;
      getDatabaseConnectionState: () => Promise<{ ready: boolean }>;
      runHealthCheck: () => Promise<{
        postgres: { status: "ok" | "error"; message: string };
        pythonWorker: { status: "ok" | "error"; message: string };
      }>;
      exportDocumentsCsv: () => Promise<string>;
      onJobProgress: (handler: (event: ProgressEventPayload) => void) => () => void;
    };
  }
}

export {};
