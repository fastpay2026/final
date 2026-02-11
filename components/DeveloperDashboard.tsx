
import React, { useState, useRef, useMemo } from 'react';
import { User, SiteConfig, Role, RechargeCard, LandingService, Transaction, Notification, CustomPage, SalaryFinancing, FixedDeposit, DepositPlan } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  services: LandingService[];
  setServices: React.Dispatch<React.SetStateAction<LandingService[]>>;
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
  fixedDeposits: FixedDeposit[];
  setFixedDeposits: React.Dispatch<React.SetStateAction<FixedDeposit[]>>;
}

const DeveloperDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, onUpdateConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  services, setServices, pages, setPages, transactions, setTransactions, addNotification, 
  salaryPlans, setSalaryPlans, fixedDeposits, setFixedDeposits
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'cards' | 'pages' | 'salary' | 'deposits' | 'settings'>('home');
  const [showSuccess, setShowSuccess] = useState(false);
  const [tempConfig, setTempConfig] = useState<SiteConfig>(siteConfig);
  
  const [accountModal, setAccountModal] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null });
  const [cardGenModal, setCardGenModal] = useState(false);
  const [pageModal, setPageModal] = useState<{ isOpen: boolean, page: CustomPage | null }>({ isOpen: false, page: null });
  const [salaryModal, setSalaryModal] = useState(false);
  
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [genAmount, setGenAmount] = useState<number>(100);
  const [genCount, setGenCount] = useState<number>(10);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const triggerSuccess = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000); };

  const handleUpdateConfig = () => {
    onUpdateConfig(tempConfig);
    addNotification('تحديث النظام', 'تم تطبيق إعدادات النظام وخطط الاستثمار بنجاح.', 'system');
    triggerSuccess();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempConfig(prev => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setTempConfig(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateCards = (e: React.FormEvent) => {
    e.preventDefault();
    const newCards: RechargeCard[] = [];
    const ts = new Date().toLocaleString('ar-SA');
    for (let i = 0; i < genCount; i++) {
      newCards.push({
        code: `FP-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        amount: genAmount, isUsed: false, generatedBy: user.id, createdAt: ts
      });
    }
    setRechargeCards(prev => [...newCards, ...prev]);
    setCardGenModal(false);
    addNotification('توليد بطاقات', `تم إصدار ${genCount} بطاقة بقيمة $${genAmount}`, 'money');
    triggerSuccess();
  };

  const handleCancelDeposit = (depositId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الوديعة؟ سيتم إرجاع رأس المال فقط للمستخدم.')) return;
    
    const deposit = fixedDeposits.find(d => d.id === depositId);
    if (!deposit) return;

    setAccounts(prev => prev.map(acc => acc.id === deposit.userId ? { ...acc, balance: acc.balance + deposit.amount } : acc));
    setFixedDeposits(prev => prev.map(d => d.id === depositId ? { ...d, status: 'cancelled' } : d));
    
    addNotification('الودائع', `تم إلغاء وديعة بقيمة $${deposit.amount} للمستخدم @${deposit.username}.`, 'money');
    triggerSuccess();
  };

  const handleUpdatePlan = (planId: string, field: keyof DepositPlan, value: any) => {
    setTempConfig(prev => ({
      ...prev,
      depositPlans: prev.depositPlans.map(p => p.id === planId ? { ...p, [field]: value } : p)
    }));
  };

  const handleSaveAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;
    const balance = parseFloat(formData.get('balance') as string) || 0;

    if (accountModal.user) {
      setAccounts(prev => prev.map(acc => acc.id === accountModal.user!.id ? { 
        ...acc, username, fullName, email, password, role, balance 
      } : acc));
    } else {
      setAccounts(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        username, fullName, email, password, role, balance, 
        status: 'active', createdAt: new Date().toISOString().split('T')[0] 
      }]);
    }
    setAccountModal({ isOpen: false, user: null });
    triggerSuccess();
  };

  const handleSavePage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const isActive = formData.get('isActive') === 'on';
    const showInNavbar = formData.get('showInNavbar') === 'on';
    const showInFooter = formData.get('showInFooter') === 'on';

    if (pageModal.page) {
      setPages(prev => prev.map(p => p.id === pageModal.page!.id ? { 
        ...p, title, slug, content, isActive, showInNavbar, showInFooter 
      } : p));
    } else {
      setPages(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        title, slug, content, isActive, showInNavbar, showInFooter 
      }]);
    }
    setPageModal({ isOpen: false, page: null });
    triggerSuccess();
  };

  const handleAddSalaryPlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const deduction = parseFloat(formData.get('deduction') as string);
    const duration = parseInt(formData.get('duration') as string);
    
    const targetUser = accounts.find(a => a.username === username);
    if (!targetUser) return alert('خطأ: المستخدم غير موجود في الشبكة.');

    setAccounts(prev => prev.map(acc => acc.id === targetUser.id ? { ...acc, balance: acc.balance + amount } : acc));
    
    const ts = new Date().toLocaleString('ar-SA');
    setSalaryPlans(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      userId: targetUser.id, username, amount, deduction, 
      duration, startDate: new Date().toISOString().split('T')[0], 
      status: 'active', requestedAt: ts 
    }]);

    setTransactions(prev => [{ 
      id: Math.random().toString(36).substr(2, 9), 
      userId: targetUser.id, type: 'salary_financing', 
      amount, relatedUser: 'تمويل راتب معتمد', 
      timestamp: ts 
    }, ...prev]);

    setSalaryModal(false);
    addNotification('تمويل راتب', `تم إيداع $${amount} في حساب @${username}. استقطاع شهري: $${deduction}`, 'money');
    triggerSuccess();
  };

  const filteredCards = useMemo(() => rechargeCards.filter(c => c.code.toLowerCase().includes(cardSearchQuery.toLowerCase())).reverse(), [rechargeCards, cardSearchQuery]);

  const totalDeposited = useMemo(() => fixedDeposits.filter(d=>d.status==='active').reduce((sum, d) => sum + d.amount, 0), [fixedDeposits]);
  const totalExpectedProfit = useMemo(() => fixedDeposits.filter(d=>d.status==='active').reduce((sum, d) => sum + d.expectedProfit, 0), [fixedDeposits]);

  return (
    <div className="fixed inset-0 z-[150] flex bg-[#0a0f1e] text-white text-right font-sans" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-[#111827] border-l border-white/5 flex flex-col shadow-2xl z-20">
        <div className="p-10 border-b border-white/5 flex flex-col items-center">
           <div className="bg-white/90 p-4 rounded-3xl mb-4 shadow-xl">
             <img src={tempConfig.logoUrl} className="h-12 object-contain" alt="Logo" />
           </div>
           <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest text-center">الإدارة التنفيذية</p>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {[
            { id: 'home', l: 'الرئيسية', i: '💎' },
            { id: 'users', l: 'إدارة الحسابات', i: '👤' },
            { id: 'cards', l: 'البطاقات الرقمية', i: '🎫' },
            { id: 'salary', l: 'تمويل الرواتب', i: '🏦' },
            { id: 'deposits', l: 'الودائع الثابتة', i: '📈' },
            { id: 'pages', l: 'إدارة الصفحات', i: '📄' },
            { id: 'settings', l: 'إعدادات الواجهة', i: '🎨' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`w-full flex items-center p-5 rounded-2xl transition-all ${activeTab === t.id ? 'bg-sky-600 shadow-lg scale-[1.02]' : 'hover:bg-white/5 text-slate-400'}`}>
              <span className="text-2xl ml-4">{t.i}</span>
              <span className="font-black text-lg">{t.l}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={onLogout} className="w-full p-4 bg-red-500/10 text-red-400 rounded-xl font-black border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">خروج آمن</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-28 bg-[#111827]/80 backdrop-blur-2xl border-b border-white/5 px-12 flex items-center justify-between z-10">
           <div className="bg-emerald-500/10 px-8 py-4 rounded-2xl border border-emerald-500/20 shadow-lg text-center">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">إجمالي سيولة الشبكة</p>
              <p className="text-3xl font-black text-emerald-400">${siteConfig.networkBalance.toLocaleString()}</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="font-black text-xl leading-tight">{user.fullName}</p>
                <p className="text-sky-500 text-[10px] font-bold uppercase tracking-widest">Root Administrator</p>
              </div>
              <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">AD</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar z-10 relative">
          {showSuccess && <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-12 py-4 rounded-full font-black animate-bounce shadow-2xl">تم تنفيذ العملية بنجاح ✓</div>}

          {activeTab === 'home' && (
             <div className="space-y-12 animate-in fade-in duration-500">
                <h2 className="text-6xl font-black tracking-tighter text-white">الإحصائيات العامة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {[
                     { l: 'إجمالي الحسابات', v: accounts.length, i: '👤', c: 'from-sky-600 to-indigo-700' },
                     { l: 'البطاقات النشطة', v: rechargeCards.filter(c=>!c.isUsed).length, i: '🎫', c: 'from-amber-500 to-orange-600' },
                     { l: 'الودائع النشطة', v: `$${totalDeposited.toLocaleString()}`, i: '📈', c: 'from-emerald-500 to-teal-700' },
                     { l: 'الأرباح المستحقة', v: `$${totalExpectedProfit.toLocaleString()}`, i: '💰', c: 'from-indigo-600 to-blue-800' }
                   ].map((s, idx) => (
                      <div key={idx} className={`p-10 bg-gradient-to-br ${s.c} rounded-[3rem] shadow-xl relative overflow-hidden group hover:scale-105 transition-transform duration-500`}>
                         <p className="text-white/70 font-black text-xs uppercase mb-2">{s.l}</p>
                         <p className="text-4xl font-black text-white">{s.v}</p>
                         <span className="absolute -bottom-4 -right-4 text-7xl opacity-10">{s.i}</span>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'users' && (
             <div className="space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-6xl font-black tracking-tighter text-white">إدارة المستخدمين</h2>
                   <button onClick={()=>setAccountModal({isOpen:true, user:null})} className="bg-sky-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-lg hover:bg-sky-500 transition-all">+ إضافة حساب جديد</button>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-right">
                      <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <tr><th className="p-8">المستخدم</th><th className="p-8">الدور</th><th className="p-8">الرصيد</th><th className="p-8">إجراء</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {accounts.map(acc => (
                            <tr key={acc.id} className="hover:bg-white/5 transition-colors">
                               <td className="p-8"><p className="font-black text-white">{acc.fullName}</p><p className="text-sky-500 text-xs font-bold">@{acc.username}</p></td>
                               <td className="p-8 font-bold text-slate-400 uppercase text-xs tracking-widest">{acc.role}</td>
                               <td className="p-8 font-black text-emerald-400 text-xl">${acc.balance.toLocaleString()}</td>
                               <td className="p-8">
                                  <button onClick={()=>setAccountModal({isOpen:true, user:acc})} className="text-sky-500 font-black ml-4 hover:underline">تعديل</button>
                                  <button onClick={()=>{if(confirm('حذف الحساب نهائياً؟')) setAccounts(p=>p.filter(a=>a.id!==acc.id))}} className="text-red-500 font-black hover:underline">حذف</button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'deposits' && (
             <div className="space-y-12">
                <h2 className="text-6xl font-black tracking-tighter text-white">الودائع الاستثمارية</h2>
                <div className="bg-[#111827] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-right">
                      <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <tr><th className="p-8">المستثمر</th><th className="p-8">المبلغ</th><th className="p-8">نسبة الربح</th><th className="p-8">الربح المتوقع</th><th className="p-8">تاريخ الاستحقاق</th><th className="p-8">إجراء</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {fixedDeposits.map(dep => (
                           <tr key={dep.id} className={`hover:bg-white/5 transition-colors ${dep.status !== 'active' ? 'opacity-40' : ''}`}>
                              <td className="p-8 font-black text-white">@{dep.username}</td>
                              <td className="p-8 font-black text-white text-xl">${dep.amount.toLocaleString()}</td>
                              <td className="p-8 text-sky-400 font-bold">{dep.interestRate}%</td>
                              <td className="p-8 text-emerald-400 font-black">${dep.expectedProfit.toLocaleString()}</td>
                              <td className="p-8 text-slate-400 font-bold">{dep.endDate}</td>
                              <td className="p-8">
                                 {dep.status === 'active' ? (
                                   <button onClick={() => handleCancelDeposit(dep.id)} className="text-red-500 font-black hover:underline">إلغاء</button>
                                 ) : (
                                   <span className="text-slate-500 font-black">{dep.status === 'cancelled' ? 'ملغية' : 'مكتملة'}</span>
                                 )}
                              </td>
                           </tr>
                        ))}
                        {fixedDeposits.length === 0 && (
                          <tr><td colSpan={6} className="p-20 text-center text-slate-500 font-bold">لا توجد ودائع استثمارية حالياً في الشبكة</td></tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'salary' && (
             <div className="space-y-12">
                <div className="flex justify-between items-center">
                   <h2 className="text-6xl font-black tracking-tighter text-white">تمويل الرواتب</h2>
                   <button onClick={()=>setSalaryModal(true)} className="bg-sky-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-lg hover:bg-sky-500 transition-all">+ تمويل جديد</button>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-right">
                      <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <tr><th className="p-8">المستلم</th><th className="p-8">المبلغ</th><th className="p-8">الاستقطاع</th><th className="p-8">المدة</th><th className="p-8">التاريخ</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {salaryPlans.map(plan => (
                           <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-8 font-black text-white">@{plan.username}</td>
                              <td className="p-8 font-black text-emerald-400 text-xl">${plan.amount.toLocaleString()}</td>
                              <td className="p-8 text-red-400 font-bold">-${plan.deduction.toFixed(2)}</td>
                              <td className="p-8 font-bold text-slate-400">{plan.duration} شهر</td>
                              <td className="p-8 text-xs text-slate-500 font-bold">{plan.requestedAt}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-6xl space-y-12 pb-32 animate-in slide-in-from-bottom duration-500">
               <div className="flex justify-between items-end">
                  <h2 className="text-6xl font-black tracking-tighter text-white">إعدادات النظام</h2>
                  <button onClick={handleUpdateConfig} className="bg-sky-600 px-14 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">حفظ الإعدادات</button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Visual Settings Section (Enhanced with Multi-Upload) */}
                  <div className="bg-[#111827] p-10 border border-white/5 rounded-[3rem] space-y-8 shadow-xl lg:col-span-2">
                     <h3 className="text-3xl font-black text-sky-400 border-r-4 border-sky-500 pr-4">الهوية البصرية والوسائط (Visual Assets)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">شعار الشبكة الرسمي</label>
                           <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4">
                              <img src={tempConfig.logoUrl} className="h-20 bg-slate-900 p-4 rounded-3xl object-contain" alt="Logo Preview" />
                              <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 bg-sky-600/20 text-sky-400 rounded-xl font-black border border-sky-500/20 transition-all hover:bg-sky-600/30">تغيير الشعار</button>
                              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                           </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                           <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معرض الصور واللافتات (Banners & Gallery)</label>
                              <button onClick={() => galleryInputRef.current?.click()} className="px-6 py-2 bg-emerald-600/20 text-emerald-400 rounded-xl font-black border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">+ رفع صور جديدة</button>
                              <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" multiple />
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                              {tempConfig.galleryImages?.map((img, idx) => (
                                 <div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border border-white/10 shadow-lg">
                                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Asset ${idx}`} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button onClick={() => removeGalleryImage(idx)} className="bg-red-600 p-3 rounded-full hover:scale-110 transition-all" title="حذف">🗑️</button>
                                       <button onClick={() => {}} className="bg-sky-600 p-3 rounded-full hover:scale-110 transition-all" title="تعيين كلفتة">🏷️</button>
                                    </div>
                                 </div>
                              ))}
                              {(!tempConfig.galleryImages || tempConfig.galleryImages.length === 0) && (
                                 <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-slate-600 font-bold">لم يتم رفع أي وسائط بعد</div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Investment Plans Control */}
                  <div className="bg-[#111827] p-10 border border-white/5 rounded-[3rem] space-y-8 shadow-xl lg:col-span-2">
                     <h3 className="text-3xl font-black text-sky-400 border-r-4 border-sky-500 pr-4">التحكم في خطط الاستثمار (الودائع الثابتة)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {tempConfig.depositPlans.map(plan => (
                           <div key={plan.id} className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] space-y-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">اسم الخطة</label>
                                 <input value={plan.name} onChange={e=>handleUpdatePlan(plan.id, 'name', e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نسبة الربح %</label>
                                    <input type="number" value={plan.rate} onChange={e=>handleUpdatePlan(plan.id, 'rate', Number(e.target.value))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sky-400 font-black" />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">المدة (أشهر)</label>
                                    <input type="number" value={plan.durationMonths} onChange={e=>handleUpdatePlan(plan.id, 'durationMonths', Number(e.target.value))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white font-black" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الحد الأدنى للاستثمار ($)</label>
                                 <input type="number" value={plan.minAmount} onChange={e=>handleUpdatePlan(plan.id, 'minAmount', Number(e.target.value))} className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-black" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Footer Settings Section */}
                  <div className="bg-[#111827] p-10 border border-white/5 rounded-[3rem] space-y-8 shadow-xl lg:col-span-2">
                     <h3 className="text-3xl font-black text-sky-400 border-r-4 border-sky-500 pr-4">إعدادات التذييل (Footer)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">عنوان القائمة</label>
                           <input value={tempConfig.footerLinksTitle} onChange={e=>setTempConfig({...tempConfig, footerLinksTitle: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">رابط 1</label>
                           <input value={tempConfig.footerLink1Text} onChange={e=>setTempConfig({...tempConfig, footerLink1Text: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">رابط 2</label>
                           <input value={tempConfig.footerLink2Text} onChange={e=>setTempConfig({...tempConfig, footerLink2Text: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-bold" />
                        </div>
                     </div>
                  </div>

                  {/* Contact Info Section */}
                  <div className="bg-[#111827] p-10 border border-white/5 rounded-[3rem] space-y-8 shadow-xl lg:col-span-2">
                     <h3 className="text-3xl font-black text-emerald-400 border-r-4 border-emerald-500 pr-4">إعدادات التواصل</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">البريد الإلكتروني</label>
                           <input value={tempConfig.contactEmail} onChange={e=>setTempConfig({...tempConfig, contactEmail: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">رقم الهاتف</label>
                           <input value={tempConfig.contactPhone} onChange={e=>setTempConfig({...tempConfig, contactPhone: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-bold" dir="ltr" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'pages' && (
             <div className="space-y-12">
                <div className="flex justify-between items-center">
                   <h2 className="text-6xl font-black tracking-tighter text-white">إدارة الصفحات</h2>
                   <button onClick={()=>setPageModal({isOpen:true, page:null})} className="bg-sky-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-lg hover:bg-sky-500">+ إنشاء صفحة</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {pages.map(p => (
                      <div key={p.id} className="bg-[#111827] p-10 border border-white/5 rounded-[3rem] relative shadow-xl hover:border-sky-500/30 transition-all">
                         <h3 className="text-2xl font-black mb-2 text-white">{p.title}</h3>
                         <p className="text-sky-500 font-bold mb-8">/{p.slug}</p>
                         <div className="flex gap-4">
                            <button onClick={()=>setPageModal({isOpen:true, page:p})} className="flex-1 py-3 bg-white/5 rounded-xl font-black text-sky-400 hover:bg-white/10 transition-all">تعديل</button>
                            <button onClick={()=>{if(confirm('حذف الصفحة؟')) setPages(prev=>prev.filter(pg=>pg.id!==p.id))}} className="flex-1 py-3 bg-red-600/10 rounded-xl font-black text-red-500">حذف</button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'cards' && (
             <div className="space-y-10">
                <div className="flex justify-between items-center">
                   <h2 className="text-6xl font-black tracking-tighter text-white">البطاقات الرقمية</h2>
                   <div className="flex gap-4">
                      <input placeholder="بحث في الكود..." value={cardSearchQuery} onChange={e=>setCardSearchQuery(e.target.value)} className="p-5 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-sky-500 font-bold text-sm w-64" />
                      <button onClick={()=>setCardGenModal(true)} className="bg-amber-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-lg hover:bg-amber-500 transition-all">توليد بطاقات</button>
                   </div>
                </div>
                <div className="bg-[#111827] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                   <table className="w-full text-right">
                      <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <tr><th className="p-8">كود البطاقة</th><th className="p-8">القيمة</th><th className="p-8">الحالة</th><th className="p-8">المستخدم</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {filteredCards.map((c, idx) => (
                            <tr key={idx} className={`hover:bg-white/5 transition-colors ${c.isUsed ? 'opacity-40' : ''}`}>
                               <td className="p-8"><code className="bg-black/40 px-3 py-2 rounded text-sky-400 font-black border border-white/5 tracking-widest text-sm">{c.code}</code></td>
                               <td className="p-8 font-black text-xl text-white">${c.amount}</td>
                               <td className="p-8">
                                  <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${c.isUsed ? 'bg-slate-700' : 'bg-emerald-600 shadow-lg'}`}>
                                     {c.isUsed ? 'مستعملة' : 'نشطة'}
                                  </span>
                               </td>
                               <td className="p-8 font-black text-sky-500 text-sm">{c.isUsed ? `@${c.usedBy}` : '--'}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </div>

        {/* --- Modals Section --- */}
        {accountModal.isOpen && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
              <form onSubmit={handleSaveAccount} className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-[4rem] p-16 space-y-8 shadow-2xl animate-in zoom-in duration-300">
                 <h3 className="text-4xl font-black text-center text-white tracking-tighter">{accountModal.user ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد للشبكة'}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">الاسم الكامل</label>
                       <input name="fullName" required defaultValue={accountModal.user?.fullName || ''} placeholder="الاسم" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">اسم المستخدم</label>
                       <input name="username" required defaultValue={accountModal.user?.username || ''} placeholder="Username" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">كلمة المرور</label>
                       <input name="password" type="password" required defaultValue={accountModal.user?.password || ''} placeholder="••••••••" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">البريد الإلكتروني</label>
                       <input name="email" type="email" required defaultValue={accountModal.user?.email || ''} placeholder="email@fastpay.com" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">نوع الحساب</label>
                       <select name="role" defaultValue={accountModal.user?.role || 'USER'} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500">
                          <option value="USER">مستخدم عادي</option>
                          <option value="MERCHANT">تاجر معتمد</option>
                          <option value="DEVELOPER">مدير نظام</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">الرصيد ($)</label>
                       <input name="balance" type="number" step="0.01" defaultValue={accountModal.user?.balance || 0} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 outline-none focus:border-emerald-500" />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">حفظ البيانات</button>
                    <button type="button" onClick={()=>setAccountModal({isOpen:false, user:null})} className="flex-1 py-8 bg-white/5 text-white rounded-[2.5rem] font-black text-2xl border border-white/10">إلغاء</button>
                 </div>
              </form>
           </div>
        )}

        {/* Modal: Pages */}
        {pageModal.isOpen && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
              <form onSubmit={handleSavePage} className="bg-[#111827] border border-white/10 w-full max-w-5xl rounded-[4rem] p-16 space-y-10 shadow-2xl animate-in zoom-in duration-300">
                 <h3 className="text-4xl font-black text-center text-white tracking-tighter">إدارة الصفحة المخصصة</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-500 mr-2">عنوان الصفحة</label>
                          <input name="title" required defaultValue={pageModal.page?.title || ''} placeholder="مثال: من نحن" className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-xl text-white outline-none focus:border-sky-500" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-500 mr-2">الرابط (Slug)</label>
                          <input name="slug" required defaultValue={pageModal.page?.slug || ''} placeholder="about-us" className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-xl text-left text-white outline-none" dir="ltr" />
                       </div>
                       <div className="p-8 bg-white/5 rounded-[3rem] space-y-4 border border-white/5 shadow-inner">
                          <label className="flex items-center gap-4 text-lg font-bold cursor-pointer"><input type="checkbox" name="isActive" defaultChecked={pageModal.page?.isActive ?? true} className="w-6 h-6 rounded accent-sky-500" /> تفعيل الصفحة</label>
                          <label className="flex items-center gap-4 text-lg font-bold cursor-pointer"><input type="checkbox" name="showInNavbar" defaultChecked={pageModal.page?.showInNavbar ?? true} className="w-6 h-6 rounded accent-sky-500" /> عرض في القائمة العلوية</label>
                          <label className="flex items-center gap-4 text-lg font-bold cursor-pointer"><input type="checkbox" name="showInFooter" defaultChecked={pageModal.page?.showInFooter ?? true} className="w-6 h-6 rounded accent-sky-500" /> عرض في التذييل</label>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2">محتوى الصفحة (HTML)</label>
                       <textarea name="content" required defaultValue={pageModal.page?.content || ''} placeholder="HTML Content..." className="w-full h-[350px] p-6 bg-black/40 border border-white/10 rounded-[2.5rem] font-medium text-lg text-left text-white outline-none resize-none custom-scrollbar" dir="ltr" />
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button type="submit" className="flex-1 py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">حفظ الصفحة</button>
                    <button type="button" onClick={()=>setPageModal({isOpen:false, page:null})} className="flex-1 py-8 bg-white/5 text-white rounded-[2.5rem] font-black text-2xl border border-white/10">إلغاء</button>
                 </div>
              </form>
           </div>
        )}

        {/* Modal: Salary Financing */}
        {salaryModal && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
              <form onSubmit={handleAddSalaryPlan} className="bg-[#111827] border border-white/10 w-full max-w-3xl rounded-[4.5rem] p-16 space-y-8 shadow-2xl animate-in zoom-in duration-300">
                 <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white tracking-tighter">إيداع تمويل راتب تفصيلي</h3>
                    <p className="text-slate-500 font-bold">سيتم إيداع المبلغ المذكور فوراً في حساب المستخدم المذكور</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">اسم المستخدم المستفيد</label>
                       <input name="username" required placeholder="User_123" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">إجمالي مبلغ التمويل ($)</label>
                       <input name="amount" type="number" required placeholder="5000" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 text-2xl outline-none focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">قيمة الاستقطاع الشهري ($)</label>
                       <input name="deduction" type="number" required placeholder="450" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-red-400 outline-none focus:border-red-500" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 mr-2 uppercase">مدة السداد (بالأشهر)</label>
                       <input name="duration" type="number" required placeholder="12" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6 text-center">
                    <button type="submit" className="flex-1 py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 transition-all">إيداع واعتماد التمويل الآن</button>
                    <button type="button" onClick={()=>setSalaryModal(false)} className="flex-1 py-8 bg-white/5 text-white rounded-[2.5rem] font-black text-2xl border border-white/10">إلغاء</button>
                 </div>
              </form>
           </div>
        )}

        {/* Modal: Generate Cards */}
        {cardGenModal && (
           <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
              <form onSubmit={handleGenerateCards} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-10 shadow-2xl animate-in zoom-in duration-300">
                 <h3 className="text-4xl font-black text-center text-white tracking-tighter">توليد بطاقات رصيد</h3>
                 <div className="space-y-8 text-center">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">قيمة البطاقة الواحدة ($)</label>
                       <input type="number" value={genAmount} onChange={e=>setGenAmount(Number(e.target.value))} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl text-center text-5xl font-black text-emerald-400 outline-none focus:border-emerald-500 shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الكمية المراد توليدها</label>
                       <input type="number" value={genCount} onChange={e=>setGenCount(Number(e.target.value))} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl text-center text-5xl font-black text-white outline-none focus:border-sky-500 shadow-inner" />
                    </div>
                    <div className="flex gap-4 pt-6">
                       <button type="submit" className="flex-1 py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">توليد البطاقات الآن</button>
                       <button type="button" onClick={()=>setCardGenModal(false)} className="flex-1 py-8 bg-white/5 text-white rounded-[2.5rem] font-black text-2xl border border-white/10">إلغاء</button>
                    </div>
                 </div>
              </form>
           </div>
        )}
      </main>
    </div>
  );
};

export default DeveloperDashboard;
