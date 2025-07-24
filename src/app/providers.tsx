"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <AuthProvider>
        <ProfileProvider>
          <iOS26Provider>
            {children}
          </iOS26Provider>
        </ProfileProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ProfileProvider>
        <iOS26Provider>
          {children}
        </iOS26Provider>
      </ProfileProvider>
    </AuthProvider>
  );
}