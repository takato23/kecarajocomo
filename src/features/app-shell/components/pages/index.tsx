// App Shell Page Components
export { DashboardPage } from './DashboardPage';

// Placeholder pages for other routes
export const PlannerPage = () => (
  <div className="min-h-full flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Meal Planner</h1>
      <p className="text-gray-600">Plan your weekly meals here</p>
    </div>
  </div>
);

export const RecipesPage = () => (
  <div className="min-h-full flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Recipes</h1>
      <p className="text-gray-600">Discover and manage your recipes</p>
    </div>
  </div>
);

export const PantryPage = () => (
  <div className="min-h-full flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Pantry</h1>
      <p className="text-gray-600">Manage your pantry inventory</p>
    </div>
  </div>
);

export const ShoppingPage = () => (
  <div className="min-h-full flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping</h1>
      <p className="text-gray-600">Your smart shopping lists</p>
    </div>
  </div>
);

export const ProfilePage = () => (
  <div className="min-h-full flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
      <p className="text-gray-600">Manage your profile and preferences</p>
    </div>
  </div>
);