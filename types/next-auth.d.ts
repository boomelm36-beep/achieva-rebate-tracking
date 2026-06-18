// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

// 1. Tell NextAuth about our custom role and id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "REQUESTER" | "APPROVER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "REQUESTER" | "APPROVER";
  }
}

// 2. Tell the Prisma Adapter about our custom role!
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: "REQUESTER" | "APPROVER";
  }
}