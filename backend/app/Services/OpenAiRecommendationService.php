<?php

namespace App\Services;

use App\Contracts\Services\OpenAiRecommendationServiceInterface;
use App\Models\Book;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Member;
use App\Models\Loan;
use Illuminate\Support\Facades\Log;

class OpenAiRecommendationService implements OpenAiRecommendationServiceInterface
{
    public function generateBookRecommendations(string $prompt, array $userHistory = []): array
    {
        // Simple fallback/general recommendations based on search term
        $matching = Book::where('title', 'like', "%{$prompt}%")
            ->orWhere('genre', 'like', "%{$prompt}%")
            ->orWhere('author', 'like', "%{$prompt}%")
            ->limit(5)
            ->get();

        return [
            'recommendations' => $matching->pluck('title')->toArray(),
            'prompt' => $prompt,
        ];
    }

    public function chat(string $message, array $conversationContext = []): string
    {
        return $this->getRuleBasedReply($message);
    }

    public function generateRecommendation(ChatSession $session, string $userPrompt): array
    {
        // Save user message
        ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender' => 'user',
            'message' => $userPrompt,
            'tokens_used' => 0, // offline, no tokens used
        ]);

        $aiResponseText = $this->getRuleBasedReply($userPrompt);

        // Save AI message
        $aiMessage = ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender' => 'ai',
            'message' => $aiResponseText,
            'tokens_used' => 0,
        ]);

        return [
            'message' => $aiMessage,
            'tokens_used' => 0,
        ];
    }

    /**
     * Rule-based chatbot reply generator based on keywords
     */
    protected function getRuleBasedReply(string $message): string
    {
        $msg = strtolower($message);

        // 1. Library Opening and Closing hours
        if ($this->hasKeywords($msg, ['hour', 'opening', 'closing', 'when is', 'time', 'open', 'close', 'schedule'])) {
            return "🕒 **Library Hours:**\nOur physical university library is open Monday to Friday from **8:00 AM to 10:00 PM**, and Saturdays from **9:00 AM to 5:00 PM**.\nWe are closed on Sundays and university public holidays. Students are welcome to visit our circulation desk during these hours.";
        }

        // 2. Membership Registration process
        if ($this->hasKeywords($msg, ['register', 'membership', 'registration', 'join', 'sign up', 'account'])) {
            return "📝 **Membership Registration:**\nTo borrow physical books, you must register as a library member. The process is simple:\n1. Register your account online.\n2. Pay a one-time activation fee of **KES 500**.\n3. A librarian will verify the payment and approve your account at the circulation desk, activating your borrowing privileges.";
        }

        // 3. Borrowing Limits
        if ($this->hasKeywords($msg, ['limit', 'borrowing limit', 'max', 'maximum', 'how many books', 'how many copies'])) {
            return "📚 **Borrowing Limits:**\nStandard student members can borrow up to **3 physical books** simultaneously. Faculty members can borrow up to **10 books**. Librarians can customize this limit for individual members depending on academic requirements.";
        }

        // 4. Loan Duration
        if ($this->hasKeywords($msg, ['duration', 'how long', 'period', 'days', 'due date', 'due', 'renew', 'renewal'])) {
            return "🗓️ **Loan Duration & Renewals:**\nThe standard loan period for printed books is **14 days**. You can request a renewal at the circulation desk before the due date, provided the book has not been reserved by another member.";
        }

        // 5. Fine Policies
        if ($this->hasKeywords($msg, ['fine', 'penalty', 'late fee', 'overdue', 'charge'])) {
            return "💰 **Overdue Fines:**\nReturning books late attracts an overdue fine of **KES 50 per day** for each overdue copy. If you have unpaid fines, your borrowing and reservation privileges will be temporarily suspended until the fines are cleared.";
        }

        // 6. Lost book procedures
        if ($this->hasKeywords($msg, ['lost', 'lose', 'damage', 'replacement'])) {
            return "❌ **Lost or Damaged Books:**\nIf you lose or damage a book copy, please report it to a librarian immediately. You will be billed a **replacement fee** (market price of the book plus a KES 500 administrative penalty fee). The case must be resolved and paid before borrowing privileges are restored.";
        }

        // 7. Reservation process
        if ($this->hasKeywords($msg, ['reserve', 'reservation', 'hold', 'queue'])) {
            return "📌 **Book Reservation:**\nYou can reserve any printed book in our catalog. Once a copy is ready, you must physically pick it up at the library within **3 days (72 hours)**. If unclaimed, the reservation expires and the copy goes to the next member in the queue.";
        }

        // 8. Book availability
        if ($this->hasKeywords($msg, ['available', 'availability', 'in stock', 'status'])) {
            return "🔍 **Book Availability:**\nYou can check real-time availability by searching our online catalogue. It displays the count of available copies vs total copies, as well as rack location details for physical collection.";
        }

        // Greetings
        if ($this->hasKeywords($msg, ['hello', 'hi', 'hey', 'welcome', 'greetings', 'assist'])) {
            return "👋 **Welcome to Maktaba Bora FAQ Chatbot!**\nI am your rule-based library assistant. I can help answer questions about:\n- 🕒 Library Hours\n- 📝 Membership Registration\n- 📚 Borrowing Limits\n- 🗓️ Loan Duration & Renewals\n- 💰 Overdue Fines\n- ❌ Lost Book Procedures\n- 📌 Reservations & Holds\n- 🔍 Real-Time Book Availability\n\nHow can I help you today?";
        }

        // Fallback response
        return "🤖 **FAQ Chatbot Assistant:**\nI couldn't quite match your question to library rules. I can answer questions regarding:\n- **Hours**: Opening/closing schedule\n- **Membership**: Registration and activation fees\n- **Limits**: Maximum book borrow limits\n- **Loan Duration**: Standard loan periods and renewals\n- **Fines**: Overdue rates and suspensions\n- **Lost Books**: Replacement policies\n- **Reservations**: Holding books online and pickup times\n- **Availability**: Locating books on shelves\n\nPlease try rephrasing your question using some of these keywords!";
    }

    protected function hasKeywords(string $subject, array $keywords): bool
    {
        foreach ($keywords as $word) {
            if (strpos($subject, $word) !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Personalized Offline Recommendation Engine
     */
    public function getPersonalizedRecommendations(Member $member, int $limit = 5): array
    {
        $interests = array_filter(array_map('trim', explode(',', strtolower($member->interests ?? ''))));
        $department = strtolower($member->department ?? '');
        $programme = strtolower($member->programme ?? '');

        // Fetch user history genres
        $historyGenres = Loan::where('member_id', $member->id)
            ->join('book_copies', 'loans.book_copy_id', '=', 'book_copies.id')
            ->join('books', 'book_copies.book_id', '=', 'books.id')
            ->pluck('books.genre')
            ->toArray();
        $genreCounts = array_count_values(array_map('strtolower', $historyGenres));

        $books = Book::where('is_blocked', false)->get();
        $scoredBooks = [];

        foreach ($books as $book) {
            $score = 0;
            $genre = strtolower($book->genre);
            $title = strtolower($book->title);

            // 1. Matches interests
            foreach ($interests as $interest) {
                if (strpos($genre, $interest) !== false || strpos($title, $interest) !== false) {
                    $score += 3.0;
                }
            }

            // 2. Matches department / programme terms
            if ($department) {
                if (strpos($genre, 'software') !== false || strpos($genre, 'tech') !== false) {
                    if (strpos($department, 'computer') !== false || strpos($department, 'software') !== false || strpos($department, 'it') !== false) {
                        $score += 2.0;
                    }
                }
                if (strpos($genre, 'science') !== false || strpos($genre, 'physics') !== false) {
                    if (strpos($department, 'engineering') !== false || strpos($department, 'science') !== false) {
                        $score += 1.5;
                    }
                }
            }

            // 3. Borrow history correlation
            if (isset($genreCounts[$genre])) {
                $score += ($genreCounts[$genre] * 1.0);
            }

            // 4. Availability bonus
            if ($book->available_copies > 0) {
                $score += 0.5;
            }

            $scoredBooks[] = [
                'book' => $book,
                'score' => $score,
            ];
        }

        // Sort by score descending
        usort($scoredBooks, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // Slice top books
        $recommended = [];
        for ($i = 0; $i < min($limit, count($scoredBooks)); $i++) {
            $recommended[] = $scoredBooks[$i]['book'];
        }

        return $recommended;
    }
}
