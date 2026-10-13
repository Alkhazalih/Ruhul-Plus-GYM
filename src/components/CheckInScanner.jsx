import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle, XCircle, Scan, ArrowRight, Volume2 } from 'lucide-react';

export default function CheckInScanner({ onBack }) {
  const [code, setCode] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // دالة تشغيل أصوات تنبيه خفيفة عبر المتصفح (Web Audio API) بدون ملفات صوت خارجية
  const playFeedbackSound = (isSuccess) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        // نغمة نجاح ثنائية لطيفة
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // نغمة خطأ منخفضة
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio Context disabled or blocked:', e);
    }
  };

  // إبقاء التركيز دائماً داخل حقل الإدخال مهما حصل (حتى لو كبس أي مكان بالصفحة)
  useEffect(() => {
    inputRef.current?.focus();
    const keepFocus = () => {
      inputRef.current?.focus();
    };

    window.addEventListener('click', keepFocus);
    return () => window.removeEventListener('click', keepFocus);
  }, []);

const handleScan = async (scannedValue) => {
    if (!scannedValue || loading) return;
    setLoading(true);

    try {
      // 1. البحث عن المشترك واشتراكاته
      const { data: member, error: mError } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          player_number,
          subscriptions (
            id,
            status,
            end_date,
            plans ( name )
          )
        `)
        .eq('player_number', scannedValue)
        .single();

      if (mError || !member) {
        playFeedbackSound(false);
        setLastCheckIn({
          success: false,
          name: 'غير مسجل',
          playerNumber: scannedValue,
          reason: 'رقم المشترك غير موجود بالنظام'
        });
        return;
      }

      // 2. التحقق من تاريخ اليوم (بداية اليوم الساعة 00:00:00)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // فحص إذا كان قد سجل دخولاً ناجحاً مسبقاً اليوم
      const { data: existingCheckIns } = await supabase
        .from('check_ins')
        .select('id, scanned_at')
        .eq('member_id', member.id)
        .eq('access_granted', true)
        .gte('scanned_at', startOfToday.toISOString())
        .limit(1);

      if (existingCheckIns && existingCheckIns.length > 0) {
        const checkInTime = new Date(existingCheckIns[0].scanned_at).toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        });

        playFeedbackSound(false);
        setLastCheckIn({
          success: false,
          isDuplicate: true, // علامة لمنع الدخول المتكرر
          name: member.full_name,
          playerNumber: member.player_number,
          reason: `ممنوع الدخول: المشترك سجل دخوله مسبقاً اليوم الساعة (${checkInTime})`
        });

        // توثيق محاولة الدخول المرفوضة
        await supabase.from('check_ins').insert({
          member_id: member.id,
          access_granted: false,
          rejection_reason: 'تم تجاوز الحد المسموح: دخول مكرر في نفس اليوم'
        });
        return;
      }

      // 3. التحقق من وجود اشتراك ACTIVE وساري الصلاحية
      const activeSub = member.subscriptions?.find(
        (s) => s.status === 'ACTIVE' && new Date(s.end_date) > new Date()
      );

      const hasAccess = Boolean(activeSub);
      const daysLeft = activeSub 
        ? Math.ceil((new Date(activeSub.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

      playFeedbackSound(hasAccess);

      // 4. توثيق حركة الدخول
      await supabase.from('check_ins').insert({
        member_id: member.id,
        access_granted: hasAccess,
        rejection_reason: hasAccess ? null : 'الاشتراك منتهي أو غير مفعل'
      });

      setLastCheckIn({
        success: hasAccess,
        isDuplicate: false,
        name: member.full_name,
        playerNumber: member.player_number,
        planName: activeSub?.plans?.name,
        daysLeft,
        reason: hasAccess ? 'أهلاً بك! تم تسجيل الدخول' : 'الاشتراك منتهي، يرجى التجديد'
      });

    } catch (err) {
      console.error(err);
      playFeedbackSound(false);
      setLastCheckIn({
        success: false,
        name: 'خطأ',
        reason: 'حدث خطأ في الاتصال بقاعدة البيانات'
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setCode('');
        inputRef.current?.focus();
      }, 50);
    }
  };

  // التقاط ضغطة الـ Enter من مسدس الباركود فوراً
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = code.trim();
      if (val) {
        handleScan(val);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 select-none" dir="rtl">
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition"
      >
        <ArrowRight size={18} /> العودة للوحة التحكم
      </button>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Scan size={32} />
        </div>
        
        <h2 className="text-2xl font-black mb-1">تسجيل دخول ruhul</h2>
        <p className="text-slate-400 text-sm mb-6">النظام جاهز لاستقبال الباركود تلقائياً</p>

        {/* حقل الإدخال الذي يظل جاهزاً دائماً */}
        <div className="mb-6 relative">
          <input 
            ref={inputRef}
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="جاهز للمسح..."
            autoFocus
            className="w-full text-center tracking-widest text-2xl font-bold bg-slate-950 border-2 border-indigo-500 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-white placeholder:text-slate-700 font-mono transition-all"
          />
          {loading && (
            <div className="absolute left-4 top-4 text-xs text-indigo-400 font-semibold animate-pulse">
              جاري الفحص...
            </div>
          )}
        </div>

        {/* نتيجة فحص المشترك الحالي */}
        {lastCheckIn ? (
          <div className={`p-6 rounded-2xl border transition-all ${
            lastCheckIn.success 
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
              : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex justify-center mb-2">
              {lastCheckIn.success ? (
                <CheckCircle size={52} className="text-emerald-400 animate-bounce" />
              ) : (
                <XCircle size={52} className="text-rose-400" />
              )}
            </div>
            
            <h3 className="text-2xl font-black text-white">{lastCheckIn.name}</h3>
            {lastCheckIn.playerNumber && (
              <div className="text-xs font-mono opacity-60 mt-0.5">#{lastCheckIn.playerNumber}</div>
            )}
            
            <p className="text-base font-bold mt-3">{lastCheckIn.reason}</p>

            {lastCheckIn.success && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-around text-xs">
                <div>الباقة: <span className="font-bold text-white">{lastCheckIn.planName}</span></div>
                <div>المتبقي: <span className="font-bold text-white">{lastCheckIn.daysLeft} يوم</span></div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-slate-600 text-sm">
            بانتظار مسح كرت اللاعب الأول...
          </div>
        )}
      </div>
    </div>
  );
}