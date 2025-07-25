/**
 * Offline Queue Manager
 * Handles queuing of failed operations when offline and processes them when back online
 */

export type QueuedItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueuedItem {
  /** Unique identifier for the item */
  id: string;
  /** Queue key/category */
  key: string;
  /** Item data */
  data: any;
  /** Current status */
  status: QueuedItemStatus;
  /** Number of attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Timestamp when created */
  createdAt: number;
  /** Timestamp of last attempt */
  lastAttempt: number;
  /** Error from last attempt */
  lastError?: string;
  /** Priority (higher = processed first) */
  priority: number;
}

export interface QueueProcessor {
  /** Process a queued item */
  process: (item: QueuedItem) => Promise<void>;
  /** Optional: validate if item is still relevant */
  validate?: (item: QueuedItem) => boolean;
  /** Optional: transform item data before processing */
  transform?: (item: QueuedItem) => QueuedItem;
}

export interface QueueConfig {
  /** Storage key prefix */
  storagePrefix: string;
  /** Default max attempts */
  defaultMaxAttempts: number;
  /** Retry delay multiplier */
  retryDelayMultiplier: number;
  /** Maximum items in queue */
  maxQueueSize: number;
  /** Auto-process when online */
  autoProcess: boolean;
}

const DEFAULT_CONFIG: QueueConfig = {
  storagePrefix: 'offline_queue',
  defaultMaxAttempts: 3,
  retryDelayMultiplier: 1.5,
  maxQueueSize: 100,
  autoProcess: true
};

/**
 * Manages offline operations queue with persistent storage
 */
