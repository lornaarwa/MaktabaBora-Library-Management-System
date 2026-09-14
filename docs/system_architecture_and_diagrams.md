# Smart Library Management System (SmartLib / MaktabaBora)
## Complete Architecture, Diagrams & Database Schema Specification

This document provides the complete, authoritative software engineering specifications and UML diagrams for the **Smart Library Management System**, covering actors, operational lifecycles, full object-oriented classes with all attributes and methods, and the relational database schema.

---

## Table of Contents
1. [Use Case Diagram](#1-use-case-diagram)
2. [Sequence Diagrams](#2-sequence-diagrams)
   - [2.1. Authentication & JWT Token Lifecycle](#21-authentication--jwt-token-lifecycle)
   - [2.2. Physical Book Circulation: Checkout, Return & Overdue Fines](#22-physical-book-circulation-checkout-return--overdue-fines)
   - [2.3. Hold Reservation Queue Lifecycle](#23-hold-reservation-queue-lifecycle)
   - [2.4. Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader](#24-one-time-digital-book-purchase-via-m-pesa-stk-push--lifetime-access-reader)
   - [2.5. Membership Perk Pass Subscription & Refund Flow](#25-membership-perk-pass-subscription--refund-flow)
   - [2.6. Smart AI Librarian Assistant: Rate-Limited RAG Query Flow](#26-smart-ai-librarian-assistant-rate-limited-rag-query-flow)
3. [Class Diagrams](#3-class-diagrams)
   - [3.1. Eloquent Models Architecture](#31-eloquent-models-architecture)
   - [3.2. REST Controllers Layer](#32-rest-controllers-layer)
   - [3.3. Services & Contracts Layer](#33-services--contracts-layer)
4. [Complete Database Schema](#4-complete-database-schema)
   - [4.1. Entity-Relationship (ER) Diagram](#41-entity-relationship-er-diagram)
   - [4.2. Database Schema Table Dictionary](#42-database-schema-table-dictionary)

---

## 1. Use Case Diagram

The system serves four primary actors: **Guest / Public Visitor**, **Member (Patron)**, **Librarian (Staff)**, and **Administrator (Superuser)**, alongside external payment and AI gateways.

```mermaid
flowchart TD
    %% Actors
    Guest["👤 Guest / Public Patron"]
    Member["🎓 Registered Member"]
    Librarian["📚 Librarian Staff"]
    Admin["⚙️ System Administrator"]
    Daraja["💳 Safaricom Daraja M-Pesa Gateway"]
    AiProvider["🤖 AI Provider (Gemini / OpenAI / Claude)"]

    %% Guest Use Cases
    subgraph Guest_Use_Cases ["Public & Guest Operations"]
        UC1(["Browse & Search OPAC Catalog"])
        UC2(["View Book Synopsis & Shelf Availability"])
        UC3(["View Dynamic Membership Tiers"])
        UC4(["Register Member Account / Login"])
    end

    %% Member Use Cases
    subgraph Member_Use_Cases ["Member Operations"]
        UC5(["Borrow Physical Books (View Active Loans & Due Dates)"])
        UC6(["Place & Cancel Hold Reservations"])
        UC7(["Subscribe / Upgrade Membership Pass (M-Pesa STK)"])
        UC8(["Request Subscription Refund & Check Status"])
        UC9(["Purchase Digital Books with Lifetime Access"])
        UC10(["Read E-Books in Native Chapter Reader / PDF Stream"])
        UC11(["Pay Overdue Fines via M-Pesa STK Push"])
        UC12(["View & Print Purchase / Reservation Receipts"])
        UC13(["Query Smart AI Librarian Assistant"])
    end

    %% Librarian Use Cases
    subgraph Librarian_Use_Cases ["Librarian Circulation & Catalog Operations"]
        UC14(["Check Out Physical Book Copy (Barcode BC-...)"])
        UC15(["Process Return & Auto-Calculate Overdue Fines"])
        UC16(["Waive Patron Fines"])
        UC17(["Approve / Deny Hold Reservations & Queue"])
        UC18(["Manage Catalog (Add, Edit, Block Books)"])
        UC19(["Manage Physical Copies (Racks, Barcodes, Maintenance)"])
        UC20(["Search & 1-Click Import from Open Library"])
        UC21(["Configure Member Custom Borrow Limits"])
        UC22(["Review & Process Subscription Refund Requests"])
    end

    %% Administrator Use Cases
    subgraph Admin_Use_Cases ["Administrator & Governance Operations"]
        UC23(["Manage System Users & Ban/Unban Members"])
        UC24(["Register & Assign Librarians"])
        UC25(["Customize Membership Tiers (Limits, Prices, Perks)"])
        UC26(["Configure AI Providers, Models & System Guidelines"])
        UC27(["Dynamic Model Discovery (Live API Fetch)"])
        UC28(["View Platform Analytics, Revenue & API Traffic Logs"])
        UC29(["Direct Dynamic Table CRUD Management"])
    end

    %% Guest Associations
    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4

    %% Member Associations
    Member --> UC1
    Member --> UC5
    Member --> UC6
    Member --> UC7
    Member --> UC8
    Member --> UC9
    Member --> UC10
    Member --> UC11
    Member --> UC12
    Member --> UC13

    %% Librarian Associations
    Librarian --> UC14
    Librarian --> UC15
    Librarian --> UC16
    Librarian --> UC17
    Librarian --> UC18
    Librarian --> UC19
    Librarian --> UC20
    Librarian --> UC21
    Librarian --> UC22

    %% Admin Associations
    Admin --> UC23
    Admin --> UC24
    Admin --> UC25
    Admin --> UC26
    Admin --> UC27
    Admin --> UC28
    Admin --> UC29
    Admin -.->|Inherits Permissions| Librarian

    %% External Systems
    UC7 -.->|STK Push| Daraja
    UC9 -.->|STK Push| Daraja
    UC11 -.->|STK Push| Daraja
    UC13 -.->|Prompt & Context| AiProvider
```

---

## 2. Sequence Diagrams

### 2.1. Authentication & JWT Token Lifecycle
Illustrates patron registration, login verification, stateless HS256 JWT minting, and cache-backed logout blacklisting.

```mermaid
sequenceDiagram
    autonumber
    actor User as Patron / Client
    participant Frontend as React SPA (AuthContext)
    participant AuthCtrl as AuthController
    participant SessionSvc as AuthSessionService
    participant DB as PostgreSQL (Neon)
    participant Cache as Cache Store

    %% Registration
    User->>Frontend: Enter Name, Email, Password
    Frontend->>AuthCtrl: POST /api/v1/auth/register
    AuthCtrl->>DB: Check Unique Email & Insert User + Member
    DB-->>AuthCtrl: User Created (ID: 10, Role: 'member')
    AuthCtrl->>SessionSvc: generateToken(User, remember=false)
    SessionSvc-->>AuthCtrl: Access Token (HS256, 15 min TTL)
    AuthCtrl-->>Frontend: 201 Created { token, user }
    Frontend-->>User: Redirect to Member Dashboard

    %% Subsequent Login
    User->>Frontend: Enter Credentials (Email & Password)
    Frontend->>AuthCtrl: POST /api/v1/auth/login
    AuthCtrl->>DB: Query User by Email
    DB-->>AuthCtrl: User Record with Password Hash
    AuthCtrl->>AuthCtrl: Hash::check(password, user.password)
    AuthCtrl->>SessionSvc: createSessionToken(User, remember)
    SessionSvc-->>AuthCtrl: JWT Token
    AuthCtrl-->>Frontend: 200 OK { token, user }
    Frontend->>Frontend: Store in localStorage/sessionStorage

    %% API Request with Middleware
    Frontend->>AuthCtrl: GET /api/v1/auth/me [Bearer Token]
    Note over AuthCtrl,SessionSvc: JwtTokenValidation Middleware
    AuthCtrl->>SessionSvc: validateSessionToken(token)
    SessionSvc->>Cache: Check blacklisted_token:{hash}
    Cache-->>SessionSvc: Not Blacklisted
    SessionSvc->>SessionSvc: Verify HS256 Signature & Expiry
    SessionSvc->>DB: User::find(payload.sub)
    DB-->>SessionSvc: User Eloquent Model
    SessionSvc-->>AuthCtrl: User Instance
    AuthCtrl-->>Frontend: 200 OK { user profile, member data }

    %% Logout
    User->>Frontend: Click "Sign Out"
    Frontend->>AuthCtrl: POST /api/v1/auth/logout [Bearer Token]
    AuthCtrl->>SessionSvc: invalidateSessionToken(token)
    SessionSvc->>Cache: Cache::put("blacklisted_token:" . hash, true, remaining_ttl)
    AuthCtrl-->>Frontend: 200 OK { message: "Successfully logged out" }
    Frontend->>Frontend: Purge tokens, user & AI chat sessions
    Frontend-->>User: Redirect to Login / Home
```

---

### 2.2. Physical Book Circulation: Checkout, Return & Overdue Fines
Illustrates the physical borrowing lifecycle, barcode verification, custom borrow limits, return handling, and overdue fine generation.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    actor Lib as Librarian Staff
    participant UI as Librarian Dashboard
    participant LoanCtrl as LoanController
    participant LimitSvc as BorrowLimitService
    participant AvailSvc as BookAvailabilityService
    participant DB as PostgreSQL (Neon)

    %% Physical Checkout
    Patron->>Lib: Present physical book with barcode & Member ID
    Lib->>UI: Scan Barcode (e.g. BC-9780132350884-001) & Enter Member ID
    UI->>LoanCtrl: POST /api/v1/librarian/loans/checkout { member_id, barcode }
    
    Note over LoanCtrl,LimitSvc: ValidateBorrowLimit & CheckFine Middleware
    LoanCtrl->>LimitSvc: canBorrowMore(member)
    LimitSvc->>DB: Count active loans for Member
    DB-->>LimitSvc: Active Loans: 2 (Limit: 5)
    LimitSvc-->>LoanCtrl: Approved (Within Limit)
    
    LoanCtrl->>AvailSvc: isCopyAvailable(barcode)
    AvailSvc->>DB: Query BookCopy where barcode = ? and status = 'available'
    DB-->>AvailSvc: BookCopy found (Status: 'available')
    
    LoanCtrl->>DB: Start Transaction
    LoanCtrl->>DB: Create Loan (loan_date: today, due_date: +14 days, status: 'active')
    LoanCtrl->>DB: Update BookCopy (status: 'checked_out')
    LoanCtrl->>DB: Decrement Book available_copies
    LoanCtrl->>DB: Commit Transaction
    LoanCtrl-->>UI: 201 Created { loan, book_title, due_date }
    UI-->>Lib: Display Checkout Receipt & Issue Date

    %% Physical Return & Overdue Fines
    Patron->>Lib: Return physical book copy
    Lib->>UI: Scan Barcode for Return
    UI->>LoanCtrl: POST /api/v1/librarian/loans/{id}/return
    LoanCtrl->>DB: Fetch Loan with BookCopy and Member
    
    alt Book returned on or before due date
        LoanCtrl->>DB: Update Loan (status: 'returned', returned_date: today)
        LoanCtrl->>DB: Update BookCopy (status: 'available')
        LoanCtrl->>DB: Increment Book available_copies
        LoanCtrl-->>UI: 200 OK { message: "Book returned on time." }
    else Book is overdue (returned after due date)
        LoanCtrl->>LoanCtrl: Calculate overdue days (today - due_date)
        LoanCtrl->>DB: Create Fine (amount: days * KES 20.00, balance: amount, status: 'unpaid')
        LoanCtrl->>DB: Update Loan (status: 'overdue', returned_date: today)
        LoanCtrl->>DB: Update BookCopy (status: 'available')
        LoanCtrl->>DB: Increment Book available_copies
        LoanCtrl-->>UI: 200 OK { message: "Book returned overdue.", fine_assessed: 150.00 }
        UI-->>Lib: Prompt patron to pay fine via Daraja M-Pesa or Cash
    end
```

---

### 2.3. Hold Reservation Queue Lifecycle
Illustrates how patrons place holds when physical copies are exhausted, queue advancement, and staff fulfillment.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    actor Lib as Librarian Staff
    participant App as React Client
    participant ResCtrl as ReservationController
    participant QueueSvc as QueueReservationService
    participant LibCtrl as LibrarianDashboardController
    participant DB as PostgreSQL (Neon)

    %% Placing Hold
    Patron->>App: Click "Place Hold Reservation" on Book Details
    App->>ResCtrl: POST /api/v1/reservations { book_id }
    
    Note over ResCtrl,QueueSvc: CheckBookAvailability Middleware
    ResCtrl->>DB: Check Book available_copies
    DB-->>ResCtrl: available_copies = 0 (Eligible for hold queue)
    
    ResCtrl->>QueueSvc: placeHold(book, member)
    QueueSvc->>DB: Get max(queue_position) for book_id
    DB-->>QueueSvc: Current Queue Depth: 2
    QueueSvc->>DB: Insert Reservation (book_id, member_id, queue_position: 3, status: 'pending')
    DB-->>QueueSvc: Reservation Created
    QueueSvc-->>ResCtrl: Reservation Entity (Position 3)
    ResCtrl-->>App: 201 Created { queue_position: 3, status: 'pending' }
    App-->>Patron: "Hold placed! You are #3 in queue."

    %% Book Returned & Staff Fulfillment
    Lib->>DB: Another patron returns a copy of the book
    Lib->>LibCtrl: GET /api/v1/librarian/reservations?status=pending
    LibCtrl->>DB: Fetch pending reservations ordered by queue_position ASC
    DB-->>LibCtrl: Queue List (Patron #1 is next)
    LibCtrl-->>Lib: Display Next Hold Patron for Pickup
    
    Lib->>LibCtrl: POST /api/v1/librarian/reservations/{id}/approve
    LibCtrl->>DB: Start Transaction
    LibCtrl->>DB: Update Reservation (status: 'ready_for_pickup', expires_at: +48h)
    LibCtrl->>DB: Assign reserved copy
    LibCtrl->>DB: Commit Transaction
    LibCtrl-->>Lib: 200 OK (Hold Ready for Pickup)
    
    %% Patron Picks Up Book
    Patron->>Lib: Claims book at circulation desk
    Lib->>LibCtrl: Checkout Reserved Copy
    LibCtrl->>DB: Update Reservation (status: 'fulfilled')
    LibCtrl->>DB: Create Loan for Patron
```

---

### 2.4. One-Time Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader
Illustrates cart checkout, Daraja STK Push prompt to mobile phone, automated callback webhook, lifetime access entitlement, and native reader streaming.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    participant Browser as React SPA (Cart / Reader)
    participant DigitalCtrl as DigitalRentalController
    participant DarajaSvc as DarajaPaymentService
    participant Safaricom as Safaricom Daraja API
    participant FineCtrl as FineController (Callback)
    participant DB as PostgreSQL (Neon)

    %% Initiating Purchase
    Patron->>Browser: Click "Checkout Digital E-Books" in Cart
    Browser->>DigitalCtrl: POST /api/v1/digital-books/checkout-cart { phone_number, items }
    DigitalCtrl->>DB: Check Member Subscription status
    DB-->>DigitalCtrl: Subscribed = true (Apply 20% discount)
    DigitalCtrl->>DigitalCtrl: Calculate Total KES (e.g. KES 80.00 discounted from KES 100.00)
    
    %% STK Push
    DigitalCtrl->>DarajaSvc: initiateStkPush(phone, amount, "DIGITAL-CART-12")
    DarajaSvc->>Safaricom: POST /mpesa/stkpush/v1/processrequest
    Safaricom-->>DarajaSvc: 200 OK { MerchantRequestID, CheckoutRequestID, ResponseCode: "0" }
    DarajaSvc-->>DigitalCtrl: STK Push Sent
    DigitalCtrl-->>Browser: 200 OK { status: "pending", checkout_request_id }
    Browser-->>Patron: Show Daraja Modal: "Check your phone and enter M-Pesa PIN"

    %% Mobile Money Interaction
    Safaricom->>Patron: SIM STK Prompt: "Do you want to pay KES 80 to SmartLib?"
    Patron->>Safaricom: Enter M-Pesa Secret PIN

    %% Daraja Callback Hook
    Safaricom->>FineCtrl: POST /api/v1/fines/daraja/callback (Public Webhook)
    FineCtrl->>FineCtrl: Verify ResultCode == 0 (Successful Payment)
    FineCtrl->>DB: Start Transaction
    FineCtrl->>DB: Insert DigitalPurchase (member_id, book_id, amount_paid: 80.00, access_type: 'lifetime', status: 'active')
    FineCtrl->>DB: Commit Transaction
    FineCtrl-->>Safaricom: 200 OK { ResultDesc: "Accepted" }

    %% Frontend Reading E-Book
    Patron->>Browser: Go to "My Digital Library" & Click "Read Book"
    Browser->>DigitalCtrl: GET /api/v1/digital-books/{id}/read
    Note over DigitalCtrl,DB: EnsureValidDigitalAccess Middleware
    DigitalCtrl->>DB: Verify active DigitalPurchase for member_id & book_id
    DB-->>DigitalCtrl: Entitlement Valid (Lifetime Access Active)
    DigitalCtrl->>DB: Retrieve structured chapters from books.file_path
    DB-->>DigitalCtrl: JSON Chapters Data
    DigitalCtrl-->>Browser: 200 OK { chapters: [...], title: "Clean Code" }
    Browser->>Browser: Render DigitalReaderModal (Day/Sepia/Night, Paginated/Scroll Sheets)
    Browser-->>Patron: Interactive Reading Interface
```

---

### 2.5. Membership Perk Pass Subscription & Refund Flow
Illustrates member tier upgrading, 20% discount perk activation, refund submission, and staff reimbursement approval.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as Member Patron
    actor Staff as Librarian / Admin
    participant Client as React SPA (Membership & Profile)
    participant SubCtrl as SubscriptionController
    participant DarajaSvc as DarajaPaymentService
    participant LibCtrl as LibrarianDashboardController
    participant DB as PostgreSQL (Neon)

    %% Subscription Checkout
    Patron->>Client: Select "Scholar Tier" (KES 3,000 / month) & Enter Phone
    Client->>SubCtrl: POST /api/v1/subscriptions/checkout { plan_type: 'scholar', phone_number }
    SubCtrl->>DarajaSvc: initiateStkPush(phone, 3000, "MEMBERSHIP-scholar")
    DarajaSvc-->>SubCtrl: STK Push Dispatched
    SubCtrl->>DB: Expire previous active subscriptions
    SubCtrl->>DB: Insert Subscription (member_id, plan_type: 'scholar', amount_paid: 3000, payment_status: 'paid')
    SubCtrl->>DB: Update Member (is_subscribed: true, subscription_expires_at: +30 days, borrow_limit: 10)
    SubCtrl-->>Client: 200 OK { status: 'active', plan: 'scholar' }
    Client-->>Patron: "Scholar Pass Activated! 20% discount unlocked."

    %% Refund Request Flow
    Patron->>Client: Navigate to Profile -> Request Refund (within 7 days)
    Client->>SubCtrl: POST /api/v1/subscriptions/refund { reason: "Accidental tier selection" }
    SubCtrl->>DB: Query active subscription eligible for refund
    SubCtrl->>DB: Insert RefundRequest (user_id, member_id, amount: 3000, status: 'pending')
    SubCtrl-->>Client: 201 Created { message: "Refund request submitted for staff review." }
    Client-->>Patron: Display pending status badge

    %% Staff Review & Approval
    Staff->>Client: Open Librarian Dashboard -> "Refunds" Tab
    Client->>LibCtrl: GET /api/v1/librarian/refund-requests
    LibCtrl->>DB: Fetch pending refund requests with User & Member info
    DB-->>LibCtrl: Refund Request List
    LibCtrl-->>Client: Display Pending Requests Table
    
    Staff->>Client: Click "Approve Refund"
    Client->>LibCtrl: POST /api/v1/librarian/refund-requests/{id}/approve
    LibCtrl->>DB: Start Transaction
    LibCtrl->>DB: Update RefundRequest (status: 'approved', processed_by: staff_id, processed_at: now())
    LibCtrl->>DB: Update Subscription (payment_status: 'failed')
    LibCtrl->>DB: Update Member (is_subscribed: false, borrow_limit: 3)
    LibCtrl->>DB: Commit Transaction
    LibCtrl-->>Client: 200 OK (Refund Approved)
    Client-->>Staff: Display green success toast
```

---

### 2.6. Smart AI Librarian Assistant: Rate-Limited RAG Query Flow
Illustrates contextual catalog retrieval, token bucket throttling, multi-provider execution (Gemini/OpenAI/Claude/Offline), and session persistence.

```mermaid
sequenceDiagram
    autonumber
    actor Patron as Member / Patron
    participant ChatWidget as AiChatWidget.jsx
    participant AiCtrl as AiChatbotController
    participant Limiter as ChatbotCostLimiter (Middleware)
    participant RateLimiter as TokenBucketRateLimiter
    participant AiMgr as AiLibrarianManagerService
    participant DB as PostgreSQL (Neon)
    participant CloudAi as Gemini 2.5 Flash / OpenAI / Claude API

    Patron->>ChatWidget: "Can you recommend a good book on software architecture?"
    ChatWidget->>AiCtrl: POST /api/v1/ai/chat { prompt, chat_session_id }
    
    %% Token Bucket Rate Limiting
    Note over AiCtrl,RateLimiter: ChatbotCostLimiter Middleware
    AiCtrl->>RateLimiter: consume(member_id, tokens_requested: 50)
    alt Daily token limit exceeded
        RateLimiter-->>AiCtrl: False (Rate limit reached)
        AiCtrl-->>ChatWidget: 429 Too Many Requests { error: "Daily AI query limit reached." }
        ChatWidget-->>Patron: "Daily quota exhausted. Please try again tomorrow."
    else Token limit valid
        RateLimiter-->>AiCtrl: True (Quota available)
        
        %% Grounded Context Injection
        AiCtrl->>AiMgr: chat(prompt, chatSession, member)
        AiMgr->>DB: Query Books with Copies & Rack Locations
        DB-->>AiMgr: Catalog Records (e.g. Clean Code, DDIA, Pragmatic Programmer)
        AiMgr->>AiMgr: Assemble System Prompt (Library Persona + Navigation Guide + DB Books Context)
        
        %% Model Execution with 404 Auto-Recovery
        AiMgr->>CloudAi: POST /v1beta/models/gemini-2.5-flash:generateContent
        alt API Call Successful
            CloudAi-->>AiMgr: 200 OK { responseText, tokensUsed: 312 }
        else Model 404 Deprecated
            AiMgr->>AiMgr: Auto-migrate to gemini-2.5-flash fallback
            AiMgr->>CloudAi: Retry with gemini-2.5-flash
            CloudAi-->>AiMgr: 200 OK { responseText, tokensUsed: 312 }
        end

        %% Persist Chat & Audit Logs
        AiMgr->>DB: Insert ChatMessage (sender: 'user', message: prompt)
        AiMgr->>DB: Insert ChatMessage (sender: 'ai', message: responseText, tokens_used: 312)
        AiMgr->>DB: Insert AiUsageLog (member_id, tokens_consumed: 312, cost_estimate: 0.0003)
        AiMgr->>DB: Update ChatSession total_tokens_used
        
        AiMgr-->>AiCtrl: Response Payload { text: responseText, session_id }
        AiCtrl-->>ChatWidget: 200 OK { response: responseText, session_id }
        ChatWidget-->>Patron: Render rich markdown response with interactive book links
    end
```

---

## 3. Class Diagrams

### 3.1. Eloquent Models Architecture
Contains all 14 data models, their attributes, column types, relationship accessors, mutators, and business logic methods.

```mermaid
classDiagram
    class User {
        +int id
        +string name
        +string email
        +string password
        +string role
        +string avatar_base64
        +bool must_change_password
        +string subscription_status
        +int subscription_id
        +datetime email_verified_at
        +string remember_token
        +datetime created_at
        +datetime updated_at
        +member() HasOne
        +librarian() HasOne
        +subscriptions() HasMany
        +activeSubscription() BelongsTo
        +digitalPurchases() HasMany
    }

    class Member {
        +int id
        +int user_id
        +string member_number
        +string membership_tier
        +int borrow_limit
        +bool is_subscribed
        +datetime subscription_expires_at
        +bool is_banned
        +datetime banned_at
        +string ban_reason
        +datetime created_at
        +datetime updated_at
        +user() BelongsTo
        +loans() HasMany
        +reservations() HasMany
        +fines() HasMany
        +chatSessions() HasMany
        +subscriptions() HasMany
        +digitalPurchases() HasMany
    }

    class Librarian {
        +int id
        +int user_id
        +string employee_id
        +string department
        +datetime created_at
        +datetime updated_at
        +user() BelongsTo
    }

    class Book {
        +int id
        +string isbn
        +string title
        +string author
        +string publisher
        +string genre
        +string description
        +string cover_image_path
        +string file_path
        +string embedding
        +string embedding_model
        +datetime embedded_at
        +int publication_year
        +int total_copies
        +int available_copies
        +bool is_blocked
        +bool is_exclusive
        +float digital_purchase_price
        +float foreign_price
        +string foreign_currency
        +datetime created_at
        +datetime updated_at
        +getCoverImagePathAttribute(value) string
        +copies() HasMany
        +reservations() HasMany
        +digitalPurchases() HasMany
    }

    class BookCopy {
        +int id
        +int book_id
        +string barcode
        +string condition
        +string status
        +string location_rack
        +datetime created_at
        +datetime updated_at
        +book() BelongsTo
        +loans() HasMany
    }

    class Loan {
        +int id
        +int book_copy_id
        +int member_id
        +date loan_date
        +date due_date
        +date returned_date
        +string status
        +int renewal_count
        +datetime created_at
        +datetime updated_at
        +getBookTitleAttribute() string
        +getBarcodeAttribute() string
        +getFineAmountAttribute() float
        +getFineIdAttribute() int
        +bookCopy() BelongsTo
        +member() BelongsTo
        +fine() HasOne
    }

    class Reservation {
        +int id
        +int book_id
        +int member_id
        +int queue_position
        +string status
        +datetime reserved_at
        +datetime expires_at
        +datetime created_at
        +datetime updated_at
        +book() BelongsTo
        +member() BelongsTo
    }

    class Fine {
        +int id
        +int loan_id
        +int member_id
        +float amount
        +float balance
        +string status
        +string reason
        +string transaction_reference
        +datetime created_at
        +datetime updated_at
        +loan() BelongsTo
        +member() BelongsTo
    }

    class Subscription {
        +int id
        +int member_id
        +int user_id
        +string plan_type
        +float discount_percentage
        +float amount_paid
        +string payment_status
        +string transaction_reference
        +datetime starts_at
        +datetime expires_at
        +datetime created_at
        +datetime updated_at
        +member() BelongsTo
        +user() BelongsTo
        +digitalPurchases() HasMany
    }

    class DigitalPurchase {
        +int id
        +int member_id
        +int user_id
        +int book_id
        +int subscription_id
        +float standard_price
        +float amount_paid
        +datetime purchased_at
        +string access_type
        +string transaction_reference
        +string status
        +datetime created_at
        +datetime updated_at
        +member() BelongsTo
        +user() BelongsTo
        +book() BelongsTo
        +subscription() BelongsTo
    }

    class RefundRequest {
        +int id
        +int user_id
        +int member_id
        +int subscription_id
        +float amount
        +string reason
        +string status
        +string payment_reference
        +int processed_by
        +datetime processed_at
        +datetime created_at
        +datetime updated_at
        +user() BelongsTo
        +member() BelongsTo
        +subscription() BelongsTo
        +processor() BelongsTo
    }

    class ChatSession {
        +int id
        +int member_id
        +string title
        +int total_tokens_used
        +datetime created_at
        +datetime updated_at
        +member() BelongsTo
        +messages() HasMany
        +usageLogs() HasMany
    }

    class ChatMessage {
        +int id
        +int chat_session_id
        +string sender
        +string message
        +int tokens_used
        +datetime created_at
        +datetime updated_at
        +chatSession() BelongsTo
    }

    class AiUsageLog {
        +int id
        +int member_id
        +int chat_session_id
        +int tokens_consumed
        +float cost_estimate
        +string request_type
        +string ip_address
        +datetime created_at
        +datetime updated_at
        +member() BelongsTo
        +chatSession() BelongsTo
    }

    %% Relationships
    User "1" <--> "1" Member: hasOne / belongsTo
    User "1" <--> "1" Librarian: hasOne / belongsTo
    User "1" <--> "*" Subscription: hasMany / belongsTo
    User "1" <--> "*" DigitalPurchase: hasMany / belongsTo
    Member "1" <--> "*" Loan: hasMany / belongsTo
    Member "1" <--> "*" Reservation: hasMany / belongsTo
    Member "1" <--> "*" Fine: hasMany / belongsTo
    Member "1" <--> "*" ChatSession: hasMany / belongsTo
    Member "1" <--> "*" DigitalPurchase: hasMany / belongsTo
    Member "1" <--> "*" RefundRequest: hasMany / belongsTo
    Book "1" <--> "*" BookCopy: hasMany / belongsTo
    Book "1" <--> "*" Reservation: hasMany / belongsTo
    Book "1" <--> "*" DigitalPurchase: hasMany / belongsTo
    BookCopy "1" <--> "*" Loan: hasMany / belongsTo
    Loan "1" <--> "0..1" Fine: hasOne / belongsTo
    Subscription "1" <--> "*" DigitalPurchase: hasMany / belongsTo
    Subscription "1" <--> "*" RefundRequest: hasMany / belongsTo
    ChatSession "1" <--> "*" ChatMessage: hasMany / belongsTo
    ChatSession "1" <--> "*" AiUsageLog: hasMany / belongsTo
```

---

### 3.2. REST Controllers Layer
Contains controllers managing REST API endpoints, request validation, authorizations, and service delegation.

```mermaid
classDiagram
    class AuthController {
        -AuthSessionServiceInterface authService
        +register(Request request) JsonResponse
        +registerMembershipStk(Request request) JsonResponse
        +login(Request request) JsonResponse
        +me(Request request) JsonResponse
        +updateProfile(Request request) JsonResponse
        +refresh(Request request) JsonResponse
        +logout(Request request) JsonResponse
    }

    class BookInventoryController {
        -CatalogRetrievalServiceInterface catalogService
        -CurrencyConverterServiceInterface converter
        +index(Request request) JsonResponse
        +show(Book book) JsonResponse
        +store(Request request) JsonResponse
        +update(Request request, Book book) JsonResponse
        +destroy(Book book) JsonResponse
    }

    class CatalogSearchController {
        -CatalogSearchEngineInterface searchEngine
        +search(Request request) JsonResponse
    }

    class BookRecommendationController {
        -BookRecommendationServiceInterface recService
        +similar(Book book) JsonResponse
        +forMember(Request request) JsonResponse
    }

    class LoanController {
        -BookAvailabilityServiceInterface availService
        -BorrowLimitServiceInterface limitService
        -NotificationDispatcherServiceInterface notifyService
        +index(Request request) JsonResponse
        +checkout(Request request) JsonResponse
        +returnBook(Loan loan) JsonResponse
    }

    class FineController {
        -DarajaPaymentServiceInterface darajaService
        -NotificationDispatcherServiceInterface notifyService
        +index(Request request) JsonResponse
        +payWithDaraja(Fine fine, Request request) JsonResponse
        +darajaCallback(Request request) JsonResponse
        +waive(Fine fine) JsonResponse
    }

    class ReservationController {
        -QueueReservationServiceInterface queueService
        +index(Request request) JsonResponse
        +store(Request request) JsonResponse
        +destroy(Reservation reservation) JsonResponse
    }

    class DigitalRentalController {
        -DigitalRentalServiceInterface digitalService
        -DarajaPaymentServiceInterface darajaService
        +myLibrary(Request request) JsonResponse
        +checkoutCart(Request request) JsonResponse
        +purchase(int id, Request request) JsonResponse
        +read(int id, Request request) JsonResponse
    }

    class SubscriptionController {
        -DarajaPaymentServiceInterface darajaService
        -RefundManagementServiceInterface refundService
        +checkout(Request request) JsonResponse
        +status(Request request) JsonResponse
        +cancel(Request request) JsonResponse
        +requestRefund(Request request) JsonResponse
        +refundStatus(Request request) JsonResponse
    }

    class MembershipTierController {
        +index() JsonResponse
        +update(Request request) JsonResponse
        -getDefaultTiers() array
        -getSettingsFilePath() string
    }

    class AiChatbotController {
        -AiLibrarianManagerService aiManager
        +chat(Request request) JsonResponse
        +clearChat(Request request) JsonResponse
    }

    class AiSettingsController {
        -AiLibrarianManagerService aiManager
        +index() JsonResponse
        +update(Request request) JsonResponse
        +testKey(Request request) JsonResponse
        +fetchModels(Request request) JsonResponse
    }

    class LibrarianDashboardController {
        -OpenLibraryServiceInterface openLibrary
        +metrics() JsonResponse
        +members(Request request) JsonResponse
        +configureBorrowLimit(Member member, Request request) JsonResponse
        +toggleBookRestriction(Book book) JsonResponse
        +bookCopies(Request request) JsonResponse
        +storeBookCopy(Request request) JsonResponse
        +updateBookCopy(BookCopy copy, Request request) JsonResponse
        +deleteBookCopy(BookCopy copy) JsonResponse
        +activeLoans(Request request) JsonResponse
        +subscriptions(Request request) JsonResponse
        +storeSubscription(Request request) JsonResponse
        +updateSubscription(Subscription sub, Request request) JsonResponse
        +deleteSubscription(Subscription sub) JsonResponse
        +reimbursements() JsonResponse
        +reviewReimbursement(int id, Request request) JsonResponse
        +getRefundRequests() JsonResponse
        +approveRefund(int id) JsonResponse
        +rejectRefund(int id, Request request) JsonResponse
        +searchOpenLibrary(Request request) JsonResponse
        +importOpenLibrary(Request request) JsonResponse
        +reservations(Request request) JsonResponse
        +approveReservation(Reservation res) JsonResponse
        +denyReservation(Reservation res) JsonResponse
    }

    class AdminAnalyticsController {
        +analytics() JsonResponse
        +apiLogs(Request request) JsonResponse
        +banMember(Member member, Request request) JsonResponse
        +storeLibrarian(Request request) JsonResponse
    }

    class AdminCrudController {
        +indexTables() JsonResponse
        +getTableData(string table) JsonResponse
        +storeRecord(string table, Request request) JsonResponse
        +updateRecord(string table, int id, Request request) JsonResponse
        +destroyRecord(string table, int id) JsonResponse
    }
```

---

### 3.3. Services & Contracts Layer
Contains interfaces, domain business services, rate limiters, payment handlers, and external AI orchestrators.

```mermaid
classDiagram
    class AuthSessionServiceInterface {
        <<interface>>
        +createSessionToken(User user, bool remember) string
        +validateSessionToken(string token) ?User
        +invalidateSessionToken(string token) bool
        +getAuthenticatedUser(string token) ?User
    }

    class AuthSessionService {
        -string secret
        +generateToken(User user, bool remember) string
        +generateAccessToken(User user) string
        +generateRefreshToken(User user) string
        +buildJwt(User user, string type, int ttl) string
        +validateToken(string token) ?array
        +blacklistToken(string token) void
    }

    class DigitalRentalServiceInterface {
        <<interface>>
        +purchaseBook(Member member, Book book, string ref) DigitalPurchase
        +hasDigitalAccess(Member member, Book book) bool
        +getMemberLibrary(Member member) Collection
    }

    class DigitalRentalService {
        +purchaseBook(Member member, Book book, string ref) DigitalPurchase
        +hasDigitalAccess(Member member, Book book) bool
        +getMemberLibrary(Member member) Collection
        +canReadBook(Member member, Book book) bool
        +getPurchasedContent(Member member, Book book) string
    }

    class DarajaPaymentServiceInterface {
        <<interface>>
        +initiateStkPush(string phone, float amount, string ref) array
        +processCallback(array payload) array
        +queryStatus(string checkoutRequestId) array
    }

    class DarajaPaymentService {
        -string consumerKey
        -string consumerSecret
        -string passkey
        -string shortcode
        -string env
        +generateAccessToken() string
        +initiateStkPush(string phone, float amount, string ref) array
        +processCallback(array payload) array
        +queryStatus(string checkoutRequestId) array
    }

    class OpenLibraryServiceInterface {
        <<interface>>
        +search(string query, int page) array
        +importToCatalog(array bookData) Book
    }

    class OpenLibraryService {
        -string userAgent
        -int throttleMs
        +search(string query, int page) array
        +fetchSubject(string subject, int limit) array
        +importToCatalog(array bookData) Book
        +buildBookCopies(Book book, int count) void
    }

    class AiLibrarianManagerService {
        -string settingsFilePath
        +getDefaultSystemPrompt() string
        +getDefaultSettings() array
        +getSettings() array
        +saveSettings(array settings) void
        +testKey(string provider, string key) array
        +fetchAvailableModels(string provider, ?string key) array
        +chat(string prompt, ?ChatSession session, ?Member member) array
        -callGemini(string prompt, array config, string systemPrompt) array
        -callOpenAi(string prompt, array config, string systemPrompt) array
        -callAnthropic(string prompt, array config, string systemPrompt) array
        -callOfflineEngine(string prompt, ?Member member) array
        -buildCatalogContext() string
    }

    class TokenBucketRateLimiter {
        +consume(int memberId, int tokens) bool
        +getRemainingTokens(int memberId) int
        +reset(int memberId) void
    }

    class BookRecommendationService {
        +getSimilarBooks(Book book, int limit) Collection
        +getRecommendationsForMember(Member member, int limit) Collection
        -buildTfIdfMatrix(Collection books) array
        -computeCosineSimilarity(array vec1, array vec2) float
    }

    class CurrencyConverterService {
        -float fallbackRate
        +convertUsdToKes(float usdAmount) float
        +getExchangeRates() array
    }

    class BorrowLimitService {
        +canBorrowMore(Member member) bool
        +getActiveLoansCount(Member member) int
        +getEffectiveLimit(Member member) int
    }

    class QueueReservationService {
        +placeHold(Book book, Member member) Reservation
        +cancelReservation(Reservation reservation) bool
        +getNextInQueue(Book book) ?Reservation
        +fulfillReservation(Reservation reservation) Loan
    }

    AuthSessionServiceInterface <|.. AuthSessionService
    DigitalRentalServiceInterface <|.. DigitalRentalService
    DarajaPaymentServiceInterface <|.. DarajaPaymentService
    OpenLibraryServiceInterface <|.. OpenLibraryService
```

---

## 4. Complete Database Schema

### 4.1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o| MEMBERS : "profile for"
    USERS ||--o| LIBRARIANS : "staff profile for"
    USERS ||--o{ SUBSCRIPTIONS : "subscribes"
    USERS ||--o{ DIGITAL_PURCHASES : "purchases"
    USERS ||--o{ REFUND_REQUESTS : "requests"

    MEMBERS ||--o{ LOANS : "borrows"
    MEMBERS ||--o{ RESERVATIONS : "reserves"
    MEMBERS ||--o{ FINES : "incurs"
    MEMBERS ||--o{ SUBSCRIPTIONS : "holds"
    MEMBERS ||--o{ DIGITAL_PURCHASES : "owns"
    MEMBERS ||--o{ CHAT_SESSIONS : "initiates"
    MEMBERS ||--o{ AI_USAGE_LOGS : "consumes"

    BOOKS ||--o{ BOOK_COPIES : "manifests"
    BOOKS ||--o{ RESERVATIONS : "queued for"
    BOOKS ||--o{ DIGITAL_PURCHASES : "sold digitally"

    BOOK_COPIES ||--o{ LOANS : "lent via"

    LOANS ||--o| FINES : "assesses"

    SUBSCRIPTIONS ||--o{ DIGITAL_PURCHASES : "applies discount"
    SUBSCRIPTIONS ||--o{ REFUND_REQUESTS : "refunded via"

    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"
    CHAT_SESSIONS ||--o{ AI_USAGE_LOGS : "tracks"

    USERS {
        bigserial id PK
        varchar name
        varchar email UK
        varchar password
        varchar role
        text avatar_base64
        boolean must_change_password
        varchar subscription_status
        bigint subscription_id FK
        timestamp email_verified_at
        varchar remember_token
        timestamp created_at
        timestamp updated_at
    }

    MEMBERS {
        bigserial id PK
        bigint user_id FK
        varchar member_number UK
        varchar membership_tier
        integer borrow_limit
        boolean is_subscribed
        timestamp subscription_expires_at
        boolean is_banned
        timestamp banned_at
        varchar ban_reason
        timestamp created_at
        timestamp updated_at
    }

    LIBRARIANS {
        bigserial id PK
        bigint user_id FK
        varchar employee_id UK
        varchar department
        timestamp created_at
        timestamp updated_at
    }

    BOOKS {
        bigserial id PK
        varchar isbn UK
        varchar title
        varchar author
        varchar publisher
        varchar genre
        text description
        text cover_image_path
        longtext file_path
        longtext embedding
        varchar embedding_model
        timestamp embedded_at
        integer publication_year
        integer total_copies
        integer available_copies
        boolean is_blocked
        boolean is_exclusive
        decimal digital_purchase_price
        decimal foreign_price
        varchar foreign_currency
        timestamp created_at
        timestamp updated_at
    }

    BOOK_COPIES {
        bigserial id PK
        bigint book_id FK
        varchar barcode UK
        varchar condition
        varchar status
        varchar location_rack
        timestamp created_at
        timestamp updated_at
    }

    LOANS {
        bigserial id PK
        bigint book_copy_id FK
        bigint member_id FK
        date loan_date
        date due_date
        date returned_date
        varchar status
        integer renewal_count
        timestamp created_at
        timestamp updated_at
    }

    RESERVATIONS {
        bigserial id PK
        bigint book_id FK
        bigint member_id FK
        integer queue_position
        varchar status
        timestamp reserved_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    FINES {
        bigserial id PK
        bigint loan_id FK
        bigint member_id FK
        decimal amount
        decimal balance
        varchar status
        varchar reason
        varchar transaction_reference
        timestamp created_at
        timestamp updated_at
    }

    SUBSCRIPTIONS {
        bigserial id PK
        bigint member_id FK
        bigint user_id FK
        varchar plan_type
        decimal discount_percentage
        decimal amount_paid
        varchar payment_status
        varchar transaction_reference
        timestamp starts_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    DIGITAL_PURCHASES {
        bigserial id PK
        bigint member_id FK
        bigint user_id FK
        bigint book_id FK
        bigint subscription_id FK
        decimal standard_price
        decimal amount_paid
        timestamp purchased_at
        varchar access_type
        varchar transaction_reference
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    REFUND_REQUESTS {
        bigserial id PK
        bigint user_id FK
        bigint member_id FK
        bigint subscription_id FK
        decimal amount
        varchar reason
        varchar status
        varchar payment_reference
        bigint processed_by FK
        timestamp processed_at
        timestamp created_at
        timestamp updated_at
    }

    CHAT_SESSIONS {
        bigserial id PK
        bigint member_id FK
        varchar title
        integer total_tokens_used
        timestamp created_at
        timestamp updated_at
    }

    CHAT_MESSAGES {
        bigserial id PK
        bigint chat_session_id FK
        varchar sender
        text message
        integer tokens_used
        timestamp created_at
        timestamp updated_at
    }

    AI_USAGE_LOGS {
        bigserial id PK
        bigint member_id FK
        bigint chat_session_id FK
        integer tokens_consumed
        decimal cost_estimate
        varchar request_type
        varchar ip_address
        timestamp created_at
        timestamp updated_at
    }
```

---

### 4.2. Database Schema Table Dictionary

#### 1. `users` Table
Primary authentication entity for patrons, librarians, and administrators.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `name` | `VARCHAR(255)` | No | — | Full name of user |
| `email` | `VARCHAR(255)` | No | — | Unique login email |
| `email_verified_at` | `TIMESTAMP` | Yes | `NULL` | Verification timestamp |
| `password` | `VARCHAR(255)` | No | — | Bcrypt / Argon2 password hash |
| `role` | `VARCHAR(255)` | No | `'member'` | Role gate: `member`, `librarian`, `admin` |
| `avatar_base64` | `TEXT` | Yes | `NULL` | Base64 encoded patron avatar image |
| `must_change_password` | `BOOLEAN` | No | `FALSE` | Enforced first-login password reset |
| `subscription_status` | `VARCHAR(255)`| No | `'none'` | `'none'`, `'active'`, `'expired'` |
| `subscription_id` | `BIGINT` | Yes | `NULL` | FK to `subscriptions.id` (current pass) |
| `remember_token` | `VARCHAR(100)` | Yes | `NULL` | Session cookie token |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record last updated timestamp |

#### 2. `members` Table
Patron-specific library profile and circulation parameters.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `member_number` | `VARCHAR(255)` | No | — | Unique identifier (e.g. `MEM-2026`) |
| `membership_tier` | `VARCHAR(255)` | No | `'standard'` | `student`, `standard`, `scholar`, `faculty`, `general` |
| `borrow_limit` | `INTEGER` | No | `3` | Maximum concurrent physical loans allowed |
| `is_subscribed` | `BOOLEAN` | No | `FALSE` | Active perk pass discount status |
| `subscription_expires_at` | `TIMESTAMP`| Yes | `NULL` | Perk pass expiry date |
| `is_banned` | `BOOLEAN` | No | `FALSE` | True if account access is restricted |
| `banned_at` | `TIMESTAMP` | Yes | `NULL` | Time ban was imposed |
| `ban_reason` | `VARCHAR(255)` | Yes | `NULL` | Administrative reason for ban |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 3. `librarians` Table
Staff-specific profile linking users to library circulation and catalog roles.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `employee_id` | `VARCHAR(255)` | No | — | Unique staff ID (e.g. `LIB-1002`) |
| `department` | `VARCHAR(255)` | Yes | `NULL` | Assigned library department |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 4. `books` Table
Core catalog metadata, digital reading contents, and retail pricing.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `isbn` | `VARCHAR(255)` | No | — | Unique standard book number |
| `title` | `VARCHAR(255)` | No | — | Official title |
| `author` | `VARCHAR(255)` | No | — | Author / contributors |
| `publisher` | `VARCHAR(255)` | Yes | `NULL` | Publishing house |
| `genre` | `VARCHAR(255)` | No | — | Literary category |
| `description` | `TEXT` | Yes | `NULL` | Book overview & synopsis |
| `cover_image_path`| `TEXT` | Yes | `NULL` | URL or asset path to book cover image |
| `file_path` | `LONGTEXT` | Yes | `NULL` | JSON multi-chapter structured content / PDF |
| `embedding` | `LONGTEXT` | Yes | `NULL` | JSON vector for semantic similarity |
| `embedding_model`| `VARCHAR(255)` | Yes | `NULL` | Model used for embedding generation |
| `embedded_at` | `TIMESTAMP` | Yes | `NULL` | Timestamp of last vector indexing |
| `publication_year`| `INTEGER` | Yes | `NULL` | Year of publication |
| `total_copies` | `INTEGER` | No | `1` | Total inventory copies owned |
| `available_copies`| `INTEGER` | No | `1` | Inventory copies currently on shelf |
| `is_blocked` | `BOOLEAN` | No | `FALSE` | If true, borrowing is restricted |
| `is_exclusive` | `BOOLEAN` | No | `FALSE` | VIP/Subscriber exclusive access |
| `digital_purchase_price` | `DECIMAL(8,2)` | No | `50.00` | Authoritative digital price in KES |
| `foreign_price` | `DECIMAL(10,2)`| Yes | `NULL` | Retail price in foreign currency |
| `foreign_currency` | `VARCHAR(3)` | Yes | `NULL` | Currency code (e.g. `USD`, `EUR`) |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 5. `book_copies` Table
Individual physical inventory units with unique scannable barcodes.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `book_id` | `BIGINT` | No | — | FK &rarr; `books.id` (ON DELETE CASCADE) |
| `barcode` | `VARCHAR(255)` | No | — | Unique barcode (e.g. `BC-9780132350884-001`) |
| `condition` | `VARCHAR(255)` | No | `'good'` | `'good'`, `'damaged'`, `'lost'` |
| `status` | `VARCHAR(255)` | No | `'available'` | `'available'`, `'checked_out'`, `'reserved'`, `'maintenance'` |
| `location_rack` | `VARCHAR(255)` | Yes | `NULL` | Physical shelf location (e.g. `Rack-3`) |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 6. `loans` Table
Physical borrowing transactions.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `book_copy_id` | `BIGINT` | No | — | FK &rarr; `book_copies.id` (ON DELETE CASCADE) |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `loan_date` | `DATE` | No | — | Date book was checked out |
| `due_date` | `DATE` | No | — | Date book must be returned |
| `returned_date` | `DATE` | Yes | `NULL` | Date book was checked back in |
| `status` | `VARCHAR(255)` | No | `'active'` | `'active'`, `'returned'`, `'overdue'` |
| `renewal_count` | `INTEGER` | No | `0` | Number of times loan was extended |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 7. `reservations` Table
Hold reservation queue for books with zero available physical copies.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `book_id` | `BIGINT` | No | — | FK &rarr; `books.id` (ON DELETE CASCADE) |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `queue_position`| `INTEGER` | No | `1` | FIFO queue position |
| `status` | `VARCHAR(255)` | No | `'pending'` | `'pending'`, `'ready_for_pickup'`, `'fulfilled'`, `'expired'`, `'cancelled'` |
| `reserved_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | Time hold was placed |
| `expires_at` | `TIMESTAMP` | Yes | `NULL` | 48h pickup window expiration |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 8. `fines` Table
Overdue fines assessed on late returns and damages.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `loan_id` | `BIGINT` | No | — | FK &rarr; `loans.id` (ON DELETE CASCADE) |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `amount` | `DECIMAL(10,2)`| No | — | Total fine assessed in KES |
| `balance` | `DECIMAL(10,2)`| No | — | Remaining unpaid balance |
| `status` | `VARCHAR(255)` | No | `'unpaid'` | `'unpaid'`, `'paid'`, `'waived'`, `'partial'` |
| `reason` | `VARCHAR(255)` | No | `'overdue'` | `'overdue'`, `'damage'`, `'loss'` |
| `transaction_reference` | `VARCHAR(255)`| Yes | `NULL` | Daraja M-Pesa receipt code |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 9. `subscriptions` Table
Member perk subscription passes granting digital discounts and higher borrow limits.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `plan_type` | `VARCHAR(255)` | No | `'pro_perks_monthly'` | Tier plan code (e.g. `scholar`, `student`) |
| `discount_percentage` | `DECIMAL(5,2)`| No | `20.00` | Percentage discount on digital purchases |
| `amount_paid` | `DECIMAL(10,2)`| No | `500.00` | Fee paid in KES |
| `payment_status`| `VARCHAR(255)` | No | `'paid'` | `'pending'`, `'paid'`, `'failed'` |
| `transaction_reference` | `VARCHAR(255)`| Yes | `NULL` | Daraja STK checkout reference |
| `starts_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | Subscription start timestamp |
| `expires_at` | `TIMESTAMP` | Yes | `NULL` | Subscription expiry timestamp |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 10. `digital_purchases` Table
Permanent, one-time paid entitlements granting lifetime digital reader access.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `book_id` | `BIGINT` | No | — | FK &rarr; `books.id` (ON DELETE CASCADE) |
| `subscription_id`| `BIGINT` | Yes | `NULL` | FK &rarr; `subscriptions.id` (discount applied) |
| `standard_price`| `DECIMAL(8,2)` | No | — | Standard retail catalog price |
| `amount_paid` | `DECIMAL(8,2)` | No | — | Final price paid after member perks |
| `purchased_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | Purchase completion timestamp |
| `access_type` | `VARCHAR(255)` | No | `'lifetime'` | Indefinite lifetime reading license |
| `transaction_reference` | `VARCHAR(255)`| Yes | `NULL` | Daraja payment reference |
| `status` | `VARCHAR(255)` | No | `'active'` | `'active'`, `'refunded'` |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 11. `refund_requests` Table
Member refund requests for perk subscriptions with staff audit trail.
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `member_id` | `BIGINT` | No | — | FK &rarr; `members.id` (ON DELETE CASCADE) |
| `subscription_id`| `BIGINT` | Yes | `NULL` | FK &rarr; `subscriptions.id` |
| `amount` | `DECIMAL(10,2)`| No | — | Requested refund amount |
| `reason` | `VARCHAR(255)` | No | — | Reason provided by patron |
| `status` | `VARCHAR(255)` | No | `'pending'` | `'pending'`, `'approved'`, `'rejected'` |
| `payment_reference`| `VARCHAR(255)`| Yes | `NULL` | Original transaction reference |
| `processed_by` | `BIGINT` | Yes | `NULL` | FK &rarr; `users.id` (Staff who reviewed) |
| `processed_at` | `TIMESTAMP` | Yes | `NULL` | Timestamp of staff review |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

#### 12. `chat_sessions`, `chat_messages`, `ai_usage_logs` Tables
Context-aware AI Librarian conversation sessions and cost audit logs.
| Table | Key Columns | Description |
| :--- | :--- | :--- |
| **`chat_sessions`** | `id`, `member_id` (FK), `title`, `total_tokens_used`, `timestamps` | Chat container per patron session. |
| **`chat_messages`** | `id`, `chat_session_id` (FK), `sender` (`user`/`ai`), `message`, `tokens_used`, `timestamps` | Conversation turn messages. |
| **`ai_usage_logs`** | `id`, `member_id` (FK), `chat_session_id` (FK), `tokens_consumed`, `cost_estimate`, `request_type`, `ip_address`, `timestamps` | Cost and token consumption ledger. |

