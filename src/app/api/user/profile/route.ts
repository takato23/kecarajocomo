/**
 * User Profile API Endpoint
 * Handles profile updates with comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { logger } from '@/lib/logger';

// authOptions removed - using Supabase Auth;
import { db } from '@/lib/supabase/database.service';
import { 
  MealPlanningError, 
  MealPlanningErrorCodes 
} from '@/lib/errors/MealPlanningError';
import { 
  UserPreferencesSchema
} from '@/lib/types/mealPlanning';
import { enhancedCache, CacheKeyGenerator } from '@/lib/services/enhancedCacheService';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with caching
    const cacheKey = CacheKeyGenerator.userProfile(user.id);
    const cached = await enhancedCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    const userProfile = await db.getUserProfile(user.id, {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        occupation: true,
        dietaryRestrictions: true,
        allergies: true,
        favoriteCuisines: true,
        cookingSkillLevel: true,
        householdSize: true,
        weeklyBudget: true,
        nutritionalGoals: true,
        notifications: true,
        profileVisibility: true,
        shareRecipes: true,
        dataSharing: true,
        analytics: true,
        thirdPartyIntegrations: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cache the result
    await enhancedCache.set(cacheKey, userProfile, 1000 * 60 * 30); // 30 minutes

    return NextResponse.json(userProfile);

  } catch (error: unknown) {
    logger.error('Error fetching user profile:', 'API:route', error);
    
    if (error instanceof MealPlanningError) {
      return NextResponse.json(
        { error: error.userMessage || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { section, data } = await request.json();

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data are required' },
        { status: 400 }
      );
    }

    // Validate and update based on section
    let updateData: any = {};
    
    switch (section) {
      case 'general':
        updateData = await validateAndPrepareGeneralData(data);
        break;
      case 'preferences':
        updateData = await validateAndPreparePreferencesData(data, user.id);
        break;
      case 'notifications':
        updateData = await validateAndPrepareNotificationsData(data);
        break;
      case 'privacy':
        updateData = await validateAndPreparePrivacyData(data);
        break;
      default:
        throw new MealPlanningError(
          'Invalid section',
          MealPlanningErrorCodes.INVALID_PREFERENCES,
          { section },
          'Sección de perfil inválida'
        );
    }

    // Update user in database
    const updatedUser = await db.updateUserProfile(user.id, {
      ...updateData,
      updatedAt: new Date()
    }, {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        occupation: true,
        dietaryRestrictions: true,
        allergies: true,
        favoriteCuisines: true,
        cookingSkillLevel: true,
        householdSize: true,
        weeklyBudget: true,
        nutritionalGoals: true,
        notifications: true,
        profileVisibility: true,
        shareRecipes: true,
        dataSharing: true,
        analytics: true,
        thirdPartyIntegrations: true,
        updatedAt: true
      }
    });

    // Invalidate related caches
    await enhancedCache.invalidatePattern(`user:${user.id}:*`);
    await enhancedCache.invalidatePattern(`meal-plan:${user.id}:*`);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error: unknown) {
    logger.error('Error updating user profile:', 'API:route', error);
    
    if (error instanceof MealPlanningError) {
      return NextResponse.json(
        { error: error.userMessage || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validateAndPrepareGeneralData(data: any) {
  const errors: string[] = [];

  // Validate required fields
  if (!data.name?.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!data.email?.trim()) {
    errors.push('El email es requerido');
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('El email no es válido');
  }

  // Validate phone format if provided
  if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
    errors.push('El teléfono no es válido');
  }

  // Validate date of birth if provided
  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13 || age > 120) {
      errors.push('La edad debe estar entre 13 y 120 años');
    }
  }

  if (errors.length > 0) {
    throw new MealPlanningError(
      'Validation failed',
      MealPlanningErrorCodes.VALIDATION_FAILED,
      { errors },
      errors.join(', ')
    );
  }

  return {
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone?.trim() || null,
    bio: data.bio?.trim() || null,
    location: data.location?.trim() || null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    gender: data.gender || null,
    occupation: data.occupation?.trim() || null
  };
}

async function validateAndPreparePreferencesData(data: any, userId: string) {
  try {
    // Validate using Zod schema
    const preferencesData = {
      userId,
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergies: data.allergies || [],
      favoriteCuisines: data.favoriteCuisines || [],
      cookingSkillLevel: data.cookingSkillLevel || 'intermediate',
      householdSize: data.householdSize || 2,
      weeklyBudget: data.weeklyBudget || 1000,
      nutritionalGoals: data.nutritionalGoals || {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67
      }
    };

    const validatedData = UserPreferencesSchema.parse(preferencesData);

    // Additional business logic validation
    if (validatedData.householdSize < 1 || validatedData.householdSize > 10) {
      throw new Error('El tamaño del hogar debe estar entre 1 y 10 personas');
    }

    if (validatedData.weeklyBudget < 500 || validatedData.weeklyBudget > 10000) {
      throw new Error('El presupuesto semanal debe estar entre $500 y $10,000');
    }

    return {
      dietaryRestrictions: validatedData.dietaryRestrictions,
      allergies: validatedData.allergies,
      favoriteCuisines: validatedData.favoriteCuisines,
      cookingSkillLevel: validatedData.cookingSkillLevel,
      householdSize: validatedData.householdSize,
      weeklyBudget: validatedData.weeklyBudget,
      nutritionalGoals: validatedData.nutritionalGoals
    };

  } catch (error: unknown) {
    if (error.errors) {
      const errorMessages = error.errors.map((err: any) => err.message);
      throw new MealPlanningError(
        'Preferences validation failed',
        MealPlanningErrorCodes.VALIDATION_FAILED,
        { errors: errorMessages },
        errorMessages.join(', ')
      );
    }

    throw new MealPlanningError(
      'Preferences validation failed',
      MealPlanningErrorCodes.VALIDATION_FAILED,
      { error: error.message },
      error.message
    );
  }
}

async function validateAndPrepareNotificationsData(data: any) {
  // Validate notifications structure
  const notifications = data.notifications || {};
  
  const validatedNotifications = {
    mealReminders: Boolean(notifications.mealReminders),
    shoppingReminders: Boolean(notifications.shoppingReminders),
    recipeRecommendations: Boolean(notifications.recipeRecommendations),
    weeklyPlanning: Boolean(notifications.weeklyPlanning),
    emailUpdates: Boolean(notifications.emailUpdates),
    pushNotifications: Boolean(notifications.pushNotifications),
    marketingEmails: Boolean(notifications.marketingEmails)
  };

  return {
    notifications: validatedNotifications
  };
}

async function validateAndPreparePrivacyData(data: any) {
  const privacy = data.privacy || {};
  
  // Validate profile visibility
  const validVisibilityOptions = ['private', 'friends', 'public'];
  if (privacy.profileVisibility && !validVisibilityOptions.includes(privacy.profileVisibility)) {
    throw new MealPlanningError(
      'Invalid profile visibility',
      MealPlanningErrorCodes.VALIDATION_FAILED,
      { profileVisibility: privacy.profileVisibility },
      'Opción de visibilidad inválida'
    );
  }

  return {
    profileVisibility: privacy.profileVisibility || 'private',
    shareRecipes: Boolean(privacy.shareRecipes),
    dataSharing: Boolean(privacy.dataSharing),
    analytics: Boolean(privacy.analytics),
    thirdPartyIntegrations: Boolean(privacy.thirdPartyIntegrations)
  };
}