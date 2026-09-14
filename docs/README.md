# Smart Library System (SmartLib) - System Documentation Index

This directory contains the software engineering specifications, UML diagrams, and relational database schema documentation for the **Smart Library Management System**.

---

## 📚 Documentation Index

1. **[Master Architecture & Diagrams Specification](system_architecture_and_diagrams.md)**
   - Complete consolidated technical reference containing all UML diagrams, class structures, operational lifecycles, and database tables in a single document.

2. **[Use Case Diagram](use_case_diagram.md)**
   - Functional use cases and actor interactions for Guests, Members, Librarians, Administrators, Safaricom Daraja, and AI Gateways.

3. **[Sequence Diagrams](sequence_diagrams.md)**
   - 6 end-to-end operational sequence diagrams:
     - 2.1. Authentication & JWT Token Lifecycle
     - 2.2. Physical Book Circulation (Checkout, Returns & Overdue Fines)
     - 2.3. Hold Reservation Queue Lifecycle
     - 2.4. One-Time Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader
     - 2.5. Membership Perk Pass Subscription & Refund Flow
     - 2.6. Smart AI Librarian Assistant (Rate-Limited RAG Query Flow)

4. **[Class Diagrams](class_diagrams.md)**
   - Object-oriented structure with all attributes, types, relations, mutators, and methods:
     - 3.1. Eloquent Models Architecture (14 Models)
     - 3.2. REST Controllers Layer (15 Controllers)
     - 3.3. Services & Contracts Layer (Domain Services & Rate Limiters)

5. **[Relational Database Schema & Data Dictionary](database_schema.md)**
   - Entity-Relationship (ER) Diagram
   - Comprehensive data dictionaries for all 12+ PostgreSQL tables (`users`, `members`, `librarians`, `books`, `book_copies`, `loans`, `reservations`, `fines`, `subscriptions`, `digital_purchases`, `refund_requests`, `chat_sessions`, `chat_messages`, `ai_usage_logs`).

6. **[Visual Diagrams Gallery (PNG Images)](diagrams/README.md)**
   - High-resolution, standalone PNG image exports for all 11 diagrams ready for presentations, print, or direct inspection.

