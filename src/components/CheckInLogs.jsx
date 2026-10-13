import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { History, CheckCircle, XCircle, RefreshCw, Calendar } from 'lucide-react';

export default function CheckInLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب سجلات الدخول الخاصة باليوم مع تفاصيل المشترك واشتراكاته
  const fetchTodayLogs = async () => {
    setLoading(true);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        scanned_at,
        access_granted,
        rejection_reason,
        members (
          id,
          player_number,
          full_name,
          subscriptions (
            status,
            end_date,
            plans ( name )
          )
        )
      `)
      .gte('scanned_at', startOfToday.toISOString())
      .order('scanned_at', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodayLogs();

    // الاستماع الفوري للـ Realtime: أي عملية Check-in جديدة تضاف فوراً بالجدول
    const channel = supabase
      .channel('realtime_checkins')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins' },
        () => {
          fetchTodayLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <History className="text-indigo-600" size={22} />
            سجل دخول المشتركين اليوم (Live Logs)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            عرض مباشر لحركات الدخول المسجلة بمسدس الباركود لليوم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            تحديث فوري
          </span>
          <button 
            onClick={fetchTodayLogs}
            className="p-2 text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
            title="تحديث يدوي"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-100 font-bold">
            <tr>
              <th className="py-3 px-4">وقت الدخول</th>
              <th className="py-3 px-4">المشترك</th>
              <th className="py-3 px-4">رقم اللاعب</th>
              <th className="py-3 px-4">الباقة الحالية</th>
              <th className="py-3 px-4">تاريخ انتهاء الاشتراك</th>
              <th className="py-3 px-4 text-center">حالة الدخول</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-400 text-sm">
                  {loading ? 'جاري جلب السجلات...' : 'لا يوجد حركات دخول مسجلة اليوم حتى الآن.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const member = log.members;
                const activeSub = member?.subscriptions?.find(s => s.status === 'ACTIVE');
                const timeString = new Date(log.scanned_at).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    {/* الوقت */}
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-700">
                      {timeString}
                    </td>

                    {/* الاسم */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {member?.full_name || 'غير معروف'}
                    </td>

                    {/* رقم اللاعب */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                        #{member?.player_number || '---'}
                      </span>
                    </td>

                    {/* الباقة */}
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                      {activeSub?.plans?.name || '---'}
                    </td>

                    {/* تاريخ الانتهاء */}
                    <td className="py-3.5 px-4 text-xs">
                      {activeSub?.end_date ? (
                        <div className="flex items-center gap-1 font-mono text-gray-700">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(activeSub.end_date).toLocaleDateString('ar-EG')}
                        </div>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>

                    {/* حالة الدخول */}
                    <td className="py-3.5 px-4 text-center">
                      {log.access_granted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle size={14} /> مقبـول
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full cursor-help"
                          title={log.rejection_reason || 'مرفوض'}
                        >
                          <XCircle size={14} /> مرفوض
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}