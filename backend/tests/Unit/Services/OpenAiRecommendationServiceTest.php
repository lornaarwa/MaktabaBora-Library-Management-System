<?php

namespace Tests\Unit\Services;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Loan;
use App\Models\Member;
use App\Models\User;
use App\Services\OpenAiRecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpenAiRecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    private OpenAiRecommendationService $service;
    private ?string $originalSettingsBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        $settingsFile = storage_path('app/ai_settings.json');
        if (file_exists($settingsFile)) {
            $this->originalSettingsBackup = file_get_contents($settingsFile);
        }

        // Force offline mode for unit tests so they execute deterministically without external API calls
        $manager = app(\App\Services\AiLibrarianManagerService::class);
        $settings = $manager->getSettings();
        $settings['active_provider'] = 'offline';
        $manager->saveSettings($settings);

        config(['services.openai.api_key' => '']);

        $this->service = app(OpenAiRecommendationService::class);
    }

    protected function tearDown(): void
    {
        $settingsFile = storage_path('app/ai_settings.json');
        if ($this->originalSettingsBackup !== null) {
            file_put_contents($settingsFile, $this->originalSettingsBackup);
        } elseif (file_exists($settingsFile)) {
            @unlink($settingsFile);
        }

        parent::tearDown();
    }

    private function createLibraryData(): array
    {
        $user = User::create([
            'name' => 'Alex Johnson',
            'email' => 'alex@example.com',
            'password' => bcrypt('password123'),
            'role' => 'member',
        ]);

        $member = Member::create([
            'user_id' => $user->id,
            'member_number' => 'MEM-TEST-001',
            'membership_tier' => 'standard',
            'borrow_limit' => 5,
            'is_subscribed' => true,
        ]);

        $book = Book::create([
            'isbn' => '978-0735211292',
            'title' => 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
            'author' => 'James Clear',
            'publisher' => 'Avery',
            'genre' => 'Science',
            'description' => 'Tiny changes, remarkable results. Learn how small 1% daily improvements stack up over time into massive growth.',
            'publication_year' => 2018,
            'total_copies' => 4,
            'available_copies' => 4,
            'is_exclusive' => false,
            'digital_purchase_price' => 45.00,
        ]);

        $copy = BookCopy::create([
            'book_id' => $book->id,
            'barcode' => 'BC-TEST-001',
            'condition' => 'good',
            'status' => 'checked_out',
            'location_rack' => 'Rack-1',
        ]);

        return compact('user', 'member', 'book', 'copy');
    }

    public function test_recommendation_is_grounded_in_real_catalog(): void
    {
        $data = $this->createLibraryData();
        $session = ChatSession::create(['member_id' => $data['member']->id, 'title' => 'Test session']);

        $result = $this->service->generateRecommendation($session, 'Recommend books about building habits');

        // The answer must reference the real book — never invent titles.
        $this->assertStringContainsString('Atomic Habits', $result['message']);
        $this->assertNotEmpty($result['books']);
        $this->assertStringContainsString('Atomic Habits', $result['books'][0]['title']);

        // Both the user and the AI message must be persisted.
        $this->assertEquals(2, ChatMessage::where('chat_session_id', $session->id)->count());
        $this->assertGreaterThan(0, $session->fresh()->total_tokens_used);
    }

    public function test_account_question_protects_user_privacy_and_redirects_to_member_dashboard(): void
    {
        $data = $this->createLibraryData();

        Loan::create([
            'book_copy_id' => $data['copy']->id,
            'member_id' => $data['member']->id,
            'loan_date' => now()->subDays(10)->toDateString(),
            'due_date' => now()->addDays(2)->toDateString(),
            'status' => 'active',
            'renewal_count' => 0,
        ]);

        $session = ChatSession::create(['member_id' => $data['member']->id, 'title' => 'Loan question']);

        $result = $this->service->generateRecommendation($session, 'When is my book due?');

        // Personal account details must NOT be exposed by the public library assistant
        $this->assertStringNotContainsString('MEM-TEST-001', $result['message']);
        $this->assertStringContainsString('Member Dashboard', $result['message']);
        $this->assertStringContainsString('/member', $result['message']);
    }

    public function test_availability_question_lists_available_books(): void
    {
        $data = $this->createLibraryData();
        $session = ChatSession::create(['member_id' => $data['member']->id, 'title' => 'Availability']);

        $result = $this->service->generateRecommendation($session, 'Which books are available right now?');

        $this->assertStringContainsString('available', strtolower($result['message']));
        $this->assertStringContainsString('Atomic Habits', $result['message']);
    }

    public function test_irrelevant_query_does_not_fabricate_books(): void
    {
        $data = $this->createLibraryData();
        $session = ChatSession::create(['member_id' => $data['member']->id, 'title' => 'Garbage query']);

        $result = $this->service->generateRecommendation($session, 'asdfqwer zxcvbnm');

        $this->assertStringContainsString("couldn't find", strtolower($result['message']));
        $this->assertEmpty($result['books']);
    }

    public function test_system_prompt_catalog_context_includes_full_database_records_and_no_user_accounts(): void
    {
        $data = $this->createLibraryData();

        /** @var \App\Services\AiLibrarianManagerService $manager */
        $manager = app(\App\Services\AiLibrarianManagerService::class);
        $catalogContext = $manager->buildCatalogDatabaseContext('Atomic Habits');

        // Verify catalog database records are comprehensively extracted
        $this->assertStringContainsString('Atomic Habits', $catalogContext);
        $this->assertStringContainsString('James Clear', $catalogContext);
        $this->assertStringContainsString('978-0735211292', $catalogContext);
        $this->assertStringContainsString('Science', $catalogContext);
        $this->assertStringContainsString('Avery', $catalogContext);
        $this->assertStringContainsString('2018', $catalogContext);
        $this->assertStringContainsString('Rack-1', $catalogContext);
        $this->assertStringContainsString('KES 45.00', $catalogContext);
        $this->assertStringContainsString('/books/' . $data['book']->id, $catalogContext);
        $this->assertStringContainsString('LIBRARY CATALOG DATABASE INVENTORY SUMMARY', $catalogContext);

        // Verify sensitive patron account information is NEVER present
        $this->assertStringNotContainsString('MEM-TEST-001', $catalogContext);
        $this->assertStringNotContainsString('alex@example.com', $catalogContext);
        $this->assertStringNotContainsString('Alex Johnson', $catalogContext);
        $this->assertStringNotContainsString('password', $catalogContext);
    }
}