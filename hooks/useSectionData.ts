import { useState, useEffect, useCallback, DependencyList } from 'react';
import { ApiError } from '@/utils/types';

interface UseSectionDataReturn<T> {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    refetch: () => Promise<void>;
}

export function useSectionData<T>(
    fetchFunction: () => Promise<T>,
    dependencies: DependencyList = []
): UseSectionDataReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError);
            console.error('Section data error:', apiError);
        } finally {
            setLoading(false);
        }
    }, dependencies);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        data,
        loading,
        error,
        refetch: loadData,
    };
}