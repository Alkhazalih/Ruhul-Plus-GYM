import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function AddMemberModal({ isOpen, onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);

  // دالة توليد رقم من 4 خانات متوافق مع Code39
  const generate4DigitCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setPhone('');
      // توليد رقم لاعب عشوائي مكون من 4 خانات
      setPlayerNumber(generate4DigitCode());
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    const { data } = await supabase.from('plans').select('*');
    if (data) {
      setPlans(data);
      if (data.length > 0) setSelectedPlanId(data[0].id);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تنظيف رقم الباركود وتحويله لأحرف كبيرة وقصه لـ 4 خانات كحد أقصى
      const cleanPlayerNumber = playerNumber.trim().toUpperCase();

      if (cleanPlayerNumber.length !== 4) {
        throw new Error('رقم اللاعب يجب أن يتكون من 4 خانات بالضبط لباركود Code39');
      }

      // 1. إضافة المشترك
      const { data: member, error: mErr } = await supabase
        .from('members')
        .insert({
          full_name: fullName,
          phone,
          player_number: cleanPlayerNumber
        })
        .select()
        .single();

      if (mErr) throw mErr;

      // 2. تفعيل الباقة المبدئية إذا تم اختيارها
      if (selectedPlanId) {
        const plan = plans.find(p => p.id === selectedPlanId);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        const { error: sErr } = await supabase.from('subscriptions').insert({
          member_id: member.id,
          plan_id: plan.id,
          status: 'ACTIVE',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          price_paid: plan.price
        });
        if (sErr) throw sErr;
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">تسجيل مشترك جديد</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
            <input 
              required 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)}
              placeholder="مثلاً: محمد أحمد"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                رقم اللاعب (Code39 - 4 خانات)
              </label>
              <div className="flex gap-2">
                <input 
                  required 
                  type="text" 
                  maxLength={4}
                  value={playerNumber} 
                  onChange={e => setPlayerNumber(e.target.value.toUpperCase())}
                  placeholder="1001"
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-center tracking-widest uppercase font-bold"
                />
                <button
                  type="button"
                  onClick={() => setPlayerNumber(generate4DigitCode())}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition whitespace-nowrap"
                  title="توليد رقم جديد"
                >
                  توليد
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">اختيار باقة الاشتراك المبدئية</label>
            <select 
              value={selectedPlanId} 
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">بدون اشتراك حالياً (تسجيل عضو فقط)</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ({p.duration_days} يوم) - {p.price} د.أ
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ المشترك'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}