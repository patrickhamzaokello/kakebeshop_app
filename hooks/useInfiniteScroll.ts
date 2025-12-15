import { useState, useCallback, useEffect } from 'react';
import { PaginatedResponse } from '@/utils/types/models';
import {ApiError} from "@/utils/types";

interface UseInfiniteScrollReturn<T> {
    data: T[];
    loading: boolean;
    refreshing: boolean;
    hasMore: boolean;
    error: ApiError | null;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useInfiniteScroll<T>(
    fetchFunction: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
    itemsPerPage: number = 10
): UseInfiniteScrollReturn<T> {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        try {
            setLoading(true);
            setError(null);
            const response = await fetchFunction(page, itemsPerPage);

            setData((prev) => [...prev, ...response.results]);
            setHasMore(response.next !== null);
            setPage((prev) => prev + 1);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError);
            console.error('Infinite scroll error:', apiError);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, fetchFunction, itemsPerPage]);

    const refresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);
            const data = await fetchFunction(1, itemsPerPage);

            setData(data.results);
            setPage(2);
            setHasMore(data.next !== null);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError);
        } finally {
            setRefreshing(false);
        }
    }, [fetchFunction, itemsPerPage]);

    useEffect(() => {
        loadMore();
    }, []);

    return {
        data,
        loading,
        refreshing,
        hasMore,
        error,
        loadMore,
        refresh,
    };
}