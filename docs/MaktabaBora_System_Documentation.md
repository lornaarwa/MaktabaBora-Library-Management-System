# MaktabaBora Smart Library Management System
## Comprehensive Technical Manual, Architectural Specification & System Documentation

**System Name:** MaktabaBora Smart Library Management System  
**Version:** 1.0.0 (Production Release)  
**Target Environment:** Cross-Platform (PHP 8.2+ / Laravel 11.x, React 18, Tailwind CSS v4, PostgreSQL 16 / Neon Cloud)  
**Author / Engineering Team:** MaktabaBora Core Engineering  
**Document Classification:** Technical Architecture & Systems Manual  

---

## Executive Summary

**MaktabaBora** (Swahili for *"Superior Library"*) is an enterprise-grade, full-stack hybrid library management ecosystem designed to bridge physical book circulation with next-generation digital reading, automated mobile payment processing, and retrieval-augmented artificial intelligence (RAG).

Built with a headless **Laravel 11 RESTful API backend** and a high-performance **React 18 Single-Page Application (SPA)**, the platform replaces manual register-based tracking with automated borrowing workflows, granular role-based access control (RBAC), multi-currency book pricing, in-browser protected digital reading, and cashless fine settlement powered by Safaricom's Daraja 2.0 (M-Pesa) API (featuring a full simulated payment flow for safe, zero-cost evaluation).

```
+-----------------------------------------------------------------------------------------------+
|                                      MAKTABABORA PLATFORM                                     |
+------------------------------+-------------------------------+--------------------------------+
|       PATRON SERVICES        |       CIRCULATION DESK        |         ADMIN & AI CORE        |
+------------------------------+-------------------------------+--------------------------------+
| - Public Catalog & Search    | - Barcode Book Checkouts      | - Generative AI Librarian      |
| - FIFO Hold Queue Tracking   | - Automated Overdue Returns   | - Safaricom Daraja STK Push *  |
| - In-Browser Digital Reader  | - Fine Management & Waivers   | - Dynamic Membership Tiers     |
| - Multi-Tier Perk Passes     | - Open Library 1-Click Import | - System Usage Analytics       |
| - Downloadable Receipts      | - Custom Member Borrow Limits | - Dynamic Database Maintenance |
+------------------------------+-------------------------------+--------------------------------+
(* Simulated payment workflow for MVP evaluation)
```

---

## Table of Contents

