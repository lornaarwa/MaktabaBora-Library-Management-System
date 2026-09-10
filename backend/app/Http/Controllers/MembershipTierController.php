<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipTierController extends Controller
{
    private function getTiersFilePath(): string
    {
        return storage_path('app/membership_tiers.json');
    }

    private function getDefaultTiers(): array
    {
        return [
            [
                'id' => 'student',
                'name' => 'Student Pass',
                'price' => 500,
                'currency' => 'KES',
                'billingPeriod' => 'per year',
                'description' => 'Designed for active university and high school students.',
                'borrowLimit' => '3 Books at a time',
                'perks' => [
                    'Access to full physical & digital catalog',
                    '3 active book loans',
                    '14-day borrowing duration',
                    'Basic AI Librarian search assistance',
                ],
                'recommended' => false,
                'accent' => 'olive',
                'active' => true,
            ],
            [
                'id' => 'standard',
                'name' => 'Standard Reader',
                'price' => 1500,
                'currency' => 'KES',
                'billingPeriod' => 'per year',
                'description' => 'Ideal for avid readers, professionals, and general public.',
                'borrowLimit' => '7 Books at a time',
                'perks' => [
                    'Access to full catalog & digital e-reader',
                    '7 active book loans',
                    '30-day borrowing duration',
                    'Priority book reservations',
                    'Full AI Assistant & recommendations',
                ],
                'recommended' => true,
                'accent' => 'tan',
                'active' => true,
            ],
            [
                'id' => 'scholar',
                'name' => 'Scholar & Researcher',
                'price' => 3000,
                'currency' => 'KES',
                'billingPeriod' => 'per year',
                'description' => 'For academics, researchers, and institutional members.',
                'borrowLimit' => '15 Books at a time',
                'perks' => [
                    'Unlimited digital e-reader access',
                    '15 active book loans',
                    '60-day extended borrowing',
                    'Inter-library loan request privileges',
                    'Dedicated research desk support',
                ],
                'recommended' => false,
                'accent' => 'sage',
                'active' => true,
            ],
        ];
    }

    public function index(): JsonResponse
    {
        $path = $this->getTiersFilePath();
        $defaultMap = collect($this->getDefaultTiers())->keyBy('id');

        if (!file_exists($path)) {
            $tiers = $this->getDefaultTiers();
            file_put_contents($path, json_encode($tiers, JSON_PRETTY_PRINT));
        } else {
            $raw = json_decode(file_get_contents($path), true);
            if (is_array($raw) && !empty($raw)) {
                $tiers = array_map(function ($tier) use ($defaultMap) {
                    $default = $defaultMap->get($tier['id'] ?? '') ?: [];
                    $merged = array_merge([
                        'currency' => 'KES',
                        'billingPeriod' => 'per year',
                        'description' => '',
                        'borrowLimit' => '3 Books at a time',
                        'perks' => [],
                        'recommended' => false,
                        'accent' => 'tan',
                        'active' => true,
                    ], $default, $tier);

                    // Ensure perks is always an array
                    if (!isset($merged['perks']) || !is_array($merged['perks']) || empty($merged['perks'])) {
                        $merged['perks'] = $default['perks'] ?? [
                            'Access to full catalog & digital e-reader',
                            'Standard borrowing privileges',
                        ];
                    }

                    return $merged;
                }, $raw);
            } else {
                $tiers = $this->getDefaultTiers();
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => array_values($tiers),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tiers' => 'required|array',
            'tiers.*.id' => 'required|string',
            'tiers.*.name' => 'required|string',
            'tiers.*.price' => 'required|numeric',
            'tiers.*.currency' => 'sometimes|string',
            'tiers.*.billingPeriod' => 'sometimes|string',
            'tiers.*.description' => 'sometimes|string',
            'tiers.*.borrowLimit' => 'sometimes|string',
            'tiers.*.perks' => 'sometimes|array',
            'tiers.*.recommended' => 'sometimes|boolean',
            'tiers.*.accent' => 'sometimes|string',
            'tiers.*.active' => 'sometimes|boolean',
        ]);

        $path = $this->getTiersFilePath();
        if (!is_dir(dirname($path))) {
            @mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, json_encode($validated['tiers'], JSON_PRETTY_PRINT));

        return response()->json([
            'status' => 'success',
            'message' => 'Membership tiers updated successfully.',
            'data' => $validated['tiers'],
        ]);
    }
}
