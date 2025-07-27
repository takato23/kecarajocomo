/**
 * Voice Analytics Tracker
 * Tracks voice command usage and performance metrics
 */

import { VoiceCommand, VoiceIntent, VoiceAnalytics } from './types';
import { logger } from '@/services/logger';

interface CommandMetrics {
  command: VoiceCommand;
  timestamp: Date;
  executionTime?: number;
  success: boolean;
  errorReason?: string;
}

export class VoiceAnalyticsTracker {
  private commandHistory: CommandMetrics[] = [];
  private sessionStartTime: Date | null = null;
  private maxHistorySize = 1000;

  /**
   * Start analytics session
   */
  startSession(): void {
    this.sessionStartTime = new Date();
  }

  /**
   * End analytics session
   */
  endSession(): void {
    if (!this.sessionStartTime) return;
    
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();

    this.sessionStartTime = null;
  }

  /**
   * Track command execution
   */
  trackCommand(
    command: VoiceCommand, 
    success: boolean = true, 
    executionTime?: number,
    errorReason?: string
  ): void {
    const metrics: CommandMetrics = {
      command,
      timestamp: new Date(),
      executionTime,
      success,
      errorReason
    };

    this.commandHistory.push(metrics);
    
    // Maintain size limit
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift();
    }

    // Log for debugging
    if (!success) {
      logger.error('Voice command failed:', 'VoiceAnalyticsTracker', {
        intent: command.intent,
        transcript: command.transcript,
        error: errorReason
      });
    }
  }

  /**
   * Get analytics summary
   */
  getAnalytics(): VoiceAnalytics {
    const totalCommands = this.commandHistory.length;
    const successfulCommands = this.commandHistory.filter(m => m.success).length;
    const failedCommands = totalCommands - successfulCommands;

    // Calculate average confidence
    const totalConfidence = this.commandHistory.reduce(
      (sum, m) => sum + m.command.confidence, 
      0
    );
    const averageConfidence = totalCommands > 0 
      ? totalConfidence / totalCommands 
      : 0;

    // Count commands by intent
    const commandsByIntent: Record<VoiceIntent, number> = {
      add: 0,
      search: 0,
      navigate: 0,
      action: 0,
      query: 0,
      command: 0,
      timer: 0,
      recipe: 0,
      unknown: 0
    };

    this.commandHistory.forEach(m => {
      commandsByIntent[m.command.intent]++;
    });

    // Get common phrases
    const phraseCounts = new Map<string, number>();
    this.commandHistory.forEach(m => {
      const phrase = m.command.transcript.toLowerCase();
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    });

    const commonPhrases = Array.from(phraseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase, count]) => ({ phrase, count }));

    // Calculate session duration
    const sessionDuration = this.sessionStartTime 
      ? Date.now() - this.sessionStartTime.getTime()
      : 0;

    return {
      totalCommands,
      successfulCommands,
      failedCommands,
      averageConfidence,
      commandsByIntent,
      commonPhrases,
      sessionDuration
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageExecutionTime: number;
    fastestCommand: number;
    slowestCommand: number;
    successRate: number;
    confidenceByIntent: Record<VoiceIntent, number>;
  } {
    const commandsWithTime = this.commandHistory.filter(m => m.executionTime !== undefined);
    
    const averageExecutionTime = commandsWithTime.length > 0
      ? commandsWithTime.reduce((sum, m) => sum + m.executionTime!, 0) / commandsWithTime.length
      : 0;

    const executionTimes = commandsWithTime.map(m => m.executionTime!);
    const fastestCommand = executionTimes.length > 0 ? Math.min(...executionTimes) : 0;
    const slowestCommand = executionTimes.length > 0 ? Math.max(...executionTimes) : 0;

    const successRate = this.commandHistory.length > 0
      ? this.commandHistory.filter(m => m.success).length / this.commandHistory.length
      : 0;

    // Calculate average confidence by intent
    const confidenceByIntent: Record<VoiceIntent, number> = {} as any;
    const intentGroups = this.groupByIntent();
    
    Object.entries(intentGroups).forEach(([intent, commands]) => {
      const totalConfidence = commands.reduce((sum, m) => sum + m.command.confidence, 0);
      confidenceByIntent[intent as VoiceIntent] = commands.length > 0 
        ? totalConfidence / commands.length 
        : 0;
    });

    return {
      averageExecutionTime,
      fastestCommand,
      slowestCommand,
      successRate,
      confidenceByIntent
    };
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis(): {
    totalErrors: number;
    errorsByReason: Record<string, number>;
    errorsByIntent: Record<VoiceIntent, number>;
    recentErrors: Array<{
      timestamp: Date;
      intent: VoiceIntent;
      transcript: string;
      reason: string;
    }>;
  } {
    const errors = this.commandHistory.filter(m => !m.success);
    
    // Count errors by reason
    const errorsByReason: Record<string, number> = {};
    errors.forEach(m => {
      const reason = m.errorReason || 'Unknown';
      errorsByReason[reason] = (errorsByReason[reason] || 0) + 1;
    });

    // Count errors by intent
    const errorsByIntent: Record<VoiceIntent, number> = {} as any;
    errors.forEach(m => {
      errorsByIntent[m.command.intent] = (errorsByIntent[m.command.intent] || 0) + 1;
    });

    // Get recent errors
    const recentErrors = errors
      .slice(-10)
      .map(m => ({
        timestamp: m.timestamp,
        intent: m.command.intent,
        transcript: m.command.transcript,
        reason: m.errorReason || 'Unknown'
      }));

    return {
      totalErrors: errors.length,
      errorsByReason,
      errorsByIntent,
      recentErrors
    };
  }

  /**
   * Get trends over time
   */
  getTrends(intervalMinutes: number = 5): {
    commandsOverTime: Array<{ time: Date; count: number }>;
    successRateOverTime: Array<{ time: Date; rate: number }>;
    confidenceOverTime: Array<{ time: Date; confidence: number }>;
  } {
    if (this.commandHistory.length === 0) {
      return {
        commandsOverTime: [],
        successRateOverTime: [],
        confidenceOverTime: []
      };
    }

    const intervals = this.groupByTimeInterval(intervalMinutes);
    
    const commandsOverTime = intervals.map(interval => ({
      time: interval.startTime,
      count: interval.commands.length
    }));

    const successRateOverTime = intervals.map(interval => {
      const successful = interval.commands.filter(m => m.success).length;
      const rate = interval.commands.length > 0 
        ? successful / interval.commands.length 
        : 0;
      return { time: interval.startTime, rate };
    });

    const confidenceOverTime = intervals.map(interval => {
      const totalConfidence = interval.commands.reduce(
        (sum, m) => sum + m.command.confidence, 
        0
      );
      const confidence = interval.commands.length > 0 
        ? totalConfidence / interval.commands.length 
        : 0;
      return { time: interval.startTime, confidence };
    });

    return {
      commandsOverTime,
      successRateOverTime,
      confidenceOverTime
    };
  }

  /**
   * Group commands by intent
   */
  private groupByIntent(): Record<string, CommandMetrics[]> {
    const groups: Record<string, CommandMetrics[]> = {};
    
    this.commandHistory.forEach(metrics => {
      const intent = metrics.command.intent;
      if (!groups[intent]) {
        groups[intent] = [];
      }
      groups[intent].push(metrics);
    });

    return groups;
  }

  /**
   * Group commands by time interval
   */
  private groupByTimeInterval(intervalMinutes: number): Array<{
    startTime: Date;
    commands: CommandMetrics[];
  }> {
    if (this.commandHistory.length === 0) return [];

    const intervals: Array<{ startTime: Date; commands: CommandMetrics[] }> = [];
    const intervalMs = intervalMinutes * 60 * 1000;

    const firstTime = this.commandHistory[0].timestamp.getTime();
    const lastTime = this.commandHistory[this.commandHistory.length - 1].timestamp.getTime();

    for (let time = firstTime; time <= lastTime; time += intervalMs) {
      const startTime = new Date(time);
      const endTime = new Date(time + intervalMs);
      
      const commands = this.commandHistory.filter(
        m => m.timestamp >= startTime && m.timestamp < endTime
      );

      if (commands.length > 0) {
        intervals.push({ startTime, commands });
      }
    }

    return intervals;
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify({
      analytics: this.getAnalytics(),
      performance: this.getPerformanceMetrics(),
      errors: this.getErrorAnalysis(),
      history: this.commandHistory
    }, null, 2);
  }

  /**
   * Reset analytics
   */
  reset(): void {
    this.commandHistory = [];
    this.sessionStartTime = null;
  }
}