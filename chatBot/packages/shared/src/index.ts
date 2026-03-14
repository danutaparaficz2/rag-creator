export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type ChatLocale = "de" | "en";

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  language?: ChatLocale;
}

export interface ChatResponse {
  answer: string;
  contextChunks: ContextChunk[];
  encryptedPayload: string;
}

export interface ContextChunk {
  text: string;
  documentId: string;
  fileName: string;
  chunkIndex: number;
  similarity: number;
}

export interface ChatSettings {
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  systemPrompt: string;
  encryptionKey: string;
}
