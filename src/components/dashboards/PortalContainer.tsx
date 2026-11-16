import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Check,
  Truck,
  Calendar,
  Clock,
  ShieldCheck,
  DollarSign,
  RefreshCw,
  X,
  AlertCircle,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Edit3,
  Star,
  Layers,
  Sparkles,
  Tag,
  CheckCircle2,
  Eye,
  Info,
  Camera,
  Award,
  Video,
  MapPin,
  Compass,
  User as UserIcon,
  Phone,
  Mail,
  MessageSquare,
  Send,
  FileText,
  Building2,
  ExternalLink,
  UserCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { SignInRequired } from '../auth/SignInRequired.js';
import { api } from '../../services/api.js';
import { MaterialProduct, Order, EquipmentListing, MaterialCategory, ProfessionalProfile, ProfessionalSpecialization, ProjectSample, ProfessionalBooking } from '../../types/index.js';
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

// Pre-curated verified authentic construction material photo presets (BuildNiva Certified Standard)
const MATERIAL_PHOTO_PRESETS = [
  {
    name: 'UltraTech Cement Bag (50kg)',
    category: 'Cement',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Tata Tiscon 550D TMT Steel',
    category: 'TMT Steel',
    url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Robo M-Sand (Manufactured Sand)',
    category: 'Sand & Aggregates',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: '20mm Blue Metal Granite Jelly',
    category: 'Sand & Aggregates',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Red Clay Kiln Wirecut Bricks',
    category: 'Bricks & Blocks',
    url: 'https://images.unsplash.com/photo-1584463699039-3d12c85f4039?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'AAC Lightweight Aerated Blocks',
    category: 'Bricks & Blocks',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Ready Mix Concrete (RMC)',
    category: 'Ready Mix Concrete',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Dr. Fixit Waterproofing Chemical',
    category: 'Waterproofing',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  },
];

