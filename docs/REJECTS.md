# Rejects — Common Deductions From Past Projects

Source: instructor-supplied list of "reject codes" used to grade previous
semesters. Every item here is a real, documented point deduction. Treat
this as a pre-submission checklist in addition to the spec.

Format: `CODE` (–N points) — what triggers it · how we prevent it.

---

## Hard rejects (–5 points)

| Code | Trigger | Our prevention |
|---|---|---|
| **EMPTYREPORT** | Before any cost is added, the report must show 0 cost items in **each** category (all 5 categories present, each as `[]`). | `computeReport` reshapes against the full `CATEGORIES` enum so empty arrays appear for every category. Verified by test. |
| **ADDCOST** | `POST /api/add` (cost) fails. | Strict per-endpoint validation; integration test against in-memory Mongo. |
| **REPORT** | `GET /api/report` after a successful add fails or response shape doesn't match the spec sample. | Test that mirrors the grader's flow: add → fetch → diff against spec JSON. |
| **ABOUT** | `GET /api/about` fails or response shape wrong (must be `[ { first_name, last_name }, ... ]` only). | About handler hardcodes / `JSON.parse(TEAM_MEMBERS)`; no extra fields; covered by test. |
| **SLASH** | URL submitted on the form contains a redundant slash (e.g. `https://x.onrender.com//`). | When filling the submission form, paste the bare service origin — no trailing slash. |
| **URL** | Submitted URL is wrong / unreachable. | Smoke-test all 4 URLs from a clean browser/curl right before submitting. |
| **ATTENDANCE** | Team manager (or representative) doesn't attend the online testing meeting. | Calendar reminder once the date is published. |
| **FORM** | Submission form not filled. | Submission step in the checklist. |
| **USER** | User document properties don't match the required ones (wrong names or extras). | Response shapes are explicitly built (omit `_id`, `__v`); only the spec's properties returned. |

## Style / submission rejects (–3 points)

| Code | Trigger | Our prevention |
|---|---|---|
| **COMMENTS** | Missing comments in **English** (`//`, `/* */`). | "Comments pass" phase; English only; no 8–9 line stretch uncommented; computed-pattern function carries `/* */` block. |
| **PDFNAME** | PDF filename missing team manager's name (in English). | Submission step: name file `<firstname>_<lastname>.pdf`, lowercase ASCII. |
| **TWOFILES** | Required to upload 2 files (ZIP + PDF) but submitted differently — e.g. packing both inside one ZIP. | Upload PDF and ZIP **separately**; never nest the PDF inside the ZIP. |
| **FUNCTIONNAME** | Function naming wrong. Rule: lowercase only when single-word; `camelCase` for multi-word; `PascalCase` for constructors. Anonymous functions assigned to a variable: rule applies to the variable. | Naming convention baked into PLAN.md §"Naming conventions". |
| **VARIABLENAME** | Variable naming wrong. Same camelCase rule as functions. | Same. |
| **CLASSNAME** | Class names must start with capital; `PascalCase` if multi-word. | Same. |
| **FILENAME** | Filenames not lowercase, or use a separator other than `_`. | All files use `lowercase` or `lowercase_with_underscores.js`. |
| **CLICKABLE** | PDF doesn't include a clickable link to the YouTube demo video. | When generating the PDF, insert the link as an actual hyperlink (not raw text) — verify by clicking it inside the PDF before submitting. |
| **BROKENLINES** | Code lines wrap/break in the PDF. | Use a smaller font and/or landscape orientation when generating the PDF; verify visually before submitting. |
| **CODEFORMAT** | Code in PDF poorly aligned (right/center). | Force monospace + left-align in the PDF; spot-check every file. |
| **CONSTLET** | Use of `var`. Latest Node assumed — must use `const` (when value doesn't change) or `let`. | Lint rule + manual sweep; `var` is banned in this project. |

---

## How this changes the build plan

These items affect three things during coding (the rest are submission-time):

1. **Comments are in English.** No Hebrew/French/etc. in `//` or `/* */`.
2. **Naming conventions** — pinned in PLAN.md §"Naming conventions".
3. **Never use `var`** — `const` by default, `let` only when reassignment
   is needed.
4. **Response shapes never leak Mongoose internals** — every response
   builder explicitly picks the fields the spec lists, never `.toJSON()`
   without scrubbing `_id`/`__v`.
5. **Test the empty-database case** — first call to `/api/report` against
   a fresh DB must return all 5 categories as empty arrays.

The remaining items (PDFNAME, CLICKABLE, BROKENLINES, CODEFORMAT,
TWOFILES, SLASH, URL, ATTENDANCE, FORM) are pre-submission concerns and
live in the [submission checklist](REQUIREMENTS_CHECKLIST.md#submission-package).
