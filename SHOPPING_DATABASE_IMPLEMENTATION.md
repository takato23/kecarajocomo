# Shopping Database Implementation

## Overview
This document describes the database operations implemented for the ShoppingOptimizer service.

## Database Tables

### 1. `shopping_lists`
Main table for shopping lists.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `name` (TEXT): List name
- `budget` (DECIMAL): Optional budget for the list
- `is_active` (BOOLEAN): Whether the list is active
- `total_estimated` (DECIMAL): Total estimated cost
- `optimized_route` (JSONB): Store route optimization data
- `related_meal_plan` (TEXT): Reference to related meal plan
- `status` (TEXT): 'active', 'completed', or 'archived'
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

### 2. `shopping_items`
Items within shopping lists.

**Columns:**
- `id` (UUID): Primary key
- `list_id` (UUID): References shopping_lists
- `name` (TEXT): Item name
- `quantity` (DECIMAL): Quantity needed
- `unit` (TEXT): Unit of measurement
- `category` (TEXT): Item category (e.g., 'Lácteos', 'Carnes')
- `store` (TEXT): Preferred store
- `price` (DECIMAL): Actual price (updated after purchase)
- `estimated_price` (DECIMAL): Estimated price
- `checked` (BOOLEAN): Whether item has been purchased
- `notes` (TEXT): Additional notes
- `position` (INTEGER): Order position in list
- `priority` (TEXT): 'essential', 'recommended', or 'optional'
- `aisle` (TEXT): Store aisle location
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

### 3. `item_usage_history`
Tracks usage patterns for shopping predictions.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users
- `item_name` (TEXT): Name of the item
- `quantity` (DECIMAL): Quantity used
- `unit` (TEXT): Unit of measurement
- `used_at` (TIMESTAMPTZ): When the item was used
- `context` (TEXT): Context of usage (e.g., 'meal_plan', 'shopping_list')
- `created_at` (TIMESTAMPTZ): Creation timestamp

### 4. `price_history`
Tracks price changes over time.

**Columns:**
- `id` (UUID): Primary key
- `shopping_item_id` (UUID): References shopping_items
- `store` (TEXT): Store name
- `price` (DECIMAL): Price at this store
- `unit` (TEXT): Unit for the price
- `found_at` (TIMESTAMPTZ): When this price was found

### 5. `shopping_preferences`
User shopping preferences.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References auth.users (unique)
- `preferred_stores` (TEXT[]): Array of preferred stores
- `default_budget` (DECIMAL): Default monthly budget
- `currency` (TEXT): Currency code (default 'ARS')
- `auto_save` (BOOLEAN): Auto-save preference
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

## Implemented Methods

### 1. `saveList(list: ShoppingList)`
Saves a complete shopping list with all items in a transaction.

**Process:**
1. Insert the shopping list
2. Insert all items associated with the list
3. Rollback if any operation fails

### 2. `addItemToList(listId: string, item: Partial<ShoppingItem>)`
Adds a single item to an existing list.

**Process:**
1. Create item with defaults
2. Insert into shopping_items table
3. Update list total

### 3. `checkItem(listId: string, itemId: string, checked: boolean)`
Marks an item as purchased/unpurchased.

**Process:**
1. Update checked status
2. If checked, add to usage history for future predictions

### 4. `getUserLists(userId: string, status?: string)`
Retrieves all lists for a user with optional status filter.

**Process:**
1. Query shopping_lists with shopping_items joined
2. Transform database format to application format
3. Return sorted by creation date

### 5. `updateListTotal(listId: string)`
Updates the total estimated cost of a list.

**Process:**
1. Sum all item estimated prices
2. Update shopping_lists.total_estimated

### 6. `addToUsageHistory(params)`
Tracks item usage for future predictions.

**Process:**
1. Get current user
2. Insert usage record with context

### 7. `getItemHistory(userId: string, itemName?: string)`
Retrieves usage history for prediction algorithms.

**Process:**
1. Query item_usage_history
2. Optional filtering by item name
3. Return recent 100 entries

### 8. `updateSavings(userId: string, listId: string)`
Calculates and tracks savings.

**Process:**
1. Compare estimated vs actual prices
2. Calculate total savings
3. Mark list as completed if savings calculated

### 9. `updateStock(listId: string)`
Updates pantry stock after shopping.

**Process:**
1. Get all checked items from list
2. For each item, update or create pantry entry
3. Log new items for manual pantry addition

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only:
- View their own data
- Create data linked to their user ID
- Update/delete their own data
- Items are accessible if the parent list belongs to the user

## Indexes

Performance indexes are created for:
- User ID lookups
- List status filtering
- Item priority filtering
- Usage history queries

## Migrations

Run the following migrations in order:
1. `20240118_shopping_lists.sql` - Initial shopping tables
2. `20240301_create_shopping_tables.sql` - Updated schema
3. `20250725_update_shopping_tables.sql` - Latest enhancements

## Error Handling

All database operations include:
- Try-catch blocks for error handling
- Meaningful error messages in console
- Graceful fallbacks where appropriate
- Transaction rollback on failures

## Future Enhancements

1. **Ingredient Matching**: Link shopping items to ingredients table for better nutrition tracking
2. **Store Integration**: Direct integration with store APIs for real-time pricing
3. **Collaborative Lists**: Share lists between household members
4. **Recurring Items**: Auto-add frequently purchased items
5. **Budget Alerts**: Real-time notifications when approaching budget limits