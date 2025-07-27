"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { IOS26Provider } from "@/components/ios26";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <ProfileProvider>
            <IOS26Provider>
              {children}
            </IOS26Provider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toaster richColors closeButton />
    </>
  );
}