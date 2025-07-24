import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - KeCaraJoComer',
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-purple-50">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-lime-500 to-purple-500">
              <span className="text-2xl font-bold text-white">KC</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">KeCaraJoComer</h1>
            <p className="mt-2 text-gray-600">Your AI-powered cooking assistant</p>
          </div>
          
          {/* Auth Forms */}
          {children}
        </div>
      </div>
    </div>
  );
}