
import React from 'react';
import { SiteConfig, LandingService, CustomPage } from '../types';

interface Props {
  siteConfig: SiteConfig;
  services: LandingService[];
  pages: CustomPage[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const LandingPage: React.FC<Props> = ({ 
  siteConfig, 
  services, 
  pages,
  currentPath, 
  setCurrentPath, 
  onLoginClick, 
  onRegisterClick 
}) => {
  
  const activeCustomPage = pages.find(p => p.slug === currentPath && p.isActive);

  const paymentLogos = [
    { name: 'Visa', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
    { name: 'MasterCard', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
    { name: 'Amex', url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg' },
    { name: 'PayPal', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
    { name: 'Apple Pay', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg' },
    { name: 'Google Pay', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Google_Pay_Logo.svg' },
    { name: 'Stripe', url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
    { name: 'Bitcoin', url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg' },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#020617] text-white selection:bg-sky-500 selection:text-white overflow-x-hidden text-right" dir="rtl">
      
      {/* Mesh Background */}
      <div className="fixed inset-0 z-0 bg-mesh opacity-40 pointer-events-none"></div>

      {/* Futuristic Navbar */}
      <nav className="fixed w-full z-[60] bg-[#020617]/40 backdrop-blur-3xl border-b border-white/5 py-8 px-6 md:px-20 flex justify-between items-center">
        <div className="flex items-center gap-8 group cursor-pointer" onClick={() => setCurrentPath('home')}>
          <div className="bg-[#0f172a]/80 p-5 rounded-[2.5rem] shadow-[0_0_60px_rgba(59,130,246,0.25)] border border-sky-500/20 transform group-hover:scale-105 transition-all duration-500 backdrop-blur-md flex items-center justify-center">
            <img src={siteConfig.logoUrl} alt="Logo" className="h-20 md:h-24 w-auto object-contain filter brightness-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </div>
          <span className="text-4xl font-black tracking-tighter hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-200 to-sky-400">
            {siteConfig.siteName}
          </span>
        </div>
        
        <div className="hidden md:flex space-x-reverse space-x-12 text-slate-400 font-black text-sm uppercase tracking-widest">
          {pages.filter(p => p.isActive && p.showInNavbar).map(page => (
            <button 
              key={page.id} 
              onClick={() => setCurrentPath(page.slug)} 
              className={`hover:text-white transition-all ${currentPath === page.slug ? 'text-white border-b-2 border-sky-500 pb-1' : ''}`}
            >
              {page.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onLoginClick} className="px-10 py-4 rounded-2xl text-white bg-sky-600 font-black text-base hover:bg-sky-500 transition-all shadow-[0_0_40px_rgba(14,165,233,0.4)] border border-sky-400/20">دخول</button>
          <button onClick={onRegisterClick} className="px-10 py-4 rounded-2xl text-slate-300 bg-white/5 border border-white/10 font-black text-base hover:bg-white/10 transition-all">إنضم إلينا</button>
        </div>
      </nav>

      {currentPath === 'home' ? (
        <>
          {/* Hero Section */}
          <section className="relative pt-80 pb-32 px-6 md:px-20 z-10 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
              <div className="w-full lg:w-3/5 text-right relative">
                 <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/20 blur-[100px] pointer-events-none"></div>
                 <h1 className="text-6xl md:text-8xl font-black leading-tight mb-8 tracking-tighter text-white">
                    {siteConfig.heroTitle.split(':')[0]}
                    <span className="block text-sky-500">{siteConfig.heroTitle.split(':')[1] || ''}</span>
                 </h1>
                 <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl leading-relaxed font-bold">
                    {siteConfig.heroSubtitle}
                 </p>
                 <div className="flex flex-wrap gap-6">
                    <button onClick={onRegisterClick} className="px-14 py-7 rounded-[2.5rem] bg-sky-600 text-white font-black text-2xl shadow-[0_20px_50px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all border border-sky-400/30">
                      {siteConfig.heroCtaText}
                    </button>
                    <div className="flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-full">
                       <div className="flex -space-x-reverse -space-x-3">
                          <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800"></div>
                          <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-sky-600"></div>
                          <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-indigo-600"></div>
                       </div>
                       <p className="text-sm font-black text-slate-300">+10k مستخدم نشط</p>
                    </div>
                 </div>
              </div>
              <div className="w-full lg:w-2/5 relative animate-float">
                 <div className="relative z-10 p-4 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-2xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=2071&auto=format&fit=crop" 
                      className="rounded-[3.5rem] object-cover aspect-square opacity-60 mix-blend-overlay" 
                      alt="Digital Payment"
                    />
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-center">
                       <div className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_50px_rgba(14,165,233,0.8)] animate-pulse">⚡</div>
                       <h3 className="text-4xl font-black mb-4">FastPay OS</h3>
                       <p className="font-bold text-sky-200">الأمان السحابي المتقدم</p>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Massive Trusted Partners Section */}
          <section className="py-24 relative z-10 overflow-hidden bg-gradient-to-b from-transparent via-white/5 to-transparent border-y border-white/5 backdrop-blur-sm">
             <div className="max-w-7xl mx-auto mb-16 text-center px-6">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">بنية تحتية عالمية للمدفوعات</h2>
                <p className="text-sky-500 font-black uppercase tracking-[0.4em] text-sm">نحن ندعم كافة الوسائل المعتمدة دولياً وبأعلى معايير الأمان</p>
             </div>
             
             {/* The Marquee with much larger icons and card-like styling */}
             <div className="flex overflow-hidden relative py-10">
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#020617] to-transparent z-20"></div>
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#020617] to-transparent z-20"></div>
                
                <div className="flex animate-marquee whitespace-nowrap gap-20 md:gap-40 items-center">
                   {[...paymentLogos, ...paymentLogos].map((logo, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-center px-12 py-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl hover:bg-white/10 hover:border-sky-500/40 hover:scale-110 transition-all duration-500 group cursor-pointer min-w-[200px] md:min-w-[300px]"
                      >
                         <img 
                          src={logo.url} 
                          alt={logo.name} 
                          className="h-20 md:h-32 w-auto object-contain filter grayscale group-hover:grayscale-0 brightness-200 group-hover:brightness-100 transition-all duration-700" 
                         />
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* Dynamic Services Section */}
          <section id="services" className="py-32 px-6 md:px-20 relative">
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-24">
                <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                   {siteConfig.servicesTitle}
                </h2>
                <p className="text-xl text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed">
                   {siteConfig.servicesSubtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {services.map((s) => (
                  <div key={s.id} className="p-12 rounded-[4rem] bg-[#0f172a]/40 backdrop-blur-xl border border-white/5 hover:border-sky-500/30 transition-all duration-500 group relative overflow-hidden">
                    <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-500 inline-block">{s.icon}</div>
                    <h3 className="text-3xl font-black mb-6 text-white">{s.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-bold text-lg">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Custom Page Content Area */
        <section className="relative pt-80 pb-48 px-6 md:px-20 z-10 overflow-hidden min-h-screen">
          <div className="max-w-5xl mx-auto bg-[#0f172a]/40 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border border-white/5">
            {activeCustomPage ? (
              <div className="space-y-12">
                <h1 className="text-6xl font-black tracking-tighter text-white border-r-8 border-sky-500 pr-8">
                  {activeCustomPage.title}
                </h1>
                <div 
                  className="prose prose-invert prose-xl max-w-none text-slate-300 font-medium leading-loose dynamic-content-render"
                  dangerouslySetInnerHTML={{ __html: activeCustomPage.content }}
                />
              </div>
            ) : (
              <div className="text-center py-40">
                <h1 className="text-9xl font-black text-white/5 mb-8">404</h1>
                <h2 className="text-4xl font-black text-white">عذراً، هذه الصفحة غير متوفرة</h2>
                <button onClick={() => setCurrentPath('home')} className="mt-12 px-12 py-5 bg-sky-600 rounded-2xl font-black">العودة للرئيسية</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#020617] text-white py-32 px-6 md:px-20 border-t border-white/5 relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24">
          <div className="space-y-10">
            <div className="bg-[#0f172a]/80 p-6 rounded-3xl inline-block shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/5 cursor-pointer" onClick={() => setCurrentPath('home')}>
               <img src={siteConfig.logoUrl} className="h-16 md:h-20 w-auto object-contain filter brightness-110" alt="Logo" />
            </div>
            <p className="text-slate-400 text-lg font-bold leading-relaxed">{siteConfig.footerAbout}</p>
          </div>
          
          <div className="space-y-10">
             <h4 className="text-2xl font-black text-sky-400 border-r-4 border-sky-500 pr-4">{siteConfig.footerLinksTitle}</h4>
             <ul className="space-y-4 text-slate-300 font-bold text-lg">
                <li className="hover:text-sky-400 transition cursor-pointer">{siteConfig.footerLink1Text}</li>
                <li className="hover:text-sky-400 transition cursor-pointer">{siteConfig.footerLink2Text}</li>
                <li className="hover:text-sky-400 transition cursor-pointer">{siteConfig.footerLink3Text}</li>
                <li className="hover:text-sky-400 transition cursor-pointer">{siteConfig.footerLink4Text}</li>
             </ul>
          </div>

          <div className="space-y-10">
             <h4 className="text-2xl font-black text-emerald-400 border-r-4 border-emerald-500 pr-4">{siteConfig.contactSectionTitle}</h4>
             <div className="space-y-6 text-slate-300 font-bold text-lg">
                <div className="flex items-center gap-4 group">
                   <span className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl group-hover:bg-sky-600/20 transition-all">📧</span>
                   <p className="hover:text-sky-400 transition cursor-pointer">{siteConfig.contactEmail}</p>
                </div>
                <div className="flex items-center gap-4 group">
                   <span className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl group-hover:bg-emerald-600/20 transition-all">📞</span>
                   <p className="hover:text-emerald-400 transition cursor-pointer" dir="ltr">{siteConfig.contactPhone}</p>
                </div>
                <div className="flex items-center gap-4 group">
                   <span className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl group-hover:bg-amber-600/20 transition-all">📍</span>
                   <p className="hover:text-amber-400 transition cursor-pointer">{siteConfig.contactAddress}</p>
                </div>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
           جميع الحقوق محفوظة لشبكة {siteConfig.siteName} &copy; {new Date().getFullYear()}
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(50%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
