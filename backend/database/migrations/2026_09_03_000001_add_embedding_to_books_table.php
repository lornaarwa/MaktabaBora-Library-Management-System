<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // JSON-encoded embedding vector for semantic search (null when not indexed).
            $table->longText('embedding')->nullable()->after('file_path');
            // Model used to produce the stored embeddings (for re-indexing checks).
            $table->string('embedding_model')->nullable()->after('embedding');
            $table->timestamp('embedded_at')->nullable()->after('embedding_model');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn(['embedding', 'embedding_model', 'embedded_at']);
        });
    }
};