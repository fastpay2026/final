
import React, { useState, useEffect } from 'react';
import { User, SiteConfig, RechargeCard, Transaction, Notification } from '../types';

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
}

const MerchantDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, addNotification, onUpdateUser
}) => {
  const [activeView, setActiveView] = useState<'main' | 'settings' | 'gateway'>('main');
  const [modalType, setModalType] = useState<'send' | 'cards' | null>(null);
  const [cardAmount, setCardAmount] = useState<number>(100);
  const [cardQuantity, setCardQuantity] = useState<number>(5);
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  // API Gateway States
  const [merchantKey, setMerchantKey] = useState(`pk_live_${Math.random().toString(36).substr(2, 16)}`);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const currencies = [
    { pair: 'USD/EUR', rate: '0.92', trend: '+0.02%', color: 'text-emerald-400' },
    { pair: 'USD/SAR', rate: '3.75', trend: '0.00%', color: 'text-sky-400' },
    { pair: 'USD/TRY', rate: '31.20', trend: '+0.15%', color: 'text-red-400' },
    { pair: 'USD/AED', rate: '3.67', trend: '0.00%', color: 'text-sky-400' },
    { pair: 'BTC/USD', rate: '64,250', trend: '+2.4%', color: 'text-amber-400' }
  ];

  const handleGenerateCards = () => {
    const totalCost = cardAmount * cardQuantity;
    if (totalCost > user.balance) return alert('الرصيد غير كافٍ في محفظة التاجر');
    
    const newCards: RechargeCard[] = [];
    const now = new Date();
    const ts = now.toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    for (let i = 0; i < cardQuantity; i++) {
      newCards.push({
        code: `FP-M-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        amount: cardAmount, 
        isUsed: false, 
        generatedBy: user.id, 
        createdAt: ts
      });
    }

    setRechargeCards(prev => [...newCards, ...prev]);
    setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: acc.balance - totalCost } : acc));
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'generate_card', amount: totalCost, timestamp: ts }, ...prev]);
    
    addNotification('توليد بطاقات', `قام التاجر ${user.fullName} بتوليد ${cardQuantity} بطاقة بقيمة إجمالية $${totalCost}.`, 'money');
    setModalType(null);
  };

  const handleSend = () => {
    const value = parseFloat(sendAmount);
    const target = accounts.find(acc => acc.username === recipient && acc.id !== user.id);
    if (!target || value > user.balance || isNaN(value)) return alert('خطأ في البيانات أو الرصيد');

    const now = new Date();
    const ts = now.toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    setAccounts(prev => prev.map(acc => {
      if (acc.id === user.id) return { ...acc, balance: acc.balance - value };
      if (acc.id === target.id) return { ...acc, balance: acc.balance + value };
      return acc;
    }));

    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'send', amount: value, relatedUser: target.fullName, timestamp: ts }, ...prev]);
    addNotification('حوالة تجارية', `تم تحويل $${value} من ${user.fullName} إلى ${target.fullName}.`, 'money');
    setModalType(null);
    setSendAmount('');
    setRecipient('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (oldPassword !== user.password) {
      setPasswordError('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    onUpdateUser({ ...user, password: newPassword });
    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addNotification('أمن الحساب', 'تم تحديث كلمة المرور للتاجر بنجاح.', 'security');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const myGeneratedCards = rechargeCards.filter(c => c.generatedBy === user.id);

  const integrationCodeSnippet = `
<!-- FastPay Payment Gateway Integration -->
<script src="https://api.fastpay-network.com/sdk/v1/checkout.js"></script>
<div id="fastpay-button-container"></div>

<script>
  FastPay.Button.render({
    merchantId: "${merchantKey}",
    amount: "49.99",
    currency: "USD",
    onSuccess: function(data) {
      console.log("Payment Successful:", data.card_code);
      // Process order in your backend here
    },
    onCancel: function() {
       alert("Payment was cancelled");
    }
  }, "#fastpay-button-container");
</script>
  `.trim();

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#020617] text-white text-right font-sans" dir="rtl">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>

      {/* Currency Ticker Bar */}
      <div className="h-12 bg-black/40 backdrop-blur-md border-b border-white/5 overflow-hidden flex items-center z-20">
         <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
            {Array(3).fill(currencies).flat().map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-500 uppercase">{c.pair}</span>
                 <span className="text-sm font-black text-white">{c.rate}</span>
                 <span className={`text-[10px] font-bold ${c.color}`}>{c.trend}</span>
              </div>
            ))}
         </div>
      </div>

      <header className="h-24 bg-[#0f172a]/50 backdrop-blur-2xl border-b border-white/5 px-6 md:px-12 flex justify-between items-center z-10">
         <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer" onClick={() => setActiveView('main')}>
               <img src={siteConfig.logoUrl} className="h-10" alt="Logo" />
            </div>
            <div>
               <p className="text-xl font-black tracking-tighter">بوابة التاجر الاحترافية</p>
               <nav className="flex gap-4 mt-1">
                 <button onClick={()=>setActiveView('main')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeView==='main' ? 'text-sky-400' : 'text-slate-500 hover:text-white'}`}>الرئيسية</button>
                 <button onClick={()=>setActiveView('gateway')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeView==='gateway' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}>بوابة الربط (API)</button>
                 <button onClick={()=>setActiveView('settings')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeView==='settings' ? 'text-sky-400' : 'text-slate-500 hover:text-white'}`}>الإعدادات</button>
               </nav>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <div className="text-left hidden md:block">
               <p className="font-black text-white leading-none">{user.fullName}</p>
               <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Verified Merchant Account</span>
            </div>
            <button onClick={onLogout} className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">خروج آمن</button>
         </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar z-10 relative space-y-12 pb-32">
         {activeView === 'main' && (
           <>
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b] border border-sky-500/20 rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10">
                       <p className="text-sky-400 font-black text-sm uppercase tracking-widest mb-4">السيولة التجارية المتاحة</p>
                       <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-16">${user.balance.toLocaleString()}</h2>
                       <div className="flex flex-wrap gap-6">
                          <button onClick={() => setModalType('cards')} className="flex-1 py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/40 hover:scale-[1.03] hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95">
                             <span>توليد بطاقات</span>
                             <span className="text-3xl">🎫</span>
                          </button>
                          <button onClick={() => setModalType('send')} className="flex-1 py-7 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-2xl backdrop-blur-xl hover:bg-white/10 hover:scale-[1.03] transition-all flex items-center justify-center gap-4 active:scale-95">
                             <span>تحويل رصيد</span>
                             <span className="text-3xl">📤</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {[
                       { l: 'إجمالي البطاقات المولدة', v: myGeneratedCards.length, i: '👤', c: 'text-white' },
                       { l: 'بطاقات قيد الانتظار', v: myGeneratedCards.filter(c=>!c.isUsed).length, i: '🎫', c: 'text-amber-500' },
                       { l: 'مبيعات مكتملة', v: myGeneratedCards.filter(c=>c.isUsed).length, i: '✅', c: 'text-emerald-500' }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-10 bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-xl hover:border-white/20 transition-all">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{stat.l}</p>
                         <p className={`text-4xl font-black ${stat.c}`}>{stat.v}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="max-w-7xl mx-auto space-y-8">
                 <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4">
                    <span>📊</span> سجل مبيعات البطاقات
                 </h3>
                 <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right min-w-[800px]">
                         <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            <tr>
                               <th className="p-10">كود البطاقة الرقمي</th>
                               <th className="p-10">القيمة</th>
                               <th className="p-10">الحالة</th>
                               <th className="p-10">المستفيد</th>
                               <th className="p-10">التوقيت</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5 font-bold">
                            {myGeneratedCards.length > 0 ? (
                              myGeneratedCards.slice().reverse().map((c, i) => (
                                 <tr key={i} className="group hover:bg-white/5 transition-all">
                                    <td className="p-10">
                                       <code className="bg-black/60 px-6 py-3 rounded-xl text-sky-400 font-black tracking-[0.2em] text-sm border border-white/5 shadow-inner">{c.code}</code>
                                    </td>
                                    <td className="p-10 text-2xl font-black text-white">${c.amount}</td>
                                    <td className="p-10">
                                       <span className={`px-5 py-2 rounded-full text-[10px] font-black ${c.isUsed ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                          {c.isUsed ? 'مُستخدمة' : 'نشطة'}
                                       </span>
                                    </td>
                                    <td className="p-10 text-slate-400">
                                       {c.isUsed ? `@${c.usedBy}` : '—'}
                                    </td>
                                    <td className="p-10 text-xs text-slate-500">
                                       {c.createdAt}
                                    </td>
                                 </tr>
                              ))
                            ) : (
                              <tr><td colSpan={5} className="p-32 text-center text-slate-600 font-black text-2xl">لا يوجد مبيعات حتى الآن</td></tr>
                            )}
                         </tbody>
                      </table>
                    </div>
                 </div>
              </div>
           </>
         )}

         {activeView === 'gateway' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-black tracking-tighter">بوابة الربط البرمجي (API)</h2>
                    <p className="text-slate-500 font-bold text-lg">قم بدمج FastPay كخيار دفع في موقعك أو متجرك الإلكتروني</p>
                  </div>
                  <button onClick={() => setMerchantKey(`pk_live_${Math.random().toString(36).substr(2, 16)}`)} className="px-8 py-4 bg-emerald-600 rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all shadow-xl">تجديد مفاتيح الربط</button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                     {/* Merchant Keys Section */}
                     <div className="bg-[#111827] p-10 border border-white/5 rounded-[3.5rem] shadow-2xl space-y-8">
                        <h3 className="text-2xl font-black text-sky-400 border-r-4 border-sky-500 pr-4">مفاتيح التاجر (Merchant Credentials)</h3>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">المفتاح العام (Merchant Public Key)</label>
                              <div className="flex gap-2">
                                 <input 
                                   readOnly 
                                   type={isKeyVisible ? 'text' : 'password'} 
                                   value={merchantKey} 
                                   className="flex-1 p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white font-mono text-sm outline-none" 
                                 />
                                 <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="px-6 bg-white/5 border border-white/10 rounded-2xl font-black hover:bg-white/10">{isKeyVisible ? 'إخفاء' : 'عرض'}</button>
                                 <button onClick={() => { navigator.clipboard.writeText(merchantKey); alert('تم نسخ المفتاح'); }} className="px-6 bg-sky-600 text-white rounded-2xl font-black hover:bg-sky-500">نسخ</button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Code Integration Section */}
                     <div className="bg-[#111827] p-10 border border-white/5 rounded-[3.5rem] shadow-2xl space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-2xl font-black text-emerald-400 border-r-4 border-emerald-500 pr-4">كود الدمج (SDK Snippet)</h3>
                           <button onClick={() => { navigator.clipboard.writeText(integrationCodeSnippet); alert('تم نسخ الكود'); }} className="px-6 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-black hover:bg-emerald-600 hover:text-white transition-all">نسخ الكود الكامل</button>
                        </div>
                        <div className="relative">
                           <pre className="p-8 bg-black/60 border border-white/5 rounded-[2.5rem] overflow-x-auto text-left font-mono text-sm leading-relaxed text-sky-200 custom-scrollbar" dir="ltr">
                              {integrationCodeSnippet}
                           </pre>
                        </div>
                        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
                           <span className="text-2xl">💡</span>
                           <p className="text-sm text-slate-400 font-bold leading-relaxed">
                              ضع هذا الكود في صفحة "الدفع" الخاصة بموقعك. سيقوم الـ SDK تلقائياً بإنشاء حقل لإدخال كود بطاقة FastPay ومعالجة العملية عبر سيرفراتنا المؤمنة، ثم إرجاع النتيجة لموقعك.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Sidebar Preview & Stats */}
                  <div className="space-y-8">
                     <div className="bg-gradient-to-br from-slate-900 to-black p-10 border border-white/10 rounded-[3.5rem] shadow-2xl space-y-8">
                        <h3 className="text-xl font-black text-center text-white">معاينة مباشرة (Live Preview)</h3>
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6 text-center">
                           <p className="text-xs font-bold text-slate-500 uppercase">كيف سيظهر في موقعك:</p>
                           <div className="py-6 bg-[#020617] rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-xl">
                              <img src={siteConfig.logoUrl} className="h-8 opacity-80" alt="Logo" />
                              <button className="w-4/5 py-4 bg-sky-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-sky-500 transition-all">Pay with FastPay Card</button>
                              <p className="text-[9px] text-slate-600 font-bold">Secure checkout by FastPay Network</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-[#111827] p-10 border border-white/5 rounded-[3.5rem] shadow-2xl space-y-6">
                        <h4 className="font-black text-white text-lg">إحصائيات الربط</h4>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                              <span className="text-xs font-bold text-slate-500">عمليات الـ API اليوم</span>
                              <span className="font-black text-emerald-400">0</span>
                           </div>
                           <div className="flex justify-between items-center py-3 border-b border-white/5">
                              <span className="text-xs font-bold text-slate-500">متوسط سرعة الاستجابة</span>
                              <span className="font-black text-sky-400">120ms</span>
                           </div>
                           <div className="flex justify-between items-center py-3">
                              <span className="text-xs font-bold text-slate-500">الحالة البرمجية</span>
                              <span className="flex items-center gap-2 font-black text-emerald-500"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'settings' && (
           <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-6xl font-black tracking-tighter">إدارة حساب التاجر</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 {/* Security and Password */}
                 <div className="bg-[#0f172a] p-12 border border-white/5 rounded-[4rem] space-y-10 shadow-2xl">
                    <h3 className="text-3xl font-black text-sky-400 flex items-center gap-3">
                       <span>🔐</span> أمن الحساب
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">كلمة المرور الحالية</label>
                          <input type="password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="••••••••" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">كلمة المرور الجديدة</label>
                          <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="••••••••" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest">تأكيد كلمة المرور</label>
                          <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="••••••••" />
                       </div>

                       {passwordError && (
                          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm font-black border border-red-500/20 text-center animate-shake">
                             ⚠️ {passwordError}
                          </div>
                       )}
                       {passwordSuccess && (
                          <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl text-sm font-black border border-emerald-500/20 text-center animate-bounce">
                             ✓ تم تحديث كلمة المرور بنجاح
                          </div>
                       )}

                       <button type="submit" className="w-full py-6 bg-sky-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-sky-500 transition-all active:scale-95 transform">تحديث الأمان الآن</button>
                    </form>
                 </div>

                 {/* Merchant Identity & Fees */}
                 <div className="space-y-12">
                    <div className="bg-[#0f172a] p-12 border border-white/5 rounded-[4rem] space-y-8 shadow-2xl">
                       <h3 className="text-3xl font-black text-emerald-400">هوية المتجر المعتمدة</h3>
                       <div className="space-y-6">
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                             <p className="text-[10px] font-black text-slate-500 uppercase mb-1">الاسم التجاري الكامل</p>
                             <p className="text-xl font-black text-white">{user.fullName}</p>
                          </div>
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                             <p className="text-[10px] font-black text-slate-500 uppercase mb-1">البريد الإلكتروني الموثق</p>
                             <p className="text-xl font-black text-white">{user.email}</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-12 rounded-[4rem] shadow-2xl space-y-6">
                       <h3 className="text-3xl font-black text-white">العمولة المركزية</h3>
                       <div className="flex justify-between items-center p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                          <span className="font-black text-slate-400 text-lg">نسبة الاقتطاع</span>
                          <span className="text-5xl font-black text-sky-400">{siteConfig.merchantFeeValue}{siteConfig.merchantFeeType === 'percent' ? '%' : '$'}</span>
                       </div>
                       <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">
                          * هذه العمولات يتم تطبيقها تلقائياً على كافة مبيعات البطاقات وعمليات التحويل من حساب التاجر. يتم التحكم في هذه النسبة حصرياً من قبل الإدارة العليا للشبكة.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </main>

      {/* Overlays and Modals */}
      {modalType === 'cards' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={()=>setModalType(null)}></div>
            <div className="relative bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-12 md:p-16 space-y-12 animate-in zoom-in duration-500 shadow-2xl">
               <div className="text-center space-y-4">
                  <h3 className="text-4xl font-black tracking-tighter text-white">إصدار بطاقات دفع</h3>
                  <p className="text-slate-500 font-bold">اختر القيمة والكمية المراد توليدها رقمياً</p>
               </div>
               <div className="space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[10, 50, 100, 500].map(v => (
                        <button key={v} onClick={()=>setCardAmount(v)} className={`p-6 rounded-[2rem] font-black text-2xl transition-all border ${cardAmount === v ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                           ${v}
                        </button>
                     ))}
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 uppercase mr-4 tracking-widest text-center block">الكمية المطلوبة</label>
                     <input type="number" min="1" value={cardQuantity} onChange={e=>setCardQuantity(Number(e.target.value))} className="w-full p-6 bg-black/40 border border-white/10 rounded-[2.5rem] text-center font-black text-5xl text-white outline-none focus:border-emerald-500 shadow-inner" />
                  </div>
                  <button onClick={handleGenerateCards} className="w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 transform">تأكيد التوليد الرقمي المباشر</button>
               </div>
            </div>
         </div>
      )}

      {modalType === 'send' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={()=>setModalType(null)}></div>
            <div className="relative bg-[#111827] border border-white/10 w-full max-w-md rounded-[4rem] p-12 md:p-16 space-y-10 animate-in zoom-in duration-500 shadow-2xl">
               <h3 className="text-4xl font-black text-center tracking-tighter text-white">تحويل مالي سريع</h3>
               <div className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase mr-4">المستفيد (Username)</label>
                     <input placeholder="@username" value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-center text-xl text-white outline-none focus:border-sky-500 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase mr-4">المبلغ المراد تحويله ($)</label>
                     <input placeholder="0.00" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-center text-5xl text-sky-400 outline-none focus:border-sky-500 shadow-inner" />
                  </div>
                  <button onClick={handleSend} className="w-full py-8 bg-sky-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-sky-500 transition-all active:scale-95 transform">إتمام عملية التحويل الآن</button>
               </div>
            </div>
         </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MerchantDashboard;
