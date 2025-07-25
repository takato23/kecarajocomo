"use client";

import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { iOS26Provider } from "@/components/ios26/iOS26Provider";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <ProfileProvider>
            <iOS26Provider>
              {children}
            </iOS26Provider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AuthProvider>
        <ProfileProvider>
          <iOS26Provider>
            {children}
          </iOS26Provider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}