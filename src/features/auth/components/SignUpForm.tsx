'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check } from 'lucide-react';

import { useAppStore } from '@/store';
import { SignUpFormData } from '../types';

export function SignUpForm() {
  const router = useRouter();
  const isLoading = useAppStore((state) => state.user.isLoading);
  const setAuthLoading = useAppStore((state) => state.setAuthLoading);
  const setUser = useAppStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 1) feedback = 'Weak';
    else if (score <= 3) feedback = 'Medium';
    else feedback = 'Strong';

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    calculatePasswordStrength(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    try {
      setAuthLoading(true);
      
      // Here you would typically call your auth service
      // For now, simulating a signup with mock user data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Mock successful authentication
      const mockUser = {
        id: Date.now().toString(),
        email: formData.email,
        name: formData.name,
        avatar: '',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      setUser(mockUser);
      router.push('/onboarding');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Sign up failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && 
    formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.confirmPassword && 
    formData.password !== formData.confirmPassword;

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Start your journey to better meal planning
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1 relative">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pl-10 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="John Doe"
              />
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pl-10 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.score <= 1 ? 'text-red-600' :
                    passwordStrength.score <= 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score <= 1 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`block w-full appearance-none rounded-lg border px-3 py-2 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm ${
                  passwordsDontMatch 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : passwordsMatch
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {passwordsMatch && (
                <Check className="absolute right-10 top-2.5 h-5 w-5 text-green-500" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {passwordsDontMatch && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="accept-terms" className="text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.acceptTerms || passwordsDontMatch || passwordStrength.score < 2}
          className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}