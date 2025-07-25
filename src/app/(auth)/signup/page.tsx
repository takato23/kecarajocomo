'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { signUp, signInWithGoogle, signInWithGitHub } from '@/lib/supabase/client';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { SocialAuthButtons } from '@/features/auth/components/SocialAuthButtons';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEmailSignUp = async (email: string, password: string, metadata?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await signUp(email, password, metadata);
      if (user) {
        setSuccess(true);
        // For email confirmation flow
        if (!user.email_confirmed_at) {
          // Show success message about email confirmation
          return;
        }
        // If email confirmation is disabled, redirect to profile setup
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
      // OAuth providers handle the redirect
    } catch (err: unknown) {
      setError(err.message || `Failed to sign up with ${provider}`);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent you a confirmation link. Please check your email to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 transition-all"
          >
            Back to login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <AuthForm
          mode="signup"
          onSubmit={handleEmailSignUp}
          isLoading={isLoading}
        />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <SocialAuthButtons
              onGoogleClick={() => handleSocialSignUp('google')}
              onGitHubClick={() => handleSocialSignUp('github')}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-lime-600 hover:text-lime-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}