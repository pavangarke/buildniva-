import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { db, hashPassword, verifyPassword, sanitizeUser, StoredUser } from '../db.js';
import {
  MaterialCategory,
  MaterialProduct,
  Order,
  OrderItem,
  OrderStatus,
  PaymentRecord,
  User,
  UserRole,
  ProfessionalProfile,
  ProjectSample,
} from '../../src/types/index.js';

export const apiRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function persistImageSource(raw: unknown, prefix = 'prod'): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
  if (match) {
    const extRaw = match[1].toLowerCase();
    const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 0 && buffer.length <= 15 * 1024 * 1024) {
      const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      return `/uploads/${filename}`;
    }
  }
  return trimmed;
}

function normalizeProductMedia(imagesInput: unknown, imageUrlInput: unknown, prefix = 'mat') {
  const rawList: string[] = [];
  if (Array.isArray(imagesInput)) {
    for (const item of imagesInput) {
      if (typeof item === 'string' && item.trim()) rawList.push(item.trim());
    }
  }
  if (typeof imageUrlInput === 'string' && imageUrlInput.trim()) {
    const single = imageUrlInput.trim();
    if (!rawList.includes(single)) rawList.unshift(single);
  }
  const normalizedImages = Array.from(
    new Set(rawList.map((src) => persistImageSource(src, prefix)).filter(Boolean))
  );
  return {
    images: normalizedImages,
    imageUrl: normalizedImages[0],
  };
}

apiRouter.post('/uploads/image', (req: Request, res: Response) => {
  const { dataUrl, prefix } = req.body || {};
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl.trim())) {
    return res.status(400).json({ error: 'Invalid image payload. Expected PNG, JPEG, WebP, or GIF data URL.' });
  }
  try {
    const safePrefix = typeof prefix === 'string' && /^[a-z0-9_-]{1,20}$/i.test(prefix) ? prefix : 'prod';
    const url = persistImageSource(dataUrl, safePrefix);
    if (!url.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Image could not be processed (max 15MB).' });
    }
    res.status(201).json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to store uploaded image on server.' });
  }
});

const pendingGatewaySessions = new Map<
  string,
  {
    gatewayOrderId: string;
    orderIds: string[];
    amountInr: number;
    amountPaise: number;
    provider: 'razorpay' | 'sandbox';
    createdAt: string;
  }
>();

function getGatewayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const isLiveRazorpay =
    Boolean(keyId) &&
    Boolean(keySecret) &&
    !keyId.includes('MY_') &&
    !keySecret.includes('MY_');
  return {
    provider: (isLiveRazorpay ? 'razorpay' : 'sandbox') as 'razorpay' | 'sandbox',
    keyId: isLiveRazorpay ? keyId : undefined,
    signingSecret: isLiveRazorpay
      ? keySecret
      : process.env.PAYMENT_SANDBOX_SECRET || 'bn_sandbox_gateway_hmac_secret_2026',
  };
}

function signGatewayPayload(gatewayOrderId: string, gatewayPaymentId: string): string {
  const { signingSecret } = getGatewayConfig();
  return crypto
    .createHmac('sha256', signingSecret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest('hex');
}

function verifyGatewayHmac(gatewayOrderId: string, gatewayPaymentId: string, providedSignature: string): boolean {
  if (!gatewayOrderId || !gatewayPaymentId || !providedSignature) return false;
  const expected = signGatewayPayload(gatewayOrderId, gatewayPaymentId);
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(providedSignature.trim(), 'hex');
    if (expectedBuf.length === 0 || expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function getSessionUser(req: Request): User | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  const session = db.getSession(token);
  if (!session) return null;
  const user = db.getUserById(session.userId);
  if (!user || user.suspended) return null;
  return user;
}

function requireAdmin(req: Request, res: Response): User | null {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Administrator authentication required' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required' });
    return null;
  }
  return user;
}

// ================= AUTH & USER ROUTES =================
apiRouter.get('/auth/users', (_req: Request, res: Response) => {
  res.json({ users: db.getUsers() });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  const user = db.getUserById(session.userId);
  if (!user) {
    db.deleteSession(token);
    return res.status(401).json({ error: 'User account not found' });
  }
  if (user.suspended) {
    db.deleteSession(token);
    return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
  }
  res.json({ user });
});

apiRouter.put('/auth/me', (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  const existing = db.getRawUserById(session.userId);
  if (!existing) {
    return res.status(404).json({ error: 'User account not found' });
  }
  if (existing.suspended) {
    return res.status(403).json({ error: 'Account suspended' });
  }

  const { name, phone, city, pincode, avatar, bankDetails } = req.body;
  const updates: Partial<StoredUser> = {};
  if (typeof name === 'string') {
    if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
    updates.name = name.trim();
  }
  if (typeof phone === 'string') {
    if (!phone.trim()) return res.status(400).json({ error: 'Phone number cannot be empty' });
    updates.phone = phone.trim();
  }
  if (typeof city === 'string' && city.trim()) {
    updates.city = city.trim();
  }
  if (typeof pincode === 'string' && pincode.trim()) {
    updates.pincode = pincode.trim();
  }
  if (typeof avatar === 'string') {
    updates.avatar = avatar.trim() || undefined;
  }
  if (bankDetails && typeof bankDetails === 'object') {
    updates.bankDetails = {
      accountName: typeof bankDetails.accountName === 'string' ? bankDetails.accountName.trim() : existing.bankDetails?.accountName,
      accountNumber: typeof bankDetails.accountNumber === 'string' ? bankDetails.accountNumber.trim() : existing.bankDetails?.accountNumber,
      ifscCode: typeof bankDetails.ifscCode === 'string' ? bankDetails.ifscCode.trim().toUpperCase() : existing.bankDetails?.ifscCode,
      bankName: typeof bankDetails.bankName === 'string' ? bankDetails.bankName.trim() : existing.bankDetails?.bankName,
    };
  }

  const updated = db.updateUser(existing.id, updates);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
  db.logAction(updated.id, updated.name, updated.role, 'UPDATE_PROFILE', 'user', updated.id, 'User updated profile or bank details');
  res.json({ user: updated, message: 'Profile updated successfully' });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const rawUser = db.getRawUserByEmail(String(email));
  if (!rawUser || !verifyPassword(String(password), rawUser.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (rawUser.suspended) {
    return res.status(403).json({ error: 'Account suspended. Contact BuildNiva support.' });
  }
  const session = db.createSession(rawUser.id);
  const safeUser = sanitizeUser(rawUser);
  db.logAction(safeUser.id, safeUser.name, safeUser.role, 'USER_LOGIN', 'user', safeUser.id, 'Authenticated with email and password');
  res.json({ user: safeUser, token: session.token, message: 'Signed in successfully' });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = extractBearerToken(req);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ message: 'Signed out successfully' });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const payload = req.body;
  const {
    name,
    email,
    password,
    phone,
    role,
    businessName,
    businessType,
    gstin,
    panNumber,
    tradeLicenseNumber,
    bankDetails,
    city,
    pincode,
  } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be self-registered' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.getRawUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  const avatar = payload.avatarUrl || payload.profilePic || payload.avatar;
  const newUser: StoredUser = {
    id: `usr_${Date.now()}`,
    name: String(name).trim(),
    email: cleanEmail,
    passwordHash: hashPassword(String(password)),
    phone: phone ? String(phone).trim() : '+91 98000 00000',
    role: role as UserRole,
    approvedRoles: [role as UserRole],
    businessName,
    businessType,
    gstin,
    panNumber,
    tradeLicenseNumber,
    bankDetails,
    city: city || 'Bengaluru',
    pincode: pincode || '560001',
    verificationStatus: role === 'customer' ? 'approved' : 'pending',
    avatar: avatar || undefined,
    createdAt: new Date().toISOString(),
  };
  const created = db.createUser(newUser);
  const session = db.createSession(created.id);

  // If registering as professional (civil engineer / architect), automatically create their public profile
  if (role === 'professional') {
    db.createProfessional({
      id: `pro_${created.id}`,
      name: created.name,
      title: payload.title || (payload.specialization ? `Licensed ${payload.specialization}` : 'Chartered Civil Engineer'),
      registrationNumber: payload.registrationNumber || `IEI/CIV/${Date.now().toString().slice(-6)}`,
      experienceYears: Number(payload.experienceYears) || 5,
      specialization: (payload.specialization as any) || 'Civil & Structural Engineer',
      city: created.city,
      serviceableCities: [created.city],
      education: payload.education || 'B.Tech / B.E. Civil Engineering',
      consultationFee: Number(payload.consultationFee) || 1200,
      siteVisitFee: Number(payload.siteVisitFee) || 3500,
      planApprovalFee: Number(payload.planApprovalFee) || 15000,
      structuralDrawingsRate: Number(payload.structuralDrawingsRate) || 12500,
      architecturalPlansRate: Number(payload.architecturalPlansRate) || 18000,
      mepDesignsRate: Number(payload.mepDesignsRate) || 9500,
      siteAuditsRate: Number(payload.siteAuditsRate) || 4500,
      bio: payload.bio || 'Civil Engineer / Architect offering structural drawings, 3D architectural plans, MEP designs, and site audits.',
      languages: payload.languages || ['English', 'Hindi'],
      rating: 5.0,
      completedProjects: 1,
      verificationStatus: 'approved',
      avatarUrl: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      profilePic: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      portfolioProjects: [
        {
          id: `proj_${Date.now()}_1`,
          title: 'Residential Villa Structural RCC Framing & Detailing',
          category: 'Structural Drawings',
          imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
          description: 'Structural drawing with column grid, foundation depths, and seismic reinforcement detailing.',
          projectType: 'Residential Villa',
          dateAdded: new Date().toISOString().split('T')[0],
        },
      ],
      servicesOffered: [
        {
          key: 'structural_drawings',
          title: 'Structural Drawings & Framing',
          description: 'RCC frame design, footing & column layout, beam schedules, and seismic stability drawings.',
          startingPrice: Number(payload.structuralDrawingsRate) || 12500,
          deliveryTime: '3-5 Working Days',
          enabled: true,
        },
        {
          key: '3d_architectural_plans',
          title: '3D Architectural Plans & BIM Models',
          description: 'Photorealistic 3D elevations, Vastu-compliant 2D layouts, and interior mood visualizations.',
          startingPrice: Number(payload.architecturalPlansRate) || 18000,
          deliveryTime: '4-7 Working Days',
          enabled: true,
        },
        {
          key: 'mep_designs',
          title: 'MEP Designs (Mechanical, Electrical, Plumbing)',
          description: 'Plumbing schematics, sanitary risers, electrical wiring, and solar/HVAC conduits.',
          startingPrice: Number(payload.mepDesignsRate) || 9500,
          deliveryTime: '3-4 Working Days',
          enabled: true,
        },
        {
          key: 'site_audits',
          title: 'Site Audits & Structural Inspection',
          description: 'Pre-pour rebar inspection, Schmidt hammer testing, and certified structural stability reports.',
          startingPrice: Number(payload.siteAuditsRate) || 4500,
          deliveryTime: '1-2 Working Days',
          enabled: true,
        },
      ],
    });
  }

  db.logAction(created.id, created.name, created.role, 'REGISTER_ACCOUNT', 'user', created.id, `New account registered as ${role}`);
  res.status(201).json({ user: created, token: session.token, message: 'Account registered successfully' });
});

