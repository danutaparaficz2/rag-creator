import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "./i18n";
function parseTags(tagsInput) {
    return tagsInput
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
export default function App() {
    const { t, locale, setLocale } = useI18n();
    const [activeTab, setActiveTab] = useState("documents");
    const [documents, setDocuments] = useState([]);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [uploadFormState, setUploadFormState] = useState({ tagsInput: "", source: "lokal" });
    const [settings, setSettings] = useState(null);
    const [isConnectionReady, setIsConnectionReady] = useState(false);
    const [healthMessage, setHealthMessage] = useState("");
    const [corpusDocumentId, setCorpusDocumentId] = useState(null);
    const [corpusContent, setCorpusContent] = useState("");
    const [progressEvents, setProgressEvents] = useState([]);
    const [isDropActive, setIsDropActive] = useState(false);
    const autoConnectionTestTriggered = useRef(false);
    async function reloadDocuments() {
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
        const hasDbConfig = settings.dbHost.trim().length > 0 &&
            settings.dbName.trim().length > 0 &&
            settings.dbUser.trim().length > 0 &&
            Number(settings.dbPort) > 0;
        if (!hasDbConfig) {
            return;
        }
        autoConnectionTestTriggered.current = true;
        void runConnectionTest();
    }, [settings]);
    const availableTags = useMemo(() => Array.from(new Set(documents.flatMap((document) => document.tags))).sort((left, right) => left.localeCompare(right)), [documents]);
    const filteredDocuments = useMemo(() => documents.filter((document) => {
        if (statusFilter !== "all" && document.status !== statusFilter)
            return false;
        if (typeFilter !== "all" && document.fileType !== typeFilter)
            return false;
        if (tagFilter !== "all" && !document.tags.includes(tagFilter))
            return false;
        if (searchText.trim().length === 0)
            return true;
        const normalizedSearch = searchText.toLowerCase();
        return (document.fileName.toLowerCase().includes(normalizedSearch) ||
            document.docId.toLowerCase().includes(normalizedSearch) ||
            document.source.toLowerCase().includes(normalizedSearch));
    }), [documents, searchText, statusFilter, typeFilter, tagFilter]);
    async function uploadWithPicker() {
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
    async function uploadFromDrop(filePaths) {
        if (filePaths.length === 0)
            return;
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
    async function openCorpusEditor(docId) {
        const loadedCorpus = await window.ragApi.getCorpus(docId);
        setCorpusDocumentId(docId);
        setCorpusContent(loadedCorpus);
    }
    async function saveCorpusAndReindex() {
        if (!corpusDocumentId)
            return;
        await window.ragApi.saveCorpus(corpusDocumentId, corpusContent);
        await window.ragApi.reindexDocument(corpusDocumentId);
        await reloadDocuments();
    }
    async function removeSingleDocument(docId) {
        await window.ragApi.removeDocument(docId);
        setSelectedDocumentIds((oldIds) => oldIds.filter((entry) => entry !== docId));
        await reloadDocuments();
    }
    async function reindexSelectedDocuments() {
        if (selectedDocumentIds.length === 0)
            return;
        await window.ragApi.reindexDocuments(selectedDocumentIds);
        await reloadDocuments();
    }
    async function removeSelectedDocuments() {
        if (selectedDocumentIds.length === 0)
            return;
        await window.ragApi.removeDocuments(selectedDocumentIds);
        setSelectedDocumentIds([]);
        await reloadDocuments();
    }
    async function saveSettings() {
        if (!settings)
            return;
        const persisted = await window.ragApi.saveSettings(settings);
        setSettings(persisted);
        setIsConnectionReady(false);
        setHealthMessage(t("settings.saved"));
    }
    async function runConnectionTest() {
        const result = await window.ragApi.testDatabaseConnection();
        setIsConnectionReady(result.status === "ok");
        setHealthMessage(result.message);
    }
    async function exportCsv() {
        const csvContent = await window.ragApi.exportDocumentsCsv();
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchorElement = document.createElement("a");
        anchorElement.href = url;
        anchorElement.download = "rag-ingest-documents.csv";
        anchorElement.click();
        URL.revokeObjectURL(url);
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "top-bar", children: [_jsxs("div", { className: "top-bar-left", children: [_jsx("h1", { children: t("app.title") }), _jsxs("div", { className: "tab-row", children: [_jsx("button", { type: "button", className: `tab-button ${activeTab === "documents" ? "active" : ""}`, onClick: () => setActiveTab("documents"), children: t("tabs.documents") }), _jsx("button", { type: "button", className: `tab-button ${activeTab === "settings" ? "active" : ""}`, onClick: () => setActiveTab("settings"), children: t("tabs.settings") })] })] }), _jsxs("div", { className: "button-row", children: [activeTab === "documents" && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => void uploadWithPicker(), disabled: !isConnectionReady, children: t("header.addDocuments") }), _jsx("button", { onClick: () => void reindexSelectedDocuments(), disabled: selectedDocumentIds.length === 0, children: t("header.reindexSelected") }), _jsx("button", { onClick: () => void removeSelectedDocuments(), disabled: selectedDocumentIds.length === 0, children: t("header.removeSelected") }), _jsx("button", { onClick: () => void exportCsv(), children: t("header.exportCsv") })] })), _jsxs("div", { className: "lang-switcher", children: [_jsxs("span", { children: [t("settings.language"), ":"] }), _jsx("button", { className: `lang-toggle ${locale === "de" ? "active" : ""}`, onClick: () => setLocale("de"), type: "button", children: "DE" }), _jsx("button", { className: `lang-toggle ${locale === "en" ? "active" : ""}`, onClick: () => setLocale("en"), type: "button", children: "EN" })] })] })] }), activeTab === "documents" && (_jsxs(_Fragment, { children: [_jsx("section", { className: `drop-zone ${isDropActive ? "drop-zone-active" : ""}`, onDragOver: (event) => {
                            if (!isConnectionReady)
                                return;
                            event.preventDefault();
                            setIsDropActive(true);
                        }, onDragLeave: () => setIsDropActive(false), onDrop: (event) => {
                            if (!isConnectionReady)
                                return;
                            event.preventDefault();
                            setIsDropActive(false);
                            const droppedFilePaths = Array.from(event.dataTransfer.files)
                                .map((file) => file.path)
                                .filter((value) => Boolean(value));
                            void uploadFromDrop(droppedFilePaths);
                        }, children: isConnectionReady ? t("drop.ready") : t("drop.locked") }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: t("upload.title") }), _jsxs("div", { className: "input-grid", children: [_jsxs("label", { children: [t("upload.tags"), _jsx("input", { value: uploadFormState.tagsInput, onChange: (event) => setUploadFormState((old) => ({ ...old, tagsInput: event.target.value })) })] }), _jsxs("label", { children: [t("upload.source"), _jsx("input", { value: uploadFormState.source, onChange: (event) => setUploadFormState((old) => ({ ...old, source: event.target.value })) })] })] })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: t("doclist.title") }), _jsxs("div", { className: "input-grid filter-grid", children: [_jsxs("label", { children: [t("doclist.search"), _jsx("input", { value: searchText, onChange: (event) => setSearchText(event.target.value) })] }), _jsxs("label", { children: [t("doclist.status"), _jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "all", children: t("doclist.all") }), _jsx("option", { value: "queued", children: "queued" }), _jsx("option", { value: "processing", children: "processing" }), _jsx("option", { value: "done", children: "done" }), _jsx("option", { value: "error", children: "error" })] })] }), _jsxs("label", { children: [t("doclist.type"), _jsxs("select", { value: typeFilter, onChange: (event) => setTypeFilter(event.target.value), children: [_jsx("option", { value: "all", children: t("doclist.all") }), Array.from(new Set(documents.map((document) => document.fileType))).map((fileType) => (_jsx("option", { value: fileType, children: fileType }, fileType)))] })] }), _jsxs("label", { children: [t("doclist.tag"), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: t("doclist.all") }), availableTags.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] })] }), _jsx("div", { className: "table-wrapper", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", {}), _jsx("th", { children: t("doclist.file") }), _jsx("th", { children: "docId" }), _jsx("th", { children: t("doclist.type") }), _jsx("th", { children: t("doclist.status") }), _jsx("th", { children: t("doclist.chunks") }), _jsx("th", { children: t("doclist.size") }), _jsx("th", { children: t("doclist.tags") }), _jsx("th", { children: t("doclist.source") }), _jsx("th", { children: t("doclist.lastProcessed") }), _jsx("th", { children: t("doclist.actions") })] }) }), _jsx("tbody", { children: filteredDocuments.map((document) => {
                                                const isSelected = selectedDocumentIds.includes(document.docId);
                                                return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: (event) => {
                                                                    setSelectedDocumentIds((oldDocumentIds) => event.target.checked
                                                                        ? [...oldDocumentIds, document.docId]
                                                                        : oldDocumentIds.filter((entry) => entry !== document.docId));
                                                                } }) }), _jsx("td", { children: document.fileName }), _jsxs("td", { className: "mono-cell", children: [document.docId.slice(0, 12), "..."] }), _jsx("td", { children: document.fileType }), _jsx("td", { children: document.status }), _jsx("td", { children: document.chunkCount }), _jsxs("td", { children: [Math.round(document.sizeBytes / 1024), " KB"] }), _jsx("td", { children: document.tags.join(", ") }), _jsx("td", { children: document.source }), _jsx("td", { children: document.lastIndexedAt ? new Date(document.lastIndexedAt).toLocaleString() : "-" }), _jsxs("td", { className: "action-column", children: [_jsx("button", { onClick: () => void openCorpusEditor(document.docId), children: t("doclist.viewCorpus") }), _jsx("button", { onClick: () => void window.ragApi.reindexDocument(document.docId), children: t("doclist.reindex") }), _jsx("button", { onClick: () => void removeSingleDocument(document.docId), children: t("doclist.remove") })] })] }, document.docId));
                                            }) })] }) })] }), _jsxs("section", { className: "panel", children: [_jsx("h2", { children: t("jobs.title") }), _jsx("div", { className: "events-list", children: progressEvents.map((event) => (_jsxs("div", { className: "event-card", children: [_jsx("strong", { children: event.type }), " | ", event.status, " | ", Math.round(event.progress * 100), "%", _jsxs("div", { children: [event.docId.slice(0, 12), "... - ", event.message] })] }, `${event.jobId}-${event.progress}-${event.status}`))) })] }), corpusDocumentId ? (_jsxs("section", { className: "panel", children: [_jsxs("h2", { children: [t("corpus.title"), " - ", corpusDocumentId] }), _jsx("textarea", { value: corpusContent, onChange: (event) => setCorpusContent(event.target.value), rows: 18 }), _jsxs("div", { className: "button-row", children: [_jsx("button", { onClick: () => void saveCorpusAndReindex(), children: t("corpus.saveAndReindex") }), _jsx("button", { onClick: () => {
                                            setCorpusDocumentId(null);
                                            setCorpusContent("");
                                        }, children: t("corpus.close") })] })] })) : null] })), activeTab === "settings" && (_jsxs("section", { className: "panel", children: [_jsx("h2", { children: t("settings.title") }), settings ? (_jsxs("div", { className: "input-grid", children: [_jsxs("label", { children: [t("settings.dbHost"), _jsx("input", { value: settings.dbHost, onChange: (event) => setSettings((old) => (old ? { ...old, dbHost: event.target.value } : old)) })] }), _jsxs("label", { children: [t("settings.dbPort"), _jsx("input", { type: "number", value: settings.dbPort, onChange: (event) => setSettings((old) => (old ? { ...old, dbPort: Number(event.target.value) || 5432 } : old)) })] }), _jsxs("label", { children: [t("settings.dbName"), _jsx("input", { value: settings.dbName, onChange: (event) => setSettings((old) => (old ? { ...old, dbName: event.target.value } : old)) })] }), _jsxs("label", { children: [t("settings.dbUser"), _jsx("input", { value: settings.dbUser, onChange: (event) => setSettings((old) => (old ? { ...old, dbUser: event.target.value } : old)) })] }), _jsxs("label", { children: [t("settings.dbPassword"), _jsx("input", { type: "password", value: settings.dbPassword, onChange: (event) => setSettings((old) => (old ? { ...old, dbPassword: event.target.value } : old)) })] }), _jsxs("label", { children: [t("settings.vectorTable"), _jsx("input", { value: settings.dbTableName, onChange: (event) => setSettings((old) => (old ? { ...old, dbTableName: event.target.value } : old)) })] }), _jsxs("label", { children: [t("settings.chunkSize"), _jsx("input", { type: "number", value: settings.chunkSize, onChange: (event) => setSettings((old) => (old ? { ...old, chunkSize: Number(event.target.value) } : old)) })] }), _jsxs("label", { children: [t("settings.chunkOverlap"), _jsx("input", { type: "number", value: settings.chunkOverlap, onChange: (event) => setSettings((old) => (old ? { ...old, chunkOverlap: Number(event.target.value) } : old)) })] }), _jsxs("label", { children: [t("settings.embeddingModel"), _jsx("input", { value: settings.embeddingModel, onChange: (event) => setSettings((old) => (old ? { ...old, embeddingModel: event.target.value } : old)) })] }), _jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: settings.storeMarkdown, onChange: (event) => setSettings((old) => (old ? { ...old, storeMarkdown: event.target.checked } : old)) }), t("settings.storeMarkdown")] }), _jsxs("div", { className: "button-row", children: [_jsx("button", { onClick: () => void saveSettings(), children: t("settings.save") }), _jsx("button", { onClick: () => void runConnectionTest(), children: t("settings.connectionTest") })] }), _jsx("p", { children: healthMessage })] })) : (_jsx("p", { children: t("settings.loading") }))] }))] }));
}
