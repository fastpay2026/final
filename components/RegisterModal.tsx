
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onClose: () => void;
  onRegister: (newUser: User) => void;
  onSwitchToLogin: () => void;
  accounts: User[];
}

const RegisterModal: React.FC<Props> = ({ onClose, onRegister, onSwitchToLogin, accounts }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.fullName.trim().split(' ').length < 3) {
      return setError('يرجى إدخال الاسم الثلاثي بالكامل');
    }

    if (formData.username.trim().length < 4) {
      return setError('اسم المستخدم يجب أن يتكون من 4 أحرف على الأقل');
    }

    // Duplicate Username Check
    const isDuplicate = accounts.some(
      (acc) => acc.username.toLowerCase() === formData.username.trim().toLowerCase()
    );
    if (isDuplicate) {
      return setError('عذراً، اسم المستخدم هذا محجوز مسبقاً، يرجى اختيار اسم آخر');
    }

    if (!validateEmail(formData.email)) {
      return setError('يرجى إدخال بريد إلكتروني صحيح');
    }

    if (formData.password.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('كلمتا المرور غير متطابقتين');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username.trim(),
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      role: 'USER',
      balance: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    onRegister(newUser);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-10 text-center">
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <h2 className="text-4xl font-black mb-4 text-slate-900 tracking-tighter">تسجيل جديد</h2>
          <p className="text-slate-500 font-bold mb-10">انضم لأكبر منظومة دفع رقمية عالمية</p>

          <form onSubmit={handleSubmit} className="space-y-6 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">الاسم الثلاثي</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="الاسم الثلاثي"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">اسم المستخدم (Username)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Username"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="example@mail.com"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="0000 000 05"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 mr-2">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none transition font-bold"
                />
              </div>
            </div>
            
            {error && (
              <p className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-black border border-red-100 animate-shake">
                ⚠️ {error}
              </p>
            )}
            
            <button 
              type="submit"
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-black transition-all active:scale-95 mt-4"
            >
              تسجيل الحساب الآن
            </button>

            <div className="mt-8">
               <p className="text-slate-500 font-bold">لديك حساب بالفعل؟ <button onClick={onSwitchToLogin} type="button" className="text-blue-600 font-black hover:underline">سجل دخولك</button></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
