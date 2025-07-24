'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar,
  Clock,
  ChefHat,
  Utensils,
  Flame,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Mock data for charts
const weeklyMealsData = [
  { day: 'Mon', meals: 3, recipes: 2 },
  { day: 'Tue', meals: 2, recipes: 1 },
  { day: 'Wed', meals: 3, recipes: 2 },
  { day: 'Thu', meals: 3, recipes: 3 },
  { day: 'Fri', meals: 2, recipes: 1 },
  { day: 'Sat', meals: 3, recipes: 2 },
  { day: 'Sun', meals: 2, recipes: 2 },
];

const mealTypeData = [
  { name: 'Breakfast', value: 25, color: '#f59e0b' },
  { name: 'Lunch', value: 35, color: '#22c55e' },
  { name: 'Dinner', value: 30, color: '#a855f7' },
  { name: 'Snacks', value: 10, color: '#3b82f6' },
];

const topIngredients = [
  { name: 'Tomatoes', count: 12, icon: '🍅' },
  { name: 'Garlic', count: 10, icon: '🧄' },
  { name: 'Onions', count: 9, icon: '🧅' },
  { name: 'Olive Oil', count: 8, icon: '🫒' },
  { name: 'Basil', count: 7, icon: '🌿' },
];

const recentMeals = [
  { id: '1', name: 'Spaghetti Carbonara', date: 'Today', time: 'Dinner', rating: 5 },
  { id: '2', name: 'Greek Salad', date: 'Today', time: 'Lunch', rating: 4 },
  { id: '3', name: 'Avocado Toast', date: 'Today', time: 'Breakfast', rating: 4 },
  { id: '4', name: 'Chicken Stir-fry', date: 'Yesterday', time: 'Dinner', rating: 5 },
  { id: '5', name: 'Caesar Salad', date: 'Yesterday', time: 'Lunch', rating: 3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-glass-heavy backdrop-blur-md p-3 rounded-lg border border-white/10">
        <p className="text-sm font-medium text-glass-strong">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-glass-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ActivitySection() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  return (
    <div className="space-y-6">
      {/* Cooking Analytics Header */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-strong flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cooking Analytics
          </h2>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList className="bg-glass-medium">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-glass-medium backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <ChefHat className="w-5 h-5 text-food-warm" />
              <TrendingUp className="w-4 h-4 text-food-fresh" />
            </div>
            <div className="text-2xl font-semibold text-glass-strong">18</div>
            <div className="text-xs text-glass-medium">Total Meals</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-glass-medium backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-food-golden" />
              <span className="text-xs text-glass-medium">avg</span>
            </div>
            <div className="text-2xl font-semibold text-glass-strong">32m</div>
            <div className="text-xs text-glass-medium">Cook Time</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-glass-medium backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-food-warm" />
              <span className="text-xs font-semibold text-food-warm">5</span>
            </div>
            <div className="text-2xl font-semibold text-glass-strong">85%</div>
            <div className="text-xs text-glass-medium">Consistency</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-glass-medium backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-food-rich" />
              <span className="text-xs text-glass-medium">new</span>
            </div>
            <div className="text-2xl font-semibold text-glass-strong">7</div>
            <div className="text-xs text-glass-medium">Recipes Tried</div>
          </motion.div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Meals Chart */}
        <Card className="glass-subtle backdrop-blur-sm p-6">
          <h3 className="text-base font-semibold text-glass-strong mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyMealsData}>
                <defs>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRecipes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="meals"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorMeals)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="recipes"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorRecipes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Meal Distribution Chart */}
        <Card className="glass-subtle backdrop-blur-sm p-6">
          <h3 className="text-base font-semibold text-glass-strong mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Meal Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Ingredients */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-glass-strong mb-4 flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          Top Ingredients Used
        </h3>
        <div className="space-y-3">
          {topIngredients.map((ingredient, index) => (
            <motion.div
              key={ingredient.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <span className="text-2xl">{ingredient.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-glass-strong">
                    {ingredient.name}
                  </span>
                  <span className="text-sm text-glass-medium">
                    {ingredient.count}x
                  </span>
                </div>
                <div className="h-2 bg-glass-medium rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(ingredient.count / 12) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="h-full bg-gradient-to-r from-food-warm to-food-golden rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Recipe History */}
      <Card className="glass-subtle backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-glass-strong flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recipe History
          </h3>
          <Button variant="ghost" size="sm" className="text-glass-medium">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {recentMeals.map((meal, index) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-4 p-3',
                'bg-glass-medium backdrop-blur-sm rounded-lg',
                'border border-white/10',
                'hover:bg-glass-heavy transition-colors'
              )}
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-glass-strong">
                  {meal.name}
                </div>
                <div className="text-xs text-glass-medium">
                  {meal.date} • {meal.time}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-xs',
                      i < meal.rating ? 'text-food-golden' : 'text-glass-medium opacity-30'
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}