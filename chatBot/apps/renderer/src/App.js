import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n";
const DEFAULT_SETTINGS = {
    llmApiKey: "ollama",
    llmBaseUrl: "http://localhost:11434/v1",
    llmModel: "llama3.2",
    temperature: 0.3,
    maxTokens: 2048,
    topK: 5,
    systemPrompt: "You are a helpful assistant that answers questions based on provided documents. Always cite the source file name when possible. Be precise and thorough.",
    encryptionKey: ""
};
export default function App() {
    const { t, locale, setLocale } = useI18n();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [notification, setNotification] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [appSettings, setAppSettings] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    useEffect(() => {
        void loadSettings();
        void checkHealth();
    }, []);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);
    async function loadSettings() {
        try {
            const loaded = await window.chatApi.getChatSettings();
            setSettings(loaded);
            const app = await window.chatApi.getSettings();
            setAppSettings(app);
        }
        catch {
            // API might not be reachable yet
        }
    }
    async function changeEnvironment(nextId) {
        if (!appSettings)
            return;
        try {
            const saved = await window.chatApi.saveSettings({
                ...appSettings,
                activePostgresEnvironmentId: nextId
            });
            setAppSettings(saved);
            showNotification("success", `Environment aktiv: ${nextId}`);
        }
        catch (err) {
            showNotification("error", `${t("notify.error")}: ${err}`);
        }
    }
    function normalizeHttpUrl(raw) {
        let u = raw.trim();
        if (!u)
            return null;
        // Kaputte Extraktion: "ahttps://..." (z. B. Rest von <a href=...)
        if (/^ahttps?:\/\//i.test(u)) {
            u = u.slice(1);
        }
        if (/^https?:\/\//i.test(u))
            return u;
        if (u.startsWith("www."))
            return `https://${u}`;
        return null;
    }
    /** URLs aus MD/HTML: <a href="...">, href="...", [text](url), source: ... */
    function extractUrlFromChunkText(text) {
        const t = text || "";
        const patterns = [
            /<a\s[^>]*\bhref\s*=\s*["']([^"']+)["']/gi,
            /\bhref\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            /\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g,
            /(?:^|\n)\s*(?:source|url)\s*:\s*(?:<a[^>]*\bhref\s*=\s*["'])?(https?:\/\/[^\s"'<>\]]+)/i,
            /(?:^|\n)\s*(?:source|url)\s*:\s*(https?:\/\/[^\s)\]]+)/i,
            /(?:^|\n)\s*(?:source|url)\s*:\s*(www\.[^\s)\]"'<>\]]+)/i
        ];
        for (const re of patterns) {
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(t)) !== null) {
                const g = m[1] ?? m[0];
                const n = normalizeHttpUrl(g);
                if (n)
                    return n;
            }
        }
        const bare = t.match(/https?:\/\/[^\s)\]"'<>\]]+/i);
        if (bare?.[0]) {
            const n = normalizeHttpUrl(bare[0]);
            if (n)
                return n;
        }
        return null;
    }
    function sourceToUrl(src) {
        const fromFields = [src.sourcePath || "", src.source || "", src.fileName || ""];
        for (const raw of fromFields) {
            const candidate = raw.trim();
            if (!candidate)
                continue;
            const fromHtml = extractUrlFromChunkText(candidate);
            if (fromHtml)
                return fromHtml;
            const n = normalizeHttpUrl(candidate);
            if (n)
                return n;
        }
        return extractUrlFromChunkText(src.text || "");
    }
    async function checkHealth() {
        try {
            await window.chatApi.healthCheck();
            setIsConnected(true);
        }
        catch {
            setIsConnected(false);
        }
    }
    function showNotification(type, text) {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    }
    async function saveSettings() {
        try {
            const saved = await window.chatApi.saveChatSettings(settings);
            setSettings(saved);
            showNotification("success", t("notify.settingsSaved"));
        }
        catch (err) {
            showNotification("error", `${t("notify.error")}: ${err}`);
        }
    }
    async function sendMessage() {
        const trimmed = input.trim();
        if (!trimmed || isLoading)
            return;
        const userMessage = { role: "user", content: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        const history = messages.map((m) => ({
            role: m.role,
            content: m.content
        }));
        try {
            const response = await window.chatApi.sendMessage(trimmed, history, locale);
            const assistantMessage = {
                role: "assistant",
                content: response.answer,
                sources: response.contextChunks
            };
            setMessages((prev) => [...prev, assistantMessage]);
        }
        catch (err) {
            const errorMessage = {
                role: "assistant",
                content: `${t("chat.error")}: ${err}`
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    }
    function handleTextareaInput(e) {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
    function clearChat() {
        setMessages([]);
    }
    return (_jsxs("div", { className: "app-layout", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "sidebar-header", children: [_jsx("h1", { children: t("app.title") }), _jsx("p", { children: t("app.subtitle") })] }), _jsxs("div", { className: "sidebar-section", children: [_jsx("h2", { children: t("sidebar.llmConfig") }), appSettings && appSettings.postgresEnvironments.length > 0 && (_jsxs("div", { className: "setting-field", children: [_jsx("label", { children: "Environment" }), _jsx("select", { value: appSettings.activePostgresEnvironmentId, onChange: (e) => void changeEnvironment(e.target.value), children: appSettings.postgresEnvironments.map((env) => (_jsx("option", { value: env.id, children: env.name }, env.id))) })] })), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.apiKey") }), _jsx("input", { type: "password", value: settings.llmApiKey, onChange: (e) => setSettings((s) => ({ ...s, llmApiKey: e.target.value })), placeholder: "sk-..." })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.baseUrl") }), _jsx("input", { value: settings.llmBaseUrl, onChange: (e) => setSettings((s) => ({ ...s, llmBaseUrl: e.target.value })) })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.model") }), _jsx("input", { value: settings.llmModel, onChange: (e) => setSettings((s) => ({ ...s, llmModel: e.target.value })) })] }), _jsxs("div", { className: "setting-field", children: [_jsxs("label", { children: [t("sidebar.temperature"), " (", settings.temperature, ")"] }), _jsx("input", { type: "number", step: "0.1", min: "0", max: "2", value: settings.temperature, onChange: (e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) || 0 })) })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.maxTokens") }), _jsx("input", { type: "number", value: settings.maxTokens, onChange: (e) => setSettings((s) => ({ ...s, maxTokens: parseInt(e.target.value) || 2048 })) })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.topK") }), _jsx("input", { type: "number", min: "1", max: "20", value: settings.topK, onChange: (e) => setSettings((s) => ({ ...s, topK: parseInt(e.target.value) || 5 })) })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.systemPrompt") }), _jsx("textarea", { value: settings.systemPrompt, onChange: (e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value })), rows: 3 })] }), _jsxs("div", { className: "setting-field", children: [_jsx("label", { children: t("sidebar.language") }), _jsxs("div", { className: "lang-switcher", children: [_jsx("button", { className: `lang-toggle ${locale === "de" ? "active" : ""}`, onClick: () => setLocale("de"), type: "button", children: "DE" }), _jsx("button", { className: `lang-toggle ${locale === "en" ? "active" : ""}`, onClick: () => setLocale("en"), type: "button", children: "EN" })] })] })] }), _jsxs("div", { className: "sidebar-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: () => void saveSettings(), children: t("sidebar.saveSettings") }), _jsx("button", { className: "btn btn-danger", onClick: clearChat, children: t("sidebar.clearChat") })] }), _jsxs("div", { className: "status-indicator", children: [_jsx("span", { className: `status-dot ${isConnected ? "connected" : ""}` }), isConnected ? t("status.connected") : t("status.disconnected")] })] }), _jsxs("main", { className: "chat-area", children: [notification && (_jsx("div", { className: `notification ${notification.type}`, children: notification.text })), _jsxs("div", { className: "chat-messages", children: [messages.length === 0 && !isLoading && (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "icon", children: "\uD83D\uDCAC" }), _jsx("p", { children: t("chat.emptyState") })] })), messages.map((msg, idx) => (_jsxs("div", { className: `message ${msg.role}`, children: [_jsx("div", { className: "message-avatar", children: msg.role === "user" ? t("chat.you") : t("chat.ai") }), _jsxs("div", { className: "message-content", children: [msg.content, msg.sources && msg.sources.length > 0 && (_jsx("div", { className: "message-sources", children: _jsxs("details", { children: [_jsxs("summary", { children: [msg.sources.length, " ", t("chat.sourcesUsed")] }), msg.sources.map((src, sIdx) => (_jsxs("div", { className: "source-item", children: [src.fileName, " | Chunk ", src.chunkIndex, " |", " ", (src.similarity * 100).toFixed(1), "% ", t("chat.relevance"), sourceToUrl(src) && (_jsxs(_Fragment, { children: [" ", "|", " ", _jsx("button", { type: "button", className: "source-external-link", onClick: () => {
                                                                                const u = sourceToUrl(src);
                                                                                if (u) {
                                                                                    void window.chatApi.openExternal(u);
                                                                                }
                                                                            }, children: "Website" })] }))] }, sIdx)))] }) }))] })] }, idx))), isLoading && (_jsxs("div", { className: "message assistant", children: [_jsx("div", { className: "message-avatar", children: t("chat.ai") }), _jsx("div", { className: "message-content", children: _jsxs("div", { className: "typing-indicator", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "chat-input-area", children: _jsxs("div", { className: "chat-input-wrapper", children: [_jsx("textarea", { ref: textareaRef, value: input, onChange: handleTextareaInput, onKeyDown: handleKeyDown, placeholder: t("chat.placeholder"), rows: 1, disabled: isLoading }), _jsx("button", { className: "send-btn", onClick: () => void sendMessage(), disabled: isLoading || !input.trim(), title: "Send", children: "\u27A4" })] }) })] })] }));
}
