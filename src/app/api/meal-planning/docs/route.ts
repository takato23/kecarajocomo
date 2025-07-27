import { NextRequest, NextResponse } from 'next/server';

// GET /api/meal-planning/docs - API Documentation
export async function GET(req: NextRequest) {
  const docs = {
    title: "Meal Planning API Documentation",
    version: "1.0.0",
    description: "Comprehensive meal planning API with AI integration, Supabase backend, and secure user management",
    
    endpoints: {
      
      // Main meal planning CRUD operations
      "GET /api/meal-planning": {
        description: "Get meal plans by date range with optional filters",
        authentication: "JWT required",
        parameters: {
          query: {
            startDate: "ISO date string (optional) - filter by start date",
            endDate: "ISO date string (optional) - filter by end date",
            active: "boolean string (optional) - filter by active status"
          }
        },
        response: {
          success: "boolean",
          data: "Array of meal plans with nested meal_plan_items and recipes"
        },
        example: {
          url: "/api/meal-planning?startDate=2024-01-01&endDate=2024-01-31&active=true",
          response: {
            success: true,
            data: [
              {
                id: "uuid",
                name: "Weekly Plan Jan 1-7",
                start_date: "2024-01-01",
                end_date: "2024-01-07",
                is_active: true,
                preferences: {},
                nutritional_goals: {},
                meal_plan_items: []
              }
            ]
          }
        }
      },

      "POST /api/meal-planning": {
        description: "Create or update a meal plan",
        authentication: "JWT required",
        body: {
          id: "string (optional) - for updates",
          name: "string (required) - meal plan name",
          startDate: "ISO date string (required)",
          endDate: "ISO date string (required)",
          preferences: "object (optional) - user preferences",
          nutritionalGoals: "object (optional) - nutrition targets",
          items: "array (optional) - meal plan items",
          setActive: "boolean (optional) - set as active plan"
        },
        response: {
          success: "boolean",
          data: "Complete meal plan object with items"
        }
      },

      "DELETE /api/meal-planning": {
        description: "Delete a meal plan by ID",
        authentication: "JWT required",
        parameters: {
          query: {
            id: "string (required) - meal plan UUID"
          }
        },
        response: {
          success: "boolean",
          message: "string"
        }
      },

      // Individual meal plan operations
      "GET /api/meal-planning/[id]": {
        description: "Get specific meal plan with nutritional stats",
        authentication: "JWT required",
        parameters: {
          path: {
            id: "string (required) - meal plan UUID"
          }
        },
        response: {
          success: "boolean",
          data: "Meal plan object with items, recipes, and nutritional stats"
        }
      },

      "PUT /api/meal-planning/[id]": {
        description: "Update specific meal plan properties",
        authentication: "JWT required",
        body: {
          name: "string (optional)",
          startDate: "ISO date string (optional)",
          endDate: "ISO date string (optional)",
          preferences: "object (optional)",
          nutritionalGoals: "object (optional)",
          isActive: "boolean (optional)"
        },
        response: {
          success: "boolean",
          data: "Updated meal plan object"
        }
      },

      "DELETE /api/meal-planning/[id]": {
        description: "Delete specific meal plan",
        authentication: "JWT required",
        response: {
          success: "boolean",
          message: "string"
        }
      },

      // Meal plan items management
      "GET /api/meal-planning/[id]/items": {
        description: "Get meal plan items with optional filtering",
        authentication: "JWT required",
        parameters: {
          query: {
            date: "ISO date string (optional) - filter by date",
            mealType: "string (optional) - breakfast|lunch|snack|dinner"
          }
        },
        response: {
          success: "boolean",
          data: "Array of meal plan items with recipes"
        }
      },

      "POST /api/meal-planning/[id]/items": {
        description: "Add or update meal plan items (upsert)",
        authentication: "JWT required",
        body: {
          items: [
            {
              recipeId: "string (optional) - recipe UUID",
              date: "ISO date string (required)",
              mealType: "string (required) - breakfast|lunch|snack|dinner",
              servings: "number (optional, default: 1)",
              isCompleted: "boolean (optional, default: false)",
              customRecipe: "object (optional) - AI generated recipe data",
              nutritionalInfo: "object (optional)",
              notes: "string (optional)"
            }
          ]
        },
        response: {
          success: "boolean",
          data: "Array of created/updated items"
        }
      },

      "DELETE /api/meal-planning/[id]/items": {
        description: "Delete meal plan items",
        authentication: "JWT required",
        parameters: {
          query: {
            itemId: "string (optional) - specific item UUID",
            date: "ISO date string (optional) - delete by date+mealType",
            mealType: "string (optional) - required if using date"
          }
        },
        note: "Must provide either itemId OR both date and mealType",
        response: {
          success: "boolean",
          message: "string"
        }
      },

      // Active meal plan management
      "GET /api/meal-planning/active": {
        description: "Get currently active meal plan",
        authentication: "JWT required",
        response: {
          success: "boolean",
          data: "Active meal plan object or null",
          message: "string (if no active plan)"
        }
      },

      "PUT /api/meal-planning/active": {
        description: "Set active meal plan",
        authentication: "JWT required",
        body: {
          mealPlanId: "string (required) - meal plan UUID"
        },
        response: {
          success: "boolean",
          data: "Activated meal plan object"
        }
      },

      // AI meal plan generation
      "POST /api/meal-planning/generate": {
        description: "Generate AI-powered meal plan using Gemini",
        authentication: "JWT required",
        body: {
          preferences: {
            userId: "string (auto-set from JWT)",
            dietaryRestrictions: "array of strings",
            allergens: "array of strings",
            cuisinePreferences: "array of strings",
            mealTypes: "array of strings",
            budgetRange: "object with min/max",
            nutritionGoals: "object with targets"
          },
          constraints: {
            startDate: "ISO date string (required)",
            endDate: "ISO date string (required)",
            maxPrepTime: "number (optional)",
            pantryItems: "array (optional)",
            excludeIngredients: "array (optional)"
          },
          options: {
            useHolisticAnalysis: "boolean (optional, default: true)",
            includeExternalFactors: "boolean (optional, default: true)",
            optimizeResources: "boolean (optional, default: true)",
            enableLearning: "boolean (optional, default: true)",
            analysisDepth: "string (optional) - surface|comprehensive|deep_dive"
          }
        },
        response: {
          success: "boolean",
          plan: "Generated meal plan object",
          insights: "AI analysis and recommendations",
          metadata: "Generation metadata (confidence, processing time, etc.)"
        }
      },

      // AI-generated recipes management
      "GET /api/meal-planning/ai-recipes": {
        description: "Get AI-generated recipes",
        authentication: "JWT required",
        parameters: {
          query: {
            public: "boolean string (optional) - show only public recipes",
            mealType: "string (optional) - filter by meal type",
            cuisine: "string (optional) - filter by cuisine",
            tags: "comma-separated string (optional) - dietary tags"
          }
        },
        response: {
          success: "boolean",
          data: "Array of AI-generated recipes"
        }
      },

      "POST /api/meal-planning/ai-recipes": {
        description: "Save AI-generated recipe",
        authentication: "JWT required",
        body: {
          recipeData: "object (required) - complete recipe data",
          name: "string (required)",
          description: "string (optional)",
          mealType: "string (optional)",
          dietaryTags: "array (optional)",
          cuisine: "string (optional)",
          prepTime: "number (optional)",
          cookTime: "number (optional)",
          servings: "number (optional, default: 4)",
          difficulty: "string (optional)",
          nutritionalInfo: "object (optional)",
          isPublic: "boolean (optional, default: false)"
        },
        response: {
          success: "boolean",
          data: "Saved recipe object"
        }
      },

      "PUT /api/meal-planning/ai-recipes": {
        description: "Update AI-generated recipe",
        authentication: "JWT required",
        parameters: {
          query: {
            id: "string (required) - recipe UUID"
          }
        },
        body: "Any field from POST body (all optional)",
        response: {
          success: "boolean",
          data: "Updated recipe object"
        }
      },

      "DELETE /api/meal-planning/ai-recipes": {
        description: "Delete AI-generated recipe",
        authentication: "JWT required",
        parameters: {
          query: {
            id: "string (required) - recipe UUID"
          }
        },
        response: {
          success: "boolean",
          message: "string"
        }
      }
    },

    // Security and features
    security: {
      authentication: "JWT tokens via Supabase Auth",
      authorization: "Row Level Security (RLS) policies ensure users only access their own data",
      rateLimit: "Applied per endpoint to prevent abuse",
      validation: "Input validation and sanitization on all endpoints",
      cors: "Configured for frontend domain"
    },

    features: {
      aiIntegration: "Gemini AI for intelligent meal plan generation",
      pantryIntegration: "Considers available pantry items in planning",
      nutritionalTracking: "Automatic nutritional calculation and tracking",
      caching: "Redis caching for AI responses and frequent queries",
      history: "Complete audit trail of meal plan changes",
      publicRecipes: "Share AI-generated recipes with community",
      activeManagement: "Single active meal plan per user",
      dateRangeFiltering: "Flexible date-based filtering",
      bulkOperations: "Batch operations for meal plan items"
    },

    errorHandling: {
      standardFormat: {
        error: "string - human readable error message",
        code: "string (optional) - error code for programmatic handling"
      },
      httpCodes: {
        200: "Success",
        400: "Bad Request - invalid input",
        401: "Unauthorized - invalid or missing JWT",
        403: "Forbidden - insufficient permissions",
        404: "Not Found - resource doesn't exist",
        500: "Internal Server Error - server issue"
      }
    },

    dataModels: {
      mealPlan: {
        id: "UUID",
        user_id: "UUID (FK to auth.users)",
        name: "string",
        start_date: "DATE",
        end_date: "DATE",
        is_active: "boolean",
        preferences: "JSONB",
        nutritional_goals: "JSONB",
        created_at: "timestamp",
        updated_at: "timestamp"
      },
      mealPlanItem: {
        id: "UUID",
        meal_plan_id: "UUID (FK)",
        recipe_id: "UUID (FK, nullable)",
        date: "DATE",
        meal_type: "enum(breakfast,lunch,snack,dinner)",
        servings: "integer",
        is_completed: "boolean",
        custom_recipe: "JSONB (nullable)",
        nutritional_info: "JSONB",
        notes: "text"
      },
      aiGeneratedRecipe: {
        id: "UUID",
        user_id: "UUID (FK)",
        recipe_data: "JSONB",
        name: "string",
        description: "text",
        meal_type: "string",
        dietary_tags: "text[]",
        cuisine: "string",
        prep_time: "integer",
        cook_time: "integer",
        servings: "integer",
        difficulty: "string",
        nutritional_info: "JSONB",
        is_public: "boolean",
        usage_count: "integer",
        rating: "decimal(3,2)"
      }
    }
  };

  return NextResponse.json(docs, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}