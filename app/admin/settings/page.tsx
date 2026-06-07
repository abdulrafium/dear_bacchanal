"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Printer, 
  Save, 
  Plus, 
  Trash2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Lock
} from "lucide-react";
import { PlatformSettings, CountrySetting } from "@/types/settings";
import { toast } from "sonner";

type SettingSection = "pricing" | "countries" | "print" | "general" | "security";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingSection>("pricing");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        toast.success("Password updated successfully");
        setNewPassword("");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }
    } catch (error: any) {
      console.error("Password error:", error);
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight">PLATFORM SETTINGS</h1>
          <p className="text-white/40 text-sm">Configure core business logic and integrations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>SAVE CHANGES</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <NavItem 
            active={activeTab === "pricing"} 
            onClick={() => setActiveTab("pricing")}
            icon={DollarSign}
            label="Pricing"
            description="Book costs & markup"
            color="text-green-400"
          />
          <NavItem 
            active={activeTab === "countries"} 
            onClick={() => setActiveTab("countries")}
            icon={Globe}
            label="Countries"
            description="Shipping & availability"
            color="text-blue-400"
          />
          <NavItem 
            active={activeTab === "print"} 
            onClick={() => setActiveTab("print")}
            icon={Printer}
            label="Print Integration"
            description="PurePrint API config"
            color="text-purple-400"
          />
          <NavItem 
            active={activeTab === "general"} 
            onClick={() => setActiveTab("general")}
            icon={Settings}
            label="General"
            description="Global configuration"
            color="text-orange-400"
          />
          <NavItem 
            active={activeTab === "security"} 
            onClick={() => setActiveTab("security")}
            icon={Lock}
            label="Security"
            description="Admin authentication"
            color="text-red-400"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
          {activeTab === "pricing" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionHeader title="Pricing Configuration" description="Set the base prices for digital and physical copies." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  label="Hard Copy Price ($)" 
                  value={settings.pricing.hardCopyPrice / 100} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, hardCopyPrice: Math.round(v * 100) } })}
                  type="number"
                />
                <InputGroup 
                  label="Soft Copy Price ($)" 
                  value={settings.pricing.softCopyPrice / 100} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, softCopyPrice: Math.round(v * 100) } })}
                  type="number"
                />
                <InputGroup 
                  label="Sticker Price ($)" 
                  value={settings.pricing.stickerPrice / 100} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, stickerPrice: Math.round(v * 100) } })}
                  type="number"
                />
                <InputGroup 
                  label="Global Markup (%)" 
                  value={settings.pricing.markupPercentage} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, markupPercentage: v } })}
                  type="number"
                />
                <InputGroup 
                  label="Extra Spread Price ($)" 
                  value={settings.pricing.extraSpreadPrice / 100} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, extraSpreadPrice: Math.round(v * 100) } })}
                  type="number"
                />
                <InputGroup 
                  label="Extra Sticker Price ($)" 
                  value={settings.pricing.extraStickerPrice / 100} 
                  onChange={(v) => setSettings({ ...settings, pricing: { ...settings.pricing, extraStickerPrice: Math.round(v * 100) } })}
                  type="number"
                />
              </div>
            </div>
          )}

          {activeTab === "countries" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <SectionHeader title="Shipping Countries" description="Manage which countries you ship to and their rates." />
                <button 
                  onClick={() => {
                    const newCountry: CountrySetting = { code: "", name: "", shippingRate: 0, enabled: true };
                    setSettings({ ...settings, countries: [...settings.countries, newCountry] });
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {settings.countries.map((country, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 group">
                    <input 
                      className="bg-transparent border-none text-white font-bold w-12 focus:ring-0" 
                      placeholder="US"
                      value={country.code}
                      onChange={(e) => {
                        const newCountries = [...settings.countries];
                        newCountries[idx].code = e.target.value.toUpperCase();
                        setSettings({ ...settings, countries: newCountries });
                      }}
                    />
                    <input 
                      className="bg-transparent border-none text-white/60 flex-1 focus:ring-0" 
                      placeholder="Country Name"
                      value={country.name}
                      onChange={(e) => {
                        const newCountries = [...settings.countries];
                        newCountries[idx].name = e.target.value;
                        setSettings({ ...settings, countries: newCountries });
                      }}
                    />
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                      <span className="text-white/30 text-xs">$</span>
                      <input 
                        className="bg-transparent border-none text-white text-sm w-16 focus:ring-0 p-0" 
                        type="number"
                        value={country.shippingRate / 100}
                        onChange={(e) => {
                          const newCountries = [...settings.countries];
                          newCountries[idx].shippingRate = Math.round(parseFloat(e.target.value || "0") * 100);
                          setSettings({ ...settings, countries: newCountries });
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newCountries = [...settings.countries];
                        newCountries[idx].enabled = !newCountries[idx].enabled;
                        setSettings({ ...settings, countries: newCountries });
                      }}
                      className={`p-2 rounded-lg transition-colors ${country.enabled ? 'text-green-500 bg-green-500/10' : 'text-white/20 bg-white/5'}`}
                    >
                      {country.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => {
                        const newCountries = settings.countries.filter((_, i) => i !== idx);
                        setSettings({ ...settings, countries: newCountries });
                      }}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "print" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionHeader title="PurePrint API" description="Configure your printing partner integration." />
              <div className="space-y-4">
                <InputGroup 
                  label="API Key" 
                  value={settings.print.apiKey} 
                  onChange={(v) => setSettings({ ...settings, print: { ...settings.print, apiKey: v } })}
                  type="password"
                />
                <InputGroup 
                  label="API Endpoint" 
                  value={settings.print.endpoint} 
                  onChange={(v) => setSettings({ ...settings, print: { ...settings.print, endpoint: v } })}
                />
                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div>
                        <h4 className="text-white font-bold">Shipping Calculation</h4>
                        <p className="text-white/40 text-xs text-wrap max-w-[300px]">Use manual country rates or fetch live rates from Print API (PurePrint).</p>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, print: { ...settings.print, shippingMode: settings.print.shippingMode === 'manual' ? 'api' : 'manual' } })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          settings.print.shippingMode === 'api' 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 text-white/40 border border-white/5'
                      }`}
                    >
                        {settings.print.shippingMode === 'api' ? 'PRINT API (LIVE)' : 'MANUAL RATES'}
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div>
                        <h4 className="text-white font-bold">Environment</h4>
                        <p className="text-white/40 text-xs">Switch between Sandbox and Production</p>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, print: { ...settings.print, isLive: !settings.print.isLive } })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          settings.print.isLive 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                          : 'bg-white/5 text-white/40 border border-white/5'
                      }`}
                    >
                        {settings.print.isLive ? 'LIVE PRODUCTION' : 'SANDBOX MODE'}
                    </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionHeader title="General Settings" description="Global platform configuration and status." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  label="Site Name" 
                  value={settings.general.siteName} 
                  onChange={(v) => setSettings({ ...settings, general: { ...settings.general, siteName: v } })}
                />
                <InputGroup 
                  label="Contact Email" 
                  value={settings.general.contactEmail} 
                  onChange={(v) => setSettings({ ...settings, general: { ...settings.general, contactEmail: v } })}
                />
                <div className="md:col-span-2">
                  <InputGroup 
                    label="Admin Notification Email" 
                    value={settings.general.adminNotificationEmail} 
                    onChange={(v) => setSettings({ ...settings, general: { ...settings.general, adminNotificationEmail: v } })}
                  />
                </div>
                <InputGroup 
                  label="Refund Deadline (Days)" 
                  value={settings.general.refundDeadlineDays} 
                  onChange={(v) => setSettings({ ...settings, general: { ...settings.general, refundDeadlineDays: v } })}
                  type="number"
                />
              </div>
              
              <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/[0.02] flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Maintenance Mode</h4>
                        <p className="text-white/40 text-sm">Temporarily disable the storefront for maintenance.</p>
                    </div>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, general: { ...settings.general, maintenanceMode: !settings.general.maintenanceMode } })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.general.maintenanceMode ? 'bg-red-600' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <SectionHeader title="Security & Authentication" description="Manage your admin account security." />
              
              <div className="bg-red-500/[0.03] border border-red-500/10 rounded-2xl p-6 mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">Update Admin Password</h4>
                    <p className="text-white/40 text-sm mb-6">Changing this will update your password for all future logins.</p>
                    
                    <div className="max-w-md space-y-4">
                      <div className="space-y-2">
                        <label className="text-white/30 text-[10px] uppercase font-bold tracking-widest ml-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:bg-white/50 transition-all active:scale-95"
                      >
                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>UPDATE PASSWORD</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label, description, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group ${
        active 
          ? "bg-white/[0.05] border-white/10 shadow-xl" 
          : "bg-transparent border-transparent hover:bg-white/[0.02]"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"
      }`}>
        <Icon className={`w-5 h-5 ${active ? color : "text-white/20 group-hover:text-white/40"}`} />
      </div>
      <div className="text-left">
        <p className={`font-bold text-sm ${active ? "text-white" : "text-white/40 group-hover:text-white/60"}`}>{label}</p>
        <p className="text-[10px] uppercase tracking-wider text-white/20">{description}</p>
      </div>
    </button>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
      <p className="text-white/40 text-sm">{description}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-white/30 text-[10px] uppercase font-bold tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value || "0") : e.target.value)}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
      />
    </div>
  );
}

