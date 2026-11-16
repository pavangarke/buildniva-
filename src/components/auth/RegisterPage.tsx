import React, { useState } from 'react';
import {
  Building2,
  Truck,
  HardHat,
  Wrench,
  Compass,
  UserCheck,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  MapPin,
  Mail,
  Phone,
  User as UserIcon,
  AlertCircle,
  Briefcase,
  Store,
  Layers,
  Camera,
  UploadCloud,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, UserRole } from '../../types/index.js';
import { api } from '../../services/api.js';
import { compressImageFile } from '../../utils/imageCompressor.js';
import { BrandLogo } from '../common/BrandLogo.js';

interface RegisterPageProps {
  onSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  tagline: string;
  icon: React.ElementType;
  badge: string;
  color: string;
  spritePos?: string;
  imageUrl?: string;
}

const ROLES_SPRITE_URL = '/assets/aistudio/Construction_Marketplace_Roles_Grid_393fe3c9.png';

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'customer',
    title: 'Customer',
    tagline: 'Order construction materials, rent machinery, and track site deliveries.',
    icon: UserIcon,
    badge: 'Zero Onboarding Fee',
    color: 'border-blue-600 ring-2 ring-blue-100',
    spritePos: '32% 4%',
  },
  {
    role: 'vendor',
    title: 'Material Supplier / Yard Owner',
    tagline: 'Sell cement, TMT steel, aggregates, bricks & sand directly to builders across India.',
    icon: Store,
    badge: 'Merchant Supplier Studio',
    color: 'border-blue-600 ring-2 ring-blue-100',
    spritePos: '99% 4%',
  },
  {
    role: 'equipment_provider',
    title: 'Equipment Rental Business',
    tagline: 'List JCBs, excavators, transit mixers, boom placers, and tower cranes for site hire.',
    icon: Wrench,
    badge: 'Operator + Fuel Options',
    color: 'border-blue-600 ring-2 ring-blue-100',
    spritePos: '31% 96%',
  },
  {
    role: 'professional',
    title: 'Civil Engineer / Architect',
    tagline: 'Offer structural drawings, 3D architectural plans, MEP designs, and site audits.',
    icon: Compass,
    badge: 'Drawings, 3D Plans & Audits',
    color: 'border-blue-600 ring-2 ring-blue-100',
    spritePos: '98% 96%',
  },
  {
    role: 'contractor',
    title: 'General / Turnkey Contractor',
    tagline: 'Bid on residential & commercial turnkey construction, RCC framing, and finishing tenders.',
    icon: HardHat,
    badge: 'Escrow Milestone Payouts',
    color: 'border-blue-600 ring-2 ring-blue-100',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  },
  {
    role: 'labourer',
    title: 'Construction Worker / Mason / Crew',
    tagline: 'Find verified daily wage and contract work for masons, bar-benders, carpenters & painters.',
    icon: Layers,
    badge: 'Direct Daily Wage Payouts',
    color: 'border-blue-600 ring-2 ring-blue-100',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80',
  },
  {
    role: 'delivery_agent',
    title: 'Logistics & Tipper Transport',
    tagline: 'Transport bulk sand, gravel, steel, and cement bags with live GPS consignment tracking.',
    icon: Truck,
    badge: 'Fast Fleet Settlements',
    color: 'border-blue-600 ring-2 ring-blue-100',
    imageUrl: '/assets/aistudio/Construction_Logistics_Map_Planning_c8a77ad8.png',
  },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: 'Bengaluru',
    pincode: '560001',
    businessName: '',
    businessType: 'Private Limited',
    gstin: '',
    panNumber: '',
    tradeLicenseNumber: '',
    // Bank Details
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    // Professional details
    specialization: 'Structural Engineering',
    registrationNumber: '',
    experienceYears: 5,
    consultationFee: 1500,
    structuralDrawingsRate: 12500,
    architecturalPlansRate: 18000,
    mepDesignsRate: 9500,
    siteAuditsRate: 4500,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    // Labour details
    trade: 'Mason (Mistri)',
    dailyRateOffered: 950,
    crewSize: 4,
    // Delivery details
    vehicleType: '16-Ton Multi-Axle Tipper',
    vehicleRegistration: 'KA 01 EK 9482',
    loadCapacityTons: 16,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.85);
      handleInputChange('avatarUrl', compressedDataUrl);
    } catch {
      setErrorMsg('Failed to process image. Please try a different photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg('Please complete your full name, email, and mobile phone number.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Please enter a password with at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: selectedRole,
        city: formData.city,
        pincode: formData.pincode,
        avatarUrl: formData.avatarUrl,
        profilePic: formData.avatarUrl,
      };

      if (['vendor', 'equipment_provider', 'contractor'].includes(selectedRole)) {
        payload.businessName = formData.businessName || `${formData.name} Enterprises`;
        payload.businessType = formData.businessType;
        payload.gstin = formData.gstin.trim() || '29AAAAA0000A1Z5';
        payload.panNumber = formData.panNumber.trim() || 'ABCDE1234F';
        payload.tradeLicenseNumber = formData.tradeLicenseNumber.trim();
        payload.bankDetails = {
          accountName: formData.accountName || formData.businessName || formData.name,
          accountNumber: formData.accountNumber || '912384729182',
          ifscCode: formData.ifscCode || 'HDFC0001234',
          bankName: formData.bankName || 'HDFC Bank',
        };
      }

      if (selectedRole === 'professional') {
        payload.specialization = formData.specialization;
        payload.registrationNumber = formData.registrationNumber || 'IEI-CIV-2024-892';
        payload.experienceYears = Number(formData.experienceYears) || 5;
        payload.consultationFee = Number(formData.consultationFee) || 1500;
        payload.structuralDrawingsRate = Number(formData.structuralDrawingsRate) || 12500;
        payload.architecturalPlansRate = Number(formData.architecturalPlansRate) || 18000;
        payload.mepDesignsRate = Number(formData.mepDesignsRate) || 9500;
        payload.siteAuditsRate = Number(formData.siteAuditsRate) || 4500;
        payload.avatarUrl = formData.avatarUrl;
        payload.profilePic = formData.avatarUrl;
      }

      if (selectedRole === 'delivery_agent') {
        payload.vehicleType = formData.vehicleType;
        payload.vehicleRegistration = formData.vehicleRegistration;
        payload.loadCapacityTons = Number(formData.loadCapacityTons) || 10;
      }

      const res = await api.register(payload);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateToHome}
            className="text-sm font-medium text-slate-600 hover:text-amber-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            ← Back to Marketplace
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Already registered on BuildNiva?</span>
            <button
              onClick={onNavigateToLogin}
              className="px-3.5 py-1.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center mb-10">
          <BrandLogo size="xl" className="border-amber-200 shadow-md mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5 text-amber-700" />
            BuildNiva Partner & User Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Join India's Most Trusted Construction Marketplace
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
            Choose your account role below. Suppliers get access to verified catalog management,
            professionals get direct project inquiries & drawings orders, and customers enjoy wholesale pricing.
          </p>
        </div>

        {/* Step 1: Select Your Role Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">Select Your Marketplace Account Type</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLE_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedRole === item.role;
              return (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => setSelectedRole(item.role)}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left transition-all cursor-pointer min-h-[196px] flex items-stretch ${
                    isSelected
                      ? `${item.color} shadow-md`
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  {/* Right Side Visual Scene */}
                  <div className="absolute inset-y-0 right-0 w-[54%] pointer-events-none select-none overflow-hidden">
                    {item.spritePos ? (
                      <div
                        className="w-full h-full bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${ROLES_SPRITE_URL})`,
                          backgroundSize: '400% 222%',
                          backgroundPosition: item.spritePos,
                        }}
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {/* Smooth white feather gradient blending into left content */}
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/85 to-transparent" />
                  </div>

                  {/* Top-Right Selection Checkmark */}
                  {isSelected && (
                    <span className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm ring-2 ring-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}

                  {/* Left Content Column */}
                  <div className="relative z-10 w-[62%] p-5 flex flex-col justify-between bg-gradient-to-r from-white via-white/95 to-transparent">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center mb-3 shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-snug tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                        {item.tagline}
                      </p>
                    </div>

                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-xs text-[11px] font-bold text-slate-800 whitespace-nowrap">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Registration notice</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
                  2
                </span>
                <h3 className="text-lg font-bold text-slate-900">Contact & Login Credentials</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="ramesh@builder.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number (for SMS & OTP updates) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Base City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                    <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="560001"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Password (Min 6 characters) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Section: Vendor / Equipment / Contractor Business & Tax Details */}
            {['vendor', 'equipment_provider', 'contractor'].includes(selectedRole) && (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
                    3
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Business Profile & Commercial KYC (BuildNiva Verified Merchant)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Registered Business / Yard Name *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Karnataka Builders & Aggregates Supply"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Entity Legal Constitution
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="Private Limited Company">Private Limited (Pvt Ltd)</option>
                      <option value="Limited Liability Partnership (LLP)">LLP</option>
                      <option value="Public Limited">Public Limited</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      GSTIN (15 Digits)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 uppercase font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Business PAN (10 Digits)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 uppercase font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Bank Account for Marketplace Payouts */}
                <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Settlement Bank Account (For Automated Order Disbursals)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const mobileDigits = formData.phone.replace(/\D/g, '').slice(-10);
                          if (!formData.accountName && formData.name) {
                            handleInputChange('accountName', formData.name);
                          }
                          if (!formData.accountNumber && mobileDigits.length === 10) {
                            handleInputChange('accountNumber', mobileDigits);
                          }
                          handleInputChange('ifscCode', 'AIRP0000001');
                          handleInputChange('bankName', 'Airtel Payments Bank');
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Use Airtel Payments Bank (AIRP)
                      </button>
                    </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Beneficiary / Account Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name as per Passbook"
                        value={formData.accountName}
                        onChange={(e) => handleInputChange('accountName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="password"
                        placeholder="Current, Savings, or Airtel Mobile No."
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bank IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AIRP0000001 or HDFC0001234"
                        value={formData.ifscCode}
                        onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs uppercase font-mono text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bank Name & Branch
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Airtel Payments Bank or HDFC Bank"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Section: Civil Engineer / Architect */}
            {selectedRole === 'professional' && (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
                    3
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Professional Accreditation & Specialty
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Core Specialization
                    </label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Structural Engineering">Structural Engineering & RCC</option>
                      <option value="Architectural Design">Architectural & 3D Elevations</option>
                      <option value="MEP & HVAC Design">MEP (Mechanical, Electrical, Plumbing)</option>
                      <option value="Geotechnical & Soil">Geotechnical & Foundation Testing</option>
                      <option value="Green Building & BIM">Green Building & BIM Specialist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Council Reg. No (COA / IEI)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CA/2018/98471"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.experienceYears}
                      onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Engineer Profile Photo Upload & Presets */}
                <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Engineer Profile Picture (Visible to Builders)</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified Identity Badge
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Profile Preview"
                          className="w-20 h-20 rounded-full object-cover border-3 border-amber-500 shadow-md ring-2 ring-amber-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-500">
                          <UserIcon className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 p-1 bg-emerald-600 text-white rounded-full border border-white">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="border border-dashed border-slate-300 hover:border-amber-500 bg-white rounded-lg px-3 py-2 text-center cursor-pointer hover:bg-amber-50/40 transition-colors flex items-center justify-center gap-2 flex-1">
                          <UploadCloud className="w-4 h-4 text-amber-600" />
                          <span className="font-semibold text-xs text-slate-700">Upload Photo from PC</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>

                        <input
                          type="url"
                          placeholder="Or paste photo web URL..."
                          value={formData.avatarUrl}
                          onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Quick-Pick Verified Headshots */}
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Quick-Pick Verified Presets:</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {[
                            { label: 'Er. Male 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
                            { label: 'Ar. Female 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
                            { label: 'Er. Male 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
                            { label: 'Er. Female 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInputChange('avatarUrl', p.url)}
                              className={`shrink-0 p-1 rounded-full border-2 transition-all cursor-pointer ${
                                formData.avatarUrl === p.url ? 'border-amber-600 ring-2 ring-amber-400' : 'border-slate-200 hover:border-slate-400'
                              }`}
                              title={p.label}
                            >
                              <img src={p.url} alt={p.label} className="w-7 h-7 rounded-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialized Engineering & Architecture Deliverables */}
                <div className="mt-5 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-sm font-bold text-emerald-950">
                      Core Specialized Offerings (Civil Engineer / Architect)
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800 mb-3">
                    Offer structural drawings, 3D architectural plans, MEP designs, and site audits. Set your default starting price for each deliverable:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Structural Drawings */}
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">Structural Drawings</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">RCC & Seismic</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">RCC framing, beam schedules & foundation loads</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Starting Fee: ₹</span>
                        <input
                          type="number"
                          value={formData.structuralDrawingsRate}
                          onChange={(e) => handleInputChange('structuralDrawingsRate', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* 3D Architectural Plans */}
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">3D Architectural Plans</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">BIM & Elevation</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">Photorealistic 3D elevations & 2D floor layouts</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Starting Fee: ₹</span>
                        <input
                          type="number"
                          value={formData.architecturalPlansRate}
                          onChange={(e) => handleInputChange('architecturalPlansRate', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* MEP Designs */}
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">MEP Designs</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Plumbing & Elect</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">Sanitary risers, electrical routes & HVAC conduits</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Starting Fee: ₹</span>
                        <input
                          type="number"
                          value={formData.mepDesignsRate}
                          onChange={(e) => handleInputChange('mepDesignsRate', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Site Audits */}
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">Site Audits</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Quality Cert</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">Pre-pour rebar inspection & Schmidt hammer audit</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Starting Fee: ₹</span>
                        <input
                          type="number"
                          value={formData.siteAuditsRate}
                          onChange={(e) => handleInputChange('siteAuditsRate', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Section: Delivery Agent / Transport */}
            {selectedRole === 'delivery_agent' && (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs">
                    3
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Fleet Vehicle & Transport Specifications
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Vehicle Type
                    </label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Tata Ace / Mini Tipper (1.5T)">Tata Ace / Mini Tipper (1.5T)</option>
                      <option value="Tata 407 Medium Truck (3.5T)">Tata 407 Medium Truck (3.5T)</option>
                      <option value="16-Ton Multi-Axle Tipper">16-Ton Multi-Axle Tipper</option>
                      <option value="25-Ton Heavy Dumper">25-Ton Heavy Dumper</option>
                      <option value="Flatbed Steel Trailer (30T)">Flatbed Steel Trailer (30T)</option>
                      <option value="Transit Mixer (6 cu.m)">Transit Mixer (6 cu.m)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Commercial RC Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA 01 EK 9482"
                      value={formData.vehicleRegistration}
                      onChange={(e) => handleInputChange('vehicleRegistration', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Payload Capacity (Metric Tons)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="45"
                      value={formData.loadCapacityTons}
                      onChange={(e) => handleInputChange('loadCapacityTons', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Submission */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All onboarding records comply with GST Council & Indian Construction Standards.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
