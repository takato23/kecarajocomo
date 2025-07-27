import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import { getHolisticSystem } from '@/services/core/HolisticSystem';

export function useHolisticSystem() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const holisticSystem = getHolisticSystem();
  
  /**
   * Procesar un ticket completo
   */
  const processReceipt = useCallback(async (receiptImage: File, userId: string) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simular progreso mientras procesamos
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const result = await holisticSystem.processReceiptToMealPlan(receiptImage, userId);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      toast.success('Ticket procesado exitosamente!');
      return result;
      
    } catch (error: unknown) {
      logger.error('Error procesando ticket:', 'useHolisticSystem', error);
      toast.error('Error al procesar el ticket');
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [holisticSystem]);
  
  /**
   * Obtener preferencias del usuario
   */
  const getUserPreferences = useCallback(async (userId: string) => {
    try {
      return await holisticSystem.getUserPreferences(userId);
    } catch (error: unknown) {
      logger.error('Error obteniendo preferencias:', 'useHolisticSystem', error);
      toast.error('Error al cargar preferencias');
      return null;
    }
  }, [holisticSystem]);
  
  /**
   * Generar insights con IA
   */
  const generateInsights = useCallback(async (userId: string, data: any) => {
    try {
      return await holisticSystem.generateInsights(userId, data);
    } catch (error: unknown) {
      logger.error('Error generando insights:', 'useHolisticSystem', error);
      toast.error('Error al generar insights');
      return [];
    }
  }, [holisticSystem]);
  
  return {
    processReceipt,
    getUserPreferences,
    generateInsights,
    isProcessing,
    progress
  };
}