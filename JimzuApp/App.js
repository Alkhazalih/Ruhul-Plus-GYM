import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Barcode from 'react-native-barcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from './supabase';

export default function App() {
  const [member, setMember] = useState(null);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempMember, setTempMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card');

  const [workouts, setWorkouts] = useState([]);
  const [dietPlan, setDietPlan] = useState(null);

  useEffect(() => {
    checkSavedSession();
  }, []);

  const checkSavedSession = async () => {
    try {
      const saved = await AsyncStorage.getItem('ruhul_member_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setMember(parsed);
          loadMemberDetails(parsed.id);
        }
      }
    } catch (e) {
      console.error('Session load error', e);
    }
  };

  const handleCheckPhone = async () => {
    if (!phone.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          player_number,
          phone,
          height,
          weight,
          coach_notes,
          app_password,
          subscriptions (
            status,
            end_date,
            plans ( name )
          )
        `)
        .eq('phone', phone.trim())
        .maybeSingle();

      if (error || !data) {
        Alert.alert('خطأ', 'رقم الهاتف غير مسجل بالنظام! راجع إدارة الجيم.');
        return;
      }

      setTempMember(data);
      if (!data.app_password) {
        setStep('set_pass');
      } else {
        setStep('enter_pass');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSetInitialPassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert('تنبيه', 'يجب أن تتكون كلمة المرور من 4 خانات على الأقل');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase
        .from('members')
        .update({ app_password: newPassword })
        .eq('id', tempMember.id);

      if (error) throw error;

      const updated = { ...tempMember, app_password: newPassword };
      await loginSuccess(updated);
    } catch (e) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithPassword = async () => {
    if (password === tempMember.app_password) {
      await loginSuccess(tempMember);
    } else {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة!');
    }
  };

  const loginSuccess = async (m) => {
    try {
      setMember(m);
      await AsyncStorage.setItem('ruhul_member_session', JSON.stringify(m));
      loadMemberDetails(m.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('ruhul_member_session');
    setMember(null);
    setStep('phone');
    setPhone('');
    setPassword('');
    setNewPassword('');
    setWorkouts([]);
    setDietPlan(null);
  };

  const loadMemberDetails = async (memberId) => {
    try {
      const { data: wData } = await supabase
        .from('member_workouts')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });
      if (wData) setWorkouts(wData);

      const { data: dData } = await supabase
        .from('member_diet_plans')
        .select('*')
        .eq('member_id', memberId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (dData) setDietPlan(dData);
    } catch (e) {
      console.warn('Failed to load workouts/diet', e);
    }
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authWrapper}>
          <MaterialCommunityIcons name="dumbbell" size={50} color="#6366f1" style={{ alignSelf: 'center' }} />
          <Text style={styles.authTitle}>PLUS GYM</Text>
          <Text style={styles.authSubtitle}>تطبيق المشتركين الرسمي</Text>

          <View style={styles.cardBox}>
            {step === 'phone' && (
              <>
                <Text style={styles.label}>رقم الهاتف المسجل</Text>
                <TextInput
                  style={styles.input}
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckPhone} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>متابعة</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 'set_pass' && (
              <>
                <Text style={styles.welcomeText}>مرحباً {tempMember?.full_name}!</Text>
                <Text style={styles.label}>عين كلمة مرور جديدة لحسابك:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10b981' }]} onPress={handleSetInitialPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>تأكيد والدخول</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 'enter_pass' && (
              <>
                <Text style={styles.welcomeText}>أهلاً بعودتك، {tempMember?.full_name}</Text>
                <Text style={styles.label}>أدخل كلمة المرور</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLoginWithPassword}>
                  <Text style={styles.btnText}>تسجيل الدخول</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('phone')} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 12 }}>تغيير رقم الهاتف</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const subscriptions = Array.isArray(member?.subscriptions) ? member.subscriptions : [];
  const activeSub = subscriptions.find(s => s?.status === 'ACTIVE');
  const barcodeValue = String(member?.player_number || '1000').trim().toUpperCase();

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerName}>{member?.full_name || 'مشترك'}</Text>
          <Text style={styles.headerNumber}>#{barcodeValue}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'card' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('card')}
        >
          <Text style={[styles.tabText, activeTab === 'card' && styles.activeTabText]}>كرت الدخول</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'workouts' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('workouts')}
        >
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>التمارين</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'diet' && styles.activeTabBtn]} 
          onPress={() => setActiveTab('diet')}
        >
          <Text style={[styles.tabText, activeTab === 'diet' && styles.activeTabText]}>الدايت</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'card' && (
          <View>
            <View style={styles.barcodeCard}>
              <Text style={styles.barcodeHeader}>ruhul MEMBER PASS</Text>
              <Text style={styles.barcodePlayerName}>{member?.full_name}</Text>
              
              <View style={styles.barcodeSvgContainer}>
                <Barcode
                  value={barcodeValue}
                  format="CODE39"
                  singleBarWidth={2.4}
                  maxWidth={280}
                  height={65}
                  lineColor="#000000"
                  backgroundColor="#ffffff"
                />
              </View>

              <Text style={styles.barcodeCodeNumber}>{barcodeValue}</Text>
              <Text style={styles.barcodeHelp}>وجه الباركود نحو مسدس الاستقبال</Text>
            </View>

            <View style={[styles.statusBox, { borderColor: activeSub ? '#10b981' : '#f43f5e' }]}>
              <Ionicons 
                name={activeSub ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={activeSub ? "#10b981" : "#f43f5e"} 
              />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.statusTitle}>{activeSub?.plans?.name || 'لا يوجد اشتراك نشط'}</Text>
                <Text style={styles.statusSub}>
                  {activeSub?.end_date 
                    ? `ينتهي بتاريخ: ${new Date(activeSub.end_date).toLocaleDateString('ar-EG')}` 
                    : 'راجع كاونتر الاستقبال للتجديد'}
                </Text>
              </View>
            </View>

            <View style={styles.metricsBox}>
              <Text style={styles.sectionTitle}>القياسات البدنية (الكوتش)</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>الوزن</Text>
                  <Text style={styles.metricVal}>{member?.weight ? `${member.weight} كغ` : '---'}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>الطول</Text>
                  <Text style={styles.metricVal}>{member?.height ? `${member.height} سم` : '---'}</Text>
                </View>
              </View>
              {member?.coach_notes ? (
                <View style={styles.notesBox}>
                  <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: 'bold' }}>ملاحظات المدرب:</Text>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>{member.coach_notes}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === 'workouts' && (
          <View>
            <Text style={styles.sectionTitle}>جدول التمارين اليومي</Text>
            {workouts.length === 0 ? (
              <Text style={styles.emptyText}>لم يضف لك الكوتش تمارين بعد.</Text>
            ) : (
              workouts.map((w) => (
                <View key={w.id} style={styles.workoutItem}>
                  <View>
                    <Text style={styles.dayTag}>{w.day_name}</Text>
                    <Text style={styles.workoutName}>{w.exercise_name}</Text>
                  </View>
                  <Text style={styles.repsTag}>{w.sets} × {w.reps}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'diet' && (
          <View>
            <Text style={styles.sectionTitle}>البرنامج الغذائي (Diet Plan)</Text>
            {dietPlan ? (
              <View style={styles.dietBox}>
                <Text style={styles.dietTitle}>{dietPlan.title}</Text>
                <Text style={styles.dietContent}>{dietPlan.content}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>لم يحدد لك الكوتش برنامجاً غذائياً بعد.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkContainer: { flex: 1, backgroundColor: '#020617' },
  authWrapper: { flex: 1, justifyContent: 'center', padding: 24 },
  authTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginTop: 10 },
  authSubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 25 },
  cardBox: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 6, textAlign: 'right', fontWeight: 'bold' },
  input: { backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  primaryBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  welcomeText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerNumber: { fontSize: 12, color: '#818cf8', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#1e293b', padding: 8, borderRadius: 10 },
  tabContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#0f172a' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: '#6366f1' },
  tabText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
  activeTabText: { color: '#fff' },
  barcodeCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 16 },
  barcodeHeader: { fontSize: 11, fontWeight: 'bold', color: '#6366f1', letterSpacing: 2 },
  barcodePlayerName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginVertical: 4 },
  barcodeSvgContainer: { marginVertical: 10, alignItems: 'center', minHeight: 65, minWidth: 200 },
  barcodeCodeNumber: { fontSize: 16, fontWeight: 'bold', color: '#000', letterSpacing: 5, fontFamily: 'monospace' },
  barcodeHelp: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  statusTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  statusSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  metricsBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 6, textAlign: 'right' },
  metricItem: { flex: 0.48, backgroundColor: '#020617', padding: 12, borderRadius: 12, alignItems: 'center' },
  metricLabel: { color: '#64748b', fontSize: 11 },
  metricVal: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  notesBox: { backgroundColor: '#020617', padding: 12, borderRadius: 12, marginTop: 10 },
  workoutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 14, borderRadius: 14, marginBottom: 10 },
  dayTag: { color: '#818cf8', fontSize: 10, fontWeight: 'bold' },
  workoutName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  repsTag: { color: '#e2e8f0', backgroundColor: '#020617', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: 'bold' },
  dietBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16 },
  dietTitle: { color: '#818cf8', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  dietContent: { color: '#cbd5e1', fontSize: 13, lineHeight: 22 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 30, fontSize: 13 }
});