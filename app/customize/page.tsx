"use client";
import { useEffect, useRef, useState } from "react";
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
  X
} from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useRouter } from "next/navigation";
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

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { openModal } = useAuthModal();
  const router = useRouter();

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
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch("/api/orders/refund/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderForRefund._id || selectedOrderForRefund.id,
          reason: refundReason
        })
      });

      if (res.ok) {
        toast.success("Refund request submitted successfully");
        setOrders(orders.map(o =>
          (o._id === selectedOrderForRefund._id || o.id === selectedOrderForRefund.id)
            ? { ...o, status: 'refund_pending' }
            : o
        ));
        setIsRefundModalOpen(false);
        setRefundReason("");
      } else {
        toast.error("Failed to submit refund request");
      }
    } catch (error) {
      toast.error("An error occurred");
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
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
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
                          <OrderStat label="PAGES" value={order.pagesCount || '20+'} />
                          <OrderStat label="ADD-ONS" value={order.addonsCount || '0'} />
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

                        <div className="pt-4 flex flex-wrap gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/10 text-white/80 hover:bg-white/10 rounded-xl px-6 h-12 text-xs uppercase font-bold flex gap-2"
                            onClick={() => openInvoice(order._id || order.id)}
                          >
                            <FileText className="w-4 h-4" />
                            Print Receipt
                          </Button>


                          {order.status === 'refunded' && (
                            <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                              <Undo2 className="w-4 h-4" />
                              Refund Processed
                            </div>
                          )}
                          {/* Only show refund button for fully completed/paid orders — not pending/processing hard copies */}
                          {order.status !== 'refunded'
                            && order.status !== 'refund_pending'
                            && order.status !== 'pending_approval'
                            && order.status !== 'processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl px-6 h-12 text-xs uppercase font-bold flex gap-2"
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

      {/* Refund Request Modal */}
      <Dialog open={isRefundModalOpen} onOpenChange={(open) => !open && setIsRefundModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-500/10 p-6 flex flex-col items-center text-center border-b border-white/5">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Undo2 className="w-8 h-8 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-display tracking-tight text-white mb-2">Request Refund</DialogTitle>
            <DialogDescription className="text-gray-400 font-body text-sm max-w-[280px]">
              Please describe the legal issue or reason for your refund request. This is mandatory for approval.
            </DialogDescription>
          </div>
          <div className="p-6">
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="I am requesting a refund because..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none min-h-[120px]"
            />
          </div>
          <DialogFooter className="p-4 bg-[#111] flex gap-2 sm:justify-center border-t border-white/5">
            <button
              onClick={() => setIsRefundModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              disabled={isSubmittingRefund}
            >
              Cancel
            </button>
            <button
              onClick={submitRefundRequest}
              disabled={isSubmittingRefund || !refundReason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingRefund ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
              {isSubmittingRefund ? "Submitting..." : "Submit Request"}
            </button>
          </DialogFooter>
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
                                    {orders.find(o => o._id === invoiceData.orderId || o.id === invoiceData.orderId)?.templateName || "Custom Template"}
                                  </span>
                                  <span className="text-[9px] font-black bg-gray-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                    {orders.find(o => o._id === invoiceData.orderId || o.id === invoiceData.orderId)?.type === 'hard' || orders.find(o => o._id === invoiceData.orderId || o.id === invoiceData.orderId)?.orderType === 'hard' ? 'Hardcover' : 'Softcopy'}
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
                            <p className="font-black text-sm text-gray-900">Transaction ID: {(invoiceData.orderId || '').slice(0, 16)}...</p>
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

                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
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

export default CustomizeRitual;

function OrderStat({ label, value, color = "text-white/60" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
      <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className={`text-xs font-bold uppercase ${color}`}>{value}</p>
    </div>
  );
}
