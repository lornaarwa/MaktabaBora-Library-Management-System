<?php

namespace Tests\Unit\Middleware;

use Tests\TestCase;
use App\Http\Middleware\EnsureIsMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class EnsureIsMemberTest extends TestCase
{
    use RefreshDatabase;

    protected EnsureIsMember $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsureIsMember();
    }

    public function test_it_allows_members_and_admins(): void
    {
        $memberUser = User::create(['name' => 'Member', 'email' => 'm2@example.com', 'password' => 'secret', 'role' => 'member']);
        \App\Models\Member::create(['user_id' => $memberUser->id, 'member_number' => 'MEM-9999', 'is_subscribed' => true]);

        $request = Request::create('/api/v1/loans', 'GET');
        $request->setUserResolver(fn () => $memberUser);

        $response = $this->middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(200, $response->getStatusCode());
    }
}
