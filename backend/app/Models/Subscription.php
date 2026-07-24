<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'user_id',
        'plan_type',
        'discount_percentage',
        'amount_paid',
        'payment_status',
        'transaction_reference',
        'starts_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'discount_percentage' => 'float',
            'amount_paid' => 'float',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function digitalPurchases()
    {
        return $this->hasMany(DigitalPurchase::class);
    }
}
