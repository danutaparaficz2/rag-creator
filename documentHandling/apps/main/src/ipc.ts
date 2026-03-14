import { BrowserWindow, dialog, ipcMain } from "electron";
import type { AppSettings, UploadOptions } from "@rag/shared";
import { ApiClient } from "./services/apiClient.js";

export function registerIpcHandlers(mainWindow: BrowserWindow, apiClient: ApiClient): void {
  ipcMain.handle("documents:list", () => apiClient.listDocuments());
  ipcMain.handle("jobs:list", () => apiClient.listJobs());

  ipcMain.handle("documents:pick-and-upload", async (_event, options: UploadOptions) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      title: "Dokumente auswaehlen"
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { queuedDocIds: [] };
    }
    return apiClient.uploadFiles(result.filePaths, options);
  });

  ipcMain.handle("documents:upload-files", async (_event, filePaths: string[], options: UploadOptions) => {
    return apiClient.uploadFiles(filePaths, options);
  });

  ipcMain.handle("documents:reindex", async (_event, docId: string) => {
    return apiClient.reindexDocument(docId);
  });

  ipcMain.handle("documents:reindex-bulk", async (_event, docIds: string[]) => {
    return apiClient.reindexDocuments(docIds);
  });

  ipcMain.handle("documents:remove", async (_event, docId: string) => {
    return apiClient.removeDocument(docId);
  });

  ipcMain.handle("documents:remove-bulk", async (_event, docIds: string[]) => {
    return apiClient.removeDocuments(docIds);
  });

  ipcMain.handle("corpus:get", async (_event, docId: string) => apiClient.getCorpus(docId));
  ipcMain.handle("corpus:save", async (_event, docId: string, jsonlContent: string) => {
    return apiClient.saveCorpus(docId, jsonlContent);
  });

  ipcMain.handle("settings:get", () => apiClient.getSettings());
  ipcMain.handle("settings:save", async (_event, settings: AppSettings) => apiClient.saveSettings(settings));
  ipcMain.handle("database:test-connection", () => apiClient.testDatabaseConnection());
  ipcMain.handle("database:connection-state", () => apiClient.getDatabaseConnectionState());
  ipcMain.handle("health:check", () => apiClient.runHealthCheck());
  ipcMain.handle("documents:export-csv", () => apiClient.exportDocumentsCsv());

  apiClient.subscribeProgress((event) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send("jobs:progress", event);
    }
  });
}
