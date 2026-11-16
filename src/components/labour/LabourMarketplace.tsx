import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  MapPin,
  Calendar,
  X,
  Camera,
  Image,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LabourProfile, LabourTrade, LabourRequest } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

export const LabourMarketplace: React.FC = () => {
  const { currentUser, showToast, setAuthModalOpen } = useApp();
  const [labourers, setLabourers] = useState<LabourProfile[]>([]);
  const [activeRequests, setActiveRequests] = useState<LabourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'workers' | 'gallery'>('workers');
  const [hireModalOpen, setHireModalOpen] = useState(false);

  // Photo viewer lightbox state
  const [selectedWorkerForPhotos, setSelectedWorkerForPhotos] = useState<LabourProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Specific worker being hired
  const [selectedWorkerForHire, setSelectedWorkerForHire] = useState<LabourProfile | null>(null);

  // Hiring Form
  const [trade, setTrade] = useState<LabourTrade>('Mason (Rajmistri)');
  const [headcount, setHeadcount] = useState(4);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState(3);
  const [siteAddress, setSiteAddress] = useState('Plot #42, Sarjapur Main Road, Bengaluru');
  const [dailyRate, setDailyRate] = useState(850);
  const [notes, setNotes] = useState('External brick masonry and window lintel casting work.');
  const [submitting, setSubmitting] = useState(false);

  const trades: (LabourTrade | 'All')[] = [
    'All',
    'Mason (Rajmistri)',
    'Bar Bender (Steel Fixer)',
    'Shuttering Carpenter',
    'Plumber',
    'Electrician',
    'General Labour (Beldaar)',
  ];

  const loadLabour = async () => {
    setLoading(true);
    try {
      const data = await api.getLabour({
        trade: selectedTrade === 'All' ? undefined : selectedTrade,
      });
      setLabourers(data.labourers);
      setActiveRequests(data.requests);
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabour();
  }, [selectedTrade]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in or register to submit a labour requisition.', 'info');
      setHireModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.requestLabour({
        trade,
        headcount,
        startDate,
        durationDays,
        siteAddress,
        city: currentUser.city || 'Bengaluru',
        dailyRateOffered: dailyRate,
        notes,
        customerName: currentUser.name,
      });

      showToast(
        'Labour Requisition Created',
        `Requisition ${res.request.requestNumber} posted. Verified ${trade} workers notified.`,
        'success'
      );
      setHireModalOpen(false);
      setSelectedWorkerForHire(null);
      loadLabour();
    } catch (err: any) {
      showToast('Requisition error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openHireModalForWorker = (worker: LabourProfile) => {
    setSelectedWorkerForHire(worker);
    setTrade(worker.trade);
    setDailyRate(worker.dailyWage);
    setHeadcount(worker.isTeam ? worker.teamSize || 4 : 1);
    setHireModalOpen(true);
  };

  // Compile all photos across workers for the dedicated gallery
  const allWorkPhotos = labourers.flatMap((worker) =>
    (worker.workPhotos || []).map((url, idx) => ({
      url,
      photoIndex: idx,
      worker,
    }))
  );

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              On-Demand Construction Workforce
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hire Skilled Labour & Contractor Crews
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Directly deploy master masons, steel fixers, shuttering teams, and helpers. Inspect verified profile photos and real on-site execution photos before site dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedWorkerForHire(null);
                setHireModalOpen(true);
              }}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              <span>Post Custom Labour Requisition</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher: Skilled Profiles vs Site Work Photos Gallery */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'workers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>Verified Workforce Profiles ({labourers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'gallery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Site Work Execution Photos ({allWorkPhotos.length})</span>
            </button>
          </div>

          {/* Filter categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {trades.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTrade(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedTrade === t
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: WORKERS PROFILE GRID */}
        {activeTab === 'workers' && (
          <>
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                Searching available workforce...
              </div>
            ) : labourers.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-800">No workers found in this trade</div>
                <p className="text-xs text-slate-500 mt-1">Try switching to 'All' to view all certified crews.</p>
                <button
                  onClick={() => setSelectedTrade('All')}
                  className="mt-4 px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                >
                  View All Trades
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {labourers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3.5">
                      {/* Worker Header with Profile Photo */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          {worker.photoUrl ? (
                            <img
                              src={worker.photoUrl}
                              alt={worker.name}
                              className="w-14 h-14 rounded-xl object-cover border-2 border-slate-100 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-200 shadow-sm">
                              {worker.name.charAt(0)}
                            </div>
                          )}
                          {worker.availableNow && (
                            <span
                              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                              title="Available for immediate site deployment"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                              {worker.trade.split(' ')[0]}
                            </span>
                            {worker.verified && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 mt-1 truncate" title={worker.name}>
                            {worker.name}
                          </h3>
                          <div className="text-xs text-slate-500 truncate">{worker.trade}</div>
                        </div>
                      </div>

                      {/* Wage & Crew Metrics */}
                      <div className="p-3 bg-stone-50 rounded-lg border border-slate-200/70 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Wage Rate:</span>
                          <span className="font-bold text-slate-900 tabular-nums">₹{worker.dailyWage}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Experience:</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{worker.experienceYears} Years</span>
                        </div>
                        {worker.isTeam && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Crew Strength:</span>
                            <span className="font-semibold text-amber-900">{worker.teamSize} Workers Team</span>
                          </div>
                        )}
                      </div>

                      {/* Labour Photo Section: On-Site Execution Samples */}
                      {worker.workPhotos && worker.workPhotos.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-amber-600" />
                              Site Photos ({worker.workPhotos.length})
                            </span>
                            <button
                              onClick={() => {
                                setSelectedWorkerForPhotos(worker);
                                setCurrentPhotoIndex(0);
                              }}
                              className="text-amber-700 hover:text-amber-800 font-semibold hover:underline text-[11px]"
                            >
                              View All
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {worker.workPhotos.slice(0, 3).map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => {
                                  setSelectedWorkerForPhotos(worker);
                                  setCurrentPhotoIndex(pIdx);
                                }}
                                className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 cursor-pointer group border border-slate-200"
                                title={`Click to zoom work photo #${pIdx + 1}`}
                              >
                                <img
                                  src={photo}
                                  alt={`${worker.name} work sample ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <ZoomIn className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {pIdx === 2 && worker.workPhotos && worker.workPhotos.length > 3 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-[10px]">
                                    +{worker.workPhotos.length - 2}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{worker.city}</span>
                        </span>
                        <span className="truncate max-w-[120px]" title={worker.languages.join(', ')}>
                          {worker.languages.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {worker.workPhotos && worker.workPhotos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWorkerForPhotos(worker);
                            setCurrentPhotoIndex(0);
                          }}
                          className="w-full py-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Image className="w-3.5 h-3.5 text-slate-500" />
                          <span>Inspect Site Work Photos</span>
                        </button>
                      )}

                      <button
                        onClick={() => openHireModalForWorker(worker)}
                        className="w-full py-2 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deploy {worker.name.split(' ')[0]} to Site</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: DEDICATED SITE WORK PHOTOS GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Verified Labour Work Execution Gallery
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  On-Site Craftsmanship & Quality Proof
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inspect concrete pouring, brick bond alignments, rebar tying, and plumbing fittings before deploying any team to your project.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkerForHire(null);
                  setHireModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow-sm whitespace-nowrap"
              >
                Book Available Crew
              </button>
            </div>

            {allWorkPhotos.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-800">No photos found for this filter</div>
                <p className="text-xs text-slate-500 mt-1">Select 'All' to view work samples from all trades.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allWorkPhotos.map((item, index) => (
                  <div
                    key={`${item.worker.id}_${item.photoIndex}_${index}`}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between"
                  >
                    <div
                      onClick={() => {
                        setSelectedWorkerForPhotos(item.worker);
                        setCurrentPhotoIndex(item.photoIndex);
                      }}
                      className="relative aspect-4/3 bg-slate-100 cursor-pointer overflow-hidden"
                    >
                      <img
                        src={item.url}
                        alt={`${item.worker.name} work sample`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="px-3 py-1 bg-white/90 text-slate-900 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>View Full Photo</span>
                        </span>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold rounded">
                          {item.worker.trade}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        {item.worker.photoUrl ? (
                          <img
                            src={item.worker.photoUrl}
                            alt={item.worker.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                            {item.worker.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">{item.worker.name}</div>
                          <div className="text-[11px] text-slate-500">₹{item.worker.dailyWage}/day · {item.worker.experienceYears}y exp</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedWorkerForPhotos(item.worker);
                            setCurrentPhotoIndex(item.photoIndex);
                          }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Zoom</span>
                        </button>
                        <button
                          onClick={() => openHireModalForWorker(item.worker)}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Deploy</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Site Requisitions */}
        {activeRequests.length > 0 && (
          <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Recent Job Site Labour Requisitions
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {activeRequests.map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{req.trade} ({req.headcount} Workers)</span>
                      <span className="text-slate-400 font-normal">· {req.requestNumber}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Site: {req.siteAddress} · Start Date: {req.startDate} ({req.durationDays} days)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 tabular-nums">₹{req.estimatedTotal.toLocaleString('en-IN')}</div>
                    <span className="text-[11px] text-amber-700 font-semibold uppercase">{req.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERACTIVE WORK PHOTOS LIGHTBOX MODAL */}
        {selectedWorkerForPhotos && selectedWorkerForPhotos.workPhotos && selectedWorkerForPhotos.workPhotos.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
                <div className="flex items-center gap-3">
                  {selectedWorkerForPhotos.photoUrl ? (
                    <img
                      src={selectedWorkerForPhotos.photoUrl}
                      alt={selectedWorkerForPhotos.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedWorkerForPhotos.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        {selectedWorkerForPhotos.name}
                      </h3>
                      {selectedWorkerForPhotos.verified && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {selectedWorkerForPhotos.trade} · ₹{selectedWorkerForPhotos.dailyWage}/day · {selectedWorkerForPhotos.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Photo {currentPhotoIndex + 1} of {selectedWorkerForPhotos.workPhotos.length}
                  </span>
                  <button
                    onClick={() => setSelectedWorkerForPhotos(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Main Photo Display with Navigation Arrows */}
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[350px] sm:min-h-[480px] p-2">
                <img
                  src={selectedWorkerForPhotos.workPhotos[currentPhotoIndex]}
                  alt={`${selectedWorkerForPhotos.name} work sample ${currentPhotoIndex + 1}`}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
                />

                {selectedWorkerForPhotos.workPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === 0 ? selectedWorkerForPhotos!.workPhotos!.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/20"
                      title="Previous Photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === selectedWorkerForPhotos!.workPhotos!.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors border border-white/20"
                      title="Next Photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Lightbox Footer & Thumbnail Strip */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Thumbnails */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-md pb-1 scrollbar-none">
                  {selectedWorkerForPhotos.workPhotos.map((thumb, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        currentPhotoIndex === idx
                          ? 'border-amber-500 scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Direct Hire CTA */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const worker = selectedWorkerForPhotos;
                      setSelectedWorkerForPhotos(null);
                      openHireModalForWorker(worker);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Deploy {selectedWorkerForPhotos.name.split(' ')[0]} to Site</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Labour Requisition Modal */}
        {hireModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Site Workforce Requisition
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedWorkerForHire
                      ? `Deploy ${selectedWorkerForHire.name}`
                      : 'Request Construction Labourers'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setHireModalOpen(false);
                    setSelectedWorkerForHire(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected Worker Photo & Summary Banner if specific worker selected */}
              {selectedWorkerForHire && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
                  {selectedWorkerForHire.photoUrl ? (
                    <img
                      src={selectedWorkerForHire.photoUrl}
                      alt={selectedWorkerForHire.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0">
                      {selectedWorkerForHire.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {selectedWorkerForHire.name}
                      </span>
                      {selectedWorkerForHire.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {selectedWorkerForHire.trade} · Rate: ₹{selectedWorkerForHire.dailyWage}/day
                    </div>
                  </div>
                  {selectedWorkerForHire.workPhotos && selectedWorkerForHire.workPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForPhotos(selectedWorkerForHire);
                        setCurrentPhotoIndex(0);
                      }}
                      className="text-[11px] text-amber-800 font-semibold underline hover:text-amber-900 shrink-0"
                    >
                      {selectedWorkerForHire.workPhotos.length} Photos
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                {/* Trade selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trade Specialization</label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value as LabourTrade)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="Mason (Rajmistri)">Mason (Rajmistri)</option>
                    <option value="General Labour (Beldaar)">General Labour (Beldaar)</option>
                    <option value="Bar Bender (Steel Fixer)">Bar Bender (Steel Fixer)</option>
                    <option value="Shuttering Carpenter">Shuttering Carpenter</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Tile Mason">Tile Mason</option>
                    <option value="Painter">Painter</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Required Headcount</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={headcount}
                      onChange={(e) => setHeadcount(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Daily Wage Offered (₹)</label>
                    <input
                      type="number"
                      min="500"
                      step="50"
                      required
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Details & Scope</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-slate-200 flex justify-between items-center font-bold">
                  <span>Estimated Total Wages:</span>
                  <span className="text-amber-700 text-sm tabular-nums">
                    ₹{(headcount * dailyRate * durationDays).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHireModalOpen(false);
                      setSelectedWorkerForHire(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    {submitting ? 'Posting Requisition...' : 'Submit Work Requisition'}
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
