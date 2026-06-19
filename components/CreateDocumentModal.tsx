// components/CreateDocumentModal.tsx
"use client";

import React, { useState } from "react";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDocumentModal({ isOpen, onClose, onSuccess }: CreateDocumentModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [subject, setSubject] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("File must be less than 2MB for this demo.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setFileData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Deadline is removed here, handled by backend
        body: JSON.stringify({ customerName, subject, docNumber, amount, fileName, fileData }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");

      setCustomerName(""); setSubject(""); setDocNumber(""); setAmount(""); setFileName(""); setFileData("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">New Rebate Document</h2>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Doc Number</label>
              <input type="text" required value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-gray-900" placeholder="REB-123" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Amount ($)</label>
              <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-gray-900" placeholder="0.00" />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer Name</label>
            <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-gray-900" placeholder="Acme Corp" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject / Description</label>
            <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-gray-900" placeholder="Q1 Volume Rebate" />
          </div>
          
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Attachment</label>
            <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 text-gray-600 font-medium py-2 px-4 border border-gray-200 rounded-md text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-black text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50">{submitting ? "Submitting..." : "Create Request"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}