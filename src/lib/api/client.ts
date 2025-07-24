type ApiError = {
  error: string;
  status?: number;
};

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(`${window.location.origin}${this.baseUrl}${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(`${key}[]`, v));
        } else if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;

    const url = this.buildUrl(path, params);
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          error: data.error || 'Request failed',
          status: response.status,
        };
      }

      return data;
    } catch (error: unknown) {
      if (error.error) {
        throw error;
      }
      throw {
        error: error.message || 'Network error',
        status: 0,
      };
    }
  }

  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body });
  }

  put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body });
  }
}

// Create API client instance
export const api = new ApiClient();

// Specific API endpoints
export const recipesApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    cuisineTypes?: string[];
    mealTypes?: string[];
    difficulty?: string[];
    maxTime?: number;
    tags?: string[];
    userOnly?: boolean;
  }) => api.get<{
    recipes: any[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }>('/recipes', params),

  get: (id: string) => api.get<any>(`/recipes/${id}`),
  
  create: (recipe: any) => api.post<any>('/recipes', recipe),
  
  update: (id: string, recipe: any) => api.put<any>(`/recipes/${id}`, recipe),
  
  delete: (id: string) => api.delete<{ success: boolean }>(`/recipes/${id}`),
  
  rate: (id: string, rating: number) => 
    api.post<any>(`/recipes/${id}/rate`, { rating }),
    
  favorite: (id: string) => 
    api.post<any>(`/recipes/${id}/favorite`, {}),
    
  unfavorite: (id: string) => 
    api.delete<any>(`/recipes/${id}/favorite`),
};

export const mealPlansApi = {
  list: () => api.get<any[]>('/meal-plans'),
  
  get: (id: string) => api.get<any>(`/meal-plans/${id}`),
  
  create: (mealPlan: {
    name: string;
    start_date: string;
    end_date: string;
    notes?: string;
  }) => api.post<any>('/meal-plans', mealPlan),
  
  update: (id: string, updates: any) => 
    api.put<any>(`/meal-plans/${id}`, updates),
    
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/meal-plans/${id}`),
    
  addRecipe: (id: string, recipe: {
    recipe_id: string;
    date: string;
    meal_type: string;
    servings?: number;
    notes?: string;
  }) => api.post<any>(`/meal-plans/${id}/recipes`, recipe),
  
  removeRecipe: (id: string, recipeId: string, date: string, mealType: string) =>
    api.delete<any>(`/meal-plans/${id}/recipes/${recipeId}?date=${date}&meal_type=${mealType}`),
    
  generateShoppingList: (id: string) => 
    api.post<any>(`/meal-plans/${id}/shopping-list`, {}),
};

export const pantryApi = {
  list: () => api.get<any[]>('/pantry'),
  
  add: (item: any) => api.post<any>('/pantry', item),
  
  update: (id: string, updates: any) => 
    api.put<any>(`/pantry/${id}`, updates),
    
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/pantry/${id}`),
    
  updateStock: (id: string, quantity: number) =>
    api.patch<any>(`/pantry/${id}/stock`, { quantity }),
    
  bulkAdd: (items: any[]) => 
    api.post<any[]>('/pantry/bulk', { items }),
};

export const shoppingApi = {
  lists: () => api.get<any[]>('/shopping'),
  
  activeList: () => api.get<any>('/shopping/active'),
  
  createList: (name: string, mealPlanId?: string) => 
    api.post<any>('/shopping', { name, meal_plan_id: mealPlanId }),
    
  updateList: (id: string, updates: any) => 
    api.put<any>(`/shopping/${id}`, updates),
    
  deleteList: (id: string) => 
    api.delete<{ success: boolean }>(`/shopping/${id}`),
    
  setActive: (id: string) => 
    api.post<any>(`/shopping/${id}/activate`, {}),
    
  addItem: (listId: string, item: any) => 
    api.post<any>(`/shopping/${listId}/items`, item),
    
  updateItem: (listId: string, itemId: string, updates: any) =>
    api.put<any>(`/shopping/${listId}/items/${itemId}`, updates),
    
  deleteItem: (listId: string, itemId: string) =>
    api.delete<{ success: boolean }>(`/shopping/${listId}/items/${itemId}`),
    
  toggleItem: (listId: string, itemId: string) =>
    api.post<any>(`/shopping/${listId}/items/${itemId}/toggle`, {}),
    
  clearChecked: (listId: string) =>
    api.delete<{ success: boolean }>(`/shopping/${listId}/checked`),
};