// components/CreateDocumentModal.tsx
"use client";

import React, { useState } from "react";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDocumentModal({ isOpen, onClose, onSuccess }: CreateDocumentModalProps) {
  const [subject, setSubject] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, docNumber, amount, deadline }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Reset state and trigger reload on success
      setSubject("");
      setDocNumber("");
      setAmount("");
      setDeadline("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-xl font-bold text-gray-900 mb-4">New Rebate Document</h2>
        
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg font-medium">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Document Number</label>
            <input
              type="text"
              required
              placeholder="e.g., REB-2026-045"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject / Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Q2 Regional Growth Rebate"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deadline Date</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}