'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { signIn, signInWithGoogle, signInWithGitHub } from '@/lib/supabase/client';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { SocialAuthButtons } from '@/features/auth/components/SocialAuthButtons';

import { useUser, useUserActions } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await signIn(email, password);
      if (user) {
        setUser(user);
        router.push('/app');
      }
    } catch (err: unknown) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
    } catch (err: unknown) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <AuthForm
          mode="login"
          onSubmit={handleEmailLogin}
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
              onGoogleClick={() => handleSocialLogin('google')}
              onGitHubClick={() => handleSocialLogin('github')}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-lime-600 hover:text-lime-500 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </motion.div>
  );
}