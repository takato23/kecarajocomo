/**
 * Client-side Validation Utilities
 * Form validation, real-time validation, and client-side error handling
 */

import { z } from 'zod';
import React, { useState, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';
import { 
  FormErrors, 
  zodErrorsToFormErrors, 
  validateFormData,
  RecipeCreateSchema,
  RecipeUpdateSchema,
  UserPreferencesSchema,
  PantryItemSchema,
  MealPlanCreateSchema,
  ShoppingListSchema,
  AIGenerationSchema
} from './schemas';

// =============================================================================
// FORM VALIDATION HOOK
// =============================================================================

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (errors: FormErrors<T>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface UseFormValidationReturn<T> {
  data: Partial<T>;
  errors: FormErrors<T>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  touchedFields: Set<keyof T>;
  
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateAll: () => Promise<boolean>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  handleBlur: (field: keyof T) => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasFieldError: (field: keyof T) => boolean;
  isFieldTouched: (field: keyof T) => boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  onError,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [data, setData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  // Debounced validation
  const [validationTimeouts, setValidationTimeouts] = useState<Map<keyof T, NodeJS.Timeout>>(new Map());

  const isValid = Object.keys(errors).length === 0;

  const setValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    if (validateOnChange) {
      // Clear existing timeout
      const existingTimeout = validationTimeouts.get(field);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        validateField(field);
      }, debounceMs);
      
      setValidationTimeouts(prev => new Map(prev).set(field, timeout));
    }
  }, [validateOnChange, debounceMs, validationTimeouts]);

  const setValues = useCallback((values: Partial<T>) => {
    setData(prev => ({ ...prev, ...values }));
    setIsDirty(true);
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: [error] }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    try {
      const fieldSchema = schema.shape[field];
      if (!fieldSchema) return true;
      
      fieldSchema.parse(data[field]);
      clearError(field);
      return true;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors = zodErrorsToFormErrors(error);
        setError(field, fieldErrors[field as string]?.[0] || 'Invalid value');
      }
      return false;
    }
  }, [schema, data, clearError, setError]);

  const validateAll = useCallback(async (): Promise<boolean> => {
    const result = validateFormData(schema, data);
    
    if (result.errors) {
      setErrors(result.errors);
      return false;
    }
    
    clearErrors();
    return true;
  }, [schema, data, clearErrors]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    
    try {
      const isValid = await validateAll();
      
      if (!isValid) {
        onError?.(errors);
        return;
      }
      
      await onSubmit(data as T);
      setIsDirty(false);
    } catch (error: unknown) {
      logger.error('Form submission error:', 'Lib:client', error);
      
      if (error instanceof z.ZodError) {
        const formErrors = zodErrorsToFormErrors(error);
        setErrors(formErrors);
        onError?.(formErrors);
      } else {
        const generalError = { _form: ['An unexpected error occurred'] };
        setErrors(generalError);
        onError?.(generalError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, onSubmit, onError, data, errors]);

  const handleReset = useCallback(() => {
    setData({});
    setErrors({});
    setIsDirty(false);
    setTouchedFields(new Set());
    
    // Clear all timeouts
    validationTimeouts.forEach(timeout => clearTimeout(timeout));
    setValidationTimeouts(new Map());
  }, [validationTimeouts]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(field));
    
    if (validateOnBlur) {
      validateField(field);
    }
  }, [validateOnBlur, validateField]);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field]?.[0];
  }, [errors]);

  const hasFieldError = useCallback((field: keyof T): boolean => {
    return Boolean(errors[field]?.length);
  }, [errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touchedFields.has(field);
  }, [touchedFields]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      validationTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [validationTimeouts]);

  return {
    data,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    touchedFields,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    validateField,
    validateAll,
    handleSubmit,
    handleReset,
    handleBlur,
    getFieldError,
    hasFieldError,
    isFieldTouched,
  };
}

// =============================================================================
// SPECIFIC FORM VALIDATION HOOKS
// =============================================================================

export function useRecipeFormValidation(
  onSubmit: (data: z.infer<typeof RecipeCreateSchema>) => Promise<void>,
  isUpdate = false
) {
  const schema = isUpdate ? RecipeUpdateSchema : RecipeCreateSchema;
  return useFormValidation({
    schema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500,
  });
}

export function useUserPreferencesFormValidation(
  onSubmit: (data: z.infer<typeof UserPreferencesSchema>) => Promise<void>
) {
  return useFormValidation({
    schema: UserPreferencesSchema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });
}

