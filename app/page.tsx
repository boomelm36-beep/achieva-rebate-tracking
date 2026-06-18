// app/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { DocumentCard, RebateDocument } from "@/components/DocumentCard";
import CreateDocumentModal from "@/components/CreateDocumentModal";

export default function Home() {
  // Application State
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<RebateDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Authentication UI State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // --- DATABASE FETCHING LOGIC ---
  const fetchDocuments = () => {
    setLoadingDocs(true);
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setLoadingDocs(false);
      })
      .catch(() => setLoadingDocs(false));
  };

  useEffect(() => {
    if (session) {
      fetchDocuments();
    }
  }, [session]);

  // --- AUTHENTICATION HANDLERS ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (!isLoginView) {
        // Sign Up Flow
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to register");

        // Auto-login after successful registration
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (loginRes?.error) throw new Error("Registration successful, but login failed");
      } else {
        // Sign In Flow
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) throw new Error("Invalid email or password");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

 // Update this handler to accept extraData payload (like files or reasons)
  const handleUpdateStatus = async (id: string, newStatus: string, extraData?: any) => {
    const payload: any = { id, status: newStatus, ...extraData };

    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      fetchDocuments();
    }
  };

  // ... (keep loading and auth screens the same)

  // --- MINIMALIST KANBAN DASHBOARD ---
  const userRole = session?.user?.role || "REQUESTER";

  // Filter documents into 4 Kanban columns
  const requestDocs = documents.filter(doc => doc.status === "REQUEST");
  const checkingDocs = documents.filter(doc => doc.status === "CHECKING");
  const approvedDocs = documents.filter(doc => doc.status === "APPROVED");
  const paidDocs = documents.filter(doc => doc.status === "PAID");

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1600px] mx-auto px-6 py-8"> {/* Widened to fit 4 columns */}
        
        {/* Dashboard Header ... (keep the same) ... */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Rebate Workflow</h1>
            <p className="text-sm text-gray-500 mt-1">
              {session?.user?.email} <span className="mx-1 text-gray-300">•</span> <span className="uppercase text-[10px] tracking-widest font-semibold text-gray-400">{userRole}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {userRole === "REQUESTER" && (
              <button onClick={() => setIsModalOpen(true)} className="bg-black text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-800 transition-colors">
                + New Document
              </button>
            )}
            <button onClick={() => signOut()} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
              Log out
            </button>
          </div>
        </header>

        {/* Kanban Board Layout */}
        <main>
          {loadingDocs ? (
            <div className="flex space-x-2 text-sm text-gray-400">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-6 items-start overflow-x-auto pb-4">
              
              {/* KANBAN COLUMN 1: REQUEST */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">1. Request</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{requestDocs.length}</span>
                </div>
                <div className="space-y-4">
                  {requestDocs.length === 0 && <p className="text-xs text-gray-400 italic px-1">No requests currently.</p>}
                  {requestDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} userRole={userRole} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>

              {/* KANBAN COLUMN 2: CHECK DOCUMENT */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">2. Checking</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{checkingDocs.length}</span>
                </div>
                <div className="space-y-4">
                  {checkingDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} userRole={userRole} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>

              {/* KANBAN COLUMN 3: APPROVED */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">3. Approved</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{approvedDocs.length}</span>
                </div>
                <div className="space-y-4">
                  {approvedDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} userRole={userRole} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>

              {/* KANBAN COLUMN 4: PAID */}
              <div className="flex-1 min-w-[300px] w-full bg-emerald-50/30 rounded-xl p-4 border border-emerald-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">4. Paid</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{paidDocs.length}</span>
                </div>
                <div className="space-y-4">
                  {paidDocs.length === 0 && <p className="text-xs text-gray-400 italic px-1">No paid documents yet.</p>}
                  {paidDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} userRole={userRole} onUpdateStatus={handleUpdateStatus} />
                  ))}
                </div>
              </div>

            </div>
          )}
        </main>

        <CreateDocumentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDocuments}
        />
      </div>
    </div>
  );
}