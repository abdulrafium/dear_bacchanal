"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  FolderHeart,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  Book,
  Globe,
  Calendar as CalendarIcon,
  Search,
  Loader2,
  FileText,
  History,
  Info,
  Undo2,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Printer,
  X,
  ExternalLink,
  Copy,
  Check,
  Truck,
  Clock,
  ShieldAlert
} from "lucide-react";
import { getCarrierTrackingUrl, formatCarrierName } from "@/lib/tracking";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

interface GlobalTemplate {
  _id: string;
  name: string;
  description: string;
  country: string;
  year: string;
  thumbnail: string;
  active?: boolean;
}

const CustomizeRitual = () => {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"global" | "saved" | "orders">("global");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<any>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState<{
    taxPercentage: number;
    refundDeductionPercentage: number;
    refundDeadlineDays: number;
  }>({
    taxPercentage: 20,
    refundDeductionPercentage: 20,
    refundDeadlineDays: 14,
  });
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Live ticker for countdown timer
  useEffect(() => {
    if (!isRefundModalOpen) return;
    setNowTime(Date.now());
    const timerInterval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isRefundModalOpen]);

  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  const handleCopyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTrackingId(trackingNumber);
    toast.success("Tracking number copied to clipboard!");
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    const loadingToast = toast.loading("Generating PDF...");

    try {
      const element = invoiceRef.current;
      // Temporarily ensure the element is visible and not constrained for html2canvas
      const originalStyle = element.style.cssText;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${invoiceData?.invoiceNumber || 'DearBacchanal'}.pdf`);

      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.dismiss(loadingToast);
      toast.error(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
    }
  };

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { openModal } = useAuthModal();
  const isAdmin = user?.isAdmin;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders" || tabParam === "saved" || tabParam === "global") {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoadingTemplates && !isAuthLoading && !isAuthenticated) {
      router.push("/");
      openModal("signin");
    }
  }, [isAuthenticated, isAuthLoading, isLoadingTemplates, router, openModal]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTemplates(true);
      try {
        // Fetch Global Templates
        const globalRes = await fetch("/api/templates/global");
        if (globalRes.ok) {
          const data = await globalRes.json();
          const activeTemplates = (data.templates || []).filter((t: any) => t.active !== false);
          setTemplates(activeTemplates);
        }

        // Fetch User Templates if authenticated
        if (isAuthenticated) {
          const userRes = await fetch("/api/templates");
          if (userRes.ok) {
            const data = await userRes.json();
            setUserTemplates(data.templates || []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/editor/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: templateToDelete.id })
      });

      if (res.ok) {
        setUserTemplates(prev => prev.filter(t => t._id !== templateToDelete.id));
        toast.success("Design deleted successfully");
        setTemplateToDelete(null);
      } else {
        toast.error("Failed to delete design");
      }
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.refundPolicy) {
          setRefundPolicy(data.refundPolicy);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error("Please enter a mandatory refund reason (max 50 characters).");
      return;
    }
    if (refundReason.trim().length > 50) {
      toast.error("Refund reason cannot exceed 50 characters.");
      return;
    }

    if (!selectedOrderForRefund) return;

    // Client-side guard for deadline & hard copy printing
    const isHardCopy = (
      selectedOrderForRefund.type?.toLowerCase() === 'hard' || 
      selectedOrderForRefund.orderType?.toLowerCase() === 'hard'
    );
    if (isHardCopy && selectedOrderForRefund.status !== 'pending_approval') {
      toast.error("This order has already been sent to PurePrint for printing and cannot be refunded.");
      return;
    }

    const orderCreatedAt = selectedOrderForRefund.createdAt ? new Date(selectedOrderForRefund.createdAt).getTime() : Date.now();
    const policyDays = refundPolicy.refundDeadlineDays || 14;
    const deadlineTimestamp = orderCreatedAt + (policyDays * 24 * 60 * 60 * 1000);
    if (Date.now() > deadlineTimestamp) {
      toast.error(`The ${policyDays}-day refund window for this order has expired.`);
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch("/api/orders/refund/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderForRefund._id || selectedOrderForRefund.id || selectedOrderForRefund.orderId,
          reason: refundReason
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Refund request submitted successfully!");
        setOrders(orders.map(o =>
          (o._id === selectedOrderForRefund._id || o.id === selectedOrderForRefund.id || o.orderId === selectedOrderForRefund.orderId)
            ? { ...o, status: 'refund_pending' }
            : o
        ));
        setIsRefundModalOpen(false);
        setRefundReason("");
      } else {
        toast.error(data.error || "Failed to submit refund request");
      }
    } catch (error) {
      toast.error("An error occurred while submitting refund request");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const openInvoice = async (orderId: string) => {
    setLoadingInvoice(true);
    setIsInvoiceOpen(true);
    try {
      const res = await fetch(`/api/admin/orders/invoice/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoiceData({ ...data, orderId }); // passing orderId for reference if needed
      } else {
        const errData = await res.json();
        toast.error(`Receipt Error: ${errData.error || res.statusText}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to load receipt: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleHeroAction = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTemplateSelect = (templateName: string, bookId?: string, isGlobal = false) => {
    if (!isAuthenticated) {
      openModal("signup");
      return;
    }
    if (isGlobal) {
      router.push(`/editor?templateName=${encodeURIComponent(templateName)}&fresh=true`);
    } else if (bookId) {
      router.push(`/editor?templateName=${encodeURIComponent(templateName)}&bookId=${bookId}`);
    } else {
      router.push(`/editor?templateName=${encodeURIComponent(templateName)}`);
    }
  };

  const filteredTemplates = (activeTab === "global" ? templates : userTemplates).filter(t => {
    const name = activeTab === "global" ? t.name : t.bookName;
    const country = t.country || "";
    const year = t.year || "";

    return name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      year?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const steps = [
    {
      icon: Camera,
      num: "01",
      title: "Collect",
      subtitle: "Your Photos",
      description: "Gather your best carnival moments from every source.",
    },
    {
      icon: Users,
      num: "02",
      title: "Gather",
      subtitle: "From Friends",
      description: "The best shots are always in someone else's phone.",
    },
    {
      icon: FolderHeart,
      num: "03",
      title: "Curate",
      subtitle: "Your Favorites",
      description: "Select the moments that matter most to you.",
    },
    {
      icon: Sparkles,
      num: "04",
      title: "Create",
      subtitle: "Your Book",
      description: "Transform memories into a timeless keepsake.",
    },
  ];

  const tips = [
    "Dig through WhatsApp groups",
    "Ask fete photographers",
    "Include voice note screenshots",
    "Pre-carnival photos matter",
    "Document jouvert to last lap",
    "Save wristbands & receipts",
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ========== HERO ANIMATIONS ==========
      const heroTl = gsap.timeline({ delay: 0.3 });

      // Tag slides in
      heroTl.fromTo(
        ".hero-tag",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );

      // Title words reveal
      heroTl.fromTo(
        ".hero-title-main span",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power4.out",
        },
        0.4
      );

      // Description fade up
      heroTl.fromTo(
        ".hero-desc",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );

      // CTA buttons pop in
      heroTl.fromTo(
        ".hero-cta-btn",
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: "back.out(1.5)",
        },
        "-=0.3"
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-background overflow-x-hidden">
      {/* HERO SECTION - REVERTED STYLE */}
      <section
        ref={heroRef}
        className="relative pt-20 min-h-screen flex items-center overflow-hidden bg-background"
      >
        {/* Colorful decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between py-12 lg:py-24">
            {/* Left Content Column */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-10 animate-slide-up self-center">
              {/* Tag */}
              <div className="hero-tag inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="font-body text-[11px] tracking-[0.5em] uppercase text-primary font-black">
                  The Premium Keep-Sake
                </span>
              </div>

              {/* Title - responsive sizing */}
              <div className="space-y-2 hero-title-main">
                <h1 className="font-display leading-[0.95] tracking-tighter">
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-foreground uppercase">
                    Your
                  </span>
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-primary uppercase">
                    Carnival
                  </span>
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-foreground underline decoration-primary/20 uppercase">
                    Story
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="hero-desc font-body text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed lg:pr-8">
                Transform your carnival memories into a beautiful photo book
                keepsake that lasts forever. Each page captures the rhythm of your street.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row items-center gap-6 pt-4 w-full sm:w-auto">
                <Button
                  variant="carnival"
                  size="xl"
                  onClick={handleHeroAction}
                  className="hero-cta-btn w-full sm:w-auto text-xl px-12 py-9 shadow-2xl hover:scale-105 transition-all uppercase"
                >
                  <span className="flex items-center gap-4">
                    Create Your Book
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => {
                    setActiveTab("saved");
                    handleHeroAction();
                  }}
                  className="hero-cta-btn w-full sm:w-auto border-2 border-primary/20 hover:bg-white/5 text-xl py-9"
                >
                  <div className="flex items-center justify-center gap-3">
                    <FolderHeart className="w-5 h-5 text-primary" />
                    My Designs
                  </div>
                </Button>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[350px] sm:max-w-[400px] lg:max-w-[480px] aspect-[4/5] lg:aspect-square flex items-center justify-center">
                <div className="absolute w-[140%] h-[140%] bg-primary/20 rounded-full blur-[100px] animate-pulse-subtle" />
                <div className="relative w-full h-[85%] lg:h-full flex items-center justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-[60%] -translate-y-[55%] w-[80%] h-[80%] rounded-3xl bg-secondary/30 shadow-2xl skew-y-3 -rotate-6 backdrop-blur-sm border border-white/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-[55%] -translate-y-[50%] w-[80%] h-[80%] rounded-3xl bg-accent/20 shadow-2xl skew-y-2 -rotate-3 border border-white/10" />
                  <div className="relative w-[85%] h-[85%] lg:w-[90%] lg:h-[90%] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] border-2 border-white/10 group">
                    <img
                      src="/book-cover.jpg"
                      alt="Carnival Photo Book"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/20 to-transparent opacity-80" />
                    <div className="absolute bottom-10 left-10 right-10 text-left">
                      <div className="space-y-2">
                        <span className="font-handwritten text-4xl sm:text-6xl text-accent block">Your Story</span>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-px bg-white/40" />
                          <p className="font-body text-xs sm:text-sm text-white font-bold tracking-[0.4em] uppercase">Carnival 2026</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES GALLERY - NEW SECTION */}
      <section id="templates" ref={galleryRef} className="py-24 bg-background relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Premium Designs</span>
              </div>
              <h2 className="font-display text-5xl text-foreground uppercase tracking-tight">
                {activeTab === "global" ? (
                  <>DISCOVER THE <span className="text-primary italic">THEMES</span></>
                ) : (
                  <>YOUR SAVED <span className="text-primary italic">DESIGNS</span></>
                )}
              </h2>

              <div className="flex bg-white/5 p-1 rounded-xl w-fit border border-white/10">
                <button
                  onClick={() => setActiveTab("global")}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "global" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white"}`}
                >
                  Global Store
                </button>
                {!isAdmin && (
                  <>
                    <button
                      onClick={() => setActiveTab("saved")}
                      className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "saved" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white"}`}
                    >
                      My Designs
                    </button>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "orders" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white"}`}
                    >
                      My Orders
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search styles, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {activeTab === "orders" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isLoadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-white/40 text-xs tracking-widest uppercase">Fetching your history...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group hover:bg-white/[0.05] transition-all hover:border-primary/20">
                      <div className="w-full md:w-32 aspect-[3/4] bg-black/40 rounded-2xl overflow-hidden border border-white/5 relative flex-shrink-0">
                        <img src="/book-cover.jpg" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-primary shadow-2xl" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em]">Transaction ID</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/40 font-mono">{(order.orderId || order.id || order._id || "").slice(-8).toUpperCase()}</span>
                            </div>
                            <h3 className="text-2xl font-display text-white uppercase">{order.templateName || "Custom Carnival Book"}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-display text-primary">${(Number(order.amount || order.totalAmount || 0) / 100).toFixed(2)}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <OrderStat label="TYPE" value={(order.type || order.orderType) === 'hard' ? 'Hard Copy' : (order.type || order.orderType) === 'admin_test' ? 'Admin Test' : 'Soft Copy'} />
                          {/* STATUS — colour-coded badge */}
                          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                            <div className="text-[9px] font-black text-white/30 uppercase tracking-[3px] mb-1.5">Status</div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.status === 'pending_approval'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : order.status === 'processing'
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  : order.status === 'paid'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : order.status === 'shipped'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                      : order.status === 'delivered'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : order.status === 'refund_pending'
                                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                          : order.status === 'refunded'
                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            : order.status === 'cancelled'
                                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                              : 'bg-teal/10 text-teal border-teal/20'
                              }`}>
                              {order.status === 'pending_approval' ? 'Pending Approval'
                                : order.status === 'processing' ? 'Processing'
                                  : order.status === 'paid' ? 'Paid'
                                    : order.status === 'processing' ? 'Processing'
                                      : order.status === 'shipped' ? 'Shipped'
                                        : order.status === 'delivered' ? 'Delivered'
                                          : order.status === 'refund_pending' ? 'Refund Pending'
                                            : order.status === 'refunded' ? 'Refunded'
                                              : order.status === 'cancelled' ? 'Cancelled'
                                                : (order.status || 'Paid').toUpperCase()}
                            </span>
                          </div>
                          <OrderStat label="PAGES" value={order.pagesCount ? `${order.pagesCount} Pages` : (order.spreadsCount ? `${order.spreadsCount * 2} Pages` : '34 Pages')} />
                          <OrderStat label="EDITION" value={(order.type || order.orderType) === 'hard' ? 'Hardcover Heirloom' : (order.type || order.orderType) === 'admin_test' ? 'Admin Test' : 'Digital PDF'} />
                        </div>

                        {/* Pending Approval info banner for hard copy orders */}
                        {order.status === 'pending_approval' && (
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-amber-400 text-lg leading-none mt-0.5">⏳</span>
                            <div>
                              <p className="text-amber-300 font-black text-xs uppercase tracking-widest">Awaiting Admin Approval</p>
                              <p className="text-amber-200/60 text-[11px] mt-0.5">Your hard copy order has been received and is pending approval. You will receive an email with your invoice once approved.</p>
                            </div>
                          </div>
                        )}

                        {/* Refund Pending Info Banner */}
                        {order.status === 'refund_pending' && (
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <span className="text-red-400 text-lg leading-none mt-0.5">⏳</span>
                            <div>
                              <p className="text-red-300 font-black text-xs uppercase tracking-widest">Refund Request Pending Admin Review</p>
                              <p className="text-red-200/70 text-[11px] mt-0.5">
                                Your refund request has been received and is currently under review by our administration team. Reason: &ldquo;{order.refundReason || 'Order cancellation'}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Refund Rejected / Denied Info Banner */}
                        {(order.refundStatus === 'rejected' || (order.status === 'processing' && order.refundRejectedAt)) && (
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <span className="text-amber-400 text-lg leading-none mt-0.5">⚠️</span>
                            <div>
                              <p className="text-amber-300 font-black text-xs uppercase tracking-widest">Refund Request Denied — Dispatched to Print</p>
                              <p className="text-amber-200/70 text-[11px] mt-0.5">
                                {order.refundRejectionReason || "Your refund request could not be approved because your order has been approved and forwarded to PurePrint for physical printing."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Refund Processed Banner */}
                        {order.status === 'refunded' && (
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <span className="text-orange-400 text-lg leading-none mt-0.5">💳</span>
                            <div>
                              <p className="text-orange-300 font-black text-xs uppercase tracking-widest">Refund Processed</p>
                              <p className="text-orange-200/70 text-[11px] mt-0.5">
                                Your refund has been approved and returned to your original payment method (minus applicable platform tax/processing deductions).
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Processing info banner */}
                        {order.status === 'processing' && (
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-emerald-400 text-lg leading-none mt-0.5">✅</span>
                            <div>
                              <p className="text-emerald-300 font-black text-xs uppercase tracking-widest">Order Approved & Sent to Print</p>
                              <p className="text-emerald-200/60 text-[11px] mt-0.5">Your order has been approved and forwarded to PurePrint. Check your email for the invoice and tracking updates.</p>
                            </div>
                          </div>
                        )}

                        {/* Shipped & Dispatched Tracking Banner */}
                        {(order.status === 'shipped' || order.status === 'delivered' || order.trackingNumber || order.shippingDetails?.tracking_number) && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-start gap-3">
                              <span className="text-blue-400 text-lg leading-none mt-0.5">📦</span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-blue-300 font-black text-xs uppercase tracking-widest">
                                    {order.status === 'delivered' ? 'Package Delivered' : 'Order Dispatched & Shipped'}
                                  </p>
                                  {(order.carrier || order.shippingDetails?.carrier) && (
                                    <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase border border-blue-500/30">
                                      {formatCarrierName(order.carrier || order.shippingDetails?.carrier)}
                                    </span>
                                  )}
                                </div>
                                {(order.trackingNumber || order.shippingDetails?.tracking_number) ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white/60 text-[11px] font-mono">
                                      Tracking: <span className="text-white font-bold select-all">{order.trackingNumber || order.shippingDetails?.tracking_number}</span>
                                    </span>
                                    <button
                                      onClick={() => handleCopyTracking(order.trackingNumber || order.shippingDetails?.tracking_number)}
                                      className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/20 px-2 py-0.5 rounded transition-all cursor-pointer"
                                    >
                                      {copiedTrackingId === (order.trackingNumber || order.shippingDetails?.tracking_number) ? (
                                        <>
                                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-white/40 text-[11px] mt-0.5">Tracking link will update shortly.</p>
                                )}
                              </div>
                            </div>
                            {(order.trackingNumber || order.shippingDetails?.tracking_number) && (
                              <a
                                href={getCarrierTrackingUrl(
                                  order.trackingNumber || order.shippingDetails?.tracking_number,
                                  order.carrier || order.shippingDetails?.carrier
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 self-start sm:self-auto cursor-pointer"
                              >
                                <span>Track on {formatCarrierName(order.carrier || order.shippingDetails?.carrier)}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}

                        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Soft Copy Download Button - STRICTLY for Soft Copy orders only */}
                            {(() => {
                              const isSoftCopy = 
                                (order.type?.toLowerCase() === 'soft' || order.orderType?.toLowerCase() === 'soft') &&
                                order.type?.toLowerCase() !== 'hard' &&
                                order.orderType?.toLowerCase() !== 'hard';

                              if (!isSoftCopy || order.status === 'refunded') return null;

                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 rounded-xl px-6 h-12 text-xs uppercase font-bold flex gap-2 cursor-pointer"
                                  onClick={async () => {
                                    if (order.savedSoftPdfUrl || order.softUrl) {
                                      window.open(order.savedSoftPdfUrl || order.softUrl, "_blank");
                                      return;
                                    }
                                    try {
                                      const { getCleanPdfFromCache } = await import("@/lib/pdf-cache");
                                      const cached = await getCleanPdfFromCache(order.bookId || order.templateName || order._id);
                                      if (cached?.softPdfBlob) {
                                        const url = URL.createObjectURL(cached.softPdfBlob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `${(order.templateName || "Dear_Bacchanal").replace(/\s+/g, "_")}_Soft_Copy.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                                        toast.success("Download started!");
                                        return;
                                      }
                                    } catch (e) {
                                      console.warn(e);
                                    }
                                    window.location.href = `/editor?templateName=${encodeURIComponent(order.templateName || "Bacchanal")}&payment=success`;
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                  Download Book PDF
                                </Button>
                              );
                            })()}

                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/5 border-white/10 text-white/80 hover:bg-white/10 rounded-xl px-6 h-12 text-xs uppercase font-bold flex gap-2"
                              onClick={() => openInvoice(order._id || order.id)}
                            >
                              <FileText className="w-4 h-4" />
                              Print Receipt
                            </Button>
                          </div>

                          {/* Refund Button & Status - Shifted to Right Side */}
                          <div className="flex items-center ml-auto">
                            {order.status === 'refunded' && (
                              <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                <Undo2 className="w-4 h-4" />
                                Refund Processed
                              </div>
                            )}

                            {/* Request Refund button - available for all active orders to view breakdown & policy */}
                            {order.status !== 'refunded'
                              && order.status !== 'refund_pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl px-5 h-12 text-xs uppercase font-bold flex gap-2 cursor-pointer transition-all"
                                  onClick={() => {
                                    setSelectedOrderForRefund(order);
                                    setRefundReason("");
                                    setIsRefundModalOpen(true);
                                  }}
                                >
                                  <Undo2 className="w-4 h-4" />
                                  Request Refund
                                </Button>
                              )}

                            {order.status === 'refund_pending' && (
                              <span className="flex items-center gap-2 text-[10px] text-yellow uppercase font-bold tracking-widest bg-yellow/10 px-4 py-2 rounded-xl border border-yellow/20">
                                <History className="w-3 h-3" />
                                Refund Pending Approval
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                  <History className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                  <p className="font-display text-xl text-white/40 mb-4">NO PURCHASES YET</p>
                  <Button
                    variant="carnival"
                    onClick={() => setActiveTab("global")}
                    className="rounded-full px-8"
                  >
                    EXPLORE THEMES
                  </Button>
                </div>
              )}
            </div>
          ) : isLoadingTemplates ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow animate-pulse" />
              </div>
              <p className="text-muted-foreground font-body tracking-widest uppercase text-xs animate-pulse">Loading artist-curated templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTemplates.map((template) => {
                const isGlobal = activeTab === "global";
                const templateName = isGlobal ? template.name : template.bookName;
                const templateThumb = (isGlobal && template.thumbnail && !template.thumbnail.includes("/img/templates/")) ? template.thumbnail : "/book-cover.jpg";

                return (
                  <div
                    key={template._id}
                    className="group relative bg-white/5 rounded-[40px] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                  >
                    <div className="aspect-[3/2] overflow-hidden relative">
                      <img
                        src={templateThumb}
                        alt={templateName}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 opacity-90" />

                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-primary/20 backdrop-blur-[2px]">
                        <Button
                          variant="carnival"
                          size="default"
                          onClick={() => handleTemplateSelect(templateName, isGlobal ? undefined : template._id, isGlobal)}
                          className="shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500 uppercase px-8"
                        >
                          {isGlobal ? "START CREATING" : "CONTINUE EDITING"}
                        </Button>
                      </div>

                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                          {isGlobal ? <Globe className="w-2.5 h-2.5 text-teal drop-shadow-md" /> : <Book className="w-2.5 h-2.5 text-coral drop-shadow-md" />}
                          <span className="drop-shadow-md">{isGlobal ? template.country : "Saved Design"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-display text-xl text-white group-hover:text-primary transition-colors uppercase">{templateName}</h3>
                        <span className="text-primary font-display text-lg">/ {template.year || "2026"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 font-body leading-relaxed line-clamp-2">
                        {isGlobal ? template.description : `Last updated on ${new Date(template.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                      </p>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          {isGlobal ? "Limited Release" : "Cloud Sync Active"}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isGlobal && (
                            <button
                              onClick={() => setTemplateToDelete({ id: template._id, name: templateName })}
                              className="p-1.5 aspect-square rounded-full text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                              title="Delete Design"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTemplateSelect(templateName, isGlobal ? undefined : template._id, isGlobal)}
                            className="text-primary hover:text-white hover:bg-primary/20 transition-all rounded-full px-4 text-[10px] flex items-center gap-1.5"
                          >
                            {isGlobal ? "SELECT" : "OPEN"} <ArrowRight className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-32 text-center bg-white/5 rounded-[40px] border border-dashed border-white/20">
              <Search className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-muted-foreground font-display text-xl mb-4">NO MATCHING THEMES</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="border-primary/20 text-primary hover:bg-primary/10 rounded-full">Explore All Styles</Button>
            </div>
          )}
        </div>
      </section>

      {/* THE RITUAL - Marketing Section */}
      <section className="py-32 bg-olive relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="font-display text-6xl md:text-8xl text-black tracking-tight uppercase">THE RITUAL</h2>
            <p className="font-handwritten text-2xl text-black/60 mt-4">Four steps to immortalize your carnival spirit</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.num}
                className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center flex-shrink-0 relative shadow-xl">
                  <span className="font-display text-6xl text-gray-800">{step.num}</span>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className={`text-center ${index % 2 !== 0 ? "md:text-right" : "md:text-left"} flex-1`}>
                  <h3 className="font-display text-4xl text-black mb-4 uppercase">{step.title}</h3>
                  <p className="text-black/70 text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECRETS SECTION */}
      <section className="py-32 bg-accent relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-7xl text-black mb-16 uppercase">SECRETS</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {tips.map((tip, i) => (
              <div key={i} className="bg-background rounded-full px-8 py-5 shadow-2xl border border-white/5 hover:scale-105 transition-transform">
                <p className="font-body text-foreground font-bold uppercase tracking-widest text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-500/10 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-display tracking-tight text-white mb-2">Delete Design?</DialogTitle>
            <DialogDescription className="text-gray-400 font-body text-sm max-w-[280px]">
              Are you sure you want to delete <strong className="text-white">{templateToDelete?.name}</strong>? This action cannot be undone and will remove it from your designs forever.
            </DialogDescription>
          </div>
          <DialogFooter className="p-4 bg-[#111] flex gap-2 sm:justify-center border-t border-white/5">
            <button
              onClick={() => setTemplateToDelete(null)}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Refund Request & Policy Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={(open) => !open && setIsRefundModalOpen(false)}>
        <DialogContent className="sm:max-w-xl bg-[#121212] border-white/10 text-white shadow-2xl p-0 overflow-hidden rounded-3xl">
          {(() => {
            const order = selectedOrderForRefund;
            if (!order) return null;

            const isHardCopy = (order.type?.toLowerCase() === 'hard' || order.orderType?.toLowerCase() === 'hard');
            // For hard copy: only refundable while pending_approval before admin approval & pureprint dispatch
            const isHardCopyAlreadyPrinting = isHardCopy && order.status !== 'pending_approval';

            const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
            const policyDays = refundPolicy.refundDeadlineDays || 14;
            const deadlineTimestamp = orderCreatedAt + (policyDays * 24 * 60 * 60 * 1000);
            const remainingMs = Math.max(0, deadlineTimestamp - nowTime);
            const isExpired = remainingMs <= 0;

            const daysLeft = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((remainingMs % (1000 * 60)) / 1000);
            const pad = (n: number) => String(n).padStart(2, '0');

            const countdownText = daysLeft > 0
              ? `${daysLeft} Days, ${pad(hoursLeft)} H : ${pad(minutesLeft)} M : ${pad(secondsLeft)} S`
              : `${pad(hoursLeft)} H : ${pad(minutesLeft)} M : ${pad(secondsLeft)} S`;

            const paidAmount = (order.amount || 0) / 100;
            const taxPercentage = refundPolicy.refundDeductionPercentage ?? 20;
            const deductionAmount = (paidAmount * taxPercentage) / 100;
            const netRefundAmount = Math.max(0, paidAmount - deductionAmount);

            const canRequestRefund = !isExpired && !isHardCopyAlreadyPrinting;

            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-950/40 via-red-900/20 to-neutral-900 p-4 sm:p-5 border-b border-white/5 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                      <Undo2 className="w-3 h-3" />
                      Refund &amp; Cancellation
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">
                      Ref: #{order.transactionRef || order.orderId?.slice(-8) || order._id?.slice(-8) || "N/A"}
                    </span>
                  </div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                    Order Refund Breakdown
                  </DialogTitle>
                  <DialogDescription className="text-white/50 text-[11px] mt-0.5">
                    Review order details, tax fee deduction rate, and remaining policy time window.
                  </DialogDescription>
                </div>

                <div className="p-4 sm:p-5 space-y-3 max-h-[58vh] overflow-y-auto">
                  {/* Order Details Card */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-0.5">Book / Template</p>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {order.templateName || "Dear Bacchanal Carnival Book"}
                      </h4>
                      <p className="text-[11px] text-white/50">
                        Purchased on {order.createdAt ? format(new Date(order.createdAt), "MMMM d, yyyy") : "Recent"}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isHardCopy
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          : "bg-sky-500/10 text-sky-300 border-sky-500/20"
                      }`}>
                        {isHardCopy ? "Heirloom Hard Cover" : "Digital Soft Copy"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Actual Payment Paid ({isHardCopy ? "Hard Copy" : "Soft Copy"}):</span>
                      <span className="font-bold text-white">${paidAmount.toFixed(2)} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Platform Deduction Fee &amp; Tax ({taxPercentage}%):</span>
                      <span className="font-bold text-red-400">-${deductionAmount.toFixed(2)} USD</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-wider">Total Payment to be Refunded:</p>
                        <p className="text-[9px] text-white/40">Amount credited to original payment method after tax</p>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-emerald-400">
                        ${netRefundAmount.toFixed(2)} <span className="text-[10px] text-emerald-400/70 font-semibold">USD</span>
                      </span>
                    </div>
                  </div>

                  {/* Policy & Countdown Timer Card */}
                  {isHardCopyAlreadyPrinting ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-3.5 text-amber-300">
                      <div className="flex items-center gap-1.5 mb-1 font-bold text-xs sm:text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Printing Commenced — Refund Unavailable
                      </div>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        This order has already been approved and sent to PurePrint for printing and binding. According to our policy, hard copy orders cannot be refunded once printing has commenced.
                      </p>
                    </div>
                  ) : isExpired ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 sm:p-3.5 text-red-300">
                      <div className="flex items-center gap-1.5 mb-1 font-bold text-xs sm:text-sm">
                        <Clock className="w-4 h-4 text-red-400" />
                        Policy Window Expired
                      </div>
                      <p className="text-[11px] text-red-200/80 leading-relaxed">
                        Sorry, you cannot request a refund. The {policyDays}-day return window for this order has expired according to our refund policy.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl p-3 sm:p-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                            {policyDays}-Day Return Policy
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {daysLeft > 0 ? `${daysLeft} Day${daysLeft > 1 ? 's' : ''} Left` : "Final Day"}
                        </span>
                      </div>
                      <div className="bg-black/40 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-center mt-1">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-400/70">
                          Refund Eligibility Countdown
                        </p>
                        <p className="text-sm sm:text-base font-mono font-black text-emerald-300 tracking-wider">
                          {countdownText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reason Input (Only visible if canRequestRefund) */}
                  {canRequestRefund && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-wider text-white/60 block">
                          Reason for Refund (Mandatory) <span className="text-red-400">*</span>
                        </label>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          refundReason.trim().length > 0 && refundReason.trim().length <= 50
                            ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" 
                            : "bg-white/5 text-amber-400 border border-white/10"
                        }`}>
                          {refundReason.length} / 50 max chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={50}
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value.slice(0, 50))}
                        placeholder="Short reason (max 50 characters)..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                      />
                      {!refundReason.trim() ? (
                        <p className="text-[10px] text-amber-400/80 font-medium">
                          Please enter a short reason (up to 50 characters) to enable the Refund button.
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Reason provided ({50 - refundReason.length} characters remaining).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <DialogFooter className="p-3 sm:p-4 bg-[#0d0d0d] flex gap-2.5 sm:justify-end border-t border-white/5">
                  <Button
                    variant="outline"
                    onClick={() => setIsRefundModalOpen(false)}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl font-bold text-white/70 bg-white/5 border-white/10 hover:bg-white/10 text-xs uppercase cursor-pointer h-10"
                    disabled={isSubmittingRefund}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitRefundRequest}
                    disabled={isSubmittingRefund || !canRequestRefund || !refundReason.trim()}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all h-10 ${
                      canRequestRefund && refundReason.trim()
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
                        : "bg-white/10 text-white/30 border border-white/5 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {isSubmittingRefund ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : isHardCopyAlreadyPrinting ? (
                      "Printing Commenced"
                    ) : isExpired ? (
                      "Policy Expired"
                    ) : !refundReason.trim() ? (
                      "Enter Reason (Mandatory)"
                    ) : (
                      <>
                        <Undo2 className="w-4 h-4" />
                        Submit Refund Request
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Invoice / Receipt Modal */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-2xl"
            onClick={() => setIsInvoiceOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-4 bg-gray-100 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-gray-800 uppercase tracking-widest text-sm">Download Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                {invoiceData && (
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-red-600/20"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD PDF
                  </button>
                )}
                <button
                  onClick={() => setIsInvoiceOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-12">
              {loadingInvoice ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                </div>
              ) : invoiceData ? (
                <div ref={invoiceRef} className="bg-white text-gray-900 font-sans border-8 border-gray-50 shadow-2xl max-w-[800px] mx-auto overflow-hidden">
                  {/* Decorative Header */}
                  <div className="bg-gradient-to-r from-[#9f2e2b] via-[#be2826] to-[#ecb52b] h-3 w-full" />

                  <div className="p-8 sm:p-12">
                    <div className="flex justify-between items-start mb-16">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-[#be2826] rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl transform -rotate-3 border-4 border-white">DB</div>
                        <div>
                          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-gray-900 leading-[0.8]">DEAR <br />BACCHANAL</h1>
                          <p className="text-[10px] font-black uppercase tracking-[5px] text-[#be2826] mt-2">Premium Keepsakes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter mb-2 leading-none">RECEIPT</h2>
                        <p className="text-sm font-black text-gray-900">{invoiceData.invoiceNumber}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#be2826] mt-1">{format(new Date(invoiceData.date), 'MMMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-10 relative">
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100 hidden sm:block" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[4px] text-gray-300 mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#be2826]" />
                          Billed To
                        </div>
                        <div className="text-xl font-black text-gray-900">{invoiceData.customer.name}</div>
                        <p className="text-sm font-bold text-[#be2826] mt-1">{invoiceData.customer.email}</p>
                        <div className="text-xs text-gray-500 mt-4 leading-relaxed font-medium">
                          <p>{invoiceData.customer.address.line1}</p>
                          {invoiceData.customer.address.line2 && <p>{invoiceData.customer.address.line2}</p>}
                          <p>{invoiceData.customer.address.city}, {invoiceData.customer.address.state} {invoiceData.customer.address.postal_code}</p>
                          <p className="font-black text-gray-900 uppercase tracking-wider mt-1">{invoiceData.customer.address.country}</p>
                        </div>
                      </div>
                      <div className="sm:pl-12">
                        <div className="text-[10px] font-black uppercase tracking-[4px] text-gray-300 mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ecb52b]" />
                          From
                        </div>
                        <div className="text-xl font-black text-gray-900">Dear Bacchanal Ltd.</div>
                        <div className="text-sm font-bold text-gray-500 mt-1">billing@dearbacchanal.com</div>
                        <div className="text-xs text-gray-400 mt-4 leading-relaxed font-medium">
                          <p>123 Carnival Way</p>
                          <p>Port of Spain, Trinidad & Tobago</p>
                          <p className="mt-2 text-[10px] font-black text-[#be2826] uppercase">Tax ID: DB-TR-2026-X</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-8 mb-10">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-900/10">
                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                            <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Qty</th>
                            <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/50">
                          {invoiceData.items.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-8">
                                <p className="font-black text-lg text-gray-900">{item.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-[9px] font-black bg-[#be2826] text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                    {orders.find(o => String(o._id) === String(invoiceData.orderId) || o.id === invoiceData.orderId)?.templateName || invoiceData.templateName || "Custom Template"}
                                  </span>
                                  <span className="text-[9px] font-black bg-gray-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                    {(orders.find(o => String(o._id) === String(invoiceData.orderId) || o.id === invoiceData.orderId)?.type === 'hard' || orders.find(o => String(o._id) === String(invoiceData.orderId) || o.id === invoiceData.orderId)?.orderType === 'hard' || invoiceData.type === 'hard') ? 'Hardcover' : 'Softcopy'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-8 text-center font-black text-gray-900">{item.quantity}</td>
                              <td className="py-8 text-right font-black text-xl text-gray-900">${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-end gap-12">
                      <div className="flex-1">
                        <div className="p-6 rounded-2xl border-2 border-dashed border-gray-100 flex items-center gap-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Verified</p>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Transaction ID</p>
                            <p className="font-black text-base text-gray-900 tracking-widest font-mono mt-0.5">
                              {invoiceData.transactionRef || (invoiceData.orderId || '').slice(-12) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-[250px] space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-black uppercase tracking-widest">Subtotal</span>
                          <span className="font-black text-gray-900">${invoiceData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-black uppercase tracking-widest">Processing</span>
                          <span className="font-black text-gray-900">$0.00</span>
                        </div>
                        <div className="pt-6 border-t-4 border-gray-900">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-[#be2826]">Grand Total</span>
                            <span className="text-3xl font-black text-gray-900">${invoiceData.total.toFixed(2)}</span>
                          </div>
                          <p className="text-[8px] font-black text-gray-300 uppercase italic text-right">Paid via {invoiceData.paymentMethod} Gateway</p>
                        </div>
                      </div>
                    </div>

                    {/* Big Rotated Green Official PAID Stamp */}
                    <div className="flex justify-center my-6 print:my-8 pointer-events-none select-none">
                      <div className="inline-flex flex-col items-center justify-center border-4 border-double border-emerald-600/80 rounded-2xl px-10 py-2.5 transform -rotate-12 bg-emerald-500/5 shadow-sm">
                        <span className="text-4xl sm:text-5xl font-black text-emerald-600 uppercase tracking-[14px] leading-none font-mono">
                          PAID
                        </span>
                        <span className="text-[9px] font-black text-emerald-600/90 uppercase tracking-[4px] mt-1.5 border-t border-emerald-600/40 pt-0.5">
                          OFFICIAL VERIFIED RECEIPT
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-all duration-700">
                      <div className="text-[8px] text-gray-400 font-black uppercase tracking-[6px] text-center sm:text-left">
                        Keep the spirit alive. <br />Bacchanal never ends.
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          Authentic <CheckCircle className="w-3 h-3" />
                        </div>
                        <div className="text-[8px] font-black bg-gray-900 text-white px-4 py-2 rounded-full uppercase tracking-widest">
                          OFFICIAL PROPERTY OF DEAR BACCHANAL
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Footer */}
                  <div className="grid grid-cols-6 h-2 w-full">
                    <div className="bg-[#be2826]" />
                    <div className="bg-[#ecb52b]" />
                    <div className="bg-[#000000]" />
                    <div className="bg-[#be2826]" />
                    <div className="bg-[#ecb52b]" />
                    <div className="bg-[#000000]" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CustomizeRitualPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0d0e]" />}>
      <CustomizeRitual />
    </Suspense>
  );
}

export default CustomizeRitualPage;

function OrderStat({ label, value, color = "text-white/60" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
      <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className={`text-xs font-bold uppercase ${color}`}>{value}</p>
    </div>
  );
}
