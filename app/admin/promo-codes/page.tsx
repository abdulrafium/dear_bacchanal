"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Ticket, CheckCircle2, TicketCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  coupon: {
    percent_off?: number;
    amount_off?: number;
    currency?: string;
  };
  metadata?: any;
}

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCodeData, setNewCodeData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed_amount",
    value: 10,
    name: "",
  });

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/promo-codes");
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeData.code) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCodeData),
      });

      if (res.ok) {
        toast.success("Promo code created successfully!");
        setNewCodeData({ code: "", type: "percentage", value: 10, name: "" });
        fetchCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create code");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this code? It cannot be reactivated easily in Stripe.")) return;

    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Code deactivated");
        fetchCodes();
      } else {
        toast.error("Failed to deactivate code");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Promo Codes
        </h1>
        <p className="text-white/50 mt-1">Create and manage discounts for your customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-black">
              <Plus className="w-5 h-5 text-red-500" />
              Create Code
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1 tracking-tight">Code Name</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER2024"
                  value={newCodeData.code}
                  onChange={(e) => setNewCodeData({ ...newCodeData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-400 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1 opacity-70">Type</label>
                  <select
                    value={newCodeData.type}
                    onChange={(e) => setNewCodeData({ ...newCodeData, type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-black font-bold"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1 opacity-70">
                    Value {newCodeData.type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    value={newCodeData.value}
                    onChange={(e) => setNewCodeData({ ...newCodeData, value: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black font-bold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[#2d2d2d] text-white py-3 rounded-xl font-bold hover:bg-[#404040] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {creating ? "Creating..." : "Generate Code"}
              </button>
            </form>
          </div>
        </div>

        {/* List View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-black leading-none">
                <Ticket className="w-5 h-5 text-gray-400" />
                Active Codes
              </h2>
              <span className="text-sm text-gray-400 font-medium">
                {promoCodes.length} codes found
              </span>
            </div>

            {loading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 text-gray-200 animate-spin" />
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                No active promo codes found in Stripe.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {promoCodes.map((promo) => (
                  <div key={promo.id} className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${!promo.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${promo.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {promo.active ? <TicketCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {promo.code}
                          {!promo.active && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded uppercase">Inactive</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {promo.coupon.percent_off 
                            ? `${promo.coupon.percent_off}% Discount`
                            : `$${(promo.coupon.amount_off || 0) / 100} Fixed Discount`}
                        </div>
                      </div>
                    </div>

                    {promo.active && (
                      <button
                        onClick={() => handleDeactivate(promo.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate Code"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
