import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Tag, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

export default function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(null);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleStartEdit = (plan) => {
    setIsEditing(plan.id);
    setName(plan.name);
    setDurationDays(plan.duration_days);
    setPrice(plan.price);
    setIsFormOpen(true);
  };

  const handleStartAdd = () => {
    setIsEditing(null);
    setName('');
    setDurationDays(30);
    setPrice('');
    setIsFormOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('plans')
          .update({
            name,
            duration_days: parseInt(durationDays),
            price: parseFloat(price)
          })
          .eq('id', isEditing);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert({
            name,
            duration_days: parseInt(durationDays),
            price: parseFloat(price)
          });

        if (error) throw error;
      }

      setIsFormOpen(false);
      await fetchPlans();
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (id, planName) => {
    const confirm = window.confirm(`هل أنت متأكد من رغبتك بحذف "${planName}"؟`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          alert('لا يمكن حذف هذه الباقة لأن هناك مشتركين مسجلين عليها مسبقاً!');
        } else {
          throw error;
        }
      } else {
        await fetchPlans();
      }
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Tag className="text-indigo-600" size={26} />
            إدارة الباقات والاشتراكات والعروض
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            عدل أسعار الاشتراكات الشهرية، أو أضف عروض حصرية لفترات معينة
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm"
        >
          <Plus size={18} />
          إضافة باقة / عرض جديد
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 mb-8 shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-base">
              {isEditing ? 'تعديل باقة حالية' : 'إضافة نوع اشتراك / عرض جديد'}
            </h3>
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم الاشتراك أو العرض</label>
              <input
                required
                type="text"
                placeholder="مثلاً: اشتراك شهري عادي، أو عرض العيد 4 شهور"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">المدة بالأيام</label>
              <input
                required
                type="number"
                min="1"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">السعر (د.أ)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="25.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Check size={16} />
                {actionLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري تحميل الباقات والأسعار...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-black text-gray-900">{plan.name}</h4>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                    {plan.duration_days} يوم
                  </span>
                </div>
                
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-indigo-600">{plan.price}</span>
                  <span className="text-xs text-gray-500 font-semibold mr-1">دينار أردني</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => handleStartEdit(plan)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-indigo-600 transition"
                >
                  <Edit2 size={15} /> تعديل السعر / التفاصيل
                </button>

                <button
                  onClick={() => handleDeletePlan(plan.id, plan.name)}
                  className="text-gray-400 hover:text-rose-600 transition p-1"
                  title="حذف الباقة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}