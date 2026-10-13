import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';

export default function EditMemberModal({ isOpen, onClose, member, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name || '');
      setPhone(member.phone || '');
      setPlayerNumber(member.player_number || '');
    }
  }, [member]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({
          full_name: fullName,
          phone: phone,
          player_number: playerNumber
        })
        .eq('id', member.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      alert('خطأ أثناء التعديل: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">تعديل بيانات المشترك</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
            <input 
              required 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رقم اللاعب (الباركود)</label>
            <input 
              required 
              type="text" 
              value={playerNumber} 
              onChange={e => setPlayerNumber(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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