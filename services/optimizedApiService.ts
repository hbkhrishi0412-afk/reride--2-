// Optimized API Service with advanced caching and performance features

interface CacheConfig {
  ttl: number;
  maxSize: number;
  staleWhileRevalidate: boolean;
}

interface RequestConfig {
  cache?: boolean;
  cacheKey?: string;
  ttl?: number;
  retries?: number;
  timeout?: number;
}

class OptimizedAPIService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    staleWhileRevalidate: true
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  // Enhanced fetch with caching, retries, and timeout
  async fetch<T>(
    url: string, 
    options: RequestInit = {}, 
    requestConfig: RequestConfig = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheKey = url,
      ttl = this.defaultConfig.ttl,
      retries = 3,
      timeout = 10000
    } = requestConfig;

    // Check cache first
    if (cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestPromise = this.executeRequest<T>(
      url, 
      { ...options, signal: controller.signal }, 
      retries
    ).finally(() => {
      clearTimeout(timeoutId);
      this.pendingRequests.delete(cacheKey);
    });

    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      if (cache) {
        this.setCache(cacheKey, result, ttl);
      }
      
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  private async executeRequest<T>(
    url: string, 
    options: RequestInit, 
    retries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (i < retries) {
          // Exponential backoff
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // Cache management
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.defaultConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Batch requests
  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(request => request()));
  }

  // Preload resources
  preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
  }

  // Prefetch next page resources
  prefetchPage(url: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      maxSize: this.defaultConfig.maxSize
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const apiService = new OptimizedAPIService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true
});

// Cleanup expired entries every 5 minutes
setInterval(() => {
  apiService.cleanup();
}, 5 * 60 * 1000);

// Enhanced vehicle service
export const optimizedVehicleService = {
  async getVehicles(): Promise<any[]> {
    return apiService.fetch('/api/vehicles', {
      method: 'GET'
    }, {
      cache: true,
      cacheKey: 'vehicles',
      ttl: 2 * 60 * 1000 // 2 minutes
    });
  },

  async getVehicle(id: number): Promise<any> {
    return apiService.fetch(`/api/vehicles/${id}`, {
      method: 'GET'
    }, {
      cache: true,
      cacheKey: `vehicle-${id}`,
      ttl: 5 * 60 * 1000 // 5 minutes
    });
  },

  async addVehicle(vehicle: any): Promise<any> {
    const result = await apiService.fetch('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle)
    }, {
      cache: false
    });
    
    // Invalidate cache
    apiService.clearCache();
    
    return result;
  },

  async updateVehicle(vehicle: any): Promise<any> {
    const result = await apiService.fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle)
    }, {
      cache: false
    });
    
    // Invalidate cache
    apiService.clearCache();
    
    return result;
  },

  async deleteVehicle(id: number): Promise<void> {
    await apiService.fetch(`/api/vehicles/${id}`, {
      method: 'DELETE'
    }, {
      cache: false
    });
    
    // Invalidate cache
    apiService.clearCache();
  }
};

// Enhanced user service
export const optimizedUserService = {
  async getUsers(): Promise<any[]> {
    return apiService.fetch('/api/users', {
      method: 'GET'
    }, {
      cache: true,
      cacheKey: 'users',
      ttl: 5 * 60 * 1000 // 5 minutes
    });
  },

  async getUser(email: string): Promise<any> {
    return apiService.fetch(`/api/users/${email}`, {
      method: 'GET'
    }, {
      cache: true,
      cacheKey: `user-${email}`,
      ttl: 10 * 60 * 1000 // 10 minutes
    });
  },

  async updateUser(user: any): Promise<any> {
    const result = await apiService.fetch(`/api/users/${user.email}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    }, {
      cache: false
    });
    
    // Invalidate cache
    apiService.clearCache();
    
    return result;
  }
};

export default apiService;