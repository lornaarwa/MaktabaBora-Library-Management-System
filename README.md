# Smart Library Management System (SmartLib)

SmartLib is a production-grade, full-stack library management system featuring a **Laravel REST API** backend and a **React SPA** frontend. The platform handles digital/physical catalog searches (OPAC), barcode circulation, custom borrowing limits, Safaricom M-Pesa Daraja fine payments, member perk subscriptions, one-time digital book purchases with lifetime access, and an OpenAI-powered AI Assistant Chatbot.

---

## Key Features

- **Online Public Access Catalog (OPAC)**: Fully searchable public book browser with filterable attributes (Genre, Author, ISBN).
- **Physical Book Circulation**: Barcode checkouts, return handling, overdue fine calculation, and hold queue reservation management.
- **Member Perk Subscriptions**: Member-first subscription passes granting percentage discounts on digital book purchases and access to subscriber-exclusive titles.
- **One-Time Digital Book Purchases**: Buy digital books once and enjoy **permanent / lifetime access** to stream or download e-books.
- **M-Pesa Daraja STK Push Integration**: Fast, automated mobile payments for fines, perk passes, and digital e-books.
- **SmartLib AI Librarian**: Context-aware floating assistant chatbot providing automated book suggestions with daily token quota rate-limiting.
- **Complete Middleware Stack**: 15 custom middlewares monitoring role routing, token budgets, borrow limits, digital access security, and API throttling.

---

## Tech Stack & System Requirements

### Prerequisites
- **PHP**: 8.2 or higher
- **Composer**: 2.x
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Database**: PostgreSQL (v14+ recommended) or SQLite for local development testing

---

## Getting Started: Installation & Running Locally

### 1. Database Setup (PostgreSQL)

Ensure PostgreSQL service is running and create the database:
```sql
CREATE DATABASE library_db;
CREATE USER postgres WITH PASSWORD 'library_db';
GRANT ALL PRIVILEGES ON DATABASE library_db TO postgres;
```

---

### 2. Backend Setup (Laravel REST API)

Navigate to the `backend` folder:
```bash
cd backend
```

1. **Install PHP Dependencies**:
   ```bash
   composer install
   ```

2. **Configure Environment File**:
   Copy `.env.example` to `.env` (or update existing `.env`):
   ```bash
   cp .env.example .env
   ```
   Ensure `.env` database settings match your PostgreSQL installation:
   ```ini
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=library_db
   DB_USERNAME=postgres
   DB_PASSWORD=library_db
   ```

3. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

4. **Run Database Migrations & Seeders**:
   ```bash
   php artisan migrate
   ```

5. **Start Laravel Development Server**:
   ```bash
   php artisan serve --port=8000
   ```
   The backend API will be live at `http://127.0.0.1:8000/api/v1`.

---

### 3. Frontend Setup (React SPA)

Navigate to the `frontend` folder (or project root if mono-repo):
```bash
cd frontend
```

1. **Install JavaScript Dependencies**:
   ```bash
   npm install
   ```

2. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application UI will be accessible at `http://localhost:5173`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Running Automated Test Suite

To verify system health and run the complete test suite (unit tests, middleware guards, REST controllers, and feature integration tests):

```bash
cd backend
php artisan test
```

To run a specific test filter (e.g. digital rentals or subscriptions):
```bash
php artisan test --filter=DigitalRentalControllerTest
php artisan test --filter=SubscriptionControllerTest
```

To check all 31 registered API endpoints:
```bash
php artisan route:list
```

---

## Project Structure Overview

```text
├── backend/
│   ├── app/
│   │   ├── Contracts/Services/   # 10 Service Interfaces & Contracts
│   │   ├── Http/
│   │   │   ├── Controllers/      # 12 REST Controllers (Auth, Catalog, Loan, Subscription, Digital, etc.)
│   │   │   └── Middleware/       # 15 Custom Middlewares (JWT, Role, BorrowLimit, DigitalAccess, etc.)
│   │   ├── Models/               # 12 Eloquent Models (User, Member, Subscription, DigitalPurchase, etc.)
│   │   ├── Providers/            # 6 Custom Service Providers
│   │   └── Services/             # 10 Domain Services (DigitalRental, Daraja, TokenBucket, etc.)
│   ├── database/
│   │   └── migrations/           # Database schema migrations
│   ├── routes/
│   │   └── api.php               # All REST API endpoints (V1)
│   └── tests/                    # Unit and Feature test suites (57 passing tests)
├── frontend/                     # React 18 / Vite 7 SPA Client
│   ├── src/
│   │   ├── components/           # UI Components
│   │   ├── pages/                # Catalog, Member, Librarian & Admin Dashboards
│   │   └── services/             # Axios API Client
└── task.md                       # Phase-by-phase implementation checklist
```
