// components/DocumentCard.tsx
import React, { useState } from 'react';

export interface RebateDocument {
  id: string;
  subject: string;
  docNumber: string;
  amount: number;
  status: 'REQUEST' | 'CHECKING' | 'APPROVED';
  createdAt: string;
  deadline: string;
  rejectReason?: string;
  fileName?: string;
  fileData?: string;
}

interface DocumentCardProps {
  doc: RebateDocument;
  userRole: string;
  onUpdateStatus: (id: string, status: string, reason?: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, userRole, onUpdateStatus }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const statusConfig = {
    REQUEST: { color: 'bg-gray-500', text: 'text-gray-700', label: 'Draft / Requested' },
    CHECKING: { color: 'bg-yellow-500', text: 'text-yellow-700', label: 'Checking' },
    APPROVED: { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'Approved' },
  };
  const currentStatus = statusConfig[doc.status];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{doc.docNumber}</p>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{doc.subject}</h3>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`}></span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStatus.text}`}>{currentStatus.label}</span>
          </div>
        </div>

        <div className="flex items-end gap-1 mb-4">
          <span className="text-xl font-light text-gray-900">${doc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Display File Attachment if exists */}
        {doc.fileData && doc.fileName && (
          <a href={doc.fileData} download={doc.fileName} className="inline-flex items-center gap-2 mb-4 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download {doc.fileName}
          </a>
        )}

        {doc.rejectReason && doc.status === 'REQUEST' && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-100">
            <span className="font-semibold block mb-0.5">Rejected Reason:</span>
            {doc.rejectReason}
          </div>
        )}
      </div>

      {/* Role-Based Workflow Buttons */}
      <div className="pt-4 border-t border-gray-50 mt-2">
        {/* REQUESTER ACTIONS */}
        {userRole === 'REQUESTER' && doc.status === 'REQUEST' && (
          <button onClick={() => onUpdateStatus(doc.id, 'CHECKING')} className="w-full bg-black text-white hover:bg-gray-800 text-xs font-medium py-2 rounded-md transition-colors">
            Submit for Check
          </button>
        )}

        {/* APPROVER ACTIONS */}
        {userRole === 'APPROVER' && doc.status === 'CHECKING' && (
          !isRejecting ? (
            <div className="flex gap-2">
              <button onClick={() => onUpdateStatus(doc.id, 'APPROVED')} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium py-2 rounded-md transition-colors">
                Approve
              </button>
              <button onClick={() => setIsRejecting(true)} className="flex-1 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 text-xs font-medium py-2 rounded-md transition-colors">
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection..." className="w-full text-xs px-3 py-2 border border-gray-200 rounded-md focus:border-gray-900 text-gray-900 bg-gray-50" />
              <div className="flex gap-2">
                <button onClick={() => onUpdateStatus(doc.id, 'REQUEST', reason)} disabled={!reason.trim()} className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-medium py-2 rounded-md disabled:opacity-50">
                  Send Back
                </button>
                <button onClick={() => setIsRejecting(false)} className="flex-1 text-gray-500 hover:text-gray-700 text-xs font-medium py-2 rounded-md">Cancel</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};