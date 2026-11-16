export type UserRole =
  | 'customer'
  | 'vendor'
  | 'equipment_provider'
  | 'professional'
  | 'labourer'
  | 'contractor'
  | 'delivery_agent'
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  approvedRoles: UserRole[];
  businessName?: string;
  businessType?: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'LLP' | 'Individual';
  gstin?: string;
  panNumber?: string;
  tradeLicenseNumber?: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  city: string;
  pincode: string;
  verificationStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'suspended';
  avatar?: string;
  suspended?: boolean;
  notes?: string;
  createdAt?: string;
}

export type MaterialCategory =
  | 'Cement'
  | 'TMT Steel'
  | 'Bricks & Blocks'
  | 'Sand & Aggregates'
  | 'Ready-Mix Concrete'
  | 'Tiles & Flooring'
  | 'Paints & Coatings'
  | 'Plumbing'
  | 'Electrical'
  | 'Waterproofing'
  | 'Tools & Safety';

export interface BulkTier {
  minQty: number;
  pricePerUnit: number;
}

export interface MaterialProduct {
  id: string;
  name: string;
  category: MaterialCategory;
  brand: string;
  description: string;
  vendorId: string;
  vendorName: string;
  vendorCity: string;
  unit: 'bag' | 'tonne' | 'piece' | 'sq.ft' | 'brass' | 'litre' | 'meter' | 'bundle';
  pricePerUnit: number;
  mrp?: number;
  gstRate: number; // e.g. 18 or 28%
  minOrderQty: number;
  availableStock: number;
  bulkTiers?: BulkTier[];
  serviceablePincodes: string[];
  deliveryEstimateDays: number;
  deliveryChargePerUnit: number;
  specifications: Record<string, string>;
  returnEligible: boolean;
  status: 'active' | 'out_of_stock' | 'archived';
  rating: number;
  reviewCount: number;
  imageFallbackCategory: string;
  imageUrl?: string;
  images?: string[]; // Multiple high-resolution product catalog photos
  sku?: string;
  hsnCode?: string;
  weightKgPerUnit?: number;
}

export type EquipmentCategory =
  | 'Earth Moving'
  | 'Concrete & Compaction'
  | 'Lifting & Cranes'
  | 'Scaffolding & Formwork'
  | 'Power & Generators'
  | 'Pumps & Vibrators';

export interface EquipmentListing {
  id: string;
  name: string;
  category: EquipmentCategory;
  model: string;
  providerId: string;
  providerName: string;
  city: string;
  hourlyRate?: number;
  dailyRate: number;
  weeklyRate: number;
  minDurationDays: number;
  securityDeposit: number;
  operatorAvailable: boolean;
  operatorChargePerDay: number;
  fuelIncluded: boolean;
  specifications: Record<string, string>;
  serviceRadiusKm: number;
  available: boolean;
  blockedDates: string[]; // YYYY-MM-DD
  rating: number;
  reviewCount: number;
}

export type ProfessionalSpecialization =
  | 'Civil & Structural Engineer'
  | 'Architectural Design'
  | 'Site Supervision'
  | 'Quantity Surveyor & Estimator'
  | 'Interior Designer'
  | 'Plumbing & Electrical Consultant';

export interface ProjectSample {
  id: string;
  title: string;
  category: 'Structural Drawings' | '3D Architectural Plans' | 'MEP Designs' | 'Site Audits' | 'Civil Execution' | 'General';
  imageUrl: string;
  description?: string;
  projectType?: string; // e.g. "Residential Villa (G+3)", "Commercial Mall", "Warehouse", "Apartment Complex"
  dateAdded?: string;
}

export interface ProfessionalServiceOffering {
  key: 'structural_drawings' | '3d_architectural_plans' | 'mep_designs' | 'site_audits' | 'online_consultation' | 'site_inspection';
  title: string;
  description: string;
  startingPrice: number;
  deliveryTime: string; // e.g. "3-5 Working Days"
  enabled: boolean;
}

export interface ProfessionalProfile {
  id: string;
  name: string;
  title: string;
  registrationNumber: string; // Council of Architecture / IEI
  experienceYears: number;
  specialization: ProfessionalSpecialization;
  city: string;
  serviceableCities: string[];
  education: string;
  consultationFee: number;
  siteVisitFee: number;
  planApprovalFee?: number;
  structuralDrawingsRate?: number;
  architecturalPlansRate?: number;
  mepDesignsRate?: number;
  siteAuditsRate?: number;
  bio: string;
  languages: string[];
  rating: number;
  completedProjects: number;
  verificationStatus: 'approved' | 'pending' | 'rejected';
  avatarUrl?: string; // Profile picture for engineer / architect
  profilePic?: string; // Alias for profile picture
  portfolioImages?: string[]; // Project drawings or site inspection photos
  portfolioProjects?: ProjectSample[]; // Sample project pictures with categories and descriptions
  servicesOffered?: ProfessionalServiceOffering[]; // Structural drawings, 3D architectural plans, MEP designs, site audits
}

