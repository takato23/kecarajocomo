/**
 * Validation System Export Index
 * Centralized exports for all validation utilities
 */

// Schemas and types
export * from './schemas';

// Middleware utilities
export * from './middleware';

// Client-side validation (disabled in stabilization phase)
// export * from './client';

// Common validation utilities
export const ValidationUtils = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Phone number validation
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  },

  // Strong password validation
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },

  // Credit card validation (Luhn algorithm)
  isValidCreditCard: (cardNumber: string): boolean => {
    const num = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let alternate = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num.charAt(i), 10);
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  },

  // UUID validation
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Sanitize HTML input
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Validate file size
  isValidFileSize: (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },

  // Validate image file type
  isValidImageType: (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  },

  // Validate ingredient name
  isValidIngredientName: (name: string): boolean => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-Z\s\-']+$/.test(trimmed);
  },

  // Validate recipe title
  isValidRecipeTitle: (title: string): boolean => {
    const trimmed = title.trim();
    return trimmed.length >= 3 && trimmed.length <= 200;
  },

  // Validate cooking time
  isValidCookingTime: (minutes: number): boolean => {
    return Number.isInteger(minutes) && minutes >= 0 && minutes <= 480;
  },

  // Validate servings
  isValidServings: (servings: number): boolean => {
    return Number.isInteger(servings) && servings >= 1 && servings <= 50;
  },

  // Validate nutritional value
  isValidNutritionValue: (value: number): boolean => {
    return typeof value === 'number' && value >= 0 && value <= 10000;
  },

  // Validate date range
  isValidDateRange: (startDate: Date, endDate: Date): boolean => {
    return startDate <= endDate;
  },

  // Validate price
  isValidPrice: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && price <= 999999;
  },

  // Validate quantity
  isValidQuantity: (quantity: number): boolean => {
    return typeof quantity === 'number' && quantity > 0 && quantity <= 10000;
  },

  // Validate rating
  isValidRating: (rating: number): boolean => {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
  },

  // Validate zip code
  isValidZipCode: (zipCode: string): boolean => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  },

  // Validate barcode
  isValidBarcode: (barcode: string): boolean => {
    const barcodeRegex = /^[0-9]{8,13}$/;
    return barcodeRegex.test(barcode);
  },

  // Validate hex color
  isValidHexColor: (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  },

  // Validate JSON string
  isValidJSON: (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },

  // Validate coordinates
  isValidCoordinates: (lat: number, lng: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  },

  // Validate age
  isValidAge: (age: number): boolean => {
    return Number.isInteger(age) && age >= 0 && age <= 150;
  },

  // Validate temperature
  isValidTemperature: (temp: number): boolean => {
    return typeof temp === 'number' && temp >= -273.15 && temp <= 1000;
  },

  // Validate percentage
  isValidPercentage: (percentage: number): boolean => {
    return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
  },

  // Validate duration in minutes
  isValidDurationMinutes: (minutes: number): boolean => {
    return Number.isInteger(minutes) && minutes >= 0 && minutes <= 1440; // Max 24 hours
  },

  // Validate social media handle
  isValidSocialHandle: (handle: string): boolean => {
    const socialRegex = /^[a-zA-Z0-9_]{1,30}$/;
    return socialRegex.test(handle);
  },

  // Validate username
  isValidUsername: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  },

  // Validate slug
  isValidSlug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  },
};

