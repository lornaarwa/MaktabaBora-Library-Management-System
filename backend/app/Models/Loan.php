<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_copy_id',
        'member_id',
        'loan_date',
        'due_date',
        'returned_date',
        'status', // active, returned, overdue
        'renewal_count',
    ];

    protected $casts = [
        'loan_date' => 'date',
        'due_date' => 'date',
        'returned_date' => 'date',
        'renewal_count' => 'integer',
    ];

    protected $appends = [
        'book_title',
        'barcode',
        'fine_amount',
        'fine_id',
    ];

    public function getBookTitleAttribute(): ?string
    {
        return $this->bookCopy?->book?->title;
    }

    public function getBarcodeAttribute(): ?string
    {
        return $this->bookCopy?->barcode;
    }

    public function getFineAmountAttribute(): float
    {
        return (float) ($this->fine?->balance ?? $this->fine?->amount ?? 0);
    }

    public function getFineIdAttribute(): ?int
    {
        return $this->fine?->id;
    }

    public function bookCopy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function fine(): HasOne
    {
        return $this->hasOne(Fine::class);
    }
}
