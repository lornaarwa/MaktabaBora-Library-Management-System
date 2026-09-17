<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->index(['is_blocked', 'available_copies'], 'books_blocked_avail_idx');
            $table->index(['genre', 'created_at'], 'books_genre_created_idx');
            $table->index('author', 'books_author_idx');
            $table->index('created_at', 'books_created_at_idx');
        });

        Schema::table('book_copies', function (Blueprint $table) {
            $table->index('book_id', 'book_copies_book_id_idx');
            $table->index('status', 'book_copies_status_idx');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->index('member_id', 'loans_member_id_idx');
            $table->index('book_copy_id', 'loans_book_copy_id_idx');
            $table->index(['status', 'due_date'], 'loans_status_due_idx');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->index('book_id', 'reservations_book_id_idx');
            $table->index('member_id', 'reservations_member_id_idx');
            $table->index(['status', 'queue_position'], 'reservations_status_queue_idx');
        });

        Schema::table('fines', function (Blueprint $table) {
            $table->index('member_id', 'fines_member_id_idx');
            $table->index('loan_id', 'fines_loan_id_idx');
            $table->index(['status', 'balance'], 'fines_status_balance_idx');
        });

        Schema::table('digital_purchases', function (Blueprint $table) {
            $table->index('member_id', 'digital_purchases_member_id_idx');
            $table->index('book_id', 'digital_purchases_book_id_idx');
            $table->index('user_id', 'digital_purchases_user_id_idx');
        });

        // PostgreSQL-specific: Trigram GIN index for rapid substring & fuzzy searches
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
            DB::statement('CREATE INDEX IF NOT EXISTS books_title_author_trgm_idx ON books USING gin (title gin_trgm_ops, author gin_trgm_ops);');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS books_title_author_trgm_idx;');
        }

        Schema::table('digital_purchases', function (Blueprint $table) {
            $table->dropIndex('digital_purchases_user_id_idx');
            $table->dropIndex('digital_purchases_book_id_idx');
            $table->dropIndex('digital_purchases_member_id_idx');
        });

        Schema::table('fines', function (Blueprint $table) {
            $table->dropIndex('fines_status_balance_idx');
            $table->dropIndex('fines_loan_id_idx');
            $table->dropIndex('fines_member_id_idx');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex('reservations_status_queue_idx');
            $table->dropIndex('reservations_member_id_idx');
            $table->dropIndex('reservations_book_id_idx');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex('loans_status_due_idx');
            $table->dropIndex('loans_book_copy_id_idx');
            $table->dropIndex('loans_member_id_idx');
        });

        Schema::table('book_copies', function (Blueprint $table) {
            $table->dropIndex('book_copies_status_idx');
            $table->dropIndex('book_copies_book_id_idx');
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex('books_created_at_idx');
            $table->dropIndex('books_author_idx');
            $table->dropIndex('books_genre_created_idx');
            $table->dropIndex('books_blocked_avail_idx');
        });
    }
};
