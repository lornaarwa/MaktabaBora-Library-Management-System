<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // Optional original retail price in a foreign currency (e.g. US$ from Google Books
            // saleInfo). Never authoritative — the KES price for the digital store remains
            // digital_purchase_price. The converter derives a clearly-labeled KES estimate.
            $table->decimal('foreign_price', 10, 2)->nullable()->after('digital_purchase_price');
            $table->string('foreign_currency', 3)->nullable()->after('foreign_price');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['foreign_price', 'foreign_currency']);
        });
    }
};
