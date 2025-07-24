'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  MapPin,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  Check,
  X,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Card } from '@/components/design-system/Card';
import { Heading, Text } from '@/components/design-system/Typography';
import { Badge } from '@/components/design-system/Badge';

import { usePantryStore } from '../store/pantryStore';
import type { PantryItem, PantryFilter } from '../types';

interface PantryItemListProps {
  onEditItem?: (item: PantryItem) => void;
  onDeleteItem?: (item: PantryItem) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function PantryItemList({ 
  onEditItem, 
  onDeleteItem,
  viewMode = 'list',
  onViewModeChange,
}: PantryItemListProps) {
  const {
    items,
    isLoading,
    error,
    filter,
    selectedItems,
    setFilter,
    clearFilter,
    selectItem,
    selectAll,
    clearSelection,
    deleteItem,
    deleteItems,
    fetchItems,
    getFilteredItems,
    consumeItem,
  } = usePantryStore();

  const [searchTerm, setSearchTerm] = useState(filter.search_term || '');
  const [showFilters, setShowFilters] = useState(false);
  const [itemMenuOpen, setItemMenuOpen] = useState<string | null>(null);

  const filteredItems = getFilteredItems();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilter({ search_term: term || undefined });
  };

  const handleFilterChange = (key: keyof PantryFilter, value: any) => {
    setFilter({ [key]: value });
  };

  const handleSort = (sortBy: PantryFilter['sort_by']) => {
    const newOrder = filter.sort_by === sortBy && filter.sort_order === 'asc' ? 'desc' : 'asc';
    setFilter({ sort_by: sortBy, sort_order: newOrder });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await deleteItems(selectedItems);
      clearSelection();
    } catch (error: unknown) {
      console.error('Error deleting items:', error);
    }
  };

  const handleConsume = async (item: PantryItem, quantity: number = 1) => {
    try {
      await consumeItem(item.id, quantity);
    } catch (error: unknown) {
      console.error('Error consuming item:', error);
    }
  };

  const getExpirationStatus = (item: PantryItem) => {
    if (!item.expiration_date) return null;
    
    const now = new Date();
    const expDate = new Date(item.expiration_date);
    const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiration), color: 'error' as const };
    } else if (daysUntilExpiration <= 2) {
      return { status: 'urgent', days: daysUntilExpiration, color: 'error' as const };
    } else if (daysUntilExpiration <= 7) {
      return { status: 'warning', days: daysUntilExpiration, color: 'warning' as const };
    }
    
    return { status: 'good', days: daysUntilExpiration, color: 'success' as const };
  };

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
  const locations = Array.from(new Set(items.map(item => item.location).filter(Boolean)));

  if (isLoading && filteredItems.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange?.('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange?.('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Text size="sm" className="text-gray-600">
                {selectedItems.length} selected
              </Text>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filter.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={filter.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiring Within
              </label>
              <select
                value={filter.expiring_within_days || ''}
                onChange={(e) => handleFilterChange('expiring_within_days', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Any Time</option>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="30">1 month</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilter}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <Text size="sm" className="text-gray-600">
          Sort by:
        </Text>
        {[
          { key: 'name' as const, label: 'Name' },
          { key: 'expiration_date' as const, label: 'Expiration' },
          { key: 'quantity' as const, label: 'Quantity' },
          { key: 'category' as const, label: 'Category' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter.sort_by === key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleSort(key)}
            className="flex items-center gap-1"
          >
            {label}
            {filter.sort_by === key && (
              filter.sort_order === 'asc' ? 
                <SortAsc className="h-3 w-3" /> : 
                <SortDesc className="h-3 w-3" />
            )}
          </Button>
        ))}
      </div>

      {/* Items Count */}
      <div className="flex justify-between items-center">
        <Text size="sm" className="text-gray-600">
          {filteredItems.length} of {items.length} items
        </Text>
        {filteredItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-sm"
          >
            Select All
          </Button>
        )}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <Heading as="h3" size="lg" className="text-lg font-medium text-gray-900 mb-2">
            No items found
          </Heading>
          <Text size="sm" className="text-gray-600">
            {items.length === 0 ? 
              "Your pantry is empty. Add some items to get started!" :
              "No items match your current filters. Try adjusting your search criteria."
            }
          </Text>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' ? 
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' :
            'space-y-3'
        }>
          {filteredItems.map((item) => {
            const expiration = getExpirationStatus(item);
            const isSelected = selectedItems.includes(item.id);

            return viewMode === 'grid' ? (
              // Grid View
              <Card
                key={item.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => selectItem(item.id)}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Heading as="h3" size="lg" className="font-medium text-gray-900 truncate">
                      {item.ingredient_name}
                    </Heading>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemMenuOpen(itemMenuOpen === item.id ? null : item.id);
                        }}
                        className="p-1"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {itemMenuOpen === item.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem?.(item);
                              setItemMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConsume(item, 1);
                              setItemMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Check className="h-3 w-3" />
                            Use 1
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem?.(item);
                              setItemMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Text size="sm" className="text-gray-600">
                        {item.quantity} {item.unit}
                      </Text>
                      {item.category && (
                        <Badge variant="neutral" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </div>

                    {expiration && (
                      <div className="flex items-center gap-1">
                        {expiration.status === 'expired' ? (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-gray-400" />
                        )}
                        <Badge variant={expiration.color} className="text-xs">
                          {expiration.status === 'expired' ? 
                            `Expired ${expiration.days} days ago` :
                            `${expiration.days} days left`
                          }
                        </Badge>
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <Text size="sm" className="text-gray-600 text-xs">
                          {item.location}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              // List View
              <Card
                key={item.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => selectItem(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Heading as="h3" size="lg" className="font-medium text-gray-900 truncate">
                          {item.ingredient_name}
                        </Heading>
                        {item.category && (
                          <Badge variant="neutral" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{item.quantity} {item.unit}</span>
                        
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        )}
                        
                        {item.cost && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${item.cost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {expiration && (
                      <div className="flex items-center gap-2">
                        {expiration.status === 'expired' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <Badge variant={expiration.color}>
                          {expiration.status === 'expired' ? 
                            `Expired ${expiration.days}d ago` :
                            `${expiration.days}d left`
                          }
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem?.(item);
                      }}
                      className="p-1"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConsume(item, 1);
                      }}
                      className="p-1 text-green-600"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem?.(item);
                      }}
                      className="p-1 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Click outside handler for menu */}
      {itemMenuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setItemMenuOpen(null)}
        />
      )}
    </div>
  );
}