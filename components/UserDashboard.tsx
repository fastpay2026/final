
import React, { useState, useEffect, useMemo } from 'react';
import { User, SiteConfig, RechargeCard, Transaction, Notification, BankCard, FixedDeposit, DepositPlan } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  onUpdateUser: (updatedUser: User) => void;
  fixedDeposits: FixedDeposit[];
  setFixedDeposits: React.Dispatch<React.SetStateAction<FixedDeposit[]>>;
}

const UserDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, addNotification, onUpdateUser, fixedDeposits, setFixedDeposits
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investment' | 'profile'>('dashboard');
  const [modalType, setModalType] = useState<'send' | 'coupon' | 'bank_card' | 'new_deposit' | 'sending_progress' | 'investment_progress' | 'linking_progress' | 'recharging_progress' | null>(null);
  
  // Progress States
  const [sendProgress, setSendProgress] = useState(0);
  const [investProgress, setInvestProgress] = useState(0);
  const [linkProgress, setLinkProgress] = useState(0);
  const [rechargeProgress, setRechargeProgress] = useState(0);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [linkStatusText, setLinkStatusText] = useState('بدء عملية التحقق...');
  const [investStatusText, setInvestStatusText] = useState('بدء تهيئة المحفظة الاستثمارية...');

  // Form States
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPlan, setDepositPlan] = useState<DepositPlan | null>(null);
  const [tempBankCard, setTempBankCard] = useState<Partial<BankCard>>({});

  // Auth States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const myDeposits = useMemo(() => fixedDeposits.filter(d => d.userId === user.id), [fixedDeposits, user.id]);

  // --- Helper Validation Functions ---

  const validateCardNumber = (number: string) => {
    const sanitized = number.replace(/\s+/g, '');
    if (!/^\d+$/.test(sanitized) || sanitized.length < 13) return { valid: false, type: 'unknown' as const };
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i));
      if (shouldDouble) { if ((digit *= 2) > 9) digit -= 9; }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    const isLuhnValid = sum % 10 === 0;
    let type: 'visa' | 'mastercard' | 'unknown' = 'unknown';
    if (/^4/.test(sanitized)) type = 'visa';
    else if (/^5[1-5]/.test(sanitized) || /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(sanitized)) type = 'mastercard';
    return { valid: isLuhnValid, type };
  };

  const isExpiryValid = (expiry: string) => {
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;
    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  };

  // --- Process Handlers ---

  const handleStartLinkCard = (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, type } = validateCardNumber(tempBankCard.number || '');
    if (!valid || type === 'unknown') return alert('عذراً، رقم البطاقة غير صحيح أو عشوائي.');
    if (!isExpiryValid(tempBankCard.expiry || '')) return alert('عذراً، هذه البطاقة منتهية الصلاحية.');

    setModalType('linking_progress');
    setLinkProgress(0);
    setIsSuccessVisible(false);
    setLinkStatusText('اتصال بنظام Google Card Validator...');

    const timer = setInterval(() => {
      setLinkProgress(prev => {
        const next = prev + 1.25; 
        if (next > 20 && next < 40) setLinkStatusText('تحليل سجلات DNS وفحص المصدر...');
        if (next > 40 && next < 60) setLinkStatusText(`التحقق من نوع البطاقة: ${type.toUpperCase()}`);
        if (next > 80) setLinkStatusText('تأمين بيانات البطاقة...');
        if (next >= 100) { clearInterval(timer); finalizeLinking(type); return 100; }
        return next;
      });
    }, 100);
  };

  const finalizeLinking = (type: 'visa' | 'mastercard' | 'unknown') => {
    const newCard: BankCard = { id: Math.random().toString(36).substr(2, 9), number: tempBankCard.number!, holder: tempBankCard.holder!, expiry: tempBankCard.expiry!, cvc: '***', type: type as any };
    onUpdateUser({ ...user, linkedCards: [...(user.linkedCards || []), newCard] });
    setIsSuccessVisible(true);
    addNotification('البطاقات', 'تم ربط بطاقتك بنجاح.', 'security');
    setTimeout(() => { setModalType(null); setTempBankCard({}); setIsSuccessVisible(false); }, 3000);
  };

  const handleStartRecharge = () => {
    const codeToFind = couponCode.trim().toUpperCase();
    const cardIndex = rechargeCards.findIndex(c => c.code.toUpperCase() === codeToFind);
    if (cardIndex === -1 || rechargeCards[cardIndex].isUsed) return alert('كود خاطئ أو مستخدم مسبقاً.');

    setModalType('recharging_progress');
    setRechargeProgress(0);
    setIsSuccessVisible(false);
    const timer = setInterval(() => {
      setRechargeProgress(prev => {
        if (prev >= 100) { clearInterval(timer); finalizeRecharge(rechargeCards[cardIndex], cardIndex); return 100; }
        return prev + 1.5;
      });
    }, 100);
  };

  const finalizeRecharge = (card: RechargeCard, cardIndex: number) => {
    const now = new Date().toLocaleString('ar-SA');
    const updatedCards = [...rechargeCards];
    updatedCards[cardIndex] = { ...card, isUsed: true, usedBy: user.username, usedAt: now };
    setRechargeCards(updatedCards);
    setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: acc.balance + card.amount } : acc));
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'redeem', amount: card.amount, relatedUser: `شحن بطاقة رصيد`, timestamp: now }, ...prev]);
    setIsSuccessVisible(true);
    addNotification('شحن رصيد', `تم شحن $${card.amount} بنجاح.`, 'money');
    setTimeout(() => { setModalType(null); setCouponCode(''); setIsSuccessVisible(false); }, 3000);
  };

  const handleStartInvestmentProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (!depositPlan || isNaN(val) || val < depositPlan.minAmount || val > user.balance) return alert('تحقق من الخطة والرصيد المتاح.');
    
    setModalType('investment_progress');
    setInvestProgress(0);
    setIsSuccessVisible(false);
    setInvestStatusText('جاري الإيداع... تهيئة الاتصال المشفر');

    const totalTime = 60000; // 60 Seconds
    const interval = 100;
    const increment = (interval / totalTime) * 100;

    const timer = setInterval(() => {
      setInvestProgress(prev => {
        const next = prev + increment;
        
        if (next > 10 && next < 25) setInvestStatusText('تشفير بيانات الحوالة باستخدام AES-256...');
        if (next > 25 && next < 45) setInvestStatusText('مزامنة مع خادم الأصول الرقمية السحابي...');
        if (next > 45 && next < 65) setInvestStatusText('التحقق من سيولة الشبكة وضمان الأرباح...');
        if (next > 65 && next < 85) setInvestStatusText('تأمين البروتوكول المالي وإصدار العقد الذكي...');
        if (next > 85) setInvestStatusText('اللمسات النهائية... تخصيص الوديعة لمحفظتك');

        if (next >= 100) {
          clearInterval(timer);
          finalizeInvestment(val, depositPlan);
          return 100;
        }
        return next;
      });
    }, interval);
  };

  const finalizeInvestment = (val: number, plan: DepositPlan) => {
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    const newDep: FixedDeposit = { 
      id: Math.random().toString(36).substr(2, 9), 
      userId: user.id, 
      username: user.username, 
      amount: val, 
      interestRate: plan.rate, 
      durationMonths: plan.durationMonths, 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0], 
      expectedProfit: (val * (plan.rate / 100)), 
      status: 'active' 
    };
    setFixedDeposits(prev => [...prev, newDep]);
    setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: acc.balance - val } : acc));
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'fixed_deposit', amount: val, relatedUser: `بدء وديعة ${plan.name}`, timestamp: new Date().toLocaleString('ar-SA') }, ...prev]);
    setIsSuccessVisible(true);
    addNotification('الاستثمار', 'تم بدء الوديعة بنجاح.', 'money');
    setTimeout(() => { setModalType(null); setDepositAmount(''); setDepositPlan(null); setIsSuccessVisible(false); }, 3000);
  };

  const handleStartSendProcess = () => {
    const value = parseFloat(amount);
    const target = accounts.find(acc => acc.username === recipient && acc.id !== user.id);
    if (!target || isNaN(value) || value <= 0 || value > user.balance) return alert('تحقق من صحة البيانات والرصيد.');
    setModalType('sending_progress');
    setSendProgress(0);
    setIsSuccessVisible(false);
    const timer = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) { clearInterval(timer); executeFinalTransfer(target!, value); return 100; }
        return prev + 2.5;
      });
    }, 100);
  };

  const executeFinalTransfer = (target: User, value: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === user.id) return { ...acc, balance: acc.balance - value };
      if (acc.id === target.id) return { ...acc, balance: acc.balance + value };
      return acc;
    }));
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'send', amount: value, relatedUser: `تحويل إلى @${target.username}`, timestamp: new Date().toLocaleString('ar-SA') }, ...prev]);
    setIsSuccessVisible(true);
    addNotification('حوالة', `تم تحويل $${value} بنجاح.`, 'money');
    setTimeout(() => { setModalType(null); setAmount(''); setRecipient(''); setIsSuccessVisible(false); }, 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== user.password) return setPasswordError('كلمة المرور الحالية خاطئة');
    if (newPassword !== confirmPassword) return setPasswordError('كلمتا المرور غير متطابقتين');
    onUpdateUser({ ...user, password: newPassword });
    addNotification('الأمان', 'تم تحديث كلمة المرور بنجاح.', 'security');
    setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError('');
    alert('تم تحديث كلمة المرور بنجاح');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#0a0f1e] text-right text-white font-sans overflow-hidden flex flex-col" dir="rtl">
       <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>
       
       <header className="h-24 bg-[#111827]/90 backdrop-blur-2xl border-b border-white/5 px-6 md:px-12 flex justify-between items-center z-10">
          <div className="flex items-center gap-4 lg:gap-12">
             <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="bg-white/90 p-2 rounded-xl shadow-lg transition-transform group-hover:scale-105">
                  <img src={siteConfig.logoUrl} className="h-10 object-contain" alt="Logo" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white hidden sm:inline">محفظتي الرقمية</span>
             </div>
             <nav className="flex items-center gap-6">
                <button onClick={() => setActiveTab('dashboard')} className={`font-black text-lg pb-1 border-b-2 transition-all ${activeTab === 'dashboard' ? 'text-sky-400 border-sky-400' : 'text-slate-400 border-transparent hover:text-white'}`}>الرئيسية</button>
                <button onClick={() => setActiveTab('investment')} className={`font-black text-lg pb-1 border-b-2 transition-all ${activeTab === 'investment' ? 'text-sky-400 border-sky-400' : 'text-slate-400 border-transparent hover:text-white'}`}>الاستثمار</button>
                <button onClick={() => setActiveTab('profile')} className={`font-black text-lg pb-1 border-b-2 transition-all ${activeTab === 'profile' ? 'text-sky-400 border-sky-400' : 'text-slate-400 border-transparent hover:text-white'}`}>الحساب</button>
             </nav>
          </div>
          <button onClick={onLogout} className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-black hover:bg-red-500 hover:text-white transition-all shadow-lg">تسجيل الخروج</button>
       </header>

       <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-12 space-y-12 overflow-y-auto custom-scrollbar z-10 pb-32">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] border border-white/10 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                 <p className="text-sky-400 font-black text-xs uppercase tracking-widest mb-4 opacity-80">الرصيد الكلي المتاح</p>
                 <h2 className="text-7xl md:text-9xl font-black tracking-tighter mb-12 animate-in slide-in-from-right duration-700">${user.balance.toLocaleString()}</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <button onClick={()=>setModalType('send')} className="py-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">إرسال 📤</button>
                    <button onClick={()=>setModalType('coupon')} className="py-6 bg-emerald-600/90 text-white rounded-[2rem] font-black text-xl shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">اشحن بواسطة بطاقة</button>
                    <button onClick={()=>setModalType('bank_card')} className="py-6 bg-sky-600/90 text-white rounded-[2rem] font-black text-xl shadow-lg hover:bg-sky-600 transition-all flex items-center justify-center gap-3">ربط 💳</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <h3 className="text-3xl font-black flex items-center gap-4 text-slate-200"><span>💳</span> بطاقاتي البنكية</h3>
                    <div className="space-y-6">
                       {user.linkedCards?.map(card => (
                          <div key={card.id} className="aspect-[1.58/1] bg-gradient-to-br from-[#1e293b] to-[#020617] rounded-[2.5rem] border border-white/10 p-10 relative overflow-hidden group">
                             <div className="flex justify-between items-start">
                                <span className={`text-2xl font-black uppercase italic ${card.type === 'visa' ? 'text-sky-400' : 'text-amber-500'}`}>{card.type}</span>
                                <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-amber-400/30"></div>
                             </div>
                             <p className="text-3xl md:text-4xl font-black text-white tracking-[0.2em] text-center my-8">•••• •••• •••• {card.number.slice(-4)}</p>
                             <div className="flex justify-between items-end mt-auto">
                                <div><p className="text-[10px] font-black text-slate-500 uppercase">Card Holder</p><p className="text-xl font-black text-white">{card.holder}</p></div>
                                <div className="text-sm font-black text-white/70">{card.expiry}</div>
                             </div>
                          </div>
                       ))}
                       {(!user.linkedCards || user.linkedCards.length === 0) && (
                         <div onClick={()=>setModalType('bank_card')} className="aspect-[1.58/1] border-4 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/5 transition-all text-slate-700">
                            <span className="text-7xl">➕</span><p className="font-black text-xl text-center px-6">ربط بطاقة فيزا أو ماستركارد</p>
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="space-y-8">
                    <h3 className="text-3xl font-black flex items-center gap-4 text-slate-200"><span>📑</span> آخر العمليات</h3>
                    <div className="space-y-4">
                       {transactions.filter(t=>t.userId===user.id).slice(0, 5).map((t)=>(
                          <div key={t.id} className="p-8 bg-[#111827]/80 border border-white/5 rounded-[2.5rem] flex justify-between items-center shadow-lg">
                             <div className="space-y-1">
                                <p className="font-black text-lg text-white">{t.relatedUser}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{t.timestamp}</p>
                             </div>
                             <p className={`text-2xl font-black ${t.type==='send' || t.type==='fixed_deposit' ? 'text-red-400' : 'text-emerald-500'}`}>
                                {t.type==='send' || t.type==='fixed_deposit' ?'-':'+'}${t.amount.toLocaleString()}
                             </p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'investment' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <h2 className="text-6xl font-black tracking-tighter">مركز الاستثمار</h2>
                  <button onClick={() => setModalType('new_deposit')} className="px-12 py-5 bg-sky-600 rounded-[2rem] font-black text-xl shadow-xl hover:bg-sky-500 transition-all">بدء وديعة جديدة +</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {myDeposits.map(dep => (
                    <div key={dep.id} className="bg-[#111827] border border-white/5 rounded-[3rem] p-10 space-y-6 shadow-xl relative overflow-hidden group">
                       <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-sky-400 uppercase tracking-widest">وديعة نشطة</p>
                          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black">ACTIVE</span>
                       </div>
                       <h4 className="text-5xl font-black">${dep.amount.toLocaleString()}</h4>
                       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                          <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase">الربح المتوقع</p>
                             <p className="text-2xl font-black text-emerald-400">${dep.expectedProfit.toLocaleString()}</p>
                          </div>
                          <div className="text-left">
                             <p className="text-[10px] font-black text-slate-500 uppercase">تاريخ الاستحقاق</p>
                             <p className="text-lg font-bold text-white">{dep.endDate}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  {myDeposits.length === 0 && (
                    <div className="col-span-full py-32 text-center border-4 border-dashed border-white/5 rounded-[4rem]">
                       <p className="text-2xl font-black text-slate-600">لا توجد ودائع استثمارية نشطة حالياً</p>
                       <button onClick={() => setModalType('new_deposit')} className="mt-8 text-sky-500 font-black hover:underline">ابدأ استثمارك الأول الآن</button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'profile' && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
                <div className="bg-[#111827] border border-white/10 rounded-[4rem] p-16 shadow-2xl space-y-12">
                   <div className="flex items-center gap-8 border-b border-white/5 pb-10">
                      <div className="w-24 h-24 bg-sky-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl">👤</div>
                      <div>
                         <h3 className="text-4xl font-black">{user.fullName}</h3>
                         <p className="text-sky-500 font-bold">@{user.username} | {user.email}</p>
                      </div>
                   </div>
                   
                   <form onSubmit={handlePasswordChange} className="space-y-8">
                      <h4 className="text-2xl font-black text-slate-400">تحديث كلمة المرور</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-4">كلمة المرور الحالية</label>
                            <input type="password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-sky-500" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-4">كلمة المرور الجديدة</label>
                            <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-sky-500" />
                         </div>
                         <div className="space-y-3 md:col-span-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-4">تأكيد كلمة المرور</label>
                            <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-sky-500" />
                         </div>
                      </div>
                      {passwordError && <p className="text-red-500 font-black text-center">{passwordError}</p>}
                      <button type="submit" className="w-full py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">تحديث الأمان</button>
                   </form>
                </div>
             </div>
          )}
       </main>

       {/* --- Progress Modals --- */}

       {/* Investment Progress Modal (60 Seconds with Dynamic Phrases) */}
       {modalType === 'investment_progress' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
             <div className="relative w-full max-w-2xl bg-[#111827] border border-white/10 rounded-[4rem] p-16 text-center space-y-12 animate-in zoom-in">
                {!isSuccessVisible ? (
                  <>
                    <div className="space-y-4">
                       <h3 className="text-4xl font-black text-white">جاري الإيداع الاستثماري...</h3>
                       <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs">High-Speed Digital Asset Handshake</p>
                    </div>
                    
                    <div className="p-10 bg-black/40 rounded-[3rem] border border-white/5 space-y-6">
                       <p className="text-slate-300 font-black text-xl animate-pulse min-h-[1.75em]">{investStatusText}</p>
                       <div className="relative h-24 w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-inner p-1">
                          <div 
                            className="h-full bg-gradient-to-l from-emerald-500 via-sky-500 to-indigo-600 transition-all duration-300 ease-linear rounded-2xl relative shadow-[0_0_40px_rgba(16,185,129,0.4)]" 
                            style={{ width: `${investProgress}%` }}
                          >
                             <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center font-black text-3xl mix-blend-difference text-white">
                            %{Math.round(investProgress)}
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-center gap-6 text-[10px] font-black text-slate-600 uppercase">
                       <div className={investProgress > 20 ? 'text-sky-400 transition-colors' : ''}>[ ENCRYPTION ]</div>
                       <div className={investProgress > 50 ? 'text-sky-400 transition-colors' : ''}>[ BLOCKCHAIN SYNC ]</div>
                       <div className={investProgress > 80 ? 'text-sky-400 transition-colors' : ''}>[ ASSET ALLOCATION ]</div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-10 animate-in bounce-in">
                     <div className="w-40 h-40 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-8xl shadow-[0_0_80px_rgba(16,185,129,0.6)] animate-bounce">✓</div>
                     <div className="space-y-2">
                        <h2 className="text-7xl font-black text-white tracking-tighter">تمت العملية بنجاح</h2>
                        <p className="text-emerald-400 font-black text-xl">لقد بدأ نمو استثمارك الآن في الشبكة العالمية</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
       )}

       {/* Link Card Modal (Fixed CVC Style) */}
       {modalType === 'bank_card' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={()=>setModalType(null)}></div>
             <form onSubmit={handleStartLinkCard} className="relative bg-[#111827] border border-white/10 w-full max-w-md rounded-[3.5rem] p-12 space-y-10 animate-in zoom-in shadow-2xl">
                <div className="text-center space-y-2">
                   <h3 className="text-4xl font-black text-white tracking-tighter leading-none">ربط بطاقة فيزا/ماستر</h3>
                   <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest pt-2">تأمين بنكي بمستوى PCI-DSS</p>
                </div>
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">اسم حامل البطاقة</label>
                      <input placeholder="HOLDER NAME" required value={tempBankCard.holder || ''} onChange={e=>setTempBankCard({...tempBankCard, holder: e.target.value.toUpperCase()})} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all focus:bg-white/5" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">رقم البطاقة (16 رقم)</label>
                      <input placeholder="0000 0000 0000 0000" required value={tempBankCard.number || ''} onChange={e=>setTempBankCard({...tempBankCard, number: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white text-center tracking-[0.2em] outline-none focus:border-sky-500 transition-all focus:bg-white/5" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">تاريخ الانتهاء</label>
                         <input placeholder="MM/YY" required value={tempBankCard.expiry || ''} onChange={e=>setTempBankCard({...tempBankCard, expiry: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white text-center outline-none focus:border-sky-500 transition-all focus:bg-white/5" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">رمز CVC الآمن</label>
                         <input placeholder="***" type="password" maxLength={4} required className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white text-center outline-none focus:border-sky-500 transition-all focus:bg-white/5 shadow-inner" />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:bg-sky-500 transition-all active:scale-95 transform">بدء الفحص والربط البنكي</button>
                </div>
             </form>
          </div>
       )}

       {/* New Deposit Input Modal */}
       {modalType === 'new_deposit' && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={()=>setModalType(null)}></div>
             <form onSubmit={handleStartInvestmentProcess} className="relative bg-[#111827] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 md:p-16 space-y-12 shadow-2xl animate-in zoom-in">
                <h3 className="text-4xl font-black text-center text-white tracking-tighter">فتح وديعة استثمارية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {siteConfig.depositPlans.map((plan) => (
                      <button key={plan.id} type="button" onClick={() => setDepositPlan(plan)} className={`p-6 rounded-[2rem] border-2 transition-all ${depositPlan?.id === plan.id ? 'bg-sky-600 border-sky-400 shadow-xl' : 'bg-white/5 border-white/5'}`}>
                         <p className="text-xs font-black uppercase">{plan.name}</p>
                         <p className="text-4xl font-black">{plan.rate}%</p>
                         <p className="text-[10px] font-bold">لمدة {plan.durationMonths} أشهر</p>
                      </button>
                   ))}
                </div>
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">مبلغ الاستثمار ($)</label>
                   <input type="number" placeholder={depositPlan ? `${depositPlan.minAmount}.00` : "100.00"} value={depositAmount} onChange={e=>setDepositAmount(e.target.value)} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-6xl text-emerald-400 outline-none focus:border-emerald-500 transition-all" />
                </div>
                <button type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-xl active:scale-95">بدء الاستثمار الآن</button>
             </form>
          </div>
       )}

       {/* Other Progress Modals (Recharging, Sending, etc.) */}
       {(modalType === 'recharging_progress' || modalType === 'sending_progress' || modalType === 'linking_progress') && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
             <div className="relative w-full max-w-2xl bg-[#111827] border border-white/10 rounded-[4rem] p-16 text-center space-y-12 animate-in zoom-in">
                {!isSuccessVisible ? (
                  <>
                    <h3 className="text-4xl font-black text-white">
                      {modalType === 'recharging_progress' ? 'جاري التحقق من كود الشحن...' : 
                       modalType === 'sending_progress' ? 'جاري معالجة الحوالة...' : 
                       linkStatusText}
                    </h3>
                    <div className="relative h-20 w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-inner">
                       <div className={`absolute inset-y-0 right-0 transition-all duration-300 ${modalType === 'recharging_progress' ? 'bg-emerald-600' : 'bg-sky-600'}`} style={{ width: `${modalType === 'recharging_progress' ? rechargeProgress : modalType === 'sending_progress' ? sendProgress : linkProgress}%` }}></div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-10 animate-in bounce-in">
                     <div className="w-32 h-32 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-6xl shadow-[0_0_60px_rgba(16,185,129,0.5)] animate-bounce">✓</div>
                     <h2 className="text-6xl font-black text-white">تمت العملية بنجاح</h2>
                  </div>
                )}
             </div>
          </div>
       )}

       {/* Input Modals (Send, Coupon) */}
       {modalType === 'coupon' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={()=>setModalType(null)}></div>
             <div className="relative bg-[#111827] border border-white/10 w-full max-w-md rounded-[3.5rem] p-16 space-y-10 animate-in zoom-in shadow-2xl">
                <h3 className="text-4xl font-black text-center text-white leading-tight">اشحن بواسطة بطاقة رقمية</h3>
                <div className="space-y-8 text-center">
                   <p className="text-slate-500 font-bold">أدخل كود البطاقة المكون من 12 رمزاً للمتابعة</p>
                   <input placeholder="FP-XXXX-XXXX" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} className="w-full p-8 bg-black/40 border border-emerald-500/30 rounded-3xl font-black text-center text-4xl text-emerald-400 tracking-widest outline-none focus:border-emerald-500" />
                   <button onClick={handleStartRecharge} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 transition-all active:scale-95">تفعيل الشحن الفوري</button>
                </div>
             </div>
          </div>
       )}

       {modalType === 'send' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={()=>setModalType(null)}></div>
             <div className="relative bg-[#111827] border border-white/10 w-full max-w-md rounded-[3.5rem] p-16 space-y-10 animate-in zoom-in shadow-2xl">
                <h3 className="text-4xl font-black text-center text-white">إرسال رصيد</h3>
                <div className="space-y-6">
                   <input placeholder="اسم المستخدم" value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-center text-xl text-white outline-none focus:border-sky-500" />
                   <input placeholder="$0.00" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-center text-5xl text-sky-400 outline-none focus:border-sky-500" />
                   <button onClick={handleStartSendProcess} className="w-full py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-xl active:scale-95">إرسال فوري</button>
                </div>
             </div>
          </div>
       )}

    </div>
  );
};

export default UserDashboard;
