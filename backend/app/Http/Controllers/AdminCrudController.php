<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminCrudController extends Controller
{
    /**
     * Map of allowed domain tables to their Model classes (excluding migrations, password_reset_tokens, sessions)
     */
    protected array $allowedTables = [
        'users' => \App\Models\User::class,
        'members' => \App\Models\Member::class,
        'librarians' => \App\Models\Librarian::class,
        'books' => \App\Models\Book::class,
        'book_copies' => \App\Models\BookCopy::class,
        'loans' => \App\Models\Loan::class,
        'reservations' => \App\Models\Reservation::class,
        'fines' => \App\Models\Fine::class,
        'subscriptions' => \App\Models\Subscription::class,
        'digital_purchases' => \App\Models\DigitalPurchase::class,
    ];

    public function indexTables(): JsonResponse
    {
        $tables = array_keys($this->allowedTables);
        return response()->json([
            'status' => 'success',
            'tables' => $tables,
        ]);
    }

    public function getTableData(string $table): JsonResponse
    {
        if (!isset($this->allowedTables[$table])) {
            return response()->json(['error' => 'Table not managed or access restricted.'], 404);
        }

        $columns = Schema::getColumnListing($table);
        $records = DB::table($table)->get();

        return response()->json([
            'status' => 'success',
            'table' => $table,
            'columns' => $columns,
            'data' => $records,
        ]);
    }

    public function storeRecord(Request $request, string $table): JsonResponse
    {
        if (!isset($this->allowedTables[$table])) {
            return response()->json(['error' => 'Table not managed or access restricted.'], 404);
        }

        $data = $request->except(['id', 'created_at', 'updated_at']);
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        if (Schema::hasColumn($table, 'created_at')) {
            $data['created_at'] = now();
        }
        if (Schema::hasColumn($table, 'updated_at')) {
            $data['updated_at'] = now();
        }

        $id = DB::table($table)->insertGetId($data);
        $record = DB::table($table)->where('id', $id)->first();

        return response()->json([
            'message' => "Record created in {$table} successfully.",
            'data' => $record,
        ], 201);
    }

    public function updateRecord(Request $request, string $table, $id): JsonResponse
    {
        if (!isset($this->allowedTables[$table])) {
            return response()->json(['error' => 'Table not managed or access restricted.'], 404);
        }

        $data = $request->except(['id', 'created_at', 'updated_at']);
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        if (Schema::hasColumn($table, 'updated_at')) {
            $data['updated_at'] = now();
        }

        DB::table($table)->where('id', $id)->update($data);
        $record = DB::table($table)->where('id', $id)->first();

        return response()->json([
            'message' => "Record #{$id} in {$table} updated successfully.",
            'data' => $record,
        ]);
    }

    public function destroyRecord(string $table, $id): JsonResponse
    {
        if (!isset($this->allowedTables[$table])) {
            return response()->json(['error' => 'Table not managed or access restricted.'], 404);
        }

        DB::table($table)->where('id', $id)->delete();

        return response()->json([
            'message' => "Record #{$id} deleted from {$table} successfully.",
        ]);
    }
}