// ================= MATERIALS MARKETPLACE =================
apiRouter.get('/materials', (req: Request, res: Response) => {
  let materials = db.getMaterials();
  const { category, search, minPrice, maxPrice, brand, vendorId } = req.query;

  if (category && category !== 'All') {
    materials = materials.filter((m) => m.category === category);
  }
  if (brand) {
    materials = materials.filter((m) => m.brand.toLowerCase() === (brand as string).toLowerCase());
  }
  if (vendorId) {
    materials = materials.filter((m) => m.vendorId === vendorId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    materials = materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }
  if (minPrice) {
    materials = materials.filter((m) => m.pricePerUnit >= Number(minPrice));
  }
  if (maxPrice) {
    materials = materials.filter((m) => m.pricePerUnit <= Number(maxPrice));
  }

  res.json({ materials });
});

apiRouter.get('/materials/:id', (req: Request, res: Response) => {
  const material = db.getMaterialById(req.params.id);
  if (!material) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ material });
});

apiRouter.post('/materials', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.name || !payload.category || !payload.pricePerUnit || !payload.unit) {
    return res.status(400).json({ error: 'Missing mandatory product fields (name, category, price, unit)' });
  }

  const media = normalizeProductMedia(payload.images, payload.imageUrl, 'mat');

  const newProduct: MaterialProduct = {
    id: `mat_${Date.now()}`,
    name: payload.name,
    category: payload.category as MaterialCategory,
    brand: payload.brand || 'Unbranded / Local Yard',
    description: payload.description || '',
    vendorId: payload.vendorId || 'usr_vend_01',
    vendorName: payload.vendorName || 'Agarwal Cement & Steel Traders',
    vendorCity: payload.vendorCity || 'Bengaluru',
    unit: payload.unit,
    pricePerUnit: Number(payload.pricePerUnit),
    mrp: payload.mrp ? Number(payload.mrp) : Math.round(Number(payload.pricePerUnit) * 1.15),
    gstRate: Number(payload.gstRate) || 18,
    minOrderQty: Number(payload.minOrderQty) || 1,
    availableStock: Number(payload.availableStock) || 100,
    bulkTiers: payload.bulkTiers || [],
    serviceablePincodes: payload.serviceablePincodes || ['560001', '560034', '560068'],
    deliveryEstimateDays: Number(payload.deliveryEstimateDays) || 2,
    deliveryChargePerUnit: Number(payload.deliveryChargePerUnit) || 10,
    specifications: payload.specifications || {},
    returnEligible: Boolean(payload.returnEligible),
    status: 'active',
    rating: 5.0,
    reviewCount: 1,
    imageFallbackCategory: payload.category.toLowerCase().split(' ')[0],
    imageUrl: media.imageUrl,
    images: media.images,
    sku: payload.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
    hsnCode: payload.hsnCode || '252329',
    weightKgPerUnit: Number(payload.weightKgPerUnit) || 50,
  };

  const created = db.createMaterial(newProduct);
  db.logAction(payload.vendorId || 'usr_vend_01', payload.vendorName || 'Vendor', 'vendor', 'CREATE_MATERIAL_LISTING', 'material', created.id, `Listed ${created.name}`);
  res.status(201).json({ material: created, message: 'Product catalog listing published successfully' });
});

apiRouter.put('/materials/:id', (req: Request, res: Response) => {
  const updates: Partial<MaterialProduct> = { ...req.body };
  if (updates.images !== undefined || updates.imageUrl !== undefined) {
    const media = normalizeProductMedia(updates.images, updates.imageUrl, 'mat');
    updates.images = media.images;
    updates.imageUrl = media.imageUrl;
  }
  const updated = db.updateMaterial(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  db.logAction(updated.vendorId, updated.vendorName, 'vendor', 'UPDATE_MATERIAL_LISTING', 'material', updated.id, `Updated listing ${updated.name}`);
  res.json({ material: updated, message: 'Listing updated successfully' });
});

apiRouter.delete('/materials/:id', (req: Request, res: Response) => {
  const mat = db.getMaterialById(req.params.id);
  if (!mat) {
    return res.status(404).json({ error: 'Product not found' });
  }
  db.deleteMaterial(req.params.id);
  db.logAction(mat.vendorId, mat.vendorName, 'vendor', 'DELETE_MATERIAL_LISTING', 'material', req.params.id, `Deleted listing ${mat.name}`);
  res.json({ success: true, message: 'Product listing removed from marketplace' });
});

// ================= EQUIPMENT RENTAL =================
apiRouter.get('/equipment', (req: Request, res: Response) => {
  let equipment = db.getEquipment();
  const { category, city, search } = req.query;

  if (category && category !== 'All') {
    equipment = equipment.filter((e) => e.category === category);
  }
  if (city) {
    equipment = equipment.filter((e) => e.city.toLowerCase() === (city as string).toLowerCase());
  }
  if (search) {
    const q = (search as string).toLowerCase();
    equipment = equipment.filter(
      (e) => e.name.toLowerCase().includes(q) || e.model.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
  }

  res.json({ equipment });
});

apiRouter.post('/equipment/book', (req: Request, res: Response) => {
  const { equipmentId, customerId, customerName, customerPhone, siteAddress, startDate, durationDays, includeOperator } = req.body;

  if (!equipmentId || !startDate || !durationDays || !siteAddress) {
    return res.status(400).json({ error: 'All booking fields (equipment, date, duration, site address) are required' });
  }

  const machine = db.getEquipmentById(equipmentId);
  if (!machine) {
    return res.status(404).json({ error: 'Equipment machinery not found' });
  }

  // Check date conflict
  if (machine.blockedDates.includes(startDate)) {
    return res.status(409).json({ error: 'Selected equipment is already reserved on this date. Please pick another date.' });
  }

  const days = Math.max(Number(durationDays), machine.minDurationDays);
  const rentalCost = machine.dailyRate * days;
  const operatorCost = includeOperator ? machine.operatorChargePerDay * days : 0;
  const totalAmount = rentalCost + operatorCost + machine.securityDeposit;

  const booking = db.createEquipmentBooking({
    id: `bk_eq_${Date.now()}`,
    bookingNumber: `BC-EQ-${Math.floor(100000 + Math.random() * 900000)}`,
    equipmentId: machine.id,
    equipmentName: machine.name,
    providerId: machine.providerId,
    customerId: customerId || 'usr_cust_01',
    customerName: customerName || 'Vikram Malhotra',
    customerPhone: customerPhone || '+91 98201 44521',
    siteAddress,
    startDate,
    durationDays: days,
    includeOperator: Boolean(includeOperator),
    rentalCost,
    operatorCost,
    securityDeposit: machine.securityDeposit,
    totalAmount,
    status: 'requested',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ booking, message: 'Equipment rental request sent to provider.' });
});

// ================= PROFESSIONALS (ENGINEERS & ARCHITECTS) =================
apiRouter.get('/professionals', (req: Request, res: Response) => {
  let pros = db.getProfessionals();
  const { specialization, city } = req.query;

  if (specialization && specialization !== 'All') {
    pros = pros.filter((p) => p.specialization === specialization);
  }
  if (city) {
    pros = pros.filter((p) => p.city.toLowerCase() === (city as string).toLowerCase());
  }

  res.json({ professionals: pros });
});

apiRouter.post('/professionals', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload.name || !payload.specialization) {
    return res.status(400).json({ error: 'Name and specialization are required' });
  }

  const avatar = payload.avatarUrl || payload.profilePic || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  const newPro: ProfessionalProfile = {
    id: payload.id || `pro_${Date.now()}`,
    name: payload.name,
    title: payload.title || `Licensed ${payload.specialization}`,
    registrationNumber: payload.registrationNumber || `IEI/CIV/${Date.now().toString().slice(-6)}`,
    experienceYears: Number(payload.experienceYears) || 5,
    specialization: payload.specialization,
    city: payload.city || 'Bengaluru',
    serviceableCities: payload.serviceableCities || [payload.city || 'Bengaluru'],
    education: payload.education || 'B.Tech / B.E. Civil',
    consultationFee: Number(payload.consultationFee) || 1200,
    siteVisitFee: Number(payload.siteVisitFee) || 3500,
    planApprovalFee: Number(payload.planApprovalFee) || 15000,
    bio: payload.bio || '',
    languages: payload.languages || ['English', 'Hindi'],
    rating: 5.0,
    completedProjects: 1,
    verificationStatus: 'approved',
    avatarUrl: avatar,
    profilePic: avatar,
  };

  const created = db.createProfessional(newPro);
  res.status(201).json({ professional: created, message: 'Engineer profile created successfully' });
});

