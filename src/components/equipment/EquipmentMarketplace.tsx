import React, { useState, useEffect } from 'react';
import { Truck, Calendar, ShieldCheck, MapPin, CheckCircle, AlertCircle, X, User } from 'lucide-react';
import { EquipmentListing, EquipmentCategory } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const EquipmentMarketplace: React.FC = () => {
  const { currentUser, showToast, setAuthModalOpen } = useApp();
  const [equipmentList, setEquipmentList] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookingModal, setBookingModal] = useState<EquipmentListing | null>(null);

  // Booking Form State
  const [siteAddress, setSiteAddress] = useState('Site #12, Phase 3, Electronic City, Bengaluru');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState(2);
  const [includeOperator, setIncludeOperator] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories: (EquipmentCategory | 'All')[] = [
    'All',
    'Earth Moving',
    'Concrete & Compaction',
    'Scaffolding & Formwork',
    'Power & Generators',
  ];

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
      });
      setEquipmentList(data.equipment);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [selectedCategory]);

  const handleOpenBooking = (item: EquipmentListing) => {
    setBookingModal(item);
    setDurationDays(item.minDurationDays || 1);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModal) return;
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in or register to reserve heavy machinery.', 'info');
      setBookingModal(null);
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bookEquipment({
        equipmentId: bookingModal.id,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerPhone: currentUser.phone,
        siteAddress,
        startDate,
        durationDays,
        includeOperator,
      });

      showToast('Machinery Reserved!', `${bookingModal.name} booking request confirmed. Requisition ID: ${res.booking.bookingNumber}`, 'success');
      setBookingModal(null);
      loadEquipment();
    } catch (err: any) {
      showToast('Booking Conflict', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Construction Machinery Fleet
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rent Verified Heavy Equipment & Machinery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            JCB backhoes, excavators, transit concrete mixers, silent generators, and steel scaffolding delivered to your site with licensed operators.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Loading heavy equipment fleet...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {equipmentList.map((eq) => (
              <div
                key={eq.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                        {eq.category}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {eq.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Model: {eq.model} · Fleet Provider: {eq.providerName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                        ₹{eq.dailyRate.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500">per 8-hr shift / day</div>
                    </div>
                  </div>

                  {/* Specifications Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                    {Object.entries(eq.specifications).slice(0, 4).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[11px] text-slate-400 block">{k}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Operational details */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{eq.city} ({eq.serviceRadiusKm} km radius)</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Deposit: ₹{eq.securityDeposit.toLocaleString('en-IN')}</span>
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">
                      Min Duration: {eq.minDurationDays} {eq.minDurationDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {eq.operatorAvailable ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Certified Operator Available (+₹{eq.operatorChargePerDay}/day)
                      </span>
                    ) : (
                      <span>Machine Only (Customer Operator)</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenBooking(eq)}
                    className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reserve Machinery</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Reservation Modal */}
        {bookingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Equipment Reservation
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {bookingModal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setBookingModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                {/* Site Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Site Delivery Location & Address
                  </label>
                  <input
                    type="text"
                    required
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Date & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      required
                      min={bookingModal.minDurationDays}
                      max={60}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.max(bookingModal.minDurationDays, Number(e.target.value)))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Operator checkbox */}
                {bookingModal.operatorAvailable && (
                  <div className="p-3 bg-stone-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Include Certified Heavy Operator</div>
                      <div className="text-[11px] text-slate-500">Experienced operator dedicated for 8hr shift/day</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOperator}
                        onChange={(e) => setIncludeOperator(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Machine Rental ({durationDays} days @ ₹{bookingModal.dailyRate})</span>
                    <span className="font-semibold tabular-nums">₹{(bookingModal.dailyRate * durationDays).toLocaleString('en-IN')}</span>
                  </div>
                  {includeOperator && bookingModal.operatorAvailable && (
                    <div className="flex justify-between text-slate-600">
                      <span>Operator Cost ({durationDays} days @ ₹{bookingModal.operatorChargePerDay})</span>
                      <span className="font-semibold tabular-nums">₹{(bookingModal.operatorChargePerDay * durationDays).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Refundable Security Deposit</span>
                    <span className="font-semibold tabular-nums">₹{bookingModal.securityDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Booking Cost</span>
                    <span className="text-amber-700 tabular-nums">
                      ₹{((bookingModal.dailyRate * durationDays) + (includeOperator ? bookingModal.operatorChargePerDay * durationDays : 0) + bookingModal.securityDeposit).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModal(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    {submitting ? 'Confirming...' : 'Submit Rental Reservation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
