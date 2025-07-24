'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles, Calendar, Book, ShoppingCart } from 'lucide-react';

import { useOnboardingStore } from '../../store/onboardingStore';

export function CompletionStep() {
  const router = useRouter();
  const { completeOnboarding, isLoading } = useOnboardingStore();

  useEffect(() => {
    const handleCompletion = async () => {
      try {
        await completeOnboarding();
        // Redirect after a short delay to show the completion animation
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error: unknown) {
        console.error('Failed to complete onboarding:', error);
      }
    };

    handleCompletion();
  }, [completeOnboarding, router]);

  const nextSteps = [
    {
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      title: 'Create Your First Meal Plan',
      description: 'Generate a personalized weekly meal plan with AI',
      action: 'Plan This Week',
    },
    {
      icon: <Book className="h-6 w-6 text-green-600" />,
      title: 'Explore Recipes',
      description: 'Discover thousands of recipes tailored to your preferences',
      action: 'Browse Recipes',
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-purple-600" />,
      title: 'Generate Shopping Lists',
      description: 'Get optimized grocery lists based on your meal plans',
      action: 'Create List',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Completing Your Setup...
        </h2>
        <p className="text-gray-600">
          We're finalizing your personalized meal planning experience
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Welcome to kecarajocomer!
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Your personalized meal planning journey starts now
        </p>
      </div>

      {/* Completion Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 mb-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">
            You're All Set!
          </h2>
        </div>
        <p className="text-gray-700 mb-6">
          We've configured your account with your preferences, dietary needs, and pantry items. 
          Our AI is now ready to create personalized meal plans just for you.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">Profile Complete</div>
            <div className="text-gray-600">Preferences and dietary needs saved</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">Pantry Stocked</div>
            <div className="text-gray-600">Your ingredients are ready for meal planning</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">AI Ready</div>
            <div className="text-gray-600">Personalized suggestions are being prepared</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Here's what you can do next:
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-gray-600 text-sm mb-4">{step.description}</p>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                {step.action} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips & Encouragement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h4 className="font-semibold text-blue-900 mb-3">💡 Pro Tips for Getting Started</h4>
        <div className="text-left space-y-2 text-sm text-blue-800">
          <p>• Start with a simple weekly plan to get familiar with the interface</p>
          <p>• Rate meals you try to improve future AI suggestions</p>
          <p>• Update your pantry regularly for the most accurate recommendations</p>
          <p>• Explore different cuisines to expand your culinary horizons</p>
        </div>
      </div>

      {/* Auto-redirect notice */}
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-4">
          Taking you to your dashboard in a moment...
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}