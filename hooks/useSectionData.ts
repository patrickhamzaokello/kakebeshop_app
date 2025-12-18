// ============================================
// useSectionData.ts - FINAL FIXED VERSION
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/utils/types';

interface UseSectionDataReturn<T> {
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    refetch: () => Promise<void>;
}

export function useSectionData<T>(
    fetchFunction: () => Promise<T>
): UseSectionDataReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);
    
    const fetchRef = useRef(fetchFunction);
    const mounted = useRef(true);
    const loadCounter = useRef(0);

    // Update ref without triggering re-render
    useEffect(() => {
        fetchRef.current = fetchFunction;
    });

    const loadData = useCallback(async () => {
        const currentLoad = ++loadCounter.current;
        
        try {
            setLoading(true);
            setError(null);
            const result = await fetchRef.current();
            
            // Only update if this is still the latest request and component is mounted
            if (mounted.current && currentLoad === loadCounter.current) {
                setData(result);
            }
        } catch (err) {
            if (mounted.current && currentLoad === loadCounter.current) {
                const apiError = err as ApiError;
                setError(apiError);
                console.error('Section data error:', apiError);
            }
        } finally {
            if (mounted.current && currentLoad === loadCounter.current) {
                setLoading(false);
            }
        }
    }, []);

    // Initial load only
    useEffect(() => {
        loadData();
        
        return () => {
            mounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        data,
        loading,
        error,
        refetch: loadData,
    };
}