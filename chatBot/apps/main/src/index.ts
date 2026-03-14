import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import { registerIpcHandlers } from "./ipc.js";
import { ChatApiClient } from "./services/chatApiClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDevelopment = process.env.NODE_ENV !== "production";

const API_BASE_URL = process.env.RAG_API_URL || "http://localhost:8000";

const PRELOAD_PATH = path.join(__dirname, "preload.cjs");
let mainWindow: BrowserWindow | null = null;

async function createMainWindow(): Promise<void> {
  const apiClient = new ChatApiClient(API_BASE_URL);
  registerIpcHandlers(apiClient);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (isDevelopment) {
    await mainWindow.loadURL("http://localhost:5174");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(path.resolve(__dirname, "../../../apps/renderer/dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
