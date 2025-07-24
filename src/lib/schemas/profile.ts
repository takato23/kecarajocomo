import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string()
    .max(160, 'Bio must be less than 160 characters')
    .optional(),
  email: z.string()
    .email('Invalid email address'),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  householdSize: z.number()
    .min(1, 'Household size must be at least 1')
    .max(20, 'Household size must be less than 20'),
  weeklyBudget: z.number()
    .min(0, 'Budget must be a positive number')
    .max(10000, 'Budget seems too high. Please check the value')
    .optional(),
  defaultServingSize: z.number()
    .min(1, 'Serving size must be at least 1')
    .max(20, 'Serving size must be less than 20')
    .optional(),
  mealPlanningEnabled: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export const dietaryRestrictionsSchema = z.object({
  restrictions: z.array(z.string()).max(20, 'Too many dietary restrictions'),
  allergies: z.array(z.string()).max(20, 'Too many allergies'),
});

export const cuisinePreferencesSchema = z.object({
  cuisines: z.array(z.string())
    .min(1, 'Select at least one cuisine preference')
    .max(10, 'Too many cuisine preferences'),
  cookingSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  cookingTime: z.enum(['quick', 'balanced', 'gourmet']),
  equipment: z.array(z.string()).optional(),
});

export const householdMemberSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  age: z.number()
    .min(0, 'Age must be a positive number')
    .max(120, 'Please enter a valid age')
    .optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  preferences: z.string()
    .max(200, 'Preferences must be less than 200 characters')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type DietaryRestrictionsFormData = z.infer<typeof dietaryRestrictionsSchema>;
export type CuisinePreferencesFormData = z.infer<typeof cuisinePreferencesSchema>;
export type HouseholdMemberFormData = z.infer<typeof householdMemberSchema>;