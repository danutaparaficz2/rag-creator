const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chatApi", {
  sendMessage: (message, history, language) => ipcRenderer.invoke("chat:send", message, history, language),
  getChatSettings: () => ipcRenderer.invoke("chat:settings:get"),
  saveChatSettings: (settings) => ipcRenderer.invoke("chat:settings:save", settings),
  healthCheck: () => ipcRenderer.invoke("chat:health")
});
