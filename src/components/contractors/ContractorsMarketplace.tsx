import React, { useState, useEffect } from 'react';
import { Building2, Award, FileText, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { ContractorProfile, ContractorQuotation } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const ContractorsMarketplace: React.FC = () => {
  const { currentUser, showToast, setAuthModalOpen } = useApp();
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [quotations, setQuotations] = useState<ContractorQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteModal, setQuoteModal] = useState<ContractorProfile | null>(null);

  // Form State
  const [projectType, setProjectType] = useState('Turnkey Residential Construction');
  const [plotArea, setPlotArea] = useState(2400);
  const [floors, setFloors] = useState(2);
  const [scopeSummary, setScopeSummary] = useState(
    'End-to-end villa construction including excavation, RCC columns, red brickwork, electrical/plumbing conduits, and exterior elevation.'
  );
  const [submitting, setSubmitting] = useState(false);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const data = await api.getContractors();
      setContractors(data.contractors);
      setQuotations(data.quotations);
    } catch (err) {
      console.error('Failed to load contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
  }, []);

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModal) return;
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in or register to request a contractor quotation.', 'info');
      setQuoteModal(null);
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.requestQuotation({
        contractorId: quoteModal.id,
        projectType,
        plotAreaSqFt: plotArea,
        floors,
        siteCity: currentUser.city || 'Bengaluru',
        customerName: currentUser.name,
        scopeSummary,
      });

      showToast(
        'Quotation Generated',
        `Milestone quotation created with ${quoteModal.businessName}. Estimated budget: ₹${(res.quotation.estimatedBudget / 100000).toFixed(1)} Lakhs`,
        'success'
      );
      setQuoteModal(null);
      loadContractors();
    } catch (err: any) {
      showToast('Quote generation error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Turnkey Construction Builders
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hire Licensed General Contractors
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Compare transparent turnkey building quotes, milestone-based escrow payments, and verified completed projects across residential and commercial sectors.
          </p>
        </div>

        {/* Contractors Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Fetching vetted construction contractors...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contractors.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Contractor Profile Picture */}
                      <div className="relative shrink-0">
                        {c.profilePic || c.avatarUrl ? (
                          <img
                            src={c.profilePic || c.avatarUrl}
                            alt={c.leadPerson}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-slate-100 shadow-xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-xs">
                            {c.leadPerson.charAt(0)}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
                          title="Verified Class-1 Civil License"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
                          <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Verified Class-1 Civil License</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 truncate" title={c.businessName}>
                          {c.businessName}
                        </h3>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{c.leadPerson}</span>
                          <span>·</span>
                          <span>{c.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-slate-900 tabular-nums">
                        ₹{c.averageRatePerSqFt}
                      </div>
                      <div className="text-[11px] text-slate-500">avg / sq.ft built-up</div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.specializations.map((s, i) => (
                      <span key={i} className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs bg-stone-50 p-3 rounded-lg border border-slate-200/70">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Experience</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{c.experienceYears} Years</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Completed Sites</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{c.completedSitesCount} Buildings</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">In-House Crew</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{c.teamSize} Workers</span>
                    </div>
                  </div>

                  {/* Recent Sites */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Recent Portfolio Sites
                    </div>
                    {c.recentProjects.map((p, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{p.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.areaSqFt} sq.ft · Completed {p.completionYear}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 tabular-nums">
                          ₹{p.budgetLakhs} Lakhs
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setQuoteModal(c)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Request Detailed Quotation & Milestones</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Existing Quotations Section */}
        {quotations.length > 0 && (
          <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Submitted Contractor Quotations & Milestones
            </h3>
            <div className="space-y-4">
              {quotations.map((q) => (
                <div key={q.id} className="p-4 bg-stone-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {q.projectType} ({q.plotAreaSqFt * q.floors} sq.ft total built-up)
                      </div>
                      <div className="text-xs text-slate-500">
                        Contractor: {q.contractorName} · Valid until: {q.validUntil}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-amber-700 tabular-nums">
                        ₹{(q.estimatedBudget / 100000).toFixed(2)} Lakhs
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold uppercase">
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{q.scopeSummary}</p>

                  {/* Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200/80">
                    {q.milestones.map((m, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-md border border-slate-200 text-xs">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Stage {idx + 1} ({m.percentage}%)
                        </div>
                        <div className="font-medium text-slate-800 line-clamp-1 mt-0.5">{m.name}</div>
                        <div className="font-bold text-slate-900 mt-1 tabular-nums">
                          ₹{(m.amount / 1000).toFixed(0)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Quotation Modal */}
        {quoteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {quoteModal.profilePic || quoteModal.avatarUrl ? (
                      <img
                        src={quoteModal.profilePic || quoteModal.avatarUrl}
                        alt={quoteModal.leadPerson}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-amber-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-850 font-bold flex items-center justify-center text-base border border-amber-200">
                        {quoteModal.leadPerson.charAt(0)}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
                      title="Verified Class-1 Civil License"
                    >
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                      Contractor Quotation Request
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {quoteModal.businessName}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Lead: <span className="font-semibold text-slate-700">{quoteModal.leadPerson}</span> · {quoteModal.city} · ₹{quoteModal.averageRatePerSqFt}/sq.ft
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setQuoteModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestQuote} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Classification</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Turnkey Residential Construction">Turnkey Residential Construction</option>
                    <option value="Independent Luxury Villa (G+2)">Independent Luxury Villa (G+2)</option>
                    <option value="Commercial Office Fitout">Commercial Office Fitout</option>
                    <option value="Structural Renovation & Retrofitting">Structural Renovation & Retrofitting</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Plot Area (sq.ft)</label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={plotArea}
                      onChange={(e) => setPlotArea(Number(e.target.value))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Number of Floors</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={6}
                      value={floors}
                      onChange={(e) => setFloors(Number(e.target.value))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Scope & Preferences</label>
                  <textarea
                    rows={3}
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-slate-200 flex justify-between items-center font-bold">
                  <span>Preliminary Estimate:</span>
                  <span className="text-amber-700 text-sm tabular-nums">
                    ₹{((plotArea * floors * quoteModal.averageRatePerSqFt) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuoteModal(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    {submitting ? 'Generating...' : 'Submit Quotation Request'}
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
