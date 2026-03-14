# RAG Creator Monorepo

Dieses Repository enthaelt drei Bausteine:

- `documentApi` - FastAPI Backend (Port `8000`) fuer Ingest, Index, Health und Chat.
- `documentHandling` - Electron Desktop-App fuer Upload, Chunking, Reindex und Corpus-Verwaltung.
- `chatBot` - Electron Desktop-App fuer Fragen gegen den aufgebauten Vektorindex.

Ziel dieser Anleitung: **Clone -> installieren -> starten -> sofort arbeiten**.

## Architektur auf einen Blick

- Beide Desktop-Apps sprechen gegen `http://localhost:8000`.
- Das Backend nutzt:
  - PostgreSQL + `pgvector` (Vektorindex, Standard-DB `rag`, Tabelle `rag_documents`)
  - lokale Dateien unter `~/RAGIngestStudio`
- Persistenz lokal:
  - `~/RAGIngestStudio/files`
  - `~/RAGIngestStudio/corpus`
  - `~/RAGIngestStudio/index.sqlite`

## Voraussetzungen

Minimum:

- Windows 10/11 (PowerShell)
- Git
- Node.js `>= 20`
- Python `>= 3.10`
- PostgreSQL mit `pgvector`

Empfohlen:

- Docker Desktop (einfachster Weg fuer Postgres+pgvector)
- Optional fuer lokalen LLM-Betrieb im Chat: Ollama (`http://localhost:11434/v1`)

## 1) Repository klonen

```powershell
git clone <DEIN-REPO-URL> rag-creator
cd rag-creator
```

## 2) Node.js installieren und pruefen

Wenn Node.js noch fehlt (Windows mit winget):

```powershell
winget install OpenJS.NodeJS.LTS
```

Version pruefen:

```powershell
node -v
npm -v
```

## 3) Python installieren und pruefen

Wenn Python noch fehlt (Windows mit winget):

```powershell
winget install Python.Python.3.11
```

Version pruefen:

```powershell
python --version
pip --version
```

## 4) PostgreSQL + pgvector starten

### Option A (empfohlen): Docker

```powershell
docker run --name rag-pg `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=rag `
  -p 5432:5432 `
  -d pgvector/pgvector:pg16
```

Container pruefen:

```powershell
docker ps
```

### Option B: Lokales PostgreSQL

Wenn du PostgreSQL lokal installierst, stelle sicher:

- DB Name: `rag`
- User: `postgres`
- Passwort: z. B. `postgres` (oder spaeter in den App-Settings eintragen)
- Extension aktiv:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 5) Python-Umgebung fuer Backend einrichten

Im Backend-Verzeichnis:

```powershell
cd documentApi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Hinweis: Beim ersten Start von Embeddings kann das Model (`all-MiniLM-L6-v2`) automatisch geladen werden.

## 6) Node-Dependencies im Monorepo installieren

In einem **zweiten** Terminal (Repo-Root):

```powershell
cd <PFAD>\rag-creator
npm install
```

## 7) Backend starten (Terminal 1)

Im aktivierten Python-venv:

```powershell
cd <PFAD>\rag-creator\documentApi
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health-Check:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## 8) Document Handling App starten (Terminal 2)

Im Repo-Root:

```powershell
cd <PFAD>\rag-creator
npm run dev
```

Das startet:

- Renderer auf `http://localhost:5173`
- Electron Main fuer `documentHandling`

## 9) Chat App starten (optional, Terminal 3)

Im Repo-Root:

```powershell
cd <PFAD>\rag-creator
npm run dev:chat
```

Das startet:

- Renderer auf `http://localhost:5174`
- Electron Main fuer `chatBot`

## 10) Erste Inbetriebnahme in der App

1. `documentHandling` oeffnen.
2. In **Settings** die DB-Daten pruefen:
   - Host `localhost`
   - Port `5432`
   - Name `rag`
   - User `postgres`
   - Passwort entsprechend deiner Postgres-Config
   - Tabellenname `rag_documents`
3. **Connection Test** ausfuehren (muss `ok` sein).
4. Dokumente hochladen.
5. Nach erfolgreicher Indexierung `chatBot` starten und Fragen stellen.

## Produktionsstart (ohne Dev-Server)

Im Repo-Root:

```powershell
npm run build
npm run start
```

Fuer die Chat-App:

```powershell
npm run build:chat
npm run start:chat
```

## Bekannte lokale Pfade

- Arbeitsdaten: `C:\Users\<DEIN_USER>\RAGIngestStudio\`
- API-Einstellungen: `documentApi\settings.json`
- Chat-Einstellungen: `documentApi\chat_settings.json`

## Fehlerbehebung (haeufig)

- `POST /api/database/test-connection` fehlschlaegt:
  - Postgres laeuft nicht, Port `5432` belegt oder falsche Zugangsdaten.
- Upload klappt, aber Embedding/Index nicht:
  - Python-Abhaengigkeiten im `documentApi` venv fehlen.
- Chat antwortet nicht:
  - API auf `8000` nicht gestartet oder LLM-Endpunkt in Chat-Settings falsch.
- Electron startet, aber nur leeres Fenster:
  - Dev-Server-Port bereits belegt (`5173`/`5174`) oder `npm install` wurde nicht im Root ausgefuehrt.
