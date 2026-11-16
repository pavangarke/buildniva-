import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo.js';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" className="border-amber-200/80 shadow-md" />
              <div>
                <div className="text-xl font-bold tracking-tight text-white leading-none">
                  Build<span className="text-amber-500">Niva</span>
                </div>
                <div className="text-[11px] text-amber-400/90 font-medium mt-1">
                  Construction Marketplace
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's unified construction marketplace connecting site builders with vetted material yards, heavy machinery rental providers, licensed civil engineers, and skilled trade workers.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>IS: 456 & IS: 1786 Indian Standards Compliant</span>
            </div>
          </div>

          {/* Core Marketplaces */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('materials')} className="hover:text-amber-400 transition-colors">
                  Cement, TMT Steel & AAC Blocks
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('equipment')} className="hover:text-amber-400 transition-colors">
                  JCBs, Excavators & Mobile Mixers
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('professionals')} className="hover:text-amber-400 transition-colors">
                  Chartered Civil & Structural Engineers
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('labour')} className="hover:text-amber-400 transition-colors">
                  Masons, Bar Benders & Shuttering Teams
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contractors')} className="hover:text-amber-400 transition-colors">
                  Turnkey Residential Contractors
                </button>
              </li>
            </ul>
          </div>

          {/* Service Cities & Fleet */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Hubs & Logistics</h4>
            <div className="text-xs text-slate-400 space-y-1.5">
              <p>Active Service Hubs: Bengaluru, Mumbai MMR, Delhi NCR, Hyderabad, Pune, Chennai.</p>
              <p>Fleet: Tata 407 Tippers, 10-Tonne Multi-Axle Trucks & 3-Wheeler site carriers.</p>
              <p>Safe Site Deliveries: Real-time driver tracking and mandatory 4-digit verification OTP on arrival.</p>
            </div>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Site Trust & Support</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Helpline: 1800-425-9900 (Mon-Sat, 8am-8pm)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>support@buildniva.in</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>BuildNiva Technologies Pvt Ltd, Indiranagar, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 BuildNiva Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>GST Registered Multi-Vendor Network</span>
            <span>·</span>
            <span>Transparent Quotation Guarantee</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
            >
              Administration
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
