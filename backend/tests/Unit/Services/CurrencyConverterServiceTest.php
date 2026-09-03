<?php

namespace Tests\Unit\Services;

use App\Services\CurrencyConverterService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CurrencyConverterServiceTest extends TestCase
{
    private const RATES = [
        'result' => 'success',
        'provider' => 'https://www.exchangerate-api.com',
        'base_code' => 'USD',
        'rates' => [
            'KES' => 129.465319,
            'USD' => 1.0,
            'GBP' => 0.76,
            'EUR' => 0.86,
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        Cache::flush();
    }

    public function test_converts_usd_to_kes_estimate(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $service = new CurrencyConverterService();

        $this->assertSame(129.465319, $service->rateFor('USD'));
        $this->assertSame(3883.0, $service->convert(29.99, 'USD'));
    }

    public function test_rates_are_cached_for_a_day_and_not_refetched(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $service = new CurrencyConverterService();
        $service->convert(10, 'USD');
        $service->convert(20, 'USD');

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/latest/USD'));
        $this->assertTrue(Cache::has('currency.exchange_rates.usd'));
    }

    public function test_converts_any_supported_currency_via_usd_pivot(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $service = new CurrencyConverterService();

        // KES per GBP = KES-per-USD / GBP-per-USD = 129.465319 / 0.76 ≈ 170.35
        $this->assertSame(1703.0, $service->convert(10, 'GBP'));
        $this->assertSame(1505.0, $service->convert(10, 'EUR')); // 129.465319 / 0.86 ≈ 150.54
    }

    public function test_kes_itself_is_identity(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $service = new CurrencyConverterService();

        $this->assertSame(1.0, $service->rateFor('KES'));
        $this->assertSame(500.0, $service->convert(500, 'KES'));
    }

    public function test_unknown_currency_returns_null(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response(self::RATES)]);

        $service = new CurrencyConverterService();

        $this->assertNull($service->rateFor('XYZ'));
        $this->assertNull($service->convert(10, 'XYZ'));
    }

    public function test_api_failure_degrades_gracefully_to_null(): void
    {
        Http::fake(['open.er-api.com/*' => Http::response([], 500)]);

        $service = new CurrencyConverterService();

        $this->assertNull($service->convert(29.99, 'USD'));
        $this->assertNull($service->rateFor('USD'));
    }

    public function test_unexpected_payload_without_kes_returns_null(): void
    {
        Http::fake([
            'open.er-api.com/*' => Http::response([
                'result' => 'success',
                'rates' => ['USD' => 1.0], // no KES rate
            ]),
        ]);

        $service = new CurrencyConverterService();

        $this->assertNull($service->convert(29.99, 'USD'));
    }
}
