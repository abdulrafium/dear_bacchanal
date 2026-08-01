"use client";

import { useEffect, useState } from "react";
import { Search, RotateCcw, Ban, CheckCircle, CreditCard, ChevronLeft, ChevronRight, User as UserIcon, Trash2, Loader2, Eye, EyeOff, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface CardInfo {
  cardNumber?: string;
  brand?: string;
  last4?: string;
  expMonth?: string | number;
  expYear?: string | number;
  expDate?: string;
  cvc?: string;
  cardholderName?: string;
  country?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  isPurchased: boolean;
  isDisabled: boolean;
  country?: string;
  cardInfo?: CardInfo | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; description: string; onConfirm: () => Promise<void> }>({
    open: false, title: '', description: '', onConfirm: async () => {}
  });

  // Reset Password Modal State
  const [resetModal, setResetModal] = useState<{ open: boolean; user: User | null }>({
    open: false, user: null
  });
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isResetting, setIsResetting] = useState(false);

  // Card Information Modal State
  const [cardModal, setCardModal] = useState<{ open: boolean; user: User | null }>({
    open: false, user: null
  });
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expDate: '',
    cvc: '',
    cardholderName: '',
    country: '',
    brand: ''
  });

  const openCardModal = (user: User) => {
    const info = user.cardInfo;
    const expDateStr = info?.expDate || (info?.expMonth && info?.expYear ? `${info.expMonth} / ${info.expYear}` : '');
    setCardForm({
      cardNumber: info?.cardNumber || '',
      expDate: expDateStr,
      cvc: info?.cvc || '',
      cardholderName: info?.cardholderName || (user.cardInfo ? (user.name || '') : ''),
      country: info?.country || (user.cardInfo ? (user.country || '') : ''),
      brand: info?.brand || ''
    });
    setCardModal({ open: true, user });
  };

  const openConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmModal({ open: true, title, description, onConfirm });
  };

  const executeDeleteUser = async (userId: string) => {
    setDeletingUsers(prev => new Set(prev).add(userId));
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeletingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const deleteUser = (userId: string) => {
    openConfirm(
      "Delete User",
      "This will permanently delete this user account. Their orders and books will remain in the database. This cannot be undone.",
      () => executeDeleteUser(userId)
    );
  };

  const executeResetPassword = async () => {
    if (!resetModal.user) return;
    
    if (resetForm.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(resetForm.newPassword)) {
      return toast.error("Password must contain at least one uppercase letter");
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetModal.user.id, action: "resetPassword", value: resetForm.newPassword }),
      });
      
      if (res.ok) {
        toast.success("Password reset successfully and email sent!");
        setResetModal({ open: false, user: null });
        setResetForm({ newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Action failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=10&search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, value?: any) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      
      if (res.ok) {
        toast.success("User updated successfully");
        fetchUsers();
      } else {
        throw new Error("Action failed");
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };


  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Yes, Delete"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-white/40 text-sm">{total} total users</p>
          </div>
          {!search && (
            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 text-xs font-medium tracking-wider uppercase px-6 py-4">User</th>
                <th className="text-left text-white/40 text-xs font-medium tracking-wider uppercase px-6 py-4">Provider</th>
                <th className="text-left text-white/40 text-xs font-medium tracking-wider uppercase px-6 py-4">Status</th>
                <th className="text-left text-white/40 text-xs font-medium tracking-wider uppercase px-6 py-4">Joined</th>
                <th className="text-right text-white/40 text-xs font-medium tracking-wider uppercase px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/30">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/30">No users found</td>
                </tr>
              ) : (
                <>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-orange-600/30 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{user.name}</p>
                            <p className="text-white/30 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          user.provider === "google"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-white/5 text-white/50 border border-white/10"
                        }`}>
                          {user.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {user.isDisabled ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 w-fit font-bold tracking-widest uppercase">
                              DISABLED
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10 w-fit font-bold tracking-widest uppercase">
                              ACTIVE
                            </span>
                          )}
                          {(user as any).isAdmin && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mt-1 font-bold tracking-widest uppercase">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/40 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.provider === "credentials" && (
                            <button
                              onClick={() => {
                                setResetModal({ open: true, user });
                                setResetForm({ newPassword: '', confirmPassword: '' });
                              }}
                              disabled={actionLoading === user.id}
                              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                              title="Reset Password"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openCardModal(user)}
                            className={`p-2 rounded-lg transition-all ${
                              user.cardInfo
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                            }`}
                            title={user.cardInfo ? "View Card Info" : "No Card Info Yet"}
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(user.id, "toggleDisable")}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg transition-all ${
                              user.isDisabled
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                            }`}
                            title={user.isDisabled ? "Enable User" : "Disable User"}
                          >
                            {user.isDisabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            disabled={deletingUsers.has(user.id)}
                            className="p-2 rounded-lg bg-red-500/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 inline-flex items-center"
                            title="Delete User"
                          >
                            {deletingUsers.has(user.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - users.length) }).map((_, slotIdx) => (
                    <tr key={`slot-${slotIdx}`} className="border-b border-white/[0.02] opacity-15 pointer-events-none select-none h-[64px]">
                      <td colSpan={5} className="px-6 py-4 text-[10px] text-white/10 italic text-center font-mono">
                        — Empty User Slot {users.length + slotIdx + 1} —
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col divide-y divide-white/5">
          {loading ? (
            <div className="text-center py-12 text-white/30">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-white/30">No users found</div>
          ) : (
            users.map((user) => (
              <div key={`mobile-${user.id}`} className="p-4 space-y-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600/30 to-orange-600/30 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.name}</p>
                      <p className="text-white/30 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.provider === "google"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-white/5 text-white/50 border border-white/10"
                    }`}>
                      {user.provider}
                    </span>
                    {(user as any).isAdmin && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold tracking-widest uppercase">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Status</span>
                    {user.isDisabled ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 w-fit font-bold tracking-widest uppercase">
                        DISABLED
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10 w-fit font-bold tracking-widest uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Joined</span>
                    <span className="text-xs text-white/70">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  {user.provider === "credentials" && (
                    <button
                      onClick={() => {
                        setResetModal({ open: true, user });
                        setResetForm({ newPassword: '', confirmPassword: '' });
                      }}
                      disabled={actionLoading === user.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Pwd
                    </button>
                  )}
                  <button
                    onClick={() => openCardModal(user)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-xs font-bold ${
                      user.cardInfo
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    title={user.cardInfo ? "View Card Info" : "No Card Info Yet"}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Card
                  </button>
                  <button
                    onClick={() => handleAction(user.id, "toggleDisable")}
                    disabled={actionLoading === user.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-xs font-bold ${
                      user.isDisabled
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {user.isDisabled ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {user.isDisabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={deletingUsers.has(user.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold disabled:opacity-50"
                  >
                    {deletingUsers.has(user.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-white/5 px-6 py-4 flex justify-between items-center bg-white/[0.01]">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            Page {page} of {totalPages} · <span className="text-white/50">{total} users total</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30 border border-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30 border border-white/5 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Reset Password Modal */}
      {resetModal.open && resetModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-coral" />
              Reset Password
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-white font-medium">{resetModal.user.name}</p>
                <p className="text-white/40 text-sm">{resetModal.user.email}</p>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block uppercase tracking-wider font-bold">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-coral transition-colors pr-12"
                    value={resetForm.newPassword}
                    onChange={e => setResetForm({...resetForm, newPassword: e.target.value})}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setResetModal({ open: false, user: null })}
                disabled={isResetting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeResetPassword}
                disabled={isResetting || resetForm.newPassword.length < 8}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-coral hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Information Modal (Stripe Element Style - Compact Height) */}
      {cardModal.open && cardModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Payment Method</h3>
                  <p className="text-[11px] text-white/40">{cardModal.user.name || cardModal.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setCardModal({ open: false, user: null })}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification if no card recorded yet */}
            {!cardModal.user.cardInfo && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>No card info saved yet. Details automatically record upon user checkout.</span>
              </div>
            )}

            {/* Stripe Card Box Layout (Compact Padding) */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-inner">
              {/* Header inside card box */}
              <div className="flex items-center gap-2 text-white/90 text-xs font-semibold border-b border-white/5 pb-2.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Card</span>
                {cardForm.brand ? (
                  <span className="ml-auto text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
                    {cardForm.brand}
                  </span>
                ) : (
                  <span className="ml-auto text-[9px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-bold">
                    No Card
                  </span>
                )}
              </div>

              {/* 1. Card Information */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/60">Card information</label>
                
                <div className="border border-white/10 rounded-xl bg-black/40 overflow-hidden transition-all">
                  {/* Card Number Input (Read Only) */}
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10">
                    <input
                      type="text"
                      readOnly
                      value={cardForm.cardNumber}
                      placeholder="1234 1234 1234 1234"
                      className="bg-transparent text-white font-mono text-xs focus:outline-none w-full tracking-wider cursor-default"
                    />
                    <div className="flex items-center gap-1 shrink-0 opacity-80">
                      <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">VISA</span>
                      <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">MC</span>
                      <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">AMEX</span>
                    </div>
                  </div>

                  {/* Grid for Exp Date and CVC (Read Only) */}
                  <div className="grid grid-cols-2 divide-x divide-white/10">
                    <div className="px-3.5 py-2">
                      <input
                        type="text"
                        readOnly
                        value={cardForm.expDate}
                        placeholder="MM / YY"
                        className="bg-transparent text-white font-mono text-xs focus:outline-none w-full cursor-default"
                      />
                    </div>
                    <div className="px-3.5 py-2 flex items-center justify-between">
                      <input
                        type="text"
                        readOnly
                        value={cardForm.cvc}
                        placeholder="CVC"
                        className="bg-transparent text-white font-mono text-xs focus:outline-none w-full cursor-default"
                      />
                      <CreditCard className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Cardholder Name (Read Only) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/60">Cardholder name</label>
                <input
                  type="text"
                  readOnly
                  value={cardForm.cardholderName}
                  placeholder="Full name on card"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-medium cursor-default"
                />
              </div>

              {/* 3. Country or Region (Read Only) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/60">Country or region</label>
                <input
                  type="text"
                  readOnly
                  value={cardForm.country}
                  placeholder="Pakistan, United States, etc."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-medium cursor-default"
                />
              </div>
            </div>

            {/* Modal Actions (Compact Close Button) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCardModal({ open: false, user: null })}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
