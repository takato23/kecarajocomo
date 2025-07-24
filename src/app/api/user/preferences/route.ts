import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
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
        userId: session.user.id,
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
        userId: session.user.id,
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
    });

    // Update user's onboarding status
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: "Preferences saved successfully",
      preferences,
    });
  } catch (error: unknown) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}