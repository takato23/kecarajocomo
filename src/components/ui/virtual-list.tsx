'use client';

import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onEndReached,
  endReachedThreshold = 0.9,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const sizeMap = useRef<Map<number, number>>(new Map());

  const getItemHeight = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'function') {
        if (!sizeMap.current.has(index)) {
          sizeMap.current.set(index, itemHeight(index));
        }
        return sizeMap.current.get(index) || 0;
      }
      return itemHeight;
    },
    [itemHeight]
  );

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, getItemHeight]);

  const getVisibleRange = useCallback(() => {
    const start = scrollTop;
    const end = scrollTop + height;

    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = getItemOffset(mid);
      if (offset < start) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    startIndex = Math.max(0, high);

    // Find end index
    for (let i = startIndex; i < items.length; i++) {
      const offset = getItemOffset(i);
      if (offset > end) {
        endIndex = i;
        break;
      }
    }

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, height, items.length, getItemOffset, overscan]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const scrollHeight = e.currentTarget.scrollHeight;
      const clientHeight = e.currentTarget.clientHeight;

      setScrollTop(scrollTop);

      // Check if reached end
      if (onEndReached) {
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        if (scrollPercentage >= endReachedThreshold) {
          onEndReached();
        }
      }
    },
    [onEndReached, endReachedThreshold]
  );

  const { startIndex, endIndex } = getVisibleRange();
  const totalHeight = getTotalHeight();
  const offsetY = getItemOffset(startIndex);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${getItemOffset(i) - offsetY}px)`,
        }}
      >
        {renderItem(items[i], i)}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('relative overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems}
        </div>
      </div>
    </div>
  );
}

// Specialized virtual list for recipes
interface RecipeListItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  cookTime: number;
  difficulty: string;
}

export function VirtualRecipeList({
  recipes,
  onRecipeClick,
  className,
}: {
  recipes: RecipeListItem[];
  onRecipeClick?: (recipe: RecipeListItem) => void;
  className?: string;
}) {
  const renderRecipe = (recipe: RecipeListItem) => (
    <div
      className="glass-interactive rounded-lg p-4 mb-3 cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={() => onRecipeClick?.(recipe)}
    >
      <div className="flex gap-4">
        {recipe.imageUrl && (
          <div className="w-24 h-24 rounded-lg bg-gray-200 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {recipe.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {recipe.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{recipe.cookTime} min</span>
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <VirtualList
      items={recipes}
      height={600}
      itemHeight={120}
      renderItem={renderRecipe}
      overscan={5}
      className={className}
    />
  );
}