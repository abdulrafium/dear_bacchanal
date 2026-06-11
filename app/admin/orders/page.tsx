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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

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
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refund_pending' | 'refunded';
  shippingDetails?: any;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.total);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const activeFilterCount = (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setSearch("");
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchOrders();
        if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status } as Order);
        }
      }
    } catch (error) {
      toast.error("Update failed");
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
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const [syncing, setSyncing] = useState(false);

  const syncFromStripe = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/orders/sync-stripe', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchOrders();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync from Stripe');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase">Order Management</h1>
          <p className="text-white/40 text-sm">Track sales, shipping status, and generate invoices · <span className="text-white/60 font-bold">{totalOrders} total orders</span></p>
        </div>
        
        <div className="flex items-center gap-2">
            <button
              onClick={syncFromStripe}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Stripe'}
            </button>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                    type="text" 
                    placeholder="Search name, email, template..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all min-w-[280px]"
                />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border rounded-xl transition-all relative ${
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
        {/* Table Area */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
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
                  orders.map((order) => (
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
                        <button 
                            onClick={(e) => { e.stopPropagation(); openInvoice(order); }}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
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

        {/* Info Area */}
        <div className="space-y-6">
            {!selectedOrder ? (
                <div className="bg-[#0f0f0f] border border-dashed border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Package className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-white/20 text-sm font-bold uppercase tracking-widest">Select an order to view details</p>
                </div>
            ) : (
                <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
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
                        <div ref={invoiceRef} className="bg-white text-gray-900 font-sans border-8 border-gray-50 shadow-2xl max-w-[800px] mx-auto overflow-hidden">
                            {/* Decorative Header */}
                            <div className="bg-gradient-to-r from-[#9f2e2b] via-[#be2826] to-[#ecb52b] h-3 w-full" />
                            
                            <div className="p-8 sm:p-12">
                                <div className="flex justify-between items-start mb-16">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-[#be2826] rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl transform -rotate-3 border-4 border-white">DB</div>
                                        <div>
                                            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-gray-900 leading-[0.8]">DEAR <br/>BACCHANAL</h1>
                                            <p className="text-[10px] font-black uppercase tracking-[5px] text-[#be2826] mt-2">Premium Keepsakes</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter mb-2 leading-none">INVOICE</h2>
                                        <p className="text-sm font-black text-gray-900">{invoiceData.invoiceNumber}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#be2826] mt-1">{format(new Date(invoiceData.date), 'MMMM dd, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-16 relative">
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

                                <div className="bg-gray-50 rounded-3xl p-8 mb-16">
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
                                                                {selectedOrder?.templateName || "Custom Template"}
                                                            </span>
                                                            <span className="text-[9px] font-black bg-gray-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                                                {selectedOrder?.type === 'hard' ? 'Hardcover' : 'Softcopy'}
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
                                                <p className="font-black text-sm text-gray-900">Transaction ID: {(selectedOrder?.orderId || selectedOrder?.id || '').slice(0, 16)}...</p>
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
                                
                                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                                    <div className="text-[8px] text-gray-400 font-black uppercase tracking-[6px] text-center sm:text-left">
                                        Keep the spirit alive. <br/>Bacchanal never ends.
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

