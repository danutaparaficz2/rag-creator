import type { ChatLocale, ChatMessage, ChatResponse, ChatSettings } from "@ragchat/shared";

const DEFAULT_BASE_URL = "http://localhost:8000";

export class ChatApiClient {
  private baseUrl: string;

  public constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async sendMessage(
    message: string,
    history: ChatMessage[],
    language?: ChatLocale
  ): Promise<ChatResponse> {
    return this.post<ChatResponse>("/api/chat", { message, history, language });
  }

  public async getChatSettings(): Promise<ChatSettings> {
    return this.get<ChatSettings>("/api/chat/settings");
  }

  public async saveChatSettings(settings: ChatSettings): Promise<ChatSettings> {
    return this.put<ChatSettings>("/api/chat/settings", settings);
  }

  public async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get("/api/health");
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
}
