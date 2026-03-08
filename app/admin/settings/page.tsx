"use client";

import { Settings, Globe, DollarSign, Printer } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm">Platform configuration and pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-bold">Pricing</h3>
          </div>
          <p className="text-white/30 text-sm">Configure book pricing, add-on costs, and markup.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-bold">Countries</h3>
          </div>
          <p className="text-white/30 text-sm">Manage available countries and shipping regions.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-bold">Print Integration</h3>
          </div>
          <p className="text-white/30 text-sm">PurePrint API configuration and settings.</p>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-bold">General</h3>
          </div>
          <p className="text-white/30 text-sm">Platform-wide settings and configurations.</p>
        </div>
      </div>
    </div>
  );
}
