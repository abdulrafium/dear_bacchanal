"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  ShoppingCart, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Activity, 
  Loader2, 
  DollarSign, 
  BarChart3,
  Percent
} from "lucide-react";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

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
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    credentialUsers: 0,
    googleUsers: 0,
    purchasedUsers: 0,
    paidOrders: 0,
    booksCreated: 0,
    booksWithImages: 0,
  });
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0,
    markup: 0,
    salesChart: [] as any[]
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentUsers(data.recentUsers);
          setFinancials({
            totalRevenue: data.totalRevenue,
            totalProfit: data.totalProfit,
            averageOrderValue: data.averageOrderValue,
            markup: data.markup,
            salesChart: data.salesChart
          });
        } else if (res.status === 401) {
            toast.error("Unauthorized: Admin access required");
        } else {
            toast.error("Failed to fetch dashboard stats");
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("An error occurred while loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && stats.totalUsers === 0) {
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
    { label: "Total Revenue", value: `$${financials.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "from-green-600 to-emerald-600" },
    { label: "Est. Profit", value: `$${Math.round(financials.totalProfit).toLocaleString()}`, icon: TrendingUp, color: "from-amber-600 to-orange-600" },
    { label: "Live Books", value: stats.booksCreated, icon: BookOpen, color: "from-purple-600 to-fuchsia-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">Live Dashboard</h1>
          <p className="text-white/40 text-sm font-medium">Real-time platform metrics from MongoDB</p>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Markup</p>
                <p className="text-white font-black text-xl">{financials.markup}%</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-md">
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-sm font-bold text-green-500 uppercase tracking-tighter">Connected</span>
            </div>
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
                <div className={`p-3 w-fit rounded-2xl bg-gradient-to-br ${card.color} mb-6 shadow-lg shadow-black/20 text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl font-black text-white mb-1 tabular-nums tracking-tighter">{card.value}</p>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Chart */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                    Revenue Analytics
                </h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financials.salesChart}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#ffffff30" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis 
                            stroke="#ffffff30" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRev)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* User Breakdown */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-400" />
                NETWORK
            </h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40 font-black uppercase">Google Auth</span>
                        <span className="text-white font-black">{stats.totalUsers > 0 ? Math.round((stats.googleUsers / stats.totalUsers) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                            style={{ width: `${stats.totalUsers > 0 ? (stats.googleUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40 font-black uppercase">Direct Logins</span>
                        <span className="text-white font-black">{stats.totalUsers > 0 ? Math.round((stats.credentialUsers / stats.totalUsers) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                            style={{ width: `${stats.totalUsers > 0 ? (stats.credentialUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                
                <div className="mt-12 space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-green-400" />
                                <span className="text-white/60 text-xs font-black uppercase">Paid Users</span>
                            </div>
                            <span className="text-white text-xl font-black">{stats.purchasedUsers}</span>
                        </div>
                    </div>
                    </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <Clock className="w-6 h-6 text-orange-400" />
                Live User Activity
            </h3>
            <button className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors tracking-widest">View All Users</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentUsers.length > 0 ? recentUsers.map((user, idx) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-black text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{user.name}</p>
                    <p className="text-white/30 text-[10px] font-medium truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                      user.provider === "google"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}>
                      {user.provider || "Email"}
                  </span>
                  {user.isPurchased && (
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-black uppercase tracking-widest">
                      PAID
                      </span>
                  )}
                </div>
              </div>
            )) : loading ? (
                 <div className="col-span-full flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                </div>
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
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
