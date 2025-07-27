/**
 * Conversation Context Manager
 * Maintains conversation history and context for better command understanding
 */

import { ConversationEntry, VoiceCommand, VoiceContext } from './types';
import { logger } from '@/services/logger';

export class ConversationContextManager {
  private conversationHistory: ConversationEntry[] = [];
  private maxHistorySize = 50;
  private sessionData: Record<string, any> = {};
  private contextTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.startContextCleanup();
  }

  /**
   * Add user command to conversation history
   */
  addUserCommand(command: VoiceCommand): void {
    const entry: ConversationEntry = {
      timestamp: new Date(),
      type: 'user',
      content: command.transcript,
      command,
      metadata: {
        intent: command.intent,
        confidence: command.confidence,
        entity: command.entity,
      }
    };

    this.addEntry(entry);
    this.updateSessionData(command);
  }

  /**
   * Add assistant response to conversation history
   */
  addAssistantResponse(content: string, metadata?: Record<string, any>): void {
    const entry: ConversationEntry = {
      timestamp: new Date(),
      type: 'assistant',
      content,
      metadata
    };

    this.addEntry(entry);
  }

  /**
   * Get current conversation context
   */
  getContext(): VoiceContext {
    const recentCommands = this.getRecentCommands(5);
    const currentScreen = this.sessionData.currentScreen || 'unknown';
    const userPreferences = this.sessionData.userPreferences || {};

    return {
      currentScreen,
      previousCommands: recentCommands,
      userPreferences,
      sessionData: { ...this.sessionData }
    };
  }

  /**
   * Get recent commands
   */
  getRecentCommands(count: number): VoiceCommand[] {
    return this.conversationHistory
      .filter(entry => entry.type === 'user' && entry.command)
      .slice(-count)
      .map(entry => entry.command!);
  }

  /**
   * Get conversation history
   */
  getHistory(limit?: number): ConversationEntry[] {
    if (limit) {
      return this.conversationHistory.slice(-limit);
    }
    return [...this.conversationHistory];
  }

  /**
   * Update session data
   */
  updateSessionData(data: Partial<VoiceCommand> | Record<string, any>): void {
    // Extract relevant session data from commands
    if ('intent' in data && data.intent === 'navigate' && data.entity) {
      this.sessionData.currentScreen = data.entity;
    }

    // Store other relevant data
    const relevantData = {
      lastCommandTime: new Date().toISOString(),
      lastIntent: data.intent,
      ...data
    };

    this.sessionData = {
      ...this.sessionData,
      ...relevantData
    };
  }

  /**
   * Set current screen/context
   */
  setCurrentScreen(screen: string): void {
    this.sessionData.currentScreen = screen;
  }

  /**
   * Set user preferences
   */
  setUserPreferences(preferences: Record<string, any>): void {
    this.sessionData.userPreferences = {
      ...this.sessionData.userPreferences,
      ...preferences
    };
  }

  /**
   * Get related context for a specific intent
   */
  getRelatedContext(intent: string): any {
    const relatedCommands = this.conversationHistory
      .filter(entry => 
        entry.type === 'user' && 
        entry.command?.intent === intent
      )
      .slice(-3);

    return {
      previousSimilarCommands: relatedCommands.map(e => e.command),
      frequency: relatedCommands.length,
      lastUsed: relatedCommands[relatedCommands.length - 1]?.timestamp
    };
  }

  /**
   * Check if user is in a conversation flow
   */
  isInConversationFlow(): boolean {
    if (this.conversationHistory.length < 2) return false;

    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];
    const timeSinceLastEntry = Date.now() - lastEntry.timestamp.getTime();

    // Consider in flow if last interaction was within 30 seconds
    return timeSinceLastEntry < 30000;
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(): {
    totalEntries: number;
    userCommands: number;
    assistantResponses: number;
    intentBreakdown: Record<string, number>;
    averageConfidence: number;
    sessionDuration: number;
  } {
    const userEntries = this.conversationHistory.filter(e => e.type === 'user');
    const assistantEntries = this.conversationHistory.filter(e => e.type === 'assistant');
    
    const intentCounts: Record<string, number> = {};
    let totalConfidence = 0;
    
    userEntries.forEach(entry => {
      if (entry.command) {
        intentCounts[entry.command.intent] = (intentCounts[entry.command.intent] || 0) + 1;
        totalConfidence += entry.command.confidence;
      }
    });

    const firstEntry = this.conversationHistory[0];
    const lastEntry = this.conversationHistory[this.conversationHistory.length - 1];
    const sessionDuration = firstEntry && lastEntry 
      ? lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime()
      : 0;

    return {
      totalEntries: this.conversationHistory.length,
      userCommands: userEntries.length,
      assistantResponses: assistantEntries.length,
      intentBreakdown: intentCounts,
      averageConfidence: userEntries.length > 0 ? totalConfidence / userEntries.length : 0,
      sessionDuration
    };
  }

  /**
   * Clear conversation history
   */
  clear(): void {
    this.conversationHistory = [];
    this.sessionData = {};
  }

  /**
   * Clear old entries
   */
  clearOldEntries(): void {
    const cutoffTime = Date.now() - this.contextTimeout;
    this.conversationHistory = this.conversationHistory.filter(
      entry => entry.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Add entry to history
   */
  private addEntry(entry: ConversationEntry): void {
    this.conversationHistory.push(entry);
    
    // Maintain size limit
    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Start periodic cleanup
   */
  private startContextCleanup(): void {
    setInterval(() => {
      this.clearOldEntries();
    }, 60000); // Check every minute
  }

  /**
   * Export conversation history
   */
  exportHistory(): string {
    return JSON.stringify(this.conversationHistory, null, 2);
  }

  /**
   * Import conversation history
   */
  importHistory(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        this.conversationHistory = data.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error: unknown) {
      logger.error('Failed to import conversation history:', 'ConversationContextManager', error);
    }
  }
}