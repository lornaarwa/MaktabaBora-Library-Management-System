<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update users table with role column if not exists
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('member')->after('email');
            });
        }

        // 1. Books
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('isbn')->unique();
            $table->string('title');
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->string('genre');
            $table->text('description')->nullable();
            $table->text('cover_image_path')->nullable();
            $table->longText('file_path')->nullable();
            $table->integer('publication_year')->nullable();
            $table->integer('total_copies')->default(1);
            $table->integer('available_copies')->default(1);
            $table->boolean('is_blocked')->default(false);
            $table->timestamps();
        });

        // 2. Book Copies
        Schema::create('book_copies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->onDelete('cascade');
            $table->string('barcode')->unique();
            $table->enum('condition', ['good', 'damaged', 'lost'])->default('good');
            $table->enum('status', ['available', 'checked_out', 'reserved', 'maintenance'])->default('available');
            $table->string('location_rack')->nullable();
            $table->timestamps();
        });

        // 3. Librarians
        Schema::create('librarians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('employee_id')->unique();
            $table->string('department')->nullable();
            $table->timestamps();
        });

        // 4. Members
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('member_number')->unique();
            $table->enum('membership_tier', ['student', 'faculty', 'general'])->default('general');
            $table->integer('borrow_limit')->default(3);
            $table->boolean('is_banned')->default(false);
            $table->timestamp('banned_at')->nullable();
            $table->string('ban_reason')->nullable();
            $table->timestamps();
        });

        // 5. Loans
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_copy_id')->constrained('book_copies')->onDelete('cascade');
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->date('loan_date');
            $table->date('due_date');
            $table->date('returned_date')->nullable();
            $table->enum('status', ['active', 'returned', 'overdue'])->default('active');
            $table->integer('renewal_count')->default(0);
            $table->timestamps();
        });

        // 6. Reservations
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->onDelete('cascade');
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->integer('queue_position')->default(1);
            $table->enum('status', ['pending', 'ready_for_pickup', 'fulfilled', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('reserved_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // 7. Fines
        Schema::create('fines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->decimal('balance', 10, 2);
            $table->enum('status', ['unpaid', 'paid', 'waived', 'partial'])->default('unpaid');
            $table->string('reason')->default('overdue');
            $table->string('transaction_reference')->nullable();
            $table->timestamps();
        });

        // 8. Chat Sessions
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->string('title')->default('Library AI Session');
            $table->integer('total_tokens_used')->default(0);
            $table->timestamps();
        });

        // 9. Chat Messages
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_session_id')->constrained('chat_sessions')->onDelete('cascade');
            $table->enum('sender', ['user', 'ai']);
            $table->text('message');
            $table->integer('tokens_used')->default(0);
            $table->timestamps();
        });

        // 10. AI Usage Logs
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('chat_session_id')->nullable()->constrained('chat_sessions')->onDelete('set null');
            $table->integer('tokens_consumed');
            $table->decimal('cost_estimate', 8, 4)->default(0.0000);
            $table->string('request_type')->default('chat');
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
        Schema::dropIfExists('fines');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('members');
        Schema::dropIfExists('librarians');
        Schema::dropIfExists('book_copies');
        Schema::dropIfExists('books');
    }
};
