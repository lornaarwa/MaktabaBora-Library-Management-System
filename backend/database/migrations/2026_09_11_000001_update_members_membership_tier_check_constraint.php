<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_tier_check');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE members ADD CONSTRAINT members_membership_tier_check CHECK (membership_tier::text = ANY (ARRAY['student'::character varying, 'standard'::character varying, 'scholar'::character varying, 'faculty'::character varying, 'general'::character varying]::text[]))");
        }
    }
};
