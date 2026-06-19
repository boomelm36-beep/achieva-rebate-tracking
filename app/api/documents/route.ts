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

// Replace the POST function inside app/api/documents/route.ts

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customerName, subject, docNumber, amount, fileName, fileData } = await request.json();

    if (!customerName || !subject || !docNumber || !amount) {
      return NextResponse.json({ error: "Core fields are required" }, { status: 400 });
    }

    // Auto-calculate deadline: Current date + 30 days
    const autoDeadline = new Date();
    autoDeadline.setDate(autoDeadline.getDate() + 30);

    const newDocument = await prisma.document.create({
      data: {
        customerName,
        subject,
        docNumber,
        amount: parseFloat(amount),
        deadline: autoDeadline, // <-- Auto inserted here
        status: "REQUEST",
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

// --- Replace PATCH and add DELETE in app/api/documents/route.ts ---

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, rejectReason, proofFileName, proofFileData, customerName, subject, docNumber, amount } = body;

    const dataToUpdate: any = {};

    // 1. Handle Status Workflow Updates
    if (status) {
      if (status === "REQUEST" && (!rejectReason || rejectReason.trim() === "")) {
        return NextResponse.json({ error: "A reason is required to reject" }, { status: 400 });
      }
      if (status === "PAID" && (!proofFileName || !proofFileData)) {
        return NextResponse.json({ error: "Proof of payment file is required" }, { status: 400 });
      }
      dataToUpdate.status = status;
      dataToUpdate.rejectReason = status === "REQUEST" ? rejectReason : null;
      if (status === "PAID") {
        dataToUpdate.proofFileName = proofFileName;
        dataToUpdate.proofFileData = proofFileData;
      }
    }

    // 2. Handle Manual Card Edits
    if (customerName) dataToUpdate.customerName = customerName;
    if (subject) dataToUpdate.subject = subject;
    if (docNumber) dataToUpdate.docNumber = docNumber;
    if (amount) dataToUpdate.amount = parseFloat(amount);

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// Add this DELETE function to the bottom of the file
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Document ID is required" }, { status: 400 });

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}