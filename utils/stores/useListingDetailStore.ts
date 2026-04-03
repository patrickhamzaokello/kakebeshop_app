import { create } from "zustand";
import {
  ListingDetail,
  SimilarFromMerchantResponse,
  SimilarFromMarketplaceResponse,
} from "@/utils/types/models";
import { listingDetailsService } from "@/utils/services/listingDetailsService";

// ─── Constants ───────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 20;

// ─── Cache Entry Type ────────────────────────────────────
export interface ListingCacheEntry {
  listing: ListingDetail;
  similarMerchant: SimilarFromMerchantResponse | null;
  similarMarketplace: SimilarFromMarketplaceResponse | null;
  cachedAt: number;
  lastAccessedAt: number;
}

// ─── Store State Type ────────────────────────────────────
interface ListingDetailState {
  cache: Record<string, ListingCacheEntry>;
  isLoading: Record<string, boolean>;

  // Fetch actions
  fetchListingDetail: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<ListingDetail | null>;
  fetchSimilarListings: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<{
    similarMerchant: SimilarFromMerchantResponse | null;
    similarMarketplace: SimilarFromMarketplaceResponse | null;
  }>;
  fetchAllCacheableData: (
    id: string,
    forceRefresh?: boolean
  ) => Promise<ListingCacheEntry | null>;

  // Getters
  getCachedListing: (id: string) => ListingDetail | null;
  getCachedSimilarMerchant: (
    id: string
  ) => SimilarFromMerchantResponse | null;
  getCachedSimilarMarketplace: (
    id: string
  ) => SimilarFromMarketplaceResponse | null;
  isCacheValid: (id: string) => boolean;

  // Cache management
  clearCache: () => void;
  evictListing: (id: string) => void;
}

// ─── LRU Eviction Helper ─────────────────────────────────
const evictIfNeeded = (
  cache: Record<string, ListingCacheEntry>
): Record<string, ListingCacheEntry> => {
  const keys = Object.keys(cache);
  if (keys.length <= MAX_CACHE_SIZE) return cache;

  let oldestKey = keys[0];
  let oldestTime = cache[keys[0]].lastAccessedAt;

  for (const key of keys) {
    if (cache[key].lastAccessedAt < oldestTime) {
      oldestTime = cache[key].lastAccessedAt;
      oldestKey = key;
    }
  }

  const { [oldestKey]: _, ...remaining } = cache;
  return remaining;
};

// ─── Store ───────────────────────────────────────────────
export const useListingDetailStore = create<ListingDetailState>()(
  (set, get) => ({
    cache: {},
    isLoading: {},

    // ─── Getters ─────────────────────────────────────────
    getCachedListing: (id) => {
      const entry = get().cache[id];
      if (!entry) return null;
      if (Date.now() - entry.cachedAt >= CACHE_TTL_MS) return null;
      return entry.listing;
    },

    getCachedSimilarMerchant: (id) =>
      get().cache[id]?.similarMerchant ?? null,

    getCachedSimilarMarketplace: (id) =>
      get().cache[id]?.similarMarketplace ?? null,

    isCacheValid: (id) => {
      const entry = get().cache[id];
      if (!entry) return false;
      return Date.now() - entry.cachedAt < CACHE_TTL_MS;
    },

    // ─── Fetch Listing Detail ────────────────────────────
    fetchListingDetail: async (id, forceRefresh = false) => {
      const state = get();

      // Return cached if valid and not forcing refresh
      if (!forceRefresh && state.isCacheValid(id)) {
        set((prev) => ({
          cache: {
            ...prev.cache,
            [id]: {
              ...prev.cache[id],
              lastAccessedAt: Date.now(),
            },
          },
        }));
        return state.cache[id].listing;
      }

      set((prev) => ({
        isLoading: { ...prev.isLoading, [id]: true },
      }));

      try {
        const listingData =
          await listingDetailsService.getListingDetails(id);

        if (!listingData) return null;

        const now = Date.now();

        set((prev) => {
          const existingEntry = prev.cache[id];
          const newEntry: ListingCacheEntry = {
            listing: listingData,
            similarMerchant: existingEntry?.similarMerchant ?? null,
            similarMarketplace:
              existingEntry?.similarMarketplace ?? null,
            cachedAt: now,
            lastAccessedAt: now,
          };

          const updatedCache = { ...prev.cache, [id]: newEntry };
          return { cache: evictIfNeeded(updatedCache) };
        });

        return listingData;
      } catch (error) {
        if (__DEV__) console.error("Failed to fetch listing details:", error);
        return null;
      } finally {
        set((prev) => ({
          isLoading: { ...prev.isLoading, [id]: false },
        }));
      }
    },

    // ─── Fetch Similar Listings ──────────────────────────
    fetchSimilarListings: async (id, forceRefresh = false) => {
      const state = get();

      if (
        !forceRefresh &&
        state.isCacheValid(id) &&
        state.cache[id].similarMerchant !== null
      ) {
        return {
          similarMerchant: state.cache[id].similarMerchant,
          similarMarketplace: state.cache[id].similarMarketplace,
        };
      }

      try {
        const [similarMerchant, similarMarketplace] =
          await Promise.all([
            listingDetailsService.getSimilarFromMerchant(id, 6),
            listingDetailsService.getSimilarFromMarketplace(id, 12),
          ]);

        set((prev) => {
          const existingEntry = prev.cache[id];
          if (!existingEntry) return prev;

          return {
            cache: {
              ...prev.cache,
              [id]: {
                ...existingEntry,
                similarMerchant,
                similarMarketplace,
                lastAccessedAt: Date.now(),
              },
            },
          };
        });

        return { similarMerchant, similarMarketplace };
      } catch (error) {
        if (__DEV__) console.error("Failed to fetch similar listings:", error);
        return {
          similarMerchant: null,
          similarMarketplace: null,
        };
      }
    },

    // ─── Fetch All Cacheable Data ────────────────────────
    fetchAllCacheableData: async (id, forceRefresh = false) => {
      const listing = await get().fetchListingDetail(
        id,
        forceRefresh
      );
      if (!listing) return null;

      await get().fetchSimilarListings(id, forceRefresh);

      return get().cache[id] ?? null;
    },

    // ─── Cache Management ────────────────────────────────
    clearCache: () => set({ cache: {}, isLoading: {} }),

    evictListing: (id) =>
      set((prev) => {
        const { [id]: _, ...remaining } = prev.cache;
        return { cache: remaining };
      }),
  })
);
