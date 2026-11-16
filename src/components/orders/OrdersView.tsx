import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Clock,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ChevronRight,
  FileText,
  X,
  Search,
  Phone,
  Navigation,
  ArrowRight,
  Sparkles,
  Layers,
  AlertCircle,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { SignInRequired } from '../auth/SignInRequired.js';
import { PaymentGatewayModal, GatewaySessionData } from '../cart/PaymentGatewayModal.js';
import { BrandLogo } from '../common/BrandLogo.js';

export const OrdersView: React.FC = () => {
  const { currentUser, activeTrackingOrder, setActiveTrackingOrder, showToast, setActiveTab } = useApp();
  const isVendorOrStaff = currentUser?.role === 'vendor' || currentUser?.role === 'delivery_agent' || currentUser?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(activeTrackingOrder);
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'delivered'>('all');
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [activePaymentSession, setActivePaymentSession] = useState<GatewaySessionData | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  const loadOrders = async () => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getOrders();
      const visibleOrders = isVendorOrStaff
        ? data.orders
        : data.orders.filter((o) => o.customerId === currentUser.id);
      setOrders(visibleOrders);
      if (!selectedOrder && visibleOrders.length > 0) {
        setSelectedOrder(visibleOrders[0]);
      } else if (selectedOrder) {
        const updated = visibleOrders.find((o) => o.id === selectedOrder.id);
        setSelectedOrder(updated || visibleOrders[0] || null);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  useEffect(() => {
    if (activeTrackingOrder) {
      setSelectedOrder(activeTrackingOrder);
    }
  }, [activeTrackingOrder]);

  const handleVerifyOtp = async (orderId: string) => {
    if (!otpInput || otpInput.length !== 4) {
      showToast('Invalid OTP', 'Please enter a 4-digit code.', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.verifyDeliveryOtp(orderId, otpInput);
      showToast('Delivery Verified!', res.message, 'success');
      setSelectedOrder(res.order);
      setOtpInput('');
      loadOrders();
    } catch (err: any) {
      showToast('OTP Failed', err.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Status advancement simulation for testing & full flow demonstration
  const handleAdvanceStatus = async (orderId: string, nextStatus: string, note: string) => {
    setAdvancingStatus(true);
    try {
      const res = await api.updateOrderStatus(orderId, nextStatus, note, {
        id: 'usr_del_01',
        name: 'Ganesh Shinde',
        phone: '+91 97654 32100',
        vehicleNumber: 'KA 01 AH 5429',
        vehicleType: '16-Ton Multi-Axle Tipper',
      });
      showToast('Tracking Updated', `Consignment progressed to ${nextStatus.replace(/_/g, ' ')}.`, 'success');
      setSelectedOrder(res.order);
      loadOrders();
    } catch (err: any) {
      showToast('Update failed', err.message, 'error');
    } finally {
      setAdvancingStatus(false);
    }
  };

  const handlePayNow = async (order: Order) => {
    setInitiatingPayment(true);
    try {
      const session = await api.createGatewayOrder({ orderIds: [order.id] });
      setActivePaymentSession(session);
    } catch (err: any) {
      showToast('Gateway Error', err.message || 'Unable to launch payment gateway.', 'error');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">Awaiting Payment</span>;
      case 'confirmed':
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold">Confirmed</span>;
      case 'processing':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">Yard Loading</span>;
      case 'dispatched':
        return <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-semibold">Dispatched</span>;
      case 'out_for_delivery':
        return <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold">Out for Delivery</span>;
      case 'delivered':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">Delivered</span>;
      case 'cancelled':
        return <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-semibold">Cancelled</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">{status}</span>;
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'in_transit') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (statusFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  // Calculate Delivery Milestone Step Index (0 to 4)
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 0;
      case 'processing':
        return 1;
      case 'dispatched':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const TRACKING_STEPS = [
    { title: 'Order Confirmed', desc: 'GST invoice generated' },
    { title: 'Yard Loading', desc: 'QC checked & packed' },
    { title: 'Dispatched', desc: 'Loaded on heavy tipper' },
    { title: 'Out for Delivery', desc: 'En route to site coordinates' },
    { title: 'Delivered', desc: 'OTP verified & unloaded' },
  ];

  const currentStep = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  if (!currentUser) {
    return (
      <SignInRequired
        title="Sign in to track your orders"
        description="Sign in to view live consignment dispatches, verify delivery OTPs, and download GST tax invoices."
      />
    );
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Site Delivery Logistics & Live Consignment Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Tracking & Delivery Fleet
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Real-time milestone tracking, driver coordination, and secure 4-digit site OTP verification for heavy construction loads.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Fetching active site consignments...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Browse the materials marketplace to place building supply orders.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Order History & Search */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Consignments ({filteredOrders.length})
                </h2>
                <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-0.5 rounded ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('in_transit')}
                    className={`px-2 py-0.5 rounded ${
                      statusFilter === 'in_transit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('delivered')}
                    className={`px-2 py-0.5 rounded ${
                      statusFilter === 'delivered' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Delivered
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order #, vendor, or material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedOrder?.id === ord.id
                        ? 'bg-white border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{ord.orderNumber}</span>
                      {getStatusBadge(ord.status)}
                    </div>

                    <div className="text-xs text-slate-800 font-semibold line-clamp-1">
                      {ord.items[0]?.productName} {ord.items.length > 1 ? `+${ord.items.length - 1} more` : ''}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Vendor: {ord.vendorName}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ₹{ord.grandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400">
                      Destination: {ord.shippingAddress.city} · {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Real-Time Live Tracking Detail */}
            {selectedOrder && (
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 font-mono">{selectedOrder.orderNumber}</h3>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Placed: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')} · Yard: {selectedOrder.vendorName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>
                        Payment:{' '}
                        <span
                          className={`font-semibold ${
                            selectedOrder.paymentStatus === 'paid'
                              ? 'text-emerald-700'
                              : selectedOrder.paymentStatus === 'refunded'
                              ? 'text-slate-600'
                              : selectedOrder.paymentStatus === 'failed'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {selectedOrder.paymentStatus.toUpperCase()} ({selectedOrder.paymentMethod.replace('_', ' ')})
                        </span>
                      </span>
                      {selectedOrder.paymentReference && (
                        <span className="font-mono text-slate-600">
                          · Ref: {selectedOrder.paymentReference}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      title="View construction milestone and delivery progress"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Project Timeline</span>
                    </button>
                    <button
                      onClick={() => setInvoiceModal(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>View GST Tax Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Complete Gateway Payment Banner for Pending / Failed Orders */}
                {(selectedOrder.paymentStatus === 'pending' || selectedOrder.paymentStatus === 'failed') &&
                  selectedOrder.status !== 'cancelled' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CreditCard className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-900">
                            {selectedOrder.paymentStatus === 'failed'
                              ? 'Previous Payment Attempt Failed'
                              : selectedOrder.paymentMethod === 'COD'
                              ? 'Cash on Delivery — Pay Online Anytime'
                              : 'Gateway Payment Pending'}
                          </div>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Authorize ₹{selectedOrder.grandTotal.toLocaleString('en-IN')} via UPI, Card, or NetBanking to confirm yard dispatch.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={initiatingPayment}
                        onClick={() => handlePayNow(selectedOrder)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs whitespace-nowrap cursor-pointer shrink-0"
                      >
                        {initiatingPayment
                          ? 'Opening Gateway...'
                          : `Pay ₹${selectedOrder.grandTotal.toLocaleString('en-IN')} Now`}
                      </button>
                    </div>
                  )}

                {/* HORIZONTAL LOGISTICS TRACKING STEPPER */}
                <div className="py-3 px-2 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between relative px-2 sm:px-4">
                    {/* Background Progress Bar */}
                    <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 z-0" />
                    <div
                      className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 z-0"
                      style={{
                        width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 88}%`,
                      }}
                    />

                    {/* Step Nodes */}
                    {TRACKING_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            } ${isCurrent && selectedOrder.status !== 'delivered' ? 'ring-4 ring-amber-400/40' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="mt-2">
                            <div
                              className={`text-[11px] font-bold ${
                                isCompleted ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </div>
                            <div className="hidden sm:block text-[9px] text-slate-400 max-w-[80px]">
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secure Delivery OTP Callout (BuildNiva Site Delivery Standard) */}
                {selectedOrder.status !== 'delivered' ? (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>Secure Site Unloading & Delivery OTP</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Inspect cement bags / steel bundles / sand volume on site before giving this 4-digit code to the tipper driver.
                      </p>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-widest bg-white px-4 py-2 rounded-xl border border-amber-300 shadow-xs tabular-nums self-end sm:self-center font-mono">
                      {selectedOrder.deliveryOtp || '4829'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Consignment Fully Delivered & Inspected on Site</div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Signed off with 4-digit secure OTP. Payment settled to vendor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Assigned Delivery Fleet & Carrier Telemetry */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>Assigned Fleet Carrier & Driver</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      GPS Tracking Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Driver Name</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        {selectedOrder.deliveryAgent?.name || 'Ganesh Shinde'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {selectedOrder.deliveryAgent?.phone || '+91 97654 32100'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vehicle Details</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {selectedOrder.deliveryAgent?.vehicleType || '16-Ton Multi-Axle Tipper'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {selectedOrder.deliveryAgent?.vehicleNumber || 'KA 01 AH 5429'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Estimated Site ETA</span>
                      <span className="font-bold text-emerald-700 block mt-0.5">
                        {selectedOrder.status === 'delivered' ? 'Completed' : 'Approx. 35 - 45 Mins'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Drop: {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer View: Official GST Tax Invoice Card */}
                {!isVendorOrStaff && (
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50/40 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Official GST Tax Invoice & HSN Summary
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tax-compliant invoice with HSN codes, supplier GSTIN ({selectedOrder.vendorName}), and CGST/SGST tax credits.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setInvoiceModal(selectedOrder)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-center shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>View & Download Tax Invoice</span>
                    </button>
                  </div>
                )}

                {/* Vendor / Delivery Staff Lifecycle & Cargo Manifest Controls */}
                {isVendorOrStaff && (
                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Interactive Delivery Lifecycle Controls (Vendor / Carrier):</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Test all order milestones live</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedOrder.status === 'confirmed' && (
                        <button
                          onClick={() => handleAdvanceStatus(selectedOrder.id, 'processing', 'Materials loaded and quality-checked at yard')}
                          disabled={advancingStatus}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          1. Pack & Load at Yard
                        </button>
                      )}

                      {selectedOrder.status === 'processing' && (
                        <button
                          onClick={() => handleAdvanceStatus(selectedOrder.id, 'dispatched', 'Consignment loaded on 16T tipper and dispatched')}
                          disabled={advancingStatus}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          2. Dispatch Tipper Truck
                        </button>
                      )}

                      {selectedOrder.status === 'dispatched' && (
                        <button
                          onClick={() => handleAdvanceStatus(selectedOrder.id, 'out_for_delivery', 'Driver within 5km of site coordinates')}
                          disabled={advancingStatus}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                        >
                          3. Mark Out for Delivery
                        </button>
                      )}

                      {selectedOrder.status === 'out_for_delivery' && (
                        <div className="flex items-center gap-2 w-full pt-1">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Enter Customer OTP"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            className="w-36 bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 text-center font-bold font-mono"
                          />
                          <button
                            onClick={() => handleVerifyOtp(selectedOrder.id)}
                            disabled={verifying}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            {verifying ? 'Verifying...' : 'Sign off & Unload (Verify OTP)'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Section */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {isVendorOrStaff ? 'Consignment Cargo Manifest' : 'Ordered Materials & Supplies'}
                  </h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{it.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            {it.quantity} {it.unit}s @ ₹{it.unitPrice} · GST {it.gstRate}%
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 tabular-nums">
                          ₹{it.totalPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Materials Net:</span>
                      <span className="font-semibold tabular-nums">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tax GST:</span>
                      <span className="font-semibold tabular-nums">₹{selectedOrder.totalGst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Site Offloading & Tipper Freight:</span>
                      <span className="font-semibold tabular-nums">₹{selectedOrder.totalDelivery.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-amber-700 tabular-nums">₹{selectedOrder.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GST Tax Invoice Modal */}
        {invoiceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <BrandLogo size="md" />
                  <div>
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      BuildNiva Marketplace · Tax Invoice
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Invoice #{invoiceModal.orderNumber.replace('BC-ORD-', 'BC-INV-')}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setInvoiceModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                <div>
                  <div className="font-bold text-slate-800">Billed From (Supplier):</div>
                  <div className="text-slate-600">{invoiceModal.vendorName}</div>
                  <div className="text-slate-500 text-[11px]">GSTIN: 29AABCA8492K1Z9</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Billed To (Site):</div>
                  <div className="text-slate-600">{invoiceModal.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{invoiceModal.shippingAddress.street}, {invoiceModal.shippingAddress.city} - {invoiceModal.shippingAddress.pincode}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                    <th className="py-1">Description</th>
                    <th className="py-1">Qty</th>
                    <th className="py-1">Rate</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceModal.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-medium text-slate-800">{it.productName}</td>
                      <td className="py-1.5 text-slate-600 tabular-nums">{it.quantity} {it.unit}</td>
                      <td className="py-1.5 text-slate-600 tabular-nums">₹{it.unitPrice}</td>
                      <td className="py-1.5 text-right font-semibold text-slate-900 tabular-nums">
                        ₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold">
                <span>Total Taxable + GST:</span>
                <span className="text-base text-slate-900 tabular-nums">
                  ₹{invoiceModal.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway Status</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {invoiceModal.paymentStatus} · {invoiceModal.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Reference</span>
                  <span className="font-mono text-slate-800">
                    {invoiceModal.paymentReference || 'Awaiting Gateway Capture'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Payment Gateway Modal for Unpaid / Retry Orders */}
        {activePaymentSession && currentUser && (
          <PaymentGatewayModal
            session={activePaymentSession}
            customerName={currentUser.name}
            customerEmail={currentUser.email}
            customerPhone={currentUser.phone}
            onVerified={(verifiedOrders) => {
              setActivePaymentSession(null);
              if (verifiedOrders[0]) {
                setSelectedOrder(verifiedOrders[0]);
              }
              showToast('Payment Verified', 'Gateway payment verified and order confirmed.', 'success');
              loadOrders();
            }}
            onCancelPending={() => {
              setActivePaymentSession(null);
              loadOrders();
            }}
            onOrderCancelled={() => {
              setActivePaymentSession(null);
              showToast('Order Cancelled', 'Order cancelled and stock released.', 'info');
              loadOrders();
            }}
          />
        )}
      </div>
    </div>
  );
};
