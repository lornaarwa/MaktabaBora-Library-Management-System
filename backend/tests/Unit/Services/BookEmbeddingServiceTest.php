<?php

namespace Tests\Unit\Services;

use App\Services\BookEmbeddingService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookEmbeddingServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.openai.api_key' => 'sk-test-key']);
    }

    public function test_cosine_returns_one_for_identical_vectors(): void
    {
        $this->assertEqualsWithDelta(1.0, BookEmbeddingService::cosine([1.0, 0.0, 0.0], [1.0, 0.0, 0.0]), 0.0001);
    }

    public function test_cosine_returns_zero_for_orthogonal_vectors(): void
    {
        $this->assertEqualsWithDelta(0.0, BookEmbeddingService::cosine([1.0, 0.0, 0.0], [0.0, 1.0, 0.0]), 0.0001);
    }

    public function test_cosine_ranks_similar_above_unrelated(): void
    {
        $similar = BookEmbeddingService::cosine([0.95, 0.30, 0.05], [1.0, 0.0, 0.0]);
        $unrelated = BookEmbeddingService::cosine([0.95, 0.30, 0.05], [0.0, 1.0, 0.0]);

        $this->assertGreaterThan($unrelated, $similar);
    }

    public function test_cosine_handles_mismatched_dimensions(): void
    {
        $this->assertEquals(0.0, BookEmbeddingService::cosine([1.0], [1.0, 2.0]));
    }

    public function test_embed_texts_calls_openai_and_returns_aligned_vectors(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'data' => [
                    ['index' => 0, 'embedding' => [0.1, 0.2, 0.3]],
                    ['index' => 1, 'embedding' => [0.4, 0.5, 0.6]],
                ],
            ]),
        ]);

        $vectors = (new BookEmbeddingService())->embedTexts(['first book', 'second book']);

        Http::assertSent(function ($request) {
            $payload = $request->data();

            return str_contains($request->url(), '/v1/embeddings')
                && $payload['model'] === 'text-embedding-3-small'
                && $payload['input'] === ['first book', 'second book'];
        });

        $this->assertEquals([0.1, 0.2, 0.3], $vectors[0]);
        $this->assertEquals([0.4, 0.5, 0.6], $vectors[1]);
    }

    public function test_embed_texts_throws_without_key(): void
    {
        config(['services.openai.api_key' => '']);

        $this->expectException(\RuntimeException::class);

        (new BookEmbeddingService())->embedTexts(['anything']);
    }

    public function test_books_embed_command_warns_without_key(): void
    {
        config(['services.openai.api_key' => '']);

        $this->artisan('books:embed')
            ->expectsOutputToContain('OpenAI API key is not configured')
            ->assertExitCode(0);
    }
}