apiRouter.put('/professionals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const pro = db.getProfessionalById(id);
  if (!pro) {
    return res.status(404).json({ error: 'Professional not found' });
  }

  if (updates.avatarUrl || updates.profilePic) {
    const pic = updates.avatarUrl || updates.profilePic;
    updates.avatarUrl = pic;
    updates.profilePic = pic;
  }

  const updated = db.updateProfessional(id, updates);

  // If there's a matching user account (by name or linked id), update their avatar as well
  const users = db.getUsers();
  const linkedUser = users.find((u) => u.name === pro.name || id.includes(u.id));
  if (linkedUser && updates.avatarUrl) {
    db.updateUser(linkedUser.id, { avatar: updates.avatarUrl });
  }

  res.json({ professional: updated, message: 'Profile picture and details updated successfully' });
});

// Add Project Sample Picture (Drawings, 3D Plans, MEP, Site Audits)
apiRouter.post('/professionals/:id/projects', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, category, imageUrl, description, projectType } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Project title and image URL are required.' });
  }

  const pro = db.getProfessionalById(id);
  if (!pro) {
    return res.status(404).json({ error: 'Professional not found' });
  }

  const newProject: ProjectSample = {
    id: `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    category: category || 'Structural Drawings',
    imageUrl,
    description: description || '',
    projectType: projectType || 'Residential Villa',
    dateAdded: new Date().toISOString().split('T')[0],
  };

  const updated = db.addProfessionalProject(id, newProject);
  res.status(201).json({
    project: newProject,
    professional: updated,
    message: 'Sample project picture added successfully to your portfolio!',
  });
});

// Delete Project Sample Picture
apiRouter.delete('/professionals/:id/projects/:projectId', (req: Request, res: Response) => {
  const { id, projectId } = req.params;
  const pro = db.getProfessionalById(id);
  if (!pro) {
    return res.status(404).json({ error: 'Professional not found' });
  }

  const updated = db.deleteProfessionalProject(id, projectId);
  res.json({
    professional: updated,
    message: 'Sample project picture removed from portfolio.',
  });
});

// Get all bookings / inquiries for professionals (optionally filtered by professionalId)
apiRouter.get('/professionals/bookings', (req: Request, res: Response) => {
  const { professionalId } = req.query;
  const bookings = db.getProfessionalBookings(professionalId as string | undefined);
  res.json({ bookings });
});

// Specific inquiries for an engineer / architect profile
apiRouter.get('/professionals/:id/inquiries', (req: Request, res: Response) => {
  const { id } = req.params;
  const inquiries = db.getProfessionalBookings(id);
  res.json({ inquiries });
});

// Customer direct inquiry / contact submission to an engineer
apiRouter.post('/professionals/inquire', (req: Request, res: Response) => {
  const {
    professionalId,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    customerCity,
    serviceType,
    urgency,
    siteLocation,
    projectDescription,
  } = req.body;

  const pro = db.getProfessionalById(professionalId);
  if (!pro) {
    return res.status(404).json({ error: 'Professional not found' });
  }

  let fee = pro.consultationFee;
  if (serviceType === 'structural_drawings') fee = pro.structuralDrawingsRate || 12500;
  else if (serviceType === '3d_architectural_plans') fee = pro.architecturalPlansRate || 18000;
  else if (serviceType === 'mep_designs') fee = pro.mepDesignsRate || 9500;
  else if (serviceType === 'site_audits') fee = pro.siteAuditsRate || 4500;
  else if (serviceType === 'site_inspection') fee = pro.siteVisitFee;

  const inquiry = db.createProfessionalBooking({
    id: `inq_pro_${Date.now()}`,
    bookingNumber: `BC-INQ-${Math.floor(100000 + Math.random() * 900000)}`,
    professionalId: pro.id,
    professionalName: pro.name,
    customerId: customerId || 'usr_cust_01',
    customerName: customerName || 'Home Builder',
    customerPhone: customerPhone || '+91 98201 44521',
    customerEmail: customerEmail || 'customer@buildconnect.in',
    customerCity: customerCity || 'Bengaluru',
    serviceType: serviceType || 'structural_drawings',
    inquiryType: 'direct_inquiry',
    urgency: urgency || 'Standard',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    timeSlot: '11:00 AM - 12:00 PM',
    siteLocation: siteLocation || `${customerCity || 'Bengaluru'} Site`,
    projectDescription: projectDescription || 'Project requirement inquiry from BuildNiva profile.',
    fee,
    status: 'scheduled',
    meetingLink: serviceType === 'online_consultation' ? 'https://meet.google.com/bld-cnct-eng' : undefined,
    professionalAvatar: pro.avatarUrl || pro.profilePic,
    engineerNotes: 'New customer direct inquiry received from public profile list.',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({
    inquiry,
    message: `Inquiry successfully submitted to ${pro.name}. The engineer has been notified with your contact details.`,
  });
});

// Update inquiry / booking status & engineer notes
apiRouter.patch('/professionals/bookings/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updated = db.updateProfessionalBookingStatus(id, status, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Inquiry or booking record not found' });
  }

  res.json({
    booking: updated,
    message: `Inquiry status updated to ${status}.`,
  });
});

apiRouter.post('/professionals/book', (req: Request, res: Response) => {
  const {
    professionalId,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    customerCity,
    serviceType,
    urgency,
    date,
    timeSlot,
    siteLocation,
    projectDescription,
  } = req.body;

  const pro = db.getProfessionalById(professionalId);
  if (!pro) {
    return res.status(404).json({ error: 'Professional not found' });
  }

  let fee = pro.consultationFee;
  if (serviceType === 'structural_drawings') fee = pro.structuralDrawingsRate || 12500;
  else if (serviceType === '3d_architectural_plans') fee = pro.architecturalPlansRate || 18000;
  else if (serviceType === 'mep_designs') fee = pro.mepDesignsRate || 9500;
  else if (serviceType === 'site_audits') fee = pro.siteAuditsRate || 4500;
  else if (serviceType === 'site_inspection') fee = pro.siteVisitFee;
  else if (serviceType === 'estimation') fee = pro.planApprovalFee ? Math.round(pro.planApprovalFee / 2) : 5000;

  const booking = db.createProfessionalBooking({
    id: `bk_pro_${Date.now()}`,
    bookingNumber: `BC-PRO-${Math.floor(100000 + Math.random() * 900000)}`,
    professionalId: pro.id,
    professionalName: pro.name,
    customerId: customerId || 'usr_cust_01',
    customerName: customerName || 'Vikram Malhotra',
    customerPhone: customerPhone || '+91 98201 44521',
    customerEmail: customerEmail || 'customer@buildconnect.in',
    customerCity: customerCity || 'Bengaluru',
    serviceType: serviceType || 'online_consultation',
    inquiryType: 'deliverable_order',
    urgency: urgency || 'Standard',
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '10:00 AM - 11:00 AM',
    siteLocation,
    projectDescription: projectDescription || 'Structural review and site inspection requirement',
    fee,
    status: 'scheduled',
    meetingLink: serviceType === 'online_consultation' ? 'https://meet.google.com/bld-cnct-eng' : undefined,
    professionalAvatar: pro.avatarUrl || pro.profilePic,
    engineerNotes: 'Appointment scheduled with client. Awaiting preliminary project documents.',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ booking, message: 'Appointment confirmed with professional.' });
});

// ================= LABOUR MARKETPLACE =================
apiRouter.get('/labour', (req: Request, res: Response) => {
  let workers = db.getLabourers();
  const { trade } = req.query;
  if (trade && trade !== 'All') {
    workers = workers.filter((w) => w.trade === trade);
  }
  res.json({ labourers: workers, requests: db.getLabourRequests() });
});

apiRouter.post('/labour/:id/photos', (req: Request, res: Response) => {
  const { id } = req.params;
  const { photoUrl, workPhotoUrl } = req.body;
  const lab = db.getLabourerById(id);
  if (!lab) {
    return res.status(404).json({ error: 'Labour profile not found' });
  }
  const updates: any = {};
  if (photoUrl) updates.photoUrl = photoUrl;
  if (workPhotoUrl) {
    updates.workPhotos = [...(lab.workPhotos || []), workPhotoUrl];
  }
  const updated = db.updateLabourer(id, updates);
  res.json({ labourer: updated, message: 'Labour photo updated successfully' });
});

apiRouter.post('/labour/hire', (req: Request, res: Response) => {
  const { trade, headcount, startDate, durationDays, siteAddress, city, dailyRateOffered, notes, customerName } = req.body;

  if (!trade || !headcount || !startDate || !siteAddress) {
    return res.status(400).json({ error: 'Trade, headcount, start date, and site address are required' });
  }

  const rate = Number(dailyRateOffered) || 850;
  const count = Number(headcount) || 1;
  const days = Number(durationDays) || 1;
  const estimatedTotal = rate * count * days;

  const request = db.createLabourRequest({
    id: `req_lab_${Date.now()}`,
    requestNumber: `BC-LAB-${Math.floor(100000 + Math.random() * 900000)}`,
    customerId: 'usr_cust_01',
    customerName: customerName || 'Vikram Malhotra',
    trade,
    headcount: count,
    startDate,
    durationDays: days,
    siteAddress,
    city: city || 'Bengaluru',
    dailyRateOffered: rate,
    estimatedTotal,
    status: 'open',
    assignedWorkersCount: 0,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ request, message: 'Labour work requisition created. Matching workers notified.' });
});

// ================= CONTRACTOR MARKETPLACE =================
apiRouter.get('/contractors', (_req: Request, res: Response) => {
  res.json({ contractors: db.getContractors(), quotations: db.getQuotations() });
});

apiRouter.post('/contractors/quotation', (req: Request, res: Response) => {
  const { contractorId, projectType, plotAreaSqFt, floors, siteCity, customerName, scopeSummary } = req.body;

  const contractor = db.getContractorById(contractorId) || db.getContractors()[0];
  const area = Number(plotAreaSqFt) || 2000;
  const flrs = Number(floors) || 2;
  const builtUp = area * flrs;
  const totalBudget = builtUp * contractor.averageRatePerSqFt;

  const quotation = db.createQuotation({
    id: `quot_${Date.now()}`,
    contractorId: contractor.id,
    contractorName: contractor.businessName,
    customerId: 'usr_cust_01',
    customerName: customerName || 'Vikram Malhotra',
    projectType: projectType || 'Turnkey Residential Construction',
    plotAreaSqFt: area,
    floors: flrs,
    siteCity: siteCity || 'Bengaluru',
    estimatedBudget: totalBudget,
    scopeSummary: scopeSummary || 'End-to-end civil structure, foundation, RCC columns, brick masonry, plastering, plumbing, and electrical conduits.',
    milestones: [
      { name: 'Site Preparation & Excavation', percentage: 15, amount: totalBudget * 0.15, status: 'pending' },
      { name: 'Plinth Beam & Column Casting', percentage: 25, amount: totalBudget * 0.25, status: 'pending' },
      { name: 'Roof Slab Castings (G+1)', percentage: 30, amount: totalBudget * 0.3, status: 'pending' },
      { name: 'Brickwork & Wall Plastering', percentage: 20, amount: totalBudget * 0.2, status: 'pending' },
      { name: 'Final Handover & Snagging', percentage: 10, amount: totalBudget * 0.1, status: 'pending' },
    ],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'submitted',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ quotation, message: 'Quotation estimate generated and submitted.' });
});

// ================= CART, CHECKOUT & ORDERS =================
// Server-side calculation engine
apiRouter.post('/orders/calculate', (req: Request, res: Response) => {
  const { items } = req.body; // array of { productId, quantity }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let subtotal = 0;
  let totalGst = 0;
  let totalDelivery = 0;
  const calculatedItems = [];

  for (const item of items) {
    const product = db.getMaterialById(item.productId);
    if (!product) {
      return res.status(404).json({ error: `Product ID ${item.productId} not found` });
    }

    const qty = Math.max(item.quantity, product.minOrderQty);
    let unitPrice = product.pricePerUnit;

    // Apply bulk tier if eligible
    if (product.bulkTiers && product.bulkTiers.length > 0) {
      const sortedTiers = [...product.bulkTiers].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sortedTiers) {
        if (qty >= tier.minQty) {
          unitPrice = tier.pricePerUnit;
          break;
        }
      }
    }

    const itemSubtotal = unitPrice * qty;
    const itemGst = Math.round(itemSubtotal * (product.gstRate / 100));
    const itemDelivery = Math.round(product.deliveryChargePerUnit * qty);
    const itemTotal = itemSubtotal + itemGst + itemDelivery;

    subtotal += itemSubtotal;
    totalGst += itemGst;
    totalDelivery += itemDelivery;

    calculatedItems.push({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      unit: product.unit,
      quantity: qty,
      unitPrice,
      gstRate: product.gstRate,
      totalGst: itemGst,
      deliveryCharge: itemDelivery,
      totalPrice: itemTotal,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    });
  }

  res.json({
    items: calculatedItems,
    subtotal,
    totalGst,
    totalDelivery,
    grandTotal: subtotal + totalGst + totalDelivery,
  });
});

apiRouter.post('/orders/checkout', (req: Request, res: Response) => {
  const { customerId, customerName, customerPhone, shippingAddress, items, paymentMethod, deferPayment } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cannot place order with empty items' });
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.pincode) {
    return res.status(400).json({ error: 'Valid site delivery address is required' });
  }

  // Validate all item stock before mutating any inventory
  const resolvedItems: { product: MaterialProduct; quantity: number }[] = [];
  for (const it of items) {
    const product = db.getMaterialById(it.productId);
    if (!product) {
      return res.status(404).json({ error: `Material product ${it.productId} not found.` });
    }
    const qty = Math.max(1, Number(it.quantity) || 1);
    if (product.availableStock < qty) {
      return res.status(409).json({
        error: `Insufficient stock for ${product.name}. Requested: ${qty}, Available: ${product.availableStock}`,
      });
    }
    resolvedItems.push({ product, quantity: qty });
  }

  // Group items by vendor for proper multi-vendor dispatch
  const vendorMap = new Map<string, OrderItem[]>();
  const createdOrders: Order[] = [];

  for (const { product, quantity } of resolvedItems) {
    const vId = product.vendorId;
    if (!vendorMap.has(vId)) {
      vendorMap.set(vId, []);
    }

    let unitPrice = product.pricePerUnit;
    if (product.bulkTiers) {
      for (const t of [...product.bulkTiers].sort((a, b) => b.minQty - a.minQty)) {
        if (quantity >= t.minQty) {
          unitPrice = t.pricePerUnit;
          break;
        }
      }
    }

    const lineSubtotal = unitPrice * quantity;
    const lineGst = Math.round(lineSubtotal * (product.gstRate / 100));
    const lineDelivery = Math.round(product.deliveryChargePerUnit * quantity);

    vendorMap.get(vId)!.push({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      unit: product.unit,
      quantity,
      unitPrice,
      gstRate: product.gstRate,
      totalGst: lineGst,
      deliveryCharge: lineDelivery,
      totalPrice: lineSubtotal + lineGst + lineDelivery,
    });

    // Reserve stock in database
    db.decrementStock(product.id, quantity);
  }

  const normalizedMethod = (paymentMethod || 'UPI') as Order['paymentMethod'];
  const isDeferredOnline = Boolean(deferPayment) && normalizedMethod !== 'COD';
  const isCod = normalizedMethod === 'COD';

  // Create order per vendor
  for (const [vendorId, vendorItems] of vendorMap.entries()) {
    const sampleProduct = db.getMaterialById(vendorItems[0].productId);
    const vendorName = sampleProduct ? sampleProduct.vendorName : 'Material Vendor';

    const subtotal = vendorItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
    const totalGst = vendorItems.reduce((acc, curr) => acc + curr.totalGst, 0);
    const totalDelivery = vendorItems.reduce((acc, curr) => acc + curr.deliveryCharge, 0);
    const grandTotal = subtotal + totalGst + totalDelivery;

    const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
    const orderNum = `BC-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      orderNumber: orderNum,
      customerId: customerId || 'usr_cust_01',
      customerName: customerName || 'Vikram Malhotra',
      customerPhone: customerPhone || '+91 98201 44521',
      shippingAddress,
      vendorId,
      vendorName,
      items: vendorItems,
      subtotal,
      totalGst,
      totalDelivery,
      grandTotal,
      status: isDeferredOnline ? 'pending_confirmation' : 'confirmed',
      statusHistory: isDeferredOnline
        ? [
            {
              status: 'pending_confirmation',
              timestamp: now,
              note: 'Order created — inventory reserved, awaiting payment gateway authorization',
            },
          ]
        : [
            {
              status: 'pending_confirmation',
              timestamp: now,
              note: isCod ? 'Cash on Delivery order placed' : 'Payment authorized & order placed',
            },
            {
              status: 'confirmed',
              timestamp: now,
              note: 'Material inventory verified & allocation locked',
            },
          ],
      paymentMethod: normalizedMethod,
      paymentStatus: isDeferredOnline || isCod ? 'pending' : 'paid',
      paymentReference: isDeferredOnline
        ? undefined
        : isCod
        ? `COD-${Date.now().toString(36).toUpperCase()}`
        : `PAY-${Date.now().toString(36).toUpperCase()}`,
      deliveryOtp,
      createdAt: now,
      updatedAt: now,
    };

    const created = db.createOrder(newOrder);
    createdOrders.push(created);
  }

  res.status(201).json({
    orders: createdOrders,
    message: isDeferredOnline
      ? 'Order initialized. Complete payment in the gateway to confirm dispatch.'
      : 'Order placed successfully! Delivery OTP generated.',
  });
});

