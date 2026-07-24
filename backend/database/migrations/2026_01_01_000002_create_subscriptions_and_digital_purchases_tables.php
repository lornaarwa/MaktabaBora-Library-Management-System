<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create Subscriptions table (Member Perks & Discounts)
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('plan_type')->default('pro_perks_monthly'); // e.g. pro_perks_monthly, vip_annual
            $table->decimal('discount_percentage', 5, 2)->default(20.00); // 20% discount on digital purchases
            $table->decimal('amount_paid', 10, 2)->default(500.00);
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('paid');
            $table->string('transaction_reference')->nullable();
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // 2. Add subscription columns to users and members
        Schema::table('users', function (Blueprint $table) {
            $table->string('subscription_status')->default('none')->after('role'); // none, active, expired
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null')->after('subscription_status');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->boolean('is_subscribed')->default(false)->after('membership_tier');
            $table->timestamp('subscription_expires_at')->nullable()->after('is_subscribed');
        });

        // 3. Add digital catalog attributes to books
        Schema::table('books', function (Blueprint $table) {
            $table->boolean('is_exclusive')->default(false)->after('is_blocked'); // Exclusive perk for subscribers
            $table->decimal('digital_purchase_price', 8, 2)->default(50.00)->after('is_exclusive'); // Standard purchase price in KES
        });

        // 4. Create Digital Purchases table (One-Time Paid Digital Access with Lifetime Access)
        Schema::create('digital_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('book_id')->constrained('books')->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->decimal('standard_price', 8, 2);
            $table->decimal('amount_paid', 8, 2); // Price after subscriber discount
            $table->timestamp('purchased_at')->useCurrent();
            $table->string('access_type')->default('lifetime'); // Indefinite permanent access
            $table->string('transaction_reference')->nullable();
            $table->enum('status', ['active', 'refunded'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('digital_purchases');

        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['is_exclusive', 'digital_purchase_price']);
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['is_subscribed', 'subscription_expires_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn(['subscription_status', 'subscription_id']);
        });

        Schema::dropIfExists('subscriptions');
    }
};
