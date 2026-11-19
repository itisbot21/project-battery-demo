
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db } from "@/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Keep existing admin email/password login
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },

  // Google login for customers
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  } : {},

  // Keep existing admin functionality
  plugins: [admin()],
});