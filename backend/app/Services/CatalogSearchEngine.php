<?php

namespace App\Services;

use App\Contracts\Services\CatalogSearchEngineInterface;
use App\Models\Book;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CatalogSearchEngine implements CatalogSearchEngineInterface
{
    /**
     * Hybrid search: keyword recall (SQL LIKE) + semantic ranking (TF-IDF cosine)
     * via CatalogRetrievalService. Response shape is unchanged.
     */
    public function search(array $params, int $perPage = 15): LengthAwarePaginator
    {
        return app(CatalogRetrievalService::class)->search($params, $perPage);
    }

    public function searchByQuery(string $query, int $perPage = 15): LengthAwarePaginator
    {
        return $this->search(['q' => $query], $perPage);
    }


    public function buildQuery(array $params): Builder
    {
        $query = Book::query();

        if (!empty($params['q'])) {
            $term = '%' . $params['q'] . '%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('author', 'like', $term)
                  ->orWhere('isbn', 'like', $term)
                  ->orWhere('genre', 'like', $term)
                  ->orWhere('description', 'like', $term);
            });
        }

        if (!empty($params['genre'])) {
            $query->where('genre', $params['genre']);
        }

        if (!empty($params['author'])) {
            $query->where('author', 'like', '%' . $params['author'] . '%');
        }

        if (!empty($params['isbn'])) {
            $query->where('isbn', $params['isbn']);
        }

        if (isset($params['available_only']) && $params['available_only']) {
            $query->where('available_copies', '>', 0)->where('is_blocked', false);
        }

        $sortField = $params['sort_by'] ?? 'created_at';
        $sortOrder = $params['sort_order'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        return $query;
    }
}
