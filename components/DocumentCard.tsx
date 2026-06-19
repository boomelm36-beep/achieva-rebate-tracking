// components/DocumentCard.tsx
import React, { useState } from 'react';

export interface RebateDocument {
  id: string;
  customerName: string;
  subject: string;
  docNumber: string;
  amount: number;
  status: 'REQUEST' | 'CHECKING' | 'APPROVED' | 'PAID';
  createdAt: string;
  updatedAt: string;
  deadline: string;
  rejectReason?: string;
  fileName?: string;
  fileData?: string;
  proofFileName?: string;
  proofFileData?: string;
}

interface DocumentCardProps {
  doc: RebateDocument;
  userRole: string;
  onUpdateStatus: (id: string, status: string, extraData?: Record<string, string>) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc, userRole, onUpdateStatus }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  
  const [isPaying, setIsPaying] = useState(false);
  const [proofFileName, setProofFileName] = useState("");
  const [proofFileData, setProofFileData] = useState("");

  const statusConfig = {
    REQUEST: { color: 'bg-gray-500', text: 'text-gray-700', label: 'Requested' },
    CHECKING: { color: 'bg-yellow-500', text: 'text-yellow-700', label: 'Checking' },
    APPROVED: { color: 'bg-blue-500', text: 'text-blue-700', label: 'Approved' },
    PAID: { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'Paid' },
  };
  const currentStatus = statusConfig[doc.status];

  // --- UTILITY: Format Date to DD/MM/YYYY ---
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // --- UTILITY: Calculate Days Since Creation ---
  const getDaysActive = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffInDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Created Today";
    return `${diffInDays} Day${diffInDays > 1 ? 's' : ''}`;
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File must be less than 2MB");
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setProofFileData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitPayment = () => {
    if (!proofFileData) return alert("Please upload proof of payment.");
    onUpdateStatus(doc.id, 'PAID', { proofFileName, proofFileData });
    setIsPaying(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{doc.docNumber}</p>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{doc.customerName}</h3>
            <p className="text-xs text-gray-500">{doc.subject}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`}></span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${currentStatus.text}`}>{currentStatus.label}</span>
          </div>
        </div>

        <div className="flex items-end gap-1 mb-4">
          <span className="text-xl font-light text-gray-900">${doc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Date Tracking Display */}
        <div className="bg-gray-50 rounded-lg p-2.5 mb-4 border border-gray-100 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Deadline:</span>
            <span className="font-medium text-gray-900">{formatDate(doc.deadline)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Last Edited:</span>
            <span className="font-medium text-gray-900">
              {formatDate(doc.updatedAt)} {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-200 pt-1.5 mt-0.5">
            <span>Days Active:</span>
            <span className="font-semibold text-gray-900">{getDaysActive(doc.createdAt)}</span>
          </div>
        </div>

        {doc.fileData && doc.fileName && (
          <a href={doc.fileData} download={doc.fileName} className="inline-flex items-center gap-2 mb-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors border border-gray-200 w-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Req: {doc.fileName}
          </a>
        )}

        {doc.proofFileData && doc.proofFileName && (
          <a href={doc.proofFileData} download={doc.proofFileName} className="inline-flex items-center gap-2 mb-4 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors border border-emerald-100 w-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Receipt: {doc.proofFileName}
          </a>
        )}

        {doc.rejectReason && doc.status === 'REQUEST' && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-100">
            <span className="font-semibold block mb-0.5">Rejected Reason:</span>
            {doc.rejectReason}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-50 mt-2">
        {userRole === 'REQUESTER' && doc.status === 'REQUEST' && (
          <button onClick={() => onUpdateStatus(doc.id, 'CHECKING')} className="w-full bg-black text-white hover:bg-gray-800 text-xs font-medium py-2 rounded-md transition-colors">
            Submit for Check
          </button>
        )}

        {userRole === 'APPROVER' && doc.status === 'CHECKING' && (
          !isRejecting ? (
            <div className="flex gap-2">
              <button onClick={() => onUpdateStatus(doc.id, 'APPROVED')} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium py-2 rounded-md transition-colors">
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
                <button onClick={() => onUpdateStatus(doc.id, 'REQUEST', { rejectReason: reason })} disabled={!reason.trim()} className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-medium py-2 rounded-md disabled:opacity-50">
                  Send Back
                </button>
                <button onClick={() => setIsRejecting(false)} className="flex-1 text-gray-500 hover:text-gray-700 text-xs font-medium py-2 rounded-md">Cancel</button>
              </div>
            </div>
          )
        )}

        {userRole === 'APPROVER' && doc.status === 'APPROVED' && (
          !isPaying ? (
             <button onClick={() => setIsPaying(true)} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium py-2 rounded-md transition-colors">
                Upload Payment Proof
             </button>
          ) : (
            <div className="space-y-2 bg-gray-50 p-2 rounded-md border border-gray-200">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase">Attach Receipt</label>
              <input type="file" onChange={handleProofChange} className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white file:border-gray-200 file:border cursor-pointer" />
              <div className="flex gap-2 mt-2">
                <button onClick={submitPayment} disabled={!proofFileData} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium py-1.5 rounded disabled:opacity-50">
                  Mark Paid
                </button>
                <button onClick={() => setIsPaying(false)} className="flex-1 text-gray-500 bg-white border border-gray-200 text-xs font-medium py-1.5 rounded">Cancel</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};