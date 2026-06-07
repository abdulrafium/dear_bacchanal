"use client";

import { useEffect, useState } from "react";
import { Search, RotateCcw, Ban, CheckCircle, CreditCard, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  isPurchased: boolean;
  isDisabled: boolean;
  country?: string;
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

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&search=${search}`);
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
        <div className="overflow-x-auto">
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
                users.map((user) => (
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
                        {user.isPurchased && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 w-fit">
                            PURCHASED
                          </span>
                        )}
                        {user.isDisabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
                            DISABLED
                          </span>
                        )}
                        {!user.isPurchased && !user.isDisabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10 w-fit">
                            ACTIVE
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
                            onClick={() => handleAction(user.id, "resetPassword")}
                            disabled={actionLoading === user.id}
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            title="Reset Password"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(user.id, "togglePurchased")}
                          disabled={actionLoading === user.id}
                          className={`p-2 rounded-lg transition-all ${
                            user.isPurchased 
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" 
                              : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                          }`}
                          title={user.isPurchased ? "Revoke Purchase" : "Grant Purchase"}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-white/5 px-6 py-4 flex justify-between items-center">
            <p className="text-white/30 text-sm">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
