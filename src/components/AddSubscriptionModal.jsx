import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function AddSubscriptionModal({ isOpen, onClose, member, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [activationMode, setActivationMode] = useState('QUEUED'); // 'NOW' أو 'QUEUED' أو 'DATE'
  const [customStartDate, setCustomStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    const { data } = await supabase.from('plans').select('*');
    if (data && data.length > 0) {
      setPlans(data);
      setSelectedPlanId(data[0].id);
    }
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const plan = plans.find(p => p.id === selectedPlanId);
      let status = 'QUEUED';
      let startDate = null;
      let endDate = null;

      if (activationMode === 'NOW') {
        // تفعيل فوري مع إنهاء القديم إن وجد
        await supabase
          .from('subscriptions')
          .update({ status: 'EXPIRED', end_date: new Date().toISOString() })
          .eq('member_id', member.id)
          .eq('status', 'ACTIVE');

        status = 'ACTIVE';
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);
      } else if (activationMode === 'DATE' && customStartDate) {
        status = 'SCHEDULED';
        startDate = new Date(customStartDate);
        endDate = new Date(customStartDate);
        endDate.setDate(endDate.getDate() + plan.duration_days);
      }

      const { error } = await supabase.from('subscriptions').insert({
        member_id: member.id,
        plan_id: plan.id,
        status: status,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        price_paid: plan.price
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">إضافة اشتراك لـ {member.full_name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <form onSubmit={handleAddSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">نوع الباقة</label>
            <select 
              value={selectedPlanId} 
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl outline-none"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ({p.duration_days} يوم) - {p.price} د.أ</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">وقت وطريقة التفعيل</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="mode" 
                  value="NOW" 
                  checked={activationMode === 'NOW'} 
                  onChange={() => setActivationMode('NOW')} 
                />
                <span>تفعيل فوري الآن</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="mode" 
                  value="QUEUED" 
                  checked={activationMode === 'QUEUED'} 
                  onChange={() => setActivationMode('QUEUED')} 
                />
                <span>في قائمة الانتظار (تفعيل لاحقاً أو بعد انتهاء الحالي)</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="mode" 
                  value="DATE" 
                  checked={activationMode === 'DATE'} 
                  onChange={() => setActivationMode('DATE')} 
                />
                <span>تحديد موعد مجدول في المستقبل</span>
              </label>
            </div>
          </div>

          {activationMode === 'DATE' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البدء المجدول</label>
              <input 
                type="date" 
                required 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl outline-none" 
              />
            </div>
          )}

          <div className="pt-4 flex gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'تأكيد وحفظ الاشتراك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}