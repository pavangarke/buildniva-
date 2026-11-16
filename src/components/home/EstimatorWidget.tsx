import React, { useState } from 'react';
import { Calculator, Sparkles, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { MaterialEstimationResult } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';

export const EstimatorWidget: React.FC = () => {
  const { selectedCity, addToCart, setIsCartOpen, showToast } = useApp();
  const [plotArea, setPlotArea] = useState<number>(1500);
  const [floors, setFloors] = useState<number>(2);
  const [quality, setQuality] = useState<'standard' | 'premium' | 'luxury'>('premium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MaterialEstimationResult | null>(null);

  const calculateEstimate = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterialEstimate({
        plotAreaSqFt: plotArea,
        floors,
        quality,
        city: selectedCity,
      });
      setResult(data);
    } catch (err: any) {
      showToast('Estimation error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = async () => {
    if (!result) return;
    try {
      const catalog = await api.getMaterials();
      let addedCount = 0;
      for (const item of result.materials) {
        const match = catalog.materials.find((m) => m.category === item.matchingCategory);
        if (match) {
          addToCart(match, Math.max(1, Math.min(item.quantity, 100)));
          addedCount++;
        }
      }
      showToast('Materials Added to Cart', `${addedCount} essential materials staged for site purchase.`, 'success');
      setIsCartOpen(true);
    } catch (e: any) {
      showToast('Could not stage items', e.message, 'error');
    }
  };

  return (
    <div className="py-14 bg-stone-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Civil Engineering Scope Calculator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Calculate Site Materials & Budget Instantly
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Get precision BOQ estimations based on standard Indian CPWD civil engineering thumb-rules and current Bengaluru/Mumbai wholesale rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Input Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Project Dimensions</h3>
            </div>

            {/* Plot Area */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Plot / Floor Area</span>
                <span className="font-bold text-amber-700 tabular-nums">{plotArea} sq.ft</span>
              </div>
              <input
                type="range"
                min="400"
                max="6000"
                step="50"
                value={plotArea}
                onChange={(e) => setPlotArea(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>400 sq.ft (Compact)</span>
                <span>6,000 sq.ft (Large Plot)</span>
              </div>
            </div>

            {/* Number of Floors */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Number of Floors
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFloors(f)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      floors === f
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {f === 1 ? 'G (Ground)' : `G+${f - 1}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Finishing Quality */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Specification Standard
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'premium', 'luxury'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`py-2 text-xs font-semibold capitalize rounded-lg border transition-all ${
                      quality === q
                        ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-sm font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {quality === 'standard' && '₹1,650/sq.ft · Standard Red Brick, Fe-500 Steel, Asian Tractor Emulsion'}
                {quality === 'premium' && '₹1,950/sq.ft · Fe-550D Rebars, AAC Blocks, Asian Apex Ultima, Kajaria Tiles'}
                {quality === 'luxury' && '₹2,400/sq.ft · Italian Marble, Structural Glazing, Premium Teak & Smart Fixtures'}
              </p>
            </div>

            <button
              onClick={calculateEstimate}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>{loading ? 'Analyzing Civil Norms...' : 'Compute Material Quantities'}</span>
            </button>
          </div>

          {/* Results Output Module */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            {!result ? (
              <div className="py-12 text-center">
                <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No Estimate Computed Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Adjust your plot dimensions and floor requirements on the left, then click "Compute Material Quantities" to view exact bill of quantities.
                </p>
                <button
                  onClick={calculateEstimate}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <span>Quick Demo for {plotArea} sq.ft</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Top KPI Card */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Built-Up Area</span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                      {result.builtUpAreaSqFt.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Estimated Civil Cost</span>
                    <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                      ₹{(result.estimatedTotalCost / 100000).toFixed(2)} <span className="text-xs font-normal">Lakhs</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Benchmark Rate</span>
                    <div className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums">
                      ₹{result.costPerSqFt} <span className="text-xs font-normal">/sq.ft</span>
                    </div>
                  </div>
                </div>

                {/* Material Quantities Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Itemized Material Requirements
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {result.materials.map((m, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Required: <span className="font-semibold text-slate-800 tabular-nums">{m.quantity} {m.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            ₹{m.estimatedCost.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">Wholesale Yard</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddAllToCart}
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Stage Materials in Cart</span>
                  </button>
                  <button
                    onClick={() => {
                      calculateEstimate();
                      showToast('Rates Recalculated', 'Estimates refreshed with latest yard prices.', 'info');
                    }}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                  >
                    Recalculate
                  </button>
                </div>

                {/* Civil Notes */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>Technical Civil Engineering Notes</span>
                  </div>
                  {result.notes.map((note, i) => (
                    <p key={i} className="text-[11px] text-amber-800 leading-relaxed">
                      · {note}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
