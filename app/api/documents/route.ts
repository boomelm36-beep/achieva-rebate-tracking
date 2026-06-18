// app/api/documents/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient, DocStatus } from "../../../prisma/generated/client/index.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const documents = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, docNumber, amount, deadline, fileName, fileData } = await request.json();

    if (!subject || !docNumber || !amount || !deadline) {
      return NextResponse.json({ error: "Core fields are required" }, { status: 400 });
    }

    const newDocument = await prisma.document.create({
      data: {
        subject,
        docNumber,
        amount: parseFloat(amount),
        deadline: new Date(deadline),
        status: "REQUEST", // Always starts in the REQUEST stage
        fileName,
        fileData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Document number must be unique" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, rejectReason } = await request.json();

    if (status === "REQUEST" && (!rejectReason || rejectReason.trim() === "")) {
      return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: status as DocStatus,
        // If moving to CHECKING or APPROVED, clear out any old rejection reasons!
        rejectReason: status === "REQUEST" ? rejectReason : null,
      },
    });

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}