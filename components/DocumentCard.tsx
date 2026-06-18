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

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return alert('Please provide a reason for rejection.');
    onReject(doc.id, reason);
    setIsRejecting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-md w-full transition-all hover:shadow-lg">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {doc.docNumber}
          </span>
          <h3 className="text-lg font-bold text-gray-800 mt-2">{doc.subject}</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          doc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {doc.status}
        </span>
      </div>

      {/* Financials & Dates */}
      <div className="grid grid-cols-2 gap-4 my-4 text-sm">
        <div>
          <p className="text-gray-500">Amount</p>
          <p className="text-base font-semibold text-gray-900">${doc.amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Deadline</p>
          <p className="text-base font-semibold text-gray-900">{new Date(doc.deadline).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t pt-3 flex justify-between">
        <span>Created: {new Date(doc.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Display Rejection Reason if applicable */}
      {doc.status === 'REJECTED' && doc.rejectReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
          <strong>Reason:</strong> {doc.rejectReason}
        </div>
      )}

      {/* Approver Actions Workflow */}
      {userRole === 'APPROVER' && doc.status === 'PENDING' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          {!isRejecting ? (
            <>
              <button
                onClick={() => onApprove(doc.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setIsRejecting(true)}
                className="flex-1 bg-white hover:bg-gray-50 text-red-600 border border-red-200 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Reject
              </button>
            </>
          ) : (
            <form onSubmit={handleRejectSubmit} className="w-full space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded"
                >
                  Confirm Reject
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};