export class OfflineQueue {
  private config: QueueConfig;
  private processors: Map<string, QueueProcessor> = new Map();
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Auto-process when coming online if enabled
    if (this.config.autoProcess && typeof window !== 'undefined') {
      window.addEventListener('online', this.processQueue.bind(this));
    }
  }

  /**
   * Add item to queue
   */
  async enqueue(
    key: string,
    data: any,
    options: {
      priority?: number;
      maxAttempts?: number;
      id?: string;
    } = {}
  ): Promise<string> {
    const item: QueuedItem = {
      id: options.id || this.generateId(),
      key,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.defaultMaxAttempts,
      createdAt: Date.now(),
      lastAttempt: 0,
      priority: options.priority || 0
    };

    // Get current queue
    const queue = await this.getQueue();
    
    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      // Remove oldest completed or failed items
      const activeItems = queue.filter(item => 
        item.status === 'pending' || item.status === 'processing'
      );
      
      if (activeItems.length >= this.config.maxQueueSize) {
        throw new Error('Queue is full');
      }
      
      // Keep only active items and most recent completed/failed
      const inactiveItems = queue
        .filter(item => item.status === 'completed' || item.status === 'failed')
        .sort((a, b) => b.lastAttempt - a.lastAttempt)
        .slice(0, Math.max(0, this.config.maxQueueSize - activeItems.length - 1));
      
      queue.splice(0, queue.length, ...activeItems, ...inactiveItems);
    }

    // Add new item
    queue.push(item);
    
    // Sort by priority (higher first), then by creation time (older first)
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });

    // Save updated queue
    await this.saveQueue(queue);
    
    return item.id;
  }

  /**
   * Register a processor for a specific key pattern
   */
  registerProcessor(keyPattern: string, processor: QueueProcessor): void {
    this.processors.set(keyPattern, processor);
  }

  /**
   * Process all pending items in the queue
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return this.processingPromise || Promise.resolve();
    }

    this.isProcessing = true;
    this.processingPromise = this.doProcessQueue();
    
    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  /**
   * Internal queue processing logic
   */
  private async doProcessQueue(): Promise<void> {
    const queue = await this.getQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) {
      return;
    }

    // Process items sequentially to avoid overwhelming the system
    for (const item of pendingItems) {
      try {
        await this.processItem(item);
      } catch (error) {
        console.error('Error processing queue item:', error);
        // Continue with next item
      }
    }

    // Clean up old completed/failed items
    await this.cleanupQueue();
  }

  /**
   * Process a single item
   */
  private async processItem(item: QueuedItem): Promise<void> {
    // Find appropriate processor
    const processor = this.findProcessor(item.key);
    if (!processor) {
      console.warn(`No processor found for queue item with key: ${item.key}`);
      await this.updateItemStatus(item.id, 'failed', 'No processor found');
      return;
    }

    // Validate item if validator exists
    if (processor.validate && !processor.validate(item)) {
      // Queue item is no longer valid, removing
      await this.removeItem(item.id);
      return;
    }

    // Transform item if transformer exists
    let processItem = item;
    if (processor.transform) {
      processItem = processor.transform(item);
    }

    // Update status to processing
    await this.updateItemStatus(item.id, 'processing');
    
    try {
      // Process the item
      await processor.process(processItem);
      
      // Mark as completed
      await this.updateItemStatus(item.id, 'completed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing queue item ${item.id}:`, error);
      
      // Update attempts
      item.attempts++;
      item.lastAttempt = Date.now();
      item.lastError = errorMessage;
      
      if (item.attempts >= item.maxAttempts) {
        // Max attempts reached
        await this.updateItemStatus(item.id, 'failed', errorMessage);
      } else {
        // Reset to pending for retry
        await this.updateItemStatus(item.id, 'pending', errorMessage);
      }
    }
  }

  /**
   * Find processor for a given key
   */
  private findProcessor(key: string): QueueProcessor | undefined {
    // Try exact match first
    if (this.processors.has(key)) {
      return this.processors.get(key);
    }

    // Try pattern matching
    for (const [pattern, processor] of this.processors.entries()) {
      if (this.matchesPattern(key, pattern)) {
        return processor;
      }
    }

    return undefined;
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Simple glob-style pattern matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Get all items from queue
   */
  async getQueue(): Promise<QueuedItem[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const queueData = localStorage.getItem(this.getStorageKey());
      if (!queueData) {
        return [];
      }

      const parsed = JSON.parse(queueData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading queue from storage:', error);
      return [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(queue: QueuedItem[]): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving queue to storage:', error);
      throw error;
    }
  }

  /**
   * Update item status
   */
  private async updateItemStatus(
    itemId: string,
    status: QueuedItemStatus,
    error?: string
  ): Promise<void> {
    const queue = await this.getQueue();
    const item = queue.find(i => i.id === itemId);
    
    if (item) {
      item.status = status;
      item.lastAttempt = Date.now();
      if (error) {
        item.lastError = error;
      }
      
      await this.saveQueue(queue);
    }
  }

  /**
   * Remove item from queue
   */
  async removeItem(itemId: string): Promise<boolean> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      queue.splice(index, 1);
      await this.saveQueue(queue);
      return true;
    }
    
    return false;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    
    return {
      total: queue.length,
      pending: queue.filter(item => item.status === 'pending').length,
      processing: queue.filter(item => item.status === 'processing').length,
      completed: queue.filter(item => item.status === 'completed').length,
      failed: queue.filter(item => item.status === 'failed').length
    };
  }

  /**
   * Check if there are queued items
   */
  async hasQueuedItems(): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.some(item => 
      item.status === 'pending' || item.status === 'processing'
    );
  }

  /**
   * Clear completed and failed items
   */
  async cleanupQueue(): Promise<void> {
    const queue = await this.getQueue();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const activeQueue = queue.filter(item => {
      // Keep pending and processing items
      if (item.status === 'pending' || item.status === 'processing') {
        return true;
      }
      
      // Keep recent completed/failed items
      return item.lastAttempt > cutoffTime;
    });
    
    if (activeQueue.length !== queue.length) {
      await this.saveQueue(activeQueue);
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  /**
   * Get storage key
   */
  private getStorageKey(): string {
    return `${this.config.storagePrefix}_queue`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.processQueue.bind(this));
    }
  }
}

// Default export for convenience
export default OfflineQueue;