import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Google,
    process.env.NODE_ENV === "development"
      ? Credentials({
          name: "Test Login (Dev Only)",
          credentials: {
            username: { label: "Username", type: "text" },
          },
          async authorize(credentials) {
            if (credentials.username === "test") {
              return {
                id: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
              };
            }
            return null;
          },
        })
      : ({} as any),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
