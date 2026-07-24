<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'user_id',
        'book_id',
        'subscription_id',
        'standard_price',
        'amount_paid',
        'purchased_at',
        'access_type',
        'transaction_reference',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'standard_price' => 'float',
            'amount_paid' => 'float',
            'purchased_at' => 'datetime',
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

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
