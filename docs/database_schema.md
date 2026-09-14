# Relational Database Schema & Data Dictionary

This document details the complete database schema for the **Smart Library Management System** running on PostgreSQL (Neon Cloud / Local).

---

## 1. Entity-Relationship (ER) Diagram

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

## 2. Table Dictionaries

### 2.1. `users` Table
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

### 2.2. `members` Table
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

### 2.3. `librarians` Table
| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | No | Auto | Primary key |
| `user_id` | `BIGINT` | No | — | FK &rarr; `users.id` (ON DELETE CASCADE) |
| `employee_id` | `VARCHAR(255)` | No | — | Unique staff ID (e.g. `LIB-1002`) |
| `department` | `VARCHAR(255)` | Yes | `NULL` | Assigned library department |
| `created_at` | `TIMESTAMP` | Yes | `NULL` | Record created timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `NULL` | Record updated timestamp |

### 2.4. `books` Table
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

### 2.5. `book_copies` Table
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

### 2.6. `loans` Table
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

### 2.7. `reservations` Table
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

### 2.8. `fines` Table
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

### 2.9. `subscriptions` Table
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

### 2.10. `digital_purchases` Table
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

### 2.11. `refund_requests` Table
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

### 2.12. `chat_sessions`, `chat_messages`, `ai_usage_logs` Tables
| Table | Key Columns | Description |
| :--- | :--- | :--- |
| **`chat_sessions`** | `id`, `member_id` (FK), `title`, `total_tokens_used`, `timestamps` | Chat container per patron session. |
| **`chat_messages`** | `id`, `chat_session_id` (FK), `sender` (`user`/`ai`), `message`, `tokens_used`, `timestamps` | Conversation turn messages. |
| **`ai_usage_logs`** | `id`, `member_id` (FK), `chat_session_id` (FK), `tokens_consumed`, `cost_estimate`, `request_type`, `ip_address`, `timestamps` | Cost and token consumption ledger. |

