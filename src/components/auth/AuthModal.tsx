import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, LogOut, ArrowRight, ShieldCheck, MapPin, Phone, Mail, Building2, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { UserRole } from '../../types/index.js';
import { BrandLogo } from '../common/BrandLogo.js';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, currentUser, setCurrentUser, logout, showToast, refreshUsers, activeTab, setActiveTab } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560001');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('Bengaluru');
  const [editPincode, setEditPincode] = useState('');

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditPhone(currentUser.phone || '');
      setEditCity(currentUser.city || 'Bengaluru');
      setEditPincode(currentUser.pincode || '');
    } else {
      setEditingProfile(false);
    }
  }, [currentUser, authModalOpen]);

  if (!authModalOpen) return null;

  const resetForm = () => {
    setFormError(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const navigateToUserWorkspace = () => {
    if (!currentUser) return;
    if (currentUser.role === 'customer') {
      setActiveTab('customer_dashboard');
    } else if (currentUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
    setAuthModalOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await api.login(email.trim(), password);
      setCurrentUser(res.user);
      showToast('Welcome back!', `Signed in as ${res.user.name}`, 'success');
      resetForm();
      setAuthModalOpen(false);
      if (res.user.role === 'admin') {
        setActiveTab('admin');
      } else if (res.user.role === 'customer') {
        if (['dashboard', 'admin', 'register'].includes(activeTab)) {
          setActiveTab('customer_dashboard');
        }
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password';
      setFormError(msg);
      showToast('Sign In Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        businessName: role !== 'customer' ? businessName.trim() : undefined,
        city,
        pincode: pincode.trim(),
      });
      setCurrentUser(res.user);
      showToast('Account Created', `Signed in as ${res.user.name} (${role.replace('_', ' ')})`, 'success');
      await refreshUsers();
      resetForm();
      setAuthModalOpen(false);
      if (res.user.role === 'customer') {
        setActiveTab('customer_dashboard');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Registration failed';
      setFormError(msg);
      showToast('Registration Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    try {
      await logout();
      resetForm();
      setEditingProfile(false);
      setAuthModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        pincode: editPincode.trim(),
      });
      setCurrentUser(res.user);
      setEditingProfile(false);
      showToast('Profile Updated', 'Your name, phone, and city details have been updated.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Could not update profile';
      setFormError(msg);
      showToast('Update Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 text-xs">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                BuildNiva Account
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {currentUser
                  ? 'Signed-In Account'
                  : isRegistering
                  ? 'Create Your Account'
                  : 'Sign In to BuildNiva'}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setAuthModalOpen(false);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
                {formError}
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Edit Account Details
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">City Hub</label>
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                      <option value="Chennai">Chennai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setEditingProfile(false);
                    }}
                    className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {currentUser.role.replace('_', ' ')} · {currentUser.verificationStatus.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setEditingProfile(true);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 text-[11px] whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {currentUser.city} — {currentUser.pincode}
                    </span>
                  </div>
                  {currentUser.businessName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{currentUser.businessName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={navigateToUserWorkspace}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>
                  {currentUser.role === 'customer'
                    ? 'My Orders & Projects'
                    : currentUser.role === 'admin'
                    ? 'Admin Console'
                    : 'Partner Portal'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSignOut}
                className="py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
                {formError}
              </div>
            )}

            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {submitting ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsRegistering(true);
                    }}
                    className="text-amber-700 hover:underline font-semibold cursor-pointer"
                  >
                    Create a new account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setAuthModalOpen(false);
                      setActiveTab('register');
                    }}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Partner KYC Onboarding →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Mobile (+91)</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Account Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Material Vendor</option>
                      <option value="equipment_provider">Equipment Rental Provider</option>
                      <option value="professional">Engineer or Architect</option>
                      <option value="labourer">Construction Worker</option>
                      <option value="contractor">Contractor Company</option>
                      <option value="delivery_agent">Delivery Agent</option>
                    </select>
                  </div>
                </div>

                {role !== 'customer' && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Business / Firm Name</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">City Hub</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                      <option value="Chennai">Chennai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Password is encrypted and required on future logins.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsRegistering(false);
                    }}
                    className="text-slate-600 hover:underline font-medium cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
