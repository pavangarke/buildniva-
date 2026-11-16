import {
  User,
  MaterialProduct,
  EquipmentListing,
  ProfessionalProfile,
  ProjectSample,
  LabourProfile,
  ContractorProfile,
  Order,
  PaymentRecord,
  EquipmentBooking,
  ProfessionalBooking,
  LabourRequest,
  ContractorQuotation,
  MaterialEstimationResult,
  MaterialCategory,
  PriceAlert,
} from '../types/index.js';

const AUTH_TOKEN_KEY = 'bn_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage quota errors
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User }> {
    return fetchJson('/api/auth/me');
  },

  async updateProfile(data: {
    name?: string;
    phone?: string;
    city?: string;
    pincode?: string;
    avatar?: string;
    bankDetails?: {
      accountName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
  }): Promise<{ user: User; message: string }> {
    return fetchJson('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getAllUsers(): Promise<{ users: User[] }> {
    return fetchJson('/api/auth/users');
  },

  async login(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    const res = await fetchJson<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  async logout(): Promise<{ message: string }> {
    try {
      return await fetchJson('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    businessName?: string;
    businessType?: string;
    city?: string;
    pincode?: string;
    gstin?: string;
    panNumber?: string;
    tradeLicenseNumber?: string;
    bankDetails?: {
      accountName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
    specialization?: string;
    registrationNumber?: string;
    vehicleType?: string;
    vehicleRegistration?: string;
    loadCapacityTons?: number;
    experienceYears?: number;
    avatarUrl?: string;
    profilePic?: string;
    bio?: string;
    education?: string;
    consultationFee?: number;
    siteVisitFee?: number;
    planApprovalFee?: number;
    structuralDrawingsRate?: number;
    architecturalPlansRate?: number;
    mepDesignsRate?: number;
    siteAuditsRate?: number;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetchJson<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setAuthToken(res.token);
    return res;
  },

  // Materials
  async getMaterials(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    vendorId?: string;
  }): Promise<{ materials: MaterialProduct[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.brand) query.set('brand', params.brand);
    if (params?.minPrice) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice) query.set('maxPrice', String(params.maxPrice));
    if (params?.vendorId) query.set('vendorId', params.vendorId);
    return fetchJson(`/api/materials?${query.toString()}`);
  },

  async createMaterial(payload: Partial<MaterialProduct>): Promise<{ material: MaterialProduct }> {
    return fetchJson('/api/materials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMaterial(id: string, payload: Partial<MaterialProduct>): Promise<{ material: MaterialProduct; message: string }> {
    return fetchJson(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson(`/api/materials/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadImage(dataUrl: string, prefix = 'mat'): Promise<{ url: string }> {
    return fetchJson('/api/uploads/image', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, prefix }),
    });
  },

  // Equipment
  async getEquipment(params?: { category?: string; city?: string; search?: string }): Promise<{ equipment: EquipmentListing[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.city) query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    return fetchJson(`/api/equipment?${query.toString()}`);
  },

  async bookEquipment(data: {
    equipmentId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    siteAddress: string;
    startDate: string;
    durationDays: number;
    includeOperator: boolean;
  }): Promise<{ booking: EquipmentBooking; message: string }> {
    return fetchJson('/api/equipment/book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Professionals
  async getProfessionals(params?: { specialization?: string; city?: string }): Promise<{ professionals: ProfessionalProfile[] }> {
    const query = new URLSearchParams();
    if (params?.specialization) query.set('specialization', params.specialization);
    if (params?.city) query.set('city', params.city);
    return fetchJson(`/api/professionals?${query.toString()}`);
  },

  async createProfessional(data: Partial<ProfessionalProfile>): Promise<{ professional: ProfessionalProfile; message: string }> {
    return fetchJson('/api/professionals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfessional(id: string, updates: Partial<ProfessionalProfile>): Promise<{ professional: ProfessionalProfile; message: string }> {
    return fetchJson(`/api/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addProfessionalProject(id: string, project: {
    title: string;
    category: string;
    imageUrl: string;
    description?: string;
    projectType?: string;
  }): Promise<{ project: ProjectSample; professional: ProfessionalProfile; message: string }> {
    return fetchJson(`/api/professionals/${id}/projects`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async deleteProfessionalProject(id: string, projectId: string): Promise<{ professional: ProfessionalProfile; message: string }> {
    return fetchJson(`/api/professionals/${id}/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async getProfessionalBookings(professionalId?: string): Promise<{ bookings: ProfessionalBooking[] }> {
    const query = new URLSearchParams();
    if (professionalId) query.set('professionalId', professionalId);
    return fetchJson(`/api/professionals/bookings?${query.toString()}`);
  },

  async getProfessionalInquiries(id: string): Promise<{ inquiries: ProfessionalBooking[] }> {
    return fetchJson(`/api/professionals/${id}/inquiries`);
  },

  async inquireProfessional(data: {
    professionalId: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerCity?: string;
    serviceType: string;
    urgency?: string;
    siteLocation?: string;
    projectDescription: string;
  }): Promise<{ inquiry: ProfessionalBooking; message: string }> {
    return fetchJson('/api/professionals/inquire', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfessionalBookingStatus(
    bookingId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<{ booking: ProfessionalBooking; message: string }> {
    return fetchJson(`/api/professionals/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async bookProfessional(data: {
    professionalId: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerCity?: string;
    serviceType: string;
    urgency?: string;
    date: string;
    timeSlot: string;
    siteLocation?: string;
    projectDescription: string;
  }): Promise<{ booking: ProfessionalBooking; message: string }> {
    return fetchJson('/api/professionals/book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Labour
  async getLabour(params?: { trade?: string }): Promise<{ labourers: LabourProfile[]; requests: LabourRequest[] }> {
    const query = new URLSearchParams();
    if (params?.trade) query.set('trade', params.trade);
    return fetchJson(`/api/labour?${query.toString()}`);
  },

  async requestLabour(data: {
    trade: string;
    headcount: number;
    startDate: string;
    durationDays: number;
    siteAddress: string;
    city: string;
    dailyRateOffered: number;
    notes?: string;
    customerName?: string;
  }): Promise<{ request: LabourRequest; message: string }> {
    return fetchJson('/api/labour/hire', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLabourPhotos(id: string, data: { photoUrl?: string; workPhotoUrl?: string }): Promise<{ labourer: LabourProfile; message: string }> {
    return fetchJson(`/api/labour/${id}/photos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Contractors
  async getContractors(): Promise<{ contractors: ContractorProfile[]; quotations: ContractorQuotation[] }> {
    return fetchJson('/api/contractors');
  },

  async requestQuotation(data: {
    contractorId: string;
    projectType: string;
    plotAreaSqFt: number;
    floors: number;
    siteCity: string;
    customerName?: string;
    scopeSummary?: string;
  }): Promise<{ quotation: ContractorQuotation; message: string }> {
    return fetchJson('/api/contractors/quotation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Cart & Orders
  async calculateCart(items: { productId: string; quantity: number }[]): Promise<{
    items: any[];
    subtotal: number;
    totalGst: number;
    totalDelivery: number;
    grandTotal: number;
  }> {
    return fetchJson('/api/orders/calculate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async checkout(payload: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    items: { productId: string; quantity: number }[];
    paymentMethod: string;
    deferPayment?: boolean;
  }): Promise<{ orders: Order[]; message: string }> {
    return fetchJson('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOrders(): Promise<{ orders: Order[] }> {
    return fetchJson('/api/orders');
  },

  async getOrderById(id: string): Promise<{ order: Order }> {
    return fetchJson(`/api/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: string, note?: string, deliveryAgent?: any): Promise<{ order: Order; message: string }> {
    return fetchJson(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, deliveryAgent }),
    });
  },

  async verifyDeliveryOtp(id: string, otp: string): Promise<{ order: Order; message: string }> {
    return fetchJson(`/api/orders/${id}/verify-delivery`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  },

  // AI Material Estimator
  async getMaterialEstimate(payload: {
    plotAreaSqFt: number;
    floors: number;
    quality: string;
    city: string;
  }): Promise<MaterialEstimationResult> {
    return fetchJson('/api/ai/estimate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin
  async getAdminStats(): Promise<{
    grossMerchandiseValue: number;
    totalOrders: number;
    activeListingsCount: number;
    verifiedProfessionalsCount: number;
    availableWorkersCount: number;
    activeContractorsCount: number;
    recentOrders: Order[];
    vendors: User[];
  }> {
    return fetchJson('/api/admin/stats');
  },

  // Customer Projects & Addresses
  async getProjects(customerId?: string): Promise<{ projects: any[] }> {
    return fetchJson(`/api/customer/projects${customerId ? `?customerId=${customerId}` : ''}`);
  },

  async createProject(data: {
    customerId: string;
    title: string;
    projectType: string;
    siteAddress: string;
    sitePincode: string;
    targetBudget: number;
  }): Promise<{ project: any; message: string }> {
    return fetchJson('/api/customer/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProjectDetails(projectId: string): Promise<{ project: any; orders: Order[] }> {
    return fetchJson(`/api/customer/projects/${projectId}`);
  },

  async toggleMilestoneTask(
    projectId: string,
    milestoneId: string,
    taskId: string
  ): Promise<{ project: any; message: string }> {
    return fetchJson(`/api/customer/projects/${projectId}/milestones/${milestoneId}/tasks/${taskId}/toggle`, {
      method: 'POST',
    });
  },

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    updates: any
  ): Promise<{ project: any; message: string }> {
    return fetchJson(`/api/customer/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addMilestone(projectId: string, milestone: any): Promise<{ project: any; message: string }> {
    return fetchJson(`/api/customer/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(milestone),
    });
  },

  async getAddresses(userId: string): Promise<{ addresses: any[] }> {
    return fetchJson(`/api/customer/addresses?userId=${userId}`);
  },

  async createAddress(data: any): Promise<{ address: any; message: string }> {
    return fetchJson('/api/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAddress(id: string, data: any): Promise<{ address: any; message: string }> {
    return fetchJson(`/api/customer/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAddress(id: string, userId?: string): Promise<{ message: string }> {
    return fetchJson(`/api/customer/addresses/${id}${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, {
      method: 'DELETE',
    });
  },

  // Payments, Ledger & Settlements
  async getPaymentConfig(): Promise<{
    provider: 'razorpay' | 'sandbox';
    keyId?: string;
    currency: 'INR';
    merchantName: string;
    supportedMethods: string[];
  }> {
    return fetchJson('/api/payments/config');
  },

  async createGatewayOrder(payload: {
    orderIds: string[];
  }): Promise<{
    provider: 'razorpay' | 'sandbox';
    keyId?: string;
    gatewayOrderId: string;
    amountInr: number;
    amountPaise: number;
    currency: 'INR';
    receipt: string;
    orderIds: string[];
    orderNumbers: string[];
  }> {
    return fetchJson('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async authorizeSandboxPayment(payload: {
    gatewayOrderId: string;
    paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
    methodDetails?: string;
    simulateOutcome?: 'success' | 'failed';
    failureReason?: string;
  }): Promise<{
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    paymentMethod: string;
    methodDetails: string;
  }> {
    return fetchJson('/api/payments/sandbox/authorize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyPaymentSignature(payload: {
    orderIds: string[];
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    paymentMethod: string;
    methodDetails?: string;
    idempotencyKey?: string;
  }): Promise<{
    verified: boolean;
    payment?: PaymentRecord;
    payments?: PaymentRecord[];
    order?: Order;
    orders?: Order[];
    message: string;
  }> {
    return fetchJson('/api/payments/verify-signature', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async failGatewayPayment(payload: {
    orderIds: string[];
    gatewayOrderId?: string;
    paymentMethod?: string;
    methodDetails?: string;
    reason?: string;
    cancelOrders?: boolean;
  }): Promise<{ orders: Order[]; message: string }> {
    return fetchJson('/api/payments/fail', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPayments(params?: { customerId?: string; orderId?: string }): Promise<{ payments: PaymentRecord[] }> {
    const q = new URLSearchParams();
    if (params?.customerId) q.set('customerId', params.customerId);
    if (params?.orderId) q.set('orderId', params.orderId);
    const qs = q.toString();
    return fetchJson(`/api/finance/payments${qs ? `?${qs}` : ''}`);
  },

  async getLedger(): Promise<{ ledger: any[] }> {
    return fetchJson('/api/finance/ledger');
  },

  async getSettlements(vendorId?: string): Promise<{ settlements: any[] }> {
    return fetchJson(`/api/finance/settlements${vendorId ? `?vendorId=${vendorId}` : ''}`);
  },

  async processRefund(data: { orderId: string; amount?: number; reason?: string }): Promise<{ message: string }> {
    return fetchJson('/api/finance/refund', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delivery & Fleet
  async getDeliveryAgents(): Promise<{ agents: any[] }> {
    return fetchJson('/api/delivery/agents');
  },

  async getDeliveryAssignments(agentId?: string): Promise<{ assignments: any[] }> {
    return fetchJson(`/api/delivery/assignments${agentId ? `?agentId=${agentId}` : ''}`);
  },

  async assignDelivery(data: { orderId: string; agentId: string; estimatedWeightKg?: number }): Promise<{ assignment: any; message: string }> {
    return fetchJson('/api/delivery/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDeliveryAssignmentStatus(id: string, status: string, proofOfDelivery?: any): Promise<{ assignment: any; message: string }> {
    return fetchJson(`/api/delivery/assignments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, proofOfDelivery }),
    });
  },

  // Notifications
  async getNotifications(userId: string): Promise<{ notifications: any[] }> {
    return fetchJson(`/api/notifications?userId=${userId}`);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return fetchJson(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  // Price Alerts
  async getPriceAlerts(userId?: string): Promise<{ alerts: PriceAlert[] }> {
    return fetchJson(`/api/price-alerts${userId ? `?userId=${userId}` : ''}`);
  },

  async createPriceAlert(payload: {
    userId: string;
    materialId: string;
    targetPrice: number;
  }): Promise<{ alert: PriceAlert; triggeredImmediately: boolean; message: string }> {
    return fetchJson('/api/price-alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePriceAlert(id: string, payload: Partial<PriceAlert>): Promise<{ alert: PriceAlert; message: string }> {
    return fetchJson(`/api/price-alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deletePriceAlert(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson(`/api/price-alerts/${id}`, {
      method: 'DELETE',
    });
  },

  // Reviews
  async getReviews(params?: { targetType?: string; targetId?: string }): Promise<{ reviews: any[] }> {
    const q = new URLSearchParams();
    if (params?.targetType) q.set('targetType', params.targetType);
    if (params?.targetId) q.set('targetId', params.targetId);
    return fetchJson(`/api/reviews?${q.toString()}`);
  },

  async createReview(data: any): Promise<{ review: any; message: string }> {
    return fetchJson('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Support Tickets
  async getTickets(userId?: string): Promise<{ tickets: any[] }> {
    return fetchJson(`/api/support/tickets${userId ? `?userId=${userId}` : ''}`);
  },

  async createTicket(data: any): Promise<{ ticket: any; message: string }> {
    return fetchJson('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Assistant & Natural Search
  async askAiAssistant(prompt: string): Promise<{ answer: string }> {
    return fetchJson('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  async naturalSearchAi(query: string): Promise<{ interpretedCategory: string; targetTab: string; searchKeyword: string; message: string }> {
    return fetchJson('/api/ai/natural-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  // Admin Audit & Settings
  async getAuditLogs(): Promise<{ auditLogs: any[] }> {
    return fetchJson('/api/admin/audit-logs');
  },

  async getSettings(): Promise<{ settings: any }> {
    return fetchJson('/api/admin/settings');
  },

  async updateSettings(settings: any): Promise<{ settings: any; message: string }> {
    return fetchJson('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async updateUserStatus(userId: string, status: string): Promise<{ user: any; message: string }> {
    return fetchJson(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async adminUpdateTicket(
    id: string,
    payload: { status?: 'open' | 'investigating' | 'resolved' | 'closed'; resolutionNotes?: string }
  ): Promise<{ ticket: any; message: string }> {
    return fetchJson(`/api/admin/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async adminCreateUser(payload: Partial<User> & { password?: string }): Promise<{ user: User; message: string }> {
    return fetchJson('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateUser(id: string, payload: Partial<User> & { password?: string }): Promise<{ user: User; message: string }> {
    return fetchJson(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
};
