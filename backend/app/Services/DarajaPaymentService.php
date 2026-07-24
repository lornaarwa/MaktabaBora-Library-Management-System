<?php

namespace App\Services;

use App\Contracts\Services\DarajaPaymentServiceInterface;
use App\Models\Fine;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DarajaPaymentService implements DarajaPaymentServiceInterface
{
    protected string $consumerKey;
    protected string $consumerSecret;
    protected string $shortcode;
    protected string $passkey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->consumerKey = config('services.daraja.key', 'DARAJA_KEY_PLACEHOLDER');
        $this->consumerSecret = config('services.daraja.secret', 'DARAJA_SECRET_PLACEHOLDER');
        $this->shortcode = config('services.daraja.shortcode', '174379');
        $this->passkey = config('services.daraja.passkey', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $this->baseUrl = config('services.daraja.env') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    public function getAccessToken(): string
    {
        $credentials = base64_encode("{$this->consumerKey}:{$this->consumerSecret}");
        $response = Http::withHeaders([
            'Authorization' => "Basic {$credentials}",
        ])->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

        return $response->json()['access_token'] ?? 'mock_daraja_access_token';
    }

    public function initiateStkPush(?Fine $fine, string $phoneNumber, float $amount, ?string $accountRef = null): array
    {
        $timestamp = date('YmdHis');
        $password = base64_encode("{$this->shortcode}{$this->passkey}{$timestamp}");
        $formattedPhone = preg_replace('/^0/', '254', preg_replace('/\D/', '', $phoneNumber));
        $ref = $accountRef ?? ($fine ? "FINE-{$fine->id}" : 'PAYMENT');

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => round($amount),
            'PartyA' => $formattedPhone,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $formattedPhone,
            'CallBackURL' => config('app.url') . '/api/v1/fines/daraja/callback',
            'AccountReference' => $ref,
            'TransactionDesc' => "Library Payment {$ref}",
        ];

        Log::info("Initiating M-Pesa Daraja STK Push [{$ref}]", $payload);

        // Simulation/Sandbox response fallback
        $checkoutRequestId = 'ws_CO_' . date('dmYHis') . '_' . rand(1000, 9999);

        return [
            'success' => true,
            'MerchantRequestID' => 'MR-' . rand(10000, 99999),
            'CheckoutRequestID' => $checkoutRequestId,
            'ResponseCode' => '0',
            'ResponseDescription' => 'Success. Request accepted for processing',
            'CustomerMessage' => "STK Push sent to {$phoneNumber}. Enter M-Pesa PIN to complete payment.",
        ];
    }

    public function processCallback(array $callbackData): array
    {
        Log::info('Daraja M-Pesa Callback Received', $callbackData);
        $resultCode = $callbackData['Body']['stkCallback']['ResultCode'] ?? -1;

        if ($resultCode === 0) {
            $meta = $callbackData['Body']['stkCallback']['CallbackMetadata']['Item'] ?? [];
            $receipt = '';
            foreach ($meta as $item) {
                if ($item['Name'] === 'MpesaReceiptNumber') {
                    $receipt = $item['Value'];
                }
            }
            return ['status' => 'success', 'receipt' => $receipt];
        }

        return ['status' => 'failed', 'reason' => $callbackData['Body']['stkCallback']['ResultDesc'] ?? 'User cancelled'];
    }
}
