"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Trash2, Loader2, RefreshCw, DollarSign,
  ChevronLeft, ChevronRight, X, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Payment {
  id: string;
  orderId: string;
  orderDbId: string | null;
  paymentIntentId: string | null;
  transactionRef: string;
  userId: string | null;
  email: string;
  customerName: string;
  amount: number;
  currency: string;
  type: "soft" | "hard";
  templateName: string;
  status: string;
  previousBalance: number;
  afterBalance: number;
  createdAt: string;
}

function fmt(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminPaymentsPage() {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  const closeConfirm = () => setConfirmModal(m => ({ ...m, open: false }));

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = (payment: Payment) => {
    setConfirmModal({
      open: true,
      title: "Delete Payment Record",
      description: `Remove ledger entry for ${payment.customerName} (${fmt(payment.amount, payment.currency)})? This only removes the record — it does NOT refund the customer.`,
      onConfirm: async () => {
        setDeletingIds(prev => new Set(prev).add(payment.id));
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          const res = await fetch(`/api/admin/payments?id=${payment.id}`, { method: "DELETE" });
          if (res.ok) { toast.success("Deleted"); fetchPayments(); }
          else toast.error("Failed to delete");
        } finally {
          setDeletingIds(prev => { const s = new Set(prev); s.delete(payment.id); return s; });
        }
      },
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      open: true,
      title: "Delete ALL Payment Records",
      description: `Permanently remove all ${total} ledger entries. Actual Stripe charges are NOT affected.`,
      onConfirm: async () => {
        setDeletingAll(true);
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          const res = await fetch(`/api/admin/payments?all=true`, { method: "DELETE" });
          if (res.ok) { toast.success("All records deleted"); fetchPayments(); }
          else toast.error("Failed");
        } finally { setDeletingAll(false); }
      },
    });
  };

  const grandTotal = payments.length > 0 ? payments[0].afterBalance : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Payments
            </h1>
            <p className="text-white/40 text-sm mt-0.5">{total} payment{total !== 1 ? "s" : ""} recorded</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-semibold">Running Total</p>
              <p className="text-emerald-400 font-black text-sm">{fmt(grandTotal, "usd")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or transaction ID..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={fetchPayments} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {total > 0 && (
            <button onClick={handleDeleteAll} disabled={deletingAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all disabled:opacity-50">
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete All
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {["Order / Date","Customer","Type","Amount","Prev Balance","After Balance","Status","Transaction ID","Action"].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-white/30 whitespace-nowrap ${
                    ["Amount","Prev Balance","After Balance"].includes(h) ? "text-right" : h === "Action" ? "text-center" : "text-left"
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-white/20">
                    <DollarSign className="w-10 h-10" />
                    <p className="text-sm font-medium">{search ? "No payments match your search" : "No payments recorded yet"}</p>
                    {!search && <p className="text-xs">Payments appear automatically after each checkout.</p>}
                  </div>
                </td></tr>
              ) : payments.map((p, i) => (
                <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i === 0 ? "bg-emerald-500/[0.025]" : ""}`}>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-mono text-xs text-white/80 font-bold">#{p.orderId.slice(-8).toUpperCase()}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{fmtDate(p.createdAt)}</p>
                    <p className="text-[10px] text-white/20">{fmtTime(p.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white text-sm">{p.customerName || "—"}</p>
                    <p className="text-[11px] text-white/35">{p.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      p.type === "hard" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {p.type === "hard" ? "Hard" : "Digital"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <p className="font-black text-emerald-400 text-sm">{fmt(p.amount, p.currency)}</p>
                    <p className="text-[10px] text-white/20 uppercase">{p.currency}</p>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <p className="font-mono text-sm text-white/40">{fmt(p.previousBalance, p.currency)}</p>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <p className="font-mono text-sm font-bold text-white">{fmt(p.afterBalance, p.currency)}</p>
                    <p className="text-[10px] text-emerald-400/60">+{fmt(p.amount, p.currency)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      PAID
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-white/80 font-bold tracking-wider">{p.transactionRef}</p>
                    {p.paymentIntentId && (
                      <p className="text-[9px] text-white/20 mt-0.5 font-mono truncate max-w-[140px]" title={p.paymentIntentId}>
                        {p.paymentIntentId.slice(0, 20)}...
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingIds.has(p.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all disabled:opacity-50"
                      title="Delete record"
                    >
                      {deletingIds.has(p.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <p className="text-xs text-white/30">Page {page} of {totalPages} · {total} total</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={closeConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
}
