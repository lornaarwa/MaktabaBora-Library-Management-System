# MaktabaBora Library Management System - Documentation Index

This directory contains the software engineering specifications, UML diagrams, presentation materials, and relational database schema documentation for the **MaktabaBora Library Management System**.

---

## 📚 Documentation Index

1. **[Comprehensive Technical Manual & System Documentation](MaktabaBora_System_Documentation.md)**
   - Complete, authoritative 15-part master system document covering institutional objectives, system architecture, database dictionary, UI walkthroughs, code highlights, APIs, testing, and deployment.

2. **[PowerPoint Technical Presentation (16:9 Widescreen)](MaktabaBora_System_Presentation.pptx)**
   - Executive 38-slide technical presentation deck containing all system architecture specifications, technology matrices, schema dictionaries, key code implementations, and all 11 embedded Horizontal A4 UML diagrams.

3. **[Master Architecture & Diagrams Specification](system_architecture_and_diagrams.md)**
   - Consolidated technical reference containing all UML diagrams, class structures, operational lifecycles, and database tables in a single document.

4. **[Use Case Diagram](use_case_diagram.md)**
   - Functional use cases and actor interactions for Guests, Members, Librarians, Administrators, Safaricom Daraja, and AI Gateways, formatted for Horizontal A4.

5. **[Sequence Diagrams](sequence_diagrams.md)**
   - 6 end-to-end operational sequence diagrams:
     - 5.1. Authentication & JWT Token Lifecycle
     - 5.2. Physical Book Circulation (Checkout, Returns & Overdue Fines)
     - 5.3. Hold Reservation Queue Lifecycle
     - 5.4. One-Time Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader
     - 5.5. Membership Perk Pass Subscription & Refund Flow
     - 5.6. Smart AI Librarian Assistant (Rate-Limited RAG Query Flow)

6. **[Class Diagrams](class_diagrams.md)**
   - Object-oriented structure with all attributes, types, relations, mutators, and methods:
     - 6.1. Eloquent Models Architecture (14 Models)
     - 6.2. REST Controllers Layer (15 Controllers in 4 Subsystems)
     - 6.3. Services & Contracts Layer (Domain Services & Rate Limiters)

7. **[Relational Database Schema & Data Dictionary](database_schema.md)**
   - Entity-Relationship (ER) Diagram
   - Comprehensive data dictionaries for all 17 PostgreSQL tables (`users`, `members`, `librarians`, `membership_tiers`, `books`, `book_copies`, `loans`, `reservations`, `fines`, `subscriptions`, `digital_books`, `digital_rentals`, `refund_requests`, `chat_sessions`, `chat_messages`, `ai_usage_logs`, `ai_system_settings`).

8. **[Visual Diagrams Gallery (Horizontal A4 PNG Images)](diagrams/README.md)**
   - High-resolution, standalone Horizontal A4 PNG image exports with title headers for all 11 diagrams ready for presentations, print, or direct inspection.
