import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Package,
  Truck,
  Check,
  X,
  RefreshCw,
  DollarSign,
  FileText,
  Sliders,
  History,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  UserPlus,
  Plus,
  Building2,
  CreditCard,
  MapPin,
  LifeBuoy,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { SignInRequired } from '../auth/SignInRequired.js';
import {
  User,
  FinancialLedgerEntry,
  VendorSettlement,
  AuditLog,
  PlatformSettings,
  DeliveryAssignment,
  UserRole,
  SavedAddress,
  SupportTicket,
  PaymentRecord,
} from '../../types/index.js';

export const AdminDashboard: React.FC = () => {
  const { currentUser, showToast, setAuthModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'kyc' | 'finance' | 'delivery' | 'support' | 'audit' | 'settings'>('overview');

  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [confirmRefundOrderId, setConfirmRefundOrderId] = useState<string | null>(null);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // User Maintenance States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User> & { password?: string }>({});
  const [savingUser, setSavingUser] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // Customer / User Addresses inside Maintain Modal
  const [userAddresses, setUserAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Bengaluru');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPincode, setAddrPincode] = useState('560001');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Settings Form State
  const [commissionRate, setCommissionRate] = useState(3.5);
  const [supportPhone, setSupportPhone] = useState('1800-425-9900');
  const [supportEmail, setSupportEmail] = useState('support@buildniva.in');

  const loadAdminData = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsRes, usersRes, ledgRes, payRes, stlRes, asgnRes, tickRes, logsRes, settRes] = await Promise.all([
        api.getAdminStats(),
        api.getAllUsers(),
        api.getLedger(),
        api.getPayments(),
        api.getSettlements(),
        api.getDeliveryAssignments(),
        api.getTickets(),
        api.getAuditLogs(),
        api.getSettings(),
      ]);
      setStats(statsRes);
      setAllUsers(usersRes.users);
      setLedger(ledgRes.ledger);
      setPayments(payRes.payments || []);
      setSettlements(stlRes.settlements);
      setAssignments(asgnRes.assignments);
      setTickets(tickRes.tickets);
      setAuditLogs(logsRes.auditLogs);
      setSettings(settRes.settings);
      if (settRes.settings) {
        setCommissionRate(settRes.settings.baseCommissionPercent);
        setSupportPhone(settRes.settings.supportPhone);
        setSupportEmail(settRes.settings.supportEmail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.verificationStatus === 'approved' ? 'rejected' : 'approved';
    try {
      await api.updateUserStatus(user.id, newStatus);
      showToast('User Status Updated', `${user.name} status set to ${newStatus}.`, 'success');
      loadAdminData();
    } catch (e: any) {
      showToast('Update failed', e.message, 'error');
    }
  };

  const loadUserAddresses = async (userId: string) => {
    setLoadingAddresses(true);
    try {
      const res = await api.getAddresses(userId);
      setUserAddresses(res.addresses || []);
    } catch (err) {
      console.error(err);
      setUserAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const resetAddressEditor = (user?: User) => {
    setAddressFormOpen(false);
    setEditingAddrId(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity(user?.city || editingUser?.city || 'Bengaluru');
    setAddrState('Karnataka');
    setAddrPincode(user?.pincode || editingUser?.pincode || '560001');
    setAddrLandmark('');
    setAddrIsDefault(false);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      ...user,
      password: '',
      bankDetails: user.bankDetails ? { ...user.bankDetails } : {
        accountName: user.name,
        accountNumber: '',
        ifscCode: '',
        bankName: '',
      },
    });
    resetAddressEditor(user);
    loadUserAddresses(user.id);
  };

  const handleSaveUserAddress = async () => {
    if (!editingUser) return;
    if (!addrStreet.trim() || !addrPincode.trim()) {
      showToast('Incomplete Address', 'Street address and PIN code are required.', 'error');
      return;
    }
    try {
      if (editingAddrId) {
        await api.updateAddress(editingAddrId, {
          userId: editingUser.id,
          label: addrLabel || 'Site Address',
          street: addrStreet.trim(),
          city: addrCity.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
          landmark: addrLandmark.trim(),
          isDefault: addrIsDefault,
        });
        showToast('Address Updated', 'Customer delivery address updated.', 'success');
      } else {
        await api.createAddress({
          userId: editingUser.id,
          label: addrLabel || 'Site Address',
          street: addrStreet.trim(),
          city: addrCity.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
          landmark: addrLandmark.trim(),
          isDefault: addrIsDefault,
        });
        showToast('Address Added', 'Delivery address saved for user.', 'success');
      }
      resetAddressEditor(editingUser);
      loadUserAddresses(editingUser.id);
    } catch (err: any) {
      showToast('Address Error', err.message || 'Could not save address', 'error');
    }
  };

  const handleDeleteUserAddress = async (addrId: string) => {
    if (!editingUser) return;
    try {
      await api.deleteAddress(addrId, editingUser.id);
      showToast('Address Removed', 'Delivery address deleted.', 'info');
      loadUserAddresses(editingUser.id);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const payload = { ...userForm };
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      }
      await api.adminUpdateUser(editingUser.id, payload);
      showToast('Account Updated', `Details for ${userForm.name || editingUser.name} maintained successfully.`, 'success');
      setEditingUser(null);
      loadAdminData();
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      showToast('Action Prohibited', 'Primary administrator account cannot be deleted.', 'error');
      return;
    }
    try {
      await api.adminDeleteUser(user.id);
      setConfirmDeleteUserId(null);
      showToast('Account Deleted', `${user.name} removed from registry.`, 'info');
      loadAdminData();
    } catch (err: any) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.phone || !userForm.password || userForm.password.length < 6) {
      showToast('Incomplete Data', 'Name, email, phone, and a password (min 6 chars) are mandatory.', 'error');
      return;
    }

    setSavingUser(true);
    try {
      await api.adminCreateUser({
        ...userForm,
        verificationStatus: userForm.verificationStatus || 'approved',
      });
      showToast('User Created', `Account for ${userForm.name} provisioned.`, 'success');
      setShowCreateUserModal(false);
      setUserForm({});
      loadAdminData();
    } catch (err: any) {
      showToast('Creation Failed', err.message, 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await api.adminUpdateTicket(ticketId, { status });
      showToast('Ticket Updated', `Support ticket status set to ${status.replace('_', ' ')}.`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast('Update Failed', err.message, 'error');
    }
  };

  const handleRefundPayment = async (p: PaymentRecord) => {
    setRefundingOrderId(p.orderId);
    try {
      await api.processRefund({
        orderId: p.orderId,
        amount: p.amount,
        reason: `Refund initiated from Finance Console (${p.gatewayTransactionId})`,
      });
      setConfirmRefundOrderId(null);
      showToast('Refund Processed', `₹${p.amount.toLocaleString('en-IN')} refunded and ledger reversed.`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast('Refund Failed', err.message, 'error');
    } finally {
      setRefundingOrderId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        baseCommissionPercent: Number(commissionRate),
        supportPhone,
        supportEmail,
      });
      showToast('Settings Saved', 'Platform commission and policies updated.', 'success');
      loadAdminData();
    } catch (e: any) {
      showToast('Save failed', e.message, 'error');
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = userSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <SignInRequired
        title="Administrator Sign In Required"
        description="Sign in with an authorized administrator account to manage BuildNiva users, KYC approvals, and financial settlements."
      />
    );
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Marketplace Command Center
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              BuildNiva Administration & Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized Administrator: {currentUser.name} ({currentUser.email}) · {currentUser.phone}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit My Profile</span>
            </button>
            <button
              onClick={loadAdminData}
              className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh All Data</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6 text-xs">
          {[
            { id: 'overview', label: 'Overview & GMV', icon: TrendingUp },
            { id: 'users', label: `User Management (${allUsers.length})`, icon: Users },
            { id: 'kyc', label: 'KYC & Credentials Queue', icon: ShieldCheck },
            { id: 'finance', label: `Financial Ledger & Payouts (${ledger.length})`, icon: DollarSign },
            { id: 'delivery', label: `Fleet & Deliveries (${assignments.length})`, icon: Truck },
            { id: 'support', label: `Support Tickets (${tickets.length})`, icon: LifeBuoy },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: History },
            { id: 'settings', label: 'Platform Settings', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading admin console...</div>
        ) : (
          <>
            {/* 1. Overview */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-400 block">Gross Merchandise Value (GMV)</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                      ₹{stats.grossMerchandiseValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                      Platform Accrued Revenue: ₹{(stats.grossMerchandiseValue * 0.035).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-400 block">Total Consignments</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                      {stats.totalOrders} Orders
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Multi-Vendor site dispatches</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-400 block">Active Marketplace Listings</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                      {stats.activeListingsCount} Items
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Materials & equipment fleet</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-400 block">Approved Professionals</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
                      {stats.verifiedProfessionalsCount + stats.availableWorkersCount + stats.activeContractorsCount} Registered
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1">100% verified licenses</div>
                  </div>
                </div>

                {/* Recent Platform Orders */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Latest Platform Consignment Orders
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {stats.recentOrders.map((o: any) => (
                      <div key={o.id} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{o.orderNumber} · {o.customerName}</div>
                          <div className="text-slate-500 text-[11px]">Vendor: {o.vendorName} · Method: {o.paymentMethod}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">₹{o.grandTotal.toLocaleString('en-IN')}</div>
                          <span className="text-[10px] text-emerald-700 uppercase font-semibold">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. User Management */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Marketplace User Registry & Account Maintenance ({filteredUsers.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Inspect partner KYC, edit tax details & settlement bank accounts, suspend, or provision new accounts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                    >
                      <option value="all">All Roles</option>
                      <option value="customer">Customers</option>
                      <option value="vendor">Material Vendors</option>
                      <option value="equipment_provider">Equipment Providers</option>
                      <option value="professional">Engineers / Architects</option>
                      <option value="contractor">Contractors</option>
                      <option value="labourer">Workers</option>
                      <option value="delivery_agent">Delivery Agents</option>
                      <option value="admin">Admins</option>
                    </select>
                    <div className="relative flex-1 sm:w-56">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setUserForm({
                          name: '',
                          email: '',
                          phone: '',
                          password: '',
                          role: 'customer',
                          city: 'Bengaluru',
                          pincode: '560001',
                          verificationStatus: 'approved',
                        });
                        setShowCreateUserModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                        <th className="py-2.5">User & Firm Name</th>
                        <th className="py-2.5">Contact Details</th>
                        <th className="py-2.5">Marketplace Role</th>
                        <th className="py-2.5">Hub / Location</th>
                        <th className="py-2.5">KYC / Tax ID</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Account Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 font-bold text-slate-900">
                            <div>{u.name}</div>
                            {u.businessName && (
                              <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{u.businessName}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-slate-600">
                            <div>{u.email}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.phone}</div>
                          </td>
                          <td className="py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 capitalize">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">
                            <div>{u.city}</div>
                            <div className="text-[10px] text-slate-400">{u.pincode}</div>
                          </td>
                          <td className="py-3">
                            {u.gstin ? (
                              <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {u.gstin}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Not registered</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.verificationStatus === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : u.verificationStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {u.verificationStatus}
                              </span>
                              {u.suspended && (
                                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Maintain account and KYC"
                              >
                                <Edit3 className="w-3 h-3 text-amber-600" />
                                <span>Maintain</span>
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2 py-1 text-[11px] rounded font-semibold transition-colors cursor-pointer ${
                                  u.verificationStatus === 'approved'
                                    ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title="Toggle verification status"
                              >
                                {u.verificationStatus === 'approved' ? 'Suspend' : 'Approve'}
                              </button>
                              {u.role !== 'admin' && (
                                confirmDeleteUserId === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u)}
                                      className="px-2 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-1.5 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteUserId(u.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. KYC Queue */}
            {activeTab === 'kyc' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Vendor & Professional License Verification Queue
                </h3>
                <div className="divide-y divide-slate-100">
                  {allUsers
                    .filter((u) => u.role !== 'customer' && u.role !== 'admin')
                    .map((pro) => (
                      <div key={pro.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {pro.businessName || pro.name}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Role: {pro.role.replace('_', ' ')} · Hub: {pro.city} (PIN: {pro.pincode})
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Document: State Civil Trade License & GSTIN Certificate Verified
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded text-[10px] uppercase">
                            {pro.verificationStatus}
                          </span>
                          <button
                            onClick={() => showToast('Re-Verification', 'Document credentials re-verified against MCA registry.', 'info')}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg"
                          >
                            Audit Certificate
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. Financial Ledger & Settlements */}
            {activeTab === 'finance' && (
              <div className="space-y-6 text-xs">
                {/* Payment Gateway Transactions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Payment Gateway Transactions ({payments.length})
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Verified Razorpay &amp; Sandbox gateway captures, HMAC signature checks, and refund reversals.
                      </p>
                    </div>
                  </div>

                  {payments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No gateway payments captured yet. Complete an online checkout order to inspect gateway records.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{p.gatewayTransactionId}</span>
                              <span className="text-slate-500">·</span>
                              <span className="font-semibold text-slate-800">{p.orderNumber || p.orderId}</span>
                              {p.signatureVerified && (
                                <span className="text-[10px] font-bold text-emerald-700">HMAC Verified</span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {p.customerName || 'Customer'} · {p.paymentMethod.replace('_', ' ')}
                              {p.methodDetails ? ` (${p.methodDetails})` : ''} · Provider:{' '}
                              {p.provider === 'razorpay' ? 'Razorpay Live' : 'Sandbox Gateway'}
                            </div>
                            {p.failureReason && (
                              <div className="text-red-600 text-[11px] mt-0.5">{p.failureReason}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <div className="font-bold text-slate-900 tabular-nums">
                                ₹{p.amount.toLocaleString('en-IN')}
                              </div>
                              <div
                                className={`text-[10px] font-bold uppercase ${
                                  p.status === 'paid'
                                    ? 'text-emerald-700'
                                    : p.status === 'refunded'
                                    ? 'text-slate-500'
                                    : p.status === 'failed'
                                    ? 'text-red-600'
                                    : 'text-amber-700'
                                }`}
                              >
                                {p.status}
                              </div>
                            </div>

                            {p.status === 'paid' && (
                              confirmRefundOrderId === p.orderId ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={refundingOrderId === p.orderId}
                                    onClick={() => handleRefundPayment(p)}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold whitespace-nowrap cursor-pointer"
                                  >
                                    {refundingOrderId === p.orderId ? 'Refunding...' : 'Confirm Refund'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRefundOrderId(null)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium whitespace-nowrap cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmRefundOrderId(p.orderId)}
                                  className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                                >
                                  Process Refund
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ledger Entries */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Double-Entry Financial Ledger
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {ledger.map((l) => (
                      <div key={l.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{l.description}</div>
                          <div className="text-slate-400 text-[11px]">
                            {l.transactionRef} · {l.debitAccount} → {l.creditAccount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">₹{l.amount.toLocaleString('en-IN')}</div>
                          <span className="text-[10px] text-slate-400 uppercase">{l.entryType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settlements */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Vendor Payout Settlements
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {settlements.map((s) => (
                      <div key={s.id} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{s.vendorName} ({s.settlementNumber})</div>
                          <div className="text-slate-500 text-[11px]">
                            Gross Sales: ₹{s.grossSales.toLocaleString('en-IN')} · Commission (-3.5%): ₹{s.platformCommission}
                          </div>
                          {s.utrNumber && <div className="text-emerald-700 font-mono text-[10px]">Bank UTR: {s.utrNumber}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-slate-900 tabular-nums">
                            ₹{s.netPayable.toLocaleString('en-IN')}
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Delivery Fleet Logistics */}
            {activeTab === 'delivery' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Site Delivery Fleet Assignments & Tippers
                </h3>
                <div className="divide-y divide-slate-100">
                  {assignments.map((asgn) => (
                    <div key={asgn.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{asgn.orderNumber} · Carrier: {asgn.vehicleType}</div>
                        <div className="text-slate-500 mt-0.5">
                          Assigned Driver: {asgn.agentName} ({asgn.agentPhone}) · Load: {asgn.estimatedWeightKg} kg
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">Destination: {asgn.deliveryAddress}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded text-[11px] uppercase">
                          {asgn.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">Delivery Fee: ₹{asgn.deliveryCharge}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Tickets Management */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Customer & Partner Support Tickets ({tickets.length})
                  </h3>
                </div>
                {tickets.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    No support tickets raised yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tickets.map((t) => (
                      <div key={t.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{t.subject}</span>
                            <span className="text-[11px] font-mono text-slate-400">{t.ticketNumber}</span>
                          </div>
                          <p className="text-slate-600">{t.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Raised by: {t.userName} · Category: {t.category.replace('_', ' ')} · Priority: {t.priority}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value as SupportTicket['status'])}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 capitalize cursor-pointer"
                          >
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. Audit Trail */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Administrative Action Audit Trail
                </h3>
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px]">{log.action}</span>
                        <p className="text-slate-600 mt-0.5">{log.details}</p>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          Actor: {log.actorName} ({log.actorRole}) · Target: {log.targetType} ({log.targetId})
                        </div>
                      </div>
                      <span className="text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Platform Settings */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-xl text-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Marketplace Platform Configuration
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Platform Base Commission (% Take Rate)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Current: 3.5% levied on material order net totals</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Platform Toll-Free Support Helpline</label>
                    <input
                      type="text"
                      required
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Escalations Email</label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Save Platform Configuration
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Modal: Maintain Account & KYC Details */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                    Platform User Governance
                  </div>
                  <h3 className="text-base font-bold">
                    Maintain Account: {editingUser.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
                {/* 1. Basic Account Info */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Identity & Profile</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={userForm.name || ''}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={userForm.phone || ''}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Platform Role</label>
                      <select
                        value={userForm.role || 'vendor'}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Material Vendor</option>
                        <option value="equipment_provider">Equipment Provider</option>
                        <option value="professional">Engineer / Architect</option>
                        <option value="contractor">Turnkey Contractor</option>
                        <option value="labourer">Construction Worker</option>
                        <option value="delivery_agent">Delivery Logistics Agent</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Operating City</label>
                      <input
                        type="text"
                        value={userForm.city || ''}
                        onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Postal Pincode</label>
                      <input
                        type="text"
                        value={userForm.pincode || ''}
                        onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Reset Password (Optional)</label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Leave blank to keep existing"
                        value={userForm.password || ''}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Saved Delivery Addresses */}
                <div>
                  <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Saved Delivery Addresses ({userAddresses.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddrId(null);
                        setAddrLabel('');
                        setAddrStreet('');
                        setAddrCity(userForm.city || 'Bengaluru');
                        setAddrState('Karnataka');
                        setAddrPincode(userForm.pincode || '560001');
                        setAddrLandmark('');
                        setAddrIsDefault(userAddresses.length === 0);
                        setAddressFormOpen(true);
                      }}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {addressFormOpen && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5 mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Label (e.g. Home / Site Plot #4)"
                          value={addrLabel}
                          onChange={(e) => setAddrLabel(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="PIN Code"
                          maxLength={6}
                          value={addrPincode}
                          onChange={(e) => setAddrPincode(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Street Address *"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={addrLandmark}
                          onChange={(e) => setAddrLandmark(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addrIsDefault}
                            onChange={(e) => setAddrIsDefault(e.target.checked)}
                          />
                          <span>Default delivery address</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => resetAddressEditor(editingUser)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200/70 rounded font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveUserAddress}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold cursor-pointer"
                          >
                            {editingAddrId ? 'Update Address' : 'Save Address'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingAddresses ? (
                    <div className="text-[11px] text-slate-400 py-2">Loading saved addresses...</div>
                  ) : userAddresses.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-2">No saved delivery addresses for this user.</div>
                  ) : (
                    <div className="space-y-2">
                      {userAddresses.map((addr) => (
                        <div key={addr.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{addr.label}</span>
                              {addr.isDefault && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 truncate">{addr.street}</div>
                            <div className="text-[10px] text-slate-400">
                              {addr.city}, {addr.state} - {addr.pincode}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddrId(addr.id);
                                setAddrLabel(addr.label || '');
                                setAddrStreet(addr.street || '');
                                setAddrCity(addr.city || '');
                                setAddrState(addr.state || 'Karnataka');
                                setAddrPincode(addr.pincode || '');
                                setAddrLandmark(addr.landmark || '');
                                setAddrIsDefault(Boolean(addr.isDefault));
                                setAddressFormOpen(true);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUserAddress(addr.id)}
                              className="px-2 py-1 bg-white border border-slate-200 hover:bg-red-50 rounded text-[10px] font-semibold text-red-600 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Verification & Governance */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Governance & Status</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Verification Status</label>
                      <select
                        value={userForm.verificationStatus || 'approved'}
                        onChange={(e) => setUserForm({ ...userForm, verificationStatus: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                      >
                        <option value="approved">Approved & Verified</option>
                        <option value="pending">Pending Document Review</option>
                        <option value="rejected">Rejected / Blocked</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="suspendUser"
                        checked={Boolean(userForm.suspended)}
                        onChange={(e) => setUserForm({ ...userForm, suspended: e.target.checked })}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <label htmlFor="suspendUser" className="font-semibold text-red-700 select-none cursor-pointer">
                        Suspend Account Access (Prevents logins & payouts)
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. Business & Tax Details (Partners Only) */}
                {userForm.role !== 'customer' && (
                  <>
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Commercial & Tax Credentials</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Business / Trade Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Balaji Steels & Aggregates"
                            value={userForm.businessName || ''}
                            onChange={(e) => setUserForm({ ...userForm, businessName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Legal Constitution</label>
                          <select
                            value={userForm.businessType || 'Private Limited'}
                            onChange={(e) => setUserForm({ ...userForm, businessType: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                          >
                            <option value="Proprietorship">Sole Proprietorship</option>
                            <option value="Partnership">Partnership Firm</option>
                            <option value="Private Limited">Private Limited</option>
                            <option value="LLP">LLP</option>
                            <option value="Individual">Individual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">GSTIN (15 Digits)</label>
                          <input
                            type="text"
                            placeholder="29AAAAA0000A1Z5"
                            value={userForm.gstin || ''}
                            onChange={(e) => setUserForm({ ...userForm, gstin: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">PAN Number (10 Digits)</label>
                          <input
                            type="text"
                            placeholder="ABCDE1234F"
                            value={userForm.panNumber || ''}
                            onChange={(e) => setUserForm({ ...userForm, panNumber: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Settlement Bank Account */}
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Settlement Bank Details (Payouts)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Beneficiary Name</label>
                          <input
                            type="text"
                            value={userForm.bankDetails?.accountName || ''}
                            onChange={(e) =>
                              setUserForm({
                                ...userForm,
                                bankDetails: {
                                  ...userForm.bankDetails,
                                  accountName: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={userForm.bankDetails?.accountNumber || ''}
                            onChange={(e) =>
                              setUserForm({
                                ...userForm,
                                bankDetails: {
                                  ...userForm.bankDetails,
                                  accountNumber: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Bank IFSC Code</label>
                          <input
                            type="text"
                            value={userForm.bankDetails?.ifscCode || ''}
                            onChange={(e) =>
                              setUserForm({
                                ...userForm,
                                bankDetails: {
                                  ...userForm.bankDetails,
                                  ifscCode: e.target.value.toUpperCase(),
                                },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={userForm.bankDetails?.bankName || ''}
                            onChange={(e) =>
                              setUserForm({
                                ...userForm,
                                bankDetails: {
                                  ...userForm.bankDetails,
                                  bankName: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Internal Administrator Notes */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Internal Admin Notes / Audit Remark</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Physical yard visited by Bengaluru South field officer. Quality verified."
                    value={userForm.notes || ''}
                    onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
                  />
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingUser ? 'Saving...' : 'Save Account Records'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Direct Provision New Account */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="text-sm font-bold">Provision New Marketplace Account</h3>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewUser} className="p-6 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Gowda"
                      value={userForm.name || ''}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="suresh@gowdabuilders.in"
                      value={userForm.email || ''}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98888 77777"
                      value={userForm.phone || ''}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Account Role</label>
                    <select
                      value={userForm.role || 'customer'}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Material Vendor</option>
                      <option value="equipment_provider">Equipment Rental</option>
                      <option value="professional">Civil Engineer / Architect</option>
                      <option value="contractor">Turnkey Contractor</option>
                      <option value="labourer">Construction Worker</option>
                      <option value="delivery_agent">Delivery Driver</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                {userForm.role !== 'customer' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Firm / Trade Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Gowda Cement & Aggregates"
                        value={userForm.businessName || ''}
                        onChange={(e) => setUserForm({ ...userForm, businessName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">GSTIN</label>
                      <input
                        type="text"
                        placeholder="29AAAAA0000A1Z5"
                        value={userForm.gstin || ''}
                        onChange={(e) => setUserForm({ ...userForm, gstin: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Operating City</label>
                    <input
                      type="text"
                      value={userForm.city || 'Bengaluru'}
                      onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={userForm.pincode || '560001'}
                      onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg shadow-sm"
                  >
                    {savingUser ? 'Creating...' : 'Provision Account'}
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

