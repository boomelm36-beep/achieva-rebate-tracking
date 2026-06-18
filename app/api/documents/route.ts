// app/api/documents/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient, DocStatus } from "../../../prisma/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET: Fetch all rebate tracking documents
export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// PATCH: Update document status (Approve / Reject workflows)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Safety check: Make sure user is logged in
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Safety check: Only an APPROVER can change statuses
    if (session.user.role !== "APPROVER") {
      return NextResponse.json({ error: "Forbidden: Only approvers can perform this action" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, rejectReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Enforce that a rejection MUST contain a reason
    if (status === "REJECTED" && (!rejectReason || rejectReason.trim() === "")) {
      return NextResponse.json({ error: "A reason is required to reject this document" }, { status: 400 });
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: status as DocStatus,
        rejectReason: status === "REJECTED" ? rejectReason : null,
      },
    });

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Database update transaction failed" }, { status: 500 });
  }
}

// POST: Create a new rebate tracking document
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Safety check: Make sure user is logged in
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, docNumber, amount, deadline } = body;

    // Validate incoming input fields
    if (!subject || !docNumber || !amount || !deadline) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Create the document linked to the currently logged-in user's ID
    const newDocument = await prisma.document.create({
      data: {
        subject,
        docNumber,
        amount: parseFloat(amount),
        deadline: new Date(deadline),
        status: "PENDING",
        userId: session.user.id, // Linked to the authenticated user
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error: any) {
    // Catch unique constraint violations (e.g., duplicate docNumber)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Document number must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
  }
}
