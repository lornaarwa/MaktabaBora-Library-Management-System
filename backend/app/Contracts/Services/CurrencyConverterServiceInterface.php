<?php

namespace App\Contracts\Services;

interface CurrencyConverterServiceInterface
{
    /**
     * Estimate the KES value of an amount in a foreign currency.
     * Returns null when the rate is unavailable (API failure, unknown currency).
     */
    public function convert(float $amount, string $currency): ?float;

    /**
     * KES per 1 unit of the given currency (e.g. ~129.47 for USD).
     * Returns 1.0 for KES itself, null when unknown or unavailable.
     */
    public function rateFor(string $currency): ?float;
}
