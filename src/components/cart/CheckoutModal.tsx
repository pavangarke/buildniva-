import React, { useState, useEffect } from 'react';
import { X, MapPin, CreditCard, QrCode, Building, ShieldCheck, Truck, Wallet, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Order, SavedAddress } from '../../types/index.js';
import { PaymentGatewayModal, GatewaySessionData } from './PaymentGatewayModal.js';

interface CheckoutModalProps {
  calculation: any;
  onClose: () => void;
  onOrderComplete: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ calculation, onClose, onOrderComplete }) => {
  const { currentUser, showToast, setActiveTrackingOrder, setActiveTab, setAuthModalOpen } = useApp();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [shippingAddress, setShippingAddress] = useState({
    street: 'Plot #42, Green Glen Layout, Outer Ring Road, Bellandur',
    city: currentUser?.city || 'Bengaluru',
    state: 'Karnataka',
    pincode: currentUser?.pincode || '560034',
    landmark: 'Opposite Shell Petrol Bunk',
  });

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [preferredMethod, setPreferredMethod] = useState<'PHONEPE' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET'>('UPI');
  const [submitting, setSubmitting] = useState(false);

  // Active Payment Gateway Session
  const [gatewaySession, setGatewaySession] = useState<GatewaySessionData | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    api
      .getAddresses(currentUser.id)
      .then((res) => {
        if (!active) return;
        const list: SavedAddress[] = res.addresses || [];
        setSavedAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) {
          setShippingAddress({
            street: preferred.street || '',
            city: preferred.city || currentUser.city || 'Bengaluru',
            state: preferred.state || 'Karnataka',
            pincode: preferred.pincode || currentUser.pincode || '560034',
            landmark: preferred.landmark || '',
          });
        }
      })
      .catch((err) => console.error('Failed to load saved addresses:', err));
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in or create an account to place a material order.', 'info');
      onClose();
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = calculation.items.map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));

      if (paymentMode === 'COD') {
        const res = await api.checkout({
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          shippingAddress,
          items: itemsPayload,
          paymentMethod: 'COD',
          deferPayment: false,
        });

        const firstOrder = res.orders[0];
        showToast(
          'COD Order Confirmed!',
          `Order ${firstOrder.orderNumber} scheduled for dispatch. Delivery OTP: ${firstOrder.deliveryOtp}`,
          'success'
        );
        setActiveTrackingOrder(firstOrder);
        onOrderComplete();
        setActiveTab('orders');
        return;
      }

      // Online Gateway Flow:
      // 1) Reserve inventory and create pending orders
      const checkoutRes = await api.checkout({
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerPhone: currentUser.phone,
        shippingAddress,
        items: itemsPayload,
        paymentMethod: preferredMethod === 'PHONEPE' ? 'UPI' : preferredMethod,
        deferPayment: true,
      });

      const orderIds = checkoutRes.orders.map((o) => o.id);
      setPendingOrders(checkoutRes.orders);

      // 2) Initialize authoritative Payment Gateway order
      const gwSession = await api.createGatewayOrder({ orderIds });
      setGatewaySession(gwSession);
    } catch (err: any) {
      showToast('Checkout Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (gatewaySession && currentUser) {
    return (
      <PaymentGatewayModal
        session={gatewaySession}
        customerName={currentUser.name}
        customerEmail={currentUser.email}
        customerPhone={currentUser.phone}
        initialMethod={preferredMethod}
        onVerified={(verifiedOrders) => {
          const primary = verifiedOrders[0] || pendingOrders[0];
          if (primary) {
            setActiveTrackingOrder(primary);
            showToast(
              'Payment Verified!',
              `Order ${primary.orderNumber} confirmed. Delivery OTP: ${primary.deliveryOtp}`,
              'success'
            );
          }
          onOrderComplete();
          setActiveTab('orders');
        }}
        onCancelPending={() => {
          const primary = pendingOrders[0];
          if (primary) {
            setActiveTrackingOrder(primary);
            showToast(
              'Order Saved — Payment Pending',
              `Complete payment for ${primary.orderNumber} anytime from My Orders.`,
              'info'
            );
          }
          onOrderComplete();
          setActiveTab('orders');
        }}
        onOrderCancelled={() => {
          setGatewaySession(null);
          setPendingOrders([]);
          showToast('Order Cancelled', 'Payment was cancelled and reserved inventory has been released.', 'info');
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-6 my-8">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Site Material Checkout
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Confirm Delivery Address &amp; Payment Method
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-5 text-xs">
          {/* Shipping Address */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Job Site Delivery Location</span>
              </div>
              {savedAddresses.length > 0 && (
                <select
                  onChange={(e) => {
                    const selected = savedAddresses.find((a) => a.id === e.target.value);
                    if (selected) {
                      setShippingAddress({
                        street: selected.street || '',
                        city: selected.city || 'Bengaluru',
                        state: selected.state || 'Karnataka',
                        pincode: selected.pincode || '',
                        landmark: selected.landmark || '',
                      });
                    }
                  }}
                  defaultValue={(savedAddresses.find((a) => a.isDefault) || savedAddresses[0])?.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 font-medium"
                >
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label}{addr.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Site Street / Plot / Project Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={shippingAddress.pincode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Payment Option</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-bit TLS Encrypted</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode('ONLINE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMode === 'ONLINE'
                    ? 'border-amber-600 bg-amber-50/70'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900">Pay via Payment Gateway</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  UPI QR, Cards, NetBanking &amp; Trade Wallets
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('COD')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMode === 'COD'
                    ? 'border-amber-600 bg-amber-50/70'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pay on Site Delivery</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Verify material load before cheque / UPI on site
                </div>
              </button>
            </div>

            {paymentMode === 'ONLINE' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {[
                  { id: 'UPI' as const, label: 'UPI / QR', icon: QrCode },
                  { id: 'PHONEPE' as const, label: 'PhonePe', icon: Smartphone },
                  { id: 'CARD' as const, label: 'Credit / Debit Card', icon: CreditCard },
                  { id: 'NET_BANKING' as const, label: 'Net Banking', icon: Building },
                  { id: 'WALLET' as const, label: 'Wallets / Credit', icon: Wallet },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = preferredMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreferredMethod(opt.id)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        active
                          ? opt.id === 'PHONEPE'
                            ? 'border-[#5f259f] bg-purple-50/70 font-bold text-slate-900'
                            : 'border-amber-600 bg-amber-50/60 font-bold text-slate-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mx-auto mb-1 ${
                          opt.id === 'PHONEPE' ? 'text-[#5f259f]' : 'text-amber-600'
                        }`}
                      />
                      <span className="text-[11px] whitespace-nowrap">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price Summary Breakdown */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Materials Net Cost</span>
              <span className="font-semibold tabular-nums">₹{calculation.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (Goods &amp; Services Tax)</span>
              <span className="font-semibold tabular-nums">₹{calculation.totalGst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tipper Fleet Unloading Charge</span>
              <span className="font-semibold tabular-nums">₹{calculation.totalDelivery.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Final Order Total</span>
              <span className="text-amber-700 tabular-nums">
                ₹{calculation.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg whitespace-nowrap cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Initializing Gateway...'
                  : paymentMode === 'COD'
                  ? `Confirm COD Order (₹${calculation.grandTotal.toLocaleString('en-IN')})`
                  : `Proceed to Gateway · ₹${calculation.grandTotal.toLocaleString('en-IN')}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
