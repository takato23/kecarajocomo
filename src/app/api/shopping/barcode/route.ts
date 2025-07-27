/**
 * Barcode Scanning API Route
 * Handles barcode product lookups and shopping list integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// External barcode API configuration
const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product';
const BARCODE_LOOKUP_API = 'https://api.barcodelookup.com/v3/products';

interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  image?: string;
  description?: string;
  ingredients?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { barcode, userId, listId } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      );
    }

    logger.info('Processing barcode scan', 'api/shopping/barcode', {
      barcode,
      userId,
      listId
    });

    // First, check if we have this product in our database
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    let productInfo: ProductInfo;

    if (existingProduct) {
      productInfo = {
        barcode,
        name: existingProduct.name,
        brand: existingProduct.brand,
        category: existingProduct.category,
        price: existingProduct.last_known_price,
        nutrition: existingProduct.nutrition_info,
        image: existingProduct.image_url,
        description: existingProduct.description,
        ingredients: existingProduct.ingredients
      };
    } else {
      // Fetch from external APIs
      productInfo = await fetchProductFromExternalAPIs(barcode);
      
      // Save to our database for future use
      if (productInfo.name) {
        await supabase
          .from('products')
          .upsert({
            barcode,
            name: productInfo.name,
            brand: productInfo.brand,
            category: productInfo.category,
            last_known_price: productInfo.price,
            nutrition_info: productInfo.nutrition,
            image_url: productInfo.image,
            description: productInfo.description,
            ingredients: productInfo.ingredients,
            source: 'barcode_scan',
            updated_at: new Date().toISOString()
          });
      }
    }

    // If a shopping list is specified, add the item to it
    if (listId && productInfo.name) {
      const { error: addError } = await supabase
        .from('shopping_items')
        .insert({
          list_id: listId,
          name: productInfo.name,
          quantity: 1,
          category: mapCategoryToStandard(productInfo.category),
          estimated_price: productInfo.price,
          notes: `Añadido por código de barras: ${barcode}`,
          checked: false,
          position: await getNextPosition(listId)
        });

      if (addError) {
        logger.error('Error adding barcode item to shopping list', 'api/shopping/barcode', addError);
      }
    }

    return NextResponse.json({
      success: true,
      data: productInfo
    });

  } catch (error) {
    logger.error('Error processing barcode scan', 'api/shopping/barcode', error);
    return NextResponse.json(
      { error: 'Error processing barcode' },
      { status: 500 }
    );
  }
}

/**
 * Fetch product information from external APIs
 */
async function fetchProductFromExternalAPIs(barcode: string): Promise<ProductInfo> {
  let productInfo: Partial<ProductInfo> = { barcode };

  try {
    // Try Open Food Facts first (free, comprehensive for food products)
    const openFoodFactsResponse = await fetch(`${OPENFOODFACTS_API}/${barcode}.json`);
    
    if (openFoodFactsResponse.ok) {
      const data = await openFoodFactsResponse.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        
        productInfo = {
          barcode,
          name: product.product_name || product.product_name_es || 'Producto sin nombre',
          brand: product.brands,
          category: product.categories?.split(',')[0]?.trim(),
          image: product.image_url,
          description: product.ingredients_text || product.ingredients_text_es,
          ingredients: product.ingredients?.map((ing: any) => ing.text) || [],
          nutrition: {
            calories: product.nutriments?.energy_kcal_100g,
            protein: product.nutriments?.proteins_100g,
            carbs: product.nutriments?.carbohydrates_100g,
            fat: product.nutriments?.fat_100g
          }
        };

        logger.info('Product found in Open Food Facts', 'fetchProductFromExternalAPIs', {
          barcode,
          name: productInfo.name
        });

        return productInfo as ProductInfo;
      }
    }
  } catch (error) {
    logger.warn('Open Food Facts API error', 'fetchProductFromExternalAPIs', error);
  }

  try {
    // Try Barcode Lookup API (requires API key, more comprehensive for non-food items)
    if (process.env.BARCODE_LOOKUP_API_KEY) {
      const barcodeResponse = await fetch(
        `${BARCODE_LOOKUP_API}?barcode=${barcode}&formatted=y&key=${process.env.BARCODE_LOOKUP_API_KEY}`
      );

      if (barcodeResponse.ok) {
        const data = await barcodeResponse.json();
        
        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          
          productInfo = {
            barcode,
            name: product.title || product.product_name,
            brand: product.brand,
            category: product.category,
            description: product.description,
            image: product.images?.[0],
            price: parseFloat(product.lowest_recorded_price) || undefined
          };

          logger.info('Product found in Barcode Lookup API', 'fetchProductFromExternalAPIs', {
            barcode,
            name: productInfo.name
          });

          return productInfo as ProductInfo;
        }
      }
    }
  } catch (error) {
    logger.warn('Barcode Lookup API error', 'fetchProductFromExternalAPIs', error);
  }

  // If no product found, return minimal info
  logger.warn('Product not found in external APIs', 'fetchProductFromExternalAPIs', { barcode });
  
  return {
    barcode,
    name: `Producto ${barcode.slice(-4)}`,
    category: 'other',
    description: 'Producto escaneado - información no disponible'
  };
}

/**
 * Map external category to our standard categories
 */
function mapCategoryToStandard(externalCategory?: string): string {
  if (!externalCategory) return 'other';

  const categoryMap: Record<string, string> = {
    // Food categories from Open Food Facts
    'dairy': 'dairy',
    'meat': 'meat',
    'vegetables': 'produce',
    'fruits': 'produce',
    'bread': 'grains',
    'beverages': 'beverages',
    'cereals': 'grains',
    'frozen': 'frozen',
    
    // General categories
    'food': 'pantry',
    'grocery': 'pantry',
    'health': 'pantry',
    'beauty': 'other',
    'household': 'other'
  };

  const category = externalCategory.toLowerCase();
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (category.includes(key)) {
      return value;
    }
  }

  return 'other';
}

/**
 * Get next position for item in shopping list
 */
async function getNextPosition(listId: string): Promise<number> {
  const { data } = await supabase
    .from('shopping_items')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1);

  return (data?.[0]?.position || 0) + 1;
}