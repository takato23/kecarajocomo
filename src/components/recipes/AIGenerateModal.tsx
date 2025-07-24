"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  X, 
  Plus,
  Loader2,
  ChefHat,
  Clock,
  Users,
  Utensils
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Chinese", "Japanese", "Indian", 
  "French", "Thai", "Mediterranean", "American", "Korean"
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", 
  "Keto", "Paleo", "Low-Carb", "Nut-Free"
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIGenerateModal({ isOpen, onClose }: AIGenerateModalProps) {
  const router = useRouter();
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
      onClose();
    } catch (error: unknown) {
      console.error("Error generating recipe:", error);
      alert("Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recipe Generator
          </DialogTitle>
          <DialogDescription>
            Tell me what you'd like to cook and I'll create a custom recipe for you!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Ingredients */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Ingredients (optional)
            </Label>
            <p className="text-sm text-gray-500">
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
                size="sm"
                onClick={handleAddIngredient}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>
          </div>

          {/* Cuisine & Meal Type */}
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

          {/* Dietary Preferences */}
          <div>
            <Label>Dietary Preferences</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DIETARY_OPTIONS.map(option => (
                <Badge
                  key={option}
                  variant={params.dietary.includes(option) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleDietary(option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Settings */}
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

          {/* Additional Preferences */}
          <div>
            <Label htmlFor="preferences">Additional Preferences</Label>
            <textarea
              id="preferences"
              placeholder="e.g., kid-friendly, spicy, one-pot meal, no oven required..."
              value={params.preferences}
              onChange={(e) => setParams({ ...params, preferences: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
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
      </DialogContent>
    </Dialog>
  );
}