// components/DocumentCard.tsx
import React, { useState } from 'react';

export interface RebateDocument {
  id: string;
  subject: string;
  docNumber: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  deadline: string;
  rejectReason?: string;
}

interface DocumentCardProps {
  doc: RebateDocument;
  userRole: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  userRole,
  onApprove,
  onReject,
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const statusConfig = {
    PENDING: { color: 'bg-yellow-500', text: 'text-yellow-700', label: 'Pending Review' },
    APPROVED: { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'Approved' },
    REJECTED: { color: 'bg-red-500', text: 'text-red-700', label: 'Rejected' },
  };

  const currentStatus = statusConfig[doc.status];

  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-6 transition-all hover:border-gray-300 hover:shadow-sm flex flex-col justify-between">
      <div>
        {/* Minimalist Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase">
              {doc.docNumber}
            </p>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight leading-snug">
              {doc.subject}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`}></span>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${currentStatus.text}`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Crisp Financials */}
        <div className="flex items-end gap-2 mb-6">
          <span className="text-2xl font-light text-gray-900 tracking-tight">
            ${doc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-gray-400 mb-1.5">USD</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mb-4 border-t border-gray-50 pt-4">
          <p>Created: <span className="text-gray-900">{new Date(doc.createdAt).toLocaleDateString()}</span></p>
          <p>Due: <span className="text-gray-900">{new Date(doc.deadline).toLocaleDateString()}</span></p>
        </div>

        {doc.status === 'REJECTED' && doc.rejectReason && (
          <div className="mb-4 text-xs text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-md leading-relaxed">
            <span className="font-semibold block mb-0.5">Rejection Note:</span>
            {doc.rejectReason}
          </div>
        )}
      </div>

      {/* Sleek Action Buttons */}
      {userRole === 'APPROVER' && doc.status === 'PENDING' && (
        <div className="pt-2">
          {!isRejecting ? (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(doc.id)}
                className="flex-1 bg-black text-white hover:bg-gray-800 text-xs font-medium py-2 rounded-md transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setIsRejecting(true)}
                className="flex-1 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 text-xs font-medium py-2 rounded-md transition-colors"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <input
                type="text"
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for rejection..."
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors bg-gray-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(doc.id, reason)}
                  disabled={!reason.trim()}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-medium py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setIsRejecting(false)}
                  className="flex-1 text-gray-500 hover:text-gray-700 text-xs font-medium py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};