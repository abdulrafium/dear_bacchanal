"use client";

import { useState, useEffect } from "react";
import { 
  Undo2,
  Loader2,
  AlertTriangle,
  FileText,
  Package,
  X,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Order {
  id: string;
  email: string;
  orderId: string;
  amount: number;
  type: 'soft' | 'hard';
  templateName?: string;
  bookId?: string;
  status: string;
  customerName?: string;
  createdAt: string;
  refundReason?: string;
  refundRequestedAt?: string;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Order | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [deletingRefunds, setDeletingRefunds] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; description: string; onConfirm: () => Promise<void> }>({
    open: false, title: '', description: '', onConfirm: async () => {}
  });

  const openConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmModal({ open: true, title, description, onConfirm });
  };

  const executeDeleteRefund = async (orderId: string) => {
    setDeletingRefunds(prev => new Set(prev).add(orderId));
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Record deleted");
        if (selectedRefund?.id === orderId) setSelectedRefund(null);
        fetchRefunds();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeletingRefunds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const deleteRefund = (orderId: string) => {
    openConfirm(
      "Delete Refund Record",
      "This will permanently delete this refund record and the associated customer book. This cannot be undone.",
      () => executeDeleteRefund(orderId)
    );
  };

  const executeDeleteAllRefunds = async () => {
    setDeletingAll(true);
    const statusFilter = activeTab === 'pending' ? 'refund_pending' : 'refunded';
    try {
      const res = await fetch(`/api/admin/orders?deleteAll=true&status=${statusFilter}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Records deleted");
        setSelectedRefund(null);
        fetchRefunds();
      } else {
        toast.error("Failed to delete records");
      }
    } catch (e) {
      toast.error("Delete all failed");
    } finally {
      setDeletingAll(false);
    }
  };

  const deleteAllRefunds = () => {
    openConfirm(
      `Delete All ${activeTab === 'pending' ? 'Pending Refunds' : 'Refund History'}`,
      `This will permanently delete all ${activeTab === 'pending' ? 'pending refund requests' : 'refund history records'} and their associated customer books. This CANNOT be undone.`,
      executeDeleteAllRefunds
    );
  };

  useEffect(() => {
    fetchRefunds(activeTab);
    setSelectedRefund(null);
  }, [activeTab]);

  const fetchRefunds = async (tab: 'pending' | 'history' = activeTab) => {
    setLoading(true);
    try {
      const statusFilter = tab === 'pending' ? 'refund_pending' : 'refunded';
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        // Fallback in case refundReason wasn't in the generic GET API return map yet
        // Wait, the API GET doesn't map `refundReason`, so we'll just check if it exists or use `refundRequest.reason`
        // Actually, we added `refundReason` to the order document in our new `request` API
        // Let's fetch it again or map it if it's there
        const mappedRefunds = data.orders.map((o: any) => ({
            ...o,
            // the new API sets `refundReason` and `refundRequestedAt`
            refundReason: o.refundReason || o.refundRequest?.reason,
            refundRequestedAt: o.refundRequestedAt || o.refundRequest?.requestedAt
        }));
        setRefunds(mappedRefunds);
      }
    } catch (error) {
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (orderId: string, action: 'accept' | 'reject') => {
    setProcessingAction(action);
    if (action === 'accept') {
        try {
            const res = await fetch("/api/admin/orders/refund-approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            if (res.ok) {
              toast.success("Refund approved and processed via Stripe");
              fetchRefunds();
              setSelectedRefund(null);
            } else {
              const error = await res.json();
              toast.error(`Refund failed: ${error.error}`);
            }
        } catch (error) {
            toast.error("Process failed");
        }
    } else {
        try {
            const res = await fetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: 'paid' }),
            });
            if (res.ok) {
                toast.success("Refund rejected. Order marked as paid.");
                fetchRefunds();
                setSelectedRefund(null);
            } else {
                toast.error("Failed to reject refund");
            }
        } catch (error) {
            toast.error("Process failed");
        }
    }
    setProcessingAction(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Yes, Delete"
      />
      <div>
        <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase flex items-center gap-3">
          <Undo2 className="w-8 h-8 text-red-500" />
          Refund Requests
        </h1>
        <p className="text-white/40 text-sm mt-2">Manage customer refund requests, apply 20% deductions, and process payments via Stripe.</p>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <button 
            onClick={() => setActiveTab('pending')}
            className={`font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full transition-all ${activeTab === 'pending' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
        >
            Pending Requests
        </button>
        <button 
            onClick={() => setActiveTab('history')}
            className={`font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-full transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
        >
            Refund History
        </button>
        <div className="flex-1" />
        <button
            onClick={deleteAllRefunds}
            disabled={deletingAll || refunds.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
        >
            {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deletingAll ? 'Deleting All...' : 'Delete All'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        {/* Table Area */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">ORDER</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">CUSTOMER</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">TYPE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none text-right">ORIGINAL AMOUNT</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No {activeTab === 'pending' ? 'pending refunds' : 'refund history'}</p>
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr 
                        key={refund.id} 
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedRefund?.id === refund.id ? 'bg-red-500/5' : ''}`}
                        onClick={() => setSelectedRefund(refund)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-xs truncate max-w-[120px]">#{(refund.orderId || '').slice(-8).toUpperCase()}</span>
                          <span className="text-white/30 text-[10px]">{format(new Date(refund.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-white text-xs font-medium">{refund.customerName || refund.email?.split('@')[0]}</span>
                            <span className="text-white/30 text-[10px] truncate max-w-[150px]">{refund.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${refund.type === 'hard' ? 'text-orange-400 bg-orange-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                            {refund.type === 'hard' ? <Package className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {refund.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-white font-black text-sm">
                            ${(Number(refund.amount || 0) / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteRefund(refund.id); }}
                            disabled={deletingRefunds.has(refund.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all disabled:opacity-50 inline-flex items-center"
                        >
                            {deletingRefunds.has(refund.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
            {!selectedRefund ? (
                <div className="bg-[#0f0f0f] border border-dashed border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Undo2 className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-white/20 text-sm font-bold uppercase tracking-widest">Select a refund to process</p>
                </div>
            ) : (
                <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                            Review Request
                        </h3>
                        <button 
                            onClick={() => setSelectedRefund(null)}
                            className="text-white/20 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative z-10">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            Customer's Reason
                        </p>
                        <p className="text-white/80 text-sm italic border-l-2 border-red-500 pl-3">
                            "{selectedRefund.refundReason || "No reason provided."}"
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 relative z-10 space-y-4">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Refund Calculation</p>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Original Amount</span>
                            <span className="text-white font-bold">${(selectedRefund.amount / 100).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-red-400">
                            <span className="text-xs font-bold uppercase tracking-wider">Platform Deduction (20%)</span>
                            <span className="font-bold">-${((selectedRefund.amount * 0.2) / 100).toFixed(2)}</span>
                        </div>
                        
                        <div className="pt-4 border-t border-red-500/20 flex justify-between items-center">
                            <span className="text-white font-black uppercase tracking-widest text-sm">Net Refund</span>
                            <span className="text-3xl font-black text-white">${((selectedRefund.amount * 0.8) / 100).toFixed(2)}</span>
                        </div>
                    </div>

                    {activeTab === 'pending' ? (
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <button 
                                onClick={() => processRefund(selectedRefund.id, 'reject')}
                                disabled={processingAction !== null}
                                className="py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processingAction === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Reject Request
                            </button>
                            <button 
                                onClick={() => processRefund(selectedRefund.id, 'accept')}
                                disabled={processingAction !== null}
                                className="py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingAction === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Approve
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center relative z-10">
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <p className="text-green-500 font-black uppercase tracking-widest text-xs">Refund Successfully Processed</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
