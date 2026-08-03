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
        'membership_tier', // student, standard, scholar, faculty, general
        'is_subscribed',
        'subscription_expires_at',
        'borrow_limit',
        'is_banned',
        'banned_at',
        'ban_reason',
    ];

    protected $casts = [
        'is_subscribed' => 'boolean',
        'subscription_expires_at' => 'datetime',
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

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function digitalPurchases(): HasMany
    {
        return $this->hasMany(DigitalPurchase::class);
    }
}
