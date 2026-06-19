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
  const [editingDoc, setEditingDoc] = useState<RebateDocument | null>(null);

  // Authentication UI State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // --- DATABASE FETCHING LOGIC ---
  const fetchDocuments = (isManualRefresh = true) => {
    if (isManualRefresh) {
      setLoadingDocs(true);
    }
    
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(Array.isArray(data) ? data : []);
        setLoadingDocs(false);
      })
      .catch((err) => {
        console.error("Failed to load documents", err);
        setDocuments([]);
        setLoadingDocs(false);
      });
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments(false);
    }
  }, [status]);

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError(String(err));
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // --- DOCUMENT WORKFLOW HANDLER ---
  const handleUpdateStatus = async (id: string, newStatus: string, extraData?: Record<string, string>) => {
    const payload: Record<string, string> = { id, status: newStatus, ...extraData };

    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (res.ok) {
      fetchDocuments();
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const res = await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchDocuments();
  };

  const handleEditDocument = (doc: RebateDocument) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };  

  // --- RENDER: LOADING ---
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDER: AUTHENTICATION SCREEN ---
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="max-w-[320px] w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">Achieva Rebate Tracker</h1>
            <p className="text-sm text-gray-500">
              {isLoginView ? "Enter your details to sign in." : "Create an account to continue."}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLoginView && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border-b border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-transparent placeholder-gray-400"
                placeholder="Full Name"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border-b border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-transparent placeholder-gray-400"
              placeholder="Email address"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border-b border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-transparent placeholder-gray-400"
              placeholder="Password"
            />
            
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-md mt-4 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isAuthLoading ? "Processing..." : isLoginView ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-1 text-xs text-gray-500">
            <span>{isLoginView ? "No account?" : "Have an account?"}</span>
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError(""); 
              }}
              className="text-black font-medium hover:underline"
            >
              {isLoginView ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="px-3 text-xs text-gray-400 uppercase">Or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button
            onClick={() => signIn("google")}
            className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  

  // --- MINIMALIST KANBAN DASHBOARD ---
  const userRole = session?.user?.role || "REQUESTER";

// Filter documents into Kanban columns based on workflow status
  const requestDocs = documents.filter(doc => doc.status === "REQUEST");
  const checkingDocs = documents.filter(doc => doc.status === "CHECKING");
  const approvedDocs = documents.filter(doc => doc.status === "APPROVED");
  const paidDocs = documents.filter(doc => doc.status === "PAID");

  // --- NEW: Calculate Financial Summaries ---
  const totalUnpaid = [...requestDocs, ...checkingDocs, ...approvedDocs].reduce((sum, doc) => sum + doc.amount, 0);
  const totalPaid = paidDocs.reduce((sum, doc) => sum + doc.amount, 0);

  // --- NEW: Thai Baht Formatter ---
  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { 
      style: 'currency', 
      currency: 'THB',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
       {/* Dashboard Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div>
            {/* --- UPDATED: Personalized Welcome Message --- */}
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Welcome, {session?.user?.name || session?.user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Rebate Workflow <span className="mx-1 text-gray-300">•</span> {session?.user?.email} <span className="mx-1 text-gray-300">•</span> <span className="uppercase text-[10px] tracking-widest font-semibold text-gray-400">{userRole}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {userRole === "REQUESTER" && (
              <button
                onClick={() => { setEditingDoc(null); setIsModalOpen(true); }}
                className="bg-black text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
              >
                + New Document
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/', redirect: true })}
              className="bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Kanban Board Layout */}
        {/* Kanban Board & Summary Layout */}
        <main>
          {loadingDocs ? (
            <div className="flex space-x-2 text-sm text-gray-400">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
            </div>
          ) : (
            <>
              {/* --- NEW: Financial Summary Section --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-center transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-2">Total Unpaid</p>
                  <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                    {formatTHB(totalUnpaid)}
                  </h2>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col justify-center transition-all hover:border-emerald-200 hover:shadow-sm">
                  <p className="text-[11px] font-semibold tracking-widest text-emerald-500 uppercase mb-2">Total Paid</p>
                  <h2 className="text-3xl font-light text-emerald-700 tracking-tight">
                    {formatTHB(totalPaid)}
                  </h2>
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="flex flex-col xl:flex-row gap-6 items-start overflow-x-auto pb-4">
              
              {/* KANBAN COLUMN 1: REQUEST */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">1. Request</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {requestDocs.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {requestDocs.length === 0 && <p className="text-xs text-gray-400 italic px-1">No requests currently.</p>}
                  {requestDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      userRole={userRole} 
                      onUpdateStatus={handleUpdateStatus} 
                      onEdit={handleEditDocument} 
                      onDelete={handleDeleteDocument}              
                    />
                  ))}
                </div>
              </div>

              {/* KANBAN COLUMN 2: CHECK DOCUMENT */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">2. Checking</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {checkingDocs.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {checkingDocs.length === 0 && <p className="text-xs text-gray-400 italic px-1">No documents in checking phase.</p>}
                  {checkingDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      userRole={userRole} 
                      onUpdateStatus={handleUpdateStatus} 
                      onEdit={handleEditDocument}         
                      onDelete={handleDeleteDocument}     
                    />
                  ))}
                </div>
              </div>

              {/* KANBAN COLUMN 3: APPROVED */}
              <div className="flex-1 min-w-[300px] w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">3. Approved</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {approvedDocs.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {approvedDocs.length === 0 && <p className="text-xs text-gray-400 italic px-1">No approved documents.</p>}
                  {approvedDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      userRole={userRole} 
                      onUpdateStatus={handleUpdateStatus} 
                      onEdit={handleEditDocument}          
                      onDelete={handleDeleteDocument}      
                    />
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
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      userRole={userRole} 
                      onUpdateStatus={handleUpdateStatus} 
                      onEdit={handleEditDocument}          
                      onDelete={handleDeleteDocument}      
                    />
                  ))}
                </div>
              </div>

            </div>
          )}
        </main>

        <CreateDocumentModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingDoc(null); }}
          onSuccess={fetchDocuments}
          editData={editingDoc}
        />
      </div>
    </div>
  );
}