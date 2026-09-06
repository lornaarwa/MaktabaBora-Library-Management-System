# Task Checklist: Open Library Integration, Digital Reader Fix & Multi-Provider AI Librarian

Track implementation progress across phases and subphases with strict accountability and git commit checkpoints.

---

## Phase 1: Digital Access & Reader Flow Fix
- [x] **Sub-phase 1.1: Backend Access Resolution & Middleware Hardening**
  - Update `EnsureValidDigitalAccess.php` to resolve both `book_id` and `digital_purchases.id` for the authenticated member/user.
  - Update `DigitalRentalService.php` to check active purchase entitlement across both `member_id` and `user_id`.
  - Update `DigitalRentalController.php` `read()` to stream content for resolved book and `myLibrary()` to include full book details.
- [x] **Commit Hook 1**: 
  ```bash
  git add backend/app/Http/Middleware/EnsureValidDigitalAccess.php backend/app/Services/DigitalRentalService.php backend/app/Http/Controllers/DigitalRentalController.php
  git commit -m "fix(backend): resolve digital reading access verification and support purchase ID fallback"
  ```

- [x] **Sub-phase 1.2: Frontend Member Library & Digital Reader Modal Upgrade**
  - Fix `MemberDashboard.jsx` so `digitalLibrary.map` extracts `const book = item.book || item`, displays actual book titles and authors, and passes `book` to `handleReadDigital`.
  - Upgrade `DigitalReaderModal.jsx` to render an interactive `<iframe>` embed reader when `activeBook.file_url` is an Internet Archive embed (`https://archive.org/embed/...`) or external stream, embed PDF for data URI / storage PDFs, and provide fallback pagination.
- [x] **Commit Hook 2**: 
  ```bash
  git add frontend/src/pages/MemberDashboard.jsx frontend/src/components/DigitalReaderModal.jsx
  git commit -m "fix(frontend): bind purchased book properties and render embed stream in digital reader modal"
  ```

---

## Phase 2: Open Library Integration & Seeding
- [x] **Sub-phase 2.1: API-Compliant OpenLibraryService & Artisan Command**
  - Create `backend/app/Services/OpenLibraryService.php` strictly following https://openlibrary.org/developers/api:
    - Identified `User-Agent: SmartLibrarySystem/1.0 (dev@smartlibrary.org)` header for 3 req/sec rate tier.
    - 350ms delay between consecutive requests with backoff handling.
    - Batch queries (`/subjects/{subject}.json` and `/search.json`) with 24-hour Laravel Cache (`Cache::remember`).
    - Parse title, authors, ISBN, genre, publication year, description, and official covers URL (`https://covers.openlibrary.org/b/id/{cover_i}-L.jpg`).
    - Capture public scans (`https://archive.org/embed/{ia}`) or generate high-quality fallback PDF stream.
    - Automatically create physical `BookCopy` records with barcodes and shelf rack locations.
  - Create `backend/app/Console/Commands/FetchOpenLibraryBooks.php` (`php artisan books:fetch-openlibrary {subject=technology} {--count=10}`).
- [x] **Commit Hook 3**: 
  ```bash
  git add backend/app/Services/OpenLibraryService.php backend/app/Console/Commands/FetchOpenLibraryBooks.php
  git commit -m "feat(catalog): add API-compliant OpenLibraryService and fetch-openlibrary artisan command"
  ```

- [x] **Sub-phase 2.2: Staff 1-Click Open Library Search & Import UI**
  - Add `GET /api/v1/librarian/openlibrary/search` and `POST /api/v1/librarian/openlibrary/import` in `routes/api.php` and `LibrarianDashboardController.php`.
  - Add "Import from Open Library" modal/section in `LibrarianDashboard.jsx` with genre preset chips, search input, cover preview, and one-click import button.
- [x] **Commit Hook 4**: 
  ```bash
  git add backend/app/Http/Controllers/LibrarianDashboardController.php backend/routes/api.php frontend/src/pages/LibrarianDashboard.jsx frontend/src/services/api.js
  git commit -m "feat(staff): add interactive Open Library search and 1-click import to catalog"
  ```

