# AIVOA Customer Complaint Management

An AI-powered customer complaint intake system for pharmaceutical companies that manufacture API and FDF products. Built for the AIVOA Round 1 AI Product Engineer assignment.

Users describe a complaint in the AI Copilot chat or upload a complaint document. Copilot fills the read-only **Log Customer Complaint** form, accepts corrections in plain English, and prepares an initial risk assessment for QA review.

## Features

**Required workflow**

- **Log complaint**: type a complaint in natural language and the form fills automatically.
- **Edit complaint**: correct details in plain English (for example, a wrong batch number). Only the mentioned fields change.
- **Document extraction**: upload a PDF, DOCX, TXT, or EML file (including DOCX tables) to fill the form.
- **AI risk assessment**: severity, priority, reasoning, and a recommended next action, regenerated after every change.

**Bonus AI features**

- Complaint summary
- Root cause recommendations
- CAPA recommendations
- AI risk classification (severity and priority)
- Completeness checker for eight key intake details

**Application features**

- Drafts, logged complaints, chat messages, and field-change history saved in PostgreSQL
- Records page with search by customer, product, reference, or batch, and a status filter
- Validation for invalid files, blank messages, and outdated record versions

## Technology

| Part | Implementation |
| --- | --- |
| Frontend | React (Vite) |
| State management | Redux Toolkit and React Redux |
| Backend | Python and FastAPI |
| AI workflow | LangGraph `StateGraph` |
| LLM provider | Groq |
| Model | `openai/gpt-oss-120b` (configurable) |
| Database | PostgreSQL 17 with SQLAlchemy |
| Font | Google Inter (via Fontsource) |

### Note on the model

The assignment names `gemma2-9b-it`, with `llama-3.3-70b-versatile` as an alternative. [Groq has retired Gemma 2](https://console.groq.com/docs/deprecations), and Llama 3.3 70B was not available on the Groq account used for this project (requests returned HTTP 404). The project therefore uses [GPT OSS 120B on Groq](https://console.groq.com/docs/model/openai/gpt-oss-120b). Groq is still the provider, and the model can be changed with `GROQ_MODEL` in `.env`, as long as the replacement supports JSON output.

## How it works

```text
User message or uploaded file (React + Redux)
        │
        ▼
FastAPI  /api/assistant  or  /api/extract
        │
        ▼
LangGraph workflow
  START ─► choose tool ─┬─► log_complaint ───────┐
                        ├─► edit_complaint ──────┼─► assess_risk ─► check_completeness ─► END
                        └─► document_extraction ─┘
        │
        ▼
Saved to PostgreSQL, returned to the frontend
        │
        ▼
Log Customer Complaint form + AI risk assessment update
```

### API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/assistant` | Log or edit a complaint from a chat message |
| POST | `/api/extract` | Upload a document and extract complaint details |
| GET | `/api/complaints` | List the 100 most recently updated complaints |
| GET | `/api/complaints/{id}` | Get one complaint |
| POST | `/api/complaints/{id}/save` | Save (log) a complaint |

Interactive API docs are available at http://127.0.0.1:8000/docs while the backend is running.

## Getting started

### Prerequisites

- Python 3.12 or later
- Node.js 22 or later
- Docker Desktop (for PostgreSQL)
- A [Groq API key](https://console.groq.com/keys)

### 1. Install dependencies

From the project folder:

```bash
python -m venv .venv
```

Windows:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
```

macOS / Linux:

```bash
.venv/bin/python -m pip install -r backend/requirements-lock.txt
```

Then install the frontend:

```bash
cd frontend
npm ci
cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

- `GROQ_API_KEY`: your Groq API key
- `POSTGRES_PASSWORD`: any local database password (letters and numbers only, to avoid URL escaping)
- `DATABASE_URL`: use the same password here

Keep `.env` private. It is excluded from Git.

### 3. Run

Open Docker Desktop first.

**Windows**: run each script in its own PowerShell terminal:

```powershell
.\start-backend.ps1
```

```powershell
.\start-frontend.ps1
```

**macOS / Linux**: run each command in its own terminal:

```bash
docker compose up -d --wait db
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

```bash
cd frontend && npm run dev
```

Open http://127.0.0.1:5173.

PostgreSQL listens only on `127.0.0.1:5433`, and its data is stored in `data/postgres`. To stop the database without losing data, run `docker compose stop db`.

## Try the workflow

1. Click the sample complaint in Copilot and send it. The form fills automatically.
2. Open **AI risk assessment** to see severity, priority, reasoning, next action, root causes, and CAPA suggestions.
3. Send: `Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.`
4. Check that only these two fields changed. The risk assessment is generated again.
5. Click **Save complaint** to log the record for QA review.
6. Click **New complaint** and upload `samples/metformin-complaint.pdf`.
7. Send: `Sorry, the batch number is CHG260712A and affected quantity is 50 kg in 2 HDPE drums.`
8. Open **Records**, or refresh the page, to confirm the complaint was saved.

The `samples` folder also has an EML email and a plain-text complaint. All sample data is fictional.

## Tests

Offline workflow and document-parsing tests (no Groq calls):

```bash
python -m pytest tests/test_workflow.py -q
```

Live end-to-end test (needs both servers running; uses Groq credits and adds demo records):

```bash
python tests/live_workflow.py
```

Frontend production build:

```bash
cd frontend
npm run build
```

Use the Python from `.venv` for the test commands.

## Project structure

```text
backend/
  main.py             API endpoints and saving records
  ai.py               Groq calls and LangGraph workflow
  schemas.py          Complaint fields and response validation
  documents.py        PDF, DOCX, TXT, and EML text extraction
  database.py         PostgreSQL tables and connection
  config.py           Settings loaded from .env
frontend/src/
  App.jsx             Main layout and page selection
  ComplaintForm.jsx   Read-only form and AI risk assessment
  Copilot.jsx         Chat input and document upload
  Records.jsx         Saved complaints list and search
  Activity.jsx        Field-change history
  store.js            Redux state and async actions
  api.js              Requests to FastAPI
  styles.css          Styling
samples/              Fictional complaint documents
tests/                Automated and live workflow tests
compose.yaml          PostgreSQL container
```

## Limitations

This is an internship demonstration, not a validated production QMS.

- No login, user roles, or approval workflow. Do not expose the servers to the internet.
- The activity history is not an immutable compliance audit trail.
- Files are limited to 10 MB, PDFs to 50 pages, and extracted text to 24,000 characters.
- Image-only PDFs and standalone images are not supported (no OCR).
- Original files are not stored; only the extracted fields and chat are saved.
- A complaint needs at least a product name, batch number, and description before it can be saved.
- Editing a saved complaint with AI returns it to Draft so it can be reviewed again.
- AI output is validated for structure, but facts and risk judgments need human review.
