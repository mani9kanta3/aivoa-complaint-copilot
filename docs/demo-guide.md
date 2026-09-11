# Submission recording guide

The assignment requests two recordings: a working demonstration and a code walkthrough. Use the timings below as a guide for a 5-10 minute recording of each. Record yourself explaining the app in your own words.

## Before recording

Start Docker Desktop and both app servers. Open the application, the project folder in your editor, and the API docs. Close `.env` so the API key and password are not visible. Use only the fictional files in `samples`.

## Video 1 working demonstration

| Time | Demonstration |
| --- | --- |
| 0:00-0:45 | Explain the problem: pharmaceutical complaints arrive as text and documents and need structured intake. Show the read-only form and Copilot. |
| 0:45-2:00 | Click the Amoxicillin sample, send it, and show the populated customer, product, strength, batch, dates, quantity, and defect fields. |
| 2:00-3:00 | Open AI risk assessment. Explain severity, priority, evidence, and the suggested QA action. Show the completeness check and tentative root cause/CAPA suggestions. |
| 3:00-4:00 | Correct batch and quantity using the prompt below. Show both updated fields, unchanged customer/product details, and the updated risk summary. |
| 4:00-5:00 | Save the complaint, open Records, reopen it, and refresh the page. Show Activity. Explain Draft versus Logged. |
| 5:00-6:30 | Start a new complaint. Upload the Metformin PDF, send it, and inspect the extracted API grade and batch. |
| 6:30-7:30 | Correct the PDF complaint using the second prompt. Show the refreshed assessment and save it. |
| 7:30-8:30 | Demonstrate EML upload or an unsupported file error. Explain text-based PDF support and human review. |

Amoxicillin correction:

```text
Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules.
```

Metformin correction:

```text
Sorry, the batch number is CHG260712A and affected quantity is 50 kg in 2 HDPE drums.
```

## Video 2 code walkthrough

| Time | File and explanation |
| --- | --- |
| 0:00-0:45 | Explain React, Redux, FastAPI, LangGraph, Groq, and PostgreSQL. Explain the approved model substitution from the README. |
| 0:45-1:45 | `Copilot.jsx`: message state, attachment state, and the submit function. |
| 1:45-2:45 | `store.js` and `api.js`: Redux sends JSON or FormData and handles loading, success, and errors. |
| 2:45-3:45 | `main.py`: the two input endpoints, current complaint lookup, and version check. |
| 3:45-4:45 | `documents.py`: how PDF/email text is extracted and what happens to unsupported or scanned files. |
| 4:45-6:15 | `ai.py`: StateGraph, three tool paths, Groq JSON output, partial field updates, risk assessment, and completeness checking. |
| 6:15-7:15 | `schemas.py` and `database.py`: response validation and persistent records. |
| 7:15-8:15 | `ComplaintForm.jsx`: Redux data fills read-only fields and the risk panel. Demonstrate one correction while explaining the request-to-response path. |
| 8:15-9:00 | Show tests and discuss limits: no production authentication, no OCR, and all AI recommendations need QA review. |

## Prepare the repository

Publish only the project source, lockfiles, samples, documentation, and `.env.example`. Keep `.env`, `.venv`, `node_modules`, `.cache`, `data`, and logs out of the repository. The included `.gitignore` covers them.

The model substitution should remain visible in the README. Do not claim that Gemma or Llama was used in the completed app.

## Final submission

The assignment asks for a GitHub repository link and two video links through its submission form. Create the repository and recordings, verify the links can be viewed by the reviewers, then submit them using the form in the assignment document. The local project does not submit the form or publish files automatically.
