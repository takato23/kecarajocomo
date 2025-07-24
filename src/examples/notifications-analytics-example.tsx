/**
 * Example: Notifications and Analytics Integration
 * Shows how to use both services together in a real component
 */

import React, { useEffect } from 'react';

import { useNotifications } from '@/services/notifications';
import { useAnalytics, useFeatureTracking, ANALYTICS_EVENTS, FEATURES } from '@/services/analytics';

/**
 * Example 1: Recipe Save with Notification and Analytics
 */
export function RecipeSaveButton({ recipe }: { recipe: any }) {
  const { success, error } = useNotifications();
  const { track } = useAnalytics();
  
  const handleSave = async () => {
    try {
      // Track intent
      track(ANALYTICS_EVENTS.RECIPE_SAVE, {
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        category: recipe.category,
        source: 'recipe_detail',
      });
      
      // Perform save operation
      const response = await fetch(`/api/recipes/${recipe.id}/save`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      // Show success notification
      await success('Receta guardada', {
        metadata: {
          description: `${recipe.name} se guardó en tu colección`,
        },
        voice: {
          text: 'Receta guardada exitosamente',
          language: 'es-MX',
        },
      });
      
      // Track success
      track('recipe_save_success', {
        recipe_id: recipe.id,
      });
      
    } catch (err: unknown) {
      // Show error notification
      await error('Error al guardar', {
        metadata: {
          description: 'No se pudo guardar la receta. Intenta de nuevo.',
        },
      });
      
      // Track error
      track('recipe_save_error', {
        recipe_id: recipe.id,
        error: err.message,
      });
    }
  };
  
  return (
    <button onClick={handleSave}>
      Guardar Receta
    </button>
  );
}

/**
 * Example 2: Pantry Item with Expiration Notification
 */
export function PantryExpirationChecker() {
  const { notify, requestPermission } = useNotifications();
  const { track } = useAnalytics();
  
  useEffect(() => {
    // Request notification permission
    requestPermission();
    
    // Check for expiring items
    const checkExpirations = async () => {
      const expiringItems = await fetch('/api/pantry/expiring').then(r => r.json());
      
      expiringItems.forEach(item => {
        // Schedule notification
        notify(`${item.name} expira pronto`, {
          type: 'expiration',
          priority: item.daysLeft <= 1 ? 'urgent' : 'high',
          channels: ['toast', 'push', 'voice'],
          voice: {
            text: `${item.name} expira en ${item.daysLeft} días`,
            language: 'es-MX',
          },
          schedule: {
            // Notify 1 day before expiration
            at: new Date(item.expirationDate).getTime() - 24 * 60 * 60 * 1000,
          },
          action: {
            label: 'Ver despensa',
            action: () => {
              window.location.href = '/pantry';
              track('expiration_notification_clicked', {
                item_id: item.id,
                item_name: item.name,
              });
            },
          },
        });
        
        // Track scheduled notification
        track(ANALYTICS_EVENTS.PANTRY_EXPIRATION_ALERT, {
          item_id: item.id,
          item_name: item.name,
          days_until_expiration: item.daysLeft,
          notification_scheduled: true,
        });
      });
    };
    
    checkExpirations();
    // Check daily
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
}

/**
 * Example 3: Voice Command with Analytics
 */
export function VoiceCommandHandler() {
  const { notify } = useNotifications();
  const { trackVoiceCommand } = useAnalytics();
  
  const handleVoiceCommand = async (transcript: string, confidence: number) => {
    const startTime = Date.now();
    
    try {
      // Process command
      const result = await processVoiceCommand(transcript);
      
      // Track successful command
      trackVoiceCommand({
        command: transcript,
        language: 'es-MX',
        confidence,
        duration: Date.now() - startTime,
        success: true,
      });
      
      // Notify success with voice feedback
      await notify(result.message, {
        type: 'success',
        channels: ['toast', 'voice'],
        voice: {
          text: result.voiceResponse,
          language: 'es-MX',
        },
      });
      
    } catch (error: unknown) {
      // Track failed command
      trackVoiceCommand({
        command: transcript,
        language: 'es-MX',
        confidence,
        duration: Date.now() - startTime,
        success: false,
        errorReason: error.message,
      });
      
      // Notify error
      await notify('No entendí el comando', {
        type: 'error',
        channels: ['toast', 'voice'],
        voice: {
          text: 'Lo siento, no pude procesar tu comando. Intenta de nuevo.',
          language: 'es-MX',
        },
      });
    }
  };
  
  return null;
}

/**
 * Example 4: Feature Usage Tracking with Notifications
 */
export function BarcodeScanner() {
  const { success, error } = useNotifications();
  const { trackAction, trackDuration } = useFeatureTracking(FEATURES.SCANNER);
  
  const handleScan = async () => {
    // Track scan start
    trackAction('scan_start', 'barcode');
    const startTime = Date.now();
    
    try {
      // Perform scan
      const result = await scanBarcode();
      
      // Track successful scan
      trackDuration('scan_complete', Date.now() - startTime, {
        product_found: true,
        product_name: result.productName,
        barcode: result.barcode,
      });
      
      // Show success notification with action
      await success('Producto encontrado', {
        metadata: {
          description: result.productName,
        },
        action: {
          label: 'Agregar a despensa',
          action: async () => {
            await addToPantry(result);
            trackAction('add_to_pantry', 'from_scan', {
              product_id: result.id,
            });
          },
        },
      });
      
    } catch (err: unknown) {
      // Track failed scan
      trackDuration('scan_failed', Date.now() - startTime, {
        error: err.message,
      });
      
      // Show error notification
      await error('No se pudo escanear', {
        metadata: {
          description: 'Intenta de nuevo o ingresa el producto manualmente',
        },
      });
    }
  };
  
  return (
    <button onClick={handleScan}>
      Escanear Código de Barras
    </button>
  );
}

/**
 * Example 5: Achievement System with Gamification
 */
export function AchievementUnlocker() {
  const { notify } = useNotifications();
  const { track } = useAnalytics();
  
  const unlockAchievement = async (achievement: any) => {
    // Track achievement
    track('achievement_unlock', {
      achievement_id: achievement.id,
      achievement_name: achievement.name,
      points_earned: achievement.points,
      category: achievement.category,
    });
    
    // Show achievement notification
    await notify('¡Logro Desbloqueado!', {
      type: 'achievement',
      priority: 'medium',
      channels: ['toast', 'audio', 'vibration'],
      sound: '/sounds/achievement.mp3',
      vibrate: [200, 100, 200, 100, 200],
      metadata: {
        description: achievement.description,
        icon: achievement.icon,
        points: `+${achievement.points} puntos`,
      },
      duration: 5000,
    });
    
    // Track notification interaction
    track('achievement_notification_shown', {
      achievement_id: achievement.id,
    });
  };
  
  return null;
}

/**
 * Example 6: Shopping List with Price Alerts
 */
export function PriceAlertManager() {
  const { notify, updateSettings } = useNotifications();
  const { track } = useAnalytics();
  
  const setupPriceAlert = async (item: any, targetPrice: number) => {
    // Track alert setup
    track('price_alert_created', {
      item_id: item.id,
      item_name: item.name,
      current_price: item.currentPrice,
      target_price: targetPrice,
      discount_percentage: ((item.currentPrice - targetPrice) / item.currentPrice) * 100,
    });
    
    // Schedule recurring check
    await notify(`Alerta de precio: ${item.name}`, {
      type: 'info',
      recurring: {
        interval: 'daily',
        time: '10:00',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      metadata: {
        description: `Te notificaremos cuando ${item.name} baje a $${targetPrice}`,
      },
    });
  };
  
  const checkPrices = async () => {
    const alerts = await fetch('/api/price-alerts').then(r => r.json());
    
    for (const alert of alerts) {
      if (alert.currentPrice <= alert.targetPrice) {
        // Price dropped!
        await notify('¡Bajó de precio!', {
          type: 'success',
          priority: 'high',
          channels: ['toast', 'push', 'audio', 'voice'],
          voice: {
            text: `${alert.itemName} ahora cuesta ${alert.currentPrice} pesos`,
            language: 'es-MX',
          },
          action: {
            label: 'Agregar a lista',
            action: () => {
              addToShoppingList(alert.item);
              track('price_alert_action', {
                item_id: alert.itemId,
                action: 'add_to_list',
              });
            },
          },
        });
        
        // Track price drop
        track('price_drop_detected', {
          item_id: alert.itemId,
          item_name: alert.itemName,
          previous_price: alert.previousPrice,
          current_price: alert.currentPrice,
          savings: alert.previousPrice - alert.currentPrice,
        });
      }
    }
  };
  
  return null;
}

// Helper functions (would be imported from actual services)
async function processVoiceCommand(transcript: string) {
  // Mock implementation
  return {
    message: 'Comando procesado',
    voiceResponse: 'He procesado tu comando exitosamente',
  };
}

async function scanBarcode() {
  // Mock implementation
  return {
    productName: 'Leche Alpura 1L',
    barcode: '7501234567890',
    id: 'prod_123',
  };
}

async function addToPantry(product: any) {
  // Mock implementation
  return true;
}

async function addToShoppingList(item: any) {
  // Mock implementation
  return true;
}