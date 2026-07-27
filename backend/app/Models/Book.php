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
        'publication_year',
        'total_copies',
        'available_copies',
        'is_blocked',
        'category_id',
    ];

    protected $casts = [
        'is_blocked' => 'boolean',
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

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
