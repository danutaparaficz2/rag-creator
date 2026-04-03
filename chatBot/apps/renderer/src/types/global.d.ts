import type { ChatLocale, ChatMessage, ChatResponse, ChatSettings } from "@ragchat/shared";

interface PostgresEnvironment {
  id: string;
  name: string;
  vectorBackend?: "postgres" | "sqlite_embedded" | "qdrant_embedded";
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbSchema: string;
  dbTableName: string;
  sqliteFilePath?: string;
  qdrantLocalPath?: string;
}

interface AppSettings {
  activePostgresEnvironmentId: string;
  postgresEnvironments: PostgresEnvironment[];
}

declare global {
  interface Window {
    chatApi: {
      sendMessage: (message: string, history: ChatMessage[], language?: ChatLocale) => Promise<ChatResponse>;
      getChatSettings: () => Promise<ChatSettings>;
      saveChatSettings: (settings: ChatSettings) => Promise<ChatSettings>;
      healthCheck: () => Promise<{ status: string; message: string }>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<AppSettings>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};
