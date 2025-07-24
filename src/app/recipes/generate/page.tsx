"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Sparkles, 
  X, 
  Plus,
  Loader2,
  ChefHat,
  Clock,
  Users,
  Utensils
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian", 
  "French", "Thai", "Mediterranean", "American", "Korean"
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", 
  "Keto", "Paleo", "Low-Carb", "Nut-Free"
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

export default function GenerateRecipePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [params, setParams] = useState({
    cuisine: "",
    dietary: [] as string[],
    difficulty: "medium" as "easy" | "medium" | "hard",
    servings: 4,
    maxCookTime: 60,
    mealType: "",
    preferences: ""
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const toggleDietary = (option: string) => {
    setParams(prev => ({
      ...prev,
      dietary: prev.dietary.includes(option)
        ? prev.dietary.filter(d => d !== option)
        : [...prev.dietary, option]
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          ingredients: ingredients.filter(ing => ing.trim() !== "")
        }),
      });

      if (!response.ok) throw new Error("Failed to generate recipe");

      const recipe = await response.json();
      router.push(`/recipes/${recipe.id}`);
    } catch (error: unknown) {
      console.error("Error generating recipe:", error);
      alert("Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/recipes">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Recipes
                </Button>
              </Link>
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Recipe Generator</h1>
          <p className="text-gray-600">
            Tell me what you'd like to cook and I'll create a custom recipe for you!
          </p>
        </div>

        <div className="space-y-6">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Ingredients (optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Have specific ingredients you want to use? Add them here.
              </p>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., chicken breast, tomatoes"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={ingredients.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddIngredient}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ingredient
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cuisine & Meal Type */}
          <Card>
            <CardHeader>
              <CardTitle>Cuisine & Meal Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cuisine">Cuisine Type</Label>
                  <select
                    id="cuisine"
                    value={params.cuisine}
                    onChange={(e) => setParams({ ...params, cuisine: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Any cuisine</option>
                    {CUISINE_OPTIONS.map(cuisine => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="mealType">Meal Type</Label>
                  <select
                    id="mealType"
                    value={params.mealType}
                    onChange={(e) => setParams({ ...params, mealType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Any meal</option>
                    {MEAL_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dietary Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={params.dietary.includes(option) ? "default" : "outline"}
                    className="cursor-pointer py-2 px-3"
                    onClick={() => toggleDietary(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Recipe Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="difficulty" className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Difficulty
                  </Label>
                  <select
                    id="difficulty"
                    value={params.difficulty}
                    onChange={(e) => setParams({ ...params, difficulty: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="servings" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Servings
                  </Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    max="12"
                    value={params.servings}
                    onChange={(e) => setParams({ ...params, servings: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Max Time (min)
                  </Label>
                  <Input
                    id="maxTime"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={params.maxCookTime}
                    onChange={(e) => setParams({ ...params, maxCookTime: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="e.g., kid-friendly, spicy, one-pot meal, no oven required..."
                value={params.preferences}
                onChange={(e) => setParams({ ...params, preferences: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}