apiRouter.get('/orders', (_req: Request, res: Response) => {
  res.json({ orders: db.getOrders() });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});

apiRouter.put('/orders/:id/status', (req: Request, res: Response) => {
  const { status, note, deliveryAgent } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  const updated = db.updateOrderStatus(req.params.id, status as OrderStatus, note, deliveryAgent);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order: updated, message: `Status updated to ${status}` });
});

apiRouter.post('/orders/:id/verify-delivery', (req: Request, res: Response) => {
  const { otp } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.deliveryOtp !== otp) {
    return res.status(400).json({ error: 'Invalid 4-digit Delivery OTP. Please ask customer for correct code.' });
  }

  const updated = db.updateOrderStatus(
    req.params.id,
    'delivered',
    `Verified via Customer OTP (${otp}) and signed off by delivery crew.`
  );
  res.json({ order: updated, message: 'Order marked Delivered successfully!' });
});

// ================= AI MATERIAL ESTIMATOR =================
apiRouter.post('/ai/estimate', async (req: Request, res: Response) => {
  const { plotAreaSqFt, floors, quality, city } = req.body;
  const area = Math.max(Number(plotAreaSqFt) || 1200, 200);
  const flrs = Math.max(Number(floors) || 1, 1);
  const builtUpArea = area * flrs;
  const qual = quality || 'standard';

  // Benchmark Indian CPWD construction coefficients
  // Standard: ₹1,650/sqft, Premium: ₹1,950/sqft, Luxury: ₹2,400/sqft
  const rates = {
    standard: 1650,
    premium: 1950,
    luxury: 2400,
  };
  const baseRate = rates[qual as keyof typeof rates] || 1650;
  const totalCost = builtUpArea * baseRate;

  // Scientific thumb rules for material quantities:
  // Cement: 0.4 bags per sq.ft
  // TMT Steel: 3.8 kg per sq.ft = 0.0038 tonnes per sq.ft
  // Sand: 1.8 cubic feet per sq.ft = 0.018 brass per sq.ft
  // Aggregates (Coarse): 1.35 cu.ft per sq.ft = 0.0135 brass
  // AAC / Red Bricks: 18 pieces per sq.ft of built-up area
  // Dr. Fixit Waterproofing: 0.15 litres per sq.ft
  // Asian Paints: 0.18 litres per sq.ft

  const cementBags = Math.round(builtUpArea * 0.4);
  const steelTonnes = Number((builtUpArea * 0.0038).toFixed(2));
  const sandBrass = Number((builtUpArea * 0.018).toFixed(1));
  const aggregateBrass = Number((builtUpArea * 0.0135).toFixed(1));
  const brickPieces = Math.round(builtUpArea * 18);
  const waterproofingLitres = Math.round(builtUpArea * 0.15);
  const paintLitres = Math.round(builtUpArea * 0.18);

  const materialsBreakdown = [
    {
      name: 'OPC / PPC Structural Cement (50kg bags)',
      quantity: cementBags,
      unit: 'bags',
      estimatedCost: cementBags * 385,
      matchingCategory: 'Cement' as MaterialCategory,
    },
    {
      name: 'Fe-550D High Ductility TMT Reinforcement Steel',
      quantity: steelTonnes,
      unit: 'tonnes',
      estimatedCost: Math.round(steelTonnes * 63500),
      matchingCategory: 'TMT Steel' as MaterialCategory,
    },
    {
      name: 'Triple-Washed M-Sand for Masonry & Plastering',
      quantity: sandBrass,
      unit: 'brass',
      estimatedCost: Math.round(sandBrass * 4100),
      matchingCategory: 'Sand & Aggregates' as MaterialCategory,
    },
    {
      name: '20mm & 40mm Graded Blue Metal Coarse Aggregate',
      quantity: aggregateBrass,
      unit: 'brass',
      estimatedCost: Math.round(aggregateBrass * 3400),
      matchingCategory: 'Sand & Aggregates' as MaterialCategory,
    },
    {
      name: 'Precision AAC Masonry Blocks (6-inch)',
      quantity: brickPieces,
      unit: 'blocks',
      estimatedCost: brickPieces * 58,
      matchingCategory: 'Bricks & Blocks' as MaterialCategory,
    },
    {
      name: 'Integral Liquid Waterproofing Compound',
      quantity: waterproofingLitres,
      unit: 'litres',
      estimatedCost: waterproofingLitres * 135,
      matchingCategory: 'Waterproofing' as MaterialCategory,
    },
    {
      name: 'Weather-Proof Exterior & Interior Wall Coating',
      quantity: paintLitres,
      unit: 'litres',
      estimatedCost: paintLitres * 360,
      matchingCategory: 'Paints & Coatings' as MaterialCategory,
    },
  ];

  // Try Gemini AI enhancement for tailored site engineering insights if API key configured
  let aiNotes = [
    `Calculated for ${builtUpArea} sq.ft total built-up area across ${flrs} floor(s) in ${city || 'Bengaluru'}.`,
    `Material estimates adhere to standard Indian CPWD civil engineering thumb-rules and IS 456:2000 specifications.`,
    `Bulk rates applied for high-volume cement and rebar orders with estimated 1-2 day direct site delivery.`,
  ];

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a senior civil engineer at BuildNiva India. Provide 3 brief, actionable technical tips for building a ${builtUpArea} sq.ft ${flrs}-storey building with ${qual} finishes in ${city || 'Bengaluru'}. Return exactly 3 bullet points, each under 20 words. No intro.`,
      });
      if (response && response.text) {
        const lines = response.text
          .split('\n')
          .map((l) => l.replace(/^[-*•0-9.]+\s*/, '').trim())
          .filter(Boolean);
        if (lines.length > 0) {
          aiNotes = lines.slice(0, 3);
        }
      }
    } catch {
      // Fallback works seamlessly
    }
  }

  res.json({
    builtUpAreaSqFt: builtUpArea,
    estimatedTotalCost: totalCost,
    costPerSqFt: baseRate,
    materials: materialsBreakdown,
    notes: aiNotes,
  });
});

// ================= ADMIN STATS =================
apiRouter.get('/admin/stats', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const orders = db.getOrders();
  const gmv = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const materials = db.getMaterials();
  const equipment = db.getEquipment();
  const pros = db.getProfessionals();
  const workers = db.getLabourers();
  const contractors = db.getContractors();

  res.json({
    grossMerchandiseValue: gmv,
    totalOrders: orders.length,
    activeListingsCount: materials.length + equipment.length,
    verifiedProfessionalsCount: pros.length,
    availableWorkersCount: workers.length,
    activeContractorsCount: contractors.length,
    recentOrders: orders.slice(0, 5),
    vendors: db.getUsers().filter((u) => u.approvedRoles.includes('vendor')),
  });
});

// ================= PAYMENTS, LEDGER & SETTLEMENTS =================
apiRouter.get('/payments/config', (_req: Request, res: Response) => {
  const cfg = getGatewayConfig();
  res.json({
    provider: cfg.provider,
    keyId: cfg.keyId,
    currency: 'INR',
    merchantName: 'BuildNiva Marketplace Pvt. Ltd.',
    supportedMethods: ['UPI', 'CARD', 'NET_BANKING', 'WALLET'],
  });
});

apiRouter.post('/payments/create-order', async (req: Request, res: Response) => {
  const { orderIds, orderId } = req.body;
  const targetIds: string[] = Array.isArray(orderIds)
    ? orderIds.filter(Boolean)
    : orderId
    ? [orderId]
    : [];

  if (targetIds.length === 0) {
    return res.status(400).json({ error: 'At least one orderId is required to create a payment order.' });
  }

  const orders: Order[] = [];
  for (const id of targetIds) {
    const ord = db.getOrderById(id);
    if (!ord) {
      return res.status(404).json({ error: `Order ${id} not found.` });
    }
    if (ord.paymentStatus === 'paid') {
      return res.status(409).json({ error: `Order ${ord.orderNumber} is already paid.` });
    }
    if (ord.status === 'cancelled') {
      return res.status(409).json({ error: `Order ${ord.orderNumber} is cancelled and cannot be paid.` });
    }
    orders.push(ord);
  }

  const amountInr = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const amountPaise = Math.round(amountInr * 100);
  const receipt = orders.map((o) => o.orderNumber).join(',').slice(0, 40);
  const cfg = getGatewayConfig();

  let gatewayOrderId = '';
  let activeProvider: 'razorpay' | 'sandbox' = cfg.provider;

  if (cfg.provider === 'razorpay' && cfg.keyId) {
    try {
      const authHeader = Buffer.from(`${cfg.keyId}:${cfg.signingSecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: {
            orderIds: targetIds.join(','),
          },
        }),
      });
      const rzpData: any = await rzpRes.json();
      if (!rzpRes.ok || !rzpData?.id) {
        return res.status(502).json({
          error: rzpData?.error?.description || 'Failed to initialize Razorpay gateway order.',
        });
      }
      gatewayOrderId = rzpData.id;
    } catch (err: any) {
      return res.status(502).json({ error: err?.message || 'Razorpay gateway connection failed.' });
    }
  } else {
    activeProvider = 'sandbox';
    gatewayOrderId = `order_bn_${crypto.randomBytes(6).toString('hex')}`;
  }

  const createdAt = new Date().toISOString();
  pendingGatewaySessions.set(gatewayOrderId, {
    gatewayOrderId,
    orderIds: targetIds,
    amountInr,
    amountPaise,
    provider: activeProvider,
    createdAt,
  });

  for (const ord of orders) {
    db.updateOrderPayment(ord.id, {
      gatewayOrderId,
      note: `Payment gateway session ${gatewayOrderId} initialized (${activeProvider})`,
    });
  }

  res.status(201).json({
    provider: activeProvider,
    keyId: cfg.keyId,
    gatewayOrderId,
    amountInr,
    amountPaise,
    currency: 'INR',
    receipt,
    orderIds: targetIds,
    orderNumbers: orders.map((o) => o.orderNumber),
  });
});

