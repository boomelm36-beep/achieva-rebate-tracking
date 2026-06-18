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
        // 1. Sign Up Flow
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
        // 2. Sign In Flow
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

  // --- DOCUMENT WORKFLOW HANDLERS ---
  const handleApprove = async (id: string) => {
    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "APPROVED" }),
    });
    if (res.ok) fetchDocuments();
  };

  const handleReject = async (id: string, reason: string) => {
    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "REJECTED", rejectReason: reason }),
    });
    if (res.ok) fetchDocuments();
  };

  // --- RENDER: LOADING ---
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 animate-pulse font-medium">Loading tracking system...</p>
      </div>
    );
  }

  // --- RENDER: AUTHENTICATION SCREEN ---
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Rebate Tracker</h1>
            <p className="text-sm text-gray-500">
              {isLoginView ? "Welcome back! Please sign in." : "Create a new account to get started."}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isAuthLoading ? "Processing..." : isLoginView ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>{isLoginView ? "Don't have an account?" : "Already have an account?"}</span>
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError(""); // Clear errors when switching views
              }}
              className="text-gray-900 font-semibold hover:underline"
            >
              {isLoginView ? "Sign Up" : "Sign In"}
            </button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 uppercase">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            onClick={() => signIn("google")}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 border border-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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

  // --- RENDER: MAIN DASHBOARD ---
  const userRole = session.user.role || "REQUESTER";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rebate Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: <span className="font-semibold text-gray-700">{session.user.email}</span> ({userRole})
          </p>
        </div>
        <div className="flex gap-3">
          {userRole === "REQUESTER" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + Create Document
            </button>
          )}
          <button
            onClick={() => signOut()}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        {loadingDocs ? (
          <p className="text-gray-500">Syncing with Neon database...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                userRole={userRole}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </main>

      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
}