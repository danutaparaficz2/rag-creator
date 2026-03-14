import type { ChatLocale, ChatMessage, ChatResponse, ChatSettings } from "@ragchat/shared";

declare global {
  interface Window {
    chatApi: {
      sendMessage: (message: string, history: ChatMessage[], language?: ChatLocale) => Promise<ChatResponse>;
      getChatSettings: () => Promise<ChatSettings>;
      saveChatSettings: (settings: ChatSettings) => Promise<ChatSettings>;
      healthCheck: () => Promise<{ status: string; message: string }>;
    };
  }
}

export {};
