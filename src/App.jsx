import React, { useState, useEffect } from 'react';
import GymDashboard from './components/GymDashboard';
import CheckInScanner from './components/CheckInScanner';
import PlansManagement from './components/PlansManagement';
import CoachPortal from './components/CoachPortal';
import UserManager from './components/UserManager';
import LoginScreen from './components/LoginScreen';
import { Users, Tag, Scan, Dumbbell, Shield, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    const saved = localStorage.getItem('ruhul_user');
    if (saved) {
      const u = JSON.parse(saved);
      setCurrentUser(u);
      setView(u.role === 'COACH' ? 'coach' : 'dashboard');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ruhul_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <LoginScreen 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setView(user.role === 'COACH' ? 'coach' : 'dashboard');
        }} 
      />
    );
  }

  if (view === 'scanner') {
    return <CheckInScanner onBack={() => setView(currentUser.role === 'COACH' ? 'coach' : 'dashboard')} />;
  }

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800" dir="rtl">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex flex-wrap justify-between items-center shadow-md">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-wider text-indigo-400">ruhul GYM</span>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAdmin && (
              <>
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Users size={15} /> المشتركين
                </button>

                <button
                  onClick={() => setView('plans')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    view === 'plans' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Tag size={15} /> الباقات والعروض
                </button>

                <button
                  onClick={() => setView('users')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    view === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Shield size={15} /> إدارة الكوتشات
                </button>
              </>
            )}

            {/* بوابة التمارين للكوتش (ومتاحة أيضاً للآدمن للاطلاع) */}
            <button
              onClick={() => setView('coach')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                view === 'coach' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Dumbbell size={15} /> بوابة التمارين والدايت
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {isAdmin && (
            <button 
              onClick={() => setView('scanner')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow"
            >
              <Scan size={15} /> شاشة الباركود
            </button>
          )}

          <div className="flex items-center gap-2 border-r border-slate-700 pr-3 mr-1 text-xs">
            <span className="text-slate-300 font-bold">{currentUser.full_name}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي حسب الاختيار والدور */}
      <main>
        {view === 'dashboard' && isAdmin && <GymDashboard />}
        {view === 'plans' && isAdmin && <PlansManagement />}
        {view === 'users' && isAdmin && <UserManager />}
        {view === 'coach' && <CoachPortal user={currentUser} />}
      </main>
    </div>
  );
}