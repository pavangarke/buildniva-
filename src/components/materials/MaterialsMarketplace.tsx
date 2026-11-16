import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Eye,
  Truck,
  Building,
  X,
  AlertCircle,
  Bell,
  BellRing,
  TrendingDown,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { MaterialProduct, MaterialCategory, PriceAlert } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const MaterialsMarketplace: React.FC = () => {
  const { currentUser, addToCart, setIsCartOpen, showToast, setAuthModalOpen } = useApp();
  const [materials, setMaterials] = useState<MaterialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [detailProduct, setDetailProduct] = useState<MaterialProduct | null>(null);
  const [detailActiveImgIdx, setDetailActiveImgIdx] = useState<number>(0);
  const [failedImageMap, setFailedImageMap] = useState<Record<string, boolean>>({});
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertModalProduct, setAlertModalProduct] = useState<MaterialProduct | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [alertsFilter, setAlertsFilter] = useState<'all' | 'triggered' | 'active'>('all');
  const [refreshingAlerts, setRefreshingAlerts] = useState(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const effectiveUserId = currentUser?.id;

  const categories: (MaterialCategory | 'All')[] = [
    'All',
    'Cement',
    'TMT Steel',
    'Bricks & Blocks',
    'Sand & Aggregates',
    'Waterproofing',
    'Paints & Coatings',
  ];

  const loadPriceAlerts = async (notifyNewlyTriggered = false) => {
    if (!effectiveUserId) {
      setPriceAlerts([]);
      return;
    }
    try {
      const res = await api.getPriceAlerts(effectiveUserId);
      const alerts = res.alerts || [];
      setPriceAlerts(alerts);

      if (notifyNewlyTriggered) {
        alerts.forEach((al) => {
          if (al.status === 'triggered' && !al.acknowledged && !notifiedIdsRef.current.has(al.id)) {
            notifiedIdsRef.current.add(al.id);
            showToast(
              'Price Drop Alert!',
              `${al.materialName} dropped to ₹${(al.triggeredPrice ?? al.targetPrice).toLocaleString('en-IN')}/${al.unit} (below your ₹${al.targetPrice.toLocaleString('en-IN')} threshold).`,
              'success'
            );
          }
        });
      } else {
        alerts.forEach((al) => {
          if (al.status === 'triggered') {
            notifiedIdsRef.current.add(al.id);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load price alerts:', err);
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterials({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        brand: selectedBrand === 'All' ? undefined : selectedBrand,
      });
      setMaterials(data.materials);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadPriceAlerts(true);
  }, [selectedCategory, selectedBrand, effectiveUserId]);

  useEffect(() => {
    if (!effectiveUserId) return;
    const interval = setInterval(() => {
      loadPriceAlerts(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [effectiveUserId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMaterials();
  };

  const openDetail = (prod: MaterialProduct) => {
    setDetailProduct(prod);
    setDetailActiveImgIdx(0);
    setSelectedQty(prod.minOrderQty);
  };

  const openAlertModal = (prod: MaterialProduct) => {
    if (!effectiveUserId) {
      showToast('Sign In Required', 'Please sign in to set custom price drop alerts.', 'info');
      setAuthModalOpen(true);
      return;
    }
    const existing = priceAlerts.find((a) => a.materialId === prod.id);
    const defaultTarget = existing
      ? existing.targetPrice
      : Math.max(1, Math.round(prod.pricePerUnit * 0.95));
    setTargetPriceInput(String(defaultTarget));
    setAlertModalProduct(prod);
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertModalProduct || !effectiveUserId) return;
    const numericTarget = Number(targetPriceInput);
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      showToast('Invalid Threshold', 'Please enter a valid target price greater than ₹0.', 'error');
      return;
    }

    setSavingAlert(true);
    try {
      const res = await api.createPriceAlert({
        userId: effectiveUserId,
        materialId: alertModalProduct.id,
        targetPrice: numericTarget,
      });
      if (res.triggeredImmediately) {
        notifiedIdsRef.current.add(res.alert.id);
      } else {
        notifiedIdsRef.current.delete(res.alert.id);
      }
      showToast(
        res.triggeredImmediately ? 'Price Target Met!' : 'Price Alert Active',
        res.message,
        'success'
      );
      setAlertModalProduct(null);
      await loadPriceAlerts(false);
    } catch (err: any) {
      showToast('Alert Error', err.message || 'Failed to save price alert.', 'error');
    } finally {
      setSavingAlert(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await api.deletePriceAlert(alertId);
      setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId));
      notifiedIdsRef.current.delete(alertId);
      showToast('Alert Removed', 'Price drop monitoring stopped for this material.', 'info');
      if (alertModalProduct) {
        setAlertModalProduct(null);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Could not remove alert.', 'error');
    }
  };

  const handleTogglePauseAlert = async (alert: PriceAlert) => {
    const nextStatus = alert.status === 'paused' ? 'active' : 'paused';
    try {
      const res = await api.updatePriceAlert(alert.id, { status: nextStatus });
      setPriceAlerts((prev) => prev.map((a) => (a.id === alert.id ? res.alert : a)));
      showToast(
        nextStatus === 'paused' ? 'Alert Paused' : 'Alert Resumed',
        `${alert.materialName} monitoring ${nextStatus}.`,
        'info'
      );
      if (res.alert.status === 'triggered') {
        loadPriceAlerts(true);
      }
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await api.updatePriceAlert(alertId, { acknowledged: true });
      setPriceAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
    } catch (err) {
      console.error('Failed to dismiss alert banner:', err);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshingAlerts(true);
    await Promise.all([loadMaterials(), loadPriceAlerts(true)]);
    setRefreshingAlerts(false);
    showToast('Prices Checked', 'Catalog rates synced against your price thresholds.', 'info');
  };

  const getEffectivePrice = (prod: MaterialProduct, qty: number) => {
    let price = prod.pricePerUnit;
    if (prod.bulkTiers && prod.bulkTiers.length > 0) {
      const sorted = [...prod.bulkTiers].sort((a, b) => b.minQty - a.minQty);
      for (const t of sorted) {
        if (qty >= t.minQty) {
          price = t.pricePerUnit;
          break;
        }
      }
    }
    return price;
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-8">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Certified Construction Materials
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Direct Yard & Mill Material Store
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Source cement, TMT steel rebars, sand, aggregates, and AAC blocks directly from authorized wholesale stockists.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by brand, product, grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </form>

            {/* Brand Filter & Price Alerts Button */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">Filter Brand:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="All">All Trusted Brands</option>
                  <option value="UltraTech Cement">UltraTech Cement</option>
                  <option value="Tata Tiscon">Tata Tiscon</option>
                  <option value="Birla Aerocon">Birla Aerocon</option>
                  <option value="Dr. Fixit (Pidilite)">Dr. Fixit</option>
                  <option value="Asian Paints">Asian Paints</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!effectiveUserId) {
                    showToast('Sign In Required', 'Sign in to view and manage your price drop alerts.', 'info');
                    setAuthModalOpen(true);
                    return;
                  }
                  setAlertsDrawerOpen(true);
                }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  priceAlerts.some((a) => a.status === 'triggered' && !a.acknowledged)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {priceAlerts.some((a) => a.status === 'triggered' && !a.acknowledged) ? (
                  <BellRing className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="tabular-nums">
                  Price Alerts ({priceAlerts.length})
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Triggered Price Drop Alerts Notification Banner */}
        {priceAlerts.filter((a) => a.status === 'triggered' && !a.acknowledged).length > 0 && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <TrendingDown className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Price Drop Detected ({priceAlerts.filter((a) => a.status === 'triggered' && !a.acknowledged).length} material
                  {priceAlerts.filter((a) => a.status === 'triggered' && !a.acknowledged).length > 1 ? 's' : ''} below your target)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAlertsDrawerOpen(true)}
                className="text-xs font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
              >
                Manage All Alerts
              </button>
            </div>

            <div className="divide-y divide-emerald-200/70">
              {priceAlerts
                .filter((a) => a.status === 'triggered' && !a.acknowledged)
                .map((al) => {
                  const matchedMat = materials.find((m) => m.id === al.materialId);
                  const livePrice = matchedMat?.pricePerUnit ?? al.triggeredPrice ?? al.targetPrice;
                  const savedPerUnit = Math.max(0, al.currentPriceAtCreation - livePrice);
                  return (
                    <div
                      key={al.id}
                      className="py-2.5 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{al.materialName}</div>
                        <div className="text-emerald-800 mt-0.5 flex flex-wrap items-center gap-2 tabular-nums">
                          <span>Now ₹{livePrice.toLocaleString('en-IN')}/{al.unit}</span>
                          <span aria-hidden="true">·</span>
                          <span>Target was ₹{al.targetPrice.toLocaleString('en-IN')}</span>
                          {savedPerUnit > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold">Save ₹{savedPerUnit.toLocaleString('en-IN')}/{al.unit}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {matchedMat && (
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(matchedMat, matchedMat.minOrderQty);
                              setIsCartOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                          >
                            Add {matchedMat.minOrderQty} to Cart
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeAlert(al.id)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Fetching certified construction catalog...
          </div>
        ) : materials.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">No matching materials found</div>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or selecting 'All' categories.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedBrand('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Header */}
                {(() => {
                  const primaryImg = (prod.images && prod.images.length > 0 ? prod.images[0] : prod.imageUrl) || '';
                  const photoCount = prod.images && prod.images.length > 0 ? prod.images.length : prod.imageUrl ? 1 : 0;
                  const showPhoto = Boolean(primaryImg && !failedImageMap[primaryImg]);

                  if (showPhoto) {
                    return (
                      <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={primaryImg}
                          alt={prod.name}
                          onError={() => setFailedImageMap((prev) => ({ ...prev, [primaryImg]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-slate-900/35 pointer-events-none" />

                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-900 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs truncate max-w-[55%]">
                            {prod.brand}
                          </span>
                          <span className="font-medium text-white bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md tabular-nums shrink-0">
                            Stock: {prod.availableStock.toLocaleString()} {prod.unit}s
                          </span>
                        </div>

                        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between gap-2 text-[11px] text-white">
                          <span className="flex items-center gap-1 font-medium drop-shadow-xs">
                            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{prod.deliveryEstimateDays} Day Delivery</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {photoCount > 1 && (
                              <span className="bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums">
                                {photoCount} photos
                              </span>
                            )}
                            <span className="bg-emerald-600/90 px-2 py-0.5 rounded text-[10px] font-semibold">
                              GST {prod.gstRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="relative h-44 bg-gradient-to-br from-stone-100 to-stone-200 p-4 flex flex-col justify-between border-b border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{prod.brand}</span>
                        <span className="text-[11px] text-slate-500">Stock: {prod.availableStock.toLocaleString()} {prod.unit}s</span>
                      </div>

                      {/* Stylized Category Badge / Icon */}
                      <div className="flex flex-col items-center justify-center my-auto">
                        <div className="w-12 h-12 rounded-xl bg-white/90 shadow-sm border border-slate-200 flex items-center justify-center text-amber-700 font-extrabold text-xs uppercase tracking-wider">
                          {prod.category.split(' ')[0]}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 font-medium">{prod.category}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span>{prod.deliveryEstimateDays} Day Delivery</span>
                        </span>
                        <span className="text-emerald-700 font-medium">GST {prod.gstRate}% included</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                      {prod.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    {/* Unboxed Metadata */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Vendor: {prod.vendorName}</span>
                      <span>·</span>
                      <span>Min Order: {prod.minOrderQty} {prod.unit}s</span>
                    </div>

                    {/* Bulk Tiers if available */}
                    {prod.bulkTiers && prod.bulkTiers.length > 0 && (
                      <div className="mt-2 text-[11px] bg-amber-50/70 p-2 rounded-md border border-amber-200/50">
                        <span className="font-semibold text-amber-900">Bulk Discount: </span>
                        {prod.bulkTiers.map((t, idx) => (
                          <span key={idx} className="text-amber-800 tabular-nums">
                            {t.minQty}+ {prod.unit}: ₹{t.pricePerUnit.toLocaleString('en-IN')}{idx < prod.bulkTiers!.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Buy Action Row */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {(() => {
                      const prodAlert = priceAlerts.find((a) => a.materialId === prod.id);
                      if (!prodAlert) return null;
                      if (prodAlert.status === 'triggered') {
                        return (
                          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                            <span className="flex items-center gap-1">
                              <TrendingDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="tabular-nums">Target met: ≤ ₹{prodAlert.targetPrice.toLocaleString('en-IN')}/{prod.unit}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => openAlertModal(prod)}
                              className="text-emerald-700 hover:underline font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="tabular-nums">
                              {prodAlert.status === 'paused' ? 'Alert paused' : 'Alert set'}: ≤ ₹{prodAlert.targetPrice.toLocaleString('en-IN')}/{prod.unit}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openAlertModal(prod)}
                            className="text-amber-700 hover:underline font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-slate-400">Wholesale Rate</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                            ₹{prod.pricePerUnit.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500">/{prod.unit}</span>
                        </div>
                        {prod.mrp && prod.mrp > prod.pricePerUnit && (
                          <div className="text-[11px] text-slate-400 line-through tabular-nums">
                            MRP: ₹{prod.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(() => {
                          const prodAlert = priceAlerts.find((a) => a.materialId === prod.id);
                          const isTriggered = prodAlert?.status === 'triggered';
                          const isActive = prodAlert?.status === 'active';
                          return (
                            <button
                              type="button"
                              onClick={() => openAlertModal(prod)}
                              className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                                isTriggered
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : isActive
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                              }`}
                              title={prodAlert ? `Price alert: ≤ ₹${prodAlert.targetPrice}` : 'Set custom price alert'}
                            >
                              {isTriggered ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </button>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => openDetail(prod)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          title="View Technical Specs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => addToCart(prod, prod.minOrderQty)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add {prod.minOrderQty} {prod.unit}{prod.minOrderQty > 1 ? 's' : ''}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        {detailProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    {detailProduct.brand} · {detailProduct.category}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {detailProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailProduct(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const detailImages = (
                  detailProduct.images && detailProduct.images.length > 0
                    ? detailProduct.images
                    : detailProduct.imageUrl
                    ? [detailProduct.imageUrl]
                    : []
                ).filter((u) => Boolean(u) && !failedImageMap[u]);

                if (detailImages.length === 0) return null;
                const activeUrl = detailImages[detailActiveImgIdx] || detailImages[0];

                return (
                  <div className="space-y-2.5">
                    <div className="h-64 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={activeUrl}
                        alt={detailProduct.name}
                        onError={() => setFailedImageMap((prev) => ({ ...prev, [activeUrl]: true }))}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {detailImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {detailImages.map((imgUrl, idx) => (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() => setDetailActiveImgIdx(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                              idx === (detailActiveImgIdx < detailImages.length ? detailActiveImgIdx : 0)
                                ? 'border-amber-500 ring-2 ring-amber-200'
                                : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${detailProduct.name} angle ${idx + 1}`}
                              onError={() => setFailedImageMap((prev) => ({ ...prev, [imgUrl]: true }))}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <p className="text-xs text-slate-600 leading-relaxed">
                {detailProduct.description}
              </p>

              {/* Technical Specifications */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Technical Specifications & Lab Standards
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {Object.entries(detailProduct.specifications).map(([key, val]) => (
                    <div key={key} className="p-2.5 flex justify-between">
                      <span className="font-medium text-slate-600">{key}</span>
                      <span className="text-slate-900 font-semibold text-right">{val}</span>
                    </div>
                  ))}
                  <div className="p-2.5 flex justify-between">
                    <span className="font-medium text-slate-600">Applicable GST Rate</span>
                    <span className="text-slate-900 font-semibold">{detailProduct.gstRate}%</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="font-medium text-slate-600">Return Policy</span>
                    <span className="text-slate-900 font-semibold">
                      {detailProduct.returnEligible ? 'Eligible for site replacement within 48h' : 'Non-returnable bulk building raw material'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor & Delivery Details */}
              <div className="p-3 bg-stone-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  <span>Supplied by: {detailProduct.vendorName} ({detailProduct.vendorCity})</span>
                </div>
                <div className="text-slate-500">
                  Serviceable PIN codes: {detailProduct.serviceablePincodes.join(', ')}
                </div>
                <div className="text-slate-500">
                  Site Unloading Charge: ₹{detailProduct.deliveryChargePerUnit}/{detailProduct.unit}
                </div>
              </div>

              {/* Purchase Calculation Form */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Select Order Quantity:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={detailProduct.minOrderQty}
                      max={detailProduct.availableStock}
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(detailProduct.minOrderQty, Number(e.target.value)))}
                      className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center"
                    />
                    <span className="text-xs text-slate-600 font-medium">{detailProduct.unit}s</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Price (excl. delivery)</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums">
                    ₹{(getEffectivePrice(detailProduct, selectedQty) * selectedQty).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    @ ₹{getEffectivePrice(detailProduct, selectedQty)}/{detailProduct.unit}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailProduct;
                      setDetailProduct(null);
                      openAlertModal(target);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {priceAlerts.some((a) => a.materialId === detailProduct.id) ? 'Edit Price Alert' : 'Set Price Alert'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      addToCart(detailProduct, selectedQty);
                      setDetailProduct(null);
                      setIsCartOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart & Checkout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set / Edit Price Alert Modal */}
        {alertModalProduct && (() => {
          const existingAlert = priceAlerts.find((a) => a.materialId === alertModalProduct.id);
          const numericTarget = Number(targetPriceInput) || 0;
          const currentPrice = alertModalProduct.pricePerUnit;
          const diff = currentPrice - numericTarget;
          const pctDrop = currentPrice > 0 ? Math.round((diff / currentPrice) * 100) : 0;

          return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                      Custom Price Drop Alert
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-2">
                      {alertModalProduct.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{alertModalProduct.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-semibold text-slate-700">
                        Current Rate: ₹{currentPrice.toLocaleString('en-IN')}/{alertModalProduct.unit}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertModalProduct(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAlert} className="space-y-4 text-xs">
                  {/* Quick Percentage Presets */}
                  <div>
                    <span className="block font-semibold text-slate-700 mb-2">
                      Quick Target Presets
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 15].map((pct) => {
                        const presetVal = Math.max(1, Math.round(currentPrice * (1 - pct / 100)));
                        const isSelected = Number(targetPriceInput) === presetVal;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTargetPriceInput(String(presetVal))}
                            className={`py-2 px-3 rounded-lg border font-semibold transition-colors tabular-nums cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 border-amber-400 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            -{pct}% (₹{presetVal.toLocaleString('en-IN')})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Target Threshold Input */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Notify me when price drops to or below (₹ / {alertModalProduct.unit})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min={1}
                        step="1"
                        value={targetPriceInput}
                        onChange={(e) => setTargetPriceInput(e.target.value)}
                        className="w-full pl-7 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400">
                        /{alertModalProduct.unit}
                      </span>
                    </div>

                    {numericTarget > 0 && (
                      <div className="mt-2">
                        {numericTarget >= currentPrice ? (
                          <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Current wholesale rate already meets this threshold — alert will trigger immediately.</span>
                          </div>
                        ) : (
                          <div className="text-slate-600 tabular-nums">
                            Triggers when rate falls by <span className="font-bold text-slate-900">₹{diff.toLocaleString('en-IN')}/{alertModalProduct.unit}</span> ({pctDrop}% savings).
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    {existingAlert ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(existingAlert.id)}
                        className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAlertModalProduct(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAlert}
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        {savingAlert ? 'Saving...' : existingAlert ? 'Update Alert' : 'Set Price Alert'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Manage Price Alerts Drawer / Modal */}
        {alertsDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Material Price Watchlist
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Your Custom Price Alerts ({priceAlerts.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefreshPrices}
                    disabled={refreshingAlerts}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingAlerts ? 'animate-spin' : ''}`} />
                    <span>Check Latest Prices</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertsDrawerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-5 py-3 bg-stone-50 border-b border-slate-100 flex items-center gap-1">
                {[
                  { id: 'all', label: `All (${priceAlerts.length})` },
                  { id: 'triggered', label: `Target Met (${priceAlerts.filter((a) => a.status === 'triggered').length})` },
                  { id: 'active', label: `Monitoring (${priceAlerts.filter((a) => a.status === 'active').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAlertsFilter(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      alertsFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                {priceAlerts.filter((a) => alertsFilter === 'all' || a.status === alertsFilter).length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-xs">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-800">No price alerts in this view</div>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Click the bell button on any construction material card to monitor price drops below your budget threshold.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {priceAlerts
                      .filter((a) => alertsFilter === 'all' || a.status === alertsFilter)
                      .map((al) => {
                        const matchedMat = materials.find((m) => m.id === al.materialId);
                        const livePrice = matchedMat?.pricePerUnit ?? al.triggeredPrice ?? al.currentPriceAtCreation;
                        const isTriggered = al.status === 'triggered';
                        const isPaused = al.status === 'paused';

                        return (
                          <div key={al.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="font-bold text-slate-900 text-sm truncate">{al.materialName}</div>
                              <div className="text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                                <span>{al.brand}</span>
                                <span aria-hidden="true">·</span>
                                <span>Current: ₹{livePrice.toLocaleString('en-IN')}/{al.unit}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-slate-800">
                                  Threshold: ≤ ₹{al.targetPrice.toLocaleString('en-IN')}/{al.unit}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-semibold">
                                {isTriggered ? (
                                  <span className="text-emerald-700 flex items-center gap-1">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    <span>Price target met! Ready to procure</span>
                                  </span>
                                ) : isPaused ? (
                                  <span className="text-slate-500">Paused</span>
                                ) : (
                                  <span className="text-amber-700">
                                    Monitoring · Needs ₹{Math.max(0, livePrice - al.targetPrice).toLocaleString('en-IN')} drop
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {matchedMat && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToCart(matchedMat, matchedMat.minOrderQty);
                                    setAlertsDrawerOpen(false);
                                    setIsCartOpen(true);
                                  }}
                                  className={`px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                                    isTriggered
                                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                      : 'bg-slate-900 hover:bg-amber-600 text-white'
                                  }`}
                                >
                                  Buy Now
                                </button>
                              )}

                              {matchedMat && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAlertsDrawerOpen(false);
                                    openAlertModal(matchedMat);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}

                              {!isTriggered && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePauseAlert(al)}
                                  title={isPaused ? 'Resume alert' : 'Pause alert'}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteAlert(al.id)}
                                title="Delete alert"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
