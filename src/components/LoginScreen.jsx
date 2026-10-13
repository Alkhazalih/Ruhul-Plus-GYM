import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, User, Dumbbell, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: user, error: err } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username.trim())
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (err || !user) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة!');
      } else {
        localStorage.setItem('ruhul_user', JSON.stringify(user));
        onLoginSuccess(user);
      }
    } catch (e) {
      setError('تعذر الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">ruhul SYSTEM</h1>
          <p className="text-slate-400 text-xs mt-1">تسجيل الدخول للنظام (الإدارة / الكوتشات)</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-3 text-slate-500" size={18} />
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin أو اسم حساب الكوتش"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-500" size={18} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-6 disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/30"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}