export const PortalContainer: React.FC = () => {
  const { currentUser, showToast, setActiveTab } = useApp();
  const [vendorProducts, setVendorProducts] = useState<MaterialProduct[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);

  // BuildNiva Material Catalog Studio Modal State
  const [productStudioOpen, setProductStudioOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<'photos' | 'details' | 'pricing' | 'specs'>('photos');

  // Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<MaterialCategory>('Cement');
  const [prodBrand, setProdBrand] = useState('UltraTech');
  const [prodUnit, setProdUnit] = useState<'bag' | 'tonne' | 'piece' | 'brass' | 'litre'>('bag');
  const [prodPrice, setProdPrice] = useState(380);
  const [prodMrp, setProdMrp] = useState(420);
  const [prodStock, setProdStock] = useState(800);
  const [prodMinOrder, setProdMinOrder] = useState(25);
  const [prodGstRate, setProdGstRate] = useState(28);
  const [prodWeightKg, setProdWeightKg] = useState(50);
  const [prodHsn, setProdHsn] = useState('25232910');
  const [prodSku, setProdSku] = useState('BC-CEM-53-01');
  const [prodDescription, setProdDescription] = useState('High-performance Ordinary Portland Cement (OPC 53 Grade) for heavy RCC columns, foundations, and slab casting.');
  const [prodBulkDiscountSlab, setProdBulkDiscountSlab] = useState('5% off on >100 units, 8% off on >500 units');
  const [prodLeadDays, setProdLeadDays] = useState(1);
  const [prodSpecs, setProdSpecs] = useState({
    grade: 'OPC 53 Grade',
    standard: 'IS 269:2015',
    compressiveStrength: '53 MPa at 28 days',
    packaging: 'Tamper-Proof HDPE Laminated Bags',
  });

  // Multi-Image Gallery State (BuildNiva Enterprise Standard)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Professional / Civil Engineer Profile & Photo State
  const [proProfile, setProProfile] = useState<ProfessionalProfile | null>(null);
  const [proPhotoUrl, setProPhotoUrl] = useState('');
  const [proCustomPhotoUrl, setProCustomPhotoUrl] = useState('');
  const [proTitle, setProTitle] = useState('Senior Chartered Structural Engineer');
  const [proRegNo, setProRegNo] = useState('IEI/STR/2012/84920');
  const [proExperience, setProExperience] = useState(16);
  const [proSpecialization, setProSpecialization] = useState<ProfessionalSpecialization>('Civil & Structural Engineer');
  const [proEducation, setProEducation] = useState('M.Tech Structural Engineering, IIT Madras');
  const [proConsultFee, setProConsultFee] = useState(1499);
  const [proSiteVisitFee, setProSiteVisitFee] = useState(3999);
  const [proPlanApprovalFee, setProPlanApprovalFee] = useState(18500);
  const [proStructuralRate, setProStructuralRate] = useState(12500);
  const [proArchPlansRate, setProArchPlansRate] = useState(18000);
  const [proMepRate, setProMepRate] = useState(9500);
  const [proSiteAuditsRate, setProSiteAuditsRate] = useState(4500);
  const [portfolioProjects, setPortfolioProjects] = useState<ProjectSample[]>([]);
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<'Structural Drawings' | '3D Architectural Plans' | 'MEP Designs' | 'Site Audits' | 'Civil Execution'>('Structural Drawings');
  const [newProjectType, setNewProjectType] = useState('Residential Villa (G+3)');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectImageUrl, setNewProjectImageUrl] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [proBio, setProBio] = useState('Specialist in earthquake-resistant RCC frame designs, G+4 residential villas, retrofitting, and structural stability certification.');
  const [savingProProfile, setSavingProProfile] = useState(false);

  // Client Inquiries & Contact Requests State for Engineers / Architects
  const [clientInquiries, setClientInquiries] = useState<ProfessionalBooking[]>([]);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [inquirySearch, setInquirySearch] = useState('');
  const [updatingInquiryId, setUpdatingInquiryId] = useState<string | null>(null);
  const [engineerNotesDraft, setEngineerNotesDraft] = useState<{ [id: string]: string }>({});

  // Vendor Consignment Fulfillment & OTP Verification
  const [vendorOtpInputs, setVendorOtpInputs] = useState<{ [orderId: string]: string }>({});
  const [verifyingOtpOrderId, setVerifyingOtpOrderId] = useState<string | null>(null);
  const [vendorInvoiceModal, setVendorInvoiceModal] = useState<Order | null>(null);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [matRes, ordRes, eqRes, proRes, bookRes] = await Promise.all([
        api.getMaterials(),
        api.getOrders(),
        api.getEquipment(),
        api.getProfessionals(),
        api.getProfessionalBookings(),
      ]);
      setVendorProducts(matRes.materials);
      setAllOrders(ordRes.orders);
      setEquipmentList(eqRes.equipment);

      // Locate professional profile matching user
      const matched = proRes.professionals.find(
        (p) =>
          (currentUser?.name && p.name.toLowerCase().includes(currentUser.name.toLowerCase())) ||
          (currentUser?.id && p.id.includes(currentUser.id))
      ) || proRes.professionals[0];

      if (matched) {
        setProProfile(matched);
        setProPhotoUrl(matched.avatarUrl || matched.profilePic || currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
        setProTitle(matched.title || 'Senior Chartered Structural Engineer');
        setProRegNo(matched.registrationNumber || 'IEI/STR/2012/84920');
        setProExperience(matched.experienceYears || 12);
        setProSpecialization(matched.specialization || 'Civil & Structural Engineer');
        setProEducation(matched.education || 'M.Tech Structural Engineering');
        setProConsultFee(matched.consultationFee || 1499);
        setProSiteVisitFee(matched.siteVisitFee || 3999);
        setProPlanApprovalFee(matched.planApprovalFee || 18500);
        setProStructuralRate(matched.structuralDrawingsRate || 12500);
        setProArchPlansRate(matched.architecturalPlansRate || 18000);
        setProMepRate(matched.mepDesignsRate || 9500);
        setProSiteAuditsRate(matched.siteAuditsRate || 4500);
        setPortfolioProjects(matched.portfolioProjects || []);
        setProBio(matched.bio || '');

        // Match inquiries directed to this professional
        const allBookings = bookRes?.bookings || [];
        const matchedInquiries = allBookings.filter(
          (b) =>
            b.professionalId === matched.id ||
            b.professionalId === `pro_${matched.id}` ||
            (matched.name && b.professionalName?.toLowerCase().includes(matched.name.toLowerCase()))
        );
        setClientInquiries(matchedInquiries.length > 0 ? matchedInquiries : allBookings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (
    inquiryId: string,
    newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    notes?: string
  ) => {
    setUpdatingInquiryId(inquiryId);
    try {
      const res = await api.updateProfessionalBookingStatus(inquiryId, newStatus, notes);
      showToast('Status Updated', `Client inquiry marked as ${newStatus.replace('_', ' ')}.`, 'success');
      setClientInquiries((prev) =>
        prev.map((item) => (item.id === inquiryId ? res.booking : item))
      );
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update inquiry status', 'error');
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Open Studio for Creating New Listing
  const handleOpenNewProduct = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setStudioTab('photos');
    setProdName('');
    setProdCategory('Cement');
    setProdBrand('');
    setProdUnit('bag');
    setProdPrice(385);
    setProdMrp(425);
    setProdStock(600);
    setProdMinOrder(25);
    setProdGstRate(28);
    setProdWeightKg(50);
    setProdHsn('25232910');
    setProdSku(`SKU-${Date.now().toString().slice(-6)}`);
    setProdDescription('');
    setProdBulkDiscountSlab('5% off for >100 bags');
    setProdLeadDays(1);
    setProdSpecs({
      grade: 'Grade A',
      standard: 'IS Certified',
      compressiveStrength: 'Standard High',
      packaging: '50kg Bag',
    });
    setImages(['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80']);
    setProductStudioOpen(true);
  };

  // Open Studio for Editing Existing Listing
  const handleOpenEditProduct = (p: MaterialProduct) => {
    setIsEditing(true);
    setEditingProductId(p.id);
    setStudioTab('photos');
    setProdName(p.name);
    setProdCategory(p.category);
    setProdBrand(p.brand);
    setProdUnit(p.unit as any);
    setProdPrice(p.pricePerUnit);
    setProdMrp(Math.round(p.pricePerUnit * 1.15));
    setProdStock(p.availableStock);
    setProdMinOrder(p.minOrderQty);
    setProdGstRate(p.gstRate || 18);
    setProdWeightKg(p.weightKgPerUnit || 50);
    setProdHsn(p.hsnCode || '25232910');
    setProdSku(p.sku || `SKU-${p.id.slice(0, 6)}`);
    setProdDescription(p.description || '');
    setProdBulkDiscountSlab(
      p.bulkTiers && p.bulkTiers.length > 0
        ? p.bulkTiers.map((b) => `₹${b.pricePerUnit} on >${b.minQty} units`).join(', ')
        : '5% off on bulk orders'
    );
    setProdLeadDays(p.deliveryEstimateDays || 1);
    setProdSpecs({
      grade: p.specifications?.grade || 'Grade A',
      standard: p.specifications?.standard || 'BIS Compliant',
      compressiveStrength: p.specifications?.compressiveStrength || 'High Yield',
      packaging: p.specifications?.packaging || 'Standard Pack',
    });
    setImages(p.images && p.images.length > 0 ? [...p.images] : p.imageUrl ? [p.imageUrl] : []);
    setProductStudioOpen(true);
  };

  // Handle Photo Upload via Local File with client compression + server upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const compressed = await compressImageFile(file, 1000, 1000, 0.85);
        try {
          const res = await api.uploadImage(compressed, 'mat');
          uploadedUrls.push(res.url);
        } catch {
          uploadedUrls.push(compressed);
        }
      }
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
        showToast(
          uploadedUrls.length > 1 ? 'Images Uploaded' : 'Image Uploaded',
          `${uploadedUrls.length} product ${uploadedUrls.length > 1 ? 'photos' : 'photo'} uploaded to server.`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Failed to process image file.', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  // Add Custom Image URL
  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setImages((prev) => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
    showToast('Photo Added', 'Product angle added to gallery.', 'info');
  };

  // Make an Image the Primary Listing Photo
  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
    showToast('Primary Photo Set', 'This picture will show first on search results.', 'success');
  };

  // Remove Photo from Gallery
  const handleRemoveImage = (index: number) => {
    if (images.length === 1) {
      showToast('Image Required', 'A listing must have at least one product picture.', 'error');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Publish / Update Product
  const handleSubmitProductStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('Name Required', 'Please enter a product listing title.', 'error');
      return;
    }
    const finalImages = customImageUrl.trim()
      ? [...images, customImageUrl.trim()]
      : [...images];

    if (finalImages.length === 0) {
      showToast('Photo Required', 'Upload at least one clear product image.', 'error');
      return;
    }

    setSubmittingProduct(true);
    try {
      const payload: Partial<MaterialProduct> = {
        name: prodName.trim(),
        category: prodCategory,
        brand: prodBrand.trim() || 'Yard Direct',
        unit: prodUnit,
        pricePerUnit: Number(prodPrice),
        availableStock: Number(prodStock),
        minOrderQty: Number(prodMinOrder),
        gstRate: Number(prodGstRate),
        imageUrl: finalImages[0],
        images: finalImages,
        sku: prodSku,
        hsnCode: prodHsn,
        weightKgPerUnit: Number(prodWeightKg),
        description: prodDescription,
        deliveryEstimateDays: Number(prodLeadDays),
        specifications: prodSpecs,
        bulkTiers: [
          { minQty: 100, pricePerUnit: Math.round(Number(prodPrice) * 0.95) },
          { minQty: 500, pricePerUnit: Math.round(Number(prodPrice) * 0.9) },
        ],
        vendorId: currentUser?.id,
        vendorName: currentUser?.businessName || currentUser?.name || 'Local Stockist',
        vendorCity: currentUser?.city || 'Bengaluru',
      };

      if (isEditing && editingProductId) {
        await api.updateMaterial(editingProductId, payload);
        showToast('Listing Updated', `${prodName} catalog details revised.`, 'success');
      } else {
        await api.createMaterial(payload);
        showToast('Product Published!', `${prodName} is now live on BuildNiva with ${images.length} photos.`, 'success');
      }

      setProductStudioOpen(false);
      loadData();
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete Material Listing
  const handleDeleteProduct = async (p: MaterialProduct) => {
    const confirmDelete = window.confirm(`Remove "${p.name}" from your active yard catalog?`);
    if (!confirmDelete) return;

    try {
      await api.deleteMaterial(p.id);
      showToast('Listing Removed', `${p.name} deleted from marketplace.`, 'info');
      loadData();
    } catch (err: any) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, note: string) => {
    try {
      const res = await api.updateOrderStatus(orderId, status, note, {
        id: 'usr_del_01',
        name: 'Ganesh Shinde',
        phone: '+91 97654 32100',
        vehicleNumber: 'KA 01 AH 5429',
        vehicleType: 'Tata 407 Tipper (4-Tonne)',
      });
      showToast('Status Updated', res.message, 'success');
      loadData();
    } catch (e: any) {
      showToast('Update failed', e.message, 'error');
    }
  };

  const handleVendorVerifyOtp = async (orderId: string) => {
    const otp = vendorOtpInputs[orderId];
    if (!otp || otp.length !== 4) {
      showToast('Invalid OTP', 'Please enter the 4-digit code provided by the customer.', 'error');
      return;
    }
    setVerifyingOtpOrderId(orderId);
    try {
      const res = await api.verifyDeliveryOtp(orderId, otp);
      showToast('Consignment Delivered & Verified!', res.message, 'success');
      loadData();
    } catch (err: any) {
      showToast('OTP Failed', err.message, 'error');
    } finally {
      setVerifyingOtpOrderId(null);
    }
  };

  const handleProPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 800, 0.85);
      setProPhotoUrl(compressed);
      showToast('Photo Loaded', 'Profile photo preview updated. Click "Save Practice Profile" to save changes.', 'info');
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Failed to process photo.', 'error');
    }
  };

  const handleSaveEngineerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proPhotoUrl) {
      showToast('Missing Photo', 'Please upload or select a profile photo.', 'error');
      return;
    }
    setSavingProProfile(true);
    try {
      const idToUpdate = proProfile?.id || `pro_${currentUser?.id || Date.now()}`;
      await api.updateProfessional(idToUpdate, {
        title: proTitle,
        registrationNumber: proRegNo,
        experienceYears: Number(proExperience),
        specialization: proSpecialization,
        education: proEducation,
        consultationFee: Number(proConsultFee),
        siteVisitFee: Number(proSiteVisitFee),
        planApprovalFee: Number(proPlanApprovalFee),
        structuralDrawingsRate: Number(proStructuralRate),
        architecturalPlansRate: Number(proArchPlansRate),
        mepDesignsRate: Number(proMepRate),
        siteAuditsRate: Number(proSiteAuditsRate),
        bio: proBio,
        avatarUrl: proPhotoUrl,
        profilePic: proPhotoUrl,
      });
      showToast('Profile & Offerings Saved!', 'Your engineering rates, specialized deliverables, and photo have been updated.', 'success');
      loadData();
    } catch (err: any) {
      showToast('Save Failed', err.message, 'error');
    } finally {
      setSavingProProfile(false);
    }
  };

  const handleProjectPicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.85);
      setNewProjectImageUrl(compressed);
      showToast('Project Picture Loaded', 'Sample image processed and ready to add.', 'info');
    } catch (err: any) {
      showToast('Upload Error', err?.message || 'Failed to process project drawing.', 'error');
    }
  };

  const handleCreateProjectSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectImageUrl.trim()) {
      showToast('Missing Fields', 'Please provide a project title and image.', 'error');
      return;
    }
    const idToUpdate = proProfile?.id || `pro_${currentUser?.id || Date.now()}`;
    setAddingProject(true);
    try {
      const res = await api.addProfessionalProject(idToUpdate, {
        title: newProjectTitle.trim(),
        category: newProjectCategory,
        projectType: newProjectType.trim(),
        description: newProjectDesc.trim(),
        imageUrl: newProjectImageUrl.trim(),
      });
      showToast('Project Added', 'Sample drawing / plan picture added to your portfolio!', 'success');
      setAddProjectModalOpen(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
      setNewProjectImageUrl('');
      if (res.professional) {
        setProProfile(res.professional);
        setPortfolioProjects(res.professional.portfolioProjects || []);
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to add project sample.', 'error');
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProjectSample = async (projectId: string) => {
    if (!proProfile?.id) return;
    try {
      const res = await api.deleteProfessionalProject(proProfile.id, projectId);
      showToast('Removed', 'Sample picture removed from portfolio.', 'info');
      if (res.professional) {
        setProProfile(res.professional);
        setPortfolioProjects(res.professional.portfolioProjects || []);
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to remove sample picture.', 'error');
    }
  };

  if (!currentUser) {
    return (
      <SignInRequired
        title="Sign in to access Partner Portal"
        description="Sign in with your verified vendor, engineer, contractor, equipment, or logistics account to manage inventory and orders."
      />
    );
  }

  if (currentUser.role === 'customer' || currentUser.role === 'admin') {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            {currentUser.role === 'customer' ? 'Customer Account' : 'Administrator Account'}
          </h2>
          <p className="text-xs text-slate-500">
            The Partner Portal is only for vendors, equipment providers, engineers, contractors, workers, and delivery agents.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(currentUser.role === 'customer' ? 'customer_dashboard' : 'admin')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            {currentUser.role === 'customer' ? 'Open Customer Dashboard' : 'Open Admin Console'}
          </button>
        </div>
      </div>
    );
  }

  const role = currentUser.role;
  const isVendor = role === 'vendor';

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              {role.replace('_', ' ').toUpperCase()} WORKSPACE
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentUser?.businessName || currentUser?.name}'s Portal
            </h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Hub: {currentUser?.city} · KYC Status:{' '}
              <span className="text-emerald-700 font-semibold capitalize">
                {currentUser?.verificationStatus}
              </span>
              {currentUser?.gstin && (
                <span className="ml-2 font-mono text-slate-600">· GSTIN: {currentUser.gstin}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVendor && (
              <button
                onClick={handleOpenNewProduct}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Product (Catalog Studio)</span>
              </button>
            )}
            <button
              onClick={loadData}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Role Dashboard Content */}
        {isVendor && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-400 text-xs">Active Catalog Items</div>
                <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  {vendorProducts.length} Listed
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Verified supplier standard catalog</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-400 text-xs">Total Consignments</div>
                <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                  {allOrders.length} Orders
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tipper & site dispatches</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-400 text-xs">Gross Yard Revenue</div>
                <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                  ₹{allOrders.reduce((sum, o) => sum + o.grandTotal, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Settlement account configured</div>
              </div>
            </div>

            {/* Incoming Orders to Fulfill */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Consignment Cargo Manifest & Transport Dispatches</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vendor stockyard fulfillment, fleet carrier dispatching, and on-site OTP verification.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {allOrders.length} Consignments
                </span>
              </div>

              {allOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No orders assigned yet.</div>
              ) : (
                <div className="space-y-4 text-xs">
                  {allOrders.map((ord) => (
                    <div key={ord.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                      {/* Order Header Summary */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{ord.orderNumber}</span>
                            <span className="text-slate-400 font-normal">·</span>
                            <span>{ord.customerName}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Drop Site: <strong>{ord.shippingAddress.street}, {ord.shippingAddress.city}</strong></span>
                            <span>·</span>
                            <span>Placed: {new Date(ord.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setVendorInvoiceModal(ord)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span>GST Invoice</span>
                          </button>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 tabular-nums">
                              ₹{ord.grandTotal.toLocaleString('en-IN')}
                            </span>
                            <span className="ml-2 text-[10px] font-semibold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Consignment Cargo Manifest Box */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                            <span>Consignment Cargo Manifest</span>
                          </span>
                          <span className="text-slate-500">
                            Carrier: <strong>Tata 407 Tipper (KA 01 AH 5429)</strong> · Driver: <strong>Ganesh Shinde</strong>
                          </span>
                        </div>

                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] py-0.5">
                              <span className="font-medium text-slate-800">
                                {it.productName} <span className="text-slate-500">({it.quantity} {it.unit}s)</span>
                              </span>
                              <span className="text-slate-600 tabular-nums">
                                @ ₹{it.unitPrice}/{it.unit} · GST {it.gstRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Delivery Lifecycle Controls: Test all order milestones live */}
                      <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Interactive Delivery Lifecycle Controls:</span>
                          </span>
                          <span className="text-[10px] text-slate-500">Test all order milestones live</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {ord.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'processing', 'Materials packed and loaded at stockyard')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              1. Pack & Load at Yard
                            </button>
                          )}

                          {ord.status === 'processing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'dispatched', 'Consignment loaded on 16T tipper and dispatched to site')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              2. Dispatch Tipper Truck
                            </button>
                          )}

                          {ord.status === 'dispatched' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'out_for_delivery', 'Driver within 5km of site drop coordinates')}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              3. Mark Out for Delivery
                            </button>
                          )}

                          {ord.status === 'out_for_delivery' && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="Enter Customer OTP"
                                value={vendorOtpInputs[ord.id] || ''}
                                onChange={(e) => setVendorOtpInputs({ ...vendorOtpInputs, [ord.id]: e.target.value })}
                                className="w-36 bg-white border border-purple-300 rounded px-2.5 py-1 text-xs text-slate-900 text-center font-bold font-mono"
                              />
                              <button
                                onClick={() => handleVendorVerifyOtp(ord.id)}
                                disabled={verifyingOtpOrderId === ord.id}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer shadow-xs"
                              >
                                {verifyingOtpOrderId === ord.id ? 'Verifying...' : 'Sign off & Unload (Verify OTP)'}
                              </button>
                              <span className="text-[10px] text-slate-500 font-mono">
                                (Customer's Site OTP: {ord.deliveryOtp || '4829'})
                              </span>
                            </div>
                          )}

                          {ord.status === 'delivered' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Consignment Delivered & Offloaded (Signed with OTP)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory List with Enterprise Merchant Catalog Management */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Yard Inventory & Product Catalog ({vendorProducts.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enterprise multi-angle photo galleries, HSN tax classifications, and bulk tiered pricing.
                  </p>
                </div>

                <button
                  onClick={handleOpenNewProduct}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {vendorProducts.map((p) => {
                  const displayImg = p.images && p.images.length > 0 ? p.images[0] : p.imageUrl;
                  const imgCount = p.images ? p.images.length : p.imageUrl ? 1 : 0;
                  return (
                    <div key={p.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden relative group">
                          {displayImg ? (
                            <img src={displayImg} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 font-mono">
                            {imgCount}📷
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Category: <strong className="text-slate-700">{p.category}</strong></span>
                            <span>·</span>
                            <span>Brand: <strong className="text-slate-700">{p.brand}</strong></span>
                            {p.hsnCode && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-slate-600">HSN: {p.hsnCode}</span>
                              </>
                            )}
                            {p.sku && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-slate-600">SKU: {p.sku}</span>
                              </>
                            )}
                          </div>
                          {p.bulkTiers && p.bulkTiers.length > 0 && (
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                              Wholesale Slab: ₹{p.bulkTiers[0].pricePerUnit}/{p.unit} on ≥{p.bulkTiers[0].minQty} units
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left md:text-right">
                          <div className="font-semibold text-slate-800 tabular-nums">
                            In Stock: <strong>{p.availableStock}</strong> {p.unit}s
                          </div>
                          <div className="text-amber-700 font-extrabold text-sm tabular-nums">
                            ₹{p.pricePerUnit} <span className="text-xs font-normal text-slate-500">/{p.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">GST: {p.gstRate || 18}% included</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product & Photos"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-2 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Equipment Provider View */}
        {role === 'equipment_provider' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Your Registered Heavy Machinery Fleet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {equipmentList.map((eq) => (
                  <div key={eq.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold text-slate-900 text-sm">
                      <span>{eq.name}</span>
                      <span className="text-amber-700 tabular-nums">₹{eq.dailyRate}/day</span>
                    </div>
                    <div className="text-slate-500">Model: {eq.model} · Category: {eq.category}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>Operator: {eq.operatorAvailable ? 'Available' : 'Machine Only'}</span>
                      <span>Deposit: ₹{eq.securityDeposit}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Status: Active on BuildNiva Network
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Agent View */}
        {role === 'delivery_agent' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assigned Site Tipper Drops & Manifests
            </h2>
            <p className="text-slate-500">
              Deliver materials to verified site coordinates and request the 4-digit customer confirmation OTP.
            </p>
            {allOrders.map((ord) => (
              <div key={ord.id} className="p-4 bg-stone-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{ord.orderNumber} - {ord.items[0]?.productName}</div>
                  <div className="text-slate-500">Drop Address: {ord.shippingAddress.street}, {ord.shippingAddress.city}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700 capitalize">{ord.status.replace(/_/g, ' ')}</span>
                  <div className="text-[11px] text-slate-400">Customer OTP Required</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Professional (Civil Engineer / Architect) View */}
        {role === 'professional' && (
          <div className="space-y-6">
            {/* Engineer Identity & Photo Management Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                      Chartered Engineer & Architect Hub
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Professional Practice & Profile Photo Studio
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Maintain your verified registration, consultation fees, and public profile picture visible to all home builders.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>IEI / COA Accredited</span>
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveEngineerProfile} className="mt-6 space-y-6 text-xs">
                {/* PHOTO MANAGEMENT SECTION */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Engineer Profile Picture</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      High-resolution portrait for professional credibility
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Live Avatar Preview */}
                    <div className="relative shrink-0 group">
                      {proPhotoUrl ? (
                        <img
                          src={proPhotoUrl}
                          alt={currentUser?.name || 'Engineer Profile'}
                          className="w-28 h-28 rounded-full object-cover border-4 border-amber-500 shadow-lg ring-4 ring-amber-100"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-500">
                          <UserIcon className="w-12 h-12" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 p-1.5 bg-emerald-600 text-white rounded-full border-2 border-white shadow-md" title="Verified Badge">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Photo Upload Actions */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* PC Upload */}
                        <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white rounded-xl p-3 text-center cursor-pointer hover:bg-amber-50/40 transition-colors flex items-center justify-center gap-2">
                          <UploadCloud className="w-5 h-5 text-amber-600" />
                          <div className="text-left">
                            <div className="font-bold text-slate-800 text-xs">Upload from PC / Mobile</div>
                            <div className="text-[10px] text-slate-400">JPG, PNG, WebP up to 3MB</div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProPhotoUpload}
                            className="hidden"
                          />
                        </label>

                        {/* URL input */}
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="Paste photo web URL..."
                            value={proCustomPhotoUrl}
                            onChange={(e) => setProCustomPhotoUrl(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (proCustomPhotoUrl.trim()) {
                                setProPhotoUrl(proCustomPhotoUrl.trim());
                                showToast('Photo Applied', 'Photo URL loaded into preview.', 'info');
                              }
                            }}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl cursor-pointer"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      {/* Quick-Pick Verified Headshots */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-700 text-[11px]">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Quick-Pick Verified Engineer & Architect Headshots:</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { name: 'Er. Civil Structural (Male)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
                            { name: 'Ar. Biophilic Architect (Female)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
                            { name: 'Er. Quantity Surveyor (Male)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
                            { name: 'Er. RCC Frame Lead (Female)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setProPhotoUrl(p.url);
                                showToast('Headshot Selected', `Selected preset #${idx + 1}`, 'info');
                              }}
                              className={`p-1.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                                proPhotoUrl === p.url
                                  ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-500'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <img src={p.url} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div className="truncate text-[10px] font-semibold text-slate-800">
                                {p.name.split(' ')[1]}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRACTICE CREDENTIALS & SPECIALTY */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Professional Title / Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={proTitle}
                      onChange={(e) => setProTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Statutory Registration Number (IEI / COA)
                    </label>
                    <input
                      type="text"
                      required
                      value={proRegNo}
                      onChange={(e) => setProRegNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Specialization Domain
                    </label>
                    <select
                      value={proSpecialization}
                      onChange={(e) => setProSpecialization(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    >
                      <option value="Civil & Structural Engineer">Civil & Structural Engineer</option>
                      <option value="Architectural Design">Architectural Design</option>
                      <option value="Quantity Surveyor & Estimator">Quantity Surveyor & Estimator</option>
                      <option value="Site Supervision">Site Supervision</option>
                      <option value="Interior Designer">Interior Designer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={proExperience}
                      onChange={(e) => setProExperience(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alma Mater / Engineering College
                    </label>
                    <input
                      type="text"
                      required
                      value={proEducation}
                      onChange={(e) => setProEducation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1:1 Online Video Review Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={proConsultFee}
                      onChange={(e) => setProConsultFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Physical Site Visit Audit Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={proSiteVisitFee}
                      onChange={(e) => setProSiteVisitFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Municipal Plan Approval Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      value={proPlanApprovalFee}
                      onChange={(e) => setProPlanApprovalFee(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* SPECIALIZED CORE DELIVERABLES PRICING */}
                <div className="p-5 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 rounded-2xl border border-emerald-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Core Specialized Deliverables</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Civil Engineer & Architect Direct Contract Pricing
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Home builders and commercial contractors can book and order these 4 core specialized deliverables directly from your profile.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold self-start sm:self-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Instant Escrow Invoicing</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Structural Drawings */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs">Structural Drawings</span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">RCC / CAD</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2.5">
                          RCC frame design, footing details, beam schedules & seismic moment calculations.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Deliverable Fee (₹)</label>
                        <input
                          type="number"
                          value={proStructuralRate}
                          onChange={(e) => setProStructuralRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* 3D Architectural Plans */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs">3D Architectural Plans</span>
                          <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-1.5 py-0.5 rounded">BIM / 3D</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2.5">
                          Photorealistic 3D elevations, 2D Vastu layouts, BIM models & material schedules.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Deliverable Fee (₹)</label>
                        <input
                          type="number"
                          value={proArchPlansRate}
                          onChange={(e) => setProArchPlansRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* MEP Designs */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs">MEP Designs</span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded">Plumbing / HVAC</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2.5">
                          Sanitary risers, water harvesting schematics, electrical conduits & solar routing.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Deliverable Fee (₹)</label>
                        <input
                          type="number"
                          value={proMepRate}
                          onChange={(e) => setProMepRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Site Audits */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs">Site Audits</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">Inspection Cert</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2.5">
                          Pre-pour rebar inspection, Schmidt rebound hammer testing & structural audit certification.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Audit Fee (₹)</label>
                        <input
                          type="number"
                          value={proSiteAuditsRate}
                          onChange={(e) => setProSiteAuditsRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Professional Biography & Structural Scope
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={proBio}
                    onChange={(e) => setProBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingProProfile}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingProProfile ? 'Saving Practice...' : 'Save Profile & Deliverables'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PROJECT PORTFOLIO & SAMPLE PICTURES STUDIO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Project Portfolio & Sample Pictures Studio</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-mono font-bold">
                        {portfolioProjects.length} Samples
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showcase sample structural blueprints, 3D architectural renders, MEP conduit designs, and site audit inspection photos.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAddProjectModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Project Sample Picture</span>
                </button>
              </div>

              {portfolioProjects.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="font-bold text-slate-700 text-sm">No Project Samples Uploaded Yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Upload sample drawings, 3D renderings, and audit pictures to attract builders and demonstrate your engineering expertise.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddProjectModalOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Sample Picture</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-slate-200 overflow-hidden">
                        <img
                          src={proj.imageUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                          {proj.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProjectSample(proj.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Delete Sample Picture"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {proj.title}
                        </div>
                        {proj.projectType && (
                          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                            {proj.projectType}
                          </div>
                        )}
                        {proj.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CUSTOMER INQUIRIES & CONTACT REQUESTS STUDIO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Live Client Inbound Stream</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                    <span>Customer Inquiries & Direct Contact Requests</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-xs font-mono font-bold">
                      {clientInquiries.length} Active Contacts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct inquiries, consultations, and deliverable bookings submitted by home builders and contractors to your profile.
                  </p>
                </div>

                {/* Pipeline Metrics */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-left">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">New / Pending</div>
                    <div className="text-xs font-bold text-amber-700">
                      {clientInquiries.filter((i) => i.status === 'scheduled').length} Inquiries
                    </div>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-left">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">In Progress</div>
                    <div className="text-xs font-bold text-indigo-700">
                      {clientInquiries.filter((i) => i.status === 'in_progress').length} In-Work
                    </div>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-left">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Completed</div>
                    <div className="text-xs font-bold text-emerald-700">
                      {clientInquiries.filter((i) => i.status === 'completed').length} Delivered
                    </div>
                  </div>
                  <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-left">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-700 font-semibold">Direct Contract Value</div>
                    <div className="text-xs font-bold text-emerald-800 tabular-nums">
                      ₹{clientInquiries.reduce((sum, i) => sum + (i.fee || 0), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Status Filter Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by customer name, phone, city, or scope..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-amber-500 text-slate-900"
                  />
                  {inquirySearch && (
                    <button
                      type="button"
                      onClick={() => setInquirySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setInquiryStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                        inquiryStatusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st === 'all' ? 'All Inquiries' : st === 'scheduled' ? 'New Requests' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inquiries Cards List */}
              {(() => {
                const filtered = clientInquiries.filter((inq) => {
                  const matchStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
                  const q = inquirySearch.toLowerCase().trim();
                  const matchQuery =
                    !q ||
                    inq.customerName?.toLowerCase().includes(q) ||
                    inq.customerPhone?.toLowerCase().includes(q) ||
                    inq.customerCity?.toLowerCase().includes(q) ||
                    inq.siteLocation?.toLowerCase().includes(q) ||
                    inq.projectDescription?.toLowerCase().includes(q) ||
                    inq.serviceType?.toLowerCase().includes(q);
                  return matchStatus && matchQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-semibold text-slate-700">No Customer Inquiries Found</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {inquirySearch ? 'Try a different search query or filter.' : 'When home builders contact you, their direct details and project scope will appear here.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((inq) => {
                      const isOnlineMeet = inq.serviceType === 'online_consultation';
                      const draftNote = engineerNotesDraft[inq.id] !== undefined ? engineerNotesDraft[inq.id] : (inq.engineerNotes || '');

                      return (
                        <div
                          key={inq.id}
                          className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200 p-5 transition-all space-y-4 shadow-xs"
                        >
                          {/* Header: Customer Identity & Deliverable */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                            <div className="flex items-start gap-3">
                              {/* Avatar Icon */}
                              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                                {inq.customerName?.split(' ')[0]?.[0] || 'C'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-sm">
                                    {inq.customerName || 'Prospective Builder'}
                                  </h4>
                                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {inq.bookingNumber}
                                  </span>
                                  {inq.urgency && inq.urgency !== 'Standard' && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                                      {inq.urgency}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                  {inq.customerCity && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <MapPin className="w-3 h-3 text-amber-600" />
                                      <span>{inq.customerCity}</span>
                                    </span>
                                  )}
                                  <span>·</span>
                                  <span>Received {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status & Deliverable Fee */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-medium block">Contract / Quote Fee</span>
                                <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                                  ₹{inq.fee.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  inq.status === 'scheduled'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : inq.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : inq.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {inq.status === 'scheduled' ? 'New Contact' : inq.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Customer Contact Details Strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                            {/* Phone */}
                            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg">
                              <div className="min-w-0">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Phone</span>
                                <span className="font-bold text-slate-800 text-[11px] truncate block">
                                  {inq.customerPhone || '+91 98201 44521'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={`tel:${inq.customerPhone || '+919820144521'}`}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                  title="Call Customer Directly"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/${(inq.customerPhone || '919820144521').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hello ${inq.customerName || 'Sir/Madam'}, I am reviewing your BuildNiva engineering inquiry (${inq.bookingNumber}).`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg">
                              <div className="min-w-0">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Email</span>
                                <span className="font-bold text-slate-800 text-[11px] truncate block">
                                  {inq.customerEmail || 'customer@buildniva.in'}
                                </span>
                              </div>
                              <a
                                href={`mailto:${inq.customerEmail || 'customer@buildniva.in'}?subject=${encodeURIComponent(
                                  `BuildNiva Engineering Deliverable [${inq.bookingNumber}]`
                                )}`}
                                className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Send Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Site Location & Preferred Date */}
                            <div className="p-1.5 bg-slate-50 rounded-lg min-w-0">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Site Location / Target Date</span>
                              <div className="font-semibold text-slate-800 text-[11px] truncate">
                                {inq.siteLocation || 'Plot in Bengaluru'}
                              </div>
                              <div className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                                {inq.date ? `${inq.date} · ${inq.timeSlot}` : inq.timeSlot}
                              </div>
                            </div>
                          </div>

                          {/* Deliverable Requested & Scope Details */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                <span className="font-bold text-slate-900 text-xs">
                                  Requested Deliverable:
                                </span>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded text-[11px] capitalize border border-amber-200">
                                  {inq.serviceType.replace(/_/g, ' ')}
                                </span>
                              </div>
                              {inq.inquiryType && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Type: {inq.inquiryType.replace('_', ' ')}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-normal">
                              "{inq.projectDescription}"
                            </p>
                          </div>

                          {/* Practice Notes & Action Bar */}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                            {/* Engineer internal note input */}
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Add practice note / deliverable link (e.g. CAD v1 drafted, beam schedule ready)..."
                                value={draftNote}
                                onChange={(e) =>
                                  setEngineerNotesDraft((prev) => ({ ...prev, [inq.id]: e.target.value }))
                                }
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateInquiryStatus(inq.id, inq.status, draftNote)}
                                disabled={updatingInquiryId === inq.id}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>Save Note</span>
                              </button>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isOnlineMeet && (
                                <a
                                  href={inq.meetingLink || 'https://meet.google.com/bld-cnct-eng'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Open Google Meet</span>
                                </a>
                              )}

                              {inq.status === 'scheduled' && (
                                <button
                                  type="button"
                                  disabled={updatingInquiryId === inq.id}
                                  onClick={() => handleUpdateInquiryStatus(inq.id, 'in_progress', draftNote)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept & Start</span>
                                </button>
                              )}

                              {inq.status === 'in_progress' && (
                                <button
                                  type="button"
                                  disabled={updatingInquiryId === inq.id}
                                  onClick={() => handleUpdateInquiryStatus(inq.id, 'completed', draftNote)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Delivered</span>
                                </button>
                              )}

                              {inq.status !== 'cancelled' && inq.status !== 'completed' && (
                                <button
                                  type="button"
                                  disabled={updatingInquiryId === inq.id}
                                  onClick={() => handleUpdateInquiryStatus(inq.id, 'cancelled', draftNote)}
                                  className="px-2.5 py-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                                >
                                  Decline
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Add Project Sample Picture Modal */}
        {addProjectModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 rounded-lg text-slate-950 font-bold">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Add Engineering / Architectural Sample</h3>
                    <p className="text-[10px] text-slate-400">Showcase your blueprints, 3D renders, MEP plans & audit photos</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddProjectModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProjectSample} className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Sample Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G+3 Residential Villa RCC Structural Framing"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deliverable Category *
                    </label>
                    <select
                      value={newProjectCategory}
                      onChange={(e) => setNewProjectCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium"
                    >
                      <option value="Structural Drawings">Structural Drawings (RCC / CAD)</option>
                      <option value="3D Architectural Plans">3D Architectural Plans & Renders</option>
                      <option value="MEP Designs">MEP Designs (Plumbing & Electrical)</option>
                      <option value="Site Audits">Site Audits & Quality Inspection</option>
                      <option value="Civil Execution">Civil Execution</option>
                    </select>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Building / Structure Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Residential Villa, Commercial Mall"
                      value={newProjectType}
                      onChange={(e) => setNewProjectType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Engineering Scope / Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. RCC moment-resisting frame layout, column-beam junction detailing, and foundation raft schedule."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                {/* Picture Upload / Presets */}
                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Sample Drawing / Photo *</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Auto-compressed client-side</span>
                  </label>

                  {/* Live Image Preview */}
                  {newProjectImageUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-100">
                      <img src={newProjectImageUrl} alt="Project Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProjectImageUrl('')}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Upload from device */}
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 rounded-xl p-3 text-center cursor-pointer flex items-center justify-center gap-2 transition-colors">
                      <UploadCloud className="w-5 h-5 text-amber-600" />
                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-xs">Upload Photo / Drawing</div>
                        <div className="text-[10px] text-slate-400">JPG, PNG, WebP</div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectPicUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Image URL Input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        placeholder="Or paste web image URL..."
                        value={newProjectImageUrl}
                        onChange={(e) => setNewProjectImageUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Quick-Pick Verified Sample Drawing Presets */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Or Choose from Verified Drawing & 3D Model Presets:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_DRAWING_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewProjectImageUrl(preset.url);
                            if (!newProjectTitle) setNewProjectTitle(preset.title);
                            setNewProjectCategory(preset.category as any);
                            setNewProjectType(preset.projectType);
                            if (!newProjectDesc) setNewProjectDesc(preset.desc);
                          }}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            newProjectImageUrl === preset.url
                              ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-500'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                          }`}
                        >
                          <img src={preset.url} alt={preset.title} className="w-10 h-10 rounded-md object-cover shrink-0" />
                          <div className="overflow-hidden">
                            <div className="truncate font-bold text-slate-800 text-[10px]">{preset.category}</div>
                            <div className="truncate text-slate-500 text-[9px]">{preset.title}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddProjectModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingProject || !newProjectImageUrl}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{addingProject ? 'Adding...' : 'Add Sample Picture'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* BuildNiva Material Catalog Studio Modal */}
        {productStudioOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
              {/* Studio Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                      BuildNiva Merchant Studio · Certified Material Catalog Hub
                    </div>
                    <h3 className="text-base font-bold">
                      {isEditing ? `Edit Listing: ${prodName}` : 'Add New Construction Material Listing'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setProductStudioOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Studio Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2.5 text-xs font-semibold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStudioTab('photos')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    studioTab === 'photos'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>1. Product Photos & Angles ({images.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioTab('details')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    studioTab === 'details'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>2. Product Title & Brand</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioTab('pricing')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    studioTab === 'pricing'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>3. Pricing, GST & Bulk Slabs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioTab('specs')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    studioTab === 'specs'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>4. BIS Specs & Logistics Weight</span>
                </button>
              </div>

              <form onSubmit={handleSubmitProductStudio} className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
                {/* TAB 1: PRODUCT PHOTOS & ANGLES */}
                {studioTab === 'photos' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-amber-600" />
                          <span>Multi-Angle Product Photo Gallery</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {images.length} photos selected (Minimum 1 required)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Verified suppliers must upload high-resolution images showing the manufacturer packaging,
                        BIS quality stamp, and grade labels. Drag or click below to upload your product images.
                      </p>
                    </div>

                    {/* Image Gallery Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl border-2 overflow-hidden bg-slate-100 group transition-all ${
                            idx === 0
                              ? 'border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-slate-200">
                            <img src={imgUrl} alt={`Product angle ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>

                          {/* Primary Badge */}
                          {idx === 0 ? (
                            <div className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>PRIMARY COVER</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Set Primary
                            </button>
                          )}

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove picture"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <div className="p-1.5 bg-white text-[10px] text-slate-600 text-center font-medium border-t border-slate-100 truncate">
                            Angle #{idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Upload Box */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-amber-50/40 transition-colors aspect-square">
                        {uploadingImages ? (
                          <RefreshCw className="w-7 h-7 text-amber-600 animate-spin mb-1.5" />
                        ) : (
                          <UploadCloud className="w-7 h-7 text-slate-400 mb-1.5" />
                        )}
                        <span className="font-bold text-slate-700 text-xs">
                          {uploadingImages ? 'Uploading...' : 'Upload from PC'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploadingImages}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Add by Image URL */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Add Direct Photo Web URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Quick-Pick Realistic Construction Stock Photos */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-slate-800">Quick-Pick Verified Construction Presets</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {MATERIAL_PHOTO_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImages((prev) => [...prev, preset.url]);
                              showToast('Preset Added', `${preset.name} added to your photos.`, 'info');
                            }}
                            className="p-2 border border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50/30 text-left transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-[11px] text-slate-800 truncate">{preset.name}</div>
                              <div className="text-[9px] text-slate-400">{preset.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCT TITLE & CATEGORY */}
                {studioTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Product Listing Title * (Marketplace Search Standard)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. UltraTech Super Weather Plus OPC 53 Grade Cement (50kg)"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Include Brand + Grade + Quantity for maximum search discoverability.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Product Category *</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                        >
                          <option value="Cement">Cement</option>
                          <option value="TMT Steel">TMT Steel</option>
                          <option value="Bricks & Blocks">Bricks & Blocks</option>
                          <option value="Sand & Aggregates">Sand & Aggregates</option>
                          <option value="Ready Mix Concrete">Ready Mix Concrete (RMC)</option>
                          <option value="Waterproofing">Waterproofing & Admixtures</option>
                          <option value="Paints & Coatings">Paints & Wall Primer</option>
                          <option value="Plumbing">Plumbing & Pipes</option>
                          <option value="Electrical">Electrical & Cables</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Manufacturer / Brand Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. UltraTech, Tata Tiscon, JSW"
                          value={prodBrand}
                          onChange={(e) => setProdBrand(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">GST HSN Code (8 Digits) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 25232910"
                          value={prodHsn}
                          onChange={(e) => setProdHsn(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 uppercase focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400">Mandatory for GST Input Tax Credit (ITC) billing</span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Seller SKU / Inventory Code</label>
                        <input
                          type="text"
                          value={prodSku}
                          onChange={(e) => setProdSku(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product Description & Site Usage</label>
                      <textarea
                        rows={3}
                        placeholder="Detail the technical application, setting time, mixing ratio, or recommended structural members..."
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: PRICING, GST & BULK SLABS */}
                {studioTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Selling Price / Unit (₹) *</label>
                        <input
                          type="number"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400">Actual price charged to customer</span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Maximum Retail Price (MRP ₹)</label>
                        <input
                          type="number"
                          value={prodMrp}
                          onChange={(e) => setProdMrp(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                        />
                        {prodMrp > prodPrice && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {Math.round(((prodMrp - prodPrice) / prodMrp) * 100)}% Discount Displayed
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                        <select
                          value={prodUnit}
                          onChange={(e) => setProdUnit(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                        >
                          <option value="bag">bag (50kg standard)</option>
                          <option value="tonne">tonne (1000kg)</option>
                          <option value="piece">piece / brick</option>
                          <option value="brass">brass (100 cu.ft)</option>
                          <option value="litre">litre</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Minimum Order Qty (MOQ)</label>
                        <input
                          type="number"
                          min="1"
                          value={prodMinOrder}
                          onChange={(e) => setProdMinOrder(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                        <select
                          value={prodGstRate}
                          onChange={(e) => setProdGstRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold"
                        >
                          <option value={5}>5% (Flyash, Clay Bricks)</option>
                          <option value={12}>12% (Admixtures, Tools)</option>
                          <option value={18}>18% (TMT Steel, Sand, Aggregates)</option>
                          <option value={28}>28% (Cement, Ready Mix Concrete)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Available Yard Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={prodStock}
                          onChange={(e) => setProdStock(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Tag className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Wholesale Tiered Slab Promotion</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Drive volume orders from commercial builders by configuring wholesale discount tiers:
                      </p>
                      <input
                        type="text"
                        value={prodBulkDiscountSlab}
                        onChange={(e) => setProdBulkDiscountSlab(e.target.value)}
                        placeholder="e.g. 5% off on >100 units, 10% off on >500 units"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-emerald-950 font-medium text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: BIS SPECS & LOGISTICS WEIGHT */}
                {studioTab === 'specs' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Unit Net Weight in KG * (Tipper Load Balancing)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={prodWeightKg}
                          onChange={(e) => setProdWeightKg(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400">
                          Critical: Prevents overloading delivery tipper trucks.
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Restock / Dispatch Lead Time (Days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="14"
                          value={prodLeadDays}
                          onChange={(e) => setProdLeadDays(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400">0 = Same-day immediate dispatch</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Quality Grade</label>
                        <input
                          type="text"
                          value={prodSpecs.grade}
                          onChange={(e) => setProdSpecs({ ...prodSpecs, grade: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">BIS / IS Standard Code</label>
                        <input
                          type="text"
                          value={prodSpecs.standard}
                          onChange={(e) => setProdSpecs({ ...prodSpecs, standard: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Compressive / Tensile Strength</label>
                        <input
                          type="text"
                          value={prodSpecs.compressiveStrength}
                          onChange={(e) => setProdSpecs({ ...prodSpecs, compressiveStrength: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Packaging Standard</label>
                        <input
                          type="text"
                          value={prodSpecs.packaging}
                          onChange={(e) => setProdSpecs({ ...prodSpecs, packaging: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Marketplace Listing Preview Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Live Marketplace Product Preview</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {images[0] ? (
                          <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {prodName || 'Product Title Preview'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prodBrand} · {prodCategory} · HSN: {prodHsn}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          ✓ GST Invoice Eligible · {prodStock} in stock
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-amber-700 tabular-nums">
                        ₹{prodPrice} <span className="text-[10px] font-normal text-slate-500">/{prodUnit}</span>
                      </div>
                      {prodMrp > prodPrice && (
                        <div className="text-[11px] text-slate-400 line-through tabular-nums">
                          ₹{prodMrp}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Studio Footer Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Complies with National Building Code & ISI Quality Standards.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductStudioOpen(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingProduct}
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {submittingProduct ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{isEditing ? 'Update Listing' : 'Publish Product to Marketplace'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Vendor GST Tax Invoice Modal */}
        {vendorInvoiceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    BuildNiva Marketplace · Supplier Tax Invoice
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Invoice #{vendorInvoiceModal.orderNumber.replace('BC-ORD-', 'BC-INV-')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVendorInvoiceModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                <div>
                  <div className="font-bold text-slate-800">Billed From (Supplier Yard):</div>
                  <div className="text-slate-600">{vendorInvoiceModal.vendorName}</div>
                  <div className="text-slate-500 text-[11px]">GSTIN: 29AABCA8492K1Z9</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">Billed To (Site Delivery):</div>
                  <div className="text-slate-600">{vendorInvoiceModal.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{vendorInvoiceModal.shippingAddress.street}, {vendorInvoiceModal.shippingAddress.city} - {vendorInvoiceModal.shippingAddress.pincode}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                    <th className="py-1">Description</th>
                    <th className="py-1">Qty</th>
                    <th className="py-1">Rate</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorInvoiceModal.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-medium text-slate-800">{it.productName}</td>
                      <td className="py-1.5 text-slate-600 tabular-nums">{it.quantity} {it.unit}</td>
                      <td className="py-1.5 text-slate-600 tabular-nums">₹{it.unitPrice}</td>
                      <td className="py-1.5 text-right font-semibold text-slate-900 tabular-nums">
                        ₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center font-bold">
                <span>Total Taxable + GST:</span>
                <span className="text-base text-slate-900 tabular-nums">
                  ₹{vendorInvoiceModal.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
