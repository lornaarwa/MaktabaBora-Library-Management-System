# Class Diagrams Specification

This document details the object-oriented structure of the **Smart Library Management System** across Models, Controllers, and Services with all methods and attributes.

---

## 1. Eloquent Models Architecture

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

## 2. REST Controllers Layer

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

## 3. Services & Contracts Layer

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
