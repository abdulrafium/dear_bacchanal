"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Ticket,
  CheckCircle2,
  TicketCheck,
  XCircle,
  Calendar,
  Zap,
  AlertTriangle,
  X,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  active: boolean;
  bannerActive: boolean;
  startDate: string | null;
  coupon: {
    percent_off?: number;
    amount_off?: number;
    currency?: string;
  };
}

/* ─── Themed Toggle Switch ─── */
function ToggleSwitch({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ─── Confirmation Modal ─── */
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmClass,
  icon,
  onConfirm,
  onCancel,
  errorOnly,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmClass?: string;
  icon?: React.ReactNode;
  onConfirm?: () => void;
  onCancel: () => void;
  errorOnly?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Top accent bar */}
        <div
          className={`h-1.5 w-full ${
            errorOnly
              ? "bg-gradient-to-r from-orange-500 to-red-500"
              : "bg-gradient-to-r from-red-500 via-pink-500 to-red-600"
          }`}
        />
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              errorOnly ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-500"
            }`}
          >
            {icon}
          </div>

          <h3 className="text-xl font-black text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-sm text-gray-500 text-center leading-relaxed">{description}</p>

          <div className="mt-6 flex gap-3">
            {!errorOnly && (
              <button
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={errorOnly ? onCancel : onConfirm}
              className={`flex-1 h-11 rounded-xl font-bold transition-all active:scale-95 shadow-lg text-white ${
                confirmClass ||
                (errorOnly
                  ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                  : "bg-red-500 hover:bg-red-600 shadow-red-200")
              }`}
            >
              {errorOnly ? "Got it" : confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newCodeData, setNewCodeData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed_amount",
    value: 10,
    name: "",
    startDate: "",
    expireDate: "",
  });

  // Modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    promo: PromoCode | null;
  }>({ open: false, promo: null });
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    code: string;
  }>({ open: false, code: "" });

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
        toast.success("Promo code created!");
        setNewCodeData({ code: "", type: "percentage", value: 10, name: "", startDate: "", expireDate: "" });
        fetchCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create code");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleBanner = async (promo: PromoCode) => {
    const newState = !promo.bannerActive;

    if (newState) {
      const currentActive = promoCodes.find((p) => p.bannerActive && p.id !== promo.id);
      if (currentActive) {
        if (
          !window.confirm(
            `"${currentActive.code}" is currently live. Only one banner at a time.\n\nSwitch to "${promo.code}"?`
          )
        )
          return;
      }
    }

    setTogglingId(promo.id);
    setPromoCodes((prev) =>
      prev.map((p) => ({
        ...p,
        bannerActive: p.id === promo.id ? newState : newState ? false : p.bannerActive,
        active: p.id === promo.id ? newState : p.active,
      }))
    );

    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}/toggle-banner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerActive: newState }),
      });
      if (res.ok) {
        toast.success(
          newState ? `"${promo.code}" is now live on the banner! 🎉` : `"${promo.code}" banner deactivated`
        );
      } else {
        toast.error("Failed to update banner");
        fetchCodes();
      }
    } catch {
      toast.error("An error occurred");
      fetchCodes();
    } finally {
      setTogglingId(null);
    }
  };

  /* Delete flow */
  const handleDeleteClick = (promo: PromoCode) => {
    if (promo.bannerActive) {
      setErrorModal({ open: true, code: promo.code });
      return;
    }
    setDeleteModal({ open: true, promo });
  };

  const handleDeleteConfirm = async () => {
    const promo = deleteModal.promo;
    if (!promo) return;
    setDeleteModal({ open: false, promo: null });

    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}`, { method: "DELETE" });
      if (res.ok) {
        // Remove from local state immediately
        setPromoCodes((prev) => prev.filter((p) => p.id !== promo.id));
        toast.success(`"${promo.code}" has been deactivated and removed.`);
      } else {
        toast.error("Failed to deactivate code");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const formatStartDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    return `${weekday} ${day}${suffix} ${month}`;
  };

  const activeBannerCode = promoCodes.find((p) => p.bannerActive);

  return (
    <>
      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        open={deleteModal.open}
        title="Delete Promo Code?"
        description={`Are you sure you want to permanently deactivate "${deleteModal.promo?.code}"? This action cannot be easily undone in Stripe.`}
        confirmLabel="Yes, Delete It"
        icon={<Trash2 className="w-7 h-7" />}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, promo: null })}
      />

      {/* ── Active Banner Error Modal ── */}
      <ConfirmModal
        open={errorModal.open}
        title="Code is Active!"
        description={`"${errorModal.code}" is currently live on the banner. Please turn the Banner toggle OFF first before deleting it.`}
        icon={<ShieldAlert className="w-7 h-7" />}
        onCancel={() => setErrorModal({ open: false, code: "" })}
        errorOnly
      />

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Promo Codes</h1>
          <p className="text-white/50 mt-1">Create and manage discounts for your customers</p>
        </div>

        {/* Live Banner Preview */}
        {activeBannerCode ? (
          <div className="rounded-2xl overflow-hidden border border-green-500/30 shadow-lg shadow-green-500/5">
            <div className="bg-gradient-to-r from-pink-600 via-red-500 to-yellow-500 text-white text-center py-2.5 px-4 text-sm font-medium tracking-wide">
              Use code{" "}
              <span className="font-black">{activeBannerCode.code}</span>{" "}
              to get{" "}
              {activeBannerCode.coupon.percent_off
                ? `${activeBannerCode.coupon.percent_off}% off`
                : `$${(activeBannerCode.coupon.amount_off || 0) / 100} off`}
              !
              {activeBannerCode.startDate && (
                <> Active from {formatStartDate(activeBannerCode.startDate)}</>
              )}
            </div>
            <div className="bg-green-500/10 px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                Live on landing page
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 flex items-center gap-4">
            <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">No active banner</p>
              <p className="text-white/40 text-xs">
                Toggle any code ON to make it live on the landing page.
              </p>
            </div>
          </div>
        )}

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
                  <label className="block text-sm font-bold text-black mb-1 tracking-tight">
                    Code Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER2024"
                    value={newCodeData.code}
                    onChange={(e) =>
                      setNewCodeData({ ...newCodeData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-400 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 opacity-70">
                      Type
                    </label>
                    <select
                      value={newCodeData.type}
                      onChange={(e) =>
                        setNewCodeData({ ...newCodeData, type: e.target.value as any })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-black font-bold"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 opacity-70">
                      Value {newCodeData.type === "percentage" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      value={newCodeData.value}
                      onChange={(e) =>
                        setNewCodeData({ ...newCodeData, value: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1 tracking-tight flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Active From
                  </label>
                  <input
                    type="date"
                    value={newCodeData.startDate}
                    onChange={(e) =>
                      setNewCodeData({ ...newCodeData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black font-medium"
                    required
                  />
                  {newCodeData.startDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Displays as:{" "}
                      <span className="font-semibold text-gray-600">
                        {formatStartDate(newCodeData.startDate)}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1 tracking-tight flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Expire Date
                  </label>
                  <input
                    type="date"
                    value={newCodeData.expireDate}
                    onChange={(e) =>
                      setNewCodeData({ ...newCodeData, expireDate: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-black font-medium"
                    required
                  />
                  {newCodeData.expireDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Expires on:{" "}
                      <span className="font-semibold text-gray-600">
                        {formatStartDate(newCodeData.expireDate)}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creating || !newCodeData.code || !newCodeData.startDate || !newCodeData.expireDate}
                  className="w-full bg-[#2d2d2d] text-white py-3 rounded-xl font-bold hover:bg-[#404040] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {creating ? "Creating..." : "Generate Code"}
                </button>
              </form>
            </div>
          </div>

          {/* List View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-black leading-none">
                  <Ticket className="w-5 h-5 text-gray-400" />
                  All Codes
                </h2>
                <span className="text-sm text-gray-400 font-medium">
                  {promoCodes.length} code{promoCodes.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Scrollable list */}
              <div
                className="overflow-y-auto divide-y divide-gray-50 promo-scroll"
                style={{
                  maxHeight: "500px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#e5e7eb transparent",
                }}
              >
                <style>{`
                  .promo-scroll::-webkit-scrollbar { width: 6px; }
                  .promo-scroll::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                  .promo-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                  .promo-scroll::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
                `}</style>

                {loading ? (
                  <div className="p-20 flex justify-center">
                    <Loader2 className="w-10 h-10 text-gray-200 animate-spin" />
                  </div>
                ) : promoCodes.length === 0 ? (
                  <div className="p-20 text-center">
                    <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No active promo codes.</p>
                    <p className="text-gray-300 text-sm mt-1">Create one using the form on the left.</p>
                  </div>
                ) : (
                  <>
                    {promoCodes.map((promo) => (
                      <div
                        key={promo.id}
                        className={`p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-4`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              promo.active
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {promo.active ? (
                              <TicketCheck className="w-5 h-5" />
                            ) : (
                              <Ticket className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                              <span className="font-mono tracking-wider">{promo.code}</span>
                              {promo.bannerActive && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Live
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                              <span>
                                {promo.coupon.percent_off
                                  ? `${promo.coupon.percent_off}% Discount`
                                  : `$${(promo.coupon.amount_off || 0) / 100} Discount`}
                              </span>
                              {promo.startDate && (
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                  <Calendar className="w-3 h-3" />
                                  from {formatStartDate(promo.startDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Banner Toggle */}
                          <div className="flex flex-col items-center gap-1">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                               {promo.active ? "Banner" : "Inactive"}
                             </span>
                             <ToggleSwitch
                               enabled={promo.bannerActive}
                               onChange={() => handleToggleBanner(promo)}
                               disabled={togglingId === promo.id}
                             />
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClick(promo)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete code"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
