// Type definitions for Optical POS Interface

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerNumber: string;
  dateOfBirth?: string;
  address?: string;
  insuranceInfo?: string;
}

export interface PrescriptionData {
  od: EyePrescription;
  os: EyePrescription;
  pd?: number; // Pupillary Distance
  prescriptionDate?: string;
  expiryDate?: string;
}

export interface EyePrescription {
  sph: number | string; // Sphere
  cyl: number | string; // Cylinder
  axis: number | string; // Axis (0-180)
  add?: number | string; // Addition for progressive/bifocal
}

export interface FrameProduct {
  id: string;
  name: string;
  model: string;
  brand: string;
  imageUrl: string;
  availableColors: ColorOption[];
  selectedColor?: string;
  price: number;
  sku: string;
}

export interface ColorOption {
  name: string;
  value: string;
  hexCode: string;
}

export interface LensOption {
  id: string;
  type: 'single-vision' | 'progressive' | 'bifocal' | 'readers';
  material: 'standard' | 'polycarbonate' | 'high-index' | 'trivex';
  coatings: string[];
  price: number;
}

export interface OrderItem {
  customerId: string;
  frame: FrameProduct;
  lenses: LensOption;
  prescription: PrescriptionData;
  totalPrice: number;
  orderDate: string;
  notes?: string;
}

export const LENS_TYPES = [
  { value: 'single-vision', label: 'Single Vision' },
  { value: 'progressive', label: 'Progressive' },
  { value: 'bifocal', label: 'Bifocal' },
  { value: 'readers', label: 'Reading Glasses' },
] as const;

export const LENS_MATERIALS = [
  { value: 'standard', label: 'Standard Plastic', price: 0 },
  { value: 'polycarbonate', label: 'Polycarbonate', price: 50 },
  { value: 'high-index', label: 'High Index', price: 100 },
  { value: 'trivex', label: 'Trivex', price: 75 },
] as const;

export const LENS_COATINGS = [
  { value: 'anti-glare', label: 'Anti-Glare', price: 40 },
  { value: 'blue-light', label: 'Blue-Light Filter', price: 50 },
  { value: 'scratch-resistant', label: 'Scratch Resistant', price: 30 },
  { value: 'uv-protection', label: 'UV Protection', price: 25 },
  { value: 'photochromic', label: 'Photochromic (Transitions)', price: 100 },
] as const;
