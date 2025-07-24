/**
 * Wake Word Detection Service
 * Detects wake words to activate voice commands
 */

import { WakeWordConfig, VoiceServiceConfig } from './types';

export class WakeWordDetectionService {
  private config: Required<VoiceServiceConfig>;
  private wakeWordConfig: WakeWordConfig;
  private detectionHistory: Array<{ phrase: string; timestamp: Date; detected: boolean }> = [];
  private lastDetectionTime: Date | null = null;
  private cooldownPeriod = 2000; // 2 seconds cooldown between detections

  constructor(config: Required<VoiceServiceConfig>) {
    this.config = config;
    this.wakeWordConfig = this.getDefaultWakeWordConfig();
  }

  private getDefaultWakeWordConfig(): WakeWordConfig {
    const isSpanish = this.config.language.startsWith('es');
    
    return {
      phrases: isSpanish 
        ? ['oye chef', 'hey chef', 'chef', 'oye cocina', 'ayúdame', 'escucha']
        : ['hey chef', 'chef', 'hey kitchen', 'help me', 'listen'],
      sensitivity: 0.7,
      requireExactMatch: false,
      language: this.config.language
    };
  }

  /**
   * Detect wake word in transcript
   */
  detect(transcript: string): boolean {
    if (!this.config.enableWakeWord) return false;

    // Check cooldown
    if (this.isInCooldown()) {
      return false;
    }

    const normalizedTranscript = this.normalizeText(transcript);
    let detected = false;

    // Check each wake word phrase
    for (const phrase of this.wakeWordConfig.phrases) {
      const normalizedPhrase = this.normalizeText(phrase);
      
      if (this.wakeWordConfig.requireExactMatch) {
        if (normalizedTranscript === normalizedPhrase) {
          detected = true;
          break;
        }
      } else {
        // Fuzzy matching
        if (this.fuzzyMatch(normalizedTranscript, normalizedPhrase)) {
          detected = true;
          break;
        }
      }
    }

    // Record detection attempt
    this.recordDetection(transcript, detected);

    if (detected) {
      this.lastDetectionTime = new Date();
    }

    return detected;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Fuzzy match with sensitivity threshold
   */
  private fuzzyMatch(text: string, phrase: string): boolean {
    // Check if phrase is at the beginning of text
    if (text.startsWith(phrase)) {
      return true;
    }

    // Check if phrase is anywhere in text with word boundaries
    const wordBoundaryPattern = new RegExp(`\\b${phrase}\\b`, 'i');
    if (wordBoundaryPattern.test(text)) {
      return true;
    }

    // Calculate similarity score
    const similarity = this.calculateSimilarity(text, phrase);
    return similarity >= this.wakeWordConfig.sensitivity;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Check if in cooldown period
   */
  private isInCooldown(): boolean {
    if (!this.lastDetectionTime) return false;
    
    const timeSinceLastDetection = Date.now() - this.lastDetectionTime.getTime();
    return timeSinceLastDetection < this.cooldownPeriod;
  }

  /**
   * Record detection attempt
   */
  private recordDetection(phrase: string, detected: boolean): void {
    this.detectionHistory.push({
      phrase,
      timestamp: new Date(),
      detected
    });

    // Keep only last 100 attempts
    if (this.detectionHistory.length > 100) {
      this.detectionHistory.shift();
    }
  }

  /**
   * Update wake word configuration
   */
  updateWakeWords(config: Partial<WakeWordConfig>): void {
    this.wakeWordConfig = {
      ...this.wakeWordConfig,
      ...config
    };
  }

  /**
   * Add custom wake word
   */
  addWakeWord(phrase: string): void {
    if (!this.wakeWordConfig.phrases.includes(phrase)) {
      this.wakeWordConfig.phrases.push(phrase);
    }
  }

  /**
   * Remove wake word
   */
  removeWakeWord(phrase: string): void {
    this.wakeWordConfig.phrases = this.wakeWordConfig.phrases.filter(
      p => p !== phrase
    );
  }

  /**
   * Get detection statistics
   */
  getStatistics(): {
    totalAttempts: number;
    successfulDetections: number;
    detectionRate: number;
    recentDetections: Array<{ phrase: string; timestamp: Date }>;
  } {
    const successful = this.detectionHistory.filter(d => d.detected);
    
    return {
      totalAttempts: this.detectionHistory.length,
      successfulDetections: successful.length,
      detectionRate: this.detectionHistory.length > 0 
        ? successful.length / this.detectionHistory.length 
        : 0,
      recentDetections: successful
        .slice(-10)
        .map(d => ({ phrase: d.phrase, timestamp: d.timestamp }))
    };
  }

  /**
   * Set sensitivity
   */
  setSensitivity(sensitivity: number): void {
    this.wakeWordConfig.sensitivity = Math.max(0, Math.min(1, sensitivity));
  }

  /**
   * Set cooldown period
   */
  setCooldownPeriod(milliseconds: number): void {
    this.cooldownPeriod = Math.max(0, milliseconds);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Required<VoiceServiceConfig>): void {
    this.config = config;
    if (config.language !== this.wakeWordConfig.language) {
      this.wakeWordConfig = this.getDefaultWakeWordConfig();
    }
  }

  /**
   * Reset detection history
   */
  reset(): void {
    this.detectionHistory = [];
    this.lastDetectionTime = null;
  }
}