apiRouter.post('/payments/sandbox/authorize', (req: Request, res: Response) => {
  const { gatewayOrderId, paymentMethod, methodDetails, simulateOutcome, failureReason } = req.body;
  const cfg = getGatewayConfig();

  if (cfg.provider !== 'sandbox') {
    return res.status(400).json({ error: 'Sandbox authorization endpoint is unavailable when live Razorpay is active.' });
  }

  if (!gatewayOrderId) {
    return res.status(400).json({ error: 'gatewayOrderId is required.' });
  }

  const session = pendingGatewaySessions.get(gatewayOrderId);
  const matchingOrders = db.getOrders().filter((o) => o.gatewayOrderId === gatewayOrderId);
  if (!session && matchingOrders.length === 0) {
    return res.status(404).json({ error: 'Gateway order session not found or expired.' });
  }

  if (simulateOutcome === 'failed') {
    return res.status(402).json({
      error: failureReason || 'Transaction declined by issuing bank / UPI PSP.',
      code: 'GATEWAY_DECLINED',
      gatewayOrderId,
    });
  }

  const gatewayPaymentId = `pay_bn_${crypto.randomBytes(6).toString('hex')}`;
  const gatewaySignature = signGatewayPayload(gatewayOrderId, gatewayPaymentId);

  res.json({
    gatewayOrderId,
    gatewayPaymentId,
    gatewaySignature,
    paymentMethod: paymentMethod || 'UPI',
    methodDetails: methodDetails || 'UPI Verified',
  });
});

