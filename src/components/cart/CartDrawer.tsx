import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { CheckoutModal } from './CheckoutModal.js';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, updateCartQuantity, removeFromCart, clearCart } = useApp();
  const [calculation, setCalculation] = useState<any>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }

    const runCalculation = async () => {
      setLoadingCalc(true);
      try {
        const payload = cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
        const data = await api.calculateCart(payload);
        setCalculation(data);
      } catch (err) {
        console.error('Cart calculation error:', err);
      } finally {
        setLoadingCalc(false);
      }
    };

    runCalculation();
  }, [cart]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Job Site Material Cart</h2>
              <span className="text-xs text-slate-500 font-medium">({cart.length} line items)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Your site cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add cement, TMT steel, sand, or aggregates from the marketplace catalog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => {
                  const thumb = item.product.images?.[0] || item.product.imageUrl;
                  return (
                  <div key={item.productId} className="py-3 flex gap-3 items-start justify-between">
                    {thumb && (
                      <img
                        src={thumb}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-amber-700 uppercase">
                        {item.product.brand}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{item.product.pricePerUnit} / {item.product.unit} · Min: {item.product.minOrderQty}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500">{item.product.unit}s</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end h-full">
                      <div className="text-xs font-bold text-slate-900 tabular-nums">
                        ₹{(item.product.pricePerUnit * item.quantity).toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors mt-2"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer & Server Total Calculation */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              {loadingCalc ? (
                <div className="text-xs text-slate-400 text-center py-2">
                  Calculating GST & site delivery charges...
                </div>
              ) : calculation ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Materials Subtotal</span>
                    <span className="font-semibold tabular-nums">₹{calculation.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable GST (IS Tax)</span>
                    <span className="font-semibold tabular-nums">₹{calculation.totalGst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dedicated Site Delivery & Offloading</span>
                    </span>
                    <span className="font-semibold tabular-nums">₹{calculation.totalDelivery.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-amber-700 tabular-nums">
                      ₹{calculation.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Site Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Vendor Direct Yard Allocation & 4-Digit OTP Protection</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {checkoutOpen && calculation && (
        <CheckoutModal
          calculation={calculation}
          onClose={() => setCheckoutOpen(false)}
          onOrderComplete={() => {
            setCheckoutOpen(false);
            setIsCartOpen(false);
            clearCart();
          }}
        />
      )}
    </div>
  );
};
