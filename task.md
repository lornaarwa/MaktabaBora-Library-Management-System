# Smart Library Management System - Master Implementation Task List (`task.md`)

This document serves as the interactive task checklist for accountability, progress tracking, and git commit history enforcement across all implementation subphases.

---

## Master Phase Checklist

- [x] **Phase 1: Contracts & Interfaces Foundation**
- [x] **Phase 2: Domain Services & Unit Tests (9 Services)**
- [x] **Phase 3: Service Providers & Unit Tests (6 Providers)**
- [x] **Phase 4: Custom Middleware Pipeline & Unit Tests (14 Middlewares)**
- [x] **Phase 5: REST Controllers & Tests (10 Controllers)**
- [x] **Phase 6: Routes Wire-up & Integration Test**
- [x] **Phase 7: Full Test Suite Verification**
- [x] **Phase 8: Member Subscriptions (Perks) & Digital Purchases (Indefinite Access)**

---

## Detailed Task Breakdown & Commit Hooks

### Phase 1: Service Interfaces & Contracts Foundation
- [x] Create `App\Contracts\Services` interface files:
  - [x] `AuthSessionServiceInterface.php`
  - [x] `CatalogSearchEngineInterface.php`
  - [x] `BookAvailabilityServiceInterface.php`
  - [x] `BorrowLimitServiceInterface.php`
  - [x] `QueueReservationServiceInterface.php`
  - [x] `DarajaPaymentServiceInterface.php`
  - [x] `NotificationDispatcherServiceInterface.php`
  - [x] `OpenAiRecommendationServiceInterface.php`
  - [x] `TokenBucketRateLimiterInterface.php`
- [x] Create `tests/Unit/ContractsIntegrityTest.php`
- [x] Run test: `php artisan test --filter=ContractsIntegrityTest`
- [x] **Git Commit**: `"feat(contracts): add service interfaces and contracts integrity unit test"`

---

### Phase 2: Domain Services & Unit Tests

- [x] **Phase 2.1**: `AuthSessionService`
  - [x] Implement `AuthSessionService.php`
  - [x] Create `tests/Unit/Services/AuthSessionServiceTest.php`
  - [x] Run test: `php artisan test --filter=AuthSessionServiceTest`
  - [x] **Git Commit**: `"feat(services): implement AuthSessionService with dedicated unit test"`

- [x] **Phase 2.2**: `CatalogSearchEngine`
  - [x] Implement `CatalogSearchEngine.php`
  - [x] Create `tests/Unit/Services/CatalogSearchEngineTest.php`
  - [x] Run test: `php artisan test --filter=CatalogSearchEngineTest`
  - [x] **Git Commit**: `"feat(services): implement CatalogSearchEngine with OPAC search unit test"`

- [x] **Phase 2.3**: `BookAvailabilityService`
  - [x] Implement `BookAvailabilityService.php`
  - [x] Create `tests/Unit/Services/BookAvailabilityServiceTest.php`
  - [x] Run test: `php artisan test --filter=BookAvailabilityServiceTest`
  - [x] **Git Commit**: `"feat(services): implement BookAvailabilityService with inventory stock unit test"`

- [x] **Phase 2.4**: `BorrowLimitService`
  - [x] Implement `BorrowLimitService.php`
  - [x] Create `tests/Unit/Services/BorrowLimitServiceTest.php`
  - [x] Run test: `php artisan test --filter=BorrowLimitServiceTest`
  - [x] **Git Commit**: `"feat(services): implement BorrowLimitService with threshold unit test"`

- [x] **Phase 2.5**: `QueueReservationService`
  - [x] Implement `QueueReservationService.php`
  - [x] Create `tests/Unit/Services/QueueReservationServiceTest.php`
  - [x] Run test: `php artisan test --filter=QueueReservationServiceTest`
  - [x] **Git Commit**: `"feat(services): implement QueueReservationService with hold queue unit test"`

- [x] **Phase 2.6**: `DarajaPaymentService`
  - [x] Implement `DarajaPaymentService.php`
  - [x] Create `tests/Unit/Services/DarajaPaymentServiceTest.php`
  - [x] Run test: `php artisan test --filter=DarajaPaymentServiceTest`
  - [x] **Git Commit**: `"feat(services): implement DarajaPaymentService with M-Pesa STK push unit test"`

- [x] **Phase 2.7**: `NotificationDispatcherService`
  - [x] Implement `NotificationDispatcherService.php`
  - [x] Create `tests/Unit/Services/NotificationDispatcherServiceTest.php`
  - [x] Run test: `php artisan test --filter=NotificationDispatcherServiceTest`
  - [x] **Git Commit**: `"feat(services): implement NotificationDispatcherService with alert unit test"`