apiRouter.post('/payments/verify-signature', (req: Request, res: Response) => {
  const {
    orderIds,
    orderId,
    gatewayOrderId,
    gatewayPaymentId,
    gatewaySignature,
    paymentMethod,
    methodDetails,
    idempotencyKey,
  } = req.body;

  const targetIds: string[] = Array.isArray(orderIds)
    ? orderIds.filter(Boolean)
    : orderId
    ? [orderId]
    : [];

  if (targetIds.length === 0) {
    return res.status(400).json({ error: 'orderId or orderIds is required.' });
  }

  const session = gatewayOrderId ? pendingGatewaySessions.get(gatewayOrderId) : undefined;
  const orders: Order[] = [];
  for (const id of targetIds) {
    const ord = db.getOrderById(id);
    if (!ord) {
      return res.status(404).json({ error: `Order ${id} not found.` });
    }
    orders.push(ord);
  }

  // If orders already paid & ledger reconciled idempotently, return immediately
  const allAlreadyReconciled = orders.every(
    (o) =>
      o.paymentStatus === 'paid' &&
      db.getLedger().some((l) => l.orderId === o.id && l.entryType === 'ORDER_PAYMENT')
  );
  if (allAlreadyReconciled) {
    return res.json({
      verified: true,
      message: 'Payment already reconciled idempotently',
      paymentStatus: 'paid',
      order: orders[0],
      orders,
      payments: orders.map((o) => db.getPaymentByOrderId(o.id)).filter(Boolean),
    });
  }

  // Cryptographic HMAC-SHA256 signature verification
  if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
    return res.status(400).json({ error: 'Missing gatewayOrderId, gatewayPaymentId, or gatewaySignature.' });
  }

  if (session) {
    const missingFromSession = targetIds.some((id) => !session.orderIds.includes(id));
    if (missingFromSession) {
      return res.status(400).json({ error: 'Order IDs do not match initialized gateway order.' });
    }
  } else {
    const mismatchOrder = orders.some((o) => o.gatewayOrderId && o.gatewayOrderId !== gatewayOrderId);
    if (mismatchOrder) {
      return res.status(400).json({ error: 'Order gateway reference mismatch.' });
    }
  }

  const isSignatureValid = verifyGatewayHmac(gatewayOrderId, gatewayPaymentId, gatewaySignature);
  if (!isSignatureValid) {
    return res.status(400).json({
      error: 'Payment signature verification failed (HMAC-SHA256 mismatch). Transaction rejected.',
    });
  }

  const cfg = getGatewayConfig();
  const commissionRate = (db.getSettings()?.baseCommissionPercent || 3.5) / 100;
  const now = new Date().toISOString();
  const updatedOrders: Order[] = [];
  const createdPayments: PaymentRecord[] = [];
  const resolvedMethod = (paymentMethod || orders[0].paymentMethod || 'UPI') as Order['paymentMethod'];

  for (const order of orders) {
    const existingLedger = db.getLedger().find((l) => l.orderId === order.id && l.entryType === 'ORDER_PAYMENT');
    if (existingLedger) {
      updatedOrders.push(order);
      const existingPay = db.getPaymentByOrderId(order.id);
      if (existingPay) createdPayments.push(existingPay);
      continue;
    }

    const updatedOrder =
      db.updateOrderPayment(order.id, {
        paymentStatus: 'paid',
        status: order.status === 'pending_confirmation' ? 'confirmed' : order.status,
        paymentReference: gatewayPaymentId,
        paymentMethod: resolvedMethod,
        gatewayOrderId,
        note: `Payment verified (${resolvedMethod}${methodDetails ? ` · ${methodDetails}` : ''}) Ref: ${gatewayPaymentId}`,
      }) || order;

    updatedOrders.push(updatedOrder);

    const paymentRecord = db.createPayment({
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      paymentMethod: resolvedMethod,
      methodDetails: methodDetails || resolvedMethod,
      amount: order.grandTotal,
      currency: 'INR',
      status: 'paid',
      provider: cfg.provider,
      gatewayOrderId,
      gatewayTransactionId: gatewayPaymentId,
      gatewaySignature,
      idempotencyKey: idempotencyKey || `${gatewayOrderId}_${order.id}`,
      signatureVerified: true,
      isDevelopmentMode: cfg.provider === 'sandbox',
      createdAt: now,
      updatedAt: now,
    });
    createdPayments.push(paymentRecord);

    const commission = Math.round(order.subtotal * commissionRate);
    const vendorPayable = order.grandTotal - commission;

    db.addLedgerEntry({
      id: `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_01`,
      transactionRef: `TXN-${order.orderNumber}-01`,
      orderId: order.id,
      entryType: 'ORDER_PAYMENT',
      amount: order.grandTotal,
      debitAccount: 'CUSTOMER_ESCROW',
      creditAccount: 'MARKETPLACE_CLEARING',
      description: `Gross Gateway Payment (${resolvedMethod}) for ${order.orderNumber}`,
      createdAt: now,
    });

    db.addLedgerEntry({
      id: `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_02`,
      transactionRef: `TXN-${order.orderNumber}-02`,
      orderId: order.id,
      entryType: 'PLATFORM_COMMISSION',
      amount: commission,
      debitAccount: 'MARKETPLACE_CLEARING',
      creditAccount: 'PLATFORM_REVENUE',
      description: `${(commissionRate * 100).toFixed(1)}% Platform Commission on ${order.orderNumber}`,
      createdAt: now,
    });

    db.addLedgerEntry({
      id: `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}_03`,
      transactionRef: `TXN-${order.orderNumber}-03`,
      orderId: order.id,
      entryType: 'VENDOR_PAYABLE',
      amount: vendorPayable,
      debitAccount: 'MARKETPLACE_CLEARING',
      creditAccount: `VENDOR_${order.vendorId}`,
      description: `Net Payable to ${order.vendorName} for ${order.orderNumber}`,
      createdAt: now,
    });

    db.createNotification({
      id: `notif_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: order.customerId,
      title: `Payment Confirmed: ${order.orderNumber}`,
      message: `₹${order.grandTotal.toLocaleString('en-IN')} paid via ${resolvedMethod} (${gatewayPaymentId}). Delivery OTP: ${order.deliveryOtp}`,
      type: 'order',
      read: false,
      linkTab: 'orders',
      referenceId: order.id,
      createdAt: now,
    });
  }

  pendingGatewaySessions.delete(gatewayOrderId);

  res.json({
    verified: true,
    payment: createdPayments[0],
    payments: createdPayments,
    order: updatedOrders[0],
    orders: updatedOrders,
    message: 'Payment signature verified and financial ledger reconciled.',
  });
});

apiRouter.post('/payments/fail', (req: Request, res: Response) => {
  const { orderIds, orderId, gatewayOrderId, paymentMethod, methodDetails, reason, cancelOrders } = req.body;
  const targetIds: string[] = Array.isArray(orderIds)
    ? orderIds.filter(Boolean)
    : orderId
    ? [orderId]
    : [];

  if (targetIds.length === 0) {
    return res.status(400).json({ error: 'orderId or orderIds is required.' });
  }

  const cfg = getGatewayConfig();
  const now = new Date().toISOString();
  const updatedOrders: Order[] = [];

  for (const id of targetIds) {
    const order = db.getOrderById(id);
    if (!order || order.paymentStatus === 'paid') continue;

    const shouldCancel = Boolean(cancelOrders) && order.status !== 'cancelled';
    if (shouldCancel) {
      for (const it of order.items) {
        db.restoreStock(it.productId, it.quantity);
      }
    }

    const updated =
      db.updateOrderPayment(order.id, {
        paymentStatus: 'failed',
        status: shouldCancel ? 'cancelled' : order.status,
        gatewayOrderId: gatewayOrderId || order.gatewayOrderId,
        note: shouldCancel
          ? `Payment failed (${reason || 'Cancelled at gateway'}) — inventory released`
          : `Gateway attempt failed (${reason || 'Declined'}) — awaiting retry`,
      }) || order;

    updatedOrders.push(updated);

    db.createPayment({
      id: `pay_fail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      paymentMethod: (paymentMethod || order.paymentMethod || 'UPI') as PaymentRecord['paymentMethod'],
      methodDetails: methodDetails || undefined,
      amount: order.grandTotal,
      currency: 'INR',
      status: 'failed',
      provider: cfg.provider,
      gatewayOrderId: gatewayOrderId || order.gatewayOrderId,
      gatewayTransactionId: `FAIL-${Date.now().toString(36).toUpperCase()}`,
      signatureVerified: false,
      isDevelopmentMode: cfg.provider === 'sandbox',
      failureReason: reason || 'Payment declined or cancelled by user',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (gatewayOrderId && cancelOrders) {
    pendingGatewaySessions.delete(gatewayOrderId);
  }

  res.json({
    orders: updatedOrders,
    message: cancelOrders ? 'Orders cancelled and reserved stock restored.' : 'Payment attempt marked failed.',
  });
});

apiRouter.get('/finance/payments', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string | undefined;
  const orderId = req.query.orderId as string | undefined;
  let payments = db.getPayments(customerId);
  if (orderId) {
    payments = payments.filter((p) => p.orderId === orderId);
  }
  res.json({ payments });
});

apiRouter.get('/finance/ledger', (_req: Request, res: Response) => {
  res.json({ ledger: db.getLedger() });
});

apiRouter.get('/finance/settlements', (req: Request, res: Response) => {
  const vendorId = req.query.vendorId as string;
  res.json({ settlements: db.getSettlements(vendorId) });
});

apiRouter.post('/finance/refund', (req: Request, res: Response) => {
  const { orderId, amount, reason } = req.body;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.paymentStatus === 'refunded') {
    return res.status(409).json({ error: 'Order has already been refunded.' });
  }

  const refundAmt = Number(amount) || order.grandTotal;
  const now = new Date().toISOString();

  db.addLedgerEntry({
    id: `ledg_${Date.now()}_rfnd`,
    transactionRef: `TXN-REFUND-${order.orderNumber}`,
    orderId,
    entryType: 'REFUND',
    amount: refundAmt,
    debitAccount: 'MARKETPLACE_CLEARING',
    creditAccount: 'CUSTOMER_ESCROW',
    description: `Refund for ${order.orderNumber}: ${reason || 'Customer cancellation'}`,
    createdAt: now,
  });

  if (order.status !== 'delivered' && order.status !== 'cancelled') {
    for (const it of order.items) {
      db.restoreStock(it.productId, it.quantity);
    }
  }

  db.updateOrderPayment(orderId, {
    paymentStatus: 'refunded',
    status: 'cancelled',
    note: `Refund of ₹${refundAmt.toLocaleString('en-IN')} processed. Reason: ${reason || 'N/A'}`,
  });

  const paidPayment = db.getPayments().find((p) => p.orderId === orderId && p.status === 'paid');
  if (paidPayment) {
    db.updatePayment(paidPayment.id, {
      status: 'refunded',
      refundedAmount: refundAmt,
    });
  }

  const actor = getSessionUser(req);
  if (actor) {
    db.logAction(
      actor.id,
      actor.name,
      actor.role,
      'PROCESS_REFUND',
      'order',
      orderId,
      `Processed ₹${refundAmt.toLocaleString('en-IN')} refund for ${order.orderNumber}`
    );
  }

  res.json({ message: 'Refund successfully recorded and ledger reversed.' });
});

