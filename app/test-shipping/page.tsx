"use client";

import { useState, useEffect } from "react";
import { Loader2, Package, Globe, MapPin, Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { WORLD_COUNTRIES } from "@/lib/countries";

export default function TestShippingPage() {
    const [countries, setCountries] = useState<any[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    
    const [shippingInfo, setShippingInfo] = useState({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "555-0198",
        line1: "123 Test Street",
        line2: "",
        city: "Testville",
        state: "CA",
        postalCode: "90210",
        country: "US",
        shippingMethod: "standard"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    
    const basePrice = 3500; // $35.00 Hard Copy Base Price

    useEffect(() => {
        const loadCountries = async () => {
            try {
                setLoadingCountries(true);
                // 1. Fetch our custom shipping rates from the admin panel
                const settingsRes = await fetch('/api/public/settings');
                const settingsData = await settingsRes.json();
                const adminRates = settingsData.countries || [];

                // 2. Format and merge them alphabetically using our local reliable array
                const formattedCountries = WORLD_COUNTRIES.map((c) => {
                    // Check if we have a specific flat rate for this country in the admin panel
                    const customAdminRate = adminRates.find((ac: any) => ac.code === c.code);
                    return {
                        code: c.code,
                        name: c.name,
                        // If we have an admin rate use it, otherwise fallback to a generic $25.00 international rate
                        shippingRate: customAdminRate ? customAdminRate.shippingRate : 2500 
                    };
                });

                setCountries(formattedCountries);
                
                // If currently selected country isn't in the list, default to the first one
                if (formattedCountries.length > 0 && !shippingInfo.country) {
                    setShippingInfo(prev => ({ ...prev, country: formattedCountries[0].code }));
                }

            } catch (error) {
                console.error("Failed to load worldwide countries:", error);
            } finally {
                setLoadingCountries(false);
            }
        };
        loadCountries();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        setSubmissionSuccess(false);

        try {
            const res = await fetch('/api/shipping/submit-test-order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shippingInfo: {
                        name: shippingInfo.name,
                        line1: shippingInfo.line1,
                        line2: shippingInfo.line2,
                        city: shippingInfo.city,
                        state: shippingInfo.state,
                        postalCode: shippingInfo.postalCode,
                        country: shippingInfo.country,
                        email: shippingInfo.email,
                        phone: shippingInfo.phone
                    }
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSubmissionSuccess(true);
                setResult(data);
                toast.success("Staging Order successfully submitted to PurePrint!");
            } else {
                toast.error(data.error || "Failed to submit staging order");
                setResult(data);
            }
        } catch (error) {
            toast.error("Network error submitting staging order");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCountryData = countries.find(c => c.code === shippingInfo.country);
    const shippingCost = selectedCountryData?.shippingRate ?? 1500; // Default $15.00 if not found
    const totalCost = basePrice + shippingCost;

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16 font-sans">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Left Column - Form */}
                <div>
                    <div className="mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2 flex items-center gap-3">
                            <Package className="w-8 h-8 text-[#D32F2F]" />
                            PurePrint Order API
                        </h1>
                        <p className="text-white/50 text-sm">Test the Order Submission API payload and Webhooks for the staging environment.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0f0f0f] p-8 rounded-3xl border border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Full Name</label>
                                <input required type="text" name="name" value={shippingInfo.name} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Phone Number</label>
                                <input required type="text" name="phone" value={shippingInfo.phone} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
                            <input required type="email" name="email" value={shippingInfo.email} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                        </div>

                        <hr className="border-white/5 my-6" />

                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Address Line 1</label>
                            <input required type="text" name="line1" value={shippingInfo.line1} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Address Line 2 (Optional)</label>
                            <input type="text" name="line2" value={shippingInfo.line2} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">City</label>
                                <input required type="text" name="city" value={shippingInfo.city} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">State / Province</label>
                                <input type="text" name="state" value={shippingInfo.state} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Postal / Zip Code</label>
                                <input required type="text" name="postalCode" value={shippingInfo.postalCode} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Country</label>
                                <div className="relative">
                                    <select required name="country" value={shippingInfo.country} onChange={handleChange} disabled={loadingCountries} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#be2826] outline-none transition-colors appearance-none">
                                        {loadingCountries ? (
                                            <option value="">Loading...</option>
                                        ) : (
                                            countries.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-red-900/20"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                            {isSubmitting ? "Submitting Order..." : "Submit Staging Order"}
                        </button>
                    </form>
                </div>

                {/* Right Column - Results Display */}
                <div className="space-y-6">
                    <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 sticky top-8 shadow-xl">
                        <div className="space-y-6">
                            
                            {/* Quote Summary Section */}
                            <div>
                                <h3 className="text-white font-bold font-sans tracking-wide text-lg border-b border-white/10 pb-4 mb-4">Pricing Summary</h3>
                                <div className="space-y-3 pb-4 border-b border-white/10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/60">Hard Copy Base Book</span>
                                        <span className="text-white font-mono">${(basePrice / 100).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/60 flex items-center gap-2">
                                            Delivery Charges
                                            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">Flat Rate Fallback</span>
                                        </span>
                                        <span className="font-mono text-white">
                                            ${(shippingCost / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <span className="text-white font-black text-xl uppercase tracking-wider">Total Charge</span>
                                    <span className="text-[#D32F2F] font-black text-2xl font-mono">
                                        ${(totalCost / 100).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Staging Order Status */}
                            <div>
                                <h3 className="text-white font-bold font-sans tracking-wide text-lg border-b border-white/10 pb-4 mb-4">Staging Order Status</h3>
                                
                                {result?.error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Submission Failed
                                        </div>
                                        <p className="text-red-300 text-sm">{result.error}</p>
                                    </div>
                                )}

                                {submissionSuccess && result && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                                <CheckCircle2 className="w-5 h-5" />
                                                API Submission Succeeded
                                            </div>
                                            <p className="text-green-300/80 text-sm">
                                                The test order was successfully pushed to the HP SiteFlow PurePrint staging environment.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-white/60">Source Order ID</span>
                                                <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{result.sourceOrderId}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-white/60">HP SiteFlow ID</span>
                                                <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">Pending Webhook</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-white/60">Status</span>
                                                <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded">Staging Mode</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 pt-6 border-t border-white/10">
                                            <p className="text-white/40 text-xs text-center leading-relaxed">
                                                PurePrint will now begin simulating the manufacturing process.
                                                Status updates will be automatically pushed back to our Webhook endpoint.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {!result && !isSubmitting && (
                                    <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-xl mt-4">
                                        <Globe className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                        <p className="text-white/40 text-sm">Fill out the form and click submit to test the PurePrint API order submission workflow.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
