<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'member_number',
        'membership_tier', // student, faculty, general
        'department',
        'programme',
        'interests',
        'is_approved',
        'membership_fee_paid',
        'borrow_limit',
        'is_banned',
        'banned_at',
        'ban_reason',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'membership_fee_paid' => 'boolean',
        'is_banned' => 'boolean',
        'borrow_limit' => 'integer',
        'banned_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function fines(): HasMany
    {
        return $this->hasMany(Fine::class);
    }

    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
