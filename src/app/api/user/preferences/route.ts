import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { logger } from '@/lib/logger';

// authOptions removed - using Supabase Auth;
import { db } from '@/lib/supabase/database.service';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Update or create user preferences
    const preferences = await prisma.userPreferences.upsert({
      where: {
        userId: user.id,
      },
      update: {
        dietaryRestrictions: data.dietaryRestrictions || [],
        allergies: data.allergies || [],
        favoriteCuisines: data.favoriteCuisines || [],
        householdSize: data.householdSize || 1,
        cookingSkillLevel: data.cookingSkillLevel || "intermediate",
        preferredMealTypes: data.preferredMealTypes || [],
        avoidIngredients: data.avoidIngredients || [],
        calorieTarget: data.calorieTarget,
        proteinTarget: data.proteinTarget,
        carbTarget: data.carbTarget,
        fatTarget: data.fatTarget,
      },
      create: {
        userId: user.id,
        dietaryRestrictions: data.dietaryRestrictions || [],
        allergies: data.allergies || [],
        favoriteCuisines: data.favoriteCuisines || [],
        householdSize: data.householdSize || 1,
        cookingSkillLevel: data.cookingSkillLevel || "intermediate",
        preferredMealTypes: data.preferredMealTypes || [],
        avoidIngredients: data.avoidIngredients || [],
        calorieTarget: data.calorieTarget,
        proteinTarget: data.proteinTarget,
        carbTarget: data.carbTarget,
        fatTarget: data.fatTarget,
      });

    // Update user's onboarding status
    await db.updateUserProfile(user.id, {
      onboardingCompleted: true
    });

    return NextResponse.json({
      message: "Preferences saved successfully",
      preferences,
    });
  } catch (error: unknown) {
    logger.error("Error saving preferences:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: {
        userId: user.id
      });

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    logger.error("Error fetching preferences:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}