<?php

namespace App\Services;

use App\Models\Book;
use App\Models\DigitalPurchase;
use App\Models\Loan;
use App\Models\Member;
use App\Models\Reservation;
use Illuminate\Support\Collection as SupportCollection;

/**
 * Content-based recommendations powered by the same TF-IDF cosine engine as
 * the hybrid catalog search.
 *
 *  - similarTo():    books whose metadata (title, author, genre, description,
 *                    publisher) is most similar to a given book.
 *  - forMember():    books similar to the member's interest profile built from
 *                    their loans, digital purchases and reservations; excludes
 *                    titles they have already engaged with. Falls back to
 *                    most-borrowed (popular) titles when there is no history.
 *  - popular():      deterministic most-borrowed ranking from real loan data.
 */
class BookRecommendationService
{
    /**
     * @return SupportCollection<int, Book>
     */
    public function similarTo(Book $source, int $limit = 5): SupportCollection
    {
        $candidates = Book::whereKeyNot($source->id)->get();
        $queryTerms = TextSimilarity::tokenize($this->bookText($source));

        if (empty($queryTerms) || $candidates->isEmpty()) {
            return new SupportCollection();
        }

        return $this->topMatches($queryTerms, $candidates, $limit);
    }

    /**
     * @return SupportCollection<int, Book>
     */
    public function forMember(?Member $member, int $limit = 6): SupportCollection
    {
        if (! $member) {
            return $this->popular($limit);
        }

        $profile = $this->memberProfileText($member);
        $queryTerms = TextSimilarity::tokenize($profile);

        if (empty($queryTerms)) {
            return $this->popular($limit);
        }

        $engagedIds = $this->memberEngagedBookIds($member);
        $candidates = Book::whereNotIn('id', $engagedIds ?: [0])->get();

        if ($candidates->isEmpty()) {
            return $this->popular($limit);
        }

        $matches = $this->topMatches($queryTerms, $candidates, $limit);

        return $matches->isEmpty() ? $this->popular($limit) : $matches;
    }

    /**
     * Most-borrowed titles (real loan counts); falls back to the most recently
     * added books when there is no borrowing history at all.
     *
     * @return SupportCollection<int, Book>
     */
    public function popular(int $limit = 6): SupportCollection
    {
        $orderedIds = Loan::query()
            ->join('book_copies', 'loans.book_copy_id', '=', 'book_copies.id')
            ->selectRaw('book_copies.book_id, COUNT(*) as loan_count')
            ->groupBy('book_copies.book_id')
            ->orderByDesc('loan_count')
            ->limit($limit)
            ->pluck('book_id');

        if ($orderedIds->isNotEmpty()) {
            $books = Book::whereIn('id', $orderedIds->all())->get();

            if ($books->isNotEmpty()) {
                $position = array_flip($orderedIds->all());

                return $books
                    ->sortBy(fn (Book $book) => $position[$book->id] ?? PHP_INT_MAX)
                    ->values();
            }
        }

        return Book::latest('created_at')->limit($limit)->get();
    }

    /**
     * Rank candidates by TF-IDF cosine similarity against the query terms.
     *
     * @param  string[]  $queryTerms
     * @param  SupportCollection<int, Book>  $candidates
     * @return SupportCollection<int, Book>
     */
    protected function topMatches(array $queryTerms, SupportCollection $candidates, int $limit): SupportCollection
    {
        return TextSimilarity::scoreBooks($queryTerms, $candidates, fn (Book $book) => $this->bookText($book))
            ->filter(fn (array $item) => $item['score'] > 0)
            ->sortByDesc('score')
            ->take($limit)
            ->pluck('book')
            ->values();
    }

    protected function bookText(Book $book): string
    {
        return implode(' ', array_filter([
            $book->title,
            $book->author,
            $book->genre,
            $book->description,
            $book->publisher,
        ]));
    }

    /**
     * Interest profile assembled from the member's real engagement history.
     */
    protected function memberProfileText(Member $member): string
    {
        $books = Book::whereIn('id', $this->memberEngagedBookIds($member))->get();

        return $books
            ->map(fn (Book $book) => $this->bookText($book))
            ->implode("\n");
    }

    /**
     * @return array<int>
     */
    protected function memberEngagedBookIds(Member $member): array
    {
        $loanBookIds = Loan::with('bookCopy')
            ->where('member_id', $member->id)
            ->get()
            ->map(fn (Loan $loan) => $loan->bookCopy->book_id ?? null)
            ->filter();

        $purchaseBookIds = DigitalPurchase::where('member_id', $member->id)->pluck('book_id');
        $reservationBookIds = Reservation::where('member_id', $member->id)->pluck('book_id');

        return $loanBookIds
            ->concat($purchaseBookIds)
            ->concat($reservationBookIds)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}