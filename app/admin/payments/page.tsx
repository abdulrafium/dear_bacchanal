"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Loader2,
  PieChart,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  recentPayments: any[];
}

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      toast.error("Failed to load payment stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase">Financial Overview</h1>
        <p className="text-white/40 text-sm">Monitor revenue, transactions, and payment health</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={`$${((stats?.totalRevenue || 0) / 100).toLocaleString()}`} 
          trend="+12.5%" 
          trendUp={true} 
          icon={DollarSign}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <MetricCard 
          title="Total Orders" 
          value={stats?.totalOrders || 0} 
          trend="+8.2%" 
          trendUp={true} 
          icon={CreditCard}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <MetricCard 
          title="Avg. Order Value" 
          value={`$${((stats?.averageOrderValue || 0) / 100).toFixed(2)}`} 
          trend="-2.4%" 
          trendUp={false} 
          icon={TrendingUp}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <MetricCard 
          title="Conversion Rate" 
          value="3.2%" 
          trend="+0.6%" 
          trendUp={true} 
          icon={Activity}
          color="text-orange-400"
          bg="bg-orange-400/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Recent Transactions</h3>
            <button className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-all">View All</button>
          </div>
          
          <div className="space-y-4">
            {stats?.recentPayments?.map((payment: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{payment.email}</p>
                    <p className="text-[10px] text-white/20 uppercase font-black">{format(new Date(payment.createdAt), 'MMM dd, yyyy · HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">${(payment.amount / 100).toFixed(2)}</p>
                  <p className="text-[9px] text-green-400 font-black uppercase tracking-widest">Successful</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-bold text-white uppercase tracking-tighter mb-8 text-center">Revenue Distribution</h3>
          <div className="relative h-64 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-[12px] border-white/5 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs font-black text-white/40 uppercase">Stripe</p>
                <p className="text-xl font-black text-white">100%</p>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             <div className="flex items-center justify-between text-sm">
                <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Stripe Checkout</span>
                <span className="text-white font-black">$...</span>
             </div>
             <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 w-full" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110 duration-500`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-white/30 text-[10px] uppercase font-black tracking-[2px] mb-1">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
