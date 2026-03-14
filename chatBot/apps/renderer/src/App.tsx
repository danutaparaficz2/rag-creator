import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatSettings, ContextChunk } from "@ragchat/shared";
import { useI18n } from "./i18n";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ContextChunk[];
}

const DEFAULT_SETTINGS: ChatSettings = {
  llmApiKey: "ollama",
  llmBaseUrl: "http://localhost:11434/v1",
  llmModel: "llama3.2",
  temperature: 0.3,
  maxTokens: 2048,
  topK: 5,
  systemPrompt:
    "You are a helpful assistant that answers questions based on provided documents. Always cite the source file name when possible. Be precise and thorough.",
  encryptionKey: ""
};

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [notification, setNotification] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void loadSettings();
    void checkHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function loadSettings(): Promise<void> {
    try {
      const loaded = await window.chatApi.getChatSettings();
      setSettings(loaded);
    } catch {
      // API might not be reachable yet
    }
  }

  async function checkHealth(): Promise<void> {
    try {
      await window.chatApi.healthCheck();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }

  function showNotification(type: "error" | "success", text: string): void {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }

  async function saveSettings(): Promise<void> {
    try {
      const saved = await window.chatApi.saveChatSettings(settings);
      setSettings(saved);
      showNotification("success", t("notify.settingsSaved"));
    } catch (err) {
      showNotification("error", `${t("notify.error")}: ${err}`);
    }
  }

  async function sendMessage(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: DisplayMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const history: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await window.chatApi.sendMessage(trimmed, history, locale);
      const assistantMessage: DisplayMessage = {
        role: "assistant",
        content: response.answer,
        sources: response.contextChunks
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: DisplayMessage = {
        role: "assistant",
        content: `${t("chat.error")}: ${err}`
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function clearChat(): void {
    setMessages([]);
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>{t("app.title")}</h1>
          <p>{t("app.subtitle")}</p>
        </div>

        <div className="sidebar-section">
          <h2>{t("sidebar.llmConfig")}</h2>

          <div className="setting-field">
            <label>{t("sidebar.apiKey")}</label>
            <input
              type="password"
              value={settings.llmApiKey}
              onChange={(e) => setSettings((s) => ({ ...s, llmApiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.baseUrl")}</label>
            <input
              value={settings.llmBaseUrl}
              onChange={(e) => setSettings((s) => ({ ...s, llmBaseUrl: e.target.value }))}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.model")}</label>
            <input
              value={settings.llmModel}
              onChange={(e) => setSettings((s) => ({ ...s, llmModel: e.target.value }))}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.temperature")} ({settings.temperature})</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={settings.temperature}
              onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.maxTokens")}</label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => setSettings((s) => ({ ...s, maxTokens: parseInt(e.target.value) || 2048 }))}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.topK")}</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.topK}
              onChange={(e) => setSettings((s) => ({ ...s, topK: parseInt(e.target.value) || 5 }))}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.systemPrompt")}</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="setting-field">
            <label>{t("sidebar.language")}</label>
            <div className="lang-switcher">
              <button
                className={`lang-toggle ${locale === "de" ? "active" : ""}`}
                onClick={() => setLocale("de")}
                type="button"
              >
                DE
              </button>
              <button
                className={`lang-toggle ${locale === "en" ? "active" : ""}`}
                onClick={() => setLocale("en")}
                type="button"
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar-actions">
          <button className="btn btn-primary" onClick={() => void saveSettings()}>
            {t("sidebar.saveSettings")}
          </button>
          <button className="btn btn-danger" onClick={clearChat}>
            {t("sidebar.clearChat")}
          </button>
        </div>

        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? "connected" : ""}`} />
          {isConnected ? t("status.connected") : t("status.disconnected")}
        </div>
      </aside>

      <main className="chat-area">
        {notification && (
          <div className={`notification ${notification.type}`}>{notification.text}</div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">
              <div className="icon">&#128172;</div>
              <p>{t("chat.emptyState")}</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">{msg.role === "user" ? t("chat.you") : t("chat.ai")}</div>
              <div className="message-content">
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    <details>
                      <summary>
                        {msg.sources.length} {t("chat.sourcesUsed")}
                      </summary>
                      {msg.sources.map((src, sIdx) => (
                        <div key={sIdx} className="source-item">
                          {src.fileName} | Chunk {src.chunkIndex} |{" "}
                          {(src.similarity * 100).toFixed(1)}% {t("chat.relevance")}
                        </div>
                      ))}
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">{t("chat.ai")}</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              title="Send"
            >
              &#10148;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
