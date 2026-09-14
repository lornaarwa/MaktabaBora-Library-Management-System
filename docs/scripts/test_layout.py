import urllib.request
import json
import zlib
import base64
import re
from PIL import Image
import io

def test_class_services():
    code = """---
title: MAKTABABORA - DOMAIN SERVICES & INTERFACE CONTRACTS
---
classDiagram
    direction TB

    class AuthSessionServiceInterface {
        <<interface>>
        +createSessionToken(User user, bool remember) string
        +validateSessionToken(string token) ?User
        +invalidateSessionToken(string token) bool
    }
    class AuthSessionService {
        -string secret
        +generateToken(User user, bool remember) string
        +validateToken(string token) ?array
        +blacklistToken(string token) void
    }

    class DigitalRentalServiceInterface {
        <<interface>>
        +purchaseBook(Member member, Book book, string ref) DigitalPurchase
        +hasDigitalAccess(Member member, Book book) bool
        +getPurchasedContent(Member member, Book book) string
    }
    class DigitalRentalService {
        +purchaseBook(Member member, Book book, string ref) DigitalPurchase
        +hasDigitalAccess(Member member, Book book) bool
        +getPurchasedContent(Member member, Book book) string
    }

    class DarajaPaymentServiceInterface {
        <<interface>>
        +initiateStkPush(string phone, float amount, string ref) array
        +processCallback(array payload) array
        +queryStatus(string checkoutRequestId) array
    }
    class DarajaPaymentService {
        +initiateStkPush(string phone, float amount, string ref) array
        +processCallback(array payload) array
    }

    class OpenLibraryServiceInterface {
        <<interface>>
        +search(string query, int page) array
        +importToCatalog(array bookData) Book
    }
    class OpenLibraryService {
        +search(string query, int page) array
        +fetchSubject(string subject, int limit) array
        +importToCatalog(array bookData) Book
    }

    class AiLibrarianManagerService {
        +chat(string prompt, ?ChatSession session, ?Member member) array
        +fetchAvailableModels(string provider, ?string key) array
        +saveSettings(array settings) void
    }

    class TokenBucketRateLimiter {
        +consume(int memberId, int tokens) bool
        +getRemainingTokens(int memberId) int
        +reset(int memberId) void
    }

    class BookRecommendationService {
        +getSimilarBooks(Book book, int limit) Collection
        +getRecommendationsForMember(Member member, int limit) Collection
    }

    class CurrencyConverterService {
        +convertUsdToKes(float usdAmount) float
        +getExchangeRates() array
    }

    class BorrowLimitService {
        +canBorrowMore(Member member) bool
        +getActiveLoansCount(Member member) int
    }

    class QueueReservationService {
        +placeHold(Book book, Member member) Reservation
        +cancelReservation(Reservation reservation) bool
        +fulfillReservation(Reservation reservation) Loan
    }

    AuthSessionServiceInterface <|.. AuthSessionService
    DigitalRentalServiceInterface <|.. DigitalRentalService
    DarajaPaymentServiceInterface <|.. DarajaPaymentService
    OpenLibraryServiceInterface <|.. OpenLibraryService

    DigitalRentalService ..> DarajaPaymentServiceInterface : initiates payment
    DigitalRentalService ..> CurrencyConverterService : currency conversion
    QueueReservationService ..> BorrowLimitService : checks eligibility
    AiLibrarianManagerService ..> TokenBucketRateLimiter : enforces rate limits
    AiLibrarianManagerService ..> BookRecommendationService : fetches recommendations
    BookRecommendationService ..> OpenLibraryServiceInterface : catalog enrichment
"""
    test_mermaid(code, "Services Candidate")


def test_mermaid(code, name):
    obj = {
        "code": code,
        "mermaid": {
            "theme": "default",
            "themeVariables": {
                "fontFamily": "Segoe UI, sans-serif",
                "fontSize": "13px"
            }
        }
    }
    compressed = zlib.compress(json.dumps(obj).encode("utf-8"), level=9)
    b64 = base64.urlsafe_b64encode(compressed).decode("ascii")
    url = f"https://mermaid.ink/img/pako:{b64}?bgColor=white"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            img = Image.open(io.BytesIO(data))
            w, h = img.size
            ratio = w / h
            print(f"{name}: {w}x{h} (ratio: {ratio:.2f}) - Target A4 landscape is ~1.41")
            return w, h, ratio
    except Exception as e:
        print(f"Error {name}: {e}")
        return None

