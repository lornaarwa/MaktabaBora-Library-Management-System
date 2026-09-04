<?php

namespace App\Http\Controllers;

use App\Contracts\Services\CurrencyConverterServiceInterface;
use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookInventoryController extends Controller
{
    public function __construct(
        private readonly CurrencyConverterServiceInterface $currencyConverter
    ) {
    }

    public function index(): JsonResponse
    {
        $books = Book::with('copies')->latest()->paginate(15);
        return response()->json($books);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'isbn' => 'required|string|unique:books',
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'genre' => 'required|string|max:100',
            'description' => 'nullable|string',
            'cover_image_path' => 'nullable|string',
            'file_path' => 'nullable|string',
            'publication_year' => 'nullable|integer',
            'initial_copies' => 'nullable|integer|min:1',
            'digital_purchase_price' => 'nullable|numeric|min:0',
            'foreign_price' => 'nullable|numeric|min:0',
            'foreign_currency' => 'nullable|string|size:3',
        ]);

        $initialCopiesCount = $validated['initial_copies'] ?? 1;

        $book = Book::create([
            'isbn' => $validated['isbn'],
            'title' => $validated['title'],
            'author' => $validated['author'],
            'publisher' => $validated['publisher'] ?? null,
            'genre' => $validated['genre'],
            'description' => $validated['description'] ?? null,
            'cover_image_path' => $validated['cover_image_path'] ?? null,
            'file_path' => $validated['file_path'] ?? null,
            'publication_year' => $validated['publication_year'] ?? null,
            // digital_purchase_price is NOT NULL in the schema (default 50.00) — never pass null.
            'digital_purchase_price' => $validated['digital_purchase_price'] ?? 50.00,
            'foreign_price' => $validated['foreign_price'] ?? null,
            'foreign_currency' => $validated['foreign_currency'] ?? null,
            'total_copies' => $initialCopiesCount,
            'available_copies' => $initialCopiesCount,
        ]);

        for ($i = 1; $i <= $initialCopiesCount; $i++) {
            BookCopy::create([
                'book_id' => $book->id,
                'barcode' => 'BC-' . strtoupper($book->isbn) . '-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'condition' => 'good',
                'status' => 'available',
                'location_rack' => 'Rack-' . rand(1, 10),
            ]);
        }

        return response()->json(['message' => 'Book and copies created successfully', 'book' => $book->load('copies')], 201);
    }

    public function show(Book $book): JsonResponse
    {
        $book->load('copies', 'reservations');

        // When a foreign retail price is stored (e.g. US$ from Google Books saleInfo),
        // attach a clearly-labeled KES estimate computed from the cached daily rate.
        if ($book->foreign_price !== null && $book->foreign_currency !== null) {
            $book->foreign_price_kes_estimate = $this->currencyConverter->convert(
                (float) $book->foreign_price,
                $book->foreign_currency
            );
        }

        return response()->json($book);
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'author' => 'sometimes|string|max:255',
            'genre' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'is_blocked' => 'sometimes|boolean',
            'digital_purchase_price' => 'nullable|numeric|min:0',
            'foreign_price' => 'nullable|numeric|min:0',
            'foreign_currency' => 'nullable|string|size:3',
        ]);

        // Drop empty foreign fields back to null so removing a price clears it.
        if (array_key_exists('foreign_price', $validated) && $validated['foreign_price'] === null) {
            $validated['foreign_price'] = null;
            $validated['foreign_currency'] = null;
        }

        // digital_purchase_price is NOT NULL in the schema (default 50.00) — never pass null.
        if (array_key_exists('digital_purchase_price', $validated) && $validated['digital_purchase_price'] === null) {
            $validated['digital_purchase_price'] = 50.00;
        }

        $book->update($validated);

        return response()->json(['message' => 'Book updated successfully', 'book' => $book]);
    }

    public function destroy(Book $book): JsonResponse
    {
        $book->delete();
        return response()->json(['message' => 'Book removed from catalog']);
    }
}
