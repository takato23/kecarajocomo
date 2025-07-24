/**
 * Offline Manager
 * Handles queuing operations when offline
 */

import { OfflineQueue, QueuedOperation } from './types';

export class OfflineManager {
  private queue: OfflineQueue = {
    operations: [],
    retryCount: new Map(),
  };
  private maxRetries = 3;
  private storageKey = 'kcc_offline_queue';

  constructor() {
    this.loadQueue();
  }

  async queue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date(),
      retries: 0,
    };

    this.queue.operations.push(queuedOp);
    this.saveQueue();
  }

  async remove(id: string): Promise<void> {
    this.queue.operations = this.queue.operations.filter(op => op.id !== id);
    this.queue.retryCount.delete(id);
    this.saveQueue();
  }

  async incrementRetry(id: string): Promise<boolean> {
    const retries = (this.queue.retryCount.get(id) || 0) + 1;
    this.queue.retryCount.set(id, retries);
    
    const operation = this.queue.operations.find(op => op.id === id);
    if (operation) {
      operation.retries = retries;
    }

    this.saveQueue();

    // Return false if max retries exceeded
    return retries < this.maxRetries;
  }

  getQueue(): OfflineQueue {
    return {
      operations: [...this.queue.operations],
      retryCount: new Map(this.queue.retryCount),
    };
  }

  getQueueSize(): number {
    return this.queue.operations.length;
  }

  clearQueue(): void {
    this.queue = {
      operations: [],
      retryCount: new Map(),
    };
    this.saveQueue();
  }

  private loadQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue.operations = parsed.operations.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        }));
        this.queue.retryCount = new Map(parsed.retryCount);
      }
    } catch (error: unknown) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const toStore = {
        operations: this.queue.operations,
        retryCount: Array.from(this.queue.retryCount.entries()),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
    } catch (error: unknown) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}