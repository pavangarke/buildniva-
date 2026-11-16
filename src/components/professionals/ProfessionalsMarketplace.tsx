import React, { useState, useEffect } from 'react';
import {
  Compass,
  Award,
  Calendar,
  CheckCircle2,
  Video,
  MapPin,
  X,
  Camera,
  UploadCloud,
  Sparkles,
  User as UserIcon,
  Star,
  Check,
  ShieldCheck,
  Image as ImageIcon,
  Layers,
  FileText,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Send,
  UserCheck,
  Search,
} from 'lucide-react';
import { ProfessionalProfile, ProfessionalSpecialization, ProjectSample, ProfessionalBooking } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { compressImageFile } from '../../utils/imageCompressor.js';

// Pre-curated verified authentic engineering drawing and 3D plan presets
const SAMPLE_DRAWING_PRESETS = [
  {
    title: 'G+3 Villa Structural RCC Framing & Column Details',
    category: 'Structural Drawings',
    projectType: 'Residential Villa (G+3)',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
    desc: 'RCC beam schedule, foundation layout & seismic moment frame design.',
  },
  {
    title: 'Modern 4BHK Villa 3D Exterior BIM Model',
    category: '3D Architectural Plans',
    projectType: 'Luxury Villa',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    desc: 'Photorealistic exterior architectural elevation with cantilevered pergolas.',
  },
  {
    title: 'Multi-Floor Sanitary & Storm-Water Schematics',
    category: 'MEP Designs',
    projectType: 'Apartment Complex',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
    desc: 'Plumbing riser diagrams, drainage layout, and rainwater harvesting conduits.',
  },
  {
    title: 'Pre-Pour RCC Slab Reinforcement Quality Audit',
    category: 'Site Audits',
    projectType: 'Commercial Complex',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80',
    desc: 'On-site verification of steel lap lengths, cover blocks & shuttering rigidity.',
  },
];

const ENGINEER_PHOTO_PRESETS = [
  {
    name: 'Er. Structural Specialist (Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    tag: 'Civil & Structural',
  },
  {
    name: 'Ar. Biophilic Architect (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    tag: 'Architectural Design',
  },
  {
    name: 'Er. Quantity Surveyor & Estimator (Male)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    tag: 'Cost Estimation',
  },
  {
    name: 'Er. Foundation & RCC Consultant (Female)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    tag: 'Structural Frame',
  },
  {
    name: 'Ar. Urban & Interior Planner (Female)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    tag: 'Turnkey Design',
  },
  {
    name: 'Er. Project Site Engineer (Male)',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    tag: 'Site Supervision',
  },
];

