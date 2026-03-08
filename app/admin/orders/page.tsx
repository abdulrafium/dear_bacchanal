"use client";

import { ShoppingCart } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-white/40 text-sm">Manage customer orders and shipping</p>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
        <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
        <h3 className="text-white/40 font-medium mb-2">Order management coming soon</h3>
        <p className="text-white/20 text-sm">Will integrate with PurePrint API for order tracking, shipping status, and refund management.</p>
      </div>
    </div>
  );
}
