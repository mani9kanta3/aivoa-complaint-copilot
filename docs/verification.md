# Verification results

Verified on September 11, 2026, using the local PostgreSQL database and the approved `openai/gpt-oss-120b` model through Groq.

## Completed checks

- 12 automated workflow and document-parsing tests passed.
- 18 live API checks passed through the frontend's API proxy.
- The React production build succeeded.
- React server rendering succeeded for the empty intake view, a populated complaint, and the AI risk panel. This is a component rendering check, not browser interaction testing.
- The generated PDF sample was rendered and visually inspected.
- Python source files were checked for comment tokens; none were present.

## Live workflow covered

The live run created an Amoxicillin complaint from text, corrected its batch and quantity, verified that other fields remained identical, checked the revised risk summary, logged the complaint, and read it back with its conversation intact.

It then extracted a Metformin PDF, including the IP/BP grade, changed its batch and quantity using natural language, verified the updated risk summary and unchanged fields, and logged that complaint. An EML email was also extracted with real Groq processing.

The run verified database health, outdated-version rejection, blank-message rejection, unsupported-file rejection, and field-change history.

Groq returned a temporary usage-limit response during the test. The application returned a clear error without saving the incomplete update. The test retried the same step after 30 seconds and completed successfully.

The live checks added fictional sample records. They are available in Records for demonstration. Existing records were not deleted.

## Not claimed

These checks do not establish regulatory compliance, clinical validity, production readiness, or browser-level accessibility certification. No GitHub repository was published, no submission form was sent, and no personal explanation videos were recorded by the application.
