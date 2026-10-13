import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Dumbbell, Utensils, Scale, User, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CoachPortal({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  // حالات البيانات التدريبية والجسدية
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [savingMetrics, setSavingMetrics] = useState(false);

  // تمارين المشترك
  const [workouts, setWorkouts] = useState([]);
  const [dayName, setDayName] = useState('يوم 1: صدر وتراي');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10-12');
  const [addingWorkout, setAddingWorkout] = useState(false);

  // الجدول الغذائي
  const [dietTitle, setDietTitle] = useState('');
  const [dietContent, setDietContent] = useState('');
  const [savingDiet, setSavingDiet] = useState(false);

  // البحث عن لاعب
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSelectedMember(null);

    const { data: member, error } = await supabase
      .from('members')
      .select(`
        id,
        player_number,
        full_name,
        phone,
        height,
        weight,
        coach_notes,
        subscriptions (
          status,
          end_date,
          plans ( name )
        )
      `)
      .or(`player_number.eq.${searchQuery.trim()},full_name.ilike.%${searchQuery.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (member) {
      setSelectedMember(member);
      setWeight(member.weight || '');
      setHeight(member.height || '');
      setCoachNotes(member.coach_notes || '');
      await loadMemberTrainingData(member.id);
    } else {
      alert('لم يتم العثور على أي مشترك بهذا الاسم أو الرقم!');
    }
    setLoading(false);
  };

  // جلب التمارين والدايت للاعب المختار
  const loadMemberTrainingData = async (memberId) => {
    // 1. تمارين
    const { data: wData } = await supabase
      .from('member_workouts')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true });
    if (wData) setWorkouts(wData);

    // 2. دايت
    const { data: dData } = await supabase
      .from('member_diet_plans')
      .select('*')
      .eq('member_id', memberId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dData) {
      setDietTitle(dData.title);
      setDietContent(dData.content);
    } else {
      setDietTitle('');
      setDietContent('');
    }
  };

  // حفظ القياسات والملاحظات
  const handleSaveMetrics = async () => {
    if (!selectedMember) return;
    setSavingMetrics(true);
    await supabase
      .from('members')
      .update({
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        coach_notes: coachNotes
      })
      .eq('id', selectedMember.id);
    setSavingMetrics(false);
    alert('تم حفظ القياسات بنجاح!');
  };

  // إضافة تمرين جديد
  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim() || !selectedMember) return;
    setAddingWorkout(true);

    const { data, error } = await supabase
      .from('member_workouts')
      .insert({
        member_id: selectedMember.id,
        created_by: user.id,
        day_name: dayName,
        exercise_name: exerciseName,
        sets: parseInt(sets),
        reps: reps
      })
      .select()
      .single();

    if (!error && data) {
      setWorkouts([...workouts, data]);
      setExerciseName('');
    }
    setAddingWorkout(false);
  };

  // حذف تمرين
  const handleDeleteWorkout = async (workoutId) => {
    await supabase.from('member_workouts').delete().eq('id', workoutId);
    setWorkouts(workouts.filter(w => w.id !== workoutId));
  };

  // حفظ أو تحديث النظام الغذائي
  const handleSaveDiet = async (e) => {
    e.preventDefault();
    if (!selectedMember || !dietTitle) return;
    setSavingDiet(true);

    // فحص إذا كان له خطة دايت سابقة لتحديثها أو إضافة جديدة
    const { data: existing } = await supabase
      .from('member_diet_plans')
      .select('id')
      .eq('member_id', selectedMember.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('member_diet_plans')
        .update({
          title: dietTitle,
          content: dietContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('member_diet_plans')
        .insert({
          member_id: selectedMember.id,
          created_by: user.id,
          title: dietTitle,
          content: dietContent
        });
    }

    setSavingDiet(false);
    alert('تم حفظ النظام الغذائي بنجاح!');
  };

  const activeSub = selectedMember?.subscriptions?.find(s => s.status === 'ACTIVE');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* شريط البحث عن اللاعب */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن المشترك بواسطة رقم اللاعب (الباركود) أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-2xl text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading ? 'جاري البحث...' : 'بحث عن اللاعب'}
          </button>
        </form>
      </div>

      {selectedMember ? (
        <div className="space-y-6">
          {/* بطاقة معلومات اللاعب (قراءة فقط بدون معلومات مالية) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900">{selectedMember.full_name}</h2>
                <span className="font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-100">
                  #{selectedMember.player_number}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">هاتف: {selectedMember.phone || 'غير مسجل'}</p>
            </div>

            {/* حالة الاشتراك للقراءة فقط */}
            <div className="flex items-center gap-3">
              {activeSub ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                  <div>
                    <div className="text-xs text-emerald-800 font-bold">اشتراك فعال: {activeSub.plans?.name}</div>
                    <div className="text-[11px] text-emerald-600">ينتهي بتاريخ: {new Date(activeSub.end_date).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-rose-600" size={24} />
                  <div>
                    <div className="text-xs text-rose-800 font-bold">لا يوجد اشتراك نشط حالياً</div>
                    <div className="text-[11px] text-rose-600">اللاعب غير مسجل كنشط بالاستقبال</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* قياسات الجسم وملاحظات الكوتش */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <Scale className="text-indigo-600" size={20} />
                القياسات البدنية
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">الوزن (كغ)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="مثلاً 75.5"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">الطول (سم)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="مثلاً 178"
                    className="w-full px-3 py-2 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ملاحظات الكوتش أو الإصابات</label>
                <textarea
                  rows={4}
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder="ملاحظات حول مستوى اللياقة، أو وجود إصابة في الظهر أو الكتف..."
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={handleSaveMetrics}
                disabled={savingMetrics}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                {savingMetrics ? 'جاري الحفظ...' : 'حفظ التحديثات البدنية'}
              </button>
            </div>

            {/* جدول التمارين المخصصة للاعب */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <Dumbbell className="text-indigo-600" size={20} />
                جدول التمارين اليومي
              </h3>

              {/* فورم إضافة تمرين */}
              <form onSubmit={handleAddWorkout} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">اليوم / العضلة</label>
                  <input
                    type="text"
                    required
                    value={dayName}
                    onChange={(e) => setDayName(e.target.value)}
                    placeholder="يوم الأرجل / ظهر"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">اسم التمرين</label>
                  <input
                    type="text"
                    required
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="Bench Press"
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">الجولات والعدات</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="1"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      className="w-14 px-2 py-1.5 border rounded-lg text-xs text-center font-mono bg-white"
                      title="الجولات"
                    />
                    <input
                      type="text"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      placeholder="12-10"
                      className="w-full px-2 py-1.5 border rounded-lg text-xs text-center font-mono bg-white"
                      title="العدات"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={addingWorkout}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> إضافة تمرين
                  </button>
                </div>
              </form>

              {/* قائمة التمارين المضافة */}
              <div className="space-y-2">
                {workouts.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 text-xs">لم يتم إضافة تمارين لهذا المشترك بعد.</p>
                ) : (
                  workouts.map((w) => (
                    <div key={w.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded ml-2">
                          {w.day_name}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{w.exercise_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-gray-600 bg-white px-2 py-1 rounded border">
                          {w.sets} جولات × {w.reps} عدة
                        </span>
                        <button
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* الجدول الغذائي */}
            <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <Utensils className="text-indigo-600" size={20} />
                البرنامج الغذائي للاعب (Diet Plan)
              </h3>

              <form onSubmit={handleSaveDiet} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">عنوان النظام الغذائي</label>
                  <input
                    type="text"
                    required
                    value={dietTitle}
                    onChange={(e) => setDietTitle(e.target.value)}
                    placeholder="مثلاً: نظام تنشيف وتقليل دهون 2000 سعرة حرارية"
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">تفاصيل الوجبات والتعليمات</label>
                  <textarea
                    rows={5}
                    required
                    value={dietContent}
                    onChange={(e) => setDietContent(e.target.value)}
                    placeholder="الوجبة الأولى: 4 بياض بيض + شوفان... الوجبة الثانية: صدر دجاج مع أرز مسلوق..."
                    className="w-full px-4 py-3 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingDiet}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition"
                  >
                    {savingDiet ? 'جاري الحفظ...' : 'حفظ النظام الغذائي'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
          ابحث عن رقم المشترك أو اسمه في الأعلى للبدء بوضع التمارين والبرنامج الغذائي
        </div>
      )}
    </div>
  );
}