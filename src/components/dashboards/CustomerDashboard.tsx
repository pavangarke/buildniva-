import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  MapPin,
  Package,
  Bell,
  LifeBuoy,
  Plus,
  X,
  Building,
  Calendar,
  User as UserIcon,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { ProjectTimeline } from '../timeline/ProjectTimeline.js';
import { DeliveryTrackingMap } from '../orders/DeliveryTrackingMap.js';
import { SignInRequired } from '../auth/SignInRequired.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  CustomerProject,
  SavedAddress,
  Order,
  AppNotification,
  SupportTicket,
} from '../../types/index.js';

export const CustomerDashboard: React.FC = () => {
  const { currentUser, setCurrentUser, showToast, setActiveTrackingOrder, setActiveTab } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'projects' | 'timeline' | 'orders' | 'addresses' | 'profile' | 'notifications' | 'support'
  >('overview');

  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Form Modal
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState<'residential_villa' | 'renovation' | 'commercial' | 'interior'>('residential_villa');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectPincode, setProjectPincode] = useState('560034');
  const [projectBudget, setProjectBudget] = useState(6000000);

  // Add / Edit Address Form Modal
  const [newAddressModal, setNewAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Bengaluru');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPincode, setAddrPincode] = useState('560034');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Profile & Linked Bank Edit State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileCity, setProfileCity] = useState(currentUser?.city || 'Bengaluru');
  const [profilePincode, setProfilePincode] = useState(currentUser?.pincode || '');
  const [bankAccountName, setBankAccountName] = useState(currentUser?.bankDetails?.accountName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(currentUser?.bankDetails?.accountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(currentUser?.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(currentUser?.bankDetails?.bankName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Support Ticket Modal
  const [ticketModal, setTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'delivery_delay' | 'material_defect' | 'billing_payment' | 'equipment_breakdown' | 'labour_dispute'>('delivery_delay');
  const [ticketDesc, setTicketDesc] = useState('');

  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const loadCustomerData = async () => {
    if (!currentUser?.id || currentUser.role !== 'customer') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const custId = currentUser.id;
      const [projRes, addrRes, ordRes, notifRes, tickRes] = await Promise.all([
        api.getProjects(custId),
        api.getAddresses(custId),
        api.getOrders(),
        api.getNotifications(custId),
        api.getTickets(custId),
      ]);
      setProjects(projRes.projects);
      setAddresses(addrRes.addresses);
      setOrders(ordRes.orders.filter((o) => o.customerId === custId));
      setNotifications(notifRes.notifications);
      setTickets(tickRes.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrdersOnly = async () => {
    if (!currentUser?.id || currentUser.role !== 'customer') return;
    setRefreshingOrders(true);
    try {
      const ordRes = await api.getOrders();
      setOrders(ordRes.orders.filter((o) => o.customerId === currentUser.id));
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingOrders(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [currentUser]);

  // Periodically sync live order status updates for active deliveries
  const hasActiveDelivery = orders.some((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  useEffect(() => {
    if (!currentUser?.id || currentUser.role !== 'customer' || !hasActiveDelivery) return;
    const interval = setInterval(() => {
      api
        .getOrders()
        .then((ordRes) => {
          setOrders(ordRes.orders.filter((o) => o.customerId === currentUser.id));
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role, hasActiveDelivery]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileCity(currentUser.city || 'Bengaluru');
      setProfilePincode(currentUser.pincode || '');
      setBankAccountName(currentUser.bankDetails?.accountName || currentUser.name || '');
      setBankAccountNumber(currentUser.bankDetails?.accountNumber || '');
      setBankIfsc(currentUser.bankDetails?.ifscCode || '');
      setBankName(currentUser.bankDetails?.bankName || '');
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        city: profileCity.trim(),
        pincode: profilePincode.trim(),
        bankDetails: {
          accountName: bankAccountName.trim() || profileName.trim(),
          accountNumber: bankAccountNumber.trim(),
          ifscCode: bankIfsc.trim().toUpperCase(),
          bankName: bankName.trim(),
        },
      });
      setCurrentUser(res.user);
      showToast('Profile Updated', 'Your contact details, city hub, and linked bank account have been saved.', 'success');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Could not update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const resetAddressModal = () => {
    setNewAddressModal(false);
    setEditingAddressId(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity(currentUser?.city || 'Bengaluru');
    setAddrState('Karnataka');
    setAddrPincode(currentUser?.pincode || '560034');
    setAddrLandmark('');
    setAddrIsDefault(false);
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity(currentUser?.city || 'Bengaluru');
    setAddrState('Karnataka');
    setAddrPincode(currentUser?.pincode || '560034');
    setAddrLandmark('');
    setAddrIsDefault(addresses.length === 0);
    setNewAddressModal(true);
  };

  const openEditAddressModal = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || '');
    setAddrStreet(addr.street || '');
    setAddrCity(addr.city || 'Bengaluru');
    setAddrState(addr.state || 'Karnataka');
    setAddrPincode(addr.pincode || '');
    setAddrLandmark(addr.landmark || '');
    setAddrIsDefault(Boolean(addr.isDefault));
    setNewAddressModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await api.createProject({
        customerId: currentUser.id,
        title: projectTitle,
        projectType,
        siteAddress: projectAddress,
        sitePincode: projectPincode,
        targetBudget: Number(projectBudget),
      });
      showToast('Project Created', `${res.project.title} added to your site dashboard.`, 'success');
      setNewProjectModal(false);
      setProjectTitle('');
      setProjectAddress('');
      loadCustomerData();
    } catch (err: any) {
      showToast('Creation failed', err.message, 'error');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      if (editingAddressId) {
        const res = await api.updateAddress(editingAddressId, {
          userId: currentUser.id,
          label: addrLabel,
          street: addrStreet,
          city: addrCity,
          state: addrState,
          pincode: addrPincode,
          landmark: addrLandmark,
          isDefault: addrIsDefault,
        });
        showToast('Address Updated', `${res.address.label} has been updated.`, 'success');
      } else {
        const res = await api.createAddress({
          userId: currentUser.id,
          label: addrLabel,
          street: addrStreet,
          city: addrCity,
          state: addrState,
          pincode: addrPincode,
          landmark: addrLandmark,
          isDefault: addrIsDefault,
        });
        showToast('Address Saved', `${res.address.label} added to saved site locations.`, 'success');
      }
      resetAddressModal();
      loadCustomerData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleSetDefaultAddress = async (addr: SavedAddress) => {
    if (!currentUser) return;
    try {
      await api.updateAddress(addr.id, { userId: currentUser.id, isDefault: true });
      showToast('Default Address Updated', `${addr.label} is now your default delivery site.`, 'success');
      loadCustomerData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteAddress = async (addr: SavedAddress) => {
    if (!currentUser) return;
    try {
      await api.deleteAddress(addr.id, currentUser.id);
      showToast('Address Removed', `${addr.label} removed from saved sites.`, 'info');
      loadCustomerData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await api.createTicket({
        userId: currentUser.id,
        userName: currentUser.name,
        category: ticketCategory,
        priority: 'medium',
        subject: ticketSubject,
        description: ticketDesc,
      });
      showToast('Ticket Raised', `Support Ticket ${res.ticket.ticketNumber} logged.`, 'success');
      setTicketModal(false);
      setTicketSubject('');
      setTicketDesc('');
      loadCustomerData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  if (!currentUser) {
    return (
      <SignInRequired
        title="Sign in to view your Customer Dashboard"
        description="Access your projects, active orders, delivery OTPs, saved delivery addresses, and price notifications."
      />
    );
  }

  if (currentUser.role !== 'customer') {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Signed in as {currentUser.role.replace('_', ' ')}
          </h2>
          <p className="text-xs text-slate-500">
            Your account uses the {currentUser.role === 'admin' ? 'Admin Console' : 'Partner Portal'} workspace rather than the Customer Dashboard.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(currentUser.role === 'admin' ? 'admin' : 'dashboard')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            {currentUser.role === 'admin' ? 'Open Admin Console' : 'Open My Portal'}
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.grandTotal : 0), 0);

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Customer Account Dashboard
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hub: {currentUser.city} ({currentUser.pincode}) · Phone: {currentUser.phone} · Customer ID: {currentUser.id}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('profile')}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setNewProjectModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Construction Project</span>
            </button>
            <button
              onClick={() => setTicketModal(true)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-amber-600" />
              <span>Raise Ticket</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6 text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'projects', label: `My Projects (${projects.length})`, icon: Building },
            { id: 'timeline', label: 'Project Timeline', icon: Calendar },
            { id: 'orders', label: `Material Orders (${orders.length})`, icon: Package },
            { id: 'addresses', label: `Saved Sites (${addresses.length})`, icon: MapPin },
            { id: 'profile', label: 'Profile & Contact', icon: UserIcon },
            { id: 'notifications', label: `Notifications (${notifications.filter((n) => !n.read).length})`, icon: Bell },
            { id: 'support', label: `Help Desk (${tickets.length})`, icon: LifeBuoy },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === tab.id
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

        {/* Tab 1: Overview */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs">Active Projects</span>
                <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{projects.length} Sites</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs">Total Consignments</span>
                <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{orders.length} Orders</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs">Total Procured (INR)</span>
                <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-xs">Unread Alerts</span>
                <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">
                  {notifications.filter((n) => !n.read).length}
                </div>
              </div>
            </div>

            {/* Real-Time Delivery Tracking Map */}
            {orders.length > 0 && (
              <DeliveryTrackingMap
                orders={orders}
                onRefresh={refreshOrdersOnly}
                refreshing={refreshingOrders}
                onOpenFullTracking={(o) => {
                  setActiveTrackingOrder(o);
                  setActiveTab('orders');
                }}
              />
            )}

            {/* Active Projects Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ongoing Construction Sites
                </h3>
                <button
                  onClick={() => setActiveSubTab('projects')}
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 bg-stone-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-slate-500">{p.siteAddress}</div>
                    <div className="pt-2 border-t border-slate-200/80 flex justify-between text-slate-600">
                      <span>Target Budget: ₹{(p.targetBudget / 100000).toFixed(1)}L</span>
                      <span className="font-semibold text-slate-900">Spent: ₹{p.spentSoFar.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Material Consignments
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  Go to Live Tracking
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {orders.map((o) => (
                  <div key={o.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{o.orderNumber} · {o.items[0]?.productName}</div>
                      <div className="text-slate-400 text-[11px]">Vendor: {o.vendorName} · OTP: {o.deliveryOtp}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums">₹{o.grandTotal.toLocaleString('en-IN')}</div>
                        <span className="text-[11px] text-amber-700 font-semibold uppercase">{o.status.replace(/_/g, ' ')}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTrackingOrder(o);
                          setActiveTab('orders');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px]"
                      >
                        Track Tipper
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Projects */}
        {activeSubTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Project Organized Sites ({projects.length})
              </h2>
              <button
                onClick={() => setNewProjectModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Site Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {projects.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-semibold text-amber-700 uppercase">{p.projectType.replace('_', ' ')}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{p.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] uppercase">
                      {p.status}
                    </span>
                  </div>

                  <p className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{p.siteAddress} (PIN: {p.sitePincode})</span>
                  </p>

                  <div className="p-3 bg-stone-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Budget Target:</span>
                      <span className="font-bold tabular-nums">₹{(p.targetBudget / 100000).toFixed(1)} Lakhs</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Committed Expenses:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">₹{p.spentSoFar.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setActiveSubTab('timeline')}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>View Timeline</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-center"
                    >
                      Procure Materials
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Project Timeline */}
        {activeSubTab === 'timeline' && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6">
            <ProjectTimeline />
          </div>
        )}

        {/* Tab 3: Orders */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6">
            <DeliveryTrackingMap
              orders={orders}
              onRefresh={refreshOrdersOnly}
              refreshing={refreshingOrders}
              onOpenFullTracking={(o) => {
                setActiveTrackingOrder(o);
                setActiveTab('orders');
              }}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Material Consignment Orders
              </h2>
            <div className="divide-y divide-slate-100 text-xs">
              {orders.map((o) => (
                <div key={o.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{o.orderNumber}</div>
                    <div className="text-slate-500 mt-0.5">
                      Supplied by: {o.vendorName} · Delivered to: {o.shippingAddress.street}
                    </div>
                    <div className="text-slate-600 mt-1">
                      {o.items.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 tabular-nums">₹{o.grandTotal.toLocaleString('en-IN')}</div>
                      <span className="text-[11px] text-amber-700 font-semibold uppercase">{o.status.replace(/_/g, ' ')}</span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTrackingOrder(o);
                        setActiveTab('orders');
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                    >
                      Live Tracking
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Tab 4: Addresses */}
        {activeSubTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Saved Job Sites & Delivery Addresses
              </h2>
              <button
                onClick={openAddAddressModal}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Site Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                No delivery addresses saved yet. Add a site address for faster checkout.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {addresses.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{a.label}</span>
                        </span>
                        {a.isDefault && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded whitespace-nowrap">
                            Default Dropoff
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600">{a.street}</p>
                      <p className="text-slate-400 text-[11px]">
                        {a.city}, {a.state} - {a.pincode} {a.landmark ? `(Landmark: ${a.landmark})` : ''}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!a.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(a)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Set as Default</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Primary Delivery Address</span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(a)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(a)}
                          className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-md font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Profile & Contact */}
        {activeSubTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Customer Profile & Contact Details
                </h2>
                <p className="text-slate-500 mt-1">
                  Update your display name, mobile phone number used for driver OTP & delivery coordination, and default city/PIN code.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="+91 98..."
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City Hub</label>
                    <select
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={profilePincode}
                      onChange={(e) => setProfilePincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Linked Bank Account (Payments & Instant Refunds) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">Linked Bank Account (Refunds &amp; Quick Checkout)</div>
                      <p className="text-[11px] text-slate-500">
                        Link Airtel Payments Bank or any Indian savings/current account for fast checkout and order refunds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mobileDigits = (profilePhone || currentUser.phone || '').replace(/\D/g, '').slice(-10);
                        setBankAccountName(profileName || currentUser.name || '');
                        if (!bankAccountNumber && mobileDigits.length === 10) {
                          setBankAccountNumber(mobileDigits);
                        }
                        setBankIfsc('AIRP0000001');
                        setBankName('Airtel Payments Bank');
                      }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
                    >
                      Use Airtel Payments Bank (AIRP)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        placeholder="Name on bank account"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Number (or Airtel Mobile No.)</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="e.g. 10-digit mobile or A/C number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. AIRP0000001"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Airtel Payments Bank"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileName(currentUser.name || '');
                      setProfilePhone(currentUser.phone || '');
                      setProfileCity(currentUser.city || 'Bengaluru');
                      setProfilePincode(currentUser.pincode || '');
                      setBankAccountName(currentUser.bankDetails?.accountName || currentUser.name || '');
                      setBankAccountNumber(currentUser.bankDetails?.accountNumber || '');
                      setBankIfsc(currentUser.bankDetails?.ifscCode || '');
                      setBankName(currentUser.bankDetails?.bankName || '');
                    }}
                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</div>
                  <div className="text-slate-500">Customer Account</div>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{currentUser.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">City & PIN:</span>
                  <span className="font-semibold text-slate-900">{currentUser.city} ({currentUser.pincode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Saved Addresses:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{addresses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Linked Bank:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                    {currentUser.bankDetails?.bankName || 'Not linked'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('addresses')}
                className="w-full py-2 bg-stone-50 hover:bg-stone-100 border border-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer"
              >
                Manage Delivery Addresses →
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Notifications */}
        {activeSubTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Site Alerts & Notification History
            </h2>
            <div className="divide-y divide-slate-100 text-xs">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  No alerts or notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`py-3 flex justify-between items-start gap-4 ${n.read ? 'opacity-70' : 'font-medium'}`}>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {(n.type === 'price_alert' || n.linkTab === 'materials') && (
                          <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(n.linkTab === 'materials' || n.type === 'price_alert') && (
                        <button
                          onClick={async () => {
                            if (!n.read) {
                              await api.markNotificationRead(n.id);
                            }
                            setActiveTab('materials');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded whitespace-nowrap transition-colors cursor-pointer"
                        >
                          View in Store
                        </button>
                      )}
                      {!n.read && (
                        <button
                          onClick={async () => {
                            await api.markNotificationRead(n.id);
                            loadCustomerData();
                          }}
                          className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 whitespace-nowrap cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Support Tickets */}
        {activeSubTab === 'support' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Customer Support Desk
              </h2>
              <button
                onClick={() => setTicketModal(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Issue</span>
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No open support tickets. Need help? Click 'Log New Issue'.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {tickets.map((t) => (
                  <div key={t.id} className="py-3 flex justify-between items-start gap-3">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{t.subject}</span>
                        <span className="text-slate-400 font-normal">· {t.ticketNumber}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{t.description}</p>
                      <span className="text-[10px] text-slate-400 capitalize">Category: {t.category.replace('_', ' ')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold text-[11px] uppercase">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {newProjectModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Add Construction Project</h3>
                <button onClick={() => setNewProjectModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whitefield G+2 Luxury Villa"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="residential_villa">Independent Residential Villa</option>
                    <option value="renovation">Renovation & Structural Repair</option>
                    <option value="commercial">Commercial Building</option>
                    <option value="interior">Interior Finishing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot #14, Green Glen Layout, Bellandur"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={projectPincode}
                      onChange={(e) => setProjectPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewProjectModal(false)}
                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create / Edit Address Modal */}
        {newAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAddressId ? 'Edit Site Delivery Address' : 'Add Site Delivery Address'}
                </h3>
                <button onClick={resetAddressModal} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot #82 South Block"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addrPincode}
                      onChange={(e) => setAddrPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Set as default delivery dropoff address</span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddressModal}
                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Raise Ticket Modal */}
        {ticketModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Log Support Ticket</h3>
                <button onClick={() => setTicketModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="delivery_delay">Site Delivery Delay</option>
                    <option value="material_defect">Material Quality / Lab Test Defect</option>
                    <option value="billing_payment">Billing, Tax Invoice & GST Reconciliation</option>
                    <option value="equipment_breakdown">Equipment Breakdown & Replacement</option>
                    <option value="labour_dispute">Labour Attendance & Wages</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the problem"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Explanation</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide relevant details or consignment order numbers..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTicketModal(false)}
                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Submit Ticket
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
