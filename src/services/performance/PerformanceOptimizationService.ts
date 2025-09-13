/**
 * Performance Optimization Service
 * 
 * Advanced performance optimization system with caching, request batching,
 * response streaming optimization, and performance monitoring for the
 * AML-KYC advisory system.
 */

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'fifo' | 'ttl';
  enabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface BatchRequest {
  id: string;
  requests: RequestItem[];
  maxWaitTime: number;
  maxBatchSize: number;
  callback: (results: BatchResult[]) => void;
  timestamp: number;
}

export interface RequestItem {
  id: string;
  type: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface BatchResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  batchEfficiency: number;
  memoryUsage: number;
  requestThroughput: number;
  errorRate: number;
  uptime: number;
}

export interface OptimizationConfig {
  cache: CacheConfig;
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    maxWaitTime: number;
    priorityThreshold: number;
  };
  streaming: {
    chunkSize: number;
    compressionEnabled: boolean;
    adaptiveChunking: boolean;
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number;
    metricsRetention: number;
  };
}

export class PerformanceOptimizationService {
  private cache: Map<string, CacheEntry> = new Map();
  private batchQueues: Map<string, BatchRequest[]> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private isInitialized: boolean = false;
  private startTime: number = Date.now();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = this.getDefaultConfig(config);
    this.performanceMetrics = this.initializeMetrics();
  }

  /**
   * Initialize the performance optimization service
   */
  async initialize(): Promise<void> {
    try {
      // Start cache cleanup interval
      this.startCacheCleanup();
      
      // Start batch processing
      this.startBatchProcessing();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('PerformanceOptimizationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PerformanceOptimizationService:', error);
      throw error;
    }
  }

  /**
   * Cache operations
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.cache.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      this.updateMetrics('cache_miss');
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateMetrics('cache_miss');
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateMetrics('cache_hit');
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.cache.enabled) return;

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.cache.ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // Check cache size limit
    if (this.cache.size >= this.config.cache.maxSize) {
      this.evictEntry();
    }

    this.cache.set(key, entry);
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Batch processing operations
   */
  async addToBatch(
    batchType: string,
    request: RequestItem,
    callback: (result: BatchResult) => void
  ): Promise<void> {
    if (!this.config.batching.enabled) {
      // Process immediately if batching is disabled
      this.processRequest(request, callback);
      return;
    }

    let batchQueue = this.batchQueues.get(batchType);
    if (!batchQueue) {
      batchQueue = [];
      this.batchQueues.set(batchType, batchQueue);
    }

    // Find existing batch or create new one
    let batch = batchQueue.find(b => 
      b.requests.length < this.config.batching.maxBatchSize &&
      Date.now() - b.timestamp < this.config.batching.maxWaitTime
    );

    if (!batch) {
      batch = {
        id: this.generateBatchId(),
        requests: [],
        maxWaitTime: this.config.batching.maxWaitTime,
        maxBatchSize: this.config.batching.maxBatchSize,
        callback: (results) => {
          results.forEach((result, index) => {
            const request = batch.requests[index];
            // Find the callback for this specific request
            // This is a simplified implementation
          });
        },
        timestamp: Date.now()
      };
      batchQueue.push(batch);
    }

    batch.requests.push(request);

    // Process batch if it's full or high priority
    if (batch.requests.length >= this.config.batching.maxBatchSize ||
        request.priority === 'high') {
      await this.processBatch(batchType, batch);
    }
  }

  /**
   * Streaming optimization
   */
  optimizeStreamingChunks(data: any[], chunkSize?: number): any[][] {
    const size = chunkSize || this.config.streaming.chunkSize;
    const chunks: any[][] = [];

    for (let i = 0; i < data.length; i += size) {
      chunks.push(data.slice(i, i + size));
    }

    return chunks;
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    const totalEntries = this.cache.size;
    const totalAccesses = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccesses > 0 ? 
      Array.from(this.cache.values()).filter(entry => entry.accessCount > 1).length / totalEntries : 0;

    return {
      totalEntries,
      totalAccesses,
      hitRate,
      memoryUsage: this.estimateCacheMemoryUsage(),
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  /**
   * Optimize query for better performance
   */
  optimizeQuery(query: string, context: any): { optimizedQuery: string; cacheKey: string } {
    // Remove unnecessary whitespace and normalize
    const optimizedQuery = query.trim().replace(/\s+/g, ' ');
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(optimizedQuery, context);
    
    return { optimizedQuery, cacheKey };
  }

  /**
   * Preload frequently accessed data
   */
  async preloadData(keys: string[]): Promise<void> {
    const preloadPromises = keys.map(async (key) => {
      // In a real implementation, this would fetch data from the backend
      // For now, we'll just ensure the cache is ready
      if (!this.cache.has(key)) {
        console.log(`Preloading data for key: ${key}`);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized && 
             this.cache.size < this.config.cache.maxSize * 1.1 && // Allow 10% overage
             this.performanceMetrics.errorRate < 0.1; // Less than 10% error rate
    } catch (error) {
      console.error('PerformanceOptimizationService health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    this.cache.clear();
    this.batchQueues.clear();
    this.isInitialized = false;
  }

  /**
   * Private methods
   */
  private getDefaultConfig(overrides?: Partial<OptimizationConfig>): OptimizationConfig {
    return {
      cache: {
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        strategy: 'lru',
        enabled: true
      },
      batching: {
        enabled: true,
        maxBatchSize: 10,
        maxWaitTime: 1000, // 1 second
        priorityThreshold: 0.8
      },
      streaming: {
        chunkSize: 1024,
        compressionEnabled: true,
        adaptiveChunking: true
      },
      monitoring: {
        enabled: true,
        sampleRate: 0.1, // 10% sampling
        metricsRetention: 3600000 // 1 hour
      },
      ...overrides
    };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cacheHitRate: 0,
      averageResponseTime: 0,
      batchEfficiency: 0,
      memoryUsage: 0,
      requestThroughput: 0,
      errorRate: 0,
      uptime: 0
    };
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  private startBatchProcessing(): void {
    setInterval(() => {
      this.processPendingBatches();
    }, 100); // Check for batches every 100ms
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // Update metrics every 5 seconds
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private evictEntry(): void {
    switch (this.config.cache.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictFIFO(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private evictTTL(): void {
    let expiringKey = '';
    let shortestTTL = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const remainingTTL = entry.ttl - (Date.now() - entry.timestamp);
      if (remainingTTL < shortestTTL) {
        shortestTTL = remainingTTL;
        expiringKey = key;
      }
    }

    if (expiringKey) {
      this.cache.delete(expiringKey);
    }
  }

  private async processPendingBatches(): Promise<void> {
    for (const [batchType, batches] of this.batchQueues.entries()) {
      const now = Date.now();
      const readyBatches = batches.filter(batch => 
        batch.requests.length >= this.config.batching.maxBatchSize ||
        now - batch.timestamp >= this.config.batching.maxWaitTime
      );

      for (const batch of readyBatches) {
        await this.processBatch(batchType, batch);
        const index = batches.indexOf(batch);
        if (index > -1) {
          batches.splice(index, 1);
        }
      }
    }
  }

  private async processBatch(batchType: string, batch: BatchRequest): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Process all requests in the batch
      const results = await Promise.all(
        batch.requests.map(request => this.processRequestItem(request))
      );

      const processingTime = Date.now() - startTime;
      this.updateMetrics('batch_processed', { processingTime, batchSize: batch.requests.length });

      // Call the batch callback
      batch.callback(results);
    } catch (error) {
      console.error('Batch processing failed:', error);
      this.updateMetrics('batch_error');
    }
  }

  private async processRequestItem(request: RequestItem): Promise<BatchResult> {
    const startTime = Date.now();
    
    try {
      // Simulate request processing
      const result = await this.simulateRequestProcessing(request);
      
      return {
        id: request.id,
        success: true,
        data: result,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  private async simulateRequestProcessing(request: RequestItem): Promise<any> {
    // Simulate processing time based on priority
    const delay = request.priority === 'high' ? 10 : 
                  request.priority === 'medium' ? 50 : 100;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return { processed: true, requestId: request.id };
  }

  private async processRequest(request: RequestItem, callback: (result: BatchResult) => void): Promise<void> {
    const result = await this.processRequestItem(request);
    callback(result);
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.uptime = Date.now() - this.startTime;
    this.performanceMetrics.memoryUsage = this.estimateCacheMemoryUsage();
    
    // Update other metrics based on collected data
    // This would be more sophisticated in a real implementation
  }

  private updateMetrics(type: string, data?: any): void {
    // Update metrics based on the event type
    // This would be more sophisticated in a real implementation
    console.log(`Performance metric: ${type}`, data);
  }

  private estimateCacheMemoryUsage(): number {
    // Rough estimate of memory usage
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // Unicode characters
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 100; // Overhead for the entry object
    }
    return totalSize;
  }

  private getOldestEntry(): number {
    let oldest = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return oldest;
  }

  private getNewestEntry(): number {
    let newest = 0;
    for (const entry of this.cache.values()) {
      if (entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }
    return newest;
  }

  private generateCacheKey(query: string, context: any): string {
    const contextStr = JSON.stringify(context);
    return `query_${this.hashString(query + contextStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

