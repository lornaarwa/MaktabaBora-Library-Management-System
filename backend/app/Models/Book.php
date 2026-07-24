<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'isbn',
        'title',
        'author',
        'publisher',
        'genre',
        'description',
        'cover_image_path',
        'file_path',
        'publication_year',
        'total_copies',
        'available_copies',
        'is_blocked',
        'is_exclusive',
        'digital_purchase_price',
    ];

    protected $casts = [
        'is_blocked' => 'boolean',
        'is_exclusive' => 'boolean',
        'digital_purchase_price' => 'float',
        'publication_year' => 'integer',
        'total_copies' => 'integer',
        'available_copies' => 'integer',
    ];

    public function copies(): HasMany
    {
        return $this->hasMany(BookCopy::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function digitalPurchases(): HasMany
    {
        return $this->hasMany(DigitalPurchase::class);
    }
}
