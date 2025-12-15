import apiService from "@/utils/apiBase";

export const postUserIntent = async (
  intent: string
): Promise<any> => {
  try {
    const response = await apiService.post<any>("/api/v1/user-intent/", {
      intent: intent,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch login details");
  } catch (error) {
    return null;
  }
};

export const loginwithEmailPassword = async (
  email: string,
  password: string
): Promise<any> => {
  try {
    const response = await apiService.post<any>("/auth/login/", {
      email,
      password,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to fetch login details");
  } catch (error) {
    return null;
  }
};

export const getNewsTopStory = async (): Promise<any> => {
  try {
    const response = await apiService.get<any>("/news/articles/top_story/");
    if (response.success && response.data && Array.isArray(response.data)) {
      return response.data[0]; // Return the first item in the list
    }
    throw new Error(response.message || "Failed to fetch top story");
  } catch (error) {
    return null;
  }
};

export const followNewsSource = async (sourceID: string): Promise<any> => {};

export const unfollowNewsSource = async (sourceID: string): Promise<any> => {};

export const getAllSources = async (page: number = 1): Promise<any> => {
  try {
    let response;

    response = await apiService.get<any>(`/news/sources/?page=${page}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch sources");
  } catch (error) {
    return null;
  }
};

export const getUserNotificationsList = async (
  page: number = 1
): Promise<any> => {
  try {
    let response;

    response = await apiService.get<any>(`/news/notifications/?page=${page}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch notifications");
  } catch (error) {
    return null;
  }
};

export const markNotificationAsRead = async (
  notificationID: number | string
): Promise<any> => {
  try {
    let response;

    response = await apiService.post<any>(
      `/news/notifications/${notificationID}/mark_read/`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to mark notification as read");
  } catch (error) {
    return null;
  }
};

export const markAllNotificationsAsRead = async (): Promise<any> => {
  try {
    let response;

    response = await apiService.post<any>(`/news/notifications/mark_all_read/`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(
      response.message || "Failed to mark all notifications as read"
    );
  } catch (error) {
    return null;
  }
};

export const getNotificationStats = async (): Promise<any> => {
  try {
    let response;

    response = await apiService.get<any>(`/news/notifications/stats/`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch notification stats");
  } catch (error) {
    return null;
  }
};

export const getAllCategories = async (page: number = 1): Promise<any> => {
  try {
    let response;

    response = await apiService.get<any>(`/news/categories/?page=${page}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch categories");
  } catch (error) {
    return null;
  }
};

export const getLatestNews = async (page: number = 1): Promise<any> => {
  try {
    let response;

    response = await apiService.get<any>(`/news/articles/?page=${page}`);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch news");
  } catch (error) {
    return null;
  }
};

export const getFeaturedNews = async (page: number = 1): Promise<any> => {
  try {
    const response = await apiService.get<any>(`/news/articles/featured/`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch featured news");
  } catch (error) {
    return null;
  }
};

export const SearchArticle = async (query: string): Promise<any> => {
  try {
    const url = `/news/articles/search/?q=${query}&page_size=10`;
    console.log("Search URL:", url); // Debugging line
    const response = await apiService.get<any>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch search suggestions");
  } catch (error) {
    return null;
  }
};

export const searchSuggestions = async (query: string): Promise<any> => {
  try {
    const response = await apiService.get<any>(
      `/news/articles/search_suggestions/?q=${encodeURIComponent(
        query
      )}&limit=10`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch search suggestions");
  } catch (error) {
    return null;
  }
};

export const postFavouriteCategories = async (
  categoryIDs: string[]
): Promise<any> => {
  try {
    const response = await apiService.post<any>(
      `/news/profiles/update_categories/`,
      {
        category_ids: categoryIDs,
      }
    );
    console.log(response);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch related news");
  } catch (error) {
    return null;
  }
};

export const getRelatedArticles = async (
  articleID: number | string
): Promise<any> => {
  try {
    const response = await apiService.get<any>(
      `/news/articles/${articleID}/related/`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch related news");
  } catch (error) {
    return null;
  }
};

export const getArticleDetails = async (articleID: number): Promise<any> => {
  try {
    const response = await apiService.post<any>(
      `/news/articles/${articleID}/view/`
    );
    if (response.success && response.data) {
      return response.data.article;
    }
    throw new Error(response.message || "Failed to fetch listing details");
  } catch (error) {}
};

export const getArticleDetailsBatch = async (
  articleIDs: number | string[]
): Promise<any> => {
  try {
    const response = await apiService.post<any>(`/news/articles/batch/`, {
      article_ids: articleIDs,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(
      response.message || "Failed to fetch listing batch details"
    );
  } catch (error) {}
};

export const getArticleComments = async (articleID: number): Promise<any> => {
  try {
    const response = await apiService.get<any>(
      `/news/articles/${articleID}/comments/`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch listing comments");
  } catch (error) {}
};

export const postComment = async (
  articleID: number,
  comment_content: string
): Promise<any> => {
  try {
    const response = await apiService.post<any>(`/news/comments/`, {
      article: articleID,
      content: comment_content,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch listing comments");
  } catch (error) {}
};

export const replyComment = async (
  commentID: number,
  comment_content: string
): Promise<any> => {
  try {
    const response = await apiService.post<any>(
      `/news/comments/${commentID}/reply/`,
      {
        content: comment_content,
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch listing comments");
  } catch (error) {}
};

export const deleteComment = async (commentID: number): Promise<any> => {
  try {
    const response = await apiService.delete<any>(
      `/news/comments/${commentID}/`
    );
    return response;
  } catch (error) {
    throw new Error("Failed to delete comments");
  }
};

export const postNotificationToken = async (
  token: string,
  deviceId: string,
  platform: string
): Promise<any> => {
  try {
    const response = await apiService.post<any>(`/api/v1/push-tokens/`, {
      token: token,
      device_id: deviceId,
      platform: platform,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to fetch news sources");
  } catch (error) {
    return null;
  }
};