1. [Objectives and Key Features](#1-objectives-and-key-features)
2. [System Architecture](#2-system-architecture)
3. [Technologies and Frameworks Used](#3-technologies-and-frameworks-used)
4. [Database Structure and Schema Dictionary](#4-database-structure-and-schema-dictionary)
5. [Frontend and Backend Structure](#5-frontend-and-backend-structure)
6. [Important Workflows and User Journeys](#6-important-workflows-and-user-journeys)
7. [Screenshots and UI Explanation](#7-screenshots-and-ui-explanation)
8. [Key Code Implementation Highlights](#8-key-code-implementation-highlights)
9. [APIs and Integrations](#9-apis-and-integrations)
10. [Security Considerations](#10-security-considerations)
11. [Challenges and Solutions](#11-challenges-and-solutions)
12. [Testing and Quality Assurance](#12-testing-and-quality-assurance)
13. [Deployment and Operations](#13-deployment-and-operations)
14. [Future Improvements and Roadmap](#14-future-improvements-and-roadmap)
15. [Conclusion](#15-conclusion)

---

## 1. Objectives and Key Features

### 1.1 Project Objectives
Traditional public, academic, and community libraries face critical operational bottlenecks: misplaced physical inventories, manual ledger bookkeeping, uncollected overdue penalties, lack of digital access for remote patrons, and opaque administrative tracking. 

MaktabaBora was engineered to achieve six core institutional goals:
1. **Automate Physical Circulation:** Eliminate manual paperwork via real-time barcode copy management, automated loan calculation, and dynamic overdue fine computation.
2. **Support Modern Hybrid Reading:** Combine physical lending with a secured, in-browser digital eBook reader (EPUB/PDF), supporting chapter navigation, reading progress persistence, and custom reading notes.
3. **Cashless Financial Operations:** Direct integration with **Safaricom Daraja M-Pesa**, providing frictionless mobile money STK push checkouts for membership passes, digital rentals, and overdue fines (operating with a simulated evaluation flow for safe zero-cost MVP testing).
4. **Intelligent Conversational Assistance:** An integrated **AI Librarian Assistant** powered by OpenAI and Google Gemini with Retrieval-Augmented Generation (RAG), strictly grounded in the library's physical and digital catalog.
5. **Catalog Interoperability:** Rapid collection expansion through automated 1-click ISBN metadata synchronization from the **Open Library REST API**.
6. **Data Privacy & Operational Security:** Strict stateless token authentication (JWT), complete separation of privileges (RBAC), and rigorous token-bucket cost limiters on AI services.

---

### 1.2 Key Feature Matrix by Module

```
+---------------------+-------------------------------------------------------------------------+
| Module              | Key Capabilities                                                        |
+---------------------+-------------------------------------------------------------------------+
| Access & Identity   | - Stateless HMAC-SHA256 JWT Authentication                              |
|                     | - Role-Based Access Control: Guest, Member, Librarian, Administrator    |
|                     | - First-time librarian password rotation requirement                    |
|                     | - Member suspension & ban reason enforcement                            |
+---------------------+-------------------------------------------------------------------------+
| Physical Inventory  | - Unique barcode copy tracking per physical volume                      |
| & Circulation       | - Flexible loan duration calculation with auto-generated return dates   |
|                     | - Tier-based borrowing quotas (e.g., General: 3, Student: 5, Scholar: 8)|
|                     | - Automated fine accrual (KES 10/day default overdue rate)              |
|                     | - Librarian fine waiver authority with mandatory audit logging          |
+---------------------+-------------------------------------------------------------------------+
| Hold Reservations   | - First-In-First-Out (FIFO) queue reservation system                    |
|                     | - Real-time queue position calculation                                  |
|                     | - Automated allocation when copies are checked back in                  |
|                     | - Digital hold reservation receipts with printable layout               |
+---------------------+-------------------------------------------------------------------------+
| Digital Library     | - One-time digital purchases granting lifetime web access               |
| & e-Reader          | - Multi-item shopping cart for digital assets                           |
|                     | - Integrated reader modal with light/dark/sepia theme switcher          |
|                     | - Font scaling, progress tracking, and chapter jump list                |
|                     | - User reading notes persisted to local storage                         |
+---------------------+-------------------------------------------------------------------------+
| Tiered Passes &     | - Configurable membership tiers (General, Student, Scholar, VIP)        |
| Subscriptions       | - Dynamic rental discount rates applied automatically in cart           |
|                     | - Automatic tier upgrade handling with previous subscription retirement |
|                     | - Patron refund requests with librarian review & audit trails           |
+---------------------+-------------------------------------------------------------------------+
| Cashless M-Pesa     | - Safaricom Daraja 2.0 STK Push integration (Simulated flow for MVP)    |
| Payments            | - Dynamic USD-to-KES currency conversion with 24-hour rate caching      |
|                     | - Real-time status polling fallback for local development environments  |
|                     | - Automatic loan clearance, subscription activation, and digital grant  |
+---------------------+-------------------------------------------------------------------------+
| AI Librarian &      | - Semantic search & TF-IDF cosine similarity book recommendations       |
| Search Engine       | - Conversational RAG assistant grounded strictly in catalog records     |
|                     | - AI anti-hallucination guardrails and PII protection filters            |
|                     | - Daily 20,000 token consumption cost limiter per member                |
|                     | - Dynamic OpenAI / Gemini provider switching with encrypted key storage |
+---------------------+-------------------------------------------------------------------------+
| Administration &    | - Global circulation metrics (active loans, overdue counts, revenue)    |
| Catalog Discovery   | - Dynamic CRUD data management console across all database tables       |
|                     | - 1-Click Open Library book and author import by ISBN or query          |
|                     | - Interactive member management: ban, unban, and borrow limit overrides |
+---------------------+-------------------------------------------------------------------------+
```

---

## 2. System Architecture

MaktabaBora adheres to a **decoupled, multi-tier Client-Server Architecture** operating over a secure RESTful API Gateway. The platform enforces strict separation of concerns across presentation, routing/middleware, controllers, domain services, data persistence, and external service adapters.

### 2.1 High-Level Architectural Flow

```
[ Frontend Client (React 18 + Vite 7 SPA) ]
                    │
                    ▼  HTTPS (JSON / Bearer JWT)
[ Laravel API Gateway & Middlewares ]
  ├── CORS Middleware (Cross-Origin Resource Sharing)
  ├── Rate Limiter (Token Bucket / IP Limiting)
  ├── JWT Validation (Stateless Signature & Blacklist Check)
  └── Role Guards (EnsureIsAdmin, EnsureIsLibrarian, EnsureIsMember)
                    │
                    ▼
[ REST Controllers Layer (HTTP Request / Response Formatting) ]
                    │
                    ▼  Dependency Injection (Contracts)
[ Application Services Layer (Pure Business Logic) ]
  ├── AuthSessionService           ├── DarajaPaymentService
  ├── BookAvailabilityService      ├── DigitalRentalService
  ├── BorrowLimitService           ├── CurrencyConverterService
  ├── CatalogRetrievalService      ├── BookEmbeddingService
  └── AiLibrarianManagerService    └── OpenLibraryService
                    │
                    ▼  Eloquent ORM
[ Data Persistence Layer ]
  ├── PostgreSQL 16 (Local & Neon Serverless Connection Pooling)
  ├── Redis / Cache Store (Token Blacklisting & Exchange Rates)
  └── SQLite Memory DB (Isolated Unit/Feature Testing)
                    │
                    ▼  External HTTPS Webhooks & APIs
[ External Gateways ]
  ├── Safaricom Daraja M-Pesa API (STK Push & Callbacks)
  ├── OpenAI / Google Gemini API (Vector Embeddings & RAG Chat)
  ├── Open Library API (ISBN Catalog Import)
  └── Open Exchange Rates API (USD / KES Real-Time Parity)
```

---

### 2.2 Architectural Layers

1. **Presentation Layer (`frontend/`):** A client-side Single-Page Application constructed with React 18 and Vite. It utilizes Tailwind CSS v4 for dynamic utility styling, Lucide React for consistent typography icons, and Framer Motion for UI micro-interactions. Client state is managed via specialized React contexts (`AuthContext`, `CartContext`).
2. **Routing & Gateway Layer (`backend/routes/api.php` & `bootstrap/app.php`):** Centralizes all API route registrations under the `/api/v1` namespace. Routes are wrapped in pipeline middleware stacks that validate CORS headers, decrypt tokens, enforce RBAC privileges, and evaluate patron eligibility before controller execution.
3. **Controller Layer (`backend/app/Http/Controllers/`):** Skinny HTTP adapters responsible strictly for parsing incoming requests, invoking FormRequest validation schemas, dispatching commands to domain services, and returning structured JSON responses (`200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable`, `500 Server Error`).
4. **Service Layer (`backend/app/Services/`):** The core business logic layer. Implemented against explicit PHP Interfaces (`backend/app/Contracts/Services/`), guaranteeing zero coupling to HTTP contexts. Services are reusable across CLI commands, queued workers, and controllers.
5. **Provider Layer (`backend/app/Providers/`):** Bootstrapping and dependency injection wiring. Binds contracts to concrete service singletons and configures security authorization gates (`Gate::define`).
6. **Data Persistence Layer (`backend/database/` & `backend/app/Models/`):** Driven by Eloquent ORM with relational integrity constraints (foreign keys, cascading deletions, unique indexes). Database connections dynamically support local PostgreSQL and Neon Serverless pooling.

---

### 2.3 System Use Case Diagram

The platform serves four primary human actors alongside two external service gateways:
- **Guest Patron:** An unauthenticated visitor browsing public books and viewing membership tiers.
- **Registered Member:** An authenticated patron who borrows physical books, reserves held copies, purchases eBooks, and interacts with the AI Assistant.
- **Librarian Staff:** A library officer operating the circulation desk, checking out copies, inspecting returns, waiving fines, approving refunds, and importing titles.
- **Administrator:** The institutional superuser managing user privileges, configuring AI credentials, monitoring revenue analytics, and overseeing database maintenance.
- **External Gateways:** Safaricom Daraja (M-Pesa payments) and OpenAI/Gemini (LLM conversational intelligence).

![MaktabaBora System Use Case Diagram](diagrams/use_case_diagram.png)

```mermaid
---
title: MAKTABABORA - SYSTEM USE CASE & ACTOR INTERACTION DIAGRAM
---
flowchart TD
    subgraph SYSTEM_BOUNDARY ["MaktabaBora System Boundary - Functional Architecture"]
        direction LR

        subgraph ACTORS ["Primary Actors"]
            direction TB
            Guest["👤 Guest Patron"]
            Member["🎓 Registered Member"]
            Librarian["📚 Librarian Staff"]
            Admin["⚙️ Administrator"]
        end

        subgraph PATRON_SERVICES ["Patron & Public Operations"]
            direction TB
            subgraph GUEST_OPS ["Public Operations"]
                UC1(["Browse & Search Catalog"])
                UC2(["View Book Details & Stock"])
                UC3(["View Dynamic Membership Tiers"])
                UC4(["Register Member / Login"])
                UC1 ~~~ UC2 ~~~ UC3 ~~~ UC4
            end
            subgraph MEMBER_OPS ["Member Operations"]
                UC5(["Borrow Physical Books"])
                UC6(["Place & Cancel Holds"])
                UC7(["Subscribe Pass (M-Pesa)"])
                UC8(["Request Subscription Refund"])
                UC9(["Purchase Digital Books"])
                UC10(["Read in In-App Reader"])
                UC11(["Pay Overdue Fines"])
                UC12(["View & Print Receipts"])
                UC13(["Query AI Librarian"])
                UC5 ~~~ UC7 ~~~ UC9 ~~~ UC11 ~~~ UC13
                UC6 ~~~ UC8 ~~~ UC10 ~~~ UC12
            end
        end

        subgraph STAFF_SERVICES ["Staff & Administrative Operations"]
            direction TB
            subgraph LIB_OPS ["Librarian Circulation"]
                UC14(["Check Out Barcode Copies"])
                UC15(["Return & Auto-Calculate Fines"])
                UC16(["Waive Patron Fines"])
                UC17(["Approve / Deny Hold Queue"])
                UC18(["Manage Catalog Books"])
                UC19(["Manage Physical Inventory"])
                UC20(["1-Click Import from Open Library"])
                UC21(["Set Member Borrow Limits"])
                UC22(["Process Subscription Refunds"])
                UC14 ~~~ UC16 ~~~ UC18 ~~~ UC20 ~~~ UC22
                UC15 ~~~ UC17 ~~~ UC19 ~~~ UC21
            end
            subgraph ADMIN_OPS ["System Administration"]
                UC23(["Manage System Users & Bans"])
                UC24(["Register & Assign Librarians"])
                UC25(["Customize Membership Tiers"])
                UC26(["Configure AI Provider & Keys"])
                UC27(["Dynamic Model Discovery"])
                UC28(["View Platform Analytics"])
                UC29(["Direct Dynamic CRUD Tables"])
                UC23 ~~~ UC25 ~~~ UC27 ~~~ UC29
                UC24 ~~~ UC26 ~~~ UC28
            end
        end

        subgraph EXTERNAL_SERVICES ["External Gateways"]
            direction TB
            DarajaGW["💳 Safaricom Daraja M-Pesa"]
            AiGW["🤖 OpenAI / Gemini API"]
            OpenLibGW["🌐 Open Library API"]
        end

        Guest --> GUEST_OPS
        Member --> MEMBER_OPS
        Librarian --> LIB_OPS
        Admin --> ADMIN_OPS

        UC7 -.->|STK Push| DarajaGW
        UC9 -.->|STK Push| DarajaGW
        UC11 -.->|STK Push| DarajaGW
        UC13 -.->|RAG Embeddings| AiGW
        UC20 -.->|ISBN Metadata| OpenLibGW
        UC27 -.->|Dynamic Models| AiGW
    end
```

---

## 3. Technologies and Frameworks Used

```
+---------------------+--------------------------------+-------------------------------------------------------+
| Category            | Technology / Tool              | Version & Purpose in MaktabaBora                      |
+---------------------+--------------------------------+-------------------------------------------------------+
| Backend Framework   | PHP                            | 8.2+ (Core server runtime, strict typing)             |
|                     | Laravel Framework              | 11.x (Headless REST API, Eloquent, Service Container) |
|                     | Composer                       | 2.x (PHP dependency management)                       |
+---------------------+--------------------------------+-------------------------------------------------------+
| Database & Caching  | PostgreSQL                     | 16.x (Primary relational engine, JSONB, foreign keys) |
|                     | Neon Serverless PostgreSQL     | Cloud DB with pooled & direct migration endpoints     |
|                     | SQLite                         | 3.x In-Memory (:memory:) for isolated unit testing    |
|                     | Redis / File Cache             | Session blacklisting, rate limiting & exchange rates  |
+---------------------+--------------------------------+-------------------------------------------------------+
| Frontend Client     | React                          | 18.3.1 (Component-based Single Page Application)      |
|                     | Vite                           | 7.0.7 (Lightning-fast frontend build & dev server)    |
|                     | React Router DOM               | 6.24.1 (Declarative client routing & protected routes)|
|                     | Tailwind CSS                   | 4.0.0 (High-performance utility-first styling)        |
|                     | Framer Motion                  | 12.43.0 (Fluid animations, drawer & modal dynamics)   |
|                     | Lucide React                   | 0.400.0 (Modern iconography suite)                    |
|                     | Axios                          | 1.11.0 (HTTP client with Bearer token interceptors)   |
+---------------------+--------------------------------+-------------------------------------------------------+
| AI & Machine        | OpenAI API                     | text-embedding-3-small & gpt-4o-mini (Catalog RAG)    |
| Learning            | Google Gemini API              | gemini-1.5-flash (Alternate AI conversational engine) |
|                     | TF-IDF & Cosine Similarity     | Pure PHP mathematical vector recommendation engine    |
+---------------------+--------------------------------+-------------------------------------------------------+
| External Services   | Safaricom Daraja 2.0           | Production STK push, query status & callback hooks    |
|                     | Open Library REST API          | ISBN metadata search & automated catalog import       |
|                     | Open Exchange Rates API        | Real-time USD to KES financial currency parity        |
+---------------------+--------------------------------+-------------------------------------------------------+
| Testing & Quality   | PHPUnit                        | 11.x (Comprehensive Unit & Feature test execution)    |
|                     | Laravel Tinker                 | Interactive REPL for runtime debugging & inspection   |
+---------------------+--------------------------------+-------------------------------------------------------+
| DevOps & Utilities  | Python 3                       | Automated A4 landscape diagram compositing            |
|                     | Mermaid CLI (@mermaid-js/mermaid-cli) | Automated SVG/PNG vector diagram rendering      |
|                     | Git                            | Version control with modular branch workflow          |
+---------------------+--------------------------------+-------------------------------------------------------+
```

---

## 4. Database Structure and Schema Dictionary

MaktabaBora uses a fully normalized **Third Normal Form (3NF) relational database schema** optimized for ACID compliance, referential integrity, and rapid indexed lookups.

### 4.1 Entity-Relationship (ER) Diagram

![MaktabaBora Database Schema ER Diagram](diagrams/database_schema_er_diagram.png)

```mermaid
---
title: MAKTABABORA - RELATIONAL DATABASE SCHEMA & ENTITY RELATIONSHIP DIAGRAM
---
erDiagram
    USERS ||--o| MEMBERS : "extends (patron)"
    USERS ||--o| LIBRARIANS : "extends (staff)"
    MEMBERS ||--o{ LOANS : "borrows"
    MEMBERS ||--o{ RESERVATIONS : "holds"
    MEMBERS ||--o{ SUBSCRIPTIONS : "subscribes"
    MEMBERS ||--o{ DIGITAL_RENTALS : "purchases"
    MEMBERS ||--o{ CHAT_SESSIONS : "initiates"
    MEMBERS ||--o{ AI_USAGE_LOGS : "consumes"
    MEMBERS ||--o{ REFUND_REQUESTS : "files"
    
    MEMBERSHIP_TIERS ||--o{ MEMBERS : "assigns tier"
    MEMBERSHIP_TIERS ||--o{ SUBSCRIPTIONS : "plans"

    BOOKS ||--|{ BOOK_COPIES : "contains physical"
    BOOKS ||--o| DIGITAL_BOOKS : "has digital format"
    BOOKS ||--o{ RESERVATIONS : "queued for"
    
    BOOK_COPIES ||--o{ LOANS : "issued in"
    LOANS ||--o| FINES : "incurs overdue"
    DIGITAL_BOOKS ||--o{ DIGITAL_RENTALS : "licensed in"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"

    USERS {
        bigint id PK
        string name
        string email UK
        string password
        enum role "admin, librarian, member"
        timestamp email_verified_at
        timestamp created_at
        timestamp updated_at
    }

    MEMBERS {
        bigint id PK
        bigint user_id FK
        string member_number UK
        string membership_tier "general, student, scholar, vip"
        int borrow_limit
        boolean is_subscribed
        boolean is_banned
        string ban_reason
        timestamp created_at
        timestamp updated_at
    }

    LIBRARIANS {
        bigint id PK
        bigint user_id FK
        string employee_number UK
        string phone_number
        boolean password_changed
        timestamp created_at
        timestamp updated_at
    }

    MEMBERSHIP_TIERS {
        bigint id PK
        string name UK
        string description
        decimal price
        int duration_days
        int borrow_limit
        decimal digital_discount_pct
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    BOOKS {
        bigint id PK
        string title
        string author
        string isbn UK
        string genre
        text description
        string cover_image_url
        int published_year
        int total_copies
        int available_copies
        decimal rental_price
        string foreign_currency
        decimal foreign_price
        boolean is_restricted
        vector_or_text embedding
        timestamp created_at
        timestamp updated_at
    }

    BOOK_COPIES {
        bigint id PK
        bigint book_id FK
        string barcode UK
        enum status "available, borrowed, reserved, damaged, lost"
        string location_shelf
        timestamp created_at
        timestamp updated_at
    }

    LOANS {
        bigint id PK
        bigint member_id FK
        bigint book_copy_id FK
        timestamp loan_date
        timestamp due_date
        timestamp returned_at
        enum status "active, returned, overdue"
        timestamp created_at
        timestamp updated_at
    }

    FINES {
        bigint id PK
        bigint loan_id FK
        decimal amount
        enum status "unpaid, paid, waived"
        timestamp paid_at
        string payment_reference
        timestamp created_at
        timestamp updated_at
    }

    RESERVATIONS {
        bigint id PK
        bigint member_id FK
        bigint book_id FK
        int queue_position
        enum status "pending, fulfilled, cancelled, expired"
        timestamp reserved_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    SUBSCRIPTIONS {
        bigint id PK
        bigint member_id FK
        bigint membership_tier_id FK
        timestamp start_date
        timestamp end_date
        enum status "active, expired, cancelled"
        string transaction_reference
        timestamp created_at
        timestamp updated_at
    }

    DIGITAL_BOOKS {
        bigint id PK
        bigint book_id FK
        string file_path
        string file_format "epub, pdf"
        bigint file_size_bytes
        boolean is_public_domain
        jsonb chapter_index
        timestamp created_at
        timestamp updated_at
    }

    DIGITAL_RENTALS {
        bigint id PK
        bigint member_id FK
        bigint digital_book_id FK
        timestamp rented_at
        timestamp expires_at
        enum access_type "lifetime_purchase, rental"
        decimal price_paid
        string transaction_reference
        timestamp created_at
        timestamp updated_at
    }

    CHAT_SESSIONS {
        bigint id PK
        bigint member_id FK
        string session_token UK
        timestamp last_active_at
        timestamp created_at
        timestamp updated_at
    }

    CHAT_MESSAGES {
        bigint id PK
        bigint chat_session_id FK
        enum sender "user, assistant, system"
        text message_content
        jsonb grounding_metadata
        timestamp created_at
    }

    AI_USAGE_LOGS {
        bigint id PK
        bigint member_id FK
        string model_used
        int prompt_tokens
        int completion_tokens
        int tokens_consumed
        timestamp created_at
    }

    AI_SYSTEM_SETTINGS {
        bigint id PK
        string active_provider "openai, gemini, offline"
        text encrypted_openai_key
        text encrypted_gemini_key
        string default_model
        decimal temperature
        int max_daily_tokens
        timestamp updated_at
    }

    REFUND_REQUESTS {
        bigint id PK
        bigint member_id FK
        bigint subscription_id FK
        decimal amount
        text reason
        enum status "pending, approved, rejected"
        bigint reviewed_by_librarian_id FK
        text librarian_notes
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }
```

---

### 4.2 Comprehensive Schema Table Dictionary

#### Table: `users`
Central identity repository for all actors.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `name` (VARCHAR(255), NOT NULL): Full legal name of the user.
- `email` (VARCHAR(255), UNIQUE, NOT NULL, Indexed): Authentication email.
- `password` (VARCHAR(255), NOT NULL): Bcrypt/Argon2 hashed password.
- `role` (ENUM('admin', 'librarian', 'member'), NOT NULL, Default: 'member'): Primary RBAC role.
- `email_verified_at` (TIMESTAMP, NULL): Email verification timestamp.
- `created_at`, `updated_at` (TIMESTAMP): Standard audit timestamps.

#### Table: `members`
Extended patron profile linked 1:1 with `users`.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `user_id` (BIGINT, FK -> users.id, ON DELETE CASCADE): User link.
- `member_number` (VARCHAR(64), UNIQUE, NOT NULL): System patron barcode ID (e.g. `MEM-4F8A9B`).
- `membership_tier` (VARCHAR(64), NOT NULL, Default: 'general'): Active tier identifier.
- `borrow_limit` (INT, NOT NULL, Default: 3): Max concurrent active loans.
- `is_subscribed` (BOOLEAN, NOT NULL, Default: false): Active perk pass indicator.
- `is_banned` (BOOLEAN, NOT NULL, Default: false): Account suspension toggle.
- `ban_reason` (TEXT, NULL): Mandatory explanation if suspended.

#### Table: `librarians`
Staff credentials and audit records.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `user_id` (BIGINT, FK -> users.id, ON DELETE CASCADE): User link.
- `employee_number` (VARCHAR(64), UNIQUE, NOT NULL): Staff employee ID.
- `phone_number` (VARCHAR(32), NULL): Official contact number.
- `password_changed` (BOOLEAN, NOT NULL, Default: false): Forces password reset on first login.

#### Table: `membership_tiers`
Dynamic subscription perk tiers configurable by the administrator.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `name` (VARCHAR(64), UNIQUE, NOT NULL): Tier title (e.g., General, Student, Scholar, VIP).
- `description` (TEXT, NULL): Marketing summary of perks.
- `price` (DECIMAL(10,2), NOT NULL): Pass subscription cost in KES.
- `duration_days` (INT, NOT NULL, Default: 30): Pass validity window.
- `borrow_limit` (INT, NOT NULL): Concurrent physical borrowing allowance.
- `digital_discount_pct` (DECIMAL(5,2), NOT NULL, Default: 0.00): Cart discount percentage.
- `is_active` (BOOLEAN, NOT NULL, Default: true): Soft toggle for tier availability.

#### Table: `books`
Physical and conceptual bibliographical catalog records.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `title` (VARCHAR(255), NOT NULL, Indexed): Full title.
- `author` (VARCHAR(255), NOT NULL, Indexed): Author or primary contributor.
- `isbn` (VARCHAR(32), UNIQUE, NOT NULL, Indexed): 10 or 13-digit ISBN.
- `genre` (VARCHAR(64), NOT NULL, Indexed): Categorical genre tag.
- `description` (TEXT, NULL): Synopsis.
- `cover_image_url` (VARCHAR(512), NULL): External or local media link.
- `published_year` (INT, NULL): Original publication year.
- `total_copies` (INT, NOT NULL, Default: 1): Physical volume count.
- `available_copies` (INT, NOT NULL, Default: 1): Current non-borrowed volumes.
- `rental_price` (DECIMAL(10,2), NOT NULL, Default: 0.00): Baseline digital purchase price (KES).
- `foreign_currency` (VARCHAR(8), NULL): Foreign currency code (e.g. USD, EUR, GBP).
- `foreign_price` (DECIMAL(10,2), NULL): Original foreign retail price.
- `is_restricted` (BOOLEAN, NOT NULL, Default: false): Reference-only flag (cannot be checked out).
- `embedding` (TEXT / JSONB, NULL): Pre-computed semantic vector embedding for fast catalog matching.

#### Table: `book_copies`
Individual physical book inventory items.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `book_id` (BIGINT, FK -> books.id, ON DELETE CASCADE): Parent title reference.
- `barcode` (VARCHAR(64), UNIQUE, NOT NULL, Indexed): Physical scan barcode.
- `status` (ENUM('available', 'borrowed', 'reserved', 'damaged', 'lost'), Default: 'available'): Current state.
- `location_shelf` (VARCHAR(64), NULL): Physical shelf classification coordinate (e.g., `A-03-TOP`).

#### Table: `loans`
Active and historic physical book borrowing transactions.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id, ON DELETE RESTRICT): Borrower.
- `book_copy_id` (BIGINT, FK -> book_copies.id, ON DELETE RESTRICT): Exact physical copy.
- `loan_date` (TIMESTAMP, NOT NULL): Issuance timestamp.
- `due_date` (TIMESTAMP, NOT NULL, Indexed): Return deadline.
- `returned_at` (TIMESTAMP, NULL): Actual check-in timestamp.
- `status` (ENUM('active', 'returned', 'overdue'), Default: 'active'): Loan state.

#### Table: `fines`
Overdue penalty charges.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `loan_id` (BIGINT, FK -> loans.id, ON DELETE CASCADE): Overdue loan reference.
- `amount` (DECIMAL(10,2), NOT NULL): Accrued fine in KES.
- `status` (ENUM('unpaid', 'paid', 'waived'), Default: 'unpaid'): Payment state.
- `paid_at` (TIMESTAMP, NULL): Settlement timestamp.
- `payment_reference` (VARCHAR(128), NULL): M-Pesa receipt code or waiver note.

#### Table: `reservations`
FIFO waitlist queue for checked-out titles.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id, ON DELETE CASCADE): Queued patron.
- `book_id` (BIGINT, FK -> books.id, ON DELETE CASCADE): Requested title.
- `queue_position` (INT, NOT NULL): Priority position (1, 2, 3...).
- `status` (ENUM('pending', 'fulfilled', 'cancelled', 'expired'), Default: 'pending'): Hold status.
- `reserved_at` (TIMESTAMP, NOT NULL): Creation time.
- `expires_at` (TIMESTAMP, NULL): Pick-up collection deadline once copy is available.

#### Table: `subscriptions`
Patron membership perk passes.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id, ON DELETE CASCADE): Subscriber.
- `membership_tier_id` (BIGINT, FK -> membership_tiers.id, ON DELETE RESTRICT): Selected tier.
- `start_date` (TIMESTAMP, NOT NULL): Pass activation date.
- `end_date` (TIMESTAMP, NOT NULL): Pass expiry date.
- `status` (ENUM('active', 'expired', 'cancelled'), Default: 'active'): Subscription state.
- `transaction_reference` (VARCHAR(128), NULL): Daraja M-Pesa receipt code.

#### Table: `digital_books`
Digital assets and reading metadata.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `book_id` (BIGINT, FK -> books.id, ON DELETE CASCADE): Parent book link.
- `file_path` (VARCHAR(512), NOT NULL): Path to secured file storage.
- `file_format` (ENUM('epub', 'pdf'), NOT NULL): Digital MIME format.
- `file_size_bytes` (BIGINT, NOT NULL): File payload byte length.
- `is_public_domain` (BOOLEAN, NOT NULL, Default: false): Free reading toggle.
- `chapter_index` (JSONB, NULL): Structured table of contents, word counts, and chapter anchors.

#### Table: `digital_rentals`
Patron digital book licenses.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id, ON DELETE CASCADE): Licensed patron.
- `digital_book_id` (BIGINT, FK -> digital_books.id, ON DELETE RESTRICT): Licensed digital book.
- `rented_at` (TIMESTAMP, NOT NULL): License issuance date.
- `expires_at` (TIMESTAMP, NULL): Expiry date (NULL represents lifetime access).
- `access_type` (ENUM('lifetime_purchase', 'rental'), Default: 'lifetime_purchase'): License tier.
- `price_paid` (DECIMAL(10,2), NOT NULL): Settled price after member discounts.
- `transaction_reference` (VARCHAR(128), NULL): M-Pesa transaction reference.

#### Table: `chat_sessions` & `chat_messages`
Conversational memory for the AI Librarian.
- **`chat_sessions`**: `id`, `member_id` (FK), `session_token` (UNIQUE), `last_active_at`.
- **`chat_messages`**: `id`, `chat_session_id` (FK), `sender` (user/assistant/system), `message_content` (TEXT), `grounding_metadata` (JSONB containing matched book IDs and similarity scores).

#### Table: `ai_usage_logs`
Fine-grained token audit trail preventing financial bill overruns.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id, ON DELETE CASCADE): Member consumer.
- `model_used` (VARCHAR(64), NOT NULL): AI model executed (e.g., `gpt-4o-mini`).
- `prompt_tokens`, `completion_tokens`, `tokens_consumed` (INT): Consumption metric.
- `created_at` (TIMESTAMP, Indexed): Timestamp used for rolling 24-hour cost window calculation.

#### Table: `ai_system_settings`
Encrypted configuration repository for administrative AI control.
- `id` (BIGINT, PK): Singleton configuration row.
- `active_provider` (ENUM('openai', 'gemini', 'offline')): Current LLM engine.
- `encrypted_openai_key`, `encrypted_gemini_key` (TEXT, NULL): OpenSSL encrypted credentials.
- `default_model` (VARCHAR(64)): Model name.
- `temperature` (DECIMAL(3,2), Default: 0.30): LLM sampling temperature.
- `max_daily_tokens` (INT, Default: 20000): Hard cap per member per 24 hours.

#### Table: `refund_requests`
Formal patron dispute and reimbursement auditing.
- `id` (BIGINT, PK, Auto Increment): Primary identifier.
- `member_id` (BIGINT, FK -> members.id): Requesting patron.
- `subscription_id` (BIGINT, FK -> subscriptions.id): Disputed pass.
- `amount` (DECIMAL(10,2), NOT NULL): Claimed refund value.
- `reason` (TEXT, NOT NULL): Patron explanation.
- `status` (ENUM('pending', 'approved', 'rejected'), Default: 'pending'): Workflow state.
- `reviewed_by_librarian_id` (BIGINT, FK -> librarians.id, NULL): Reviewing officer.
- `librarian_notes` (TEXT, NULL): Staff audit explanation.
- `reviewed_at` (TIMESTAMP, NULL): Resolution timestamp.

---

## 5. Frontend and Backend Structure

### 5.1 Repository Directory Structure

```text
MaktabaBora/
├── backend/                               # Headless Laravel 11 Application
│   ├── app/
│   │   ├── Contracts/Services/            # Strict PHP Service Interfaces
│   │   │   ├── AuthSessionServiceInterface.php
│   │   │   ├── BookAvailabilityServiceInterface.php
│   │   │   ├── BorrowLimitServiceInterface.php
│   │   │   ├── CatalogSearchEngineInterface.php
│   │   │   ├── CurrencyConverterServiceInterface.php
│   │   │   ├── DarajaPaymentServiceInterface.php
│   │   │   ├── DigitalRentalServiceInterface.php
│   │   │   ├── NotificationDispatcherServiceInterface.php
│   │   │   ├── OpenAiRecommendationServiceInterface.php
│   │   │   ├── QueueReservationServiceInterface.php
│   │   │   └── TokenBucketRateLimiterInterface.php
│   │   ├── Http/
│   │   │   ├── Controllers/               # REST API HTTP Controllers (18 classes)
│   │   │   │   ├── AdminAnalyticsController.php
│   │   │   │   ├── AdminCrudController.php
│   │   │   │   ├── AiChatbotController.php
│   │   │   │   ├── AiSettingsController.php
│   │   │   │   ├── ApiGatewayController.php
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── BookInventoryController.php
│   │   │   │   ├── BookRecommendationController.php
│   │   │   │   ├── CatalogSearchController.php
│   │   │   │   ├── DigitalRentalController.php
│   │   │   │   ├── FineController.php
│   │   │   │   ├── LibrarianDashboardController.php
│   │   │   │   ├── LibrarianPasswordChangeController.php
│   │   │   │   ├── LoanController.php
│   │   │   │   ├── MembershipTierController.php
│   │   │   │   ├── ReservationController.php
│   │   │   │   └── SubscriptionController.php
│   │   │   └── Middleware/                # Security Gates & Quota Limiters (20 classes)
│   │   │       ├── ApiGatewayProxy.php
│   │   │       ├── ChatbotCostLimiter.php
│   │   │       ├── CheckBannedStatus.php
│   │   │       ├── CheckBookAvailability.php
│   │   │       ├── CheckFineAmount.php
│   │   │       ├── CheckReservationAvailability.php
│   │   │       ├── CorsMiddleware.php
│   │   │       ├── EnsureActiveSubscription.php
│   │   │       ├── EnsureHasAccount.php
│   │   │       ├── EnsureIsAdmin.php
│   │   │       ├── EnsureIsLibrarian.php
│   │   │       ├── EnsureIsMember.php
│   │   │       ├── EnsurePasswordChangeNotRequired.php
│   │   │       ├── EnsureValidDigitalAccess.php
│   │   │       ├── EnsureValidRefundRequest.php
│   │   │       ├── IpRateLimiter.php
│   │   │       ├── JwtTokenValidation.php
│   │   │       ├── ThrottleRequestsMiddleware.php
│   │   │       ├── TrustProxiesMiddleware.php
│   │   │       └── ValidateBorrowLimit.php
│   │   ├── Models/                        # Eloquent ORM Active Record Models (17 classes)
│   │   │   ├── AiSystemSetting.php
│   │   │   ├── AiUsageLog.php
│   │   │   ├── Book.php
│   │   │   ├── BookCopy.php
│   │   │   ├── ChatMessage.php
│   │   │   ├── ChatSession.php
│   │   │   ├── DigitalBook.php
│   │   │   ├── DigitalRental.php
│   │   │   ├── Fine.php
│   │   │   ├── Librarian.php
│   │   │   ├── Loan.php
│   │   │   ├── Member.php
│   │   │   ├── MembershipTier.php
│   │   │   ├── RefundRequest.php
│   │   │   ├── Reservation.php
│   │   │   ├── Subscription.php
│   │   │   └── User.php
│   │   ├── Providers/                     # IoC Service Container Bindings (6 classes)
│   │   │   ├── AiChatbotServiceProvider.php
│   │   │   ├── AppServiceProvider.php
│   │   │   ├── AuthServiceProvider.php
│   │   │   ├── FinePaymentServiceProvider.php
│   │   │   ├── LibraryEventServiceProvider.php
│   │   │   └── SearchCatalogProvider.php
│   │   └── Services/                      # Pure Domain Business Logic (19 classes)
│   │       ├── AiLibrarianManagerService.php
│   │       ├── AuthSessionService.php
│   │       ├── BookAvailabilityService.php
│   │       ├── BookEmbeddingService.php
│   │       ├── BookRecommendationService.php
│   │       ├── BorrowLimitService.php
│   │       ├── CatalogRetrievalService.php
│   │       ├── CatalogSearchEngine.php
│   │       ├── CurrencyConverterService.php
│   │       ├── DarajaPaymentService.php
│   │       ├── DigitalRentalService.php
│   │       ├── LibrarianAuthService.php
│   │       ├── NotificationDispatcherService.php
│   │       ├── OpenAiRecommendationService.php
│   │       ├── OpenLibraryService.php
│   │       ├── QueueReservationService.php
│   │       ├── RefundManagementService.php
│   │       ├── TextSimilarity.php
│   │       └── TokenBucketRateLimiter.php
│   ├── bootstrap/
│   │   ├── app.php                        # Middleware stack & exception handling
│   │   └── providers.php                  # Service provider registry
│   ├── config/
│   │   ├── app.php
│   │   ├── database.php                   # PostgreSQL, Neon & SQLite configurations
│   │   └── services.php                   # M-Pesa, OpenAI, Gemini & Exchange credentials
│   ├── database/
│   │   ├── migrations/                    # 17 Schema migration files
│   │   └── seeders/                       # Database seeders with test users & catalog
│   ├── routes/
│   │   └── api.php                        # All /api/v1 REST endpoint declarations
│   └── tests/
│       ├── Feature/                       # 47 End-to-end HTTP pipeline tests
│       └── Unit/                          # 80 Isolated unit tests
│
├── frontend/                              # React 18 + Vite 7 Client Application
│   ├── public/
│   │   └── brand/                         # Brand identity assets
│   │       └── maktababora-logo.jpeg
│   ├── src/
│   │   ├── components/                    # Reusable React UI Components
│   │   │   ├── AiChatWidget.jsx           # Grounded AI Librarian conversational modal
│   │   │   ├── BookCard.jsx               # Catalog book display with rental pricing
│   │   │   ├── BookMiniCard.jsx           # Compact book preview
│   │   │   ├── DarajaPayModal.jsx         # Safaricom M-Pesa STK push checkout modal
│   │   │   ├── DigitalReaderModal.jsx     # In-browser EPUB/PDF reader with chapters
│   │   │   ├── Footer.jsx                 # Global site footer
│   │   │   ├── Navbar.jsx                 # Global navigation & authentication state
│   │   │   ├── ReceiptModal.jsx           # Printable hold & payment receipt generator
│   │   │   └── SubscriptionPassModal.jsx  # Membership tier upgrade & checkout modal
│   │   ├── context/                       # Global React Context State Managers
│   │   │   ├── AuthContext.jsx            # User state, JWT token storage, login/logout
│   │   │   └── CartContext.jsx            # Multi-item digital cart state & discounts
│   │   ├── pages/                         # Core Application Page Views (13 pages)
│   │   │   ├── About.jsx                  # Institutional overview
│   │   │   ├── AdminDashboard.jsx         # Administrative control & analytics console
│   │   │   ├── BookDetails.jsx            # Full book overview, stock, holds, and rental
│   │   │   ├── CartPage.jsx               # Digital book shopping cart checkout
│   │   │   ├── Contact.jsx                # Support & feedback channels
│   │   │   ├── Home.jsx                   # Public hero landing page & featured books
│   │   │   ├── LibrarianDashboard.jsx     # Circulation desk, loans, returns, waivers
│   │   │   ├── Login.jsx                  # Portal authentication for all roles
│   │   │   ├── MemberDashboard.jsx        # Patron active loans, holds, passes, reader
│   │   │   ├── MembershipRegistration.jsx # Patron sign-up with optional STK push pass
│   │   │   ├── PrivacyPolicy.jsx          # Institutional data governance statement
│   │   │   ├── Profile.jsx                # Member profile & security settings
│   │   │   └── PublicCatalog.jsx          # Filterable, searchable public book catalog
│   │   ├── services/
│   │   │   └── api.js                     # Axios instance configured with JWT interceptors
│   │   ├── app.jsx                        # Main route declarations & provider wrappers
│   │   └── app.js                         # Application entrypoint
│   └── package.json
│
└── docs/                                  # Project Documentation & Architecture
    ├── diagrams/                          # High-Res 2970x2100 A4 Landscape PNG Diagrams
    └── MaktabaBora_System_Documentation.md # Master Comprehensive Documentation (This File)
```

---

### 5.2 Class Diagrams

The object-oriented design of MaktabaBora strictly separates data models from HTTP controllers and domain services.

#### 1. Eloquent Models Architecture
Models encapsulate table attributes, casting rules, and Eloquent relationships (`belongsTo`, `hasMany`, `hasOne`).

![MaktabaBora Models Class Diagram](diagrams/class_diagram_01_models.png)

```mermaid
---
title: MAKTABABORA - ELOQUENT DATA MODELS ARCHITECTURE
---
classDiagram
    direction TB

    class User {
        +bigint id
        +string name
        +string email
        +string password
        +string role
        +member() HasOne
        +librarian() HasOne
    }

    class Member {
        +bigint id
        +bigint user_id
        +string member_number
        +string membership_tier
        +int borrow_limit
        +boolean is_subscribed
        +boolean is_banned
        +string ban_reason
        +user() BelongsTo
        +loans() HasMany
        +reservations() HasMany
        +subscriptions() HasMany
        +digitalRentals() HasMany
        +chatSessions() HasMany
        +aiUsageLogs() HasMany
        +refundRequests() HasMany
    }

    class Librarian {
        +bigint id
        +bigint user_id
        +string employee_number
        +string phone_number
        +boolean password_changed
        +user() BelongsTo
        +reviewedRefunds() HasMany
    }

    class Book {
        +bigint id
        +string title
        +string author
        +string isbn
        +string genre
        +text description
        +string cover_image_url
        +int total_copies
        +int available_copies
        +decimal rental_price
        +decimal foreign_price
        +boolean is_restricted
        +copies() HasMany
        +digitalBook() HasOne
        +reservations() HasMany
    }

    class BookCopy {
        +bigint id
        +bigint book_id
        +string barcode
        +string status
        +string location_shelf
        +book() BelongsTo
        +loans() HasMany
    }

    class Loan {
        +bigint id
        +bigint member_id
        +bigint book_copy_id
        +timestamp loan_date
        +timestamp due_date
        +timestamp returned_at
        +string status
        +member() BelongsTo
        +bookCopy() BelongsTo
        +fine() HasOne
    }

    class Fine {
        +bigint id
        +bigint loan_id
        +decimal amount
        +string status
        +timestamp paid_at
        +string payment_reference
        +loan() BelongsTo
    }

    class Reservation {
        +bigint id
        +bigint member_id
        +bigint book_id
        +int queue_position
        +string status
        +timestamp reserved_at
        +timestamp expires_at
        +member() BelongsTo
        +book() BelongsTo
    }

    class Subscription {
        +bigint id
        +bigint member_id
        +bigint membership_tier_id
        +timestamp start_date
        +timestamp end_date
        +string status
        +string transaction_reference
        +member() BelongsTo
        +tier() BelongsTo
        +refundRequest() HasOne
    }

    class MembershipTier {
        +bigint id
        +string name
        +decimal price
        +int duration_days
        +int borrow_limit
        +decimal digital_discount_pct
        +boolean is_active
        +subscriptions() HasMany
    }

    class DigitalBook {
        +bigint id
        +bigint book_id
        +string file_path
        +string file_format
        +bigint file_size_bytes
        +jsonb chapter_index
        +book() BelongsTo
        +rentals() HasMany
    }

    class DigitalRental {
        +bigint id
        +bigint member_id
        +bigint digital_book_id
        +timestamp rented_at
        +timestamp expires_at
        +string access_type
        +decimal price_paid
        +member() BelongsTo
        +digitalBook() BelongsTo
    }

    class ChatSession {
        +bigint id
        +bigint member_id
        +string session_token
        +timestamp last_active_at
        +member() BelongsTo
        +messages() HasMany
    }

    class ChatMessage {
        +bigint id
        +bigint chat_session_id
        +string sender
        +text message_content
        +jsonb grounding_metadata
        +session() BelongsTo
    }

    class AiUsageLog {
        +bigint id
        +bigint member_id
        +string model_used
        +int prompt_tokens
        +int completion_tokens
        +int tokens_consumed
        +member() BelongsTo
    }

    class AiSystemSetting {
        +bigint id
        +string active_provider
        +text encrypted_openai_key
        +text encrypted_gemini_key
        +string default_model
        +decimal temperature
        +int max_daily_tokens
    }

    class RefundRequest {
        +bigint id
        +bigint member_id
        +bigint subscription_id
        +decimal amount
        +text reason
        +string status
        +bigint reviewed_by_librarian_id
        +member() BelongsTo
        +subscription() BelongsTo
        +reviewer() BelongsTo
    }

    User "1" *-- "0..1" Member
    User "1" *-- "0..1" Librarian
    Member "1" *-- "0..*" Loan
    Member "1" *-- "0..*" Reservation
    Member "1" *-- "0..*" Subscription
    Member "1" *-- "0..*" DigitalRental
    Member "1" *-- "0..*" ChatSession
    Member "1" *-- "0..*" AiUsageLog
    Member "1" *-- "0..*" RefundRequest
    Book "1" *-- "1..*" BookCopy
    Book "1" *-- "0..1" DigitalBook
    Book "1" *-- "0..*" Reservation
    BookCopy "1" *-- "0..*" Loan
    Loan "1" *-- "0..1" Fine
    MembershipTier "1" *-- "0..*" Subscription
    DigitalBook "1" *-- "0..*" DigitalRental
    ChatSession "1" *-- "1..*" ChatMessage
    Librarian "1" *-- "0..*" RefundRequest
```

---

#### 2. REST Controllers Layer
Controllers handle HTTP input validation and response transformations.

![MaktabaBora Controllers Class Diagram](diagrams/class_diagram_02_controllers.png)

```mermaid
---
title: MAKTABABORA - REST CONTROLLERS ARCHITECTURE
---
classDiagram
    direction TB

    class Controller {
        <<abstract>>
    }

    class AuthController {
        -AuthSessionServiceInterface authService
        +register(Request) JsonResponse
        +registerMembershipStk(Request) JsonResponse
        +login(Request) JsonResponse
        +me(Request) JsonResponse
        +updateProfile(Request) JsonResponse
        +refresh(Request) JsonResponse
        +logout(Request) JsonResponse
    }

    class BookInventoryController {
        +index(Request) JsonResponse
        +show(Book) JsonResponse
        +store(Request) JsonResponse
        +update(Request, Book) JsonResponse
        +destroy(Book) JsonResponse
    }

    class LoanController {
        +index(Request) JsonResponse
        +checkout(Request) JsonResponse
        +returnBook(Loan) JsonResponse
    }

    class ReservationController {
        -QueueReservationServiceInterface queueService
        +index(Request) JsonResponse
        +store(Request) JsonResponse
        +destroy(Reservation) JsonResponse
    }

    class FineController {
        -DarajaPaymentServiceInterface darajaService
        +index(Request) JsonResponse
        +payWithDaraja(Fine, Request) JsonResponse
        +darajaCallback(Request) JsonResponse
        +waive(Fine) JsonResponse
    }

    class DigitalRentalController {
        -DigitalRentalServiceInterface rentalService
        +myLibrary(Request) JsonResponse
        +purchase(Request, int) JsonResponse
        +checkoutCart(Request) JsonResponse
        +read(Request, int) JsonResponse
    }

    class SubscriptionController {
        -DarajaPaymentServiceInterface darajaService
        +checkout(Request) JsonResponse
        +status(Request) JsonResponse
        +cancel(Request) JsonResponse
        +requestRefund(Request) JsonResponse
        +refundStatus(Request) JsonResponse
    }

    class AiChatbotController {
        -AiLibrarianManagerService aiManager
        +chat(Request) JsonResponse
        +clearChat(Request) JsonResponse
    }

    class LibrarianDashboardController {
        -OpenLibraryService openLibrary
        +metrics() JsonResponse
        +members() JsonResponse
        +configureBorrowLimit(Member, Request) JsonResponse
        +toggleBookRestriction(Book) JsonResponse
        +bookCopies() JsonResponse
        +storeBookCopy(Request) JsonResponse
        +updateBookCopy(Request, BookCopy) JsonResponse
        +deleteBookCopy(BookCopy) JsonResponse
        +activeLoans() JsonResponse
        +subscriptions() JsonResponse
        +reimbursements() JsonResponse
        +reviewReimbursement(Request, int) JsonResponse
        +getRefundRequests() JsonResponse
        +approveRefund(int) JsonResponse
        +rejectRefund(int, Request) JsonResponse
        +searchOpenLibrary(Request) JsonResponse
        +importOpenLibrary(Request) JsonResponse
        +reservations() JsonResponse
        +approveReservation(Reservation) JsonResponse
        +denyReservation(Reservation) JsonResponse
    }

    class AdminDashboardController {
        +users() JsonResponse
        +toggleUserBan(User, Request) JsonResponse
        +createLibrarian(Request) JsonResponse
        +analytics() JsonResponse
    }

    class AdminCrudController {
        +tables() JsonResponse
        +getTableData(string, Request) JsonResponse
        +createRecord(string, Request) JsonResponse
        +updateRecord(string, string, Request) JsonResponse
        +deleteRecord(string, string) JsonResponse
    }

    Controller <|-- AuthController
    Controller <|-- BookInventoryController
    Controller <|-- LoanController
    Controller <|-- ReservationController
    Controller <|-- FineController
    Controller <|-- DigitalRentalController
    Controller <|-- SubscriptionController
    Controller <|-- AiChatbotController
    Controller <|-- LibrarianDashboardController
    Controller <|-- AdminDashboardController
    Controller <|-- AdminCrudController
```

---

#### 3. Services and Contracts Layer
Domain services encapsulate pure business rules and external API communication.

![MaktabaBora Services Class Diagram](diagrams/class_diagram_03_services.png)

```mermaid
---
title: MAKTABABORA - DOMAIN SERVICES & CONTRACTS ARCHITECTURE
---
classDiagram
    direction TB

    class AuthSessionServiceInterface {
        <<interface>>
        +createSessionToken(User, bool) string
        +validateSessionToken(string) ?User
        +invalidateSessionToken(string) bool
        +generateToken(User, bool) string
        +generateAccessToken(User) string
    }

    class AuthSessionService {
        -string secret
        +createSessionToken(User, bool) string
        +validateSessionToken(string) ?User
        +invalidateSessionToken(string) bool
        +generateToken(User, bool) string
        -buildJwt(User, string, int) string
        -validateToken(string) ?array
        -blacklistToken(string) void
    }

    class DarajaPaymentServiceInterface {
        <<interface>>
        +initiateStkPush(string, decimal, string, string) array
        +queryTransactionStatus(string) array
    }

    class DarajaPaymentService {
        -string consumerKey
        -string consumerSecret
        -string passkey
        -string shortcode
        +initiateStkPush(string, decimal, string, string) array
        +queryTransactionStatus(string) array
        -generateAccessToken() string
        -formatPhoneNumber(string) string
    }

    class DigitalRentalServiceInterface {
        <<interface>>
        +purchaseDigitalBook(Member, DigitalBook, ?string) DigitalRental
        +checkoutCart(Member, array, string) array
        +verifyAccess(Member, DigitalBook) bool
    }

    class DigitalRentalService {
        +purchaseDigitalBook(Member, DigitalBook, ?string) DigitalRental
        +checkoutCart(Member, array, string) array
        +verifyAccess(Member, DigitalBook) bool
        -calculateMemberDiscount(Member, decimal) decimal
    }

    class BookAvailabilityServiceInterface {
        <<interface>>
        +isBookAvailable(Book) bool
        +getAvailableCopy(Book) ?BookCopy
    }

    class BookAvailabilityService {
        +isBookAvailable(Book) bool
        +getAvailableCopy(Book) ?BookCopy
    }

    class BorrowLimitServiceInterface {
        <<interface>>
        +canMemberBorrow(Member) bool
        +getRemainingBorrowCount(Member) int
    }

    class BorrowLimitService {
        +canMemberBorrow(Member) bool
        +getRemainingBorrowCount(Member) int
    }

    class QueueReservationServiceInterface {
        <<interface>>
        +enqueueHold(Member, Book) Reservation
        +cancelHold(Reservation) bool
        +fulfillNextInQueue(Book) ?Reservation
    }

    class QueueReservationService {
        +enqueueHold(Member, Book) Reservation
        +cancelHold(Reservation) bool
        +fulfillNextInQueue(Book) ?Reservation
    }

    class CurrencyConverterServiceInterface {
        <<interface>>
        +convert(decimal, string, string) ?decimal
        +getExchangeRates() array
    }

    class CurrencyConverterService {
        -string cacheKey
        +convert(decimal, string, string) ?decimal
        +getExchangeRates() array
        -fetchLiveRates() array
    }

    class BookEmbeddingService {
        +embedTexts(array) array
        +cosine(array, array)$ decimal
    }

    class AiLibrarianManagerService {
        -OpenAiRecommendationService openAiService
        -BookEmbeddingService embeddingService
        +processQuery(Member, string, ?string) array
        -retrieveCatalogContext(string) array
        -enforceDailyQuota(Member) void
    }

    class OpenLibraryService {
        +searchByTitle(string) array
        +searchByIsbn(string) ?array
        +importToCatalog(array) Book
    }

    AuthSessionServiceInterface <|.. AuthSessionService
    DarajaPaymentServiceInterface <|.. DarajaPaymentService
    DigitalRentalServiceInterface <|.. DigitalRentalService
    BookAvailabilityServiceInterface <|.. BookAvailabilityService
    BorrowLimitServiceInterface <|.. BorrowLimitService
    QueueReservationServiceInterface <|.. QueueReservationService
    CurrencyConverterServiceInterface <|.. CurrencyConverterService
```

---

## 6. Important Workflows and User Journeys

MaktabaBora implements six mission-critical business workflows. Each flow is modeled below with an embedded high-resolution Horizontal A4 sequence diagram alongside full technical commentary.

---

### 6.1 Authentication and JWT Token Lifecycle

MaktabaBora uses **stateless HMAC-SHA256 signed JSON Web Tokens (JWT)**. No session records are written to the database for routine requests. Tokens encode standard claims (`sub` = user ID, `iss` = MaktabaBora, `iat` = issued timestamp, `exp` = expiration, and `role` = user role).

- **Standard Access Tokens:** Expire in 15 minutes.
- **Persistent Tokens ("Remember Me"):** Valid for 30 days.
- **Revocation / Logout:** Explicitly blacklisted via Redis/Cache with an automatic TTL matching the token's remaining lifespan.

![MaktabaBora Authentication & JWT Token Lifecycle](diagrams/sequence_01_auth_jwt_lifecycle.png)

```mermaid
---
title: MAKTABABORA - AUTHENTICATION & JWT TOKEN LIFECYCLE
---
sequenceDiagram
    autonumber
    actor Patron as Member / Librarian
    participant FE as React Frontend
    participant Route as routes/api.php
    participant AuthMW as JwtTokenValidation
    participant Ctrl as AuthController
    participant Svc as AuthSessionService
    participant Cache as Redis / Cache Store
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Authentication & Token Issuance
    Patron->>FE: Enter Email & Password
    FE->>Route: POST /api/v1/auth/login {email, password, remember}
    Route->>Ctrl: login(Request)
    Ctrl->>DB: User::where('email', $email)->first()
    DB-->>Ctrl: Return User record
    Ctrl->>Ctrl: Hash::check(password, user.password)
    Ctrl->>Svc: generateToken(user, remember)
    Svc->>Svc: Build JWT payload (sub, role, iat, exp)
    Svc->>Svc: Sign payload with HMAC-SHA256 (app.key)
    Svc-->>Ctrl: Return token string
    Ctrl-->>FE: HTTP 200 {token, user}
    FE->>FE: Store token in localStorage / Memory

    Note over Patron,DB: 2. Authenticated API Request via Middleware
    Patron->>FE: Navigate to Protected Resource
    FE->>Route: GET /api/v1/loans (Header: Bearer token)
    Route->>AuthMW: handle(Request, Closure)
    AuthMW->>Svc: validateSessionToken(token)
    Svc->>Cache: Cache::has('blacklist:' . tokenHash)
    Cache-->>Svc: False (Not blacklisted)
    Svc->>Svc: Verify HMAC signature & check exp > now()
    Svc->>DB: User::find(payload.sub)
    DB-->>Svc: Return authenticated User
    Svc-->>AuthMW: User instance
    AuthMW->>AuthMW: $request->setUserResolver(fn() => $user)
    AuthMW->>Route: $next($request)
    Route-->>FE: Protected Resource Response

    Note over Patron,DB: 3. Session Termination (Logout)
    Patron->>FE: Click Logout
    FE->>Route: POST /api/v1/auth/logout (Header: Bearer token)
    Route->>Ctrl: logout(Request)
    Ctrl->>Svc: invalidateSessionToken(token)
    Svc->>Cache: Cache::put('blacklist:' . tokenHash, true, remainingTtl)
    Cache-->>Svc: Stored
    Ctrl-->>FE: HTTP 200 {message: "Logged out successfully"}
    FE->>FE: Remove token from storage
```

---

### 6.2 Physical Book Circulation: Checkout, Return & Overdue Fines

The physical circulation workflow governs book lending at the library desk. 
- During checkout, `ValidateBorrowLimit` and `CheckFineAmount` middlewares enforce institutional policies before a loan record is created.
- Upon book return, the system calculates the date delta between `loan.due_date` and `now()`. If returned past due, an unpaid fine record is automatically generated at KES 10.00 per day.
- Members can pay fines online via M-Pesa or librarians can waive fines with administrative justification.

![MaktabaBora Physical Book Circulation](diagrams/sequence_02_physical_circulation_fines.png)

```mermaid
---
title: MAKTABABORA - PHYSICAL CIRCULATION, RETURNS & OVERDUE FINES
---
sequenceDiagram
    autonumber
    actor Patron as Registered Member
    actor Staff as Librarian Staff
    participant FE as Staff Circulation Desk
    participant Route as routes/api.php
    participant LimitMW as ValidateBorrowLimit
    participant FineMW as CheckFineAmount
    participant LoanCtrl as LoanController
    participant AvailSvc as BookAvailabilityService
    participant FineCtrl as FineController
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Physical Book Checkout Flow
    Patron->>Staff: Present physical book & Member ID
    Staff->>FE: Scan Book Barcode & Input Member ID
    FE->>Route: POST /api/v1/librarian/loans/checkout {member_id, barcode}
    Route->>LimitMW: Check active loans < member.borrow_limit
    LimitMW->>FineMW: Check unpaid fines == 0
    FineMW->>LoanCtrl: checkout(Request)
    LoanCtrl->>DB: Find BookCopy by barcode & Member by ID
    LoanCtrl->>AvailSvc: isBookAvailable(book)
    AvailSvc-->>LoanCtrl: True
    LoanCtrl->>DB: Begin DB Transaction
    LoanCtrl->>DB: Insert LOANS (loan_date, due_date = now + 14d, status = 'active')
    LoanCtrl->>DB: Update BOOK_COPIES status = 'borrowed'
    LoanCtrl->>DB: Decrement BOOKS.available_copies
    LoanCtrl->>DB: Commit Transaction
    LoanCtrl-->>FE: HTTP 201 {loan_id, due_date, barcode}
    Staff-->>Patron: Hand physical book & announce due date

    Note over Patron,DB: 2. Book Return & Automated Overdue Fine Accrual
    Patron->>Staff: Return volume at Circulation Desk
    Staff->>FE: Scan returned copy barcode
    FE->>Route: POST /api/v1/librarian/loans/{loan_id}/return
    Route->>LoanCtrl: returnBook(Loan)
    LoanCtrl->>DB: Begin DB Transaction
    LoanCtrl->>DB: Update LOANS status = 'returned', returned_at = now()
    LoanCtrl->>DB: Update BOOK_COPIES status = 'available'
    LoanCtrl->>DB: Increment BOOKS.available_copies
    alt Returned Past Due Date
        LoanCtrl->>LoanCtrl: daysOverdue = diffInDays(now, due_date)
        LoanCtrl->>LoanCtrl: fineAmount = daysOverdue * KES 10.00
        LoanCtrl->>DB: Insert FINES (loan_id, amount = fineAmount, status = 'unpaid')
    end
    LoanCtrl->>DB: Commit Transaction
    LoanCtrl-->>FE: HTTP 200 {status: 'returned', fine_accrued: fineAmount}
    
    Note over Patron,DB: 3. Fine Settlement (Waiver by Staff or Cashless Daraja)
    opt Staff Waives Fine
        Staff->>FE: Click "Waive Fine" with reason
        FE->>Route: POST /api/v1/librarian/fines/{fine_id}/waive
        Route->>FineCtrl: waive(Fine)
        FineCtrl->>DB: Update FINES status = 'waived', payment_reference = 'Waived by staff'
        FineCtrl-->>FE: HTTP 200 {message: 'Fine waived'}
    end
```

---

### 6.3 Hold Reservation Queue Lifecycle

When all copies of a popular physical book are checked out, patrons can join a **First-In-First-Out (FIFO) Hold Reservation Queue**.
- A patron's queue position is calculated dynamically based on existing pending holds for that book.
- When an earlier copy is returned to the library, the system automatically tags the next pending reservation in line as ready for fulfillment.
- The patron receives a hold collection notice and an interactive printable receipt modal.

![MaktabaBora Hold Reservation Queue](diagrams/sequence_03_hold_reservation_queue.png)

```mermaid
---
title: MAKTABABORA - HOLD RESERVATION QUEUE LIFECYCLE
---
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    actor Staff as Librarian Staff
    participant FE as Member / Staff UI
    participant Route as routes/api.php
    participant AvailMW as CheckBookAvailability
    participant ResCtrl as ReservationController
    participant QueueSvc as QueueReservationService
    participant LibCtrl as LibrarianDashboardController
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Patron Places Book on Hold
    Patron->>FE: Click "Reserve / Place Hold"
    FE->>Route: POST /api/v1/reservations {book_id}
    Route->>AvailMW: Verify available_copies == 0
    AvailMW->>ResCtrl: store(Request)
    ResCtrl->>QueueSvc: enqueueHold(member, book)
    QueueSvc->>DB: Count existing pending holds for book_id
    QueueSvc->>QueueSvc: queue_position = count + 1
    QueueSvc->>DB: Insert RESERVATIONS (queue_position, status = 'pending')
    QueueSvc-->>ResCtrl: Return Reservation model
    ResCtrl-->>FE: HTTP 201 {reservation_id, queue_position}
    FE-->>Patron: Display Confirmation Modal with Queue Position

    Note over Patron,DB: 2. Hold Queue Reordering & Fulfillment
    Staff->>FE: Process Returned Book at Circulation Desk
    FE->>Route: POST /api/v1/librarian/reservations/{res_id}/approve
    Route->>LibCtrl: approveReservation(Reservation)
    LibCtrl->>DB: Begin DB Transaction
    LibCtrl->>DB: Update RESERVATIONS status = 'fulfilled', expires_at = now + 3d
    LibCtrl->>QueueSvc: Recalculate remaining queue positions (-1)
    QueueSvc->>DB: Update pending RESERVATIONS for book set queue_position = queue_position - 1
    LibCtrl->>DB: Commit Transaction
    LibCtrl-->>FE: HTTP 200 {status: 'Hold ready for pickup'}
    FE-->>Patron: Send Hold Ready Notification / Printable Receipt Modal
```

---

### 6.4 Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader

Patrons can purchase digital eBook versions (EPUB/PDF) using mobile money.
- Digital prices default to KES, with automatic conversion estimates from foreign prices (USD, EUR, GBP).
- Members with active subscription passes receive automatic tier discounts in the shopping cart.
- M-Pesa checkout triggers an **STK Push** via Safaricom's Daraja 2.0 API directly to the patron's mobile phone.
- Once confirmed, a `DIGITAL_RENTALS` record is minted with `access_type = 'lifetime_purchase'`, granting perpetual access in the in-app digital reader.

![MaktabaBora Digital Book Purchase & Reader](diagrams/sequence_04_digital_purchase_mpesa_reader.png)

```mermaid
---
title: MAKTABABORA - DIGITAL BOOK PURCHASE (M-PESA) & IN-APP READER
---
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    participant FE as React Frontend
    participant Route as routes/api.php
    participant RentCtrl as DigitalRentalController
    participant RentSvc as DigitalRentalService
    participant Daraja as DarajaPaymentService
    participant Safaricom as Safaricom M-Pesa API
    participant ReaderMW as EnsureValidDigitalAccess
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Multi-Item Digital Cart & M-Pesa STK Push
    Patron->>FE: Add Digital Books to Cart & Click "Pay via M-Pesa"
    FE->>Route: POST /api/v1/digital-books/checkout-cart {phone_number, book_ids}
    Route->>RentCtrl: checkoutCart(Request)
    RentCtrl->>RentSvc: checkoutCart(member, book_ids, phone)
    RentSvc->>RentSvc: Apply Member Tier Discount (e.g., -15%)
    RentSvc->>Daraja: initiateStkPush(phone, totalAmount, accountRef)
    Daraja->>Safaricom: POST /mpesa/stkpush/v1/processrequest
    Safaricom-->>Daraja: Response {CheckoutRequestID, ResponseCode: "0"}
    Daraja-->>RentCtrl: Return STK Prompt Dispatched
    RentCtrl-->>FE: HTTP 200 {CheckoutRequestID, status: "PromptSent"}
    
    Note over Patron,Safaricom: 2. Mobile Handset PIN Entry
    Safaricom->>Patron: STK Pop-Up: "Pay KES 450 to MaktabaBora? Enter PIN"
    Patron->>Safaricom: Enter M-Pesa Secret PIN
    Safaricom->>Route: POST /api/v1/fines/daraja/callback (M-Pesa Webhook)
    Route->>RentCtrl: Process Successful Callback
    RentCtrl->>DB: Begin DB Transaction
    loop For Each Purchased Digital Book
        RentCtrl->>DB: Insert DIGITAL_RENTALS (access_type = 'lifetime_purchase', reference)
    end
    RentCtrl->>DB: Commit Transaction

    Note over Patron,DB: 3. Protected Reading Stream
    Patron->>FE: Navigate to "My Digital Library" & Click "Read Book"
    FE->>Route: GET /api/v1/digital-books/{id}/read
    Route->>ReaderMW: handle(Request, Closure)
    ReaderMW->>DB: Query DIGITAL_RENTALS for active record
    DB-->>ReaderMW: Valid record found
    ReaderMW->>RentCtrl: read(Request, id)
    RentCtrl->>DB: Fetch chapter_index & secure file stream
    RentCtrl-->>FE: HTTP 200 {chapters, content_stream, book_metadata}
    FE->>FE: Open DigitalReaderModal (Light/Dark/Sepia, Chapters, Notes)
```

---

### 6.5 Membership Perk Pass Subscription & Refund Flow

Patrons can subscribe to monthly perk passes (General, Student, Scholar, VIP) to unlock higher borrow limits and digital discounts.
- Purchasing a new tier automatically cancels and archives any previous active subscription.
- Patrons experiencing billing discrepancies can submit a formal refund claim through their dashboard.
- Staff members review refund requests with custom audit notes, transitioning claims to `approved` or `rejected`.

![MaktabaBora Membership Perk Pass & Refund Flow](diagrams/sequence_05_membership_perks_refund.png)

```mermaid
---
title: MAKTABABORA - MEMBERSHIP PERK PASS & REFUND WORKFLOW
---
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    actor Staff as Librarian Staff
    participant FE as React UI
    participant Route as routes/api.php
    participant SubCtrl as SubscriptionController
    participant Daraja as DarajaPaymentService
    participant LibCtrl as LibrarianDashboardController
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Membership Pass Subscription Checkout
    Patron->>FE: Select "Scholar Pass" (KES 800/mo) & Enter Phone
    FE->>Route: POST /api/v1/subscriptions/checkout {tier_id, phone_number}
    Route->>SubCtrl: checkout(Request)
    SubCtrl->>Daraja: initiateStkPush(phone, tier.price, "Pass-Scholar")
    Daraja-->>SubCtrl: STK Push Dispatched
    SubCtrl-->>FE: HTTP 200 {status: "PendingPayment"}
    Patron->>Patron: Authorize M-Pesa PIN on Mobile Device
    SubCtrl->>DB: Begin DB Transaction
    SubCtrl->>DB: Update existing active SUBSCRIPTIONS set status = 'cancelled'
    SubCtrl->>DB: Insert SUBSCRIPTIONS (tier_id, start_date, end_date = +30d, status = 'active')
    SubCtrl->>DB: Update MEMBERS (borrow_limit = tier.borrow_limit, is_subscribed = true)
    SubCtrl->>DB: Commit Transaction

    Note over Patron,DB: 2. Dispute & Refund Request Initiation
    Patron->>FE: Go to Profile -> "Request Subscription Refund"
    FE->>Route: POST /api/v1/subscriptions/refund {subscription_id, reason}
    Route->>SubCtrl: requestRefund(Request)
    SubCtrl->>DB: Insert REFUND_REQUESTS (amount = subscription.price, status = 'pending')
    SubCtrl-->>FE: HTTP 201 {message: "Refund request submitted for staff review"}

    Note over Staff,DB: 3. Staff Audit & Resolution
    Staff->>FE: Open Librarian Dashboard -> Reimbursements Tab
    FE->>Route: GET /api/v1/librarian/refund-requests
    Route->>LibCtrl: getRefundRequests()
    LibCtrl-->>FE: Return pending refund claims
    Staff->>FE: Inspect claim & Click "Approve Refund" with notes
    FE->>Route: POST /api/v1/librarian/refund-requests/{id}/approve {notes}
    Route->>LibCtrl: approveRefund(id)
    LibCtrl->>DB: Begin DB Transaction
    LibCtrl->>DB: Update REFUND_REQUESTS status = 'approved', reviewed_by = staff.id
    LibCtrl->>DB: Update SUBSCRIPTIONS status = 'cancelled'
    LibCtrl->>DB: Reset MEMBER borrow_limit = 3, is_subscribed = false
    LibCtrl->>DB: Commit Transaction
    LibCtrl-->>FE: HTTP 200 {status: "Refund approved"}
```

---

### 6.6 Smart AI Librarian Assistant: Rate-Limited RAG Query Flow

The AI Librarian provides semantic book discovery, catalog inquiries, and reading recommendations.
- Protected by the `ChatbotCostLimiter` middleware, preventing patron abuse by checking cumulative 24-hour token consumption against a 20,000 token ceiling.
- Prompts are augmented with real library catalog records using semantic embeddings and TF-IDF search scores.
- Strict system prompt guardrails instruct the LLM to decline questions outside literature/library services and prevent leaking sensitive patron data.

![MaktabaBora AI Librarian RAG Query Flow](diagrams/sequence_06_ai_librarian_rag_assistant.png)

```mermaid
---
title: MAKTABABORA - SMART AI LIBRARIAN ASSISTANT (RAG FLOW)
---
sequenceDiagram
    autonumber
    actor Patron as Authenticated Member
    participant FE as AiChatWidget.jsx
    participant Route as routes/api.php
    participant CostMW as ChatbotCostLimiter
    participant Ctrl as AiChatbotController
    participant AiMgr as AiLibrarianManagerService
    participant EmbedSvc as BookEmbeddingService
    participant LLM as OpenAI / Gemini API
    participant DB as PostgreSQL

    Note over Patron,DB: 1. Cost Verification & Quota Enforcement
    Patron->>FE: Type query: "Recommend historical fiction set in East Africa"
    FE->>Route: POST /api/v1/ai/chat {message, session_token}
    Route->>CostMW: handle(Request, Closure)
    CostMW->>DB: Sum AI_USAGE_LOGS.tokens_consumed where member_id and created_at >= now - 24h
    DB-->>CostMW: Total tokens: 8,450
    alt Tokens >= 20,000
        CostMW-->>FE: HTTP 429 {error: "Daily AI token quota reached (20k)."}
    else Tokens < 20,000
        CostMW->>Ctrl: chat(Request)
    end

    Note over Ctrl,LLM: 2. Catalog Semantic Retrieval & Context Grounding
    Ctrl->>AiMgr: processQuery(member, message, session_token)
    AiMgr->>EmbedSvc: embedTexts([message])
    EmbedSvc->>LLM: Generate query vector embedding
    LLM-->>EmbedSvc: [0.014, -0.082, 0.045, ...]
    AiMgr->>DB: Query BOOKS & calculate cosine similarity against catalog embeddings
    DB-->>AiMgr: Matched titles: "Dust" (0.89), "A Grain of Wheat" (0.84)
    AiMgr->>AiMgr: Build Grounded System Prompt (Inject book titles, authors, stock)
    AiMgr->>LLM: POST chat/completions (System Prompt + Catalog Context + User Query)
    LLM-->>AiMgr: LLM Response with accurate citations & availability
    
    Note over AiMgr,FE: 3. Session Persistence & Usage Tracking
    AiMgr->>DB: Begin DB Transaction
    AiMgr->>DB: Insert CHAT_MESSAGES (user message)
    AiMgr->>DB: Insert CHAT_MESSAGES (assistant reply + grounding metadata)
    AiMgr->>DB: Insert AI_USAGE_LOGS (prompt_tokens: 310, completion_tokens: 140, total: 450)
    AiMgr->>DB: Commit Transaction
    AiMgr-->>Ctrl: Formatted response payload
    Ctrl-->>FE: HTTP 200 {response, grounding_sources, tokens_used}
    FE-->>Patron: Render Assistant Message with Catalog Book Badges
```

---

## 7. Screenshots and UI Explanation

The MaktabaBora client is built as an intuitive Single-Page Application composed of 13 dedicated page views and interactive modal dialogs.

### 7.1 Page Layouts and Functional Walkthrough

#### 1. Public Landing & Catalog (`Home.jsx` & `PublicCatalog.jsx`)
- **Visual Composition:** Dynamic hero banner showcasing library metrics (total volumes, digital titles, registered members), a live quick-search bar, featured books carousel, and genre filtering pills.
- **Search Capabilities:** Patrons can search by title, author, or ISBN, and filter by availability status ("In Stock Only", "Reference Only") or language.
- **Pricing Indicators:** Books with digital editions display both KES rental prices and estimated foreign currency equivalents.

```
+-----------------------------------------------------------------------------------------------+
| [Logo] MaktabaBora          Catalog   Digital Books   Membership   About     [Login] [Join]   |
+-----------------------------------------------------------------------------------------------+
|  DISCOVER, BORROW, AND READ WITH MAKTABABORA                                                  |
|  The modern hybrid library: physical circulation, instant digital reading, and AI guidance.   |
|                                                                                               |
|  [ 🔍 Search title, author, genre or ISBN...                          ] [ Search Books ]       |
+-----------------------------------------------------------------------------------------------+
|  GENRES: [ All ] [ Fiction ] [ Technology ] [ History ] [ Science ] [ Philosophy ] [ Law ]    |
+-----------------------------------------------------------------------------------------------+
|  FEATURED BOOKS                                                                               |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+   |
|  | [Cover Image]     |  | [Cover Image]     |  | [Cover Image]     |  | [Cover Image]     |   |
|  | Clean Code        |  | African Nations   |  | Artificial Intel. |  | Modern Economics  |   |
|  | Robert C. Martin  |  | Basil Davidson    |  | Stuart Russell    |  | Thomas Sowell     |   |
|  | KES 350 / Digital |  | KES 200 / Digital |  | KES 500 / Digital |  | KES 400 / Digital |   |
|  | [ 3 Available ]   |  | [ On Hold ]       |  | [ 1 Available ]   |  | [ In Stock ]      |   |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+   |
+-----------------------------------------------------------------------------------------------+
```

#### 2. Book Details & Inventory View (`BookDetails.jsx`)
- **Information Hierarchy:** High-resolution cover display, full synopsis, publication metadata, shelf classification coordinate, and real-time physical copy count.
- **Interactive Triggers:** 
  - If copies are available: Displays **"Borrow In-Person at Library"** badge.
  - If all copies are loaned out: Triggers **"Place Hold (Join Queue)"** button.
  - If a digital edition exists: Triggers **"Add Digital Edition to Cart"** button.
- **Similar Titles Carousel:** Content-based recommendation list generated via TF-IDF cosine similarity against related works.

#### 3. Shopping Cart & Multi-Item Checkout (`CartPage.jsx`)
- **Cart Summary:** Itemized list of digital eBooks selected for purchase.
- **Discount Computation:** Automatically reads the authenticated member's active perk tier from `AuthContext` and applies the corresponding percentage discount (e.g., 15% discount for Scholar Pass holders).
- **Checkout Action:** Triggers the Safaricom Daraja M-Pesa STK push modal.

#### 4. Member Portal Dashboard (`MemberDashboard.jsx`)
The personal command center for authenticated patrons, segmented into 4 primary tabs:
- **Active Physical Loans:** List of currently borrowed books, countdown badges for due dates, and alerts for accrued overdue fines.
- **Hold Reservations:** Overview of waitlisted titles, current FIFO queue positions, and pickup expiration timers.
- **Digital Library:** Books purchased for lifetime reading, each with a **"Read Now"** launch button.
- **Perk Pass Status:** Active subscription tier indicator, expiration date, and upgrade options.

```
+-----------------------------------------------------------------------------------------------+
| MEMBER DASHBOARD                                                 Welcome back, Jane Doe (VIP) |
+-----------------------------------------------------------------------------------------------+
| [ Active Loans (2) ]    [ Hold Queue (1) ]    [ My Digital Library (4) ]    [ My Pass: VIP ]  |
+-----------------------------------------------------------------------------------------------+
| CURRENT PHYSICAL LOANS                                                                        |
| --------------------------------------------------------------------------------------------- |
| Book Title           Barcode       Borrowed Date   Due Date        Status       Action        |
| --------------------------------------------------------------------------------------------- |
| The Pragmatic Prog.  BAR-882190    10 Sep 2026     24 Sep 2026     8 days left  [ View Book ] |
| Introduction to Alg. BAR-110294    01 Sep 2026     15 Sep 2026     OVERDUE (1d) [ Pay Fine ]  |
|                                                                    KES 10.00                  |
+-----------------------------------------------------------------------------------------------+
| MY DIGITAL BOOKS (LIFETIME ACCESS)                                                            |
| +-----------------------------------------------------+  +----------------------------------+ |
| | [Cover] Deep Work - Cal Newport                     |  | [Cover] Design Patterns (GoF)    | |
| | Format: EPUB | Purchased: 12 Aug 2026               |  | Format: PDF | Purchased: 02 Sep  | |
| | Progress: Chapter 4 of 12 (33%)                     |  | Progress: Page 112 of 395        | |
| | [ 📖 Open In-Browser Reader ]                        |  | [ 📖 Open In-Browser Reader ]     | |
| +-----------------------------------------------------+  +----------------------------------+ |
+-----------------------------------------------------------------------------------------------+
```

#### 5. In-Browser Digital Reader Modal (`DigitalReaderModal.jsx`)
- **Reading Environment:** Full-screen modal reader supporting EPUB and PDF rendering without external browser plugins.
- **Customization Controls:** Three color themes (**Light**, **Dark**, **Sepia**), font size increment/decrement controls, line spacing adjustment, and full-screen toggle.
- **Chapter Navigation:** Interactive slide-out drawer displaying chapter titles and word counts with 1-click jump anchors.
- **Local Reading Notes:** Embedded notepad allowing patrons to write and persist marginalia and personal study notes locally.

#### 6. Safaricom Daraja M-Pesa Payment Modal (`DarajaPayModal.jsx`)
- **Checkout Dialog:** Displays the merchant title ("MaktabaBora Library"), the exact charge in KES, and a formatted mobile input field (`07XXXXXXXX` or `01XXXXXXXX`).
- **Simulated MVP Flow:** For evaluation and academic presentation purposes, the payment flow runs in simulated mode—disagreeing with real cellular account deductions while faithfully demonstrating STK prompt dispatch, timed polling, and automated backend ledger settlement.
- **Live Status Polling:** Once initiated, the modal transitions to an animated countdown screen polling the backend for STK callback settlement.
- **Receipt Handoff:** On successful confirmation, automatically renders the `ReceiptModal`.

#### 7. Hold & Payment Receipt Modal (`ReceiptModal.jsx`)
- **Standardized Receipt:** Institutional header with MaktabaBora logo, unique alphanumeric receipt identifier, timestamp, item details, payment channel ("Safaricom M-Pesa"), and barcode graphic.
- **Actions:** 1-Click **"Print Receipt"** (formats via standard CSS `@media print` rules) and **"Download PDF"**.

#### 8. Conversational AI Assistant Widget (`AiChatWidget.jsx`)
- **Floating Interface:** Minimized floating bubble in the bottom right corner of all views, expanding into a full chat drawer upon click.
- **Catalog Card Badges:** When the assistant references a real book from the library catalog, it renders a clickable mini-card displaying live availability stock and shelf locations.
- **Daily Quota Meter:** Live progress indicator showing consumed vs. remaining daily AI tokens.

```
+---------------------------------------------------+
|  🤖 MaktabaBora AI Assistant           [ _ ] [ X ]|
+---------------------------------------------------+
|  AI Token Quota: [████████░░░░░░░░] 8,450 / 20,000|
+---------------------------------------------------+
| 👤 You:                                           |
| Can you suggest books on system architecture?     |
|                                                   |
| 🤖 AI Librarian:                                  |
| Here are 2 titles available in our library:       |
|                                                   |
| +-----------------------------------------------+ |
| | 📚 Designing Data-Intensive Applications      | |
| | Author: Martin Kleppmann | Shelf: T-04-MID    | |
| | Status: 2 Copies Available [ Reserve Copy ]   | |
| +-----------------------------------------------+ |
| | 📚 Building Microservices (2nd Edition)        | |
| | Author: Sam Newman | Shelf: T-02-LOW          | |
| | Status: Checked Out [ Join Hold Queue ]       | |
| +-----------------------------------------------+ |
+---------------------------------------------------+
| [ Ask the library assistant...         ] [ Send ] |
+---------------------------------------------------+
```

#### 9. Librarian Circulation Desk (`LibrarianDashboard.jsx`)
- **Operational Metrics:** Daily checkout count, active loan count, overdue books, and fine collection tallies.
- **Quick Circulation Desk:** Barcode scanner input field for instantaneous physical book checkout and return processing.
- **Inventory & Copy Manager:** Full CRUD for individual physical volumes and shelf coordinate assignments.
- **Hold Approvals:** Queue inspection table with 1-click hold approval and rejection buttons.
- **Open Library Search:** 1-Click ISBN search tool importing catalog records and cover art directly from Open Library.

#### 10. Administrator Control Center (`AdminDashboard.jsx`)
- **Platform Analytics:** Revenue aggregation charts, membership tier distribution, and active loan ratios.
- **Staff Management:** Administrator interface to register new librarian accounts, reset credentials, or adjust administrative privileges.
- **User Governance:** System user table with search, role modification, and account ban toggles with mandatory reason inputs.
- **AI Settings Console:** Live interface to toggle providers (OpenAI / Gemini / Offline), test API key connectivity, update default models, and view cumulative token usage.
- **Dynamic CRUD Console (`AdminCrudController`):** Raw database administrative explorer enabling authorized administrators to inspect, search, filter, export, and edit rows across any table in the schema.

---

## 8. Key Code Implementation Highlights

### 8.1 Stateless JWT Session Service
Located at [`backend/app/Services/AuthSessionService.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/app/Services/AuthSessionService.php), this service provides pure cryptographic JWT generation and cache-based revocation without database lookups:

```php
public function generateToken(User $user, bool $remember = false): string
{
    // Standard access tokens: 15 minutes | Persistent tokens: 30 days
    $ttl = $remember ? (60 * 60 * 24 * 30) : (60 * 15);
    return $this->buildJwt($user, 'access', $ttl);
}

protected function buildJwt(User $user, string $type, int $ttl): string
{
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $now = time();
    $payload = base64_encode(json_encode([
        'iss' => 'MaktabaBora-Library',
        'sub' => $user->id,
        'role' => $user->role,
        'type' => $type,
        'iat' => $now,
        'exp' => $now + $ttl,
    ]));

    $signature = hash_hmac('sha256', "{$header}.{$payload}", $this->secret, true);
    return "{$header}.{$payload}." . base64_encode($signature);
}

public function invalidateSessionToken(string $token): bool
{
    $hash = md5($token);
    // Cache blacklisting with automatic TTL eviction matching remaining token lifetime
    Cache::put("jwt_blacklist:{$hash}", true, 60 * 60 * 24 * 30);
    return true;
}
```

---

### 8.2 Daily AI Token Cost Limiter Middleware
Located at [`backend/app/Http/Middleware/ChatbotCostLimiter.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/app/Http/Middleware/ChatbotCostLimiter.php), this gatekeeper halts expensive LLM calls if a patron exceeds 20,000 tokens in a rolling 24-hour window:

```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();
    if ($user) {
        $member = Member::where('user_id', $user->id)->first();
        if ($member) {
            // Aggregate tokens consumed by member across past 24 hours
            $recentTokens = AiUsageLog::where('member_id', $member->id)
                ->where('created_at', '>=', now()->subDay())
                ->sum('tokens_consumed');

            $dailyTokenLimit = 20000;

            if ($recentTokens >= $dailyTokenLimit) {
                return response()->json([
                    'error' => 'AI Quota Exceeded',
                    'message' => 'Daily AI Assistant token quota reached. Please try again tomorrow.'
                ], 429);
            }
        }
    }

    return $next($request);
}
```

---

### 8.3 High-Dimensional Vector Cosine Similarity
Located at [`backend/app/Services/BookEmbeddingService.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/app/Services/BookEmbeddingService.php), this implementation computes cosine distances between 1536-dimensional vectors in native PHP:

```php
public static function cosine(array $a, array $b): float
{
    $dot = 0.0;
    $normA = 0.0;
    $normB = 0.0;
    $len = count($a);

    if ($len === 0 || $len !== count($b)) {
        return 0.0;
    }

    for ($i = 0; $i < $len; $i++) {
        $dot += $a[$i] * $b[$i];
        $normA += $a[$i] * $a[$i];
        $normB += $b[$i] * $b[$i];
    }

    $denominator = sqrt($normA) * sqrt($normB);
    return $denominator > 0.0 ? ($dot / $denominator) : 0.0;
}
```

---

### 8.4 Daraja M-Pesa STK Push Integration
Located at [`backend/app/Services/DarajaPaymentService.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/app/Services/DarajaPaymentService.php), this service handles Base64 timestamp password generation and initiates the Safaricom STK prompt. 

> [!NOTE]
> **Simulated Payment Flow for MVP Evaluation:**
> In our current MVP prototype, the Daraja payment flow is configured in a simulated sandbox mode. While the service constructs compliant Daraja 2.0 payload envelopes and enforces transaction tracking schemas (`CheckoutRequestID`, `MerchantRequestID`, `transaction_reference`), it safely simulates the end-to-end phone prompt and webhook settlement without requiring live Safaricom cellular airtime or real cash deductions during defense and evaluation.

```php
public function initiateStkPush(string $phoneNumber, float $amount, string $accountReference, string $transactionDesc = 'Payment'): array
{
    $formattedPhone = $this->formatPhoneNumber($phoneNumber);
    $timestamp = date('YmdHis');
    $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

    $response = Http::withToken($this->generateAccessToken())
        ->post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', [
            'BusinessShortCode' => $this->shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
            'TransactionType'   => 'CustomerPayBillOnline',
            'Amount'            => (int) ceil($amount),
            'PartyA'            => $formattedPhone,
            'PartyB'            => $this->shortcode,
            'PhoneNumber'       => $formattedPhone,
            'CallBackURL'       => config('services.daraja.callback_url'),
            'AccountReference'  => substr($accountReference, 0, 12),
            'TransactionDesc'   => substr($transactionDesc, 0, 13),
        ]);

    return $response->json() ?? [];
}
```

---

### 8.5 Dynamic Foreign Currency Converter with Caching
Located at [`backend/app/Services/CurrencyConverterService.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/app/Services/CurrencyConverterService.php), this service caches exchange rates for 24 hours to minimize third-party API latency:

```php
public function convert(?float $amount, ?string $fromCurrency, string $toCurrency = 'KES'): ?float
{
    if ($amount === null || $fromCurrency === null) {
        return null;
    }

    $from = strtoupper(trim($fromCurrency));
    $to = strtoupper(trim($toCurrency));

    if ($from === $to) {
        return round($amount, 2);
    }

    $rates = $this->getExchangeRates();
    if (!isset($rates[$from]) || !isset($rates[$to])) {
        return null;
    }

    // Convert via USD pivot base
    $amountInUsd = $amount / $rates[$from];
    $convertedAmount = $amountInUsd * $rates[$to];

    return round($convertedAmount, 2);
}
```

---

## 9. APIs and Integrations

### 9.1 Internal REST API Catalog

All routes are prefixed with `/api/v1` and wrapped in the `api.gateway` middleware.

```
+--------+------------------------------------------+-------------------------------------+-----------------------------+
| Verb   | URI Endpoint                             | Controller Action                   | Middleware & Permissions    |
+--------+------------------------------------------+-------------------------------------+-----------------------------+
| POST   | /auth/register                           | AuthController@register             | Public                      |
| POST   | /auth/register-membership-stk            | AuthController@registerMembership   | Public                      |
| POST   | /auth/login                              | AuthController@login                | Public                      |
| GET    | /catalog/search                          | CatalogSearchController@search      | Public                      |
| GET    | /books                                   | BookInventoryController@index       | Public                      |
| GET    | /books/{book}                            | BookInventoryController@show        | Public                      |
| GET    | /membership-tiers                        | MembershipTierController@index      | Public                      |
| POST   | /fines/daraja/callback                   | FineController@darajaCallback       | Public (Safaricom Webhook)  |
| GET    | /auth/me                                 | AuthController@me                   | jwt.validation, ensure.acc  |
| PUT    | /auth/profile                            | AuthController@updateProfile        | jwt.validation, ensure.acc  |
| POST   | /auth/logout                             | AuthController@logout               | jwt.validation, ensure.acc  |
| POST   | /subscriptions/checkout                  | SubscriptionController@checkout     | jwt.validation, ensure.acc  |
| GET    | /subscriptions/status                    | SubscriptionController@status       | jwt.validation, ensure.acc  |
| GET    | /loans                                   | LoanController@index                | ensure.member               |
| GET    | /fines                                   | FineController@index                | ensure.member               |
| POST   | /fines/{fine}/pay-daraja                 | FineController@payWithDaraja        | ensure.member               |
| POST   | /subscriptions/cancel                    | SubscriptionController@cancel       | ensure.member               |
| POST   | /subscriptions/refund                    | SubscriptionController@requestRefund| ensure.member               |
| GET    | /digital-books/my-library                | DigitalRentalController@myLibrary   | ensure.member               |
| POST   | /digital-books/checkout-cart             | DigitalRentalController@checkoutCart| ensure.member               |
| GET    | /digital-books/{id}/read                 | DigitalRentalController@read        | ensure.digital_access       |
| GET    | /reservations                            | ReservationController@index         | ensure.member               |
| POST   | /reservations                            | ReservationController@store         | check.book_avail, hold_avail|
| GET    | /recommendations                         | BookRecommendationController@forMem | ensure.member               |
| POST   | /ai/chat                                 | AiChatbotController@chat            | chatbot.cost_limiter        |
| GET    | /librarian/metrics                       | LibrarianDashboardController@metric | ensure.librarian            |
| POST   | /librarian/loans/checkout                | LoanController@checkout             | validate.borrow, check.fine |
| POST   | /librarian/loans/{loan}/return           | LoanController@returnBook           | ensure.librarian            |
| POST   | /librarian/fines/{fine}/waive            | FineController@waive                | ensure.librarian            |
| POST   | /librarian/books                         | BookInventoryController@store       | ensure.librarian            |
| GET    | /librarian/openlibrary/search            | LibrarianDashboardController@search | ensure.librarian            |
| POST   | /librarian/openlibrary/import            | LibrarianDashboardController@import | ensure.librarian            |
| POST   | /librarian/reservations/{id}/approve     | LibrarianDashboardController@approve| ensure.librarian            |
| GET    | /admin/users                             | AdminDashboardController@users      | ensure.admin                |
| POST   | /admin/users/{user}/toggle-ban           | AdminDashboardController@toggleBan  | ensure.admin                |
| POST   | /admin/librarians                        | AdminDashboardController@createLib  | ensure.admin                |
| GET    | /admin/ai-settings                       | AiSettingsController@index          | ensure.admin                |
| PUT    | /admin/ai-settings                       | AiSettingsController@update         | ensure.admin                |
| GET    | /admin/crud/{table}                      | AdminCrudController@getTableData    | ensure.admin                |
+--------+------------------------------------------+-------------------------------------+-----------------------------+
```

---

### 9.2 External Integrations

1. **Safaricom Daraja 2.0 API:** Handles instant mobile money payments via STK push. Supports live status polling and incoming transaction webhook callbacks (simulated in MVP mode for frictionless, zero-cost evaluation).
2. **OpenAI API & Google Gemini API:** Provides text embeddings via `text-embedding-3-small` and conversational intelligence via `gpt-4o-mini` and `gemini-1.5-flash`.
3. **Open Library REST API:** Queries `https://openlibrary.org/search.json` and `https://openlibrary.org/isbn/{isbn}.json` for instant 1-click catalog import.
4. **Open Exchange Rates / Frankfurter API:** Fetches daily financial currency exchange rates for automated foreign book pricing estimates in KES.

---

## 10. Security Considerations

MaktabaBora implements defense-in-depth across multiple application layers:

1. **Stateless Cryptographic Token Security:** JWT tokens are signed using HMAC-SHA256 with the server's master key (`APP_KEY`). Tokens cannot be altered in transit without invalidating the signature. Blacklisted tokens are immediately written to Redis/Cache with an automatic TTL expiration.
2. **Multi-Tier Middleware Gatekeeping:** Requests pass through sequential middleware checkpoints (`jwt.validation` $\to$ `ensure.account` $\to$ `check.banned` $\to$ `validate.borrow_limit` $\to$ `check.fine`). Banned accounts or members with excessive overdue fines are halted prior to controller invocation.
3. **Financial Transaction Security:** M-Pesa callbacks are verified against expected transaction references. Checkout operations use database transactions (`DB::beginTransaction()`) to prevent race conditions and duplicate grants.
4. **AI Safety & Anti-Hallucination Guardrails:** Prompts sent to OpenAI and Gemini enforce strict system context boundaries. The model is explicitly barred from disclosing patron records or fabricating non-existent catalog books.
5. **SQL Injection Defense:** All database queries are constructed via Eloquent ORM or parameterized PDO statements, guaranteeing immunization against SQL injection vulnerabilities.
6. **CORS & Rate Limiting:** Configured with `CorsMiddleware` and token-bucket IP throttlers to protect public endpoints from distributed denial-of-service (DDoS) and credential brute-forcing.

---

## 11. Challenges and Solutions

```
+------------------------------------+-----------------------------------------------------------------------------------+
| Engineering Challenge              | Technical Resolution in MaktabaBora Codebase                                      |
+------------------------------------+-----------------------------------------------------------------------------------+
| 1. Neon DB Connection Pooling vs.  | Neon's PgBouncer transaction pooling aborts DDL migration statements. In         |
|    Schema Migrations               | backend/config/database.php, an automatic detector inspects $_SERVER['argv']. If   |
|                                    | running migrate commands, it strips the -pooler. suffix to connect directly.      |
+------------------------------------+-----------------------------------------------------------------------------------+
| 2. PostgreSQL SSL Mode Mismatch    | Neon requires sslmode=require, while local PostgreSQL on Windows throws           |
|    between Local & Cloud           | SQLSTATE[08006] server does not support SSL. The database config was updated to   |
|                                    | default dynamically to prefer, allowing local connections to succeed while        |
|                                    | negotiating SSL with Neon seamlessly.                                             |
+------------------------------------+-----------------------------------------------------------------------------------+
| 3. Unbounded AI API Cost Exposure  | AI services can incur catastrophic billing spikes. The ChatbotCostLimiter         |
|                                    | middleware enforces a strict 20,000 token limit per member per 24 hours.          |
+------------------------------------+-----------------------------------------------------------------------------------+
| 4. Localhost M-Pesa Webhooks       | In local development, Safaricom cannot reach http://localhost/api. MaktabaBora    |
|                                    | features a hybrid polling fallback in DarajaPaymentService to query transaction   |
|                                    | status continuously during checkout modal display.                                |
+------------------------------------+-----------------------------------------------------------------------------------+
| 5. Vector Search without Dedicated | Implemented native PHP high-dimensional cosine similarity ranking in               |
|    Vector Extensions               | BookEmbeddingService, backed by a TF-IDF keyword cosine similarity engine as an   |
|                                    | offline fallback.                                                                 |
+------------------------------------+-----------------------------------------------------------------------------------+
```

---

## 12. Testing and Quality Assurance

Testing is automated through **PHPUnit 11**, organized into isolated **Unit Tests** and end-to-end **Feature Tests**.

```
+------------------+---------------+----------------+-------------------------------------------------------------+
| Test Suite       | Total Tests   | Assertions     | Execution Scope                                             |
+------------------+---------------+----------------+-------------------------------------------------------------+
| Unit Tests       | 80 Passed     | 185 Assertions | Services (15), Middleware (17), Providers (6), Models (2)   |
| Feature Tests    | 47 Passed     | 212 Assertions | End-to-end HTTP routes, controllers, and transactions       |
| Total Suite      | 127 Passed    | 397 Assertions | 100% Passing in ~7.5 seconds                                |
+------------------+---------------+----------------+-------------------------------------------------------------+
```

### 12.1 Execution Commands

```bash
# Execute only Unit Tests (80 tests across services, middleware & providers)
php artisan test --testsuite=Unit

# Execute only Feature Tests (47 tests across HTTP routes & controllers)
php artisan test --testsuite=Feature

# Execute specific service test
php artisan test tests/Unit/Services/AuthSessionServiceTest.php

# Execute the complete automated test suite
php artisan test
```

---

## 13. Deployment and Operations

### 13.1 Production Prerequisites
- **Server Platform:** Linux (Ubuntu 22.04 LTS / 24.04 LTS recommended) or Containerized Cloud Host (Render, AWS ECS, GCP Cloud Run)
- **Container Runtime:** Docker Engine 24+ with multi-stage build support
- **PHP Runtime:** Version 8.2 or 8.3 with extensions: `pdo_pgsql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `curl`, `opcache`
- **Database Engine:** Remote Neon Serverless Cloud PostgreSQL (PgBouncer connection pooling enabled)
- **Node.js Environment:** Node.js 18+ and npm for frontend production asset bundling
- **Reverse Proxy / Ingress:** Nginx 1.24+ with SSL termination and HTTP/2 support

---

### 13.2 Unified Fullstack Container Architecture

MaktabaBora packages both the **React 18 Single-Page Application (SPA)** and the **Laravel 11 REST API** into a single, unified, production-hardened Docker container. This eliminates cross-origin resource sharing (CORS) friction, eliminates hardcoded local ports in production, and provides a single turnkey web service.

#### 1. Multi-Stage Docker Build Architecture (`Dockerfile`)
- **Stage 1 (`frontend-builder`):** Uses lightweight `node:20-alpine` to install dependencies (`npm ci`) and build the production Vite bundle with optimized gzip chunks.
- **Stage 2 (`production`):** Based on `serversideup/php:8.2-fpm-nginx` (Alpine Linux). Copies the compiled frontend assets from `frontend-builder` (`dist/`) directly into Laravel's `/var/www/html/public/` directory alongside `index.php`.
- **Process Supervision:** Governed by **S6-Overlay** (PID 1) running under the unprivileged `www-data` user (UID 33), orchestrating Nginx and PHP-FPM 8.2 workers with dynamic `$PORT` binding.
- **SPA Routing Integration:** Nginx serves static CSS, JS, and brand images directly with high performance. For non-API routes (`/`, `/catalog`, `/login`, `/dashboard`), Laravel's `routes/web.php` catch-all serves `index.html`, handing route management to client-side React Router.

#### 2. Multi-Stage Build Specification (`Dockerfile`)
```dockerfile
# Stage 1: Build React 18 Single-Page Application (SPA)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 2: Production PHP-FPM + Nginx Environment
FROM serversideup/php:8.2-fpm-nginx AS production

ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    WEB_DOCUMENT_ROOT=/var/www/html/public

USER root

# Install PostgreSQL client drivers & extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    postgresql-client \
    && docker-php-ext-install pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend application source code
COPY --chown=www-data:www-data backend /var/www/html

# Install Composer production dependencies
WORKDIR /var/www/html
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Copy compiled React SPA bundle into Laravel's public directory
COPY --from=frontend-builder --chown=www-data:www-data /app/frontend/dist/ /var/www/html/public/

# Copy automated entrypoint lifecycle script
COPY --chown=www-data:www-data backend/docker-entrypoint.sh /etc/entrypoint.d/99-maktababora.sh
RUN chmod +x /etc/entrypoint.d/99-maktababora.sh

USER www-data
```

#### 3. Single-Page Application (SPA) Catch-All Routing (`backend/routes/web.php`)
```php
Route::get('/{any?}', function () {
    $spaIndexPath = public_path('index.html');

    if (file_exists($spaIndexPath)) {
        return response()->file($spaIndexPath);
    }

    return response()->json([
        'status' => 'active',
        'message' => 'MaktabaBora API Backend is running.',
        'documentation' => '/api/v1/catalog/search'
    ]);
})->where('any', '^(?!api|up).*$');
```

#### 4. Automated Entrypoint Lifecycle Hook (`backend/docker-entrypoint.sh`)
```bash
#!/bin/sh
set -e

echo "=== Starting MaktabaBora Fullstack Container ==="

# Optimize Laravel configuration, routing, and views
if [ -n "$APP_KEY" ]; then
    echo ">> Caching configuration, routes, and views..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Conditionally execute database schema migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo ">> Executing database migrations against remote Neon DB..."
    php artisan migrate --force || true
fi

echo ">> MaktabaBora initialization complete. Passing control to Nginx & PHP-FPM..."
```

---

### 13.3 Cloud Hosting on Render Free Tier (`render.yaml`)

MaktabaBora employs Render's Infrastructure-as-Code Blueprint specification (`render.yaml`) to automate the single-service fullstack deployment:

```yaml
services:
  - type: web
    name: maktababora
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    plan: free
    region: oregon
    healthCheckPath: /up
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: false
      - key: APP_URL
        sync: false
      - key: APP_KEY
        generateValue: true
      - key: DB_CONNECTION
        value: pgsql
      - key: DATABASE_URL
        sync: false
      - key: DB_SSLMODE
        value: require
      - key: LOG_CHANNEL
        value: stderr
      - key: SESSION_DRIVER
        value: database
      - key: CACHE_STORE
        value: database
      - key: QUEUE_CONNECTION
        value: database
```

- **Single Turnkey Web Service:** Serves both frontend UI and backend API from one unified URL (e.g. `https://maktababora.onrender.com`).
- **Health Probe Endpoint:** Render monitors `/up` (returning HTTP 200 OK) to confirm healthy Nginx and PHP-FPM initialization before routing ingress traffic.
- **Log Streaming:** Centralized log delivery to `stderr` / `stdout` for unified Render console inspection.

---

### 13.4 Continuous Integration & Continuous Deployment (CI/CD)

Continuous integration and delivery are orchestrated through **GitHub Actions** via [`.github/workflows/deploy-render.yml`](file:///.github/workflows/deploy-render.yml).

```
+-----------------------------------------------------------------------------------------------+
|                                MAKTABABORA CI/CD PIPELINE                                     |
+------------------------------+-------------------------------+--------------------------------+
|       1. CODE COMMIT         |     2. TEST & BUILD GATES     |      3. DEPLOY HOOK TRIGGER    |
+------------------------------+-------------------------------+--------------------------------+
| Developer pushes commit or   | GitHub Actions runner runs:   | On 100% test & build passage,  |
| opens PR to main or kimura.  | - PHP 8.2 + 127 PHPUnit tests | pipeline curls Render Deploy   |
|                              | - Node 20 + React Vite build  | Webhook with commit SHA.       |
|                              |   (Fullstack Verification)    | Render triggers Docker build.  |
+------------------------------+-------------------------------+--------------------------------+
```

#### Workflow Definition (`.github/workflows/deploy-render.yml`)
```yaml
name: Deploy MaktabaBora Backend to Render

on:
  push:
    branches: [ main, kimura ]
  pull_request:
    branches: [ main, kimura ]

jobs:
  test-and-deploy:
    name: Run Automated Test Gates & Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup PHP Runtime
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, ctype, iconv, intl, pdo_pgsql, pdo_sqlite
          coverage: none

      - name: Install Dependencies
        run: |
          cd backend
          composer install --prefer-dist --no-progress --no-interaction

      - name: Execute Automated Test Gates
        env:
          APP_ENV: testing
          DB_CONNECTION: sqlite
          DB_DATABASE: ':memory:'
        run: |
          cd backend
          php artisan test

      - name: Trigger Render Deploy Hook
        if: github.event_name == 'push' && success()
        run: |
          if [ -n "${{ secrets.RENDER_DEPLOY_HOOK_URL }}" ]; then
            curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
          else
            echo "Render Deploy Hook URL not configured; skipping trigger."
          fi
```

---

### 13.5 Database Hosting: Neon Serverless Cloud PostgreSQL

MaktabaBora relies exclusively on **Neon Serverless PostgreSQL** for persistent relational storage.

- **Connection URL Format:**
  ```ini
  DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-muddy-night-aee97x3v-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```
- **Connection Pooling & SSL:** Connects via Neon's built-in PgBouncer pooler (`-pooler.`) with mandatory TLS encryption (`sslmode=require`).
- **Dynamic Migration Fallback:** To prevent PgBouncer transaction-mode errors during DDL execution, [`backend/config/database.php`](file:///c:/Users/kimushzyyy/Documents/SCHOOL%20PROJECTS%203.2/Smart-library-management-system/backend/config/database.php) inspects CLI arguments. If `migrate` commands run, it dynamically strips `-pooler.` to execute schema changes through a direct compute connection.

---

### 13.6 MVP Deployment Trade-Off Analysis (Advantages & Disadvantages)

The MVP production stack (Render Free Tier Web Service + Neon Serverless PostgreSQL) offers compelling trade-offs suitable for project defense, academic evaluation, and demonstration:

```
+-------------------------------------------------------------+-------------------------------------------------------------+
| ADVANTAGES OF OUR MVP STACK                                 | DISADVANTAGES & LIMITATIONS OF OUR MVP STACK                |
+-------------------------------------------------------------+-------------------------------------------------------------+
| 1. Zero Infrastructure Expenditure ($0/month):              | 1. Free-Tier Inactivity Spin-Down (Cold Starts):            |
|    Hosts full Dockerized web service and serverless cloud   |    Render puts free web services to sleep after 15 minutes  |
|    PostgreSQL database with zero hosting costs.             |    of inactivity; the initial wake-up request incurs a      |
|                                                             |    30 to 50-second latency delay.                           |
| 2. Production-Grade Containerization:                       | 2. Compute & Memory Ceiling:                                |
|    Dockerized packaging ensures 100% environment parity     |    Render Free Tier provides 0.1 CPU cores and 512 MB RAM,  |
|    between local development and cloud production.          |    limiting maximum concurrent HTTP requests and batch ops. |
| 3. Automated TLS/SSL & Worldwide Ingress:                   | 3. Ephemeral Container Filesystem:                          |
|    Render issues and auto-renews free Let's Encrypt SSL      |    Container storage is ephemeral; local uploads or files   |
|    certificates, providing instant HTTPS encryption.        |    are wiped on redeploy (persisted safely in Neon DB).     |
| 4. Serverless Database Elasticity & Automated Backups:      | 4. Webhook Cold-Start Timeouts:                             |
|    Neon automatically scales storage and computes point-in- |    If a third-party webhook (e.g. M-Pesa) arrives while the  |
|    time restoration points without server management.       |    service is sleeping, the 30s delay may cause timeout.    |
| 5. Automated CI/CD Quality Assurance:                       | 5. Simulated M-Pesa Payment Flow:                           |
|    Every deployment is strictly gated by 127 automated      |    While the API contract is fully Daraja 2.0 compliant,   |
|    PHPUnit tests, preventing regressions from hitting live. |    it operates in simulation mode for evaluation safety.    |
+-------------------------------------------------------------+-------------------------------------------------------------+
```

#### Detailed Trade-Off Considerations
1. **Cold Start Management:** In a live demo, navigating to the backend URL 1 minute prior to evaluation warms up the container, eliminating cold-start latency for all subsequent interactions.
2. **State Persistence:** All operational application state (users, books, loans, fines, reservations, settings) is persisted in the remote Neon PostgreSQL cloud database, rendering container reboots completely non-destructive.
3. **Upgrade Pathway:** When transitioning beyond MVP to enterprise production, upgrading Render to the "Starter" tier ($7/month) removes spin-downs, provides dedicated CPU, and enables horizontal container auto-scaling.

---

### 13.7 Alternative Bare-Metal / Local Setup Guide

For on-premise institutional installations on physical Linux servers:

#### 1. Backend CLI Setup
```bash
# Clone the repository
git clone https://github.com/lornaarwa/Smart-library-management-system.git maktababora
cd maktababora/backend

# Install PHP dependencies with optimized autoloader
composer install --no-dev --optimize-autoloader

# Configure environment variables
cp .env.example .env
php artisan key:generate

# Execute database migrations and seed baseline catalog data
php artisan migrate --force --seed

# Optimize route, config, and view caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 2. Frontend SPA Compilation
```bash
cd ../frontend

# Install Node dependencies
npm install

# Compile production-ready Single Page Application bundle
npm run build

# Output in frontend/dist/ is served via Nginx or static file host
```

---

### 13.8 Production Environment Variables Reference (`backend/.env`)

```ini
APP_NAME="MaktabaBora"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://maktababora-backend.onrender.com

# Remote Neon Serverless PostgreSQL Database Connection
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-muddy-night-aee97x3v-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DB_CONNECTION=pgsql
RUN_MIGRATIONS=true

# Safaricom Daraja M-Pesa 2.0 Credentials (Simulated Evaluation Mode)
DARAJA_ENV=sandbox
DARAJA_CONSUMER_KEY=simulated_consumer_key
DARAJA_CONSUMER_SECRET=simulated_consumer_secret
DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
DARAJA_SHORTCODE=174379
DARAJA_CALLBACK_URL=https://maktababora-backend.onrender.com/api/v1/fines/daraja/callback

# AI Gateway Configurations
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Cache & Session Stores
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
```

---

## 14. Future Improvements and Roadmap

1. **Hardware RFID & Barcode Scanner Integration:** Direct WebUSB / HID scanner listener integration for hands-free, high-throughput book checkout desks.
2. **Encrypted Offline-First PWA Digital Reader:** Progressive Web App service-worker caching with AES-GCM client decryption to enable reading purchased eBooks offline without internet connectivity.
3. **Automated SMS Notifications via Africa's Talking:** Automated SMS alerts sent to patrons 48 hours prior to loan due dates and instant notifications when a reserved hold is ready for collection.
4. **Inter-Library Multi-Branch Synchronization:** Support for multiple physical library branches within a university or county system, enabling cross-branch transfers and centralized catalog searching.

---

## 15. Conclusion

**MaktabaBora** modernizes library management by uniting physical inventory administration with an advanced digital ecosystem. 

By combining a headless, interface-driven **Laravel 11 API**, a dynamic **React 18 frontend**, **PostgreSQL** data modeling, **Safaricom Daraja M-Pesa** financial settlement, and **Retrieval-Augmented Generation (RAG) artificial intelligence**, the platform delivers an enterprise-grade, secure, and production-ready solution for contemporary libraries in East Africa and beyond.

