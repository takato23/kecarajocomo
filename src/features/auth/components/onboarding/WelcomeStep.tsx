'use client';

import { ChefHat, Clock, Leaf, ShoppingCart, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-indigo-600" />,
      title: 'AI-Powered Meal Planning',
      description: 'Get personalized meal suggestions based on your preferences and dietary needs'
    },
    {
      icon: <Clock className="h-6 w-6 text-indigo-600" />,
      title: 'Save Time',
      description: 'Spend less time planning and more time enjoying delicious, healthy meals'
    },
    {
      icon: <Leaf className="h-6 w-6 text-indigo-600" />,
      title: 'Reduce Food Waste',
      description: 'Smart pantry management helps you use what you have and buy only what you need'
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-indigo-600" />,
      title: 'Optimized Shopping',
      description: 'Get organized shopping lists that save you money and trips to the store'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <ChefHat className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to kecarajocomer!
        </h1>
        <p className="text-lg text-gray-600">
          Let's set up your personalized meal planning experience in just a few minutes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                {feature.icon}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">What we'll set up:</h2>
        <ul className="space-y-2">
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</span>
            Your profile and basic information
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">2</span>
            Dietary preferences and restrictions
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">3</span>
            Cooking preferences and skill level
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">4</span>
            Nutritional goals (optional)
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">5</span>
            Your pantry basics
          </li>
          <li className="flex items-center text-sm text-gray-600">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">6</span>
            Your first AI-generated meal plan!
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
}