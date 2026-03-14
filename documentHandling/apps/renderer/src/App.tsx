import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, DocumentRecord, ProgressEventPayload } from "@rag/shared";
import { useI18n } from "./i18n";

interface UploadFormState {
  tagsInput: string;
  source: string;
}

function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [activeTab, setActiveTab] = useState<"documents" | "settings">("documents");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [uploadFormState, setUploadFormState] = useState<UploadFormState>({ tagsInput: "", source: "lokal" });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isConnectionReady, setIsConnectionReady] = useState(false);
  const [healthMessage, setHealthMessage] = useState("");
  const [corpusDocumentId, setCorpusDocumentId] = useState<string | null>(null);
  const [corpusContent, setCorpusContent] = useState("");
  const [progressEvents, setProgressEvents] = useState<ProgressEventPayload[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const autoConnectionTestTriggered = useRef(false);

  async function reloadDocuments(): Promise<void> {
    const listedDocuments = await window.ragApi.listDocuments();
    setDocuments(listedDocuments);
  }

  useEffect(() => {
    void reloadDocuments();
    void window.ragApi.getSettings().then(setSettings);
    void window.ragApi.getDatabaseConnectionState().then((state) => setIsConnectionReady(state.ready));
    const unsubscribe = window.ragApi.onJobProgress((progressEvent) => {
      setProgressEvents((oldEvents) => [progressEvent, ...oldEvents].slice(0, 25));
      void reloadDocuments();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!settings || autoConnectionTestTriggered.current) {
      return;
    }
    const hasDbConfig =
      settings.dbHost.trim().length > 0 &&
      settings.dbName.trim().length > 0 &&
      settings.dbUser.trim().length > 0 &&
      Number(settings.dbPort) > 0;
    if (!hasDbConfig) {
      return;
    }
    autoConnectionTestTriggered.current = true;
    void runConnectionTest();
  }, [settings]);

  const availableTags = useMemo(
    () => Array.from(new Set(documents.flatMap((document) => document.tags))).sort((left, right) => left.localeCompare(right)),
    [documents]
  );

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        if (statusFilter !== "all" && document.status !== statusFilter) return false;
        if (typeFilter !== "all" && document.fileType !== typeFilter) return false;
        if (tagFilter !== "all" && !document.tags.includes(tagFilter)) return false;
        if (searchText.trim().length === 0) return true;
        const normalizedSearch = searchText.toLowerCase();
        return (
          document.fileName.toLowerCase().includes(normalizedSearch) ||
          document.docId.toLowerCase().includes(normalizedSearch) ||
          document.source.toLowerCase().includes(normalizedSearch)
        );
      }),
    [documents, searchText, statusFilter, typeFilter, tagFilter]
  );

  async function uploadWithPicker(): Promise<void> {
    if (!isConnectionReady) {
      setHealthMessage(t("settings.testFirst"));
      return;
    }
    await window.ragApi.pickAndUploadDocuments({
      tags: parseTags(uploadFormState.tagsInput),
      source: uploadFormState.source.trim() || "lokal"
    });
    await reloadDocuments();
  }

  async function uploadFromDrop(filePaths: string[]): Promise<void> {
    if (filePaths.length === 0) return;
    if (!isConnectionReady) {
      setHealthMessage(t("settings.testFirst"));
      return;
    }
    await window.ragApi.uploadFiles(filePaths, {
      tags: parseTags(uploadFormState.tagsInput),
      source: uploadFormState.source.trim() || "lokal"
    });
    await reloadDocuments();
  }

  async function openCorpusEditor(docId: string): Promise<void> {
    const loadedCorpus = await window.ragApi.getCorpus(docId);
    setCorpusDocumentId(docId);
    setCorpusContent(loadedCorpus);
  }

  async function saveCorpusAndReindex(): Promise<void> {
    if (!corpusDocumentId) return;
    await window.ragApi.saveCorpus(corpusDocumentId, corpusContent);
    await window.ragApi.reindexDocument(corpusDocumentId);
    await reloadDocuments();
  }

  async function removeSingleDocument(docId: string): Promise<void> {
    await window.ragApi.removeDocument(docId);
    setSelectedDocumentIds((oldIds) => oldIds.filter((entry) => entry !== docId));
    await reloadDocuments();
  }

  async function reindexSelectedDocuments(): Promise<void> {
    if (selectedDocumentIds.length === 0) return;
    await window.ragApi.reindexDocuments(selectedDocumentIds);
    await reloadDocuments();
  }

  async function removeSelectedDocuments(): Promise<void> {
    if (selectedDocumentIds.length === 0) return;
    await window.ragApi.removeDocuments(selectedDocumentIds);
    setSelectedDocumentIds([]);
    await reloadDocuments();
  }

  async function saveSettings(): Promise<void> {
    if (!settings) return;
    const persisted = await window.ragApi.saveSettings(settings);
    setSettings(persisted);
    setIsConnectionReady(false);
    setHealthMessage(t("settings.saved"));
  }

  async function runConnectionTest(): Promise<void> {
    const result = await window.ragApi.testDatabaseConnection();
    setIsConnectionReady(result.status === "ok");
    setHealthMessage(result.message);
  }

  async function exportCsv(): Promise<void> {
    const csvContent = await window.ragApi.exportDocumentsCsv();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement("a");
    anchorElement.href = url;
    anchorElement.download = "rag-ingest-documents.csv";
    anchorElement.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1>{t("app.title")}</h1>
          <div className="tab-row">
            <button
              type="button"
              className={`tab-button ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              {t("tabs.documents")}
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              {t("tabs.settings")}
            </button>
          </div>
        </div>
        <div className="button-row">
          {activeTab === "documents" && (
            <>
              <button onClick={() => void uploadWithPicker()} disabled={!isConnectionReady}>
                {t("header.addDocuments")}
              </button>
              <button onClick={() => void reindexSelectedDocuments()} disabled={selectedDocumentIds.length === 0}>
                {t("header.reindexSelected")}
              </button>
              <button onClick={() => void removeSelectedDocuments()} disabled={selectedDocumentIds.length === 0}>
                {t("header.removeSelected")}
              </button>
              <button onClick={() => void exportCsv()}>{t("header.exportCsv")}</button>
            </>
          )}
          <div className="lang-switcher">
            <span>{t("settings.language")}:</span>
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
      </header>

      {activeTab === "documents" && (
        <>
          <section
            className={`drop-zone ${isDropActive ? "drop-zone-active" : ""}`}
            onDragOver={(event) => {
              if (!isConnectionReady) return;
              event.preventDefault();
              setIsDropActive(true);
            }}
            onDragLeave={() => setIsDropActive(false)}
            onDrop={(event) => {
              if (!isConnectionReady) return;
              event.preventDefault();
              setIsDropActive(false);
              const droppedFilePaths = Array.from(event.dataTransfer.files)
                .map((file) => (file as File & { path?: string }).path)
                .filter((value): value is string => Boolean(value));
              void uploadFromDrop(droppedFilePaths);
            }}
          >
            {isConnectionReady ? t("drop.ready") : t("drop.locked")}
          </section>

          <section className="panel">
            <h2>{t("upload.title")}</h2>
            <div className="input-grid">
              <label>
                {t("upload.tags")}
                <input
                  value={uploadFormState.tagsInput}
                  onChange={(event) => setUploadFormState((old) => ({ ...old, tagsInput: event.target.value }))}
                />
              </label>
              <label>
                {t("upload.source")}
                <input
                  value={uploadFormState.source}
                  onChange={(event) => setUploadFormState((old) => ({ ...old, source: event.target.value }))}
                />
              </label>
            </div>
          </section>

          <section className="panel">
        <h2>{t("doclist.title")}</h2>
        <div className="input-grid filter-grid">
          <label>
            {t("doclist.search")}
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          </label>
          <label>
            {t("doclist.status")}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">{t("doclist.all")}</option>
              <option value="queued">queued</option>
              <option value="processing">processing</option>
              <option value="done">done</option>
              <option value="error">error</option>
            </select>
          </label>
          <label>
            {t("doclist.type")}
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">{t("doclist.all")}</option>
              {Array.from(new Set(documents.map((document) => document.fileType))).map((fileType) => (
                <option key={fileType} value={fileType}>
                  {fileType}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("doclist.tag")}
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">{t("doclist.all")}</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th />
                <th>{t("doclist.file")}</th>
                <th>docId</th>
                <th>{t("doclist.type")}</th>
                <th>{t("doclist.status")}</th>
                <th>{t("doclist.chunks")}</th>
                <th>{t("doclist.size")}</th>
                <th>{t("doclist.tags")}</th>
                <th>{t("doclist.source")}</th>
                <th>{t("doclist.lastProcessed")}</th>
                <th>{t("doclist.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((document) => {
                const isSelected = selectedDocumentIds.includes(document.docId);
                return (
                  <tr key={document.docId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => {
                          setSelectedDocumentIds((oldDocumentIds) =>
                            event.target.checked
                              ? [...oldDocumentIds, document.docId]
                              : oldDocumentIds.filter((entry) => entry !== document.docId)
                          );
                        }}
                      />
                    </td>
                    <td>{document.fileName}</td>
                    <td className="mono-cell">{document.docId.slice(0, 12)}...</td>
                    <td>{document.fileType}</td>
                    <td>{document.status}</td>
                    <td>{document.chunkCount}</td>
                    <td>{Math.round(document.sizeBytes / 1024)} KB</td>
                    <td>{document.tags.join(", ")}</td>
                    <td>{document.source}</td>
                    <td>{document.lastIndexedAt ? new Date(document.lastIndexedAt).toLocaleString() : "-"}</td>
                    <td className="action-column">
                      <button onClick={() => void openCorpusEditor(document.docId)}>{t("doclist.viewCorpus")}</button>
                      <button onClick={() => void window.ragApi.reindexDocument(document.docId)}>{t("doclist.reindex")}</button>
                      <button onClick={() => void removeSingleDocument(document.docId)}>{t("doclist.remove")}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          </section>

          <section className="panel">
            <h2>{t("jobs.title")}</h2>
            <div className="events-list">
              {progressEvents.map((event) => (
                <div key={`${event.jobId}-${event.progress}-${event.status}`} className="event-card">
                  <strong>{event.type}</strong> | {event.status} | {Math.round(event.progress * 100)}%
                  <div>{event.docId.slice(0, 12)}... - {event.message}</div>
                </div>
              ))}
            </div>
          </section>

          {corpusDocumentId ? (
            <section className="panel">
              <h2>{t("corpus.title")} - {corpusDocumentId}</h2>
              <textarea value={corpusContent} onChange={(event) => setCorpusContent(event.target.value)} rows={18} />
              <div className="button-row">
                <button onClick={() => void saveCorpusAndReindex()}>{t("corpus.saveAndReindex")}</button>
                <button
                  onClick={() => {
                    setCorpusDocumentId(null);
                    setCorpusContent("");
                  }}
                >
                  {t("corpus.close")}
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}

      {activeTab === "settings" && (
        <section className="panel">
          <h2>{t("settings.title")}</h2>
          {settings ? (
            <div className="input-grid">
              <label>
                {t("settings.dbHost")}
                <input
                  value={settings.dbHost}
                  onChange={(event) => setSettings((old) => (old ? { ...old, dbHost: event.target.value } : old))}
                />
              </label>
              <label>
                {t("settings.dbPort")}
                <input
                  type="number"
                  value={settings.dbPort}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, dbPort: Number(event.target.value) || 5432 } : old))
                  }
                />
              </label>
              <label>
                {t("settings.dbName")}
                <input
                  value={settings.dbName}
                  onChange={(event) => setSettings((old) => (old ? { ...old, dbName: event.target.value } : old))}
                />
              </label>
              <label>
                {t("settings.dbUser")}
                <input
                  value={settings.dbUser}
                  onChange={(event) => setSettings((old) => (old ? { ...old, dbUser: event.target.value } : old))}
                />
              </label>
              <label>
                {t("settings.dbPassword")}
                <input
                  type="password"
                  value={settings.dbPassword}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, dbPassword: event.target.value } : old))
                  }
                />
              </label>
              <label>
                {t("settings.vectorTable")}
                <input
                  value={settings.dbTableName}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, dbTableName: event.target.value } : old))
                  }
                />
              </label>
              <label>
                {t("settings.chunkSize")}
                <input
                  type="number"
                  value={settings.chunkSize}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, chunkSize: Number(event.target.value) } : old))
                  }
                />
              </label>
              <label>
                {t("settings.chunkOverlap")}
                <input
                  type="number"
                  value={settings.chunkOverlap}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, chunkOverlap: Number(event.target.value) } : old))
                  }
                />
              </label>
              <label>
                {t("settings.embeddingModel")}
                <input
                  value={settings.embeddingModel}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, embeddingModel: event.target.value } : old))
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.storeMarkdown}
                  onChange={(event) =>
                    setSettings((old) => (old ? { ...old, storeMarkdown: event.target.checked } : old))
                  }
                />
                {t("settings.storeMarkdown")}
              </label>
              <div className="button-row">
                <button onClick={() => void saveSettings()}>{t("settings.save")}</button>
                <button onClick={() => void runConnectionTest()}>{t("settings.connectionTest")}</button>
              </div>
              <p>{healthMessage}</p>
            </div>
          ) : (
            <p>{t("settings.loading")}</p>
          )}
        </section>
      )}
    </div>
  );
}