- [x] **Phase 2.8**: `OpenAiRecommendationService`
  - [x] Implement `OpenAiRecommendationService.php`
  - [x] Create `tests/Unit/Services/OpenAiRecommendationServiceTest.php`
  - [x] Run test: `php artisan test --filter=OpenAiRecommendationServiceTest`
  - [x] **Git Commit**: `"feat(services): implement OpenAiRecommendationService with AI prompt unit test"`

- [x] **Phase 2.9**: `TokenBucketRateLimiter`
  - [x] Implement `TokenBucketRateLimiter.php`
  - [x] Create `tests/Unit/Services/TokenBucketRateLimiterTest.php`
  - [x] Run test: `php artisan test --filter=TokenBucketRateLimiterTest`
  - [x] **Git Commit**: `"feat(services): implement TokenBucketRateLimiter with bucket quota unit test"`

---

### Phase 3: Service Providers & Unit Tests

- [x] **Phase 3.1**: `AppServiceProvider`
  - [x] Refactor `AppServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AppServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AppServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AppServiceProvider with provider binding unit test"`

- [x] **Phase 3.2**: `AuthServiceProvider`
  - [x] Refactor `AuthServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AuthServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AuthServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AuthServiceProvider with auth gate unit test"`

- [x] **Phase 3.3**: `SearchCatalogProvider`
  - [x] Refactor `SearchCatalogProvider.php`
  - [x] Create `tests/Unit/Providers/SearchCatalogProviderTest.php`
  - [x] Run test: `php artisan test --filter=SearchCatalogProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update SearchCatalogProvider with engine binding unit test"`

- [x] **Phase 3.4**: `FinePaymentServiceProvider`
  - [x] Refactor `FinePaymentServiceProvider.php`
  - [x] Create `tests/Unit/Providers/FinePaymentServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=FinePaymentServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update FinePaymentServiceProvider with Daraja binding unit test"`

- [x] **Phase 3.5**: `AiChatbotServiceProvider`
  - [x] Refactor `AiChatbotServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AiChatbotServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AiChatbotServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AiChatbotServiceProvider with OpenAI binding unit test"`

- [x] **Phase 3.6**: `LibraryEventServiceProvider`
  - [x] Refactor `LibraryEventServiceProvider.php`
  - [x] Create `tests/Unit/Providers/LibraryEventServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=LibraryEventServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update LibraryEventServiceProvider with domain event unit test"`

---

### Phase 4: Custom Middleware Pipeline & Unit Tests

- [x] **Phase 4.1**: `EnsureIsLibrarian`
  - [x] Refactor `EnsureIsLibrarian.php`
  - [x] Create `tests/Unit/Middleware/EnsureIsLibrarianTest.php`
  - [x] Run test: `php artisan test --filter=EnsureIsLibrarianTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize EnsureIsLibrarian with role guard unit test"`

- [x] **Phase 4.2**: `EnsureHasAccount`
  - [x] Refactor `EnsureHasAccount.php`
  - [x] Create `tests/Unit/Middleware/EnsureHasAccountTest.php`
  - [x] Run test: `php artisan test --filter=EnsureHasAccountTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize EnsureHasAccount with auth guard unit test"`

- [x] **Phase 4.3**: `CheckBannedStatus`
  - [x] Refactor `CheckBannedStatus.php`
  - [x] Create `tests/Unit/Middleware/CheckBannedStatusTest.php`
  - [x] Run test: `php artisan test --filter=CheckBannedStatusTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckBannedStatus with account status unit test"`

- [x] **Phase 4.4**: `ValidateBorrowLimit`
  - [x] Refactor `ValidateBorrowLimit.php`
  - [x] Create `tests/Unit/Middleware/ValidateBorrowLimitTest.php`
  - [x] Run test: `php artisan test --filter=ValidateBorrowLimitTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ValidateBorrowLimit with borrow limit unit test"`

- [x] **Phase 4.5**: `CheckBookAvailability`
  - [x] Refactor `CheckBookAvailability.php`
  - [x] Create `tests/Unit/Middleware/CheckBookAvailabilityTest.php`
  - [x] Run test: `php artisan test --filter=CheckBookAvailabilityTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckBookAvailability with stock unit test"`

- [x] **Phase 4.6**: `CheckReservationAvailability`
  - [x] Refactor `CheckReservationAvailability.php`
  - [x] Create `tests/Unit/Middleware/CheckReservationAvailabilityTest.php`
  - [x] Run test: `php artisan test --filter=CheckReservationAvailabilityTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckReservationAvailability with hold guard unit test"`