export type LabourTrade =
  | 'Mason (Rajmistri)'
  | 'General Labour (Beldaar)'
  | 'Plumber'
  | 'Electrician'
  | 'Carpenter'
  | 'Shuttering Carpenter'
  | 'Bar Bender (Steel Fixer)'
  | 'Tile Mason'
  | 'Painter';

export interface LabourProfile {
  id: string;
  name: string;
  trade: LabourTrade;
  dailyWage: number;
  experienceYears: number;
  city: string;
  isTeam: boolean;
  teamSize?: number;
  languages: string[];
  availableNow: boolean;
  rating: number;
  verified: boolean;
  contactMasked: string;
  photoUrl?: string;
  workPhotos?: string[];
}

export interface ContractorProfile {
  id: string;
  businessName: string;
  leadPerson: string;
  specializations: string[];
  experienceYears: number;
  city: string;
  completedSitesCount: number;
  averageRatePerSqFt: number; // in INR
  verifiedLicense: boolean;
  teamSize: number;
  profilePic?: string;
  avatarUrl?: string;
  recentProjects: {
    title: string;
    areaSqFt: number;
    completionYear: number;
    budgetLakhs: number;
  }[];
}

export interface CartItem {
  productId: string;
  product: MaterialProduct;
  quantity: number;
  effectiveUnitPrice: number;
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
}

export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  totalGst: number;
  deliveryCharge: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  totalGst: number;
  totalDelivery: number;
  grandTotal: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  paymentMethod: 'UPI' | 'NET_BANKING' | 'CARD' | 'WALLET' | 'COD';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentReference?: string;
  gatewayOrderId?: string;
  deliveryAgent?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    vehicleType: string;
  };
  deliveryOtp?: string;
  estimatedDeliveryDate?: string;
  targetMilestoneId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  equipmentName: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  startDate: string;
  durationDays: number;
  includeOperator: boolean;
  rentalCost: number;
  operatorCost: number;
  securityDeposit: number;
  totalAmount: number;
  status: 'requested' | 'approved' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ProfessionalBooking {
  id: string;
  bookingNumber: string;
  professionalId: string;
  professionalName: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCity?: string;
  serviceType:
    | 'structural_drawings'
    | '3d_architectural_plans'
    | 'mep_designs'
    | 'site_audits'
    | 'online_consultation'
    | 'site_inspection'
    | 'design_review'
    | 'estimation';
  inquiryType?: 'direct_inquiry' | 'deliverable_order' | 'consultation_booking';
  urgency?: 'Standard' | 'Urgent (Within 48h)' | 'Immediate Site Issue';
  date?: string;
  timeSlot: string;
  siteLocation?: string;
  projectDescription: string;
  fee: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  professionalAvatar?: string;
  engineerNotes?: string;
  createdAt: string;
}

export interface LabourRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  trade: LabourTrade;
  headcount: number;
  startDate: string;
  durationDays: number;
  siteAddress: string;
  city: string;
  dailyRateOffered: number;
  estimatedTotal: number;
  status: 'open' | 'matched' | 'confirmed' | 'completed' | 'cancelled';
  assignedWorkersCount: number;
  notes: string;
  createdAt: string;
}

export interface ContractorQuotation {
  id: string;
  contractorId: string;
  contractorName: string;
  customerId: string;
  customerName: string;
  projectType: string;
  plotAreaSqFt: number;
  floors: number;
  siteCity: string;
  estimatedBudget: number;
  scopeSummary: string;
  milestones: {
    name: string;
    percentage: number;
    amount: number;
    status: 'pending' | 'in_progress' | 'completed' | 'paid';
  }[];
  validUntil: string;
  status: 'draft' | 'submitted' | 'accepted' | 'declined';
  createdAt: string;
}

export interface MilestoneTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  assignedRole?: string;
  isMandatoryInspection?: boolean;
}

export interface MilestoneMaterialRequirement {
  orderId?: string;
  productName: string;
  category: string;
  quantityRequired: string;
  expectedDeliveryDate: string;
  deliveryStatus: 'delivered' | 'in_transit' | 'scheduled' | 'pending_procurement';
  deliveryOtp?: string;
  carrierVehicle?: string;
}

export interface ConstructionMilestone {
  id: string;
  phaseOrder: number;
  title: string;
  category:
    | 'Foundation & Substructure'
    | 'Superstructure & Framing'
    | 'Masonry & Enclosure'
    | 'MEP & Services'
    | 'Finishes & Interior'
    | 'Handover & Audit';
  description: string;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
  progressPercent: number;
  estimatedBudget: number;
  spentAmount: number;
  leadContractor?: string;
  tasks: MilestoneTask[];
  orderIds: string[];
  materials: MilestoneMaterialRequirement[];
  inspectionNotes?: string;
  sitePhotos?: string[];
}

