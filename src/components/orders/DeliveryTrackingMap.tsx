import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  Phone,
  RefreshCw,
  CheckCircle2,
  Package,
  ArrowRight,
  Warehouse,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.js';

interface DeliveryTrackingMapProps {
  orders: Order[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenFullTracking?: (order: Order) => void;
}

interface StatusTelemetry {
  progress: number;
  headline: string;
  sublabel: string;
  etaText: string;
  distanceKm: number;
  speedKmh: number;
  checkpointLabel: string;
}

const ROUTE_POINTS: { x: number; y: number }[] = [
  { x: 64, y: 214 },
  { x: 145, y: 184 },
  { x: 235, y: 120 },
  { x: 350, y: 138 },
  { x: 458, y: 84 },
  { x: 546, y: 66 },
];

function getPointOnRoute(progressPercent: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(100, progressPercent)) / 100;
  const segments = ROUTE_POINTS.length - 1;
  const scaled = clamped * segments;
  const idx = Math.min(segments - 1, Math.floor(scaled));
  const localT = scaled - idx;
  const p0 = ROUTE_POINTS[idx];
  const p1 = ROUTE_POINTS[idx + 1];
  return {
    x: Math.round((p0.x + (p1.x - p0.x) * localT) * 10) / 10,
    y: Math.round((p0.y + (p1.y - p0.y) * localT) * 10) / 10,
  };
}

function getPolylinePointsUpTo(progressPercent: number): string {
  const clamped = Math.max(0, Math.min(100, progressPercent)) / 100;
  const segments = ROUTE_POINTS.length - 1;
  const scaled = clamped * segments;
  const idx = Math.min(segments - 1, Math.floor(scaled));
  const pts = ROUTE_POINTS.slice(0, idx + 1).map((p) => `${p.x},${p.y}`);
  const endPt = getPointOnRoute(progressPercent);
  pts.push(`${endPt.x},${endPt.y}`);
  return pts.join(' ');
}

function getStatusTelemetry(status: OrderStatus): StatusTelemetry {
  switch (status) {
    case 'pending_confirmation':
      return {
        progress: 6,
        headline: 'Awaiting Gateway Authorization',
        sublabel: 'Stock reserved at supplier yard pending payment clearance',
        etaText: 'Scheduled post-payment',
        distanceKm: 18.6,
        speedKmh: 0,
        checkpointLabel: 'Yard Inventory Bay',
      };
    case 'confirmed':
      return {
        progress: 18,
        headline: 'Order Confirmed at Yard',
        sublabel: 'GST invoice issued · Tipper slot queued for loading',
        etaText: 'Approx. 2 hrs 15 mins',
        distanceKm: 18.6,
        speedKmh: 0,
        checkpointLabel: 'Supplier Gate 01',
      };
    case 'processing':
      return {
        progress: 34,
        headline: 'Yard Loading & Weighbridge QC',
        sublabel: 'Materials weighed, tarpaulin-sealed & verified',
        etaText: 'Approx. 1 hr 40 mins',
        distanceKm: 16.4,
        speedKmh: 8,
        checkpointLabel: 'Digital Weighbridge',
      };
    case 'ready_for_pickup':
      return {
        progress: 48,
        headline: 'Ready at Dispatch Bay',
        sublabel: 'Tipper loaded · Driver completing e-Way bill scan',
        etaText: 'Approx. 1 hr 15 mins',
        distanceKm: 14.2,
        speedKmh: 12,
        checkpointLabel: 'E-Way Checkpoint',
      };
    case 'dispatched':
      return {
        progress: 68,
        headline: 'In Transit on Ring Corridor',
        sublabel: 'Heavy tipper en route to destination hub',
        etaText: 'Approx. 42 mins',
        distanceKm: 7.4,
        speedKmh: 38,
        checkpointLabel: 'Outer Ring Corridor',
      };
    case 'out_for_delivery':
      return {
        progress: 88,
        headline: 'Approaching Construction Site',
        sublabel: 'Driver within 2.5 km · Keep 4-digit Site OTP ready',
        etaText: 'Approx. 12 mins',
        distanceKm: 2.1,
        speedKmh: 24,
        checkpointLabel: 'Last-Mile Site Approach',
      };
    case 'delivered':
      return {
        progress: 100,
        headline: 'Delivered & OTP Signed Off',
        sublabel: 'Materials unloaded & verified at job site',
        etaText: 'Completed',
        distanceKm: 0,
        speedKmh: 0,
        checkpointLabel: 'Job Site Unloading Bay',
      };
    case 'cancelled':
    default:
      return {
        progress: 0,
        headline: 'Consignment Cancelled',
        sublabel: 'Dispatch halted and reserved materials released',
        etaText: 'Cancelled',
        distanceKm: 0,
        speedKmh: 0,
        checkpointLabel: 'Order Halted',
      };
  }
}