def test_class_controllers():
    code = """---
title: MAKTABABORA - REST API CONTROLLERS ARCHITECTURE
---
classDiagram
    direction TB

    class AuthModule {
        <<subsystem>>
    }
    class CirculationModule {
        <<subsystem>>
    }
    class CommerceModule {
        <<subsystem>>
    }
    class GovernanceModule {
        <<subsystem>>
    }

    class AuthController {
        +register(Request request) JsonResponse
        +login(Request request) JsonResponse
        +me(Request request) JsonResponse
        +updateProfile(Request request) JsonResponse
        +refresh(Request request) JsonResponse
        +logout(Request request) JsonResponse
    }
    class MembershipTierController {
        +index() JsonResponse
        +update(Request request) JsonResponse
    }

    class BookInventoryController {
        +index(Request request) JsonResponse
        +show(Book book) JsonResponse
        +store(Request request) JsonResponse
        +update(Request request, Book book) JsonResponse
        +destroy(Book book) JsonResponse
    }
    class CatalogSearchController {
        +search(Request request) JsonResponse
    }
    class BookRecommendationController {
        +similar(Book book) JsonResponse
        +forMember(Request request) JsonResponse
    }
    class LoanController {
        +index(Request request) JsonResponse
        +checkout(Request request) JsonResponse
        +returnBook(Loan loan) JsonResponse
    }
    class ReservationController {
        +index(Request request) JsonResponse
        +store(Request request) JsonResponse
        +destroy(Reservation reservation) JsonResponse
    }

    class FineController {
        +index(Request request) JsonResponse
        +payWithDaraja(Fine fine, Request request) JsonResponse
        +darajaCallback(Request request) JsonResponse
        +waive(Fine fine) JsonResponse
    }
    class DigitalRentalController {
        +myLibrary(Request request) JsonResponse
        +checkoutCart(Request request) JsonResponse
        +purchase(int id, Request request) JsonResponse
        +read(int id, Request request) JsonResponse
    }
    class SubscriptionController {
        +checkout(Request request) JsonResponse
        +status(Request request) JsonResponse
        +cancel(Request request) JsonResponse
        +requestRefund(Request request) JsonResponse
        +refundStatus(Request request) JsonResponse
    }

    class AiChatbotController {
        +chat(Request request) JsonResponse
        +history() JsonResponse
    }
    class AiSettingsController {
        +index() JsonResponse
        +update(Request request) JsonResponse
        +fetchModels(Request request) JsonResponse
    }
    class LibrarianDashboardController {
        +metrics() JsonResponse
        +searchOpenLibrary(Request request) JsonResponse
        +importOpenLibrary(Request request) JsonResponse
    }
    class AdminDashboardController {
        +stats() JsonResponse
        +users() JsonResponse
    }
    class DynamicTableController {
        +index(string table) JsonResponse
        +update(string table, int id) JsonResponse
    }

    AuthModule <|-- AuthController
    AuthModule <|-- MembershipTierController

    CirculationModule <|-- BookInventoryController
    CirculationModule <|-- CatalogSearchController
    CirculationModule <|-- BookRecommendationController
    CirculationModule <|-- LoanController
    CirculationModule <|-- ReservationController

    CommerceModule <|-- FineController
    CommerceModule <|-- DigitalRentalController
    CommerceModule <|-- SubscriptionController

    GovernanceModule <|-- AiChatbotController
    GovernanceModule <|-- AiSettingsController
    GovernanceModule <|-- LibrarianDashboardController
    GovernanceModule <|-- AdminDashboardController
    GovernanceModule <|-- DynamicTableController

    AuthModule -- CirculationModule : context
    CirculationModule -- CommerceModule : triggers
    CommerceModule -- GovernanceModule : reports
"""
    test_mermaid(code, "Controllers Candidate")



use_case_candidate = """flowchart TD
    subgraph TOP_SECTION ["Smart Library Management System - Functional Overview"]
        direction LR
        subgraph ACTORS ["System Actors"]
            direction TB
            Guest["👤 Guest Patron"]
            Member["🎓 Registered Member"]
            Librarian["📚 Librarian Staff"]
            Admin["⚙️ Administrator"]
        end

        subgraph PATRON_BOUNDARY ["Patron & Public Services"]
            direction TB
            subgraph GUEST_OPS ["Public Operations"]
                UC1(["Browse & Search Catalog"])
                UC2(["View Book Synopsis & Availability"])
                UC3(["View Dynamic Membership Tiers"])
                UC4(["Register Member / Login"])
                UC1 ~~~ UC2 ~~~ UC3 ~~~ UC4
            end
            subgraph MEMBER_OPS ["Member Operations"]
                UC5(["Borrow Physical Books"])
                UC6(["Place & Cancel Holds"])
                UC7(["Subscribe Pass (M-Pesa)"])
                UC8(["Request Refund"])
                UC9(["Purchase Digital Books"])
                UC10(["Read in In-App Reader"])
                UC11(["Pay Overdue Fines"])
                UC12(["View & Print Receipts"])
                UC13(["Query AI Assistant"])
                UC5 ~~~ UC7 ~~~ UC9 ~~~ UC11 ~~~ UC13
                UC6 ~~~ UC8 ~~~ UC10 ~~~ UC12
            end
        end

        subgraph STAFF_BOUNDARY ["Staff & Administration"]
            direction TB
            subgraph LIB_OPS ["Librarian Circulation"]
                UC14(["Check Out Barcode Copies"])
                UC15(["Return & Auto-Calculate Fines"])
                UC16(["Waive Patron Fines"])
                UC17(["Approve / Deny Hold Queue"])
                UC18(["Manage Catalog Books"])
                UC19(["Manage Physical Inventory"])
                UC20(["Import from Open Library"])
                UC21(["Set Member Borrow Limits"])
                UC22(["Process Pass Refunds"])
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

        subgraph EXTERNAL ["External Gateways"]
            direction TB
            Daraja["💳 Safaricom Daraja M-Pesa"]
            AiProvider["🤖 Cloud AI Provider"]
        end
    end

    Guest --> UC1 & UC2 & UC3 & UC4
    Member --> UC1 & UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13
    Librarian --> UC14 & UC15 & UC16 & UC17 & UC18 & UC19 & UC20 & UC21 & UC22
    Admin --> UC23 & UC24 & UC25 & UC26 & UC27 & UC28 & UC29
    Admin -.->|Inherits Staff Role| Librarian

    UC7 & UC9 & UC11 -.->|STK Push| Daraja
    UC13 -.->|Prompt & Context| AiProvider
"""

if __name__ == "__main__":
    test_class_services()
    test_class_controllers()
    test_mermaid(use_case_candidate, "Use Case Candidate")