export interface CustomerProject {
  id: string;
  customerId: string;
  title: string; // e.g. "My Whitefield Villa", "Kitchen Renovation"
  projectType: 'residential_villa' | 'renovation' | 'commercial' | 'interior';
  siteAddress: string;
  sitePincode: string;
  targetBudget: number;
  spentSoFar: number;
  status: 'planning' | 'in_progress' | 'finishing' | 'completed';
  orderIds: string[];
  bookingIds: string[];
  quotationIds: string[];
  estimatedCompletionDate?: string;
  milestones?: ConstructionMilestone[];
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string; // "Primary Site", "Office", "Plot #14"
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'UPI' | 'NET_BANKING' | 'CARD' | 'WALLET' | 'COD';
  methodDetails?: string;
  amount: number;
  currency: 'INR';
  status: 'pending' | 'initiated' | 'authorized' | 'paid' | 'failed' | 'partially_refunded' | 'refunded' | 'disputed';
  provider?: 'razorpay' | 'sandbox';
  gatewayOrderId?: string;
  gatewayTransactionId: string;
  gatewaySignature?: string;
  idempotencyKey?: string;
  signatureVerified: boolean;
  isDevelopmentMode: boolean;
  refundedAmount?: number;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialLedgerEntry {
  id: string;
  transactionRef: string;
  orderId: string;
  entryType: 'ORDER_PAYMENT' | 'PLATFORM_COMMISSION' | 'GATEWAY_FEE' | 'VENDOR_PAYABLE' | 'DELIVERY_PAYABLE' | 'REFUND';
  amount: number; // in INR
  debitAccount: string;
  creditAccount: string;
  description: string;
  createdAt: string;
}

export interface VendorSettlement {
  id: string;
  settlementNumber: string;
  vendorId: string;
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  platformCommission: number;
  gatewayDeductions: number;
  netPayable: number;
  status: 'pending' | 'processing' | 'settled' | 'on_hold';
  settlementDate?: string;
  utrNumber?: string;
}

export interface DeliveryAgentProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  verificationStatus: 'approved' | 'pending' | 'rejected';
  vehicleType: 'Tata 407 Tipper (4-Tonne)' | 'Piaggio Ape (1-Tonne)' | 'Ashok Leyland 16-Tonne Multi-Axle' | 'Flatbed Heavy Carrier';
  vehicleNumber: string;
  maxWeightCapacityKg: number;
  maxVolumeCubicMeters: number;
  serviceCity: string;
  serviceRadiusKm: number;
  isAvailable: boolean;
  totalTripsCompleted: number;
  currentAssignmentId?: string;
  rating: number;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  deliveryAgentId?: string;
  agentName?: string;
  agentPhone?: string;
  vehicleType: string;
  estimatedWeightKg: number;
  status: 'eligible_for_dispatch' | 'assigned' | 'accepted' | 'arrived_pickup' | 'in_transit' | 'delivered' | 'failed';
  proofOfDelivery?: {
    verifiedOtp: string;
    recipientName: string;
    timestamp: string;
    notes?: string;
  };
  deliveryCharge: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'booking' | 'delivery' | 'system' | 'kyc' | 'price_alert';
  read: boolean;
  linkTab?: string;
  referenceId?: string;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  materialId: string;
  materialName: string;
  brand: string;
  unit: string;
  currentPriceAtCreation: number;
  targetPrice: number;
  status: 'active' | 'triggered' | 'paused';
  triggeredPrice?: number;
  triggeredAt?: string;
  acknowledged?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  userId: string;
  userName: string;
  targetType: 'material' | 'equipment' | 'professional' | 'contractor' | 'delivery';
  targetId: string;
  orderOrBookingId: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedTransaction: boolean;
  status: 'published' | 'pending_moderation' | 'hidden';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  category: 'delivery_delay' | 'material_defect' | 'billing_payment' | 'equipment_breakdown' | 'labour_dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  orderOrBookingRef?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PlatformSettings {
  platformName: string;
  defaultCurrency: string;
  baseCommissionPercent: number;
  gatewayFeePercent: number;
  supportPhone: string;
  supportEmail: string;
  serviceableCities: string[];
  maintenanceMode: boolean;
}

export interface MaterialEstimationInput {
  plotAreaSqFt: number;
  floors: number;
  quality: 'standard' | 'premium' | 'luxury';
  city: string;
}

export interface MaterialEstimationResult {
  builtUpAreaSqFt: number;
  estimatedTotalCost: number;
  costPerSqFt: number;
  materials: {
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    matchingCategory: MaterialCategory;
  }[];
  notes: string[];
}

