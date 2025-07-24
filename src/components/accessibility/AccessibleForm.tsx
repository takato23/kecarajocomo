'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { generateId } from '@/lib/accessibility';


// Accessible Input Component
interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  srOnly?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, hint, srOnly = false, id, className, required, ...props }, ref) => {
    const inputId = id || generateId('input');
    const errorId = error ? generateId('error') : undefined;
    const hintId = hint ? generateId('hint') : undefined;

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId} 
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            srOnly && "sr-only"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </label>
        
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background file:border-0 file:bg-transparent",
            "file:text-sm file:font-medium placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, hintId)}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Textarea Component
interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  srOnly?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, hint, srOnly = false, id, className, required, ...props }, ref) => {
    const textareaId = id || generateId('textarea');
    const errorId = error ? generateId('error') : undefined;
    const hintId = hint ? generateId('hint') : undefined;

    return (
      <div className="space-y-2">
        <label 
          htmlFor={textareaId} 
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            srOnly && "sr-only"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </label>
        
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, hintId)}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Accessible Select Component
interface AccessibleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  srOnly?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, error, hint, srOnly = false, id, className, required, options, ...props }, ref) => {
    const selectId = id || generateId('select');
    const errorId = error ? generateId('error') : undefined;
    const hintId = hint ? generateId('hint') : undefined;

    return (
      <div className="space-y-2">
        <label 
          htmlFor={selectId} 
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            srOnly && "sr-only"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </label>
        
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, hintId)}
          aria-required={required}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

// Accessible Checkbox Component
interface AccessibleCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const checkboxId = id || generateId('checkbox');
    const errorId = error ? generateId('error') : undefined;
    const hintId = hint ? generateId('hint') : undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-primary",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={cn(errorId, hintId)}
            {...props}
          />
          <label 
            htmlFor={checkboxId} 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        </div>
        
        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground ml-6">
            {hint}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-destructive ml-6" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';