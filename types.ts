
export type Role = 'DEVELOPER' | 'MERCHANT' | 'USER' | 'GUEST';

export interface BankCard {
  id: string;
  number: string;
  type: 'visa' | 'mastercard' | 'unknown';
  expiry: string;
  cvc: string;
  holder: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: Role;
  balance: number;
  status: 'active' | 'suspended' | 'disabled';
  statusReason?: string;
  createdAt: string;
  linkedCards?: BankCard[];
}

export interface DepositPlan {
  id: string;
  name: string;
  rate: number;
  durationMonths: number;
  minAmount: number;
}

export interface FixedDeposit {
  id: string;
  userId: string;
  username: string;
  amount: number;
  interestRate: number; // percentage
  durationMonths: number;
  startDate: string;
  endDate: string;
  expectedProfit: number;
  status: 'active' | 'matured' | 'cancelled';
}

export interface SalaryFinancing {
  id: string;
  userId: string;
  username: string;
  amount: number;
  deduction: number; 
  duration: number; 
  startDate: string;
  status: 'active' | 'completed' | 'cancelled';
  requestedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'redeem' | 'generate_card' | 'bank_transfer' | 'salary_financing' | 'fixed_deposit';
  amount: number;
  relatedUser?: string; 
  relatedId?: string; 
  timestamp: string;
}

export interface LandingService {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  showInNavbar: boolean;
  showInFooter: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'user' | 'money' | 'system' | 'security';
  timestamp: string;
  isRead: boolean;
}

export interface SiteConfig {
  logoUrl: string;
  networkBalance: number;
  primaryColor: string;
  secondaryColor: string;
  siteName: string;
  template: string; 
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  salesCtaText: string;
  servicesTitle: string;
  servicesSubtitle: string;
  galleryTitle: string;
  footerAbout: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerLinksTitle: string;
  footerLink1Text: string;
  footerLink2Text: string;
  footerLink3Text: string;
  footerLink4Text: string;
  contactSectionTitle: string;
  galleryImages: string[];
  merchantFeeType: 'fixed' | 'percent';
  merchantFeeValue: number;
  userFeeType: 'fixed' | 'percent';
  userFeeValue: number;
  depositPlans: DepositPlan[];
}

export interface RechargeCard {
  code: string;
  amount: number;
  isUsed: boolean;
  disabled?: boolean;
  usedBy?: string; 
  usedByFullName?: string;
  usedAt?: string;
  generatedBy: string;
  createdAt: string;
}
