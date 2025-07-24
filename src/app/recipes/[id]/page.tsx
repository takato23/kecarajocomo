import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat,
  Star,
  Heart,
  Share2,
  Edit,
  Trash2,
  Sparkles
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      ingredients: {
        include: {
          ingredient: true
        }
      },
      nutritionInfo: true,
      ratings: {
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      },
      _count: {
        select: {
          favorites: true,
          ratings: true
        }
      }
    }
  });

  if (!recipe || (!recipe.isPublic && recipe.authorId !== session?.user?.id)) {
    notFound();
  }

  const isOwner = session?.user?.id === recipe.authorId;
  const averageRating = recipe.ratings.length > 0
    ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
    : 0;

  const difficultyColor = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800"
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
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recipe Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                  {recipe.description && (
                    <p className="text-gray-600">{recipe.description}</p>
                  )}
                </div>
                {recipe.source === "ai" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {recipe.author.image ? (
                    <Image
                      src={recipe.author.image}
                      alt={recipe.author.name || ""}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  )}
                  <span>by {recipe.author.name || "Anonymous"}</span>
                </div>
                <span>•</span>
                <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Metrics */}
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4 text-gray-400" />
                  <span className={`text-sm px-2 py-0.5 rounded-full ${difficultyColor[recipe.difficulty]}`}>
                    {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                  </span>
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {averageRating.toFixed(1)} ({recipe._count.ratings})
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {recipe.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Recipe Image */}
            {recipe.imageUrl && (
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Instructions */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-gray-700">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <Heart className="mr-2 h-4 w-4" />
                    Add to Favorites
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.ingredient.name}
                        {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Nutrition */}
            {recipe.nutritionInfo && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Nutrition Per Serving</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Calories</span>
                      <span className="font-medium">{recipe.nutritionInfo.calories}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-medium">{recipe.nutritionInfo.protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Carbs</span>
                      <span className="font-medium">{recipe.nutritionInfo.carbs}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fat</span>
                      <span className="font-medium">{recipe.nutritionInfo.fat}g</span>
                    </div>
                    {recipe.nutritionInfo.fiber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fiber</span>
                        <span className="font-medium">{recipe.nutritionInfo.fiber}g</span>
                      </div>
                    )}
                    {recipe.nutritionInfo.sodium && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sodium</span>
                        <span className="font-medium">{recipe.nutritionInfo.sodium}mg</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}