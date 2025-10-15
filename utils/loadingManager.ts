/**
 * Loading Manager for ReRide
 * 
 * This utility helps manage loading states and prevents infinite loading
 * by providing timeouts and fallback mechanisms.
 */

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export class LoadingManager {
  private static instance: LoadingManager;
  private loadingStates: Map<string, LoadingState> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Default timeout for loading operations (in milliseconds)
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  
  private constructor() {}
  
  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }
  
  /**
   * Start loading for a specific operation
   */
  startLoading(operationId: string, timeout: number = this.DEFAULT_TIMEOUT): void {
    this.loadingStates.set(operationId, {
      isLoading: true,
      error: null,
      progress: 0
    });
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      this.failLoading(operationId, `Operation ${operationId} timed out after ${timeout}ms`);
    }, timeout);
    
    this.timeouts.set(operationId, timeoutId);
  }
  
  /**
   * Update loading progress
   */
  updateProgress(operationId: string, progress: number): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      state.progress = Math.min(100, Math.max(0, progress));
    }
  }
  
  /**
   * Complete loading successfully
   */
  completeLoading(operationId: string): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      state.isLoading = false;
      state.progress = 100;
      state.error = null;
    }
    
    this.clearTimeout(operationId);
  }
  
  /**
   * Fail loading with error
   */
  failLoading(operationId: string, error: string): void {
    const state = this.loadingStates.get(operationId);
    if (state) {
      state.isLoading = false;
      state.error = error;
    }
    
    this.clearTimeout(operationId);
  }
  
  /**
   * Get current loading state
   */
  getLoadingState(operationId: string): LoadingState | null {
    return this.loadingStates.get(operationId) || null;
  }
  
  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(state => state.isLoading);
  }
  
  /**
   * Get all loading states
   */
  getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.loadingStates);
  }
  
  /**
   * Clear loading state
   */
  clearLoading(operationId: string): void {
    this.loadingStates.delete(operationId);
    this.clearTimeout(operationId);
  }
  
  /**
   * Clear all loading states
   */
  clearAllLoading(): void {
    this.loadingStates.clear();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
  
  /**
   * Clear timeout for operation
   */
  private clearTimeout(operationId: string): void {
    const timeoutId = this.timeouts.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(operationId);
    }
  }
}

// Export singleton instance
export const loadingManager = LoadingManager.getInstance();

// Predefined operation IDs
export const LOADING_OPERATIONS = {
  INITIAL_DATA: 'initial-data',
  VEHICLES: 'vehicles',
  USERS: 'users',
  VEHICLE_DATA: 'vehicle-data',
  RECOMMENDATIONS: 'recommendations',
  AUTH: 'auth'
} as const;

// Helper function to create a loading promise with timeout
export function withLoadingTimeout<T>(
  operationId: string,
  promise: Promise<T>,
  timeout: number = 10000
): Promise<T> {
  const manager = LoadingManager.getInstance();
  
  return new Promise((resolve, reject) => {
    manager.startLoading(operationId, timeout);
    
    promise
      .then(result => {
        manager.completeLoading(operationId);
        resolve(result);
      })
      .catch(error => {
        manager.failLoading(operationId, error.message || 'Unknown error');
        reject(error);
      });
  });
}
