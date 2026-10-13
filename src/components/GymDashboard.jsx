import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BarcodeCard from './BarcodeCard';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import AddSubscriptionModal from './AddSubscriptionModal';
import CheckInLogs from './CheckInLogs';
import { 
  Search, 
  UserCheck, 
  Clock, 
  Zap, 
  RefreshCw, 
  UserPlus, 
  Edit3, 
  PlusCircle, 
  CreditCard,
  Trash2,
  Ban
} from 'lucide-react';

export default function GymDashboard() {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        player_number,
        full_name,
        phone,
        subscriptions (
          id,
          status,
          start_date,
          end_date,
          price_paid,
          plans ( name, duration_days, price )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setMembers(data);
      if (data.length > 0 && !selectedMember) {
        setSelectedMember(data[0]);
      } else if (selectedMember) {
        const updated = data.find(m => m.id === selectedMember.id);
        setSelectedMember(updated || data[0] || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleActivateNow = async (subId) => {
    setActionLoading(subId);
    try {
      const { error } = await supabase.rpc('activate_subscription_now', {
        target_sub_id: subId
      });
      if (error) throw error;
      await fetchMembers();
    } catch (err) {
      alert('خطأ أثناء تفعيل الاشتراك: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async (subId, planName) => {
    const confirmCancel = window.confirm(`هل أنت متأكد من إلغاء باقة "${planName}"؟`);
    if (!confirmCancel) return;

    setActionLoading(subId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'CANCELLED' })
        .eq('id', subId);

      if (error) throw error;
      await fetchMembers();
    } catch (err) {
      alert('خطأ أثناء إلغاء الاشتراك: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    const confirmDelete = window.confirm(
      `تحذير: هل أنت متأكد من حذف المشترك "${memberName}" بالكامل؟\nسيتم حذف جميع سجلاته واشتراكاته نهائياً!`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setSelectedMember(null);
      await fetchMembers();
    } catch (err) {
      alert('خطأ أثناء حذف المشترك: ' + err.message);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.player_number.includes(searchQuery) ||
    (m.phone && m.phone.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ruhul <span className="text-indigo-600">PANEL</span></h1>
          <p className="text-sm text-gray-500">لوحة التحكم وإدارة الاشتراكات والباركود</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition"
          >
            <UserPlus size={18} />
            إضافة مشترك جديد
          </button>

          <button 
            onClick={fetchMembers} 
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 px-3 py-2 rounded-xl text-sm transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>
      </header>

      {/* Main Grid: المشتركين والتفاصيل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* قائمة المشتركين */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col h-[750px]">
          <div className="relative mb-4">
            <Search className="absolute right-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو رقم اللاعب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredMembers.map(member => {
              const activeSub = member.subscriptions?.find(s => s.status === 'ACTIVE');
              const hasQueued = member.subscriptions?.some(s => s.status === 'QUEUED' || s.status === 'SCHEDULED');
              const isSelected = selectedMember?.id === member.id;

              return (
                <div 
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-4 rounded-xl cursor-pointer transition border ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{member.full_name}</h3>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                      #{member.player_number}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {activeSub ? (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        نشط: {activeSub.plans?.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        لا يوجد اشتراك نشط
                      </span>
                    )}

                    {hasQueued && (
                      <span className="inline-flex items-center text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        يوجد مؤجل
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* تفاصيل المشترك والتحكم باشتراكاته */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMember ? (
            <>
              {/* بطاقة المشترك والباركود */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-gray-900">{selectedMember.full_name}</h2>
                    <span className="text-sm font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-lg font-bold">
                      #{selectedMember.player_number}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">الهاتف: {selectedMember.phone || 'غير مسجل'}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button 
                      onClick={() => setIsEditMemberOpen(true)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      <Edit3 size={14} /> تعديل البيانات
                    </button>
                    <button 
                      onClick={() => setIsAddSubOpen(true)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <PlusCircle size={14} /> إضافة / تجديد اشتراك
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(selectedMember.id, selectedMember.full_name)}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 size={14} /> حذف المشترك
                    </button>
                  </div>
                </div>
                
                {/* كرت الباركود */}
                <BarcodeCard 
                  playerNumber={selectedMember.player_number} 
                  playerName={selectedMember.full_name} 
                />
              </div>

              {/* تفاصيل الاشتراكات */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="text-indigo-600" size={20} />
                    سجل الاشتراكات والحسابات
                  </h3>
                  <button 
                    onClick={() => setIsAddSubOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <PlusCircle size={14} /> اشتراك جديد
                  </button>
                </div>

                {selectedMember.subscriptions?.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl">
                    <CreditCard className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-500 text-sm">لا يوجد أي باقة مسجلة لهذا اللاعب.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMember.subscriptions.map((sub) => {
                      const isActive = sub.status === 'ACTIVE';
                      const isQueuedOrScheduled = sub.status === 'QUEUED' || sub.status === 'SCHEDULED';
                      const isCancelled = sub.status === 'CANCELLED';
                      const isExpired = sub.status === 'EXPIRED';

                      return (
                        <div 
                          key={sub.id} 
                          className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                            isActive ? 'border-emerald-300 bg-emerald-50/30' : 
                            isQueuedOrScheduled ? 'border-amber-200 bg-amber-50/20' : 
                            isCancelled ? 'border-rose-200 bg-rose-50/30 opacity-70' :
                            'border-gray-200 bg-gray-50/60 opacity-70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-gray-900">{sub.plans?.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                isActive ? 'bg-emerald-100 text-emerald-800' :
                                isQueuedOrScheduled ? 'bg-amber-100 text-amber-800' :
                                isCancelled ? 'bg-rose-100 text-rose-800' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {isActive ? 'نشط حالياً' : 
                                 isQueuedOrScheduled ? 'مؤجل / في الانتظار' : 
                                 isCancelled ? 'ملغي' : 'منتهي'}
                              </span>
                              <span className="text-xs font-mono font-bold text-gray-500 bg-white px-2 py-0.5 rounded border">
                                {sub.price_paid} د.أ
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 mt-2 space-x-3 space-x-reverse flex items-center">
                              {sub.start_date && (
                                <span>البداية: {new Date(sub.start_date).toLocaleDateString('ar-EG')}</span>
                              )}
                              {sub.end_date && (
                                <span>النهاية: {new Date(sub.end_date).toLocaleDateString('ar-EG')}</span>
                              )}
                              <span>المدة: {sub.plans?.duration_days} يوم</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {isQueuedOrScheduled && (
                              <button
                                onClick={() => handleActivateNow(sub.id)}
                                disabled={actionLoading === sub.id}
                                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                <Zap size={14} />
                                تفعيل الآن
                              </button>
                            )}

                            {(isActive || isQueuedOrScheduled) && (
                              <button
                                onClick={() => handleCancelSubscription(sub.id, sub.plans?.name)}
                                disabled={actionLoading === sub.id}
                                className="flex items-center gap-1 text-rose-600 hover:bg-rose-100 border border-rose-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                                title="إلغاء هذا الاشتراك"
                              >
                                <Ban size={14} />
                                إلغاء الباقة
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-gray-400">
              اختر مشتركاً من القائمة لعرض بياناته
            </div>
          )}
        </div>

      </div>

      {/* جدول سجل الدخول المباشر (Check-in Logs) */}
      <div className="mt-8">
        <CheckInLogs />
      </div>

      {/* Modals */}
      <AddMemberModal 
        isOpen={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)} 
        onSuccess={fetchMembers} 
      />

      <EditMemberModal 
        isOpen={isEditMemberOpen} 
        onClose={() => setIsEditMemberOpen(false)} 
        member={selectedMember} 
        onSuccess={fetchMembers} 
      />

      <AddSubscriptionModal 
        isOpen={isAddSubOpen} 
        onClose={() => setIsAddSubOpen(false)} 
        member={selectedMember} 
        onSuccess={fetchMembers} 
      />
    </div>
  );
}