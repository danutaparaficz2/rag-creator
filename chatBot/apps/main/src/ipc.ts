import { ipcMain } from "electron";
import type { ChatLocale, ChatMessage, ChatSettings } from "@ragchat/shared";
import { ChatApiClient } from "./services/chatApiClient.js";

export function registerIpcHandlers(apiClient: ChatApiClient): void {
  ipcMain.handle(
    "chat:send",
    async (
      _event,
      message: string,
      history: ChatMessage[],
      language?: ChatLocale
    ) => {
      return apiClient.sendMessage(message, history, language);
    }
  );

  ipcMain.handle("chat:settings:get", () => {
    return apiClient.getChatSettings();
  });

  ipcMain.handle("chat:settings:save", async (_event, settings: ChatSettings) => {
    return apiClient.saveChatSettings(settings);
  });

  ipcMain.handle("chat:health", () => {
    return apiClient.healthCheck();
  });
}
