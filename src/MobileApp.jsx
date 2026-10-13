import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import JsBarcode from 'jsbarcode';
import { 
  Phone, 
  Lock, 
  Dumbbell, 
  Utensils, 
  Scale, 
  CheckCircle, 
  AlertCircle, 
  LogOut,
  Calendar,
  KeyRound
} from 'lucide-react';

export default function MobileApp() {
  const [member, setMember] = useState(null);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempMember, setTempMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card');

  const [workouts, setWorkouts] = useState([]);
  const [dietPlan, setDietPlan] = useState(null);

  const barcodeRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('ruhul_mobile_member');
    if (saved) {
      const m = JSON.parse(saved);
      setMember(m);
      loadMemberDetails(m.id);
    }
  }, []);

  useEffect(() => {
    if (member && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, String(member.player_number).trim().toUpperCase(), {
          format: "CODE39",
          width: 2.5,
          height: 60,
          displayValue: true,
          fontSize: 16,
          textMargin: 6,
          font: "monospace",
          lineColor: "#000000",
          background: "#ffffff"
        });
      } catch (e) {
        console.error("Barcode Render Error", e);
      }
    }
  }, [member, activeTab]);

  const handleCheckPhone = async (e) => {
    e.preventDefault();
    setLoading(true);
    const cleanPhone = phone.trim();

    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          player_number,
          phone,
          height,
          weight,
          coach_notes,
          app_password,
          subscriptions (
            status,
            end_date,
            plans ( name )
          )
        `)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error || !data) {
        alert('رقم الهاتف غير مسجل بالنظام! يرجى مراجعة إدارة النادي.');
        return;
      }

      setTempMember(data);

      if (!data.app_password) {
        setStep('set_pass');
      } else {
        setStep('enter_pass');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetInitialPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      alert('يرجى كتابة كلمة مرور مكونة من 4 خانات على الأقل');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({ app_password: newPassword })
        .eq('id', tempMember.id);

      if (error) throw error;

      const updated = { ...tempMember, app_password: newPassword };
      loginSuccess(updated);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ كلمة المرor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithPassword = (e) => {
    e.preventDefault();
    if (password === tempMember.app_password) {
      loginSuccess(tempMember);
    } else {
      alert('كلمة المرور غير صحيحة!');
    }
  };

  const loginSuccess = (memData) => {
    setMember(memData);
    localStorage.setItem('ruhul_mobile_member', JSON.stringify(memData));
    loadMemberDetails(memData.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('ruhul_mobile_member');
    setMember(null);
    setStep('phone');
    setPhone('');
    setPassword('');
  };

  const loadMemberDetails = async (memberId) => {
    const { data: wData } = await supabase
      .from('member_workouts')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true });
    if (wData) setWorkouts(wData);

    const { data: dData } = await supabase
      .from('member_diet_plans')
      .select('*')
      .eq('member_id', memberId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (dData) setDietPlan(dData);
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center p-6" dir="rtl">
        <div className="max-w-sm w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Dumbbell size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-wider">PLUS GYM APP</h1>
            <p className="text-xs text-slate-400">تطبيق المشتركين الرسمي</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            {step === 'phone' && (
              <form onSubmit={handleCheckPhone} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف المسجل بالجيم</label>
                  <div className="relative">
                    <Phone className="absolute right-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-center tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {loading ? 'جاري الفحص...' : 'متابعة'}
                </button>
              </form>
            )}

            {step === 'set_pass' && (
              <form onSubmit={handleSetInitialPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50">
                    أهلاً بك يا {tempMember?.full_name}!
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    هذا دخولك الأول. يرجى تعيين كلمة مرور لاستخدامها مستقبلاً:
                  </p>
                </div>

                <div>
                  <div className="relative">
                    <KeyRound className="absolute right-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      required
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="تعيين كلمة مرور جديدة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'تأكيد ودخول التطبيق'}
                </button>
              </form>
            )}

            {step === 'enter_pass' && (
              <form onSubmit={handleLoginWithPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="font-bold text-white text-base">مرحباً بعودتك، {tempMember?.full_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">أدخل كلمة المرور الخاصة بك</p>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-3.5 text-slate-500" size={18} />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-center font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition text-sm"
                >
                  تسجيل الدخول
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full text-xs text-slate-500 hover:text-slate-400 pt-1"
                >
                  تغيير رقم الهاتف
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeSub = member.subscriptions?.find(s => s.status === 'ACTIVE');
  const daysLeft = activeSub 
    ? Math.ceil((new Date(activeSub.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 select-none" dir="rtl">
      {/* Header */}
      <header className="p-5 flex justify-between items-center border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-10">
        <div>
          <h2 className="font-black text-lg text-white">{member.full_name}</h2>
          <span className="text-[11px] font-mono text-indigo-400 font-bold">#{member.player_number}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl transition"
          title="تسجيل الخروج"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 rounded-xl transition ${activeTab === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            كرت الدخول
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2 rounded-xl transition ${activeTab === 'workouts' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            جدول التمارين
          </button>
          <button
            onClick={() => setActiveTab('diet')}
            className={`flex-1 py-2 rounded-xl transition ${activeTab === 'diet' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            النظام الغذائي
          </button>
        </div>

        {activeTab === 'card' && (
          <div className="space-y-4">
            <div className="bg-white text-gray-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
              <span className="text-xs font-black tracking-widest text-indigo-600 uppercase mb-1">ruhul MEMBER PASS</span>
              <h3 className="text-xl font-black text-gray-900 mb-2">{member.full_name}</h3>
              
              <div className="bg-white p-2 rounded-xl flex justify-center w-full my-2">
                <svg ref={barcodeRef} className="max-w-full"></svg>
              </div>

              <p className="text-[11px] text-gray-400 font-bold mt-1">
                وجّه شاشة الهاتف نحو قارئ الباركود عند بوابة الدخول
              </p>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              activeSub 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-3">
                {activeSub ? <CheckCircle size={24} className="text-emerald-400" /> : <AlertCircle size={24} className="text-rose-400" />}
                <div>
                  <div className="text-xs font-bold">{activeSub ? activeSub.plans?.name : 'لا يوجد باقة نشطة'}</div>
                  <div className="text-[10px] opacity-70">
                    {activeSub ? `ينتهي في: ${new Date(activeSub.end_date).toLocaleDateString('ar-EG')}` : 'يرجى مراجعة الاستقبال للتجديد'}
                  </div>
                </div>
              </div>
              {activeSub && (
                <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl">
                  {daysLeft} يوم متبقي
                </span>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Scale size={16} className="text-indigo-400" /> القياسات الموثقة من الكوتش
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">الوزن</span>
                  <span className="text-lg font-black text-white font-mono">{member.weight ? `${member.weight} كغ` : '---'}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800">
                  <span className="text-[11px] text-slate-500 block">الطول</span>
                  <span className="text-lg font-black text-white font-mono">{member.height ? `${member.height} سم` : '---'}</span>
                </div>
              </div>
              {member.coach_notes && (
                <div className="p-3 bg-slate-950/80 rounded-xl text-xs text-slate-300 border border-slate-800">
                  <span className="text-[10px] text-indigo-400 font-bold block mb-1">ملاحظة المدرب:</span>
                  {member.coach_notes}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Dumbbell size={16} className="text-indigo-400" /> جدول التمارين الرياضية
            </h3>

            {workouts.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                لم يتم إدراج تمارين لك بعد من قِبل الكوتش
              </div>
            ) : (
              workouts.map((w) => (
                <div key={w.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-md">
                      {w.day_name}
                    </span>
                    <h5 className="font-bold text-sm text-white mt-1">{w.exercise_name}</h5>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs font-bold text-slate-200 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                      {w.sets} × {w.reps}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'diet' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Utensils size={16} className="text-indigo-400" /> البرنامج الغذائي
            </h3>

            {dietPlan ? (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-base font-black text-indigo-400">{dietPlan.title}</h4>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">
                  {dietPlan.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                لم يقم الكوتش بكتابة برنامج غذائي لك حتى الآن
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}