// ================= DELIVERY & FLEET LOGISTICS =================
apiRouter.get('/delivery/agents', (_req: Request, res: Response) => {
  res.json({ agents: db.getDeliveryAgents() });
});

apiRouter.get('/delivery/assignments', (req: Request, res: Response) => {
  const agentId = req.query.agentId as string;
  res.json({ assignments: db.getDeliveryAssignments(agentId) });
});

apiRouter.post('/delivery/assign', (req: Request, res: Response) => {
  const { orderId, agentId, estimatedWeightKg } = req.body;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const agent = db.getDeliveryAgents().find((a) => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Delivery agent not found' });
  }

  // Vehicle Load Safety Check: Prevent overloaded vehicle dispatch!
  const loadWeight = Number(estimatedWeightKg) || 3500;
  if (loadWeight > agent.maxWeightCapacityKg) {
    return res.status(400).json({
      error: `Safety Restriction: Consignment weight (${loadWeight} kg) exceeds vehicle payload limit (${agent.maxWeightCapacityKg} kg) for ${agent.vehicleType}. Please assign a multi-axle carrier.`,
    });
  }

  const assignment = db.createDeliveryAssignment({
    id: `del_asgn_${Date.now()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    vendorId: order.vendorId,
    vendorName: order.vendorName,
    pickupAddress: 'Authorized Wholesale Stockyard, Bengaluru Hub',
    deliveryAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAgentId: agent.id,
    agentName: agent.name,
    agentPhone: agent.phone,
    vehicleType: agent.vehicleType,
    estimatedWeightKg: loadWeight,
    status: 'assigned',
    deliveryCharge: order.totalDelivery,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.updateOrderStatus(orderId, 'dispatched', `Assigned to driver ${agent.name} (${agent.vehicleType})`, {
    id: agent.userId,
    name: agent.name,
    phone: agent.phone,
    vehicleNumber: agent.vehicleNumber,
    vehicleType: agent.vehicleType,
  });

  res.status(201).json({ assignment, message: 'Carrier assigned and order dispatched.' });
});

apiRouter.put('/delivery/assignments/:id/status', (req: Request, res: Response) => {
  const { status, proofOfDelivery } = req.body;
  const updated = db.updateDeliveryAssignment(req.params.id, status, proofOfDelivery);
  if (!updated) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Keep order status synced
  if (status === 'in_transit') {
    db.updateOrderStatus(updated.orderId, 'out_for_delivery', 'Driver en route to site coordinates');
  } else if (status === 'delivered') {
    db.updateOrderStatus(updated.orderId, 'delivered', 'Site delivery confirmed with recipient OTP');
  }

  res.json({ assignment: updated, message: `Delivery status updated to ${status}` });
});

// ================= CUSTOMER PROJECTS & SAVED ADDRESSES =================
apiRouter.get('/customer/projects', (req: Request, res: Response) => {
  const customerId = (req.query.customerId as string) || 'usr_cust_01';
  res.json({ projects: db.getProjects(customerId) });
});

apiRouter.post('/customer/projects', (req: Request, res: Response) => {
  const { customerId, title, projectType, siteAddress, sitePincode, targetBudget } = req.body;
  if (!title || !siteAddress) {
    return res.status(400).json({ error: 'Project title and site address are required' });
  }

  const proj = db.createProject({
    id: `proj_${Date.now()}`,
    customerId: customerId || 'usr_cust_01',
    title,
    projectType: projectType || 'residential_villa',
    siteAddress,
    sitePincode: sitePincode || '560034',
    targetBudget: Number(targetBudget) || 5000000,
    spentSoFar: 0,
    status: 'in_progress',
    orderIds: [],
    bookingIds: [],
    quotationIds: [],
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ project: proj, message: 'Construction project created' });
});

apiRouter.get('/customer/projects/:id', (req: Request, res: Response) => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const orders = db.getOrders().filter((o) => project.orderIds?.includes(o.id));
  res.json({ project, orders });
});

apiRouter.post('/customer/projects/:id/milestones/:milestoneId/tasks/:taskId/toggle', (req: Request, res: Response) => {
  const { id, milestoneId, taskId } = req.params;
  const updatedProject = db.toggleMilestoneTask(id, milestoneId, taskId);
  if (!updatedProject) {
    return res.status(404).json({ error: 'Project, milestone or task not found' });
  }
  res.json({ project: updatedProject, message: 'Milestone task updated' });
});

apiRouter.put('/customer/projects/:id/milestones/:milestoneId', (req: Request, res: Response) => {
  const { id, milestoneId } = req.params;
  const updatedProject = db.updateMilestone(id, milestoneId, req.body);
  if (!updatedProject) {
    return res.status(404).json({ error: 'Project or milestone not found' });
  }
  res.json({ project: updatedProject, message: 'Milestone updated' });
});

apiRouter.post('/customer/projects/:id/milestones', (req: Request, res: Response) => {
  const { id } = req.params;
  const milestone = req.body;
  if (!milestone || !milestone.title) {
    return res.status(400).json({ error: 'Milestone title is required' });
  }
  const updatedProject = db.addMilestone(id, milestone);
  if (!updatedProject) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(201).json({ project: updatedProject, message: 'Milestone added' });
});

apiRouter.get('/customer/addresses', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_cust_01';
  res.json({ addresses: db.getAddresses(userId) });
});

apiRouter.post('/customer/addresses', (req: Request, res: Response) => {
  const { userId, label, street, city, state, pincode, landmark, isDefault } = req.body;
  if (!street || !pincode) {
    return res.status(400).json({ error: 'Street address and PIN code are required' });
  }

  const addr = db.createAddress({
    id: `addr_${Date.now()}`,
    userId: userId || 'usr_cust_01',
    label: label || 'Site Address',
    street,
    city: city || 'Bengaluru',
    state: state || 'Karnataka',
    pincode,
    landmark,
    isDefault: Boolean(isDefault),
  });

  res.status(201).json({ address: addr, message: 'Site address saved' });
});

apiRouter.put('/customer/addresses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sessionUser = getSessionUser(req);
  const userId =
    sessionUser?.role === 'admin'
      ? (req.body.userId as string | undefined)
      : sessionUser?.id || (req.body.userId as string | undefined);
  const { label, street, city, state, pincode, landmark, isDefault } = req.body;

  if (street !== undefined && !String(street).trim()) {
    return res.status(400).json({ error: 'Street address cannot be empty' });
  }
  if (pincode !== undefined && !String(pincode).trim()) {
    return res.status(400).json({ error: 'PIN code cannot be empty' });
  }

  const updates: any = {};
  if (label !== undefined) updates.label = String(label).trim() || 'Site Address';
  if (street !== undefined) updates.street = String(street).trim();
  if (city !== undefined) updates.city = String(city).trim();
  if (state !== undefined) updates.state = String(state).trim();
  if (pincode !== undefined) updates.pincode = String(pincode).trim();
  if (landmark !== undefined) updates.landmark = String(landmark).trim();
  if (isDefault !== undefined) updates.isDefault = Boolean(isDefault);

  const updated = db.updateAddress(id, userId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Address not found' });
  }
  if (sessionUser?.role === 'admin') {
    db.logAction(sessionUser.id, sessionUser.name, sessionUser.role, 'UPDATE_USER_ADDRESS', 'address', updated.id, `Updated address ${updated.label} for user ${updated.userId}`);
  }
  res.json({ address: updated, message: 'Address updated successfully' });
});

apiRouter.delete('/customer/addresses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sessionUser = getSessionUser(req);
  const userId =
    sessionUser?.role === 'admin'
      ? (req.query.userId as string | undefined)
      : sessionUser?.id || (req.query.userId as string | undefined);
  const deleted = db.deleteAddress(id, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Address not found' });
  }
  if (sessionUser?.role === 'admin') {
    db.logAction(sessionUser.id, sessionUser.name, sessionUser.role, 'DELETE_USER_ADDRESS', 'address', id, `Removed address ${id}`);
  }
  res.json({ message: 'Address removed' });
});

// ================= NOTIFICATIONS, REVIEWS & SUPPORT =================
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_cust_01';
  res.json({ notifications: db.getNotifications(userId) });
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

// ================= MATERIAL PRICE ALERTS =================
apiRouter.get('/price-alerts', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_cust_01';
  res.json({ alerts: db.getPriceAlerts(userId) });
});

apiRouter.post('/price-alerts', (req: Request, res: Response) => {
  const { userId, materialId, targetPrice } = req.body;
  const numericTarget = Number(targetPrice);
  if (!materialId || !Number.isFinite(numericTarget) || numericTarget <= 0) {
    return res.status(400).json({ error: 'Valid materialId and positive targetPrice are required' });
  }

  const effectiveUserId = userId || 'usr_cust_01';
  const result = db.createOrUpdatePriceAlert(effectiveUserId, materialId, numericTarget);
  if (!result) {
    return res.status(404).json({ error: 'Material not found' });
  }

  res.status(201).json({
    alert: result.alert,
    triggeredImmediately: result.triggeredImmediately,
    message: result.triggeredImmediately
      ? `Current price already meets your ₹${numericTarget.toLocaleString('en-IN')} target!`
      : `Price alert set for ≤ ₹${numericTarget.toLocaleString('en-IN')}/${result.alert.unit}`,
  });
});

apiRouter.put('/price-alerts/:id', (req: Request, res: Response) => {
  const updated = db.updatePriceAlert(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Price alert not found' });
  }
  res.json({ alert: updated, message: 'Price alert updated' });
});

apiRouter.delete('/price-alerts/:id', (req: Request, res: Response) => {
  const deleted = db.deletePriceAlert(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Price alert not found' });
  }
  res.json({ success: true, message: 'Price alert removed' });
});

apiRouter.get('/reviews', (req: Request, res: Response) => {
  const { targetType, targetId } = req.query;
  res.json({ reviews: db.getReviews(targetType as string, targetId as string) });
});

apiRouter.post('/reviews', (req: Request, res: Response) => {
  const { userId, userName, targetType, targetId, orderOrBookingId, rating, comment } = req.body;
  if (!targetType || !targetId || !rating) {
    return res.status(400).json({ error: 'Target, rating, and review comment are required' });
  }

  const rev = db.createReview({
    id: `rev_${Date.now()}`,
    userId: userId || 'usr_cust_01',
    userName: userName || 'Site Builder',
    targetType,
    targetId,
    orderOrBookingId: orderOrBookingId || 'ord_01',
    rating: Number(rating),
    comment: comment || '',
    verifiedTransaction: true,
    status: 'published',
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ review: rev, message: 'Review published successfully' });
});

apiRouter.get('/support/tickets', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  res.json({ tickets: db.getTickets(userId) });
});

apiRouter.post('/support/tickets', (req: Request, res: Response) => {
  const { userId, userName, category, priority, subject, description, orderOrBookingRef } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const ticket = db.createTicket({
    id: `tick_${Date.now()}`,
    ticketNumber: `BC-TICK-${Math.floor(100000 + Math.random() * 900000)}`,
    userId: userId || 'usr_cust_01',
    userName: userName || 'Customer',
    category: category || 'delivery_delay',
    priority: priority || 'medium',
    subject,
    description,
    orderOrBookingRef,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ ticket, message: 'Support ticket logged with BuildNiva Help Desk' });
});

// ================= AI ASSISTANT & NATURAL LANGUAGE SEARCH =================
apiRouter.post('/ai/assistant', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  let answer = '';

  // Rule-based Indian civil engineering fallback knowledge
  const fallbackAnswers: Record<string, string> = {
    cement: 'For structural RCC columns and slabs, OPC 53 Grade (e.g. UltraTech Weather Plus) is recommended for high early compressive strength (53 MPa at 28 days). For brick masonry and wall plastering, PPC or PSC cement is ideal due to low hydration heat and superior crack resistance.',
    small_house: 'For a typical 1,200 sq.ft residential house (G+1), you will approximately need: 900–1,000 bags of OPC/PPC cement, 8.5–9.5 tonnes of Fe-550D TMT steel rebars, 40 brass of triple-washed M-Sand, 30 brass of 20mm/40mm coarse aggregates, and 4,500 AAC blocks.',
    quote: 'When requesting a turnkey contractor quotation, specify: Plot boundary dimensions, proposed built-up area (sq.ft), soil test report, required floor height (typically 10-11 ft), door frame materials (Teak/Sal wood), tile sizes (e.g. 2x4 vitrified), and payment milestone schedule.',
  };

  const lower = prompt.toLowerCase();
  if (lower.includes('cement') || lower.includes('grade')) {
    answer = fallbackAnswers.cement;
  } else if (lower.includes('small house') || lower.includes('materials') || lower.includes('need')) {
    answer = fallbackAnswers.small_house;
  } else if (lower.includes('contractor') || lower.includes('quotation') || lower.includes('quote')) {
    answer = fallbackAnswers.quote;
  } else {
    answer = 'BuildNiva Civil Assistant: When sourcing materials in India, ensure all structural steel is BIS IS: 1786 Fe-550D certified, and cement adheres to IS: 269:2015. Always conduct cube compressive tests at 7 and 28 days during slab casting.';
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert Indian civil engineering and construction materials consultant on the BuildNiva marketplace. Provide a concise, highly practical, professional answer (under 80 words) to this builder query: "${prompt}". Focus on Indian IS standards, grades (Fe-550D, OPC 53, M-Sand), and realistic Indian prices in INR (₹).`,
      });
      if (response && response.text) {
        answer = response.text.trim();
      }
    } catch {
      // Clean fallback preserved
    }
  }

  res.json({ answer });
});

