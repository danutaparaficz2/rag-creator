import { useState, useCallback, useMemo } from "react";

export type Locale = "de" | "en";

const translations = {
  de: {
    "app.title": "RAG Ingest Studio",
    "tabs.documents": "Dokumente",
    "tabs.settings": "Einstellungen",
    "header.addDocuments": "Dokumente hinzufügen",
    "header.reindexSelected": "Ausgewählte neu indexieren",
    "header.removeSelected": "Ausgewählte entfernen",
    "header.exportCsv": "CSV exportieren",
    "drop.ready": "Dateien hierher ziehen und ablegen oder oben über Dokumente hinzufügen auswählen.",
    "drop.locked": "Upload gesperrt: Bitte zuerst in den Settings den Connection Test erfolgreich ausführen.",
    "upload.title": "Upload Optionen",
    "upload.tags": "Tags (kommagetrennt)",
    "upload.source": "Quelle / Projekt",
    "doclist.title": "Dokumentliste",
    "doclist.search": "Suche",
    "doclist.status": "Status",
    "doclist.type": "Typ",
    "doclist.tag": "Tag",
    "doclist.all": "Alle",
    "doclist.file": "Datei",
    "doclist.chunks": "Chunks",
    "doclist.size": "Größe",
    "doclist.tags": "Tags",
    "doclist.source": "Quelle",
    "doclist.lastProcessed": "Letzte Verarbeitung",
    "doclist.actions": "Aktionen",
    "doclist.viewCorpus": "Corpus anzeigen",
    "doclist.reindex": "Neu indexieren",
    "doclist.remove": "Entfernen",
    "settings.title": "Einstellungen",
    "settings.dbHost": "DB Host",
    "settings.dbPort": "DB Port",
    "settings.dbName": "DB Name",
    "settings.dbUser": "DB Benutzer",
    "settings.dbPassword": "DB Passwort",
    "settings.vectorTable": "Vektor-Tabellenname",
    "settings.chunkSize": "Chunk-Größe",
    "settings.chunkOverlap": "Chunk-Überlappung",
    "settings.embeddingModel": "Embedding-Modell",
    "settings.storeMarkdown": "Markdown speichern",
    "settings.save": "Einstellungen speichern",
    "settings.connectionTest": "Connection Test",
    "settings.loading": "Einstellungen werden geladen...",
    "settings.saved": "Einstellungen gespeichert. Bitte Connection Test erneut ausführen.",
    "settings.testFirst": "Bitte zuerst Connection Test ausführen.",
    "settings.language": "Sprache",
    "jobs.title": "Job Events",
    "corpus.title": "Corpus Viewer",
    "corpus.saveAndReindex": "Speichern und neu indexieren",
    "corpus.close": "Schließen",
  },
  en: {
    "app.title": "RAG Ingest Studio",
    "tabs.documents": "Documents",
    "tabs.settings": "Settings",
    "header.addDocuments": "Add Documents",
    "header.reindexSelected": "Reindex Selected",
    "header.removeSelected": "Remove Selected",
    "header.exportCsv": "Export CSV",
    "drop.ready": "Drag and drop files here or use Add Documents above.",
    "drop.locked": "Upload locked: Please run Connection Test in Settings first.",
    "upload.title": "Upload Options",
    "upload.tags": "Tags (comma-separated)",
    "upload.source": "Source / Project",
    "doclist.title": "Document List",
    "doclist.search": "Search",
    "doclist.status": "Status",
    "doclist.type": "Type",
    "doclist.tag": "Tag",
    "doclist.all": "All",
    "doclist.file": "File",
    "doclist.chunks": "Chunks",
    "doclist.size": "Size",
    "doclist.tags": "Tags",
    "doclist.source": "Source",
    "doclist.lastProcessed": "Last Processed",
    "doclist.actions": "Actions",
    "doclist.viewCorpus": "View Corpus",
    "doclist.reindex": "Reindex",
    "doclist.remove": "Remove",
    "settings.title": "Settings",
    "settings.dbHost": "DB Host",
    "settings.dbPort": "DB Port",
    "settings.dbName": "DB Name",
    "settings.dbUser": "DB User",
    "settings.dbPassword": "DB Password",
    "settings.vectorTable": "Vector Table Name",
    "settings.chunkSize": "Chunk Size",
    "settings.chunkOverlap": "Chunk Overlap",
    "settings.embeddingModel": "Embedding Model",
    "settings.storeMarkdown": "Store Markdown",
    "settings.save": "Save Settings",
    "settings.connectionTest": "Connection Test",
    "settings.loading": "Loading settings...",
    "settings.saved": "Settings saved. Please run Connection Test again.",
    "settings.testFirst": "Please run Connection Test first.",
    "settings.language": "Language",
    "jobs.title": "Job Events",
    "corpus.title": "Corpus Viewer",
    "corpus.saveAndReindex": "Save and Reindex",
    "corpus.close": "Close",
  },
} as const;

type TranslationKey = keyof (typeof translations)["de"];

const STORAGE_KEY = "rag-ingest-locale";

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch {}
  return navigator.language.startsWith("de") ? "de" : "en";
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
  }, []);

  const t = useCallback(
    (key: TranslationKey, ...args: string[]): string => {
      let text: string = translations[locale][key] ?? key;
      args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
      });
      return text;
    },
    [locale]
  );

  return useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
}
