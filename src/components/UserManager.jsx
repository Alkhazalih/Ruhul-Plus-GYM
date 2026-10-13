import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserCheck, UserPlus, Shield, Trash2, Key } from 'lucide-react';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('COACH');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('app_users').insert({
        username: username.trim().toLowerCase(),
        password_hash: password,
        full_name: fullName,
        role: role
      });
      if (error) throw error;

      setUsername('');
      setPassword('');
      setFullName('');
      await fetchUsers();
      alert('تم إنشاء حساب المستخدم بنجاح!');
    } catch (e) {
      alert('خطأ أثناء الإنشاء (قد يكون اسم المستخدم مأخوذاً مسبقاً): ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب "${name}"؟`)) return;
    await supabase.from('app_users').delete().eq('id', id);
    await fetchUsers();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Shield className="text-indigo-600" size={26} />
          إدارة مستخدمي النظام والصلاحيات
        </h2>
        <p className="text-xs text-gray-500 mt-1">إضافة حسابات الكوتشات وموظفي الاستقبال وتعيين كلمات المرور</p>
      </div>

      {/* إضافة حساب */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-indigo-600" />
          إنشاء حساب جديد
        </h3>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
            <input
              required
              type="text"
              placeholder="مثلاً: كابتن أحمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">اسم المستخدم (Username)</label>
            <input
              required
              type="text"
              placeholder="coach_ahmed"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور (Password)</label>
            <input
              required
              type="text"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الصلاحية (الدور)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none bg-white font-bold"
            >
              <option value="COACH">كوتش (تمارين ودايت فقط)</option>
              <option value="ADMIN">آدمن / سكرتير (صلاحيات كاملة)</option>
            </select>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : 'حفظ الحساب الجديد'}
            </button>
          </div>
        </form>
      </div>

      {/* قائمة الحسابات القائمة */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 border-b text-xs text-gray-600">
            <tr>
              <th className="py-3 px-4">الاسم</th>
              <th className="py-3 px-4">اسم المستخدم</th>
              <th className="py-3 px-4">الدور / الصلاحية</th>
              <th className="py-3 px-4">كلمة المرور الحالية</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/60">
                <td className="py-3.5 px-4 font-bold text-gray-900">{u.full_name}</td>
                <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-bold">@{u.username}</td>
                <td className="py-3.5 px-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role === 'ADMIN' ? 'سكرتير / آدمن' : 'كوتش'}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{u.password_hash}</td>
                <td className="py-3.5 px-4 text-center">
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="حذف المستخدم"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}