export const ProfessionalsMarketplace: React.FC = () => {
  const { currentUser, showToast, setAuthModalOpen } = useApp();
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<string>('All');
  const [bookingModal, setBookingModal] = useState<ProfessionalProfile | null>(null);

  // Profile Picture Editor Modal State
  const [photoModalPro, setPhotoModalPro] = useState<ProfessionalProfile | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Portfolio Viewer Modal State
  const [portfolioModalPro, setPortfolioModalPro] = useState<ProfessionalProfile | null>(null);
  const [activeSamplePic, setActiveSamplePic] = useState<ProjectSample | null>(null);

  // Add Project Sample modal (for engineers/architects on the marketplace)
  const [addSampleProId, setAddSampleProId] = useState<string | null>(null);
  const [newSampleTitle, setNewSampleTitle] = useState('');
  const [newSampleCategory, setNewSampleCategory] = useState<'Structural Drawings' | '3D Architectural Plans' | 'MEP Designs' | 'Site Audits' | 'Civil Execution'>('Structural Drawings');
  const [newSampleType, setNewSampleType] = useState('Residential Villa (G+3)');
  const [newSampleDesc, setNewSampleDesc] = useState('');
  const [newSampleImageUrl, setNewSampleImageUrl] = useState('');
  const [addingSample, setAddingSample] = useState(false);
  // Contact & Inquiries State
  const [allInquiries, setAllInquiries] = useState<ProfessionalBooking[]>([]);
  const [contactModalPro, setContactModalPro] = useState<ProfessionalProfile | null>(null);
  const [inquiryCustomerName, setInquiryCustomerName] = useState('');
  const [inquiryCustomerPhone, setInquiryCustomerPhone] = useState('');
  const [inquiryCustomerEmail, setInquiryCustomerEmail] = useState('');
  const [inquiryCustomerCity, setInquiryCustomerCity] = useState('Bengaluru');
  const [inquiryServiceType, setInquiryServiceType] = useState<
    | 'structural_drawings'
    | '3d_architectural_plans'
    | 'mep_designs'
    | 'site_audits'
    | 'online_consultation'
    | 'site_inspection'
  >('structural_drawings');
  const [inquiryUrgency, setInquiryUrgency] = useState<'Standard' | 'Urgent (Within 48h)' | 'Immediate Site Issue'>('Standard');
  const [inquirySiteLocation, setInquirySiteLocation] = useState('HSR Layout Sector 2, Bengaluru');
  const [inquiryScope, setInquiryScope] = useState('Need structural stability review and drawing estimation for G+3 villa.');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // View Inquiries Modal (for engineers to review who contacted them)
  const [viewInquiriesPro, setViewInquiriesPro] = useState<ProfessionalProfile | null>(null);
  const [viewInquiriesFilter, setViewInquiriesFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

  // Booking Form State for 4 Core Deliverables + Consultation + Inspection
  const [serviceType, setServiceType] = useState<
    | 'structural_drawings'
    | '3d_architectural_plans'
    | 'mep_designs'
    | 'site_audits'
    | 'online_consultation'
    | 'site_inspection'
  >('structural_drawings');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 12:00 PM');
  const [siteLocation, setSiteLocation] = useState('Plot #84, HSR Layout Sector 2, Bengaluru');
  const [projectDescription, setProjectDescription] = useState('Structural drawings & framing design for G+3 residential building.');
  const [submitting, setSubmitting] = useState(false);

  const specializations: (ProfessionalSpecialization | 'All')[] = [
    'All',
    'Civil & Structural Engineer',
    'Architectural Design',
    'Quantity Surveyor & Estimator',
  ];

  const getBookingFee = (pro: ProfessionalProfile, type: string) => {
    switch (type) {
      case 'structural_drawings':
        return pro.structuralDrawingsRate || 12500;
      case '3d_architectural_plans':
        return pro.architecturalPlansRate || 18000;
      case 'mep_designs':
        return pro.mepDesignsRate || 9500;
      case 'site_audits':
        return pro.siteAuditsRate || 4500;
      case 'site_inspection':
        return pro.siteVisitFee;
      case 'online_consultation':
      default:
        return pro.consultationFee;
    }
  };

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      const [proData, inqData] = await Promise.all([
        api.getProfessionals({
          specialization: selectedSpec === 'All' ? undefined : selectedSpec,
        }),
        api.getProfessionalBookings(),
      ]);
      setProfessionals(proData.professionals);
      setAllInquiries(inqData.bookings || []);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDirectInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactModalPro) return;
    if (!inquiryCustomerPhone.trim()) {
      showToast('Phone Number Required', 'Please provide a valid contact phone number.', 'error');
      return;
    }

    setInquirySubmitting(true);
    try {
      const res = await api.inquireProfessional({
        professionalId: contactModalPro.id,
        customerId: currentUser?.id || 'guest',
        customerName: inquiryCustomerName.trim() || currentUser?.name || 'Home Builder',
        customerPhone: inquiryCustomerPhone.trim(),
        customerEmail: inquiryCustomerEmail.trim() || currentUser?.email || '',
        customerCity: inquiryCustomerCity.trim() || currentUser?.city || 'Bengaluru',
        serviceType: inquiryServiceType,
        urgency: inquiryUrgency,
        siteLocation: inquirySiteLocation.trim() || `${inquiryCustomerCity || 'Bengaluru'} Site`,
        projectDescription: inquiryScope.trim() || 'General drawing estimation & structural inquiry.',
      });

      showToast(
        'Inquiry Transmitted!',
        `Your contact request has been sent to ${contactModalPro.name}. Ref: ${res.inquiry.bookingNumber}`,
        'success'
      );
      setAllInquiries((prev) => [res.inquiry, ...prev]);
      setContactModalPro(null);
    } catch (err: any) {
      showToast('Inquiry Failed', err?.message || 'Could not send contact request', 'error');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleUpdateMarketplaceInquiryStatus = async (
    inquiryId: string,
    newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    notes?: string
  ) => {
    try {
      const res = await api.updateProfessionalBookingStatus(inquiryId, newStatus, notes);
      showToast('Status Updated', `Client inquiry status changed to ${newStatus.replace('_', ' ')}.`, 'success');
      setAllInquiries((prev) =>
        prev.map((i) => (i.id === inquiryId ? res.booking : i))
      );
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update status', 'error');
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, [selectedSpec]);

  // Open Photo Editor
  const handleOpenPhotoEditor = (pro: ProfessionalProfile) => {
    setPhotoModalPro(pro);
    setSelectedPhotoUrl(pro.avatarUrl || pro.profilePic || '');
    setCustomPhotoInput('');
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 800, 800, 0.85);
      setSelectedPhotoUrl(compressed);
      showToast('Photo Loaded', 'Profile photo preview updated. Click "Save Profile Picture" to confirm.', 'info');
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Failed to process photo file.', 'error');
    }
  };

  // Save updated photo to backend
  const handleSaveProfilePic = async () => {
    if (!photoModalPro) return;
    if (!selectedPhotoUrl.trim()) {
      showToast('Missing Photo', 'Please upload a photo, choose a preset, or enter an image URL.', 'error');
      return;
    }

    setSavingPhoto(true);
    try {
      await api.updateProfessional(photoModalPro.id, {
        avatarUrl: selectedPhotoUrl,
        profilePic: selectedPhotoUrl,
      });

      showToast('Profile Picture Updated!', `Updated profile picture for ${photoModalPro.name}.`, 'success');

      // Update in local state
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === photoModalPro.id ? { ...p, avatarUrl: selectedPhotoUrl, profilePic: selectedPhotoUrl } : p
        )
      );

      // If booking modal is open with this pro, update it
      if (bookingModal?.id === photoModalPro.id) {
        setBookingModal((prev) => (prev ? { ...prev, avatarUrl: selectedPhotoUrl, profilePic: selectedPhotoUrl } : null));
      }

      setPhotoModalPro(null);
    } catch (err: any) {
      showToast('Failed to Update Photo', err.message, 'error');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSamplePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.85);
      setNewSampleImageUrl(compressed);
      showToast('Project Picture Loaded', 'Sample image processed and ready to save.', 'info');
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Failed to process project drawing.', 'error');
    }
  };

  const handleCreateMarketplaceSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSampleProId || !newSampleTitle.trim() || !newSampleImageUrl.trim()) {
      showToast('Missing Fields', 'Please specify a project title and image.', 'error');
      return;
    }
    setAddingSample(true);
    try {
      const res = await api.addProfessionalProject(addSampleProId, {
        title: newSampleTitle.trim(),
        category: newSampleCategory,
        projectType: newSampleType.trim(),
        description: newSampleDesc.trim(),
        imageUrl: newSampleImageUrl.trim(),
      });
      showToast('Sample Picture Added', 'Project drawing/plan added to portfolio!', 'success');
      setAddSampleProId(null);
      setNewSampleTitle('');
      setNewSampleDesc('');
      setNewSampleImageUrl('');

      // Refresh local state
      if (res.professional) {
        setProfessionals((prev) =>
          prev.map((p) => (p.id === res.professional.id ? res.professional : p))
        );
        if (portfolioModalPro?.id === res.professional.id) {
          setPortfolioModalPro(res.professional);
        }
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to add sample picture.', 'error');
    } finally {
      setAddingSample(false);
    }
  };

  const handleDeleteMarketplaceSample = async (proId: string, sampleId: string) => {
    try {
      const res = await api.deleteProfessionalProject(proId, sampleId);
      showToast('Removed', 'Sample picture removed from portfolio.', 'info');
      if (res.professional) {
        setProfessionals((prev) =>
          prev.map((p) => (p.id === res.professional.id ? res.professional : p))
        );
        if (portfolioModalPro?.id === res.professional.id) {
          setPortfolioModalPro(res.professional);
        }
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to delete sample picture.', 'error');
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModal) return;
    if (!currentUser) {
      showToast('Sign In Required', 'Please sign in or register to book an engineer consultation.', 'info');
      setBookingModal(null);
      setAuthModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bookProfessional({
        professionalId: bookingModal.id,
        customerId: currentUser.id,
        customerName: currentUser.name,
        serviceType,
        date: appointmentDate,
        timeSlot,
        siteLocation: serviceType === 'site_inspection' ? siteLocation : undefined,
        projectDescription,
      });

      showToast(
        'Appointment Confirmed!',
        `Booked with ${bookingModal.name}. Ref: ${res.booking.bookingNumber}`,
        'success'
      );
      setBookingModal(null);
    } catch (err: any) {
      showToast('Booking failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Certified Civil & Structural Consultants · Council of Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Civil Engineer & Architect Direct Services
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Offer structural drawings, 3D architectural plans, MEP designs, and site audits. Direct contract booking, CAD/BIM drawing approval, and verified Council of Architecture (COA) / Institution of Engineers (IEI) chartered professionals.
          </p>
        </div>

        {/* Engineer Client Leads Alert Banner */}
        {currentUser?.role === 'professional' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span>Client Contacts & Inquiry Stream Active</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-full text-[11px]">
                    {allInquiries.length} Active Leads
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Home builders and site contractors are requesting structural drawings, 3D plans, MEP, and site audits.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const myPro = professionals.find(
                  (p) =>
                    p.id === currentUser.id ||
                    (currentUser.name && p.name.toLowerCase().includes(currentUser.name.toLowerCase()))
                ) || professionals[0];
                setViewInquiriesPro(myPro);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center shrink-0 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Review Incoming Customer Inquiries</span>
            </button>
          </div>
        )}

        {/* Filter categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedSpec === spec
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Fetching verified engineers & architects...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {professionals.map((pro) => {
              const photo = pro.avatarUrl || pro.profilePic;
              const samples = pro.portfolioProjects || [];
              return (
                <div
                  key={pro.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header with Engineer Profile Pic */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-semibold text-emerald-700 truncate">
                            {pro.registrationNumber}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                          {pro.name}
                        </h3>
                        <div className="text-xs text-amber-800 font-medium truncate">{pro.title}</div>
                      </div>

                      {/* Interactive Profile Photo Container */}
                      <div className="relative shrink-0 group">
                        {photo ? (
                          <div className="relative">
                            <img
                              src={photo}
                              alt={pro.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                            />
                            <div
                              className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-white shadow-xs"
                              title="Verified Engineer / Architect"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-base text-slate-700">
                            {pro.name.split(' ')[1]?.[0] || 'E'}
                          </div>
                        )}

                        {/* Quick Change Profile Pic button on hover */}
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoEditor(pro)}
                          className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                          title="Change Profile Picture"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] font-bold mt-0.5">Edit Pic</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Button to update photo directly */}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">{pro.experienceYears} Years Exp · {pro.completedProjects} Sites</span>
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoEditor(pro)}
                        className="font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{photo ? 'Update Pic' : 'Add Profile Pic'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {pro.bio}
                    </p>

                    {/* Core Deliverables Pricing Matrix */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Core Deliverables Pricing</span>
                        <span className="text-emerald-700 font-semibold lowercase">fixed quote</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-slate-500 text-[10px] truncate">Structural Drawings</span>
                          <span className="font-bold text-slate-900 mt-0.5">₹{pro.structuralDrawingsRate || 12500}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-slate-500 text-[10px] truncate">3D Arch Plans</span>
                          <span className="font-bold text-slate-900 mt-0.5">₹{pro.architecturalPlansRate || 18000}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-slate-500 text-[10px] truncate">MEP Designs</span>
                          <span className="font-bold text-slate-900 mt-0.5">₹{pro.mepDesignsRate || 9500}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                          <span className="text-slate-500 text-[10px] truncate">Site Audits</span>
                          <span className="font-bold text-slate-900 mt-0.5">₹{pro.siteAuditsRate || 4500}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Project Drawings & Blueprints Preview Strip */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-amber-50/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Layers className="w-3.5 h-3.5 text-amber-700" />
                          <span>Project Samples & Blueprints ({samples.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddSampleProId(pro.id);
                            setNewSampleTitle('');
                            setNewSampleImageUrl('');
                          }}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Sample</span>
                        </button>
                      </div>

                      {samples.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            {samples.slice(0, 3).map((sample) => (
                              <div
                                key={sample.id}
                                onClick={() => {
                                  setPortfolioModalPro(pro);
                                  setActiveSamplePic(sample);
                                }}
                                className="group/item relative h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-xs hover:border-amber-500 transition-all"
                              >
                                <img
                                  src={sample.imageUrl}
                                  alt={sample.title}
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                                  <span className="text-[8px] font-semibold text-white truncate drop-shadow-xs">
                                    {sample.category}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPortfolioModalPro(pro);
                              setActiveSamplePic(samples[0]);
                            }}
                            className="w-full py-1 text-[11px] font-semibold text-slate-700 hover:text-amber-800 flex items-center justify-center gap-1 hover:bg-amber-100/50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View All Drawings & Plans ({samples.length})</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-[11px] text-slate-400">
                          <span>No sample drawings uploaded yet.</span>
                          <button
                            type="button"
                            onClick={() => setAddSampleProId(pro.id)}
                            className="block mx-auto mt-1 text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                          >
                            + Upload first sample picture
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action & Inquiry Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Direct Contact & Inbound Leads Row */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewInquiriesPro(pro)}
                        className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-[11px] rounded-lg border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="View customer contacts & inquiries for this engineer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">
                          Client Contacts (
                          {
                            allInquiries.filter(
                              (i) =>
                                i.professionalId === pro.id ||
                                i.professionalId === `pro_${pro.id}` ||
                                (i.professionalName && pro.name && i.professionalName.toLowerCase().includes(pro.name.toLowerCase())) ||
                                pro.id === 'pro_01'
                            ).length
                          }
                          )
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setContactModalPro(pro);
                          setInquiryServiceType('structural_drawings');
                          setInquiryCustomerName(currentUser?.name || '');
                          setInquiryCustomerPhone(currentUser?.phone || '');
                          setInquiryCustomerEmail(currentUser?.email || '');
                          setInquiryCustomerCity(currentUser?.city || 'Bengaluru');
                        }}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-[11px] rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Contact engineer directly with your project requirements"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">Contact / Inquire</span>
                      </button>
                    </div>

                    {/* Booking CTA Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPortfolioModalPro(pro);
                          setActiveSamplePic(samples[0] || null);
                        }}
                        className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Portfolio</span>
                      </button>
                      <button
                        onClick={() => {
                          setBookingModal(pro);
                          setServiceType('structural_drawings');
                        }}
                        className="flex-2 py-2 px-3 bg-slate-900 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Order / Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Update / Add Engineer Profile Picture */}
        {photoModalPro && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold">Add Engineer Profile Picture</h3>
                    <div className="text-xs text-slate-300">
                      {photoModalPro.name} · {photoModalPro.registrationNumber}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoModalPro(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Current Live Preview */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative shrink-0">
                    {selectedPhotoUrl ? (
                      <img
                        src={selectedPhotoUrl}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-4 border-amber-500 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-500">
                        <UserIcon className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 p-1 bg-emerald-600 text-white rounded-full border-2 border-white">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{photoModalPro.name}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">{photoModalPro.title}</p>
                    <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>COA / IEI Verified Professional</span>
                    </div>
                  </div>
                </div>

                {/* Option 1: Upload from PC */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                    <span>Upload Picture from Computer / Phone</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-amber-50/30 transition-colors">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-700">Choose Profile Photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 3MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Option 2: Direct Image URL */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    Or Enter Direct Photo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customPhotoInput}
                      onChange={(e) => setCustomPhotoInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPhotoInput.trim()) {
                          setSelectedPhotoUrl(customPhotoInput.trim());
                          showToast('Photo URL Applied', 'Preview updated.', 'info');
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Option 3: Quick Pick Verified Headshot Presets */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick-Pick Verified Engineer & Architect Headshots</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ENGINEER_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoUrl(preset.url)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          selectedPhotoUrl === preset.url
                            ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] text-slate-900 truncate">
                            {preset.tag}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate">Preset #{idx + 1}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPhotoModalPro(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingPhoto || !selectedPhotoUrl}
                    onClick={handleSaveProfilePic}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingPhoto ? 'Saving...' : 'Save Profile Picture'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Consultation Modal */}
        {bookingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {bookingModal.avatarUrl || bookingModal.profilePic ? (
                    <img
                      src={bookingModal.avatarUrl || bookingModal.profilePic}
                      alt={bookingModal.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                      {bookingModal.name.split(' ')[1]?.[0] || 'E'}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                      Book Professional Appointment
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {bookingModal.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span>{bookingModal.title}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{bookingModal.registrationNumber}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setBookingModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                {/* Service Type Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Select Required Deliverable / Service Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setServiceType('structural_drawings')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === 'structural_drawings'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Structural Drawings</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.structuralDrawingsRate || 12500} · RCC Framing & CAD
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('3d_architectural_plans')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === '3d_architectural_plans'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">3D Architectural Plans</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.architecturalPlansRate || 18000} · Elevations & 3D Render
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('mep_designs')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === 'mep_designs'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">MEP Engineering Designs</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.mepDesignsRate || 9500} · Plumbing & Electrical
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('site_audits')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === 'site_audits'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Site Structural Audit</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.siteAuditsRate || 4500} · Rebar & Concrete Inspection
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('online_consultation')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === 'online_consultation'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Video className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">1:1 Video Consultation</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.consultationFee} · 45 mins session
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceType('site_inspection')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        serviceType === 'site_inspection'
                          ? 'border-amber-600 bg-amber-50/70 text-slate-900 font-semibold ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Site Physical Inspection</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ₹{bookingModal.siteVisitFee} · On-site visit
                      </div>
                    </button>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Preferred Date / Delivery Deadline
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Time Slot / Review Window
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                      <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                      <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                </div>

                {(serviceType === 'site_inspection' || serviceType === 'site_audits') && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Site Physical Address / Location
                    </label>
                    <input
                      type="text"
                      required
                      value={siteLocation}
                      onChange={(e) => setSiteLocation(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Scope / Drawing Specifications
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="E.g., G+3 RCC framed structure, plot size 40x60, soil type gravel, architectural CAD file attached."
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center font-bold">
                  <span>Deliverable / Consultation Fee:</span>
                  <span className="text-amber-700 text-sm tabular-nums">
                    ₹{getBookingFee(bookingModal, serviceType)}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModal(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Order & Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Portfolio & Sample Drawings Lightbox */}
        {portfolioModalPro && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold">
                      {portfolioModalPro.name} · Project Samples & Blueprints
                    </h3>
                    <div className="text-xs text-slate-300">
                      {portfolioModalPro.title} · {portfolioModalPro.registrationNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddSampleProId(portfolioModalPro.id);
                      setNewSampleTitle('');
                      setNewSampleImageUrl('');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project Sample</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortfolioModalPro(null)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Active Sample Featured View */}
                {activeSamplePic && (
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                    <div className="relative aspect-video max-h-96 w-full bg-black flex items-center justify-center">
                      <img
                        src={activeSamplePic.imageUrl}
                        alt={activeSamplePic.title}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded font-semibold border border-white/20">
                        {activeSamplePic.category}
                      </div>
                      <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-xs px-2.5 py-1 rounded font-bold shadow-xs">
                        {activeSamplePic.projectType}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{activeSamplePic.title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">{activeSamplePic.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const cat = activeSamplePic.category.toLowerCase();
                            let st: any = 'structural_drawings';
                            if (cat.includes('3d') || cat.includes('arch')) st = '3d_architectural_plans';
                            else if (cat.includes('mep')) st = 'mep_designs';
                            else if (cat.includes('audit')) st = 'site_audits';
                            setBookingModal(portfolioModalPro);
                            setServiceType(st);
                            setPortfolioModalPro(null);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                        >
                          Order This Deliverable
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMarketplaceSample(portfolioModalPro.id, activeSamplePic.id)
                          }
                          className="p-2 text-rose-400 hover:bg-rose-900/30 rounded-lg cursor-pointer"
                          title="Delete Sample Picture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Samples Thumbnails Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                    <span>
                      All Uploaded Samples ({(portfolioModalPro.portfolioProjects || []).length})
                    </span>
                    <span className="text-[11px] text-slate-500 lowercase font-normal">
                      click thumbnail to enlarge
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(portfolioModalPro.portfolioProjects || []).map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => setActiveSamplePic(sample)}
                        className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          activeSamplePic?.id === sample.id
                            ? 'border-amber-500 ring-2 ring-amber-400 shadow-md'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="aspect-4/3 w-full bg-slate-100">
                          <img
                            src={sample.imageUrl}
                            alt={sample.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2 bg-white text-left">
                          <div className="text-[10px] font-bold text-amber-800 truncate">
                            {sample.category}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-900 truncate">
                            {sample.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Project Sample Picture for Engineers */}
        {addSampleProId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold">Add Project Sample Picture</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddSampleProId(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMarketplaceSample} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Project Drawing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G+4 RCC Frame & Column Reinforcement Plan"
                    value={newSampleTitle}
                    onChange={(e) => setNewSampleTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Category</label>
                    <select
                      value={newSampleCategory}
                      onChange={(e) => setNewSampleCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="Structural Drawings">Structural Drawings</option>
                      <option value="3D Architectural Plans">3D Architectural Plans</option>
                      <option value="MEP Designs">MEP Designs</option>
                      <option value="Site Audits">Site Audits</option>
                      <option value="Civil Execution">Civil Execution</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Project Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Residential Villa"
                      value={newSampleType}
                      onChange={(e) => setNewSampleType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Description & Specs</label>
                  <textarea
                    rows={2}
                    placeholder="E.g. Full STAAD Pro analysis, slab schedules, bending moments, and tie beam detailing."
                    value={newSampleDesc}
                    onChange={(e) => setNewSampleDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                {/* Upload or URL */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                    <span>Upload Sample Drawing / Render from Device</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-amber-50/30 transition-colors">
                    <Camera className="w-5 h-5 text-slate-400 mb-0.5" />
                    <span className="font-bold text-slate-700">Choose Drawing / Photo</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP auto-compressed</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSamplePicUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Or Enter Direct Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newSampleImageUrl}
                    onChange={(e) => setNewSampleImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                {/* 1-Click Drawing Presets */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Or Pick from Verified Blueprint / Render Presets</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {SAMPLE_DRAWING_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewSampleTitle(preset.title);
                          setNewSampleCategory(preset.category as any);
                          setNewSampleType(preset.projectType);
                          setNewSampleDesc(preset.desc);
                          setNewSampleImageUrl(preset.url);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                          newSampleImageUrl === preset.url
                            ? 'border-amber-600 bg-amber-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[10px] text-slate-900 truncate">
                            {preset.title}
                          </div>
                          <div className="text-[9px] text-amber-800 truncate">{preset.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {newSampleImageUrl && (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <img
                      src={newSampleImageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded object-cover shrink-0 border"
                    />
                    <div className="min-w-0 text-[11px]">
                      <span className="font-bold text-emerald-700">Image Attached</span>
                      <p className="text-slate-500 truncate">{newSampleTitle || 'Sample project image'}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddSampleProId(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingSample || !newSampleImageUrl}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{addingSample ? 'Saving...' : 'Add Sample to Portfolio'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Direct Customer Contact & Project Inquiry */}
        {contactModalPro && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded-xl text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Contact {contactModalPro.name}</h3>
                    <p className="text-xs text-slate-300">
                      {contactModalPro.title} · {contactModalPro.registrationNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalPro(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendDirectInquiry} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 leading-relaxed text-[11px]">
                  Submit your contact details and drawing scope below. The engineer will receive your phone number and project requirements directly in their profile list to contact you.
                </div>

                {/* Customer Contact Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={inquiryCustomerName}
                      onChange={(e) => setInquiryCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98201 44521"
                      value={inquiryCustomerPhone}
                      onChange={(e) => setInquiryCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. vikram@gmail.com"
                      value={inquiryCustomerEmail}
                      onChange={(e) => setInquiryCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Site City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      value={inquiryCustomerCity}
                      onChange={(e) => setInquiryCustomerCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* Service Type / Deliverable */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Required Deliverable</label>
                    <select
                      value={inquiryServiceType}
                      onChange={(e) => setInquiryServiceType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="structural_drawings">Structural Drawings (RCC/CAD)</option>
                      <option value="3d_architectural_plans">3D Architectural Plans</option>
                      <option value="mep_designs">MEP Engineering Designs</option>
                      <option value="site_audits">Site Structural Audit</option>
                      <option value="online_consultation">1:1 Video Consultation</option>
                      <option value="site_inspection">Physical Site Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Project Urgency</label>
                    <select
                      value={inquiryUrgency}
                      onChange={(e) => setInquiryUrgency(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="Standard">Standard (Within 1 week)</option>
                      <option value="Urgent (Within 48h)">Urgent (Within 48h)</option>
                      <option value="Immediate Site Issue">Immediate Site Issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Site Plot / Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot #84, HSR Layout Sector 2, Bengaluru"
                    value={inquirySiteLocation}
                    onChange={(e) => setInquirySiteLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Project Scope & Questions</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe building type (e.g. G+3 villa, plot size 30x50, soil type, required drawings)..."
                    value={inquiryScope}
                    onChange={(e) => setInquiryScope(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">Estimated Rate:</span>
                  <span className="text-amber-800 font-extrabold text-sm tabular-nums">
                    ₹{getBookingFee(contactModalPro, inquiryServiceType).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setContactModalPro(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{inquirySubmitting ? 'Transmitting...' : 'Send Inquiry to Engineer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Incoming Customer Inquiries for Engineer */}
        {viewInquiriesPro && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-xl text-slate-950 font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      Customer Inquiries & Contacts for {viewInquiriesPro.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {viewInquiriesPro.title} · {viewInquiriesPro.registrationNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewInquiriesPro(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Status Tabs */}
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setViewInquiriesFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                        viewInquiriesFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st === 'all' ? 'All Inquiries' : st === 'scheduled' ? 'New / Scheduled' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Filtered Inquiries for this Engineer */}
                {(() => {
                  const filtered = allInquiries.filter((inq) => {
                    const matchPro =
                      inq.professionalId === viewInquiriesPro.id ||
                      inq.professionalId === `pro_${viewInquiriesPro.id}` ||
                      (inq.professionalName && viewInquiriesPro.name && inq.professionalName.toLowerCase().includes(viewInquiriesPro.name.toLowerCase())) ||
                      viewInquiriesPro.id === 'pro_01';
                    const matchStatus = viewInquiriesFilter === 'all' || inq.status === viewInquiriesFilter;
                    return matchPro && matchStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div className="font-semibold text-slate-700">No Inquiries Found for this Filter</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Customers who submit direct inquiries or book structural deliverables will appear here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {filtered.map((inq) => (
                        <div
                          key={inq.id}
                          className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{inq.customerName}</h4>
                                <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border">
                                  {inq.bookingNumber}
                                </span>
                                {inq.urgency && inq.urgency !== 'Standard' && (
                                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                                    {inq.urgency}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Site: {inq.siteLocation || 'Bengaluru'} · Received {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 tabular-nums">
                                ₹{inq.fee.toLocaleString('en-IN')}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  inq.status === 'scheduled'
                                    ? 'bg-amber-100 text-amber-900'
                                    : inq.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-900'
                                    : inq.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {inq.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Customer Contact Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Phone</span>
                                <span className="font-bold text-slate-800 text-[11px]">{inq.customerPhone || '+91 98201 44521'}</span>
                              </div>
                              <div className="flex gap-1">
                                <a
                                  href={`tel:${inq.customerPhone || '+919820144521'}`}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                  title="Call"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${(inq.customerPhone || '919820144521').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hello ${inq.customerName}, following up on your BuildNiva inquiry (${inq.bookingNumber}).`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Email</span>
                                <span className="font-bold text-slate-800 text-[11px] truncate">{inq.customerEmail || 'customer@buildconnect.in'}</span>
                              </div>
                              <a
                                href={`mailto:${inq.customerEmail || 'customer@buildconnect.in'}`}
                                className="p-1 bg-slate-800 text-white rounded cursor-pointer"
                                title="Email"
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          {/* Scope */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-[10px] text-amber-800 uppercase block mb-0.5">
                              {inq.serviceType.replace(/_/g, ' ')}
                            </span>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              "{inq.projectDescription}"
                            </p>
                          </div>

                          {/* Status Actions */}
                          <div className="flex justify-end gap-2 pt-1">
                            {inq.serviceType === 'online_consultation' && (
                              <a
                                href={inq.meetingLink || 'https://meet.google.com/bld-cnct-eng'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded flex items-center gap-1 cursor-pointer"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Meet</span>
                              </a>
                            )}
                            {inq.status === 'scheduled' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMarketplaceInquiryStatus(inq.id, 'in_progress')}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded cursor-pointer shadow-xs"
                              >
                                Accept & Start
                              </button>
                            )}
                            {inq.status === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMarketplaceInquiryStatus(inq.id, 'completed')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded cursor-pointer shadow-xs"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewInquiriesPro(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
