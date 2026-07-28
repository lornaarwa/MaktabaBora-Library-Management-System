# Task Checklist - Restructure to Brand Color Swatch & AppShell Layout

Track the progress of restructuring the application layout and brand color palette swatches.

---

## Phase 1: Color Palette & Global Context Setup
- [x] **Sub-phase 1.1**: Lock in exact swatch colors (`bark` `#64493a`, `tan` `#c9a57c`, `olive` `#c7cc80`, `cream` `#dec8b0`, `sage` `#a9b79e`, `paper` `#fbf7f1`, `ink` `#3a2b22`) in `tailwind.config.js` and `index.css`.
- [x] **Sub-phase 1.2**: Update `LibraryContext.jsx` with full state management and helper methods.
- [x] **Commit Hook 1**: `git commit -m "feat(context): restructure library context and refine brand color palette tokens"`

---

## Phase 2: AppShell & Layout Infrastructure
- [x] **Sub-phase 2.1**: Implement `AppShell.jsx` (Sidebar navigation, role switcher, active route styling).
- [x] **Commit Hook 2**: `git commit -m "feat(shell): implement AppShell layout with sidebar role switcher"`

---

## Phase 3: Page Restructuring & Views
- [x] **Sub-phase 3.1**: Restructure `PublicCatalog.jsx` (Visual book grid, filter chips, `BookCover`).
- [x] **Commit Hook 3**: `git commit -m "refactor(catalog): restructure Catalog page with warm swatch palette"`
- [x] **Sub-phase 3.2**: Restructure `MemberDashboard.jsx` (My Library loans, countdowns, fines).
- [x] **Commit Hook 4**: `git commit -m "refactor(member): restructure MyLibrary page for member interface"`
- [ ] **Sub-phase 3.3**: Restructure `LibrarianDashboard.jsx` (Circulation Desk fast barcode checkin/checkout & Inventory).
- [ ] **Commit Hook 5**: `git commit -m "refactor(staff): restructure CirculationDesk and Inventory pages"`
- [ ] **Sub-phase 3.4**: Restructure `AdminDashboard.jsx` (Admin Console analytics, live logs, API health).
- [ ] **Commit Hook 6**: `git commit -m "refactor(admin): restructure AdminConsole with live logs and health metrics"`
