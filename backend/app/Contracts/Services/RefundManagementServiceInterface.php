<?php

namespace App\Contracts\Services;

use App\Models\Member;
use App\Models\RefundRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface RefundManagementServiceInterface
{
    public function submitRefundRequest(User $user, Member $member, float $amount, string $reason): RefundRequest;
    
    public function getAllRefundRequests(): Collection;

    public function approveRefund(int $refundRequestId, User $librarianUser): RefundRequest;

    public function rejectRefund(int $refundRequestId, User $librarianUser): RefundRequest;
}
