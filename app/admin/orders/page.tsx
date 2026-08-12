"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Eye, 
  CheckCircle, 
  Truck, 
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Package,
  FileText,
  DollarSign,
  Undo2,
  AlertTriangle,
  RefreshCw,
  ThumbsUp,
  Send,
  Trash2,
  Copy,
  ExternalLink,
  BookOpen,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Order {
  id: string;
  email: string;
  orderId: string;
  amount: number;
  totalAmount?: number;
  currency: string;
  type: 'soft' | 'hard';
  templateName?: string;
  bookId?: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refund_pending' | 'refunded' | 'pending_approval' | 'approved';
  shippingDetails?: any;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
  approvedAt?: string | null;
  siteFlowOrderId?: string | null;
  siteFlowError?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  coverPdfUrl?: string | null;
  textPdfUrl?: string | null;
  pdfUrl?: string | null;
  savedCoverPdfUrl?: string | null;
  savedTextPdfUrl?: string | null;
  savedPdfUrl?: string | null;
  refundRequest?: {
    reason: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyUrl = (url: string, label: string, fieldKey: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCoverUrl = (order: Order) => {
    if (order.coverPdfUrl) return order.coverPdfUrl;
    if (order.savedCoverPdfUrl) return order.savedCoverPdfUrl;
    return null;
  };

  const getTextUrl = (order: Order) => {
    if (order.textPdfUrl) return order.textPdfUrl;
    if (order.savedTextPdfUrl) return order.savedTextPdfUrl;
    return null;
  };

  const getSoftUrl = (order: Order) => {
    if (order.pdfUrl) return order.pdfUrl;
    if (order.savedPdfUrl) return order.savedPdfUrl;
    if (order.textPdfUrl) return order.textPdfUrl;
    if (order.savedTextPdfUrl) return order.savedTextPdfUrl;
    if (order.coverPdfUrl) return order.coverPdfUrl;
    if (order.savedCoverPdfUrl) return order.savedCoverPdfUrl;
    return null;
  };
  const [showFilters, setShowFilters] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  useEffect(() => {
    fetchOrders();
  }, [page, search, typeFilter, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "7", search });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.total);

        // Keep open drawer order in sync with updated server record (e.g., PurePrint webhooks & status updates)
        if (selectedOrder) {
          const updated = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) {
            setSelectedOrder(updated);
          }
        }
      }
    } catch (error) {
      if (!isSilent) toast.error("Failed to load orders");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Auto-poll orders every 10 seconds to reflect PurePrint webhooks & status changes in real time
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [page, search, typeFilter, statusFilter, selectedOrder?.id]);

  const activeFilterCount = (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setSearch("");
  };

  const updateStatus = async (orderId: string, status: string) => {
    // Optimistic real-time UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as any });
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchOrders(true);
      } else {
        toast.error("Failed to update status");
        fetchOrders();
      }
    } catch (error) {
      toast.error("Update failed");
      fetchOrders();
    }
  };

  const approveRefund = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/orders/refund-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        toast.success("Refund approved and processed via Stripe");
        fetchOrders();
        setSelectedOrder(null);
      } else {
        const error = await res.json();
        toast.error(`Refund failed: ${error.error}`);
      }
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const openInvoice = async (order: Order) => {
    setLoadingInvoice(true);
    setIsInvoiceOpen(true);
    try {
      const res = await fetch(`/api/admin/orders/invoice/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoiceData(data);
      }
    } catch (error) {
      toast.error("Failed to load invoice");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'paid': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'processing': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'refunded': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'refund_pending': return 'bg-red-500/20 text-red-100 border-red-500/50 animate-pulse';
      case 'pending_approval': return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const [syncing, setSyncing] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [deletingOrders, setDeletingOrders] = useState<Set<string>>(new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; description: string; onConfirm: () => Promise<void> }>({
    open: false, title: '', description: '', onConfirm: async () => {}
  });

  const openConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmModal({ open: true, title, description, onConfirm });
  };

  const executeDeleteOrder = async (orderId: string) => {
    setDeletingOrders(prev => new Set(prev).add(orderId));
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Order deleted");
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error("Failed to delete order");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeletingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const deleteOrder = (orderId: string) => {
    openConfirm(
      "Delete Order",
      "This will permanently delete the order and the customer's book. This action cannot be undone.",
      () => executeDeleteOrder(orderId)
    );
  };

  const executeDeleteAllOrders = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch(`/api/admin/orders?deleteAll=true`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("All orders deleted");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error("Failed to delete all orders");
      }
    } catch (e) {
      toast.error("Delete all failed");
    } finally {
      setDeletingAll(false);
    }
  };

  const deleteAllOrders = () => {
    openConfirm(
      "Delete ALL Orders",
      "This will permanently delete every order and all associated customer books. This CANNOT be undone.",
      executeDeleteAllOrders
    );
  };

  const approveOrder = async (orderId: string) => {
    setApprovingOrder(true);
    try {
      const res = await fetch("/api/admin/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Order ${orderId} approved. Status set to 'processing'`);
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'processing', approvedAt: data.approvedAt, siteFlowOrderId: data.siteFlowOrderId } as Order);
        }
      } else {
        toast.error(`Approval failed: ${data.error}`);
      }
    } catch (error) {
      toast.error("Approval request failed");
    } finally {
      setApprovingOrder(false);
    }
  };

  const [resubmittingSiteFlow, setResubmittingSiteFlow] = useState<string | null>(null);

  const resubmitToSiteFlow = async (orderId: string) => {
    setResubmittingSiteFlow(orderId);
    try {
      const res = await fetch("/api/admin/orders/resubmit-siteflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Order submitted to PurePrint!");
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            siteFlowOrderId: data.siteFlowOrderId,
            siteFlowError: null,
          } as Order);
        }
      } else {
        toast.error(`PurePrint submission failed: ${data.error}`);
      }
    } catch (e) {
      toast.error("Resubmission failed");
    } finally {
      setResubmittingSiteFlow(null);
    }
  };

  // DEV ONLY: simulate the Stripe webhook for existing hard copy orders
  const simulateWebhookForHardCopies = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/admin/orders/test-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.success) {
        toast.success(`Patched ${data.results?.length || 0} hard copy order(s) to Pending Approval`);
        fetchOrders();
      } else {
        toast.error(data.error || data.message || 'Nothing to patch');
      }
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Yes, Delete"
      />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight uppercase">Order Management</h1>
          <p className="text-white/40 text-sm">Track sales, shipping status, and generate invoices · <span className="text-white/60 font-bold">{totalOrders} total orders</span></p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">


            <button
              onClick={deleteAllOrders}
              disabled={deletingAll || orders.length === 0}
              className="flex items-center justify-center flex-1 sm:flex-none gap-1.5 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 min-w-fit"
            >
              {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deletingAll ? 'Deleting...' : 'Delete All'}
            </button>
            <div className="relative flex-1 w-full sm:w-auto min-w-[150px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                    type="text" 
                    placeholder="Search name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all w-full md:min-w-[280px]"
                />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border rounded-xl transition-all relative flex-shrink-0 ${
                activeFilterCount > 0 || showFilters
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
            </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap items-center gap-6">
            {/* Type Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Product Type</span>
              <div className="flex gap-1.5">
                {[
                  { value: '', label: 'All' },
                  { value: 'soft', label: 'Digital', icon: '📄' },
                  { value: 'hard', label: 'Hardcover', icon: '📦' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      typeFilter === opt.value
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {opt.icon && <span className="mr-1">{opt.icon}</span>}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Status</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '', label: 'All' },
                  { value: 'pending_approval', label: 'Pending Approval', color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' },
                  { value: 'approved', label: 'Approved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { value: 'paid', label: 'Paid', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                  { value: 'processing', label: 'Processing', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                  { value: 'shipped', label: 'Shipped', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                  { value: 'delivered', label: 'Delivered', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                  { value: 'cancelled', label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      statusFilter === opt.value
                        ? (opt.color || 'bg-red-500/10 border-red-500/30 text-red-400')
                        : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active:</span>
          {typeFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {typeFilter === 'soft' ? '📄 Digital' : '📦 Hardcover'}
              <button onClick={() => setTypeFilter('')} className="hover:text-white"><X className="w-3 h-3" /></button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button onClick={() => setStatusFilter('')} className="hover:text-white"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-[10px] text-white/20 hover:text-red-400 font-bold uppercase tracking-wider transition-colors">Clear all</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Table Area (Equal Initial Height) */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
          <div className="overflow-x-auto overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0f0f0f]">
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">ORDER / DATE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">CUSTOMER</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">TYPE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">AMOUNT</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">STATUS</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest leading-none text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {orders.map((order) => (
                      <tr 
                          key={order.id} 
                          className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedOrder?.id === order.id ? 'bg-red-500/5' : ''}`}
                          onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-xs truncate max-w-[120px]">#{(order.orderId || '').slice(-8).toUpperCase()}</span>
                            <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{order.templateName || "Custom Book"}</span>
                            <span className="text-white/30 text-[10px]">{format(new Date(order.createdAt), 'MMM dd, yyyy · HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                              <span className="text-white text-xs font-medium">{order.customerName || order.email?.split('@')[0] || 'Guest'}</span>
                              <span className="text-white/30 text-[10px] truncate max-w-[150px]">{order.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${order.type === 'hard' ? 'text-orange-400 bg-orange-400/10' : 'text-blue-400 bg-blue-400/10'}`}>
                              {order.type === 'hard' ? <Package className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              {order.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-black text-sm">
                              ${(Number(order.amount || order.totalAmount || 0) / 100).toFixed(2)}
                              <span className="text-[10px] text-white/20 ml-1">{(order.currency || 'USD').toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(order.status)}`}>
                              {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openInvoice(order); }}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                disabled={deletingOrders.has(order.id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-all disabled:opacity-50"
                            >
                                {deletingOrders.has(order.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Placeholder slots if fewer than 7 orders on this page */}
                    {Array.from({ length: Math.max(0, 7 - orders.length) }).map((_, slotIdx) => (
                      <tr key={`slot-${slotIdx}`} className="border-b border-white/[0.02] opacity-15 pointer-events-none select-none h-[64px]">
                        <td colSpan={6} className="px-6 py-4 text-[10px] text-white/10 italic text-center font-mono">
                          — Empty Slot {orders.length + slotIdx + 1} —
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 disabled:opacity-20 hover:bg-white/5 rounded-lg text-white/60 transition-all border border-white/5"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 disabled:opacity-20 hover:bg-white/5 rounded-lg text-white/60 transition-all border border-white/5"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>

        {/* Right Info Area (Equal Initial Height & Independent Scrollbar) */}
        <div className="h-[calc(100vh-140px)] min-h-[580px]">
            {!selectedOrder ? (
                <div className="bg-[#0f0f0f] border border-dashed border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full">
                    <Package className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-white/20 text-sm font-bold uppercase tracking-widest">Select an order to view details</p>
                </div>
            ) : (
                <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 space-y-6 overflow-y-auto h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Order Details</h3>
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="text-white/20 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Order Identifiers</p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-semibold text-white/40">Order ID</p>
                                        {selectedOrder.id && (
                                            <button
                                                onClick={() => handleCopyUrl(selectedOrder.id, "Order ID", "orderId")}
                                                className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                                                title="Copy Order ID"
                                            >
                                                {copiedField === 'orderId' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                <span>{copiedField === 'orderId' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-white/90 text-xs font-mono font-bold break-all bg-black/20 p-2 rounded border border-white/5 select-all">
                                        {selectedOrder.id || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-semibold text-white/40">Book ID</p>
                                        {selectedOrder.bookId && (
                                            <button
                                                onClick={() => handleCopyUrl(selectedOrder.bookId!, "Book ID", "bookId")}
                                                className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                                                title="Copy Book ID"
                                            >
                                                {copiedField === 'bookId' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                <span>{copiedField === 'bookId' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-white/90 text-xs font-mono font-bold break-all bg-black/20 p-2 rounded border border-white/5 select-all">
                                        {selectedOrder.bookId || 'N/A'}
                                    </p>
                                </div>
                                {selectedOrder.type !== 'soft' && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-semibold text-white/40">Source Order ID (18 chars for SiteFlow)</p>
                                                {selectedOrder.id && (
                                                    <button
                                                        onClick={() => {
                                                            const sourceId = selectedOrder.id.length > 18 ? selectedOrder.id.substring(selectedOrder.id.length - 18) : selectedOrder.id;
                                                            handleCopyUrl(sourceId, "Source Order ID", "sourceOrderId");
                                                        }}
                                                        className="text-[9px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all cursor-pointer"
                                                        title="Copy Source Order ID"
                                                    >
                                                        {copiedField === 'sourceOrderId' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                        <span>{copiedField === 'sourceOrderId' ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-white/90 text-xs font-mono font-bold break-all bg-black/20 p-2 rounded border border-white/5 select-all">
                                                {selectedOrder.id 
                                                    ? (selectedOrder.id.length > 18 
                                                        ? selectedOrder.id.substring(selectedOrder.id.length - 18) 
                                                        : selectedOrder.id) 
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider mb-1.5">
                                                SiteFlow Order ID (Returned by PurePrint)
                                            </p>
                                            {selectedOrder.siteFlowOrderId ? (
                                                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                                                            Status: Active in Print Queue
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopyUrl(selectedOrder.siteFlowOrderId!, "SiteFlow Order ID", "siteFlowId")}
                                                            className="text-[9px] text-emerald-400/60 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded transition-all"
                                                        >
                                                            {copiedField === 'siteFlowId' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                            <span>{copiedField === 'siteFlowId' ? 'Copied' : 'Copy'}</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-emerald-400 text-xs font-mono font-bold break-all bg-black/40 p-2 rounded-lg border border-emerald-500/20 select-all">
                                                        {selectedOrder.siteFlowOrderId}
                                                    </p>
                                                </div>
                                            ) : selectedOrder.status === 'pending_approval' ? (
                                                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                                    <p className="text-amber-400 text-xs font-bold flex items-center gap-1.5 leading-snug">
                                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                                        Awaiting Admin Approval (Will be generated upon approval)
                                                    </p>
                                                </div>
                                            ) : selectedOrder.siteFlowError ? (
                                                <div className="bg-red-500/10 p-3.5 rounded-xl border-2 border-red-500/30 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                                                            Print Submission Issue
                                                        </span>
                                                    </div>
                                                    <p className="text-red-300/80 text-[11px] bg-black/40 p-2.5 rounded-lg border border-red-500/20 font-mono break-all leading-relaxed">
                                                        {selectedOrder.siteFlowError}
                                                    </p>
                                                    <button
                                                        onClick={() => resubmitToSiteFlow(selectedOrder.id)}
                                                        disabled={resubmittingSiteFlow === selectedOrder.id}
                                                        className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer border border-red-400/30"
                                                    >
                                                        {resubmittingSiteFlow === selectedOrder.id ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING TO PUREPRINT...</>
                                                        ) : (
                                                            <><RefreshCw className="w-4 h-4" /> RE-SUBMIT ORDER TO PUREPRINT</>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-white/40 text-xs font-mono bg-black/20 p-2 rounded border border-white/5 italic">
                                                    Not submitted yet
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Generated PDF Files Card - Below Order Identifiers */}
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-red-400" />
                                    Generated PDF Files
                                </p>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    selectedOrder.type === 'hard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {selectedOrder.type === 'hard' ? 'Hard Copy (2 PDFs)' : 'Soft Copy (Digital)'}
                                </span>
                            </div>

                            {selectedOrder.type === 'hard' ? (
                                /* Hard Copy Order: 2 PDFs (Cover Page & Text/Inner Pages) */
                                <div className="space-y-3 pt-1">
                                    {/* Cover Page PDF */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-semibold text-white/60 flex items-center gap-1.5">
                                                <BookOpen className="w-3 h-3 text-amber-400" />
                                                Cover Page PDF
                                            </span>
                                            {getCoverUrl(selectedOrder) && (
                                                <button
                                                    onClick={() => handleCopyUrl(getCoverUrl(selectedOrder)!, "Cover Page PDF URL", "cover")}
                                                    className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                                                    title="Copy Cover Page PDF URL"
                                                >
                                                    {copiedField === 'cover' ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-teal" />
                                                    )}
                                                    <span>{copiedField === 'cover' ? 'Copied' : 'Copy URL'}</span>
                                                </button>
                                            )}
                                        </div>
                                        {getCoverUrl(selectedOrder) ? (
                                            <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5 group hover:border-white/20 transition-all">
                                                <span className="text-white/80 text-xs font-mono truncate flex-1 select-all">
                                                    {getCoverUrl(selectedOrder)}
                                                </span>
                                                <a
                                                    href={getCoverUrl(selectedOrder)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all shrink-0"
                                                    title="Open Cover Page PDF in new tab"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-white/20 text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                Cover PDF not generated yet
                                            </p>
                                        )}
                                    </div>

                                    {/* Text / Inner Pages PDF */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-semibold text-white/60 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3 text-teal" />
                                                Text / Inner Pages PDF
                                            </span>
                                            {getTextUrl(selectedOrder) && (
                                                <button
                                                    onClick={() => handleCopyUrl(getTextUrl(selectedOrder)!, "Text Pages PDF URL", "text")}
                                                    className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                                                    title="Copy Text Pages PDF URL"
                                                >
                                                    {copiedField === 'text' ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-teal" />
                                                    )}
                                                    <span>{copiedField === 'text' ? 'Copied' : 'Copy URL'}</span>
                                                </button>
                                            )}
                                        </div>
                                        {getTextUrl(selectedOrder) ? (
                                            <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5 group hover:border-white/20 transition-all">
                                                <span className="text-white/80 text-xs font-mono truncate flex-1 select-all">
                                                    {getTextUrl(selectedOrder)}
                                                </span>
                                                <a
                                                    href={getTextUrl(selectedOrder)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all shrink-0"
                                                    title="Open Text Pages PDF in new tab"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="text-white/20 text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                Text PDF not generated yet
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Soft Copy Order: 1 Digital Book PDF URL */
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-semibold text-white/60 flex items-center gap-1.5">
                                            <Download className="w-3 h-3 text-blue-400" />
                                            Digital Book PDF URL
                                        </span>
                                        {getSoftUrl(selectedOrder) && (
                                            <button
                                                onClick={() => handleCopyUrl(getSoftUrl(selectedOrder)!, "Digital Book PDF URL", "soft")}
                                                className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-all"
                                                title="Copy PDF URL"
                                            >
                                                {copiedField === 'soft' ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3 text-teal" />
                                                )}
                                                <span>{copiedField === 'soft' ? 'Copied' : 'Copy URL'}</span>
                                            </button>
                                        )}
                                    </div>
                                    {getSoftUrl(selectedOrder) ? (
                                        <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5 group hover:border-white/20 transition-all">
                                            <span className="text-white/80 text-xs font-mono truncate flex-1 select-all">
                                                {getSoftUrl(selectedOrder)}
                                            </span>
                                            <a
                                                href={getSoftUrl(selectedOrder)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all shrink-0"
                                                title="Open Digital Book PDF in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-white/20 text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                                            No stored URL (Generated on-demand at checkout)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Customer & Account</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 font-bold">
                                    {(selectedOrder.shippingDetails?.name || selectedOrder.email || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{selectedOrder.customerName || selectedOrder.email?.split('@')[0] || 'Guest Checkout'}</p>
                                    <p className="text-white/30 text-[10px] truncate">{selectedOrder.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Information Card */}
                        {selectedOrder.type !== 'soft' && (
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-blue-400" />
                                        Tracking Information
                                    </p>
                                    {(selectedOrder.trackingNumber || selectedOrder.shippingDetails?.tracking_number) && (
                                        <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                            ATTACHED
                                        </span>
                                    )}
                                </div>

                                {(selectedOrder.trackingNumber || selectedOrder.shippingDetails?.tracking_number) ? (
                                    <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 space-y-2">
                                        {(selectedOrder.carrier || selectedOrder.shippingDetails?.carrier) && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-white/40 uppercase font-bold">Carrier</span>
                                                <span className="text-xs text-white font-bold">{selectedOrder.carrier || selectedOrder.shippingDetails?.carrier}</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] text-white/40 uppercase font-bold">Tracking Number</span>
                                                <button
                                                    onClick={() => handleCopyUrl(selectedOrder.trackingNumber || selectedOrder.shippingDetails?.tracking_number, "Tracking Number", "tracking")}
                                                    className="text-[9px] text-blue-400/80 hover:text-blue-300 flex items-center gap-1 bg-blue-500/20 px-2 py-0.5 rounded transition-all cursor-pointer"
                                                >
                                                    {copiedField === 'tracking' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                                    <span>{copiedField === 'tracking' ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            </div>
                                            <p className="text-blue-400 text-xs font-mono font-bold break-all bg-black/40 p-2 rounded-lg border border-blue-500/20 select-all">
                                                {selectedOrder.trackingNumber || selectedOrder.shippingDetails?.tracking_number}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-white/30 text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                                        No tracking number attached yet (Will be attached automatically when PurePrint ships order)
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2">Shipping Address</p>
                            {selectedOrder.shippingDetails?.address ? (
                                <div className="text-white/60 text-xs leading-relaxed">
                                    <p>{selectedOrder.shippingDetails.address.line1}</p>
                                    {selectedOrder.shippingDetails.address.line2 && <p>{selectedOrder.shippingDetails.address.line2}</p>}
                                    <p>{selectedOrder.shippingDetails.address.city}, {selectedOrder.shippingDetails.address.state} {selectedOrder.shippingDetails.address.postal_code}</p>
                                    <p className="font-bold text-white/80">{selectedOrder.shippingDetails.address.country}</p>
                                </div>
                            ) : (
                                <p className="text-white/20 text-xs italic">No shipping address (Digital product)</p>
                            )}
                        </div>

                        {/* Only show fulfillment status buttons if the order is NOT pending approval */}
                        {selectedOrder.status !== 'pending_approval' && (
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Set Fulfillment Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <StatusButton 
                                        active={selectedOrder.status === 'processing'} 
                                        onClick={() => updateStatus(selectedOrder.id, 'processing')}
                                        icon={Clock}
                                        label="Process"
                                        color="text-yellow-400"
                                    />
                                    <StatusButton 
                                        active={selectedOrder.status === 'shipped'} 
                                        onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                                        icon={Truck}
                                        label="Ship"
                                        color="text-blue-400"
                                    />
                                    <StatusButton 
                                        active={selectedOrder.status === 'delivered'} 
                                        onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                                        icon={CheckCircle}
                                        label="Deliver"
                                        color="text-green-400"
                                    />
                                    <StatusButton 
                                        active={selectedOrder.status === 'cancelled'} 
                                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                                        icon={X}
                                        label="Cancel"
                                        color="text-red-400"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Pending Approval Panel (Hard Copy) ── */}
                        {selectedOrder.type === 'hard' && selectedOrder.status === 'pending_approval' && (
                            <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <Package className="w-5 h-5 text-amber-400" />
                                    <h4 className="text-white font-bold text-sm uppercase">Awaiting Approval</h4>
                                </div>
                                <p className="text-white/60 text-xs mb-6">
                                    This hard copy order is pending your approval before it is forwarded to PurePrint for printing.
                                    Approving will:
                                </p>
                                <ul className="text-white/50 text-[11px] mb-6 space-y-1.5 list-none">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> Set status to <strong className="text-yellow-400">Processing</strong></li>
                                    <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> Generate & email invoice PDF to customer</li>
                                    <li className="flex items-center gap-2"><Send className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /> Submit print job to PurePrint via Site Flow</li>
                                </ul>
                                <button
                                    onClick={() => approveOrder(selectedOrder.id)}
                                    disabled={approvingOrder}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-xs rounded-xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                                >
                                    {approvingOrder ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> APPROVING...</>
                                    ) : (
                                        <><ThumbsUp className="w-4 h-4" /> APPROVE ORDER</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ── Already Approved Panel ── */}
                        {selectedOrder.type === 'hard' && selectedOrder.status === 'approved' && (
                            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Approved & Sent to PurePrint</h4>
                                </div>
                                {selectedOrder.approvedAt && (
                                    <p className="text-white/30 text-[10px]">
                                        Approved on {format(new Date(selectedOrder.approvedAt), 'MMM dd, yyyy · HH:mm')}
                                    </p>
                                )}
                                {selectedOrder.siteFlowOrderId && (
                                    <p className="text-white/30 text-[10px] mt-1">
                                        Site Flow ID: <span className="text-white/50 font-mono">{selectedOrder.siteFlowOrderId}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Refund Request Panel ── */}
                        {selectedOrder.status === 'refund_pending' && (
                            <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                     <AlertTriangle className="w-5 h-5 text-red-500" />
                                     <h4 className="text-white font-bold text-sm uppercase">Refund Request</h4>
                                </div>
                                <p className="text-white/60 text-xs mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                                    <span className="text-white/20 uppercase font-bold block mb-1">Reason:</span>
                                    {selectedOrder.refundRequest?.reason || "No reason provided."}
                                </p>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => approveRefund(selectedOrder.id)}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
                                    >
                                        <Undo2 className="w-4 h-4" />
                                        APPROVE & STRIPE REFUND
                                    </button>
                                    <button 
                                        onClick={() => updateStatus(selectedOrder.id, 'paid')}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/40 font-bold text-[10px] rounded-xl transition-all"
                                    >
                                        REJECT REQUEST
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Invoice Modal */}
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
                          <span className="font-bold text-gray-800 uppercase tracking-widest text-sm">Download Invoice</span>
                      </div>
                      <div className="flex items-center gap-2">
                          {invoiceData && (
                              <button 
                                onClick={() => handlePrint()}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-red-600/20"
                              >
                                  <Printer className="w-4 h-4" />
                                  PRINT INVOICE
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
                        <>
                          <style jsx global>{`
                            @media print {
                              @page {
                                size: A4 portrait;
                                margin: 0 !important;
                              }
                              html, body {
                                width: 210mm !important;
                                height: 297mm !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                                color: #000000 !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              .print-a4-fit {
                                box-sizing: border-box !important;
                                width: 210mm !important;
                                max-width: 210mm !important;
                                height: 297mm !important;
                                max-height: 297mm !important;
                                padding: 12mm 15mm !important;
                                margin: 0 auto !important;
                                border: none !important;
                                box-shadow: none !important;
                                border-radius: 0 !important;
                                overflow: hidden !important;
                                display: flex !important;
                                flex-direction: column !important;
                                justify-content: space-between !important;
                              }
                            }
                          `}</style>
                          <div ref={invoiceRef} className="print-a4-fit bg-white text-gray-900 font-sans border-4 border-gray-50 shadow-2xl max-w-[800px] mx-auto overflow-hidden">
                              {/* Decorative Header */}
                              <div className="bg-gradient-to-r from-[#9f2e2b] via-[#be2826] to-[#ecb52b] h-2.5 w-full shrink-0" />
                              
                              <div className="p-6 sm:p-8 print:p-0 flex-1 flex flex-col justify-between">
                                  <div>
                                      <div className="flex justify-between items-start mb-6 print:mb-5">
                                          <div className="flex items-center gap-4">
                                              <div className="w-16 h-16 bg-[#be2826] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transform -rotate-3 border-4 border-white shrink-0">DB</div>
                                              <div>
                                                  <h1 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 leading-[0.8]">DEAR <br/>BACCHANAL</h1>
                                                  <p className="text-[9px] font-black uppercase tracking-[4px] text-[#be2826] mt-1.5">Premium Keepsakes</p>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <h2 className="text-4xl font-black text-[#be2826] uppercase tracking-tighter mb-1 leading-none">INVOICE</h2>
                                              <p className="text-xs font-black text-gray-900">{invoiceData.invoiceNumber}</p>
                                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mt-0.5">{format(new Date(invoiceData.date), 'MMMM dd, yyyy')}</p>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-8 mb-6 print:mb-5 relative">
                                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-200 hidden sm:block" />
                                          <div>
                                              <div className="text-[9px] font-black uppercase tracking-[3px] text-gray-700 mb-3 flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-[#be2826]" />
                                                  Billed To
                                              </div>
                                              <div className="text-base font-black text-gray-900">{invoiceData.customer.name}</div>
                                              <p className="text-xs font-bold text-[#be2826] mt-0.5">{invoiceData.customer.email}</p>
                                              <div className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">
                                                  <p>{invoiceData.customer.address.line1}</p>
                                                  {invoiceData.customer.address.line2 && <p>{invoiceData.customer.address.line2}</p>}
                                                  <p>{invoiceData.customer.address.city}, {invoiceData.customer.address.state} {invoiceData.customer.address.postal_code}</p>
                                                  <p className="font-black text-gray-900 uppercase tracking-wider mt-0.5">{invoiceData.customer.address.country}</p>
                                              </div>
                                          </div>
                                          <div className="sm:pl-8">
                                              <div className="text-[9px] font-black uppercase tracking-[3px] text-gray-700 mb-3 flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-[#ecb52b]" />
                                                  From
                                              </div>
                                              <div className="text-base font-black text-gray-900">Dear Bacchanal Ltd.</div>
                                              <div className="text-xs font-bold text-gray-600 mt-0.5">billing@dearbacchanal.com</div>
                                              <div className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">
                                                  <p>123 Carnival Way</p>
                                                  <p>Port of Spain, Trinidad & Tobago</p>
                                                  <p className="mt-1 text-[9px] font-black text-[#be2826] uppercase">Tax ID: DB-TR-2026-X</p>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 print:mb-5 border border-gray-200/60">
                                          <table className="w-full">
                                              <thead>
                                                  <tr className="border-b-2 border-gray-900/10">
                                                      <th className="pb-2 text-left text-[9px] font-black uppercase tracking-widest text-gray-700">Description</th>
                                                      <th className="pb-2 text-center text-[9px] font-black uppercase tracking-widest text-gray-700">Qty</th>
                                                      <th className="pb-2 text-right text-[9px] font-black uppercase tracking-widest text-gray-700">Amount</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-200/50">
                                                  {invoiceData.items.map((item: any, idx: number) => (
                                                      <tr key={idx}>
                                                          <td className="py-3">
                                                              <p className="font-black text-sm text-gray-900">{item.description}</p>
                                                              <div className="flex gap-2 mt-1">
                                                                  <span className="text-[8px] font-black bg-[#be2826] text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                                                      {invoiceData.templateName || selectedOrder?.templateName || "Custom Template"}
                                                                  </span>
                                                                  <span className="text-[8px] font-black bg-gray-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                                                      {(invoiceData.type || selectedOrder?.type) === 'hard' ? 'Hardcover' : 'Digital PDF'}
                                                                  </span>
                                                              </div>
                                                          </td>
                                                          <td className="py-3 text-center font-black text-gray-900 text-sm">{item.quantity}</td>
                                                          <td className="py-3 text-right font-black text-base text-gray-900">${item.total.toFixed(2)}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>

                                      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 print:gap-4">
                                          <div className="flex-1">
                                              <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center gap-3 bg-gray-50/50">
                                                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                                                  <div>
                                                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">Payment Verified</p>
                                                      <p className="font-black text-xs text-gray-900">Transaction ID: {(selectedOrder?.orderId || selectedOrder?.id || '').slice(0, 16)}...</p>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="w-full sm:w-[230px] space-y-2">
                                              <div className="flex justify-between items-center text-xs">
                                                  <span className="text-gray-700 font-bold uppercase tracking-wider">Book Price</span>
                                                  <span className="font-bold text-gray-900">${invoiceData.subtotal.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center text-xs">
                                                  <span className="text-gray-700 font-bold uppercase tracking-wider">Processing & Delivery</span>
                                                  <span className="font-bold text-gray-900">${(invoiceData.shippingFee || invoiceData.processing || 0).toFixed(2)}</span>
                                              </div>
                                              <div className="pt-3 border-t-2 border-gray-900">
                                                  <div className="flex justify-between items-center mb-0.5">
                                                      <span className="text-[9px] font-black uppercase tracking-[3px] text-[#be2826]">Grand Total</span>
                                                      <span className="text-2xl font-black text-gray-900">${invoiceData.total.toFixed(2)}</span>
                                                  </div>
                                                  <p className="text-[8px] font-black text-gray-500 uppercase italic text-right">Paid via {invoiceData.paymentMethod} Gateway</p>
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
                                  </div>

                                  <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                      <div className="text-[8px] text-gray-500 font-black uppercase tracking-[4px] text-center sm:text-left">
                                          Keep the spirit alive. <br/>Bacchanal never ends.
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                                              Authentic <CheckCircle className="w-3 h-3 text-green-600" />
                                          </div>
                                          <div className="text-[8px] font-black bg-gray-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                              OFFICIAL PROPERTY OF DEAR BACCHANAL
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Decorative Footer */}
                              <div className="grid grid-cols-6 h-2 w-full shrink-0">
                                  <div className="bg-[#be2826]" />
                                  <div className="bg-[#ecb52b]" />
                                  <div className="bg-[#000000]" />
                                  <div className="bg-[#be2826]" />
                                  <div className="bg-[#ecb52b]" />
                                  <div className="bg-[#000000]" />
                              </div>
                          </div>
                        </>
                    ) : null}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function StatusButton({ active, onClick, icon: Icon, label, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
        active 
          ? `bg-white/10 border-white/20 shadow-lg` 
          : "bg-transparent border-white/5 hover:bg-white/5 opacity-40 hover:opacity-100"
      }`}
    >
      <Icon className={`w-5 h-5 mb-1 ${active ? color : "text-white/40"}`} />
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? "text-white" : "text-white/20"}`}>{label}</span>
      {active && <div className={`w-1 h-1 rounded-full mt-1 ${color.replace('text', 'bg')}`} />}
    </button>
  );
}

