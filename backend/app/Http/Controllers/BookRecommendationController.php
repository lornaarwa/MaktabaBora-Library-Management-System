<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Member;
use App\Services\BookRecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookRecommendationController extends Controller
{
    protected BookRecommendationService $recommendations;

    public function __construct(BookRecommendationService $recommendations)
    {
        $this->recommendations = $recommendations;
    }

    /**
     * Books most similar to the given book (content-based TF-IDF cosine).
     */
    public function similar(Request $request, Book $book): JsonResponse
    {
        $results = $this->recommendations->similarTo($book, 5);

        return response()->json(['data' => $results->values()->all()]);
    }

    /**
     * Personalized recommendations for the authenticated member, grounded in
     * their loans, digital purchases and reservations. Falls back to the
     * most-borrowed titles when there is no history.
     */
    public function forMember(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = $user ? Member::where('user_id', $user->id)->first() : null;

        $results = $this->recommendations->forMember($member, 6);

        return response()->json(['data' => $results->values()->all()]);
    }
}