- [x] **Phase 4.7**: `CheckFineAmount`
  - [x] Refactor `CheckFineAmount.php`
  - [x] Create `tests/Unit/Middleware/CheckFineAmountTest.php`
  - [x] Run test: `php artisan test --filter=CheckFineAmountTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckFineAmount with fine threshold unit test"`

- [x] **Phase 4.8**: `JwtTokenValidation`
  - [x] Refactor `JwtTokenValidation.php`
  - [x] Create `tests/Unit/Middleware/JwtTokenValidationTest.php`
  - [x] Run test: `php artisan test --filter=JwtTokenValidationTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize JwtTokenValidation with signature unit test"`

- [x] **Phase 4.9**: `ChatbotCostLimiter`
  - [x] Refactor `ChatbotCostLimiter.php`
  - [x] Create `tests/Unit/Middleware/ChatbotCostLimiterTest.php`
  - [x] Run test: `php artisan test --filter=ChatbotCostLimiterTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ChatbotCostLimiter with token quota unit test"`

- [x] **Phase 4.10**: `ThrottleRequestsMiddleware`
  - [x] Refactor `ThrottleRequestsMiddleware.php`
  - [x] Create `tests/Unit/Middleware/ThrottleRequestsMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=ThrottleRequestsMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ThrottleRequestsMiddleware with rate unit test"`

- [x] **Phase 4.11**: `IpRateLimiter`
  - [x] Refactor `IpRateLimiter.php`
  - [x] Create `tests/Unit/Middleware/IpRateLimiterTest.php`
  - [x] Run test: `php artisan test --filter=IpRateLimiterTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize IpRateLimiter with IP guard unit test"`

- [x] **Phase 4.12**: `CorsMiddleware`
  - [x] Refactor `CorsMiddleware.php`
  - [x] Create `tests/Unit/Middleware/CorsMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=CorsMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): update CorsMiddleware with CORS header unit test"`

- [x] **Phase 4.13**: `TrustProxiesMiddleware`
  - [x] Refactor `TrustProxiesMiddleware.php`
  - [x] Create `tests/Unit/Middleware/TrustProxiesMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=TrustProxiesMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): update TrustProxiesMiddleware with proxy header unit test"`

- [x] **Phase 4.14**: `ApiGatewayProxy`
  - [x] Refactor `ApiGatewayProxy.php`
  - [x] Create `tests/Unit/Middleware/ApiGatewayProxyTest.php`
  - [x] Run test: `php artisan test --filter=ApiGatewayProxyTest`
  - [x] **Git Commit**: `"refactor(middleware): update ApiGatewayProxy with gateway header unit test"`

---

### Phase 5: REST Controllers & Tests

- [x] **Phase 5.1**: `Controller` (Base Controller)
  - [x] Refactor `Controller.php`
  - [x] Create `tests/Unit/Controllers/BaseControllerTest.php`
  - [x] Run test: `php artisan test --filter=BaseControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): base Controller response helper with unit test"`

- [x] **Phase 5.2**: `AuthController`
  - [x] Refactor `AuthController.php`
  - [x] Create `tests/Feature/Controllers/AuthControllerTest.php`
  - [x] Run test: `php artisan test --filter=AuthControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple AuthController with auth feature test"`

- [x] **Phase 5.3**: `CatalogSearchController`
  - [x] Refactor `CatalogSearchController.php`
  - [x] Create `tests/Feature/Controllers/CatalogSearchControllerTest.php`
  - [x] Run test: `php artisan test --filter=CatalogSearchControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple CatalogSearchController with search feature test"`

- [x] **Phase 5.4**: `BookInventoryController`
  - [x] Refactor `BookInventoryController.php`
  - [x] Create `tests/Feature/Controllers/BookInventoryControllerTest.php`
  - [x] Run test: `php artisan test --filter=BookInventoryControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize BookInventoryController with CRUD feature test"`

- [x] **Phase 5.5**: `LoanController`
  - [x] Refactor `LoanController.php`
  - [x] Create `tests/Feature/Controllers/LoanControllerTest.php`
  - [x] Run test: `php artisan test --filter=LoanControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple LoanController with circulation feature test"`

- [x] **Phase 5.6**: `FineController`
  - [x] Refactor `FineController.php`
  - [x] Create `tests/Feature/Controllers/FineControllerTest.php`
  - [x] Run test: `php artisan test --filter=FineControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple FineController with Daraja payment feature test"`

- [x] **Phase 5.7**: `ReservationController`
  - [x] Refactor `ReservationController.php`
  - [x] Create `tests/Feature/Controllers/ReservationControllerTest.php`
  - [x] Run test: `php artisan test --filter=ReservationControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple ReservationController with hold feature test"`

