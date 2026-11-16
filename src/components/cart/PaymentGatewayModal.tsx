import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { Order, PaymentRecord } from '../../types/index.js';
import { BrandLogo } from '../common/BrandLogo.js';

export interface GatewaySessionData {
  provider: 'razorpay' | 'sandbox';
  keyId?: string;
  gatewayOrderId: string;
  amountInr: number;
  amountPaise: number;
  currency: 'INR';
  receipt: string;
  orderIds: string[];
  orderNumbers: string[];
}

interface PaymentGatewayModalProps {
  session: GatewaySessionData;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  initialMethod?: 'PHONEPE' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
  onVerified: (orders: Order[], payments: PaymentRecord[]) => void;
  onCancelPending: () => void;
  onOrderCancelled: () => void;
}

type GatewayMethod = 'PHONEPE' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
type GatewayStage = 'method' | 'bank_auth' | 'verifying' | 'success' | 'failed';

const POPULAR_BANKS = [
  { code: 'AIRP', name: 'Airtel Payments Bank', short: 'AIRTEL BANK' },
  { code: 'HDFC', name: 'HDFC Corporate / Retail', short: 'HDFC' },
  { code: 'ICIC', name: 'ICICI NetBanking', short: 'ICICI' },
  { code: 'SBIN', name: 'State Bank of India', short: 'SBI' },
  { code: 'UTIB', name: 'Axis Bank', short: 'AXIS' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank', short: 'KOTAK' },
];

const WALLET_PROVIDERS = [
  { id: 'Airtel Payments Bank / Airtel Money', desc: 'Airtel Thanks Savings & Wallet · IFSC AIRP0000001' },
  { id: 'Amazon Pay Balance', desc: 'Instant wallet debit · 0% convenience fee' },
  { id: 'PhonePe Wallet / Lite', desc: 'Linked UPI wallet express checkout' },
  { id: 'Paytm Postpaid', desc: '15-day contractor credit line' },
  { id: 'Bajaj Finserv Site EMI', desc: 'No-cost 3-month material credit' },
];

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  session,
  customerName,
  customerEmail,
  customerPhone,
  initialMethod = 'UPI',
  onVerified,
  onCancelPending,
  onOrderCancelled,
}) => {
  const { currentUser } = useApp();
  const phoneDigits = (customerPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10) || '9820144521';
  const hasAirtelLinked = Boolean(
    currentUser?.bankDetails?.ifscCode?.toUpperCase().startsWith('AIRP') ||
      currentUser?.bankDetails?.bankName?.toLowerCase().includes('airtel')
  );

  const [method, setMethod] = useState<GatewayMethod>(initialMethod);
  const [stage, setStage] = useState<GatewayStage>('method');
  const [errorMsg, setErrorMsg] = useState('');
  const [processingCancel, setProcessingCancel] = useState(false);

  // UPI & PhonePe state
  const [upiMode, setUpiMode] = useState<'qr' | 'vpa'>('vpa');
  const [upiVpa, setUpiVpa] = useState(hasAirtelLinked ? `${phoneDigits}@airtel` : 'sitebuilder@okaxis');
  const [phonepeMode, setPhonepeMode] = useState<'vpa' | 'qr'>('vpa');
  const [phonepeVpa, setPhonepeVpa] = useState(`${phoneDigits}@ybl`);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [otpCode, setOtpCode] = useState('');

  // Net Banking state
  const [selectedBank, setSelectedBank] = useState(hasAirtelLinked ? 'Airtel Payments Bank' : 'HDFC Corporate / Retail');

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState(WALLET_PROVIDERS[0].id);

  // Verified receipt state
  const [verifiedOrders, setVerifiedOrders] = useState<Order[]>([]);
  const [verifiedPayments, setVerifiedPayments] = useState<PaymentRecord[]>([]);

  // If server configured live Razorpay credentials, launch native Razorpay Checkout
  useEffect(() => {
    if (session.provider !== 'razorpay' || !session.keyId) return;

    let cancelled = false;
    (async () => {
      const loaded = await loadRazorpayScript();
      if (!loaded || cancelled) {
        setErrorMsg('Unable to load Razorpay Checkout SDK. Check network connection.');
        setStage('failed');
        return;
      }

      const options = {
        key: session.keyId,
        amount: session.amountPaise,
        currency: session.currency,
        name: 'BuildNiva Marketplace',
        description: `Site Materials (${session.orderNumbers.join(', ')})`,
        order_id: session.gatewayOrderId,
        prefill: {
          name: customerName,
          email: customerEmail || 'orders@buildniva.in',
          contact: customerPhone,
        },
        theme: { color: '#D97706' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStage('verifying');
          try {
            const verifyRes = await api.verifyPaymentSignature({
              orderIds: session.orderIds,
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
              paymentMethod: 'CARD',
              methodDetails: 'Razorpay Checkout Verified',
            });
            setVerifiedOrders(verifyRes.orders || (verifyRes.order ? [verifyRes.order] : []));
            setVerifiedPayments(verifyRes.payments || (verifyRes.payment ? [verifyRes.payment] : []));
            setStage('success');
          } catch (err: any) {
            setErrorMsg(err?.message || 'Gateway signature verification failed.');
            setStage('failed');
          }
        },
        modal: {
          ondismiss: () => {
            if (!cancelled && stage !== 'success' && stage !== 'verifying') {
              onCancelPending();
            }
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', async (resp: any) => {
        const reason = resp?.error?.description || 'Payment failed at Razorpay';
        await api.failGatewayPayment({
          orderIds: session.orderIds,
          gatewayOrderId: session.gatewayOrderId,
          reason,
          cancelOrders: false,
        }).catch(() => {});
        setErrorMsg(reason);
        setStage('failed');
      });
      rzp.open();
    })();

    return () => {
      cancelled = true;
    };
  }, [session.gatewayOrderId]);

  const backendPaymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' =
    method === 'PHONEPE' ? 'UPI' : method;

  const getMethodDetails = (): string => {
    if (method === 'PHONEPE') {
      return phonepeMode === 'qr' ? 'PhonePe QR Express' : `PhonePe UPI: ${phonepeVpa.trim()}`;
    }
    if (method === 'UPI') {
      return upiMode === 'qr' ? 'UPI QR Scan' : `UPI: ${upiVpa.trim()}`;
    }
    if (method === 'CARD') {
      const digits = cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4) || '4242';
      const network = digits.startsWith('5') ? 'Mastercard' : digits.startsWith('6') ? 'RuPay' : 'Visa';
      return `${network} •••• ${last4}`;
    }
    if (method === 'NET_BANKING') {
      return selectedBank;
    }
    return selectedWallet;
  };

  const validateAndStartAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (method === 'PHONEPE' && phonepeMode === 'vpa') {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(phonepeVpa.trim())) {
        setErrorMsg('Enter a valid PhonePe UPI ID (e.g. mobile@ybl, mobile@ibl, or mobile@axl).');
        return;
      }
    }

    if (method === 'UPI' && upiMode === 'vpa') {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiVpa.trim())) {
        setErrorMsg('Enter a valid UPI ID (e.g. name@okaxis or mobile@ybl).');
        return;
      }
    }

    if (method === 'CARD') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 15) {
        setErrorMsg('Enter a valid 16-digit credit or debit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setErrorMsg('Enter card expiry in MM/YY format.');
        return;
      }
      const [mm] = cardExpiry.split('/').map(Number);
      if (mm < 1 || mm > 12) {
        setErrorMsg('Expiry month must be between 01 and 12.');
        return;
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        setErrorMsg('Enter a valid 3 or 4 digit CVV.');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMsg('Enter cardholder name.');
        return;
      }
      setOtpCode('123456');
    }

    setStage('bank_auth');
  };

  const executeAuthorization = async (simulateOutcome: 'success' | 'failed', declineReason?: string) => {
    if (simulateOutcome === 'success' && method === 'CARD' && otpCode.trim().length < 4) {
      setErrorMsg('Enter the 6-digit 3D Secure OTP (use 123456 in sandbox).');
      return;
    }

    setErrorMsg('');
    setStage('verifying');
    const methodDetails = getMethodDetails();

    try {
      if (simulateOutcome === 'failed') {
        await api.authorizeSandboxPayment({
          gatewayOrderId: session.gatewayOrderId,
          paymentMethod: backendPaymentMethod,
          methodDetails,
          simulateOutcome: 'failed',
          failureReason: declineReason || 'Transaction declined by issuing bank (Insufficient funds / Risk check).',
        });
      }

      const authRes = await api.authorizeSandboxPayment({
        gatewayOrderId: session.gatewayOrderId,
        paymentMethod: backendPaymentMethod,
        methodDetails,
        simulateOutcome: 'success',
      });

      const verifyRes = await api.verifyPaymentSignature({
        orderIds: session.orderIds,
        gatewayOrderId: authRes.gatewayOrderId,
        gatewayPaymentId: authRes.gatewayPaymentId,
        gatewaySignature: authRes.gatewaySignature,
        paymentMethod: backendPaymentMethod,
        methodDetails,
        idempotencyKey: `${authRes.gatewayOrderId}_${authRes.gatewayPaymentId}`,
      });

      const finalOrders = verifyRes.orders || (verifyRes.order ? [verifyRes.order] : []);
      const finalPayments = verifyRes.payments || (verifyRes.payment ? [verifyRes.payment] : []);
      setVerifiedOrders(finalOrders);
      setVerifiedPayments(finalPayments);
      setStage('success');
    } catch (err: any) {
      const msg = err?.message || 'Payment authorization declined.';
      await api
        .failGatewayPayment({
          orderIds: session.orderIds,
          gatewayOrderId: session.gatewayOrderId,
          paymentMethod: backendPaymentMethod,
          methodDetails,
          reason: msg,
          cancelOrders: false,
        })
        .catch(() => {});
      setErrorMsg(msg);
      setStage('failed');
    }
  };

  const handleAbandonAndCancel = async () => {
    setProcessingCancel(true);
    try {
      await api.failGatewayPayment({
        orderIds: session.orderIds,
        gatewayOrderId: session.gatewayOrderId,
        paymentMethod: backendPaymentMethod,
        reason: 'Customer cancelled order during gateway checkout',
        cancelOrders: true,
      });
      onOrderCancelled();
    } catch {
      onCancelPending();
    } finally {
      setProcessingCancel(false);
    }
  };

  // In live Razorpay mode while native modal is handling input, show a minimal secure backdrop
  if (session.provider === 'razorpay' && stage === 'method') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl text-center space-y-4">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Opening Razorpay Secure Checkout</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gateway Order: <span className="font-mono font-semibold">{session.gatewayOrderId}</span>
            </p>
            <p className="text-sm font-bold text-slate-900 mt-2 tabular-nums">
              ₹{session.amountInr.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelPending}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel & Pay Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Gateway Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="md" className="border-amber-200/80 shadow-sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">BuildNiva Pay</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" />
                  {session.provider === 'razorpay' ? 'Razorpay Live' : 'Sandbox Gateway'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                {session.orderNumbers.join(', ')} · {session.gatewayOrderId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Payable Amount</div>
              <div className="text-lg font-extrabold text-white tabular-nums">
                ₹{session.amountInr.toLocaleString('en-IN')}
              </div>
            </div>
            {stage !== 'verifying' && stage !== 'success' && (
              <button
                type="button"
                onClick={onCancelPending}
                title="Close gateway (order stays pending for later payment)"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {stage === 'method' && (
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Payment Instrument Tabs */}
            <div className="md:col-span-4 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 space-y-1.5">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Payment Options
              </div>

              {[
                { id: 'UPI' as GatewayMethod, label: 'UPI / QR Code', sub: 'GPay, PhonePe, Paytm', icon: QrCode },
                { id: 'PHONEPE' as GatewayMethod, label: 'PhonePe', sub: 'Instant @ybl, Wallet & QR', icon: Smartphone },
                { id: 'CARD' as GatewayMethod, label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
                { id: 'NET_BANKING' as GatewayMethod, label: 'Net Banking', sub: 'All major Indian banks', icon: Building2 },
                { id: 'WALLET' as GatewayMethod, label: 'Wallets & Credit', sub: 'Amazon Pay, Postpaid', icon: Wallet },
              ].map((item) => {
                const Icon = item.icon;
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMethod(item.id);
                      setErrorMsg('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-white border-amber-500 shadow-xs text-slate-900'
                        : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</div>
                    </div>
                  </button>
                );
              })}

              <div className="pt-3 px-2 border-t border-slate-200 mt-3 text-[10px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HMAC-SHA256 Verified</span>
                </div>
                <p>256-bit TLS encrypted payment verification.</p>
              </div>
            </div>

            {/* Method Form */}
            <form onSubmit={validateAndStartAuth} className="md:col-span-8 p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* UPI */}
              {method === 'UPI' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Pay via UPI</h4>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setUpiMode('vpa')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          upiMode === 'vpa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        UPI ID / VPA
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode('qr')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          upiMode === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Scan QR
                      </button>
                    </div>
                  </div>

                  {upiMode === 'vpa' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Enter UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          placeholder="username@okicici or 9820144521@ybl"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[`${phoneDigits}@ybl`, `${phoneDigits}@airtel`, `${phoneDigits}@apl`, 'sitebuilder@okaxis', 'contractor@okhdfcbank'].map(
                          (sample) => (
                            <button
                              key={sample}
                              type="button"
                              onClick={() => setUpiVpa(sample)}
                              className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer ${
                                upiVpa === sample
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {sample}
                            </button>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Supports Airtel Payments Bank (<span className="font-mono">@airtel</span> / <span className="font-mono">@apl</span>), PhonePe (<span className="font-mono">@ybl</span>), Google Pay, Paytm &amp; BHIM.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                      {/* Crisp vector BharatQR / UPI QR Matrix */}
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900" aria-label="UPI Payment QR">
                          <rect x="6" y="6" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="70" y="6" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="77" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="6" y="70" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="77" width="10" height="10" fill="currentColor" />
                          <rect x="38" y="8" width="6" height="6" fill="currentColor" />
                          <rect x="50" y="8" width="12" height="6" fill="currentColor" />
                          <rect x="38" y="20" width="12" height="6" fill="currentColor" />
                          <rect x="56" y="22" width="6" height="12" fill="currentColor" />
                          <rect x="8" y="38" width="10" height="6" fill="currentColor" />
                          <rect x="24" y="42" width="18" height="6" fill="currentColor" />
                          <rect x="46" y="38" width="10" height="16" fill="currentColor" />
                          <rect x="62" y="40" width="12" height="8" fill="currentColor" />
                          <rect x="80" y="38" width="12" height="12" fill="currentColor" />
                          <rect x="38" y="58" width="12" height="10" fill="currentColor" />
                          <rect x="56" y="56" width="16" height="6" fill="currentColor" />
                          <rect x="78" y="58" width="14" height="12" fill="currentColor" />
                          <rect x="42" y="76" width="14" height="12" fill="currentColor" />
                          <rect x="64" y="74" width="12" height="8" fill="currentColor" />
                          <rect x="82" y="76" width="10" height="16" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-900 text-xs">Scan with any UPI App</div>
                        <p className="text-[11px] text-slate-500">
                          Google Pay, PhonePe, Paytm, BHIM or corporate banking app.
                        </p>
                        <div className="text-[11px] font-mono text-slate-700">
                          Merchant VPA: buildniva@okicici
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PHONEPE EXPRESS */}
              {method === 'PHONEPE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#5f259f] text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                        Pe
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Pay with PhonePe</h4>
                        <div className="text-[11px] text-slate-500">Instant UPI app approval or PhonePe QR</div>
                      </div>
                    </div>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhonepeMode('vpa')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          phonepeMode === 'vpa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        PhonePe ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhonepeMode('qr')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          phonepeMode === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        PhonePe QR
                      </button>
                    </div>
                  </div>

                  {phonepeMode === 'vpa' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          PhonePe UPI ID / Linked Number
                        </label>
                        <input
                          type="text"
                          value={phonepeVpa}
                          onChange={(e) => setPhonepeVpa(e.target.value)}
                          placeholder="9820144521@ybl"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[`${phoneDigits}@ybl`, `${phoneDigits}@ibl`, `${phoneDigits}@axl`].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => setPhonepeVpa(handle)}
                            className={`px-2.5 py-1 rounded-md font-mono text-[11px] cursor-pointer ${
                              phonepeVpa === handle
                                ? 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {handle}
                          </button>
                        ))}
                      </div>

                      <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-[11px] text-purple-950">
                        We will send an instant collect request to your PhonePe app on <span className="font-mono font-semibold">{phonepeVpa || `${phoneDigits}@ybl`}</span>. Supports PhonePe Wallet, UPI Lite, and linked bank accounts.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-xl flex items-center gap-4">
                      <div className="p-2.5 bg-white border border-purple-200 rounded-xl shrink-0">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#5f259f]" aria-label="PhonePe Payment QR">
                          <rect x="6" y="6" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="70" y="6" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="77" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="6" y="70" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
                          <rect x="13" y="77" width="10" height="10" fill="currentColor" />
                          <rect x="38" y="8" width="6" height="6" fill="currentColor" />
                          <rect x="50" y="8" width="12" height="6" fill="currentColor" />
                          <rect x="38" y="20" width="12" height="6" fill="currentColor" />
                          <rect x="56" y="22" width="6" height="12" fill="currentColor" />
                          <rect x="8" y="38" width="10" height="6" fill="currentColor" />
                          <rect x="24" y="42" width="18" height="6" fill="currentColor" />
                          <rect x="46" y="38" width="10" height="16" fill="currentColor" />
                          <rect x="62" y="40" width="12" height="8" fill="currentColor" />
                          <rect x="80" y="38" width="12" height="12" fill="currentColor" />
                          <rect x="38" y="58" width="12" height="10" fill="currentColor" />
                          <rect x="56" y="56" width="16" height="6" fill="currentColor" />
                          <rect x="78" y="58" width="14" height="12" fill="currentColor" />
                          <rect x="42" y="76" width="14" height="12" fill="currentColor" />
                          <rect x="64" y="74" width="12" height="8" fill="currentColor" />
                          <rect x="82" y="76" width="10" height="16" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-900 text-xs">Scan with PhonePe App</div>
                        <p className="text-[11px] text-slate-600">
                          Open PhonePe on your mobile, tap Scan &amp; Pay, and confirm ₹{session.amountInr.toLocaleString('en-IN')}.
                        </p>
                        <div className="text-[11px] font-mono text-purple-900">
                          PhonePe Merchant VPA: buildniva@ybl
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD */}
              {method === 'CARD' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Card Details</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('6522 1045 7789 2210');
                          setCardExpiry('11/29');
                          setCardCvv('512');
                          if (!cardHolder) setCardHolder(customerName || 'Vikram Malhotra');
                        }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Airtel RuPay Debit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('4242 4242 4242 4242');
                          setCardExpiry('12/29');
                          setCardCvv('424');
                          if (!cardHolder) setCardHolder(customerName || 'Vikram Malhotra');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Test Visa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('6521 5012 8890 1122');
                          setCardExpiry('08/28');
                          setCardCvv('889');
                          if (!cardHolder) setCardHolder(customerName || 'Vikram Malhotra');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Test RuPay
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Card Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="12/29"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name printed on card"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* NET BANKING */}
              {method === 'NET_BANKING' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Select Bank</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {POPULAR_BANKS.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedBank === bank.name
                            ? 'border-amber-500 bg-amber-50/70 text-slate-900 font-bold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{bank.short}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{bank.name}</div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Other Participating Banks</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                      <option value="IndusInd Bank">IndusInd Bank</option>
                      <option value="Bank of Baroda Corporate">Bank of Baroda Corporate</option>
                      <option value="Canara Bank">Canara Bank</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                      <option value="Yes Bank Corporate">Yes Bank Corporate</option>
                    </select>
                  </div>
                </div>
              )}

              {/* WALLETS */}
              {method === 'WALLET' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Wallets & Trade Credit</h4>
                  <div className="space-y-2">
                    {WALLET_PROVIDERS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          selectedWallet === w.id
                            ? 'border-amber-500 bg-amber-50/70'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{w.id}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{w.desc}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedWallet === w.id ? 'border-amber-600' : 'border-slate-300'
                          }`}
                        >
                          {selectedWallet === w.id && <div className="w-2 h-2 rounded-full bg-amber-600" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onCancelPending}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium whitespace-nowrap cursor-pointer"
                >
                  Pay Later
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Proceed to Pay ₹{session.amountInr.toLocaleString('en-IN')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stage: Bank / 3DS / UPI Collect Authorization */}
        {stage === 'bank_auth' && (
          <div className="p-6 space-y-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setStage('method');
                setErrorMsg('');
              }}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change payment method</span>
            </button>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Selected Instrument</span>
                <span className="font-bold text-slate-900">{getMethodDetails()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Gateway Session</span>
                <span className="font-mono text-slate-700">{session.gatewayOrderId}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">Authorizing Debit</span>
                <span className="text-base font-extrabold text-amber-700 tabular-nums">
                  ₹{session.amountInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {method === 'CARD' ? (
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  3D Secure Bank OTP Verification
                </label>
                <p className="text-[11px] text-slate-500">
                  Enter the one-time password sent to {customerPhone || '+91 98•••••521'}. Sandbox test OTP: <span className="font-mono font-bold text-slate-800">123456</span>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-44 bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-base font-mono font-bold tracking-widest text-slate-900"
                />
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">
                  {method === 'PHONEPE'
                    ? phonepeMode === 'qr'
                      ? 'Confirm PhonePe QR Scan Payment'
                      : `PhonePe Collect Request Sent to ${phonepeVpa}`
                    : method === 'UPI'
                    ? upiMode === 'qr'
                      ? 'Confirm QR Scan Payment'
                      : `UPI Collect Request Sent to ${upiVpa}`
                    : method === 'NET_BANKING'
                    ? `${selectedBank} Portal Ready`
                    : `${selectedWallet} Wallet Authorization Ready`}
                </div>
                <p className="text-[11px] text-amber-800">
                  Click &ldquo;Authorize &amp; Complete Payment&rdquo; to issue the HMAC-SHA256 signed confirmation from the acquiring bank, or simulate a decline to test failure recovery.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => executeAuthorization('failed', 'Bank risk check declined transaction')}
                className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-semibold whitespace-nowrap cursor-pointer"
              >
                Simulate Decline
              </button>

              <button
                type="button"
                onClick={() => executeAuthorization('success')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize &amp; Complete Payment</span>
              </button>
            </div>
          </div>
        )}

        {/* Stage: Verifying HMAC */}
        {stage === 'verifying' && (
          <div className="p-10 text-center space-y-3">
            <Loader2 className="w-9 h-9 text-amber-600 animate-spin mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Verifying Payment Signature...</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Validating HMAC-SHA256 gateway signature, reconciling double-entry ledger, and confirming supplier dispatch.
            </p>
          </div>
        )}

        {/* Stage: Success */}
        {stage === 'success' && (
          <div className="p-6 space-y-5 text-xs">
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-emerald-900">
                  Payment Verified &amp; Order Confirmed
                </h4>
                <p className="text-emerald-800">
                  Your payment of <span className="font-bold tabular-nums">₹{session.amountInr.toLocaleString('en-IN')}</span> has been cryptographically verified and reconciled.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Payment ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {verifiedPayments[0]?.gatewayTransactionId || verifiedOrders[0]?.paymentReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Order ID</span>
                <span className="font-mono text-slate-700">{session.gatewayOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-semibold text-slate-900">
                  {verifiedPayments[0]?.methodDetails || getMethodDetails()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Signature Status</span>
                <span className="font-bold text-emerald-700">HMAC-SHA256 Verified</span>
              </div>
              {verifiedOrders[0]?.deliveryOtp && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">Site Delivery OTP</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm tabular-nums">
                    {verifiedOrders[0].deliveryOtp}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onVerified(verifiedOrders, verifiedPayments)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer"
              >
                View Live Order &amp; Invoice
              </button>
            </div>
          </div>
        )}

        {/* Stage: Failed */}
        {stage === 'failed' && (
          <div className="p-6 space-y-5 text-xs">
            <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-red-900">Payment Not Completed</h4>
                <p className="text-red-800">{errorMsg || 'The payment gateway did not authorize this transaction.'}</p>
              </div>
            </div>

            <p className="text-slate-500">
              Your reserved material inventory is still held. You can retry with another payment method or cancel the order to release stock.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={processingCancel}
                onClick={handleAbandonAndCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold whitespace-nowrap cursor-pointer"
              >
                {processingCancel ? 'Cancelling Order...' : 'Cancel Order & Release Stock'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStage('method');
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Payment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
