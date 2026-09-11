# Code walkthrough

## Start with the user's action

The user types in `frontend/src/Copilot.jsx`. Its `message` state contains the typed text. An uploaded file is held in local component state. Clicking Send calls `submit`, which dispatches the Redux `sendMessage` action.

The form itself is read-only. Its fields cannot be edited by typing directly into them. Corrections go through the same Copilot message input.

## Redux sends the request

`frontend/src/store.js` defines `sendMessage` using `createAsyncThunk`.

For text, it sends JSON to `POST /api/assistant`. For a file, it creates `FormData` and sends it to `POST /api/extract`. If a complaint is already open, it includes that complaint's ID and version. The request does not send a client-controlled copy of the complaint fields.

While waiting, Redux sets `busy` to true. Copilot shows a processing message and disables another submission. If the request fails, it displays the server error and keeps the user's typed message and attachment available to retry.

Vite forwards `/api` requests to FastAPI on port 8000. The API key is never included in frontend code or sent to the browser.

## FastAPI loads the existing complaint

The endpoints are in `backend/main.py`. They call `process_complaint`.

For edits, this function reads the current complaint from PostgreSQL. It checks the submitted version. An old version gets HTTP 409 instead of silently overwriting a newer record.

For new complaints, it starts with the empty fields defined in `ComplaintData` in `backend/schemas.py`.

## Documents become text

`backend/documents.py` handles extraction before the AI graph runs:

| File | How text is read |
| --- | --- |
| PDF | pypdf reads text from each page |
| DOCX | python-docx reads paragraphs and table cells |
| TXT | UTF-8 text decoding |
| EML | Python's email parser reads headers and the message body |

The function checks file type, size, text length, and PDF page count. It cannot perform OCR. If there is no useful text, it returns a clear error instead of inventing complaint details.

## LangGraph chooses a path

`backend/ai.py` creates a `StateGraph` with shared state. State is a dictionary containing the message, current complaint fields, document text, assessment, and execution steps.

`choose_tool` selects one of three named workflow nodes:

1. `document_extraction` when document text is present.
2. `edit_complaint` when an existing record is open.
3. `log_complaint` otherwise.

These are explicit Python functions inside LangGraph. The app does not rely on the LLM to choose a function or execute arbitrary tools.

Each path calls `extract_fields`. Groq returns a JSON object with `changes`, `clear_fields`, and `reply`. The response is validated with Pydantic before use. Unknown field names and invalid field types are rejected. A malformed response gets one retry; if it is still invalid, nothing is saved.

## Why edits preserve other fields

The code copies the existing dictionary and applies only the keys returned in `changes`. It removes a value only when its field is listed in `clear_fields`.

For example, if the current complaint has a product, customer, batch, quantity, and description, a request to change the batch and quantity should return just those two changed fields. Product, customer, and description remain in the copied dictionary.

This makes partial updates straightforward. It still depends on the model correctly identifying the requested changes. The tests check the exact before-and-after values for the demonstration corrections.

## Risk and completeness

After an actual field change, `assess_risk` makes a second Groq call using the complete updated complaint. It returns severity, priority, summary, rationale, next action, possible root causes, and CAPA recommendations. The priority is mapped consistently from severity in Python.

`check_completeness` then checks eight important fields using a normal Python dictionary. This is deterministic and does not require another AI call. A greeting that produces no complaint changes does not generate a risk assessment or create an empty database record.

## Save the result and update the interface

FastAPI saves the new data, assessment, chat messages, and changed-field history together. It checks the record version again during the database update to catch a second edit that happened while Groq was processing.

The API response contains the complete complaint. Redux replaces `current` with this response. `ComplaintForm.jsx` reads `current.data`; the assessment panel reads `current.risk`. React renders the updated values automatically. Changed fields have a subtle highlight.

Drafts are stored after successful AI processing. The **Save complaint** button separately changes Draft to Logged for QA review. Product name, batch number, and description are required for that action. An edit to a logged complaint makes it a draft again.

## Persistence

`backend/database.py` defines one PostgreSQL table using SQLAlchemy. Separate columns hold the ID, status, version, creation time, and update time. JSON columns hold complaint data, risk, messages, missing fields, and history.

Using JSON columns keeps this small assignment easy to follow. A larger production system would usually normalize customers, products, batches, investigations, and audit events into separate tables.

The browser stores only the last opened record ID in local storage. After refresh, it asks the backend for that record again. **Records** can reopen older complaints.

## Useful API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check database availability |
| GET | `/api/complaints` | List up to 100 recent complaints |
| GET | `/api/complaints/{id}` | Open one complaint |
| POST | `/api/assistant` | Create or edit using text |
| POST | `/api/extract` | Create or edit using a document |
| POST | `/api/complaints/{id}/save` | Log the complaint for QA review |

FastAPI's `/docs` page shows the request types and lets you inspect the API. The app is intended to run locally and does not implement authentication.
