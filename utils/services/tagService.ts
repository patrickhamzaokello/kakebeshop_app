import apiService from "@/utils/apiBase";
import { Tag } from "@/utils/types/models";

export const tagService = {
    async getTags(): Promise<Tag[]> {
        try {
            const response = await apiService.get<any>("/api/v1/tags/");
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.results)) return data.results;
            return [];
        } catch (error) {
            if (__DEV__) console.error("[tagService.getTags] error:", error);
            return [];
        }
    },

    async getTag(id: string): Promise<Tag | null> {
        try {
            const response = await apiService.get<Tag>(`/api/v1/tags/${id}/`);
            return response.data ?? null;
        } catch (error) {
            if (__DEV__) console.error("[tagService.getTag] error:", error);
            return null;
        }
    },
};