const TRACK_STAGES: { key: OrderStatus; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Yard Loading' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'out_for_delivery', label: 'Near Site' },
  { key: 'delivered', label: 'Delivered' },
];

function getStageRank(status: OrderStatus): number {
  switch (status) {
    case 'confirmed':
      return 0;
    case 'processing':
    case 'ready_for_pickup':
      return 1;
    case 'dispatched':
      return 2;
    case 'out_for_delivery':
      return 3;
    case 'delivered':
      return 4;
    default:
      return -1;
  }
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  orders,
  onRefresh,
  refreshing = false,
  onOpenFullTracking,
}) => {
  // Prioritize active in-transit orders first, then most recent
  const sortedOrders = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
    const rest = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
    return [...active, ...rest];
  }, [orders]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => sortedOrders[0]?.id || '');
  const [livePhaseOffset, setLivePhaseOffset] = useState(0);

  useEffect(() => {
    if (!sortedOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(sortedOrders[0]?.id || '');
    }
  }, [sortedOrders, selectedOrderId]);

  const selectedOrder = sortedOrders.find((o) => o.id === selectedOrderId) || sortedOrders[0];

  // Subtle live GPS coordinate telemetry micro-tick for active moving vehicles
  useEffect(() => {
    if (!selectedOrder) return;
    const moving = selectedOrder.status === 'dispatched' || selectedOrder.status === 'out_for_delivery';
    if (!moving) {
      setLivePhaseOffset(0);
      return;
    }
    const timer = setInterval(() => {
      setLivePhaseOffset((prev) => (prev >= 2.4 ? 0 : Number((prev + 0.8).toFixed(1))));
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedOrder?.id, selectedOrder?.status]);

  if (!selectedOrder) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <div className="font-bold text-slate-800 text-sm">No Active Material Deliveries</div>
        <p className="mt-1">Place a material order to view real-time tipper dispatch telemetry and route progress.</p>
      </div>
    );
  }

  const telemetry = getStatusTelemetry(selectedOrder.status);
  const animatedProgress = Math.min(
    100,
    telemetry.progress + (selectedOrder.status === 'dispatched' || selectedOrder.status === 'out_for_delivery' ? livePhaseOffset : 0)
  );
  const vehicleCoord = getPointOnRoute(animatedProgress);
  const completedPolyline = getPolylinePointsUpTo(animatedProgress);
  const fullPolyline = ROUTE_POINTS.map((p) => `${p.x},${p.y}`).join(' ');
  const stageRank = getStageRank(selectedOrder.status);
  const lastUpdated = new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const driverName = selectedOrder.deliveryAgent?.name || 'Ganesh Shinde';
  const driverPhone = selectedOrder.deliveryAgent?.phone || '+91 97654 32100';
  const vehicleNumber = selectedOrder.deliveryAgent?.vehicleNumber || 'KA 01 AH 5429';
  const vehicleType = selectedOrder.deliveryAgent?.vehicleType || '16-Ton Multi-Axle Tipper';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Live Site Delivery Map</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
            {selectedOrder.orderNumber} · {selectedOrder.items[0]?.productName}
            {selectedOrder.items.length > 1 ? ` (+${selectedOrder.items.length - 1})` : ''}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sortedOrders.length > 1 && (
            <select
              aria-label="Select delivery order"
              value={selectedOrder.id}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              {sortedOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.orderNumber} — {ord.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Interactive Map Left + Live Telemetry Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Placeholder Vector Logistics Map Canvas */}
        <div className="lg:col-span-7 p-4 sm:p-5 bg-stone-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4">
          <div className="relative rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shadow-xs">
            {/* Map HUD Header */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] shadow-xs">
                <span className="text-slate-400 font-medium">Checkpoint: </span>
                <span className="font-bold text-slate-900">{telemetry.checkpointLabel}</span>
              </div>
              <div className="bg-slate-900/90 text-white rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tabular-nums shadow-xs flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{telemetry.etaText}</span>
              </div>
            </div>

            {/* Interactive SVG Street & Corridor Map */}
            <svg
              viewBox="0 0 600 265"
              className="w-full h-56 sm:h-64 block select-none"
              role="img"
              aria-label={`Delivery map showing consignment ${selectedOrder.orderNumber} at ${telemetry.progress}% route completion`}
            >
              <defs>
                <pattern id="bn-map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Base Urban Cartography Layer */}
              <rect width="600" height="265" fill="#F8FAFC" />
              <rect width="600" height="265" fill="url(#bn-map-grid)" />

              {/* Land / District Zone Blocks */}
              <polygon points="0,0 185,0 130,90 0,72" fill="#EFECE6" opacity="0.8" />
              <polygon points="365,175 600,150 600,265 340,265" fill="#E8EFE9" opacity="0.85" />
              <polygon points="210,165 330,175 315,265 190,265" fill="#F1F5F9" />

              {/* Secondary Arterial Roads */}
              <path d="M 0 112 Q 180 95 360 190 T 600 220" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
              <path d="M 0 112 Q 180 95 360 190 T 600 220" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 190 0 L 255 265" fill="none" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 415 0 L 385 265" fill="none" stroke="#FFFFFF" strokeWidth="8" />

              {/* Highway Ring Corridor Label */}
              <text x="275" y="102" fill="#94A3B8" fontSize="9" fontWeight="600" letterSpacing="0.06em">
                OUTER RING FREIGHT CORRIDOR
              </text>
              <text x="26" y="106" fill="#94A3B8" fontSize="8.5" fontWeight="600">
                INDUSTRIAL YARD ZONE
              </text>

              {/* Planned Full Route Track */}
              <polyline
                points={fullPolyline}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={fullPolyline}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active Completed Route Segment */}
              {selectedOrder.status !== 'cancelled' && (
                <polyline
                  points={completedPolyline}
                  fill="none"
                  stroke={selectedOrder.status === 'delivered' ? '#059669' : '#D97706'}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Mid-route Checkpoint Node: Weighbridge */}
              <g transform="translate(235, 120)">
                <circle r="5" fill={telemetry.progress >= 34 ? '#D97706' : '#FFFFFF'} stroke="#64748B" strokeWidth="2" />
                <text x="-28" y="-12" fill="#475569" fontSize="8.5" fontWeight="700">
                  Weighbridge
                </text>
              </g>

              {/* Mid-route Checkpoint Node: Ring Junction */}
              <g transform="translate(458, 84)">
                <circle r="5" fill={telemetry.progress >= 72 ? '#D97706' : '#FFFFFF'} stroke="#64748B" strokeWidth="2" />
                <text x="-30" y="18" fill="#475569" fontSize="8.5" fontWeight="700">
                  Ring Junction
                </text>
              </g>

              {/* Origin Node: Supplier Yard */}
              <g transform="translate(64, 214)">
                <circle r="11" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
                <rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#F59E0B" />
                <g transform="translate(-14, 17)">
                  <rect width="128" height="22" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="7" y="14" fill="#0F172A" fontSize="9.5" fontWeight="700">
                    Yard: {selectedOrder.vendorName.slice(0, 18)}
                  </text>
                </g>
              </g>

              {/* Destination Node: Job Site */}
              <g transform="translate(546, 66)">
                <circle
                  r="12"
                  fill={selectedOrder.status === 'delivered' ? '#059669' : '#FFFFFF'}
                  stroke={selectedOrder.status === 'delivered' ? '#FFFFFF' : '#059669'}
                  strokeWidth="3"
                />
                <circle r="4" fill={selectedOrder.status === 'delivered' ? '#FFFFFF' : '#059669'} />
                <g transform="translate(-122, 18)">
                  <rect width="134" height="22" rx="5" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="1.2" />
                  <text x="7" y="14" fill="#065F46" fontSize="9.5" fontWeight="700">
                    Site: {selectedOrder.shippingAddress.city} ({selectedOrder.shippingAddress.pincode})
                  </text>
                </g>
              </g>

              {/* Live Moving Tipper Vehicle Marker */}
              {selectedOrder.status !== 'cancelled' && (
                <g transform={`translate(${vehicleCoord.x}, ${vehicleCoord.y})`}>
                  <circle
                    r="16"
                    fill={selectedOrder.status === 'delivered' ? '#059669' : '#D97706'}
                    opacity="0.18"
                  />
                  <circle
                    r="11"
                    fill={selectedOrder.status === 'delivered' ? '#059669' : '#D97706'}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  {/* Truck Cab Glyph */}
                  <rect x="-5" y="-3.5" width="7" height="5.5" rx="1" fill="#FFFFFF" />
                  <rect x="2" y="-2" width="3.5" height="4" rx="0.8" fill="#FFFFFF" />
                  <circle cx="-2.5" cy="3" r="1.4" fill="#0F172A" />
                  <circle cx="3.2" cy="3" r="1.4" fill="#0F172A" />

                  {/* Vehicle Tag Above Marker */}
                  <g transform="translate(-38, -32)">
                    <rect width="76" height="17" rx="4" fill="#0F172A" />
                    <text x="38" y="11.5" textAnchor="middle" fill="#F8FAFC" fontSize="8.5" fontWeight="700" fontFamily="monospace">
                      {vehicleNumber}
                    </text>
                  </g>
                </g>
              )}
            </svg>

            {/* Bottom Map Coordinate Strip */}
            <div className="bg-white border-t border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-[160px]">{selectedOrder.vendorName}</span>
                </span>
                <span className="text-slate-300">→</span>
                <span className="flex items-center gap-1 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[190px]">{selectedOrder.shippingAddress.street}</span>
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                Synced {lastUpdated}
              </span>
            </div>
          </div>

          {/* Horizontal 5-Stage Progress Track */}
          <div className="grid grid-cols-5 gap-1.5 text-[10px]">
            {TRACK_STAGES.map((st, idx) => {
              const reached = stageRank >= idx;
              const isCurrent = stageRank === idx;
              return (
                <div
                  key={st.key}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    reached
                      ? isCurrent && selectedOrder.status !== 'delivered'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="truncate">{st.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry & Carrier Details Panel */}
        <div className="lg:col-span-5 p-5 space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            {/* Status Headline */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-sm">{telemetry.headline}</span>
                <span className="font-mono font-bold text-amber-700 tabular-nums">{telemetry.progress}%</span>
              </div>
              <p className="text-[11px] text-slate-500">{telemetry.sublabel}</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    selectedOrder.status === 'delivered'
                      ? 'bg-emerald-600'
                      : selectedOrder.status === 'cancelled'
                      ? 'bg-red-500'
                      : 'bg-amber-600'
                  }`}
                  style={{ width: `${telemetry.progress}%` }}
                />
              </div>
            </div>

            {/* Key Telemetry Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 block">Remaining</span>
                <span className="font-bold text-slate-900 tabular-nums text-xs mt-0.5 block">
                  {telemetry.distanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 block">Speed</span>
                <span className="font-bold text-slate-900 tabular-nums text-xs mt-0.5 block">
                  {telemetry.speedKmh} km/h
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 block">Site OTP</span>
                <span className="font-mono font-extrabold text-amber-700 tabular-nums text-xs mt-0.5 block">
                  {selectedOrder.status === 'delivered' ? 'VERIFIED' : selectedOrder.deliveryOtp || '4829'}
                </span>
              </div>
            </div>

            {/* Driver & Carrier Info */}
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>{vehicleType}</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {vehicleNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Driver: <strong className="text-slate-900">{driverName}</strong></span>
                <span className="font-mono flex items-center gap-1 text-slate-700">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {driverPhone}
                </span>
              </div>
            </div>

            {/* Latest Status Log Entry */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-stone-50 border border-slate-200/80 rounded-lg p-3">
                {selectedOrder.status === 'delivered' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {selectedOrder.statusHistory[selectedOrder.statusHistory.length - 1]?.note || telemetry.headline}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Updated {new Date(selectedOrder.statusHistory[selectedOrder.statusHistory.length - 1].timestamp).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {onOpenFullTracking && (
            <button
              type="button"
              onClick={() => onOpenFullTracking(selectedOrder)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Full Consignment &amp; Tax Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