- [x] **Phase 5.8**: `AiChatbotController`
  - [x] Refactor `AiChatbotController.php`
  - [x] Create `tests/Feature/Controllers/AiChatbotControllerTest.php`
  - [x] Run test: `php artisan test --filter=AiChatbotControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple AiChatbotController with AI prompt feature test"`

- [x] **Phase 5.9**: `LibrarianDashboardController`
  - [x] Refactor `LibrarianDashboardController.php`
  - [x] Create `tests/Feature/Controllers/LibrarianDashboardControllerTest.php`
  - [x] Run test: `php artisan test --filter=LibrarianDashboardControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize LibrarianDashboardController with staff feature test"`

- [x] **Phase 5.10**: `ApiGatewayController`
  - [x] Refactor `ApiGatewayController.php`
  - [x] Create `tests/Feature/Controllers/ApiGatewayControllerTest.php`
  - [x] Run test: `php artisan test --filter=ApiGatewayControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize ApiGatewayController with proxy feature test"`

---

### Phase 6: Routes Wire-up & Integration Test
- [x] Wire up API routes in `routes/api.php`
- [x] Create `tests/Feature/ApiRoutesWireUpTest.php`
- [x] Run test: `php artisan test --filter=ApiRoutesWireUpTest`
- [x] **Git Commit**: `"feat(routes): wire up API pipeline with integration wire-up test"`

---

### Phase 7: Full Test Suite Verification & Final Polish
- [x] Run full test suite: `php artisan test`
- [x] Verify clean route list: `php artisan route:list`
- [x] **Git Commit**: `"test(suite): complete unit and feature test suite verification"`

---

### Phase 8: Member Subscriptions (Perks) & One-Time Digital Purchases (Indefinite Access)

- [x] **Subphase 8.1**: Database Migration
  - [x] Create `database/migrations/2026_01_01_000002_create_subscriptions_and_digital_purchases_tables.php`
  - [x] Run migration: `php artisan migrate`
  - [x] **Git Commit**: `"feat(db): add migrations for member subscriptions and digital purchases"`

- [x] **Subphase 8.2**: Eloquent Models & Unit Test
  - [x] Create `App\Models\Subscription.php` & `App\Models\DigitalPurchase.php`
  - [x] Update `User.php`, `Member.php`, and `Book.php` relations
  - [x] Create `tests/Unit/Models/SubscriptionModelTest.php`
  - [x] Run test: `php artisan test --filter=SubscriptionModelTest`
  - [x] **Git Commit**: `"feat(models): implement Subscription and DigitalPurchase models"`

- [x] **Subphase 8.3**: Service Contracts & Digital Store Service
  - [x] Create `App\Contracts\Services\DigitalRentalServiceInterface.php`
  - [x] Implement `App\Services\DigitalRentalService.php` (Perk discount calculations)
  - [x] Create `tests/Unit/Services/DigitalRentalServiceTest.php`
  - [x] Run test: `php artisan test --filter=DigitalRentalServiceTest`
  - [x] **Git Commit**: `"feat(services): implement DigitalRentalService with discount calculations"`

- [x] **Subphase 8.4**: Custom Middleware Guard
  - [x] Create `App\Http\Middleware\EnsureValidDigitalAccess.php`
  - [x] Create `tests/Unit/Middleware/EnsureValidDigitalAccessTest.php`
  - [x] Run test: `php artisan test --filter=EnsureValidDigitalAccessTest`
  - [x] **Git Commit**: `"feat(middleware): add EnsureValidDigitalAccess middleware for digital reading"`

- [x] **Subphase 8.5**: Subscription Controller & Feature Test
  - [x] Create `App\Http\Controllers\SubscriptionController.php`
  - [x] Create `tests/Feature/Controllers/SubscriptionControllerTest.php`
  - [x] Run test: `php artisan test --filter=SubscriptionControllerTest`
  - [x] **Git Commit**: `"feat(controllers): add SubscriptionController with Daraja perk pass checkout"`

- [x] **Subphase 8.6**: Digital Rental Controller & Feature Test
  - [x] Create `App\Http\Controllers\DigitalRentalController.php`
  - [x] Create `tests/Feature/Controllers/DigitalRentalControllerTest.php`
  - [x] Run test: `php artisan test --filter=DigitalRentalControllerTest`
  - [x] **Git Commit**: `"feat(controllers): add DigitalRentalController with one-time purchase and access streaming"`

- [x] **Subphase 8.7**: Routes Wire-Up & Full Suite Verification
  - [x] Update `routes/api.php` with `/api/v1/subscriptions` and `/api/v1/digital-books`
  - [x] Run full test suite: `php artisan test`
  - [x] **Git Commit**: `"test(suite): verify full suite with subscriptions and digital purchases"`