---

## Phase 3: Multi-Provider AI Librarian & System Prompt Engine
- [ ] **Sub-phase 3.1: Multi-Provider AI Service & Configuration Storage**
  - Create `backend/app/Services/AiLibrarianManagerService.php` supporting:
    - **Google Gemini** (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro` via Gemini REST API)
    - **OpenAI** (`gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`)
    - **Anthropic Claude** (`claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`)
    - **Offline Grounded Fallback** (deterministic catalog + member context)
  - Create `backend/app/Http/Controllers/AiSettingsController.php` with:
    - `GET /api/v1/admin/ai-settings`
    - `PUT /api/v1/admin/ai-settings`
    - `POST /api/v1/admin/ai-settings/test-key`
  - Store settings safely in `storage/app/ai_settings.json` with masked keys.
- [ ] **Commit Hook 5**: 
  ```bash
  git add backend/app/Services/AiLibrarianManagerService.php backend/app/Http/Controllers/AiSettingsController.php backend/routes/api.php
  git commit -m "feat(ai): implement multi-provider AI librarian manager with Gemini, OpenAI, and Anthropic support"
  ```

- [ ] **Sub-phase 3.2: System Prompt Navigation Guide & Database Catalog Recommendations**
  - Equip `AiLibrarianManagerService` with structured system prompt:
    - **Website Navigation Guide**: Handles repetitive queries with instructions on `/catalog`, `/cart`, `/member` (loans, fines, digital reader), `/membership` (perks & upgrades), and `/books/:id`.
    - **Book Recommendation Rules**: Recommends real books from the database with availability (copies to borrow vs price to buy digitally).
    - **Account Context**: Answers loan due dates, renewal count, and overdue fine amounts.
  - Wire into `AiChatbotController.php` and update `AiChatWidget.jsx` with navigation suggestion chips and clickable internal link formatting.
- [ ] **Commit Hook 6**: 
  ```bash
  git add backend/app/Services/OpenAiRecommendationService.php backend/app/Http/Controllers/AiChatbotController.php frontend/src/components/AiChatWidget.jsx
  git commit -m "feat(ai): equip AI librarian with site navigation prompt and live catalog recommendations"
  ```

- [ ] **Sub-phase 3.3: Admin Dashboard Provider Configuration Console**
  - Add dedicated **"AI Librarian & Providers"** tab in `AdminDashboard.jsx`.
  - Provide provider selector (Gemini, OpenAI, Anthropic, Offline), API key input with toggle, model selector, editable system prompt, "Test Connection" button, and save action.
- [ ] **Commit Hook 7**: 
  ```bash
  git add frontend/src/pages/AdminDashboard.jsx frontend/src/services/api.js
  git commit -m "feat(admin): add AI provider settings, key validation, and prompt customization console"
  ```

---

## Phase 4: Verification, Automated Testing & Final Polish
- [ ] **Sub-phase 4.1: Automated PHPUnit Tests**
  - Write test cases in `DigitalRentalControllerTest.php` for cart checkout multiple digital reading access and purchase ID fallback.
  - Write `tests/Unit/Services/OpenLibraryServiceTest.php` verifying API compliance, rate spacing, and book parsing.
  - Write `tests/Feature/Controllers/AiSettingsControllerTest.php` verifying settings management and key masking.
  - Execute full test suite `php artisan test` (100% pass).
- [ ] **Commit Hook 8**: 
  ```bash
  git add backend/tests/
  git commit -m "test: add test coverage for digital access, Open Library service, and AI settings"
  ```

- [ ] **Sub-phase 4.2: End-to-End User Verification & Walkthrough**
  - Verify purchase -> reader stream flow on Member Dashboard.
  - Verify 1-click Open Library import on Librarian Dashboard.
  - Verify AI Librarian prompt navigation and catalog recommendations in the chat widget.
  - Update `walkthrough.md` with verification steps and UI demonstrations.
- [ ] **Commit Hook 9**: 
  ```bash
  git add task.md walkthrough.md
  git commit -m "chore: complete task checklist and document implementation walkthrough"
  ```