export function usePantryItemFormValidation(
  onSubmit: (data: z.infer<typeof PantryItemSchema>) => Promise<void>
) {
  return useFormValidation({
    schema: PantryItemSchema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });
}

export function useMealPlanFormValidation(
  onSubmit: (data: z.infer<typeof MealPlanCreateSchema>) => Promise<void>
) {
  return useFormValidation({
    schema: MealPlanCreateSchema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });
}

export function useShoppingListFormValidation(
  onSubmit: (data: z.infer<typeof ShoppingListSchema>) => Promise<void>
) {
  return useFormValidation({
    schema: ShoppingListSchema,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
  });
}

export function useAIGenerationFormValidation(
  onSubmit: (data: z.infer<typeof AIGenerationSchema>) => Promise<void>
) {
  return useFormValidation({
    schema: AIGenerationSchema,
    onSubmit,
    validateOnChange: false, // AI generation forms might be complex
    validateOnBlur: true,
  });
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validateEmailAsync(email: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      resolve(emailRegex.test(email));
    }, 300); // Simulate async validation
  });
}

export function validateUniqueUsername(username: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate API call to check username availability
      const unavailableUsernames = ['admin', 'user', 'test', 'demo'];
      resolve(!unavailableUsernames.includes(username.toLowerCase()));
    }, 500);
  });
}

export function validateRecipeTitle(title: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate checking for duplicate recipe titles
      resolve(title.length >= 3 && title.length <= 200);
    }, 300);
  });
}

export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

// =============================================================================
// FIELD VALIDATION RULES
// =============================================================================

export const fieldValidationRules = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: (password: string) => 
    z.string().refine((val) => val === password, 'Passwords do not match'),
  url: z.string().url('Invalid URL format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be zero or positive'),
  requiredString: z.string().min(1, 'This field is required'),
  optionalString: z.string().optional(),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code'),
  date: z.date(),
  futureDate: z.date().refine((date) => date > new Date(), 'Date must be in the future'),
  pastDate: z.date().refine((date) => date < new Date(), 'Date must be in the past'),
};

// =============================================================================
// FORM FIELD COMPONENTS HELPERS
// =============================================================================

export interface FormFieldProps {
  error?: string;
  touched?: boolean;
  required?: boolean;
  onBlur?: () => void;
  onChange?: (value: any) => void;
}

export function getFieldProps<T>(
  validation: UseFormValidationReturn<T>,
  field: keyof T
): FormFieldProps {
  return {
    error: validation.getFieldError(field),
    touched: validation.isFieldTouched(field),
    onBlur: () => validation.handleBlur(field),
    onChange: (value: any) => validation.setValue(field, value),
  };
}

export function createFormComponent<T>(
  validation: UseFormValidationReturn<T>,
  field: keyof T,
  Component: React.ComponentType<any>
) {
  return function FormField(props: any) {
    const fieldProps = getFieldProps(validation, field);
    
    return (
      <Component
        {...props}
        {...fieldProps}
        value={validation.data[field] || ''}
        className={`${props.className || ''} ${fieldProps.error ? 'border-red-500' : ''}`}
      />
    );
  };
}

// =============================================================================
// VALIDATION CONTEXT
// =============================================================================

export interface ValidationContextValue {
  validateEmail: (email: string) => Promise<boolean>;
  validateUsername: (username: string) => Promise<boolean>;
  validateRecipeTitle: (title: string) => Promise<boolean>;
  validateImageUrl: (url: string) => Promise<boolean>;
}

export const ValidationContext = React.createContext<ValidationContextValue>({
  validateEmail: validateEmailAsync,
  validateUsername: validateUniqueUsername,
  validateRecipeTitle: validateRecipeTitle,
  validateImageUrl: validateImageUrl,
});

export function useValidation() {
  const context = React.useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
}

// =============================================================================
// VALIDATION PROVIDER
// =============================================================================

export function ValidationProvider({ 
  children,
  customValidators = {}
}: {
  children: React.ReactNode;
  customValidators?: Partial<ValidationContextValue>;
}) {
  const value: ValidationContextValue = {
    validateEmail: validateEmailAsync,
    validateUsername: validateUniqueUsername,
    validateRecipeTitle: validateRecipeTitle,
    validateImageUrl: validateImageUrl,
    ...customValidators,
  };

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
}