---

## Detailed Task Breakdown & Commit Hooks

### Phase 1: Service Interfaces & Contracts Foundation
- [x] Create `App\Contracts\Services` interface files:
  - [x] `AuthSessionServiceInterface.php`
  - [x] `CatalogSearchEngineInterface.php`
  - [x] `BookAvailabilityServiceInterface.php`
  - [x] `BorrowLimitServiceInterface.php`
  - [x] `QueueReservationServiceInterface.php`
  - [x] `DarajaPaymentServiceInterface.php`
  - [x] `NotificationDispatcherServiceInterface.php`
  - [x] `OpenAiRecommendationServiceInterface.php`
  - [x] `TokenBucketRateLimiterInterface.php`
- [x] Create `tests/Unit/ContractsIntegrityTest.php`
- [x] Run test: `php artisan test --filter=ContractsIntegrityTest`
- [x] **Git Commit**: `"feat(contracts): add service interfaces and contracts integrity unit test"`

---

### Phase 2: Domain Services & Unit Tests

- [x] **Phase 2.1**: `AuthSessionService`
  - [x] Implement `AuthSessionService.php`
  - [x] Create `tests/Unit/Services/AuthSessionServiceTest.php`
  - [x] Run test: `php artisan test --filter=AuthSessionServiceTest`
  - [x] **Git Commit**: `"feat(services): implement AuthSessionService with dedicated unit test"`

- [x] **Phase 2.2**: `CatalogSearchEngine`
  - [x] Implement `CatalogSearchEngine.php`
  - [x] Create `tests/Unit/Services/CatalogSearchEngineTest.php`
  - [x] Run test: `php artisan test --filter=CatalogSearchEngineTest`
  - [x] **Git Commit**: `"feat(services): implement CatalogSearchEngine with OPAC search unit test"`

- [x] **Phase 2.3**: `BookAvailabilityService`
  - [x] Implement `BookAvailabilityService.php`
  - [x] Create `tests/Unit/Services/BookAvailabilityServiceTest.php`
  - [x] Run test: `php artisan test --filter=BookAvailabilityServiceTest`
  - [x] **Git Commit**: `"feat(services): implement BookAvailabilityService with inventory stock unit test"`

- [x] **Phase 2.4**: `BorrowLimitService`
  - [x] Implement `BorrowLimitService.php`
  - [x] Create `tests/Unit/Services/BorrowLimitServiceTest.php`
  - [x] Run test: `php artisan test --filter=BorrowLimitServiceTest`
  - [x] **Git Commit**: `"feat(services): implement BorrowLimitService with threshold unit test"`

- [x] **Phase 2.5**: `QueueReservationService`
  - [x] Implement `QueueReservationService.php`
  - [x] Create `tests/Unit/Services/QueueReservationServiceTest.php`
  - [x] Run test: `php artisan test --filter=QueueReservationServiceTest`
  - [x] **Git Commit**: `"feat(services): implement QueueReservationService with hold queue unit test"`

- [x] **Phase 2.6**: `DarajaPaymentService`
  - [x] Implement `DarajaPaymentService.php`
  - [x] Create `tests/Unit/Services/DarajaPaymentServiceTest.php`
  - [x] Run test: `php artisan test --filter=DarajaPaymentServiceTest`
  - [x] **Git Commit**: `"feat(services): implement DarajaPaymentService with M-Pesa STK push unit test"`

- [x] **Phase 2.7**: `NotificationDispatcherService`
  - [x] Implement `NotificationDispatcherService.php`
  - [x] Create `tests/Unit/Services/NotificationDispatcherServiceTest.php`
  - [x] Run test: `php artisan test --filter=NotificationDispatcherServiceTest`
  - [x] **Git Commit**: `"feat(services): implement NotificationDispatcherService with alert unit test"`

- [x] **Phase 2.8**: `OpenAiRecommendationService`
  - [x] Implement `OpenAiRecommendationService.php`
  - [x] Create `tests/Unit/Services/OpenAiRecommendationServiceTest.php`
  - [x] Run test: `php artisan test --filter=OpenAiRecommendationServiceTest`
  - [x] **Git Commit**: `"feat(services): implement OpenAiRecommendationService with AI prompt unit test"`

- [x] **Phase 2.9**: `TokenBucketRateLimiter`
  - [x] Implement `TokenBucketRateLimiter.php`
  - [x] Create `tests/Unit/Services/TokenBucketRateLimiterTest.php`
  - [x] Run test: `php artisan test --filter=TokenBucketRateLimiterTest`
  - [x] **Git Commit**: `"feat(services): implement TokenBucketRateLimiter with bucket quota unit test"`

