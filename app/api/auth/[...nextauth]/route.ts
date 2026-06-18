// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "../../../../prisma/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  // Force JWT session strategy. This is required when using CredentialsProvider with Prisma.
  session: { strategy: "jwt" },
  
  providers: [
    // 1. Google Authentication
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),

    // 2. Custom Email/Password Authentication
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@company.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Find user in Neon DB
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // If no user, or user signed up with Google (no password)
        if (!user || !user.password) return null;

        // Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) return null;

        // Return user object if successful
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as any;
      }
    })
  ],
  callbacks: {
    // Inject the custom role into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    // Pass the role from the token into the active session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };