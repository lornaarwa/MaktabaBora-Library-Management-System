<?php

namespace App\Services;

use App\Contracts\Services\CurrencyConverterServiceInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyConverterService implements CurrencyConverterServiceInterface
{
    private const CACHE_KEY = 'currency.exchange_rates.usd';

    /**
     * Convert any supported currency to an estimated KES amount, rounded to a
     * whole shilling. Never authoritative — for display only.
     */
    public function convert(float $amount, string $currency): ?float
    {
        $rate = $this->rateFor($currency);

        if ($rate === null) {
            return null;
        }

        return (float) round($amount * $rate);
    }

    /**
     * KES per 1 unit of $currency, derived from a single cached USD-based rate table:
     * rate(cur -> KES) = rates[KES] / rates[cur].
     */
    public function rateFor(string $currency): ?float
    {
        $currency = strtoupper($currency);

        if ($currency === 'KES') {
            return 1.0;
        }

        $rates = $this->rates();

        if ($rates === null || !isset($rates[$currency])) {
            return null;
        }

        return $rates['KES'] / $rates[$currency];
    }

    /**
     * Full rate table (rates per 1 USD), cached for a day.
     */
    private function rates(): ?array
    {
        $ttl = (int) config('services.currency.cache_ttl_seconds', 86400);

        return Cache::remember(self::CACHE_KEY, $ttl, function () {
            return $this->fetchRates();
        });
    }

    private function fetchRates(): ?array
    {
        try {
            $base = rtrim((string) config('services.currency.url', 'https://open.er-api.com/v6/latest'), '/')
                . '/' . config('services.currency.base', 'USD');

            $response = Http::timeout((int) config('services.currency.timeout', 8))->get($base);

            if (!$response->successful()) {
                Log::warning('CurrencyConverter: exchange-rate API returned HTTP ' . $response->status());
                return null;
            }

            $data = $response->json();

            if (($data['result'] ?? null) !== 'success' || empty($data['rates']) || !isset($data['rates']['KES'])) {
                Log::warning('CurrencyConverter: unexpected exchange-rate payload', ['keys' => array_keys($data ?? [])]);
                return null;
            }

            return $data['rates'];
        } catch (\Throwable $e) {
            Log::warning('CurrencyConverter: exchange-rate API unavailable', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