---

### Phase 3: Service Providers & Unit Tests

- [x] **Phase 3.1**: `AppServiceProvider`
  - [x] Refactor `AppServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AppServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AppServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AppServiceProvider with provider binding unit test"`

- [x] **Phase 3.2**: `AuthServiceProvider`
  - [x] Refactor `AuthServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AuthServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AuthServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AuthServiceProvider with auth gate unit test"`

- [x] **Phase 3.3**: `SearchCatalogProvider`
  - [x] Refactor `SearchCatalogProvider.php`
  - [x] Create `tests/Unit/Providers/SearchCatalogProviderTest.php`
  - [x] Run test: `php artisan test --filter=SearchCatalogProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update SearchCatalogProvider with engine binding unit test"`

- [x] **Phase 3.4**: `FinePaymentServiceProvider`
  - [x] Refactor `FinePaymentServiceProvider.php`
  - [x] Create `tests/Unit/Providers/FinePaymentServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=FinePaymentServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update FinePaymentServiceProvider with Daraja binding unit test"`

- [x] **Phase 3.5**: `AiChatbotServiceProvider`
  - [x] Refactor `AiChatbotServiceProvider.php`
  - [x] Create `tests/Unit/Providers/AiChatbotServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=AiChatbotServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update AiChatbotServiceProvider with OpenAI binding unit test"`

- [x] **Phase 3.6**: `LibraryEventServiceProvider`
  - [x] Refactor `LibraryEventServiceProvider.php`
  - [x] Create `tests/Unit/Providers/LibraryEventServiceProviderTest.php`
  - [x] Run test: `php artisan test --filter=LibraryEventServiceProviderTest`
  - [x] **Git Commit**: `"refactor(providers): update LibraryEventServiceProvider with domain event unit test"`

---

### Phase 4: Custom Middleware Pipeline & Unit Tests

- [x] **Phase 4.1**: `EnsureIsLibrarian`
  - [x] Refactor `EnsureIsLibrarian.php`
  - [x] Create `tests/Unit/Middleware/EnsureIsLibrarianTest.php`
  - [x] Run test: `php artisan test --filter=EnsureIsLibrarianTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize EnsureIsLibrarian with role guard unit test"`

- [x] **Phase 4.2**: `EnsureHasAccount`
  - [x] Refactor `EnsureHasAccount.php`
  - [x] Create `tests/Unit/Middleware/EnsureHasAccountTest.php`
  - [x] Run test: `php artisan test --filter=EnsureHasAccountTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize EnsureHasAccount with auth guard unit test"`

- [x] **Phase 4.3**: `CheckBannedStatus`
  - [x] Refactor `CheckBannedStatus.php`
  - [x] Create `tests/Unit/Middleware/CheckBannedStatusTest.php`
  - [x] Run test: `php artisan test --filter=CheckBannedStatusTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckBannedStatus with account status unit test"`

- [x] **Phase 4.4**: `ValidateBorrowLimit`
  - [x] Refactor `ValidateBorrowLimit.php`
  - [x] Create `tests/Unit/Middleware/ValidateBorrowLimitTest.php`
  - [x] Run test: `php artisan test --filter=ValidateBorrowLimitTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ValidateBorrowLimit with borrow limit unit test"`

- [x] **Phase 4.5**: `CheckBookAvailability`
  - [x] Refactor `CheckBookAvailability.php`
  - [x] Create `tests/Unit/Middleware/CheckBookAvailabilityTest.php`
  - [x] Run test: `php artisan test --filter=CheckBookAvailabilityTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckBookAvailability with stock unit test"`

- [x] **Phase 4.6**: `CheckReservationAvailability`
  - [x] Refactor `CheckReservationAvailability.php`
  - [x] Create `tests/Unit/Middleware/CheckReservationAvailabilityTest.php`
  - [x] Run test: `php artisan test --filter=CheckReservationAvailabilityTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckReservationAvailability with hold guard unit test"`

- [x] **Phase 4.7**: `CheckFineAmount`
  - [x] Refactor `CheckFineAmount.php`
  - [x] Create `tests/Unit/Middleware/CheckFineAmountTest.php`
  - [x] Run test: `php artisan test --filter=CheckFineAmountTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize CheckFineAmount with fine threshold unit test"`

- [x] **Phase 4.8**: `JwtTokenValidation`
  - [x] Refactor `JwtTokenValidation.php`
  - [x] Create `tests/Unit/Middleware/JwtTokenValidationTest.php`
  - [x] Run test: `php artisan test --filter=JwtTokenValidationTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize JwtTokenValidation with signature unit test"`

