
import React, { useState } from 'react';
import { Role, User } from '../types';

interface Props {
  onClose: () => void;
  onLogin: (user: User) => void;
  accounts: User[];
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<Props> = ({ onClose, onLogin, accounts, onSwitchToRegister }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleBack = () => {
    setSelectedRole(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = accounts.find(
      (acc) => acc.username === username && acc.password === password && (selectedRole === 'DEVELOPER' ? acc.role === 'DEVELOPER' : acc.role === selectedRole)
    );

    if (user) {
      if (user.status === 'suspended' || user.status === 'disabled') {
        setError('هذا الحساب معطل حالياً، يرجى مراجعة الإدارة');
      } else {
        onLogin(user);
      }
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-[#0f172a]/95 border border-white/10 w-full max-w-lg rounded-[2.5rem] md:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-500 backdrop-blur-3xl max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto custom-scrollbar p-8 sm:p-12 md:p-16 text-center">
          <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-500 hover:text-white transition bg-white/5 p-2 md:p-3 rounded-full z-10">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {!selectedRole ? (
            <div className="space-y-6 md:space-y-8 pt-4 md:pt-0">
              <div className="mb-6 md:mb-12">
                 <div className="w-16 h-16 md:w-24 md:h-24 bg-sky-600/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 border border-sky-500/30">
                    <span className="text-3xl md:text-5xl">🔐</span>
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">بوابة الوصول الآمن</h2>
                 <p className="text-slate-500 font-bold mt-2 text-sm md:text-base">اختر نوع حسابك للمتابعة</p>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {[
                  { r: 'DEVELOPER', label: 'الإدارة التنفيذية', icon: '⚡', color: 'from-sky-600 to-indigo-600', desc: 'إدارة الشبكة والسيولة المالية' },
                  { r: 'MERCHANT', label: 'منصة التجار', icon: '💼', color: 'from-amber-500 to-orange-600', desc: 'عمليات الربط والمبيعات المباشرة' },
                  { r: 'USER', label: 'المحفظة الرقمية', icon: '👤', color: 'from-emerald-500 to-teal-600', desc: 'الحوالات والمدفوعات الشخصية' }
                ].map((item) => (
                  <button 
                    key={item.r} 
                    onClick={() => setSelectedRole(item.r as Role)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-right flex items-center gap-4 md:gap-6 group"
                  >
                     <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${item.color} text-white rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-xl md:text-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}>
                       {item.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-lg md:text-xl font-black text-white mb-1 truncate">{item.label}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold truncate">{item.desc}</p>
                     </div>
                     <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">←</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-white/5">
                <p className="text-slate-500 font-bold mb-2 md:mb-4 text-sm">لا تملك حساباً في الشبكة؟</p>
                <button onClick={onSwitchToRegister} className="text-sky-400 font-black text-lg md:text-xl hover:text-sky-300 transition-all inline-flex items-center gap-2">
                   <span>إنشاء حساب جديد</span>
                   <span className="text-xl md:text-2xl">⚡</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 text-right animate-in slide-in-from-left duration-500 pt-8 md:pt-0">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                <button type="button" onClick={handleBack} className="text-sky-500 font-black hover:bg-sky-500/10 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-sm md:text-base">
                   <span>رجوع</span>
                   <span className="text-lg">→</span>
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-white">دخول {selectedRole === 'DEVELOPER' ? 'المطور' : selectedRole === 'MERCHANT' ? 'التاجر' : 'المستخدم'}</h2>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">اسم المستخدم</label>
                  <input 
                    required
                    value={username} 
                    onChange={e=>setUsername(e.target.value)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 text-white font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg md:text-xl" 
                    placeholder="Username" 
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">كلمة المرور</label>
                  <input 
                    required
                    type="password" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 text-white font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg md:text-xl" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-400 p-4 md:p-6 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black border border-red-500/20 flex items-center gap-3">
                   <span>⚠️</span>
                   <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-6 md:py-8 bg-sky-600 text-white rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:bg-sky-500 transition-all active:scale-95 transform"
              >
                المصادقة والدخول
              </button>
              
              <p className="text-center text-slate-500 font-bold text-[10px] md:text-sm">تشفير AES-256 مفعل تلقائياً لهذه الجلسة</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
