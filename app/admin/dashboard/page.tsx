"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingCart, CreditCard, BookOpen, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalUsers: number;
  credentialUsers: number;
  googleUsers: number;
  purchasedUsers: number;
  paidOrders: number;
  booksCreated: number;
  booksWithImages: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  isPurchased: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up polling interval for real-time updates
    const interval = setInterval(() => {
      fetchStats();
    }, 5000); // 5 seconds polling

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/stats?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "from-blue-600 to-cyan-600" },
    { label: "Paid Orders", value: stats?.paidOrders || 0, icon: CreditCard, color: "from-green-600 to-emerald-600" },
    { label: "Books Created", value: stats?.booksCreated || 0, icon: BookOpen, color: "from-purple-600 to-pink-600" },
    { label: "Google Users", value: stats?.googleUsers || 0, icon: TrendingUp, color: "from-orange-600 to-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 text-sm">Overview of your platform metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-10`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-white/40 text-sm">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            User Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Credential Users</span>
              <span className="text-white font-bold">{stats?.credentialUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Google Users</span>
              <span className="text-white font-bold">{stats?.googleUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Purchased</span>
              <span className="text-green-400 font-bold">{stats?.purchasedUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Books with Images</span>
              <span className="text-white font-bold">{stats?.booksWithImages || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Recent Users
          </h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600/30 to-orange-600/30 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-white/30 text-xs">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    user.provider === "google"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}>
                    {user.provider}
                  </span>
                  {user.isPurchased && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                      PAID
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
