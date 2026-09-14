# MaktabaBora - Sequence Diagrams Specification

This document details the 6 core operational workflows of the **MaktabaBora Library Management System** using UML sequence diagrams formatted for **Horizontal A4** presentation.

---

## 1. Authentication & JWT Token Lifecycle

```mermaid
---
title: MAKTABABORA - AUTHENTICATION & JWT TOKEN LIFECYCLE
---
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

## 2. Physical Book Circulation: Checkout, Return & Overdue Fines

```mermaid
---
title: MAKTABABORA - PHYSICAL CIRCULATION, CHECKOUT & OVERDUE FINES
---
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

## 3. Hold Reservation Queue Lifecycle

```mermaid
---
title: MAKTABABORA - HOLD RESERVATION QUEUE & STAFF FULFILLMENT
---
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

## 4. One-Time Digital Book Purchase via M-Pesa STK Push & Lifetime Access Reader

```mermaid
---
title: MAKTABABORA - DIGITAL BOOK PURCHASE & LIFETIME READER ACCESS
---
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
    Safaricom->>Patron: SIM STK Prompt: "Do you want to pay KES 80 to MaktabaBora?"
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

## 5. Membership Perk Pass Subscription & Refund Flow

```mermaid
---
title: MAKTABABORA - MEMBERSHIP PASS SUBSCRIPTION & REFUND FLOW
---
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

## 6. Smart AI Librarian Assistant: Rate-Limited RAG Query Flow

```mermaid
---
title: MAKTABABORA - AI LIBRARIAN ASSISTANT (RAG & RATE LIMITING)
---
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
