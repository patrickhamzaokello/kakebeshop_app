// ============================================
// useInfiniteScroll.ts - FINAL FIXED VERSION
// ============================================
import { useState, useCallback, useEffect, useRef } from 'react';
import { PaginatedResponse } from '@/utils/types/models';
import { ApiError } from "@/utils/types";

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
    
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const fetchRef = useRef(fetchFunction);
    const itemsPerPageRef = useRef(itemsPerPage);
    const mounted = useRef(true);

    // Update refs when props change
    useEffect(() => {
        fetchRef.current = fetchFunction;
        itemsPerPageRef.current = itemsPerPage;
    });

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            
            setPage(currentPage => {
                fetchRef.current(currentPage, itemsPerPageRef.current)
                    .then(response => {
                        if (mounted.current) {
                            setData((prev) => [...prev, ...response.results]);
                            setHasMore(response.next !== null);
                            hasMoreRef.current = response.next !== null;
                        }
                    })
                    .catch(err => {
                        if (mounted.current) {
                            const apiError = err as ApiError;
                            setError(apiError);
                            console.error('Infinite scroll error:', apiError);
                        }
                    })
                    .finally(() => {
                        if (mounted.current) {
                            loadingRef.current = false;
                            setLoading(false);
                        }
                    });
                
                return currentPage + 1;
            });
        } catch (err) {
            if (mounted.current) {
                const apiError = err as ApiError;
                setError(apiError);
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);
            const response = await fetchRef.current(1, itemsPerPageRef.current);

            if (mounted.current) {
                setData(response.results);
                setPage(2);
                setHasMore(response.next !== null);
                hasMoreRef.current = response.next !== null;
            }
        } catch (err) {
            if (mounted.current) {
                const apiError = err as ApiError;
                setError(apiError);
            }
        } finally {
            if (mounted.current) {
                setRefreshing(false);
            }
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadMore();
        
        return () => {
            mounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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