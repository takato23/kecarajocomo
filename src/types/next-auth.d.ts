import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    onboardingCompleted?: boolean;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      onboardingCompleted?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    onboardingCompleted?: boolean;
  }
}