- [x] **Phase 4.9**: `ChatbotCostLimiter`
  - [x] Refactor `ChatbotCostLimiter.php`
  - [x] Create `tests/Unit/Middleware/ChatbotCostLimiterTest.php`
  - [x] Run test: `php artisan test --filter=ChatbotCostLimiterTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ChatbotCostLimiter with token quota unit test"`

- [x] **Phase 4.10**: `ThrottleRequestsMiddleware`
  - [x] Refactor `ThrottleRequestsMiddleware.php`
  - [x] Create `tests/Unit/Middleware/ThrottleRequestsMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=ThrottleRequestsMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize ThrottleRequestsMiddleware with rate unit test"`

- [x] **Phase 4.11**: `IpRateLimiter`
  - [x] Refactor `IpRateLimiter.php`
  - [x] Create `tests/Unit/Middleware/IpRateLimiterTest.php`
  - [x] Run test: `php artisan test --filter=IpRateLimiterTest`
  - [x] **Git Commit**: `"refactor(middleware): optimize IpRateLimiter with IP guard unit test"`

- [x] **Phase 4.12**: `CorsMiddleware`
  - [x] Refactor `CorsMiddleware.php`
  - [x] Create `tests/Unit/Middleware/CorsMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=CorsMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): update CorsMiddleware with CORS header unit test"`

- [x] **Phase 4.13**: `TrustProxiesMiddleware`
  - [x] Refactor `TrustProxiesMiddleware.php`
  - [x] Create `tests/Unit/Middleware/TrustProxiesMiddlewareTest.php`
  - [x] Run test: `php artisan test --filter=TrustProxiesMiddlewareTest`
  - [x] **Git Commit**: `"refactor(middleware): update TrustProxiesMiddleware with proxy header unit test"`

- [x] **Phase 4.14**: `ApiGatewayProxy`
  - [x] Refactor `ApiGatewayProxy.php`
  - [x] Create `tests/Unit/Middleware/ApiGatewayProxyTest.php`
  - [x] Run test: `php artisan test --filter=ApiGatewayProxyTest`
  - [x] **Git Commit**: `"refactor(middleware): update ApiGatewayProxy with gateway header unit test"`

---

### Phase 5: REST Controllers & Tests

- [x] **Phase 5.1**: `Controller` (Base Controller)
  - [x] Refactor `Controller.php`
  - [x] Create `tests/Unit/Controllers/BaseControllerTest.php`
  - [x] Run test: `php artisan test --filter=BaseControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): base Controller response helper with unit test"`

- [x] **Phase 5.2**: `AuthController`
  - [x] Refactor `AuthController.php`
  - [x] Create `tests/Feature/Controllers/AuthControllerTest.php`
  - [x] Run test: `php artisan test --filter=AuthControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple AuthController with auth feature test"`

- [x] **Phase 5.3**: `CatalogSearchController`
  - [x] Refactor `CatalogSearchController.php`
  - [x] Create `tests/Feature/Controllers/CatalogSearchControllerTest.php`
  - [x] Run test: `php artisan test --filter=CatalogSearchControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple CatalogSearchController with search feature test"`

- [x] **Phase 5.4**: `BookInventoryController`
  - [x] Refactor `BookInventoryController.php`
  - [x] Create `tests/Feature/Controllers/BookInventoryControllerTest.php`
  - [x] Run test: `php artisan test --filter=BookInventoryControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize BookInventoryController with CRUD feature test"`

- [x] **Phase 5.5**: `LoanController`
  - [x] Refactor `LoanController.php`
  - [x] Create `tests/Feature/Controllers/LoanControllerTest.php`
  - [x] Run test: `php artisan test --filter=LoanControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple LoanController with circulation feature test"`

- [x] **Phase 5.6**: `FineController`
  - [x] Refactor `FineController.php`
  - [x] Create `tests/Feature/Controllers/FineControllerTest.php`
  - [x] Run test: `php artisan test --filter=FineControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple FineController with Daraja payment feature test"`

- [x] **Phase 5.7**: `ReservationController`
  - [x] Refactor `ReservationController.php`
  - [x] Create `tests/Feature/Controllers/ReservationControllerTest.php`
  - [x] Run test: `php artisan test --filter=ReservationControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple ReservationController with hold feature test"`

- [x] **Phase 5.8**: `AiChatbotController`
  - [x] Refactor `AiChatbotController.php`
  - [x] Create `tests/Feature/Controllers/AiChatbotControllerTest.php`
  - [x] Run test: `php artisan test --filter=AiChatbotControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): decouple AiChatbotController with AI prompt feature test"`

