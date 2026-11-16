import React from 'react';
import { Package, Truck, Compass, HardHat, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const CategoryGrid: React.FC = () => {
  const { setActiveTab } = useApp();

  const categories = [
    {
      id: 'materials',
      title: 'Building Materials',
      subtitle: 'Cement, TMT Steel, AAC Blocks, Sand, Paints',
      metrics: '1,800+ Products · Bulk Tiers',
      icon: Package,
      tab: 'materials',
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      id: 'equipment',
      title: 'Equipment & Machinery',
      subtitle: 'JCB Backhoes, 20T Excavators, Transit Mixers, Scaffolding',
      metrics: 'Hourly/Daily Rates · Operators Available',
      icon: Truck,
      tab: 'equipment',
      accent: 'text-orange-600 bg-orange-50',
    },
    {
      id: 'professionals',
      title: 'Engineers & Architects',
      subtitle: 'Structural Consulting, Plan Approvals, BOQ Estimation',
      metrics: 'COA & IEI Certified · Fixed Fees',
      icon: Compass,
      tab: 'professionals',
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'labour',
      title: 'Construction Labour',
      subtitle: 'Rajmistri Masons, Bar Benders, Shuttering Carpenters',
      metrics: 'Individual Workers & Contractor Crews',
      icon: HardHat,
      tab: 'labour',
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'contractors',
      title: 'Turnkey Contractors',
      subtitle: 'G+3 Independent Villas, Renovation, Commercial Fitouts',
      metrics: 'Milestone Payments · Verified Portfolio',
      icon: Building2,
      tab: 'contractors',
      accent: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'delivery',
      title: 'Site Delivery & Fleet',
      subtitle: 'Tata 407 Tippers, 10-Tonne carriers, Live GPS OTP tracking',
      metrics: 'Safe Site Unloading · Direct Route',
      icon: ShieldCheck,
      tab: 'orders',
      accent: 'text-slate-700 bg-slate-100',
    },
  ];

  return (
    <div className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Marketplace Verticals
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Integrated Construction Categories
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Directly procure materials or hire licensed professionals without multiple middle agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={() => setActiveTab(c.tab)}
                className="group p-5 bg-stone-50/70 hover:bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-lg ${c.accent} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{c.metrics}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {c.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-amber-600">
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
