'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '@/services/logger';
import { 
  AlertTriangle, 
  Clock, 
  X, 
  Bell, 
  BellOff,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Package,
} from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';

import { usePantryStore } from '../store/pantryStore';
import type { ExpirationAlert } from '../types';

interface ExpirationNotificationsProps {
  showAll?: boolean;
  maxVisible?: number;
  onItemClick?: (itemId: string) => void;
}

export function ExpirationNotifications({ 
  showAll = false, 
  maxVisible = 5,
  onItemClick,
}: ExpirationNotificationsProps) {
  const { 
    expirationAlerts, 
    isLoading, 
    fetchExpirationAlerts, 
    dismissAlert,
    getExpiringItems,
    getExpiredItems,
  } = usePantryStore();

  const [showExpired, setShowExpired] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const expiredItems = getExpiredItems();
  const expiringItems = getExpiringItems(7);

  useEffect(() => {
    fetchExpirationAlerts();
  }, [fetchExpirationAlerts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchExpirationAlerts();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId);
    } catch (error: unknown) {
      logger.error('Error dismissing alert:', 'ExpirationNotifications', error);
    }
  };

  const filteredAlerts = expirationAlerts.filter(alert => {
    if (!showExpired && alert.alert_type === 'expired') return false;
    if (!showDismissed && alert.dismissed) return false;
    return true;
  });

  const visibleAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, maxVisible);
  const hiddenCount = filteredAlerts.length - visibleAlerts.length;

  const getAlertIcon = (alertType: ExpirationAlert['alert_type']) => {
    switch (alertType) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAlertMessage = (alert: ExpirationAlert) => {
    switch (alert.alert_type) {
      case 'expired':
        return `Expired ${Math.abs(alert.days_until_expiration)} day${Math.abs(alert.days_until_expiration) !== 1 ? 's' : ''} ago`;
      case 'urgent':
        return alert.days_until_expiration === 0 ? 'Expires today' : `Expires in ${alert.days_until_expiration} day${alert.days_until_expiration !== 1 ? 's' : ''}`;
      case 'warning':
        return `Expires in ${alert.days_until_expiration} day${alert.days_until_expiration !== 1 ? 's' : ''}`;
      default:
        return 'Check expiration date';
    }
  };

  const getAlertBadgeVariant = (alertType: ExpirationAlert['alert_type']) => {
    switch (alertType) {
      case 'expired':
        return 'error' as const;
      case 'urgent':
        return 'error' as const;
      case 'warning':
        return 'warning' as const;
      default:
        return 'neutral' as const;
    }
  };

  if (isLoading && visibleAlerts.length === 0) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <Heading as="h3" size="lg" className="text-lg font-semibold text-gray-900">
            Expiration Alerts
          </Heading>
          {filteredAlerts.length > 0 && (
            <Badge variant="neutral">
              {filteredAlerts.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpired(!showExpired)}
              className={`flex items-center gap-1 ${showExpired ? 'text-red-600' : 'text-gray-400'}`}
              title={showExpired ? 'Hide expired items' : 'Show expired items'}
            >
              {showExpired ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Expired ({expiredItems.length})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDismissed(!showDismissed)}
              className={`flex items-center gap-1 ${showDismissed ? 'text-gray-600' : 'text-gray-400'}`}
              title={showDismissed ? 'Hide dismissed alerts' : 'Show dismissed alerts'}
            >
              {showDismissed ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
              Dismissed
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      {visibleAlerts.length === 0 ? (
        <Card className="p-6 text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <Heading as="h4" size="md" className="font-medium text-gray-900 mb-1">
            {filteredAlerts.length === 0 ? 'No active alerts' : 'No alerts to show'}
          </Heading>
          <Text size="sm" className="text-gray-600">
            {filteredAlerts.length === 0 
              ? 'All your items are fresh! Check back later.'
              : 'Adjust your filters to see more alerts.'
            }
          </Text>
        </Card>
      ) : (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`p-4 transition-all hover:shadow-md cursor-pointer ${
                alert.dismissed ? 'opacity-60 bg-gray-50' : ''
              } ${
                alert.alert_type === 'expired' ? 'border-red-200 bg-red-50' :
                alert.alert_type === 'urgent' ? 'border-orange-200 bg-orange-50' :
                alert.alert_type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                ''
              }`}
              onClick={() => onItemClick?.(alert.pantry_item_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getAlertIcon(alert.alert_type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Heading as="h4" size="md" className="font-medium text-gray-900 truncate">
                        {alert.item_name}
                      </Heading>
                      <Badge variant={getAlertBadgeVariant(alert.alert_type)} className="text-xs">
                        {getAlertMessage(alert)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Expires: {alert.expiration_date.toLocaleDateString()}
                      </span>
                      {alert.dismissed && (
                        <span className="text-gray-500">• Dismissed</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!alert.dismissed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissAlert(alert.id);
                      }}
                      className="p-1 hover:bg-gray-200"
                      title="Dismiss alert"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Show More Button */}
          {!showAll && hiddenCount > 0 && (
            <Card className="p-3 text-center">
              <Text size="sm" className="text-gray-600">
                +{hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
              </Text>
            </Card>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {(expiredItems.length > 0 || expiringItems.length > 0) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Heading as="h4" size="lg" className="text-lg font-bold text-red-600">
                  {expiredItems.length}
                </Heading>
                <Text size="xs" className="text-gray-600 text-xs">
                  Expired
                </Text>
              </div>
              <div className="text-center">
                <Heading as="h4" size="lg" className="text-lg font-bold text-orange-600">
                  {expiringItems.length}
                </Heading>
                <Text size="xs" className="text-gray-600 text-xs">
                  Expiring Soon
                </Text>
              </div>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* TODO: Navigate to shopping list or recipes */}}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Find Recipes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}