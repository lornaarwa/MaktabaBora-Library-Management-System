# Task Checklist: Open Library Integration, Digital Reader Fix & Multi-Provider AI Librarian

Track implementation progress across phases and subphases with strict accountability, verification criteria, and git commit checkpoints.

---

## 📊 Overall Progress Summary
- **Phase 1: Digital Access & Reader Flow Fix** — 🟢 **COMPLETED** (Commits `1f5fccb`, `7053eeb`)
- **Phase 2: Open Library Integration & Seeding** — 🟢 **COMPLETED** (Commits `6f95a48`, `7bf815d`)
- **Phase 3: Multi-Provider AI Librarian & System Prompt Engine** — 🟡 **READY FOR IMPLEMENTATION**
- **Phase 4: Verification, Automated Testing & Documentation** — ⚪ **PENDING**

---

## Phase 1: Digital Access & Reader Flow Fix
- [x] **Sub-phase 1.1: Backend Access Resolution & Middleware Hardening**
  - **Goal**: Eliminate *"Digital reading access denied. Please purchase the book to unlock lifetime access."* by resolving both `book_id` and `digital_purchases.id` for the authenticated member/user.
  - **Key Changes**:
    - Updated `EnsureValidDigitalAccess.php` to resolve both `book_id` and `digital_purchases.id` and added staff bypass for admin/librarian review.
    - Updated `DigitalRentalService.php` `hasDigitalAccess()` to check entitlement across both `member_id` and `user_id`.
    - Updated `DigitalRentalController.php` `read()` to stream content for resolved book and `myLibrary()` to include full active purchase relations.
  - **Commit Hook 1**: `1f5fccb`
    ```bash
    git add backend/app/Http/Middleware/EnsureValidDigitalAccess.php backend/app/Services/DigitalRentalService.php backend/app/Http/Controllers/DigitalRentalController.php
    git commit -m "fix(backend): resolve digital reading access verification and support purchase ID fallback"
    ```

- [x] **Sub-phase 1.2: Frontend Member Library & Digital Reader Modal Upgrade**
  - **Goal**: Bind purchased book records properly in member digital library and provide interactive reader.
  - **Key Changes**:
    - Fixed `MemberDashboard.jsx` mapping so `item.book || item` correctly displays actual book titles and authors, and passes `book` to `handleReadDigital`.
    - Upgraded `DigitalReaderModal.jsx` to render an interactive `<iframe>` embed reader for Internet Archive (`https://archive.org/embed/{ia}`) and external streams, embed PDF for data URIs, and provide distraction-free Text View mode with page navigation.
  - **Commit Hook 2**: `7053eeb`
    ```bash
    git add frontend/src/pages/MemberDashboard.jsx frontend/src/components/DigitalReaderModal.jsx
    git commit -m "fix(frontend): bind purchased book properties and render embed stream in digital reader modal"
    ```

---

