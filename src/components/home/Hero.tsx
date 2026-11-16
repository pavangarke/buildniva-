import React, { useState } from 'react';
import { Search, MapPin, Truck, Award, Hammer, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const Hero: React.FC = () => {
  const { setActiveTab, selectedCity, setSelectedCity } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory === 'Machinery') {
      setActiveTab('equipment');
    } else if (selectedCategory === 'Engineers') {
      setActiveTab('professionals');
    } else if (selectedCategory === 'Labour') {
      setActiveTab('labour');
    } else if (selectedCategory === 'Contractors') {
      setActiveTab('contractors');
    } else {
      setActiveTab('materials');
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-stone-100 to-stone-50 border-b border-stone-200 pt-10 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200/60 mb-4">
            Unified Construction Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
            Everything You Need to Build. All in One Place.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Buy certified construction materials, rent heavy machinery, book structural engineers, hire skilled workers, and track deliveries straight to your job site.
          </p>
        </div>

        {/* Search Component */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200/80 p-3 sm:p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Category selection */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              >
                <option value="All">All Categories</option>
                <option value="Materials">Building Materials</option>
                <option value="Machinery">Equipment & Machinery</option>
                <option value="Engineers">Engineers & Architects</option>
                <option value="Labour">Skilled Construction Labour</option>
                <option value="Contractors">Turnkey Contractors</option>
              </select>
            </div>

            {/* City Hub */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Delivery City / Hub
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                >
                  <option value="Bengaluru">Bengaluru (All Zones)</option>
                  <option value="Mumbai">Mumbai & MMR</option>
                  <option value="Delhi NCR">Delhi NCR & Gurgaon</option>
                  <option value="Hyderabad">Hyderabad & Cyberabad</option>
                  <option value="Pune">Pune & PCMC</option>
                  <option value="Chennai">Chennai City</option>
                </select>
              </div>
            </div>

            {/* Keyword Input */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Search Item or Professional
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. UltraTech Cement, Tata TMT, JCB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Action CTA */}
            <div className="sm:col-span-2 pt-1 sm:pt-4">
              <button
                type="submit"
                className="w-full h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Find Rates</span>
              </button>
            </div>
          </form>

          {/* Quick Keywords */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Quick Searches:</span>
            <button
              onClick={() => {
                setActiveTab('materials');
              }}
              className="hover:text-amber-600 transition-colors"
            >
              53-Grade Cement
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('materials');
              }}
              className="hover:text-amber-600 transition-colors"
            >
              Tata Tiscon 550D Rebars
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('equipment');
              }}
              className="hover:text-amber-600 transition-colors"
            >
              JCB 3DX Loader
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('professionals');
              }}
              className="hover:text-amber-600 transition-colors"
            >
              Structural Audit
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setActiveTab('labour');
              }}
              className="hover:text-amber-600 transition-colors"
            >
              Rajmistri Mason Teams
            </button>
          </div>
        </div>

        {/* 4-Item Proof Strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Direct Mill & Yard Pricing</div>
              <div className="text-[11px] text-slate-500">Zero distributor markups</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Dedicated Site Tipper Fleet</div>
              <div className="text-[11px] text-slate-500">Live GPS & OTP dropoff</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">COA & IEI Certified Pros</div>
              <div className="text-[11px] text-slate-500">Licensed civil engineers</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Bulk Tier Volume Rebates</div>
              <div className="text-[11px] text-slate-500">Instant GST tax invoices</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