apiRouter.post('/ai/natural-search', (req: Request, res: Response) => {
  const { query } = req.body;
  const q = (query || '').toLowerCase();

  let category = 'Materials';
  let targetTab = 'materials';
  let searchWord = '';

  if (q.includes('cement')) {
    category = 'Cement';
    targetTab = 'materials';
    searchWord = 'Cement';
  } else if (q.includes('steel') || q.includes('tmt') || q.includes('rebar')) {
    category = 'TMT Steel';
    targetTab = 'materials';
    searchWord = 'Steel';
  } else if (q.includes('jcb') || q.includes('excavator') || q.includes('mixer') || q.includes('crane')) {
    category = 'Earth Moving';
    targetTab = 'equipment';
    searchWord = 'JCB';
  } else if (q.includes('engineer') || q.includes('architect') || q.includes('structural')) {
    category = 'Civil & Structural Engineer';
    targetTab = 'professionals';
    searchWord = 'Engineer';
  } else if (q.includes('mason') || q.includes('labour') || q.includes('worker') || q.includes('electrician') || q.includes('plumber')) {
    category = 'Mason (Rajmistri)';
    targetTab = 'labour';
    searchWord = 'Mason';
  } else if (q.includes('contractor') || q.includes('builder') || q.includes('turnkey')) {
    category = 'Turnkey';
    targetTab = 'contractors';
    searchWord = 'Turnkey';
  }

  res.json({
    interpretedCategory: category,
    targetTab,
    searchKeyword: searchWord,
    message: `Natural language query routed to ${targetTab} catalog for "${query}"`,
  });
});

// ================= ADMIN AUDIT & SETTINGS =================
apiRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  res.json({ auditLogs: db.getAuditLogs() });
});

apiRouter.get('/admin/settings', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  res.json({ settings: db.getSettings() });
});

apiRouter.put('/admin/settings', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const updated = db.updateSettings(req.body);
  db.logAction(admin.id, admin.name, admin.role, 'UPDATE_SETTINGS', 'platform', 'config', 'Updated platform configuration');
  res.json({ settings: updated, message: 'Platform settings saved.' });
});

apiRouter.put('/admin/support/tickets/:id', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { status, resolutionNotes } = req.body;
  const allowedStatuses = ['open', 'investigating', 'resolved', 'closed'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid ticket status' });
  }
  const updated = db.updateTicket(req.params.id, {
    ...(status ? { status } : {}),
    ...(resolutionNotes !== undefined ? { resolutionNotes: String(resolutionNotes) } : {}),
  });
  if (!updated) {
    return res.status(404).json({ error: 'Support ticket not found' });
  }
  db.logAction(admin.id, admin.name, admin.role, 'UPDATE_SUPPORT_TICKET', 'ticket', updated.id, `Ticket ${updated.ticketNumber} status set to ${updated.status}`);
  res.json({ ticket: updated, message: `Ticket ${updated.ticketNumber} updated to ${updated.status}` });
});

apiRouter.put('/admin/users/:id/status', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { status } = req.body;
  const user = db.updateUser(req.params.id, { verificationStatus: status });
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.logAction(admin.id, admin.name, admin.role, 'CHANGE_USER_STATUS', 'user', req.params.id, `Status updated to ${status}`);
  res.json({ user, message: `User status set to ${status}` });
});

apiRouter.post('/admin/users', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const payload = req.body;
  if (!payload.name || !payload.email || !payload.role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }
  const cleanEmail = String(payload.email).trim().toLowerCase();
  const existing = db.getRawUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const rawPassword = payload.password ? String(payload.password) : '';
  if (!rawPassword || rawPassword.length < 6) {
    return res.status(400).json({ error: 'A password of at least 6 characters is required' });
  }

  const newUser: StoredUser = {
    id: `usr_${Date.now()}`,
    name: String(payload.name).trim(),
    email: cleanEmail,
    passwordHash: hashPassword(rawPassword),
    phone: payload.phone ? String(payload.phone).trim() : '+91 98000 00000',
    role: payload.role as UserRole,
    approvedRoles: [payload.role as UserRole],
    businessName: payload.businessName,
    businessType: payload.businessType,
    gstin: payload.gstin,
    panNumber: payload.panNumber,
    tradeLicenseNumber: payload.tradeLicenseNumber,
    bankDetails: payload.bankDetails,
    city: payload.city || 'Bengaluru',
    pincode: payload.pincode || '560001',
    verificationStatus: payload.verificationStatus || 'approved',
    suspended: Boolean(payload.suspended),
    notes: payload.notes || 'Created by Platform Administrator',
    createdAt: new Date().toISOString(),
  };

  const created = db.createUser(newUser);
  db.logAction(admin.id, admin.name, admin.role, 'CREATE_USER_ACCOUNT', 'user', created.id, `Created ${created.role} account for ${created.name}`);
  res.status(201).json({ user: created, message: 'User account created successfully' });
});

apiRouter.put('/admin/users/:id', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { password, passwordHash: _ignoredHash, id: _ignoredId, ...rest } = req.body;
  const updates: Partial<StoredUser> = { ...rest };
  if (typeof password === 'string' && password.trim().length > 0) {
    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    updates.passwordHash = hashPassword(password.trim());
  }
  const updated = db.updateUser(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User account not found' });
  }
  db.logAction(admin.id, admin.name, admin.role, 'UPDATE_USER_ACCOUNT', 'user', updated.id, `Maintained profile for ${updated.name}`);
  res.json({ user: updated, message: 'Account details updated successfully' });
});

apiRouter.delete('/admin/users/:id', (req: Request, res: Response) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }
  if (user.role === 'admin' && user.id === 'usr_adm_01') {
    return res.status(403).json({ error: 'Cannot delete primary root administrator account' });
  }
  db.deleteUser(req.params.id);
  db.logAction(admin.id, admin.name, admin.role, 'DELETE_USER_ACCOUNT', 'user', req.params.id, `Deleted account ${user.name} (${user.email})`);
  res.json({ success: true, message: 'User account removed from database' });
});