// Export validation constants
export const ValidationConstants = {
  MAX_FILE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_RECIPE_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_INGREDIENT_NAME_LENGTH: 100,
  MAX_INSTRUCTION_LENGTH: 1000,
  MAX_NOTES_LENGTH: 200,
  MAX_SERVINGS: 50,
  MAX_PREP_TIME_MINUTES: 480,
  MAX_COOK_TIME_MINUTES: 480,
  MIN_PASSWORD_LENGTH: 8,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 50,
  MAX_HOUSEHOLD_SIZE: 20,
  MAX_BUDGET: 1000,
  MAX_CALORIES: 5000,
  MAX_PROTEIN: 500,
  MAX_CARBS: 500,
  MAX_FAT: 200,
  MAX_FIBER: 100,
  MAX_SUGAR: 200,
  MAX_SODIUM: 5000,
  MAX_CHOLESTEROL: 1000,
  MAX_QUANTITY: 10000,
  MAX_PRICE: 999999,
  MAX_RATING: 5,
  MIN_RATING: 1,
  MAX_COMMENT_LENGTH: 500,
  MAX_PANTRY_ITEMS: 1000,
  MAX_MEAL_PLAN_ITEMS: 100,
  MAX_SHOPPING_LIST_ITEMS: 200,
  MAX_RECIPE_INGREDIENTS: 50,
  MAX_RECIPE_INSTRUCTIONS: 30,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg'],
  CUISINE_TYPES: [
    'italiana', 'mexicana', 'asiática', 'mediterránea', 'argentina', 
    'española', 'francesa', 'tailandesa', 'india', 'japonesa', 
    'china', 'peruana', 'brasileña'
  ],
  DIFFICULTY_LEVELS: ['beginner', 'intermediate', 'advanced'],
  MEAL_TYPES: ['breakfast', 'lunch', 'dinner', 'snack'],
  DIETARY_RESTRICTIONS: [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 
    'paleo', 'low-carb', 'mediterranean', 'low-sodium', 
    'diabetic-friendly', 'heart-healthy'
  ],
  COMMON_ALLERGENS: [
    'nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 'dairy', 
    'gluten', 'soy', 'sesame'
  ],
  UNITS_OF_MEASUREMENT: [
    'tsp', 'tbsp', 'cup', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 
    'piece', 'slice', 'clove', 'bunch', 'can', 'jar', 'bottle'
  ],
  PANTRY_LOCATIONS: [
    'refrigerator', 'freezer', 'pantry', 'cabinet', 'counter', 
    'basement', 'garage', 'other'
  ],
  PRIORITY_LEVELS: ['high', 'medium', 'low'],
  COOKING_SKILL_LEVELS: ['beginner', 'intermediate', 'advanced'],
  PLANNING_STRATEGIES: [
    'budget-focused', 'nutrition-focused', 'time-focused', 
    'variety-focused', 'pantry-focused'
  ],
};

// Export validation error messages
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_DATE_RANGE: 'End date must be after start date',
  INVALID_NUMBER: 'Please enter a valid number',
  INVALID_POSITIVE_NUMBER: 'Please enter a positive number',
  INVALID_INTEGER: 'Please enter a whole number',
  INVALID_RANGE: 'Value is outside the allowed range',
  TOO_SHORT: 'Value is too short',
  TOO_LONG: 'Value is too long',
  INVALID_FORMAT: 'Invalid format',
  INVALID_CHOICE: 'Please select a valid option',
  FILE_TOO_LARGE: 'File size is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  INVALID_IMAGE_TYPE: 'Please select a valid image file',
  INVALID_CREDIT_CARD: 'Please enter a valid credit card number',
  INVALID_UUID: 'Invalid ID format',
  INVALID_COORDINATES: 'Invalid coordinates',
  INVALID_JSON: 'Invalid JSON format',
  INVALID_HEX_COLOR: 'Invalid color format',
  INVALID_BARCODE: 'Invalid barcode format',
  INVALID_ZIP_CODE: 'Invalid zip code format',
  INVALID_USERNAME: 'Username must be 3-30 characters, letters, numbers, and underscores only',
  INVALID_SLUG: 'Invalid slug format',
  INVALID_SOCIAL_HANDLE: 'Invalid social media handle',
  INVALID_AGE: 'Please enter a valid age',
  INVALID_TEMPERATURE: 'Invalid temperature value',
  INVALID_PERCENTAGE: 'Value must be between 0 and 100',
  INVALID_DURATION: 'Invalid duration',
  INVALID_RATING: 'Rating must be between 1 and 5',
  INVALID_QUANTITY: 'Invalid quantity',
  INVALID_PRICE: 'Invalid price',
  INVALID_INGREDIENT_NAME: 'Ingredient name must be 2-100 characters, letters only',
  INVALID_RECIPE_TITLE: 'Recipe title must be 3-200 characters',
  INVALID_COOKING_TIME: 'Cooking time must be 0-480 minutes',
  INVALID_SERVINGS: 'Servings must be 1-50',
  INVALID_NUTRITION_VALUE: 'Nutrition value must be 0-10000',
  DUPLICATE_ITEM: 'This item already exists',
  NETWORK_ERROR: 'Network error, please try again',
  SERVER_ERROR: 'Server error, please try again later',
  VALIDATION_ERROR: 'Validation error, please check your input',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Conflict with existing data',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please wait before trying again',
  INTERNAL_ERROR: 'Internal server error',
  MAINTENANCE_MODE: 'Service is temporarily unavailable for maintenance',
};

// Export validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  BARCODE: /^[0-9]{8,13}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  SOCIAL_HANDLE: /^[a-zA-Z0-9_]{1,30}$/,
  INGREDIENT_NAME: /^[a-zA-Z\s\-']+$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CREDIT_CARD: /^[0-9]{13,19}$/,
  JSON: /^[\[\{].*[\]\}]$/,
  COORDINATES: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  HTML_TAG: /<[^>]*>/g,
  SQL_INJECTION: /('|(\')|;|--|\/\*|\*\/|xp_|sp_)/i,
  XSS: /(<script[\s\S]*?<\/script>|<iframe[\s\S]*?<\/iframe>|javascript:|on\w+\s*=)/i,
};