- [x] **Phase 5.9**: `LibrarianDashboardController`
  - [x] Refactor `LibrarianDashboardController.php`
  - [x] Create `tests/Feature/Controllers/LibrarianDashboardControllerTest.php`
  - [x] Run test: `php artisan test --filter=LibrarianDashboardControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize LibrarianDashboardController with staff feature test"`

- [x] **Phase 5.10**: `ApiGatewayController`
  - [x] Refactor `ApiGatewayController.php`
  - [x] Create `tests/Feature/Controllers/ApiGatewayControllerTest.php`
  - [x] Run test: `php artisan test --filter=ApiGatewayControllerTest`
  - [x] **Git Commit**: `"refactor(controllers): optimize ApiGatewayController with proxy feature test"`

---

### Phase 6: Routes Wire-up & Integration Test
- [x] Wire up API routes in `routes/api.php`
- [x] Create `tests/Feature/ApiRoutesWireUpTest.php`
- [x] Run test: `php artisan test --filter=ApiRoutesWireUpTest`
- [x] **Git Commit**: `"feat(routes): wire up API pipeline with integration wire-up test"`

---

### Phase 7: Full Test Suite Verification & Final Polish
- [x] Run full test suite: `php artisan test`
- [x] Verify clean route list: `php artisan route:list`
- [x] **Git Commit**: `"test(suite): complete unit and feature test suite verification"`

---

### Phase 8: Member Subscriptions (Perks) & One-Time Digital Purchases (Indefinite Access)

- [ ] **Subphase 8.1**: Database Migration
  - [ ] Create `database/migrations/2026_01_01_000002_create_subscriptions_and_digital_purchases_tables.php`
  - [ ] Run migration: `php artisan migrate`
  - [ ] **Git Commit**: `"feat(db): add migrations for member subscriptions and digital purchases"`

- [ ] **Subphase 8.2**: Eloquent Models & Unit Test
  - [ ] Create `App\Models\Subscription.php` & `App\Models\DigitalPurchase.php`
  - [ ] Update `User.php`, `Member.php`, and `Book.php` relations
  - [ ] Create `tests/Unit/Models/SubscriptionModelTest.php`
  - [ ] Run test: `php artisan test --filter=SubscriptionModelTest`
  - [ ] **Git Commit**: `"feat(models): implement Subscription and DigitalPurchase models"`

- [ ] **Subphase 8.3**: Service Contracts & Digital Store Service
  - [ ] Create `App\Contracts\Services\DigitalRentalServiceInterface.php`
  - [ ] Implement `App\Services\DigitalRentalService.php` (Perk discount calculations)
  - [ ] Create `tests/Unit/Services/DigitalRentalServiceTest.php`
  - [ ] Run test: `php artisan test --filter=DigitalRentalServiceTest`
  - [ ] **Git Commit**: `"feat(services): implement DigitalRentalService with discount calculations"`

- [ ] **Subphase 8.4**: Custom Middleware Guard
  - [ ] Create `App\Http\Middleware\EnsureValidDigitalAccess.php`
  - [ ] Create `tests/Unit/Middleware/EnsureValidDigitalAccessTest.php`
  - [ ] Run test: `php artisan test --filter=EnsureValidDigitalAccessTest`
  - [ ] **Git Commit**: `"feat(middleware): add EnsureValidDigitalAccess middleware for digital reading"`

- [ ] **Subphase 8.5**: Subscription Controller & Feature Test
  - [ ] Create `App\Http\Controllers\SubscriptionController.php`
  - [ ] Create `tests/Feature/Controllers/SubscriptionControllerTest.php`
  - [ ] Run test: `php artisan test --filter=SubscriptionControllerTest`
  - [ ] **Git Commit**: `"feat(controllers): add SubscriptionController with Daraja perk pass checkout"`

- [ ] **Subphase 8.6**: Digital Rental Controller & Feature Test
  - [ ] Create `App\Http\Controllers\DigitalRentalController.php`
  - [ ] Create `tests/Feature/Controllers/DigitalRentalControllerTest.php`
  - [ ] Run test: `php artisan test --filter=DigitalRentalControllerTest`
  - [ ] **Git Commit**: `"feat(controllers): add DigitalRentalController with one-time purchase and access streaming"`

- [ ] **Subphase 8.7**: Routes Wire-Up & Full Suite Verification
  - [ ] Update `routes/api.php` with `/api/v1/subscriptions` and `/api/v1/digital-books`
  - [ ] Run full test suite: `php artisan test`
  - [ ] **Git Commit**: `"test(suite): verify full suite with subscriptions and digital purchases"`
