// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../prisma/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // 2. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // Role defaults to REQUESTER based on our Prisma schema
      },
    });

    return NextResponse.json({ message: "User registered successfully", user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}