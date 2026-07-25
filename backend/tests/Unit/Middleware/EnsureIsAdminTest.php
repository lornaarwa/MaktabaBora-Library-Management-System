<?php

namespace Tests\Unit\Middleware;

use Tests\TestCase;
use App\Http\Middleware\EnsureIsAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class EnsureIsAdminTest extends TestCase
{
    use RefreshDatabase;

    protected EnsureIsAdmin $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new EnsureIsAdmin();
    }

    public function test_it_blocks_non_admin_users(): void
    {
        $memberUser = User::create(['name' => 'Member', 'email' => 'm@example.com', 'password' => 'secret', 'role' => 'member']);

        $request = Request::create('/api/v1/admin/users', 'GET');
        $request->setUserResolver(fn () => $memberUser);

        $response = $this->middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_it_allows_admin_users(): void
    {
        $adminUser = User::create(['name' => 'Admin', 'email' => 'a@example.com', 'password' => 'secret', 'role' => 'admin']);

        $request = Request::create('/api/v1/admin/users', 'GET');
        $request->setUserResolver(fn () => $adminUser);

        $response = $this->middleware->handle($request, fn () => response()->json(['success' => true]));

        $this->assertEquals(200, $response->getStatusCode());
    }
}
