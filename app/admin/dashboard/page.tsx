"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingCart, CreditCard, BookOpen, TrendingUp, Clock, Activity } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";

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
  createdAt: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    credentialUsers: 0,
    googleUsers: 0,
    purchasedUsers: 0,
    paidOrders: 0,
    booksCreated: 0,
    booksWithImages: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Users
    const usersQuery = query(collection(db, "users"), orderBy("updatedAt", "desc"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData: any[] = [];
      let creditors = 0;
      let googlers = 0;
      let purchased = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({ id: doc.id, ...data });
        if (data.provider === "google.com" || data.provider === "google") googlers++;
        else creditors++;
        if (data.isPurchased) purchased++;
      });

      setRecentUsers(usersData.slice(0, 5));
      setStats(prev => ({
        ...prev,
        totalUsers: snapshot.size,
        credentialUsers: creditors,
        googleUsers: googlers,
        purchasedUsers: purchased,
        paidOrders: purchased // Assuming paid orders match purchased users for now
      }));
      setLoading(false);
    });

    // 2. Listen to Books
    const booksQuery = query(collection(db, "books"), where("isDeleted", "==", false));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
        setStats(prev => ({
            ...prev,
            booksCreated: snapshot.size
        }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBooks();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-600 to-indigo-600" },
    { label: "Paid Orders", value: stats.paidOrders, icon: CreditCard, color: "from-green-600 to-emerald-600" },
    { label: "Live Books", value: stats.booksCreated, icon: BookOpen, color: "from-purple-600 to-fuchsia-600" },
    { label: "Google Logins", value: stats.googleUsers, icon: TrendingUp, color: "from-orange-600 to-rose-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">Live Dashboard</h1>
          <p className="text-white/40 text-sm font-medium">Real-time platform metrics from Firebase</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-md">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span className="text-sm font-bold text-green-500 uppercase tracking-tighter">Live Connection</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
              
              <div className="relative flex flex-col h-full">
                <div className={`p-3 w-fit rounded-2xl bg-gradient-to-br ${card.color} mb-6 shadow-lg shadow-black/20`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-black text-white mb-2 tabular-nums">{card.value}</p>
                <p className="text-white/40 text-sm font-bold uppercase tracking-wider">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Breakdown */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-400" />
                NETWORK STATS
            </h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60 font-medium">Google Auth</span>
                        <span className="text-white font-bold">{Math.round((stats.googleUsers / (stats.totalUsers || 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${(stats.googleUsers / (stats.totalUsers || 1)) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60 font-medium">Direct Logins</span>
                        <span className="text-white font-bold">{Math.round((stats.credentialUsers / (stats.totalUsers || 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-1000" 
                            style={{ width: `${(stats.credentialUsers / (stats.totalUsers || 1)) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-2 border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-green-400 text-sm font-bold uppercase tracking-widest">Active revenue users</span>
                        <span className="text-white text-2xl font-black">{stats.purchasedUsers}</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-white/5">
              <p className="text-white/60 text-xs leading-relaxed">
                  Platform is scaling. All connections are secured via Firebase Realtime listeners.
              </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-400" />
                RECENT ACTIVITY
            </h3>
            <button className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentUsers.length > 0 ? recentUsers.map((user, idx) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-black text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-base font-bold truncate max-w-[150px] md:max-w-none">{user.name}</p>
                    <p className="text-white/30 text-xs font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                        user.provider === "google.com" || user.provider === "google"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                        {user.provider?.replace(".com", "") || "Email"}
                    </span>
                    {user.isPurchased && (
                        <span className="text-[10px] px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-black uppercase tracking-widest">
                        PAID
                        </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/20 font-bold">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <Users className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest">Waiting for users...</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
