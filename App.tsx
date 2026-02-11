import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import DeveloperDashboard from './components/DeveloperDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import UserDashboard from './components/UserDashboard';
import { Role, User, SiteConfig, RechargeCard, LandingService } from './types';
const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  const handleSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    alert("خطأ في التسجيل: " + error.message);
  } else {
    alert("تم إنشاء الحساب بنجاح! افتح بريدك الالكتروني للتفعيل.");
  }
};


  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    logoUrl: 'https://filspay.com/assets/img/logo.png',
    networkBalance: 5000000, 
    primaryColor: '#0f172a',
    secondaryColor: '#3b82f6',
    siteName: 'FastPay Network',
    template: 'modern-dark',
    heroTitle: 'FastPay Network: مستقبل المدفوعات الرقمية العالمية',
    heroSubtitle: 'نحن لا نقدم مجرد وسيلة دفع، بل نبني منظومة مالية سحابية متكاملة تمكن الأفراد والشركات من إدارة ثرواتهم وعملياتهم التجارية بأمان فائق وسرعة البرق.',
    heroCtaText: 'ابدأ رحلتك المالية',
    salesCtaText: 'تواصل مع الخبراء',
    servicesTitle: 'ابتكاراتنا في الهندسة المالية',
    servicesSubtitle: 'حلول ذكية مصممة خصيصاً لتجاوز تعقيدات الأنظمة مصرفية التقليدية وربطك بالاقتصاد العالمي فورياً.',
    galleryTitle: 'بصمتنا الرقمية العالمية',
    footerAbout: 'FastPay Network هي الشريك المالي المعتمد لآلاف المؤسسات حول العالم، نقدم حلول الدفع عبر بنية تحتية مشفرة بتقنيات AES-256 وربط مباشر مع البنوك المركزية.',
    contactEmail: 'global@fastpay-network.com',
    contactPhone: '+966 800 123 4567',
    contactAddress: 'المركز المالي العالمي - برج النخبة',
    footerLinksTitle: 'الشركة والخدمات',
    footerLink1Text: 'من نحن',
    footerLink2Text: 'حلول الدفع للمتاجر',
    footerLink3Text: 'الرسوم والعمولات',
    footerLink4Text: 'مركز المساعدة',
    contactSectionTitle: 'تواصل معنا',
    galleryImages: [],
    merchantFeeType: 'percent',
    merchantFeeValue: 1.5,
    userFeeType: 'fixed',
    userFeeValue: 1.0,
    depositPlans: [
      { id: '1', name: 'الخطة الفضية', rate: 5, durationMonths: 3, minAmount: 100 },
      { id: '2', name: 'الخطة الذهبية', rate: 12, durationMonths: 6, minAmount: 500 },
      { id: '3', name: 'الخطة الماسية', rate: 25, durationMonths: 12, minAmount: 1000 }
    ]
  });

  const [services, setServices] = useState<LandingService[]>([
    { id: '1', title: 'عالم بدون حدود مالية', description: 'ادعم مبيعاتك بأكثر من 130 عملة عالمية مع معالجة فورية لبطاقات Visa و MasterCard عبر بوابتنا.', icon: '🌍' },
    { id: '2', title: 'تشفير بمستوى بنكي', description: 'جميع معاملاتك محمية ببروتوكولات الأمان العسكرية وتشفير AES-256 لضمان خصوصية مطلقة.', icon: '🛡️' },
    { id: '3', title: 'تمويل الرواتب الذكي', description: 'أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع.', icon: '🏦' }
  ]);

  const [pages, setPages] = useState<CustomPage[]>([]);
  const [accounts, setAccounts] = useState<User[]>([
    { id: '1', username: 'admin', fullName: 'مدير النظام التنفيذي', email: 'admin@fastpay.com', password: 'ubnt', role: 'DEVELOPER', balance: 0, status: 'active', createdAt: '2023-01-01', linkedCards: [] },
    { id: '2', username: 'AhmedStore', fullName: 'متجر أحمد للبطاقات', email: 'ahmed@store.com', password: '123', role: 'MERCHANT', balance: 25000, status: 'active', createdAt: '2023-01-01', linkedCards: [] },
  ]);
  const [rechargeCards, setRechargeCards] = useState<RechargeCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [salaryPlans, setSalaryPlans] = useState<SalaryFinancing[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);

  const currentUser = useMemo(() => accounts.find(acc => acc.id === currentUserId) || null, [accounts, currentUserId]);

  useEffect(() => {
    const loadData = () => {
      try {
        const config = localStorage.getItem('fp_v12_config');
        if (config) setSiteConfig(JSON.parse(config));
        const storedAccounts = localStorage.getItem('fp_v12_accounts');
        if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
        const storedServices = localStorage.getItem('fp_v12_services');
        if (storedServices) setServices(JSON.parse(storedServices));
        const storedPages = localStorage.getItem('fp_v12_pages');
        if (storedPages) setPages(JSON.parse(storedPages));
        const storedCards = localStorage.getItem('fp_v12_cards');
        if (storedCards) setRechargeCards(JSON.parse(storedCards));
        const storedTrans = localStorage.getItem('fp_v12_trans');
        if (storedTrans) setTransactions(JSON.parse(storedTrans));
        const storedSalary = localStorage.getItem('fp_v12_salary');
        if (storedSalary) setSalaryPlans(JSON.parse(storedSalary));
        const storedDeposits = localStorage.getItem('fp_v12_deposits');
        if (storedDeposits) setFixedDeposits(JSON.parse(storedDeposits));
      } catch (e) { console.error("Data load error", e); }
    };
    loadData();
  }, []);

  useEffect(() => localStorage.setItem('fp_v12_config', JSON.stringify(siteConfig)), [siteConfig]);
  useEffect(() => localStorage.setItem('fp_v12_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('fp_v12_services', JSON.stringify(services)), [services]);
  useEffect(() => localStorage.setItem('fp_v12_pages', JSON.stringify(pages)), [pages]);
  useEffect(() => localStorage.setItem('fp_v12_cards', JSON.stringify(rechargeCards)), [rechargeCards]);
  useEffect(() => localStorage.setItem('fp_v12_trans', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('fp_v12_salary', JSON.stringify(salaryPlans)), [salaryPlans]);
  useEffect(() => localStorage.setItem('fp_v12_deposits', JSON.stringify(fixedDeposits)), [fixedDeposits]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type']) => {
    const newNotify: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title, message, type, timestamp: new Date().toLocaleTimeString('ar-SA'), isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, []);

  const handleUpdateUser = (updatedUser: User) => setAccounts(prev => prev.map(acc => acc.id === updatedUser.id ? updatedUser : acc));

  if (currentUser) {
    const props = { 
      user: currentUser, onLogout: () => setCurrentUserId(null), siteConfig, onUpdateConfig: setSiteConfig, 
      accounts, setAccounts, rechargeCards, setRechargeCards, transactions, setTransactions, 
      addNotification, salaryPlans, setSalaryPlans, fixedDeposits, setFixedDeposits, onUpdateUser: handleUpdateUser, 
      services, setServices, pages, setPages, notifications, setNotifications
    };
    switch (currentUser.role) {
      case 'DEVELOPER': return <DeveloperDashboard {...props} />;
      case 'MERCHANT': return <MerchantDashboard {...props} />;
      case 'USER': return <UserDashboard {...props} />;
    }
  }

  return (
    <div className="min-h-screen">
      <LandingPage siteConfig={siteConfig} services={services} pages={pages} currentPath={currentPath} setCurrentPath={setCurrentPath} onLoginClick={() => setIsLoginModalOpen(true)} onRegisterClick={() => setIsRegisterModalOpen(true)} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => { setCurrentUserId(u.id); setIsLoginModalOpen(false); }} accounts={accounts} onSwitchToRegister={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} />}
      {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} accounts={accounts} onRegister={(u) => { setAccounts(p => [...p, u]); setCurrentUserId(u.id); setIsRegisterModalOpen(false); }} onSwitchToLogin={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} />}
    </div>
  );
};

export default App;
