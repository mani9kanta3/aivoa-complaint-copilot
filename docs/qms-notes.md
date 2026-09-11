# QMS and customer complaint notes

A pharmaceutical Quality Management System records quality problems, supports investigation, and tracks the response. Its customer complaint module links a reported defect to the product, batch, customer, and actions taken.

API means active pharmaceutical ingredient, such as Metformin hydrochloride powder. FDF means finished dosage form, such as Amoxicillin 500 mg capsules. API complaints may involve purity, particles, drums, or liners. Finished-product complaints may involve capsules, tablets, labeling, seals, or blister packs.

## How this informed the app

ICH Q7 section 15 describes handling API quality complaints and maintaining records of the complainant, complaint nature, relevant product and batch, investigation, follow-up, and response. This informed the customer, contact, product, batch, description, and activity fields. [FDA's Q7 guidance](https://www.fda.gov/media/71518/download).

For finished drug products, 21 CFR 211.198 discusses written complaint procedures and quality-unit review of possible failures to meet specifications, including determining the need for investigation. This informed the distinction between an AI suggestion and a complaint logged for human QA review. [Official CFR text from GovInfo](https://www.govinfo.gov/link/cfr/21/211?link-type=pdf&year=mostrecent).

The app uses preliminary Minor, Major, Critical, and Needs review categories to demonstrate triage. These are project rules, not a complete or validated regulatory classification scheme. Unreported patient harm is treated as unknown rather than automatically absent.

Possible root causes and CAPA recommendations are hypotheses to review. CAPA means corrective and preventive action: investigate the problem, correct its cause when established, and reduce recurrence. The app does not claim to have established a root cause, approved a disposition, or completed an investigation.

The eight-field completeness check is intentionally small. A production QMS also needs controlled procedures, reviewer responsibilities, investigation records, approved actions, response tracking, access controls, retention policies, and validated audit trails. Those are outside this internship demonstration.

Reference workflow: [AIVOA complaint module video](https://drive.google.com/file/d/1av2lzDPx8YMSzTrIz7w51HTRWBz3_5Nj/view). The reference screenshot is retained in `references/reference-ui.png`.