## Phase 2: Open Library Integration & Seeding
- [x] **Sub-phase 2.1: API-Compliant OpenLibraryService & Artisan Command**
  - **Goal**: Adhere strictly to [Open Library Developer API guidelines](https://openlibrary.org/developers/api) (identified User-Agent, <= 3 req/sec rate limit, batch endpoints, 24h caching, no HTML scraping).
  - **Key Changes**:
    - Created `backend/app/Services/OpenLibraryService.php` with:
      - Identified header: `User-Agent: SmartLibrarySystem/1.0 (dev@smartlibrary.org)`
      - 350ms throttle spacing between consecutive outbound requests.
      - 24-hour cache layer (`Cache::remember`) for `/subjects/{subject}.json` and `/search.json`.
      - Extracted covers (`https://covers.openlibrary.org/b/id/{id}-L.jpg`) and Internet Archive embeds (`https://archive.org/embed/{ia}`).
      - Automated physical `BookCopy` generation with barcodes and shelf rack locations.
    - Created `backend/app/Console/Commands/FetchOpenLibraryBooks.php` (`php artisan books:fetch-openlibrary {subject=technology} {--count=10}`).
    - Seeded real literature books into live database (Pride and Prejudice, Alice's Adventures in Wonderland, A Christmas Carol).
  - **Commit Hook 3**: `6f95a48`
    ```bash
    git add backend/app/Services/OpenLibraryService.php backend/app/Console/Commands/FetchOpenLibraryBooks.php
    git commit -m "feat(catalog): add API-compliant OpenLibraryService and fetch-openlibrary artisan command"
    ```

- [x] **Sub-phase 2.2: Staff 1-Click Open Library Search & Import UI**
  - **Goal**: Empower librarians and admins to search Open Library and import directly into the local catalog from the UI.
  - **Key Changes**:
    - Added `GET /api/v1/librarian/openlibrary/search` and `POST /api/v1/librarian/openlibrary/import` in `routes/api.php` and `LibrarianDashboardController.php`.
    - Added "Import Open Library" tab in `LibrarianDashboard.jsx` featuring 10 genre preset pills, live search bar, cover previews, IA E-Reader badges, and 1-click single/batch import.
  - **Commit Hook 4**: `7bf815d`
    ```bash
    git add backend/app/Http/Controllers/LibrarianDashboardController.php backend/routes/api.php frontend/src/pages/LibrarianDashboard.jsx frontend/src/services/api.js
    git commit -m "feat(staff): add interactive Open Library search and 1-click import to catalog"
    ```

---

## Phase 3: Multi-Provider AI Librarian & System Prompt Engine
- [ ] **Sub-phase 3.1: Multi-Provider AI Service & Configuration Storage**
  - **Goal**: Create extensible AI engine supporting Google Gemini, OpenAI, Anthropic Claude, and an Offline Grounded Fallback, with admin settings persistence.
  - **Tasks**:
    - Create `backend/app/Services/AiLibrarianManagerService.php`:
      - Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash` via `generativelanguage.googleapis.com`)
      - OpenAI (`gpt-4o-mini`, `gpt-4o` via `api.openai.com`)
      - Anthropic Claude (`claude-3-5-sonnet-20241022` via `api.anthropic.com`)
      - Offline Grounded Fallback (deterministic catalog + member account context)
      - Settings storage in `storage/app/ai_settings.json` (encrypted/masked keys).
    - Create `backend/app/Http/Controllers/AiSettingsController.php`:
      - `GET /api/v1/admin/ai-settings` (returns provider, model, masked keys, system prompt)
      - `PUT /api/v1/admin/ai-settings` (validates and saves provider config)
      - `POST /api/v1/admin/ai-settings/test-key` (pings provider API to test validity)
    - Register admin routes in `backend/routes/api.php`.
  - **Commit Hook 5**:
    ```bash
    git add backend/app/Services/AiLibrarianManagerService.php backend/app/Http/Controllers/AiSettingsController.php backend/routes/api.php
    git commit -m "feat(ai): implement multi-provider AI librarian manager with Gemini, OpenAI, and Anthropic support"
    ```

- [ ] **Sub-phase 3.2: System Prompt Navigation Guide & Database Catalog Recommendations**
  - **Goal**: Equip AI Librarian with a unified system prompt covering full website navigation and real catalog recommendations.
  - **Tasks**:
    - Configure System Prompt in `AiLibrarianManagerService`:
      - **Library Persona**: SmartLib / MaktabaBora AI Librarian.
      - **Website Navigation Guide**: Handles repetitive user questions by providing paths and guidance for `/catalog`, `/cart`, `/member` (loans, fines, digital reader), `/membership` (perks & upgrades), and `/books/:id`.
      - **Catalog Recommendation Rules**: Recommends real books from live database with availability (copies to borrow physically vs price to buy digitally).
      - **Account Context**: Answers loan due dates, renewal count, and overdue fine amounts.
    - Wire `AiChatbotController.php` to delegate to `AiLibrarianManagerService`.
    - Update `AiChatWidget.jsx` with navigation suggestion chips (e.g., *"How do I buy an e-book with M-Pesa?"*, *"Where can I see my active loans?"*, *"How do I upgrade to Pro?"*).
  - **Commit Hook 6**:
    ```bash
    git add backend/app/Services/OpenAiRecommendationService.php backend/app/Http/Controllers/AiChatbotController.php frontend/src/components/AiChatWidget.jsx
    git commit -m "feat(ai): equip AI librarian with site navigation prompt and live catalog recommendations"
    ```

- [ ] **Sub-phase 3.3: Admin Dashboard Provider Configuration Console**
  - **Goal**: Allow library administrators to change AI providers, enter API keys, select models, and test connections directly from the UI.
  - **Tasks**:
    - Add API methods in `frontend/src/services/api.js`: `getAiSettings`, `updateAiSettings`, `testAiKey`.
    - In `frontend/src/pages/AdminDashboard.jsx`, add an **"AI Librarian & Providers"** management tab:
      - Provider selection tabs (Google Gemini, OpenAI, Anthropic Claude, Offline Fallback).
      - API Key input field with toggle visibility and masked preview.
      - Model selection dropdown per provider.
      - System prompt editor with "Reset to Default" button.
      - "Test API Connection" button with live success/error badge.
      - Save Settings button with toast notifications.
  - **Commit Hook 7**:
    ```bash
    git add frontend/src/pages/AdminDashboard.jsx frontend/src/services/api.js
    git commit -m "feat(admin): add AI provider settings, key validation, and prompt customization console"
    ```

---

## Phase 4: Verification, Automated Testing & Final Polish
- [ ] **Sub-phase 4.1: Automated PHPUnit Tests**
  - **Goal**: Maintain 100% test pass rate with new test coverage for digital access, Open Library service, and AI settings.
  - **Tasks**:
    - Write test in `tests/Unit/Services/OpenLibraryServiceTest.php` verifying API headers, rate spacing, and JSON parsing.
    - Write test in `tests/Feature/Controllers/AiSettingsControllerTest.php` verifying settings persistence, authorization, and key masking.
    - Run full test suite: `php artisan test`.
  - **Commit Hook 8**:
    ```bash
    git add backend/tests/
    git commit -m "test: add test coverage for digital access, Open Library service, and AI settings"
    ```

- [ ] **Sub-phase 4.2: End-to-End User Verification & Walkthrough**
  - **Goal**: Complete task verification, verify dev servers, and produce thorough documentation.
  - **Tasks**:
    - Verify Member Dashboard digital reader with Internet Archive stream.
    - Verify Librarian Dashboard Open Library search and import.
    - Verify Admin Dashboard AI provider configuration and testing.
    - Verify AI Chatbot with navigation guidance chips and catalog recommendations.
    - Update `walkthrough.md` with complete documentation.
  - **Commit Hook 9**:
    ```bash
    git add task.md walkthrough.md
    git commit -m "chore: complete task checklist and document implementation walkthrough"
    ```
