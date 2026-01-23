import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Dumbbell, Utensils, Trash2, Calendar, Search, Check, Star, User, FileText, Save, Pill, Droplets, Edit3, BookOpen, Video, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iwwpkxijzmzztidwfqjc.supabase.co',
  'sb_publishable_CMWAbofM1yVJeWGwLQgGkg_hycvKjfd'
);

const saveToStorage = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error('저장 실패:', e); }
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) { return defaultValue; }
};

export default function PTManagementApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('workout');
  const [viewMode, setViewMode] = useState('daily');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedMonthDate, setSelectedMonthDate] = useState(null);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userId, setUserId] = useState(() => loadFromStorage('pt-user-id', null));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [memoData, setMemoData] = useState({});
  const [memoSaved, setMemoSaved] = useState(true);
  const [editingLibraryExercise, setEditingLibraryExercise] = useState(null);
  const [showLibraryEditModal, setShowLibraryEditModal] = useState(false);
  const [showAddLibraryModal, setShowAddLibraryModal] = useState(false);
  const [newLibraryExercise, setNewLibraryExercise] = useState({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: null });
  const [supplements, setSupplements] = useState([]);
  const [supplementData, setSupplementData] = useState({});
  const [waterIntake, setWaterIntake] = useState({});
  const [showAddSupplementModal, setShowAddSupplementModal] = useState(false);
  const [newSupplement, setNewSupplement] = useState({ name: '', dosage: '' });
  const [expandedExercise, setExpandedExercise] = useState(null);

  const defaultLibrary = [
    { id: 'lib-1', name: 'MTS 로우', category: '등', sets: [{ weight: '30', reps: 15, sets: 1 }, { weight: '50', reps: 15, sets: 1 }, { weight: '70', reps: 10, sets: 2 }], description: '팔각도가 90도정도로 땡겨지게끔 의자 높이 맞춰주기', video: null, memo: '' },
    { id: 'lib-2', name: '뉴텍 하이로우', category: '등', sets: [{ weight: '20', reps: 15, sets: 1 }, { weight: '30', reps: 12, sets: 3 }], description: '뒷꿈치 들어 앉은 상태서 가슴 살짝 말아주기', video: null, memo: '' },
    { id: 'lib-3', name: '랫풀다운', category: '등', sets: [{ weight: '50', reps: 15, sets: 1 }, { weight: '60', reps: 10, sets: 3 }], description: '상체 세워준 상태서 어깨 낮춰주기', video: null, memo: '' },
    { id: 'lib-4', name: '체스트프레스', category: '가슴', sets: [{ weight: '26', reps: 15, sets: 1 }, { weight: '47', reps: 10, sets: 1 }], description: '어깨낮춰 광배 잡고 가슴 들어준 상태서 밀기', video: null, memo: '' },
    { id: 'lib-5', name: '벤치프레스', category: '가슴', sets: [{ weight: '20', reps: 15, sets: 4 }], description: '바를 내렸을 때 명치 위쪽으로', video: null, memo: '' },
  ];

  const [exerciseLibrary, setExerciseLibrary] = useState(defaultLibrary);
  const [workoutData, setWorkoutData] = useState({});
  const [dietData, setDietData] = useState({});

  const loadFromSupabase = async (uid) => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const { data: workouts } = await supabase.from('workouts').select('*').eq('user_id', uid);
      if (workouts) {
        const obj = {};
        workouts.forEach(w => { obj[w.date] = { category: w.category, isPT: w.is_pt, exercises: w.exercises || [] }; });
        setWorkoutData(obj);
      }
      const { data: diets } = await supabase.from('diets').select('*').eq('user_id', uid);
      if (diets) {
        const obj = {};
        diets.forEach(d => { obj[d.date] = { meals: d.meals || [] }; });
        setDietData(obj);
      }
      const { data: library } = await supabase.from('exercise_library').select('*').eq('user_id', uid);
      if (library && library.length > 0) {
        setExerciseLibrary(library.map(ex => ({ id: ex.id, name: ex.name, category: ex.category, sets: ex.sets || [], description: ex.description, video: ex.video, memo: ex.memo || '' })));
      } else {
        await saveLibraryToSupabase(uid, defaultLibrary);
        setExerciseLibrary(defaultLibrary);
      }
      const { data: memos } = await supabase.from('memos').select('*').eq('user_id', uid);
      if (memos) {
        const obj = {};
        memos.forEach(m => { obj[m.date] = m.content || ''; });
        setMemoData(obj);
      }
      const { data: supps } = await supabase.from('supplements').select('*').eq('user_id', uid);
      if (supps) setSupplements(supps.map(s => ({ id: s.id, name: s.name, dosage: s.dosage })));
      const { data: suppData } = await supabase.from('supplement_logs').select('*').eq('user_id', uid);
      if (suppData) {
        const obj = {};
        suppData.forEach(s => { obj[s.date] = s.taken || []; });
        setSupplementData(obj);
      }
      const { data: waterData } = await supabase.from('water_logs').select('*').eq('user_id', uid);
      if (waterData) {
        const obj = {};
        waterData.forEach(w => { obj[w.date] = w.amount || 0; });
        setWaterIntake(obj);
      }
    } catch (error) { console.error('불러오기 실패:', error); }
    setIsLoading(false);
  };

  const saveWorkoutToSupabase = async (date, data) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      await supabase.from('workouts').upsert({ user_id: userId, date, category: data.category, is_pt: data.isPT, exercises: data.exercises }, { onConflict: 'user_id,date' });
    } catch (error) { console.error('운동 저장 실패:', error); }
    setIsSyncing(false);
  };

  const saveDietToSupabase = async (date, data) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      await supabase.from('diets').upsert({ user_id: userId, date, meals: data.meals }, { onConflict: 'user_id,date' });
    } catch (error) { console.error('식단 저장 실패:', error); }
    setIsSyncing(false);
  };

  const saveLibraryToSupabase = async (uid, library) => {
    if (!uid) return;
    try {
      await supabase.from('exercise_library').delete().eq('user_id', uid);
      if (library.length > 0) {
        await supabase.from('exercise_library').insert(library.map(ex => ({ user_id: uid, name: ex.name, category: ex.category, sets: ex.sets, description: ex.description, video: ex.video, memo: ex.memo })));
      }
    } catch (error) { console.error('라이브러리 저장 실패:', error); }
  };

  const saveMemoToSupabase = async (date) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      await supabase.from('memos').upsert({ user_id: userId, date, content: memoData[date] || '' }, { onConflict: 'user_id,date' });
      setMemoSaved(true);
    } catch (error) { console.error('메모 저장 실패:', error); }
    setIsSyncing(false);
  };

  const saveSupplementsToSupabase = async (supps) => {
    if (!userId) return;
    try {
      await supabase.from('supplements').delete().eq('user_id', userId);
      if (supps.length > 0) {
        await supabase.from('supplements').insert(supps.map(s => ({ user_id: userId, name: s.name, dosage: s.dosage })));
      }
    } catch (error) { console.error('영양제 저장 실패:', error); }
  };

  const saveSupplementLogToSupabase = async (date, taken) => {
    if (!userId) return;
    try {
      await supabase.from('supplement_logs').upsert({ user_id: userId, date, taken }, { onConflict: 'user_id,date' });
    } catch (error) { console.error('영양제 기록 저장 실패:', error); }
  };

  const saveWaterLogToSupabase = async (date, amount) => {
    if (!userId) return;
    try {
      await supabase.from('water_logs').upsert({ user_id: userId, date, amount }, { onConflict: 'user_id,date' });
    } catch (error) { console.error('물 기록 저장 실패:', error); }
  };

  const handleLogin = async () => {
    if (!loginInput.trim()) return;
    const uid = loginInput.trim().toLowerCase();
    setUserId(uid);
    saveToStorage('pt-user-id', uid);
    setShowLoginModal(false);
    setLoginInput('');
    await loadFromSupabase(uid);
  };

  const handleLogout = () => {
    setUserId(null);
    localStorage.removeItem('pt-user-id');
    setWorkoutData({});
    setDietData({});
    setExerciseLibrary(defaultLibrary);
    setMemoData({});
    setSupplements([]);
    setSupplementData({});
    setWaterIntake({});
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (userId) { loadFromSupabase(userId); }
    else { setIsLoading(false); setShowLoginModal(true); }
  }, []);

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatDisplayDate = (date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const changeDate = (days) => { const d = new Date(currentDate); d.setDate(d.getDate() + days); setCurrentDate(d); };
  const changeMonth = (months) => { const d = new Date(currentDate); d.setMonth(d.getMonth() + months); setCurrentDate(d); setSelectedMonthDate(null); };

  const getMonthDates = () => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) { dates.push(new Date(year, month, i)); }
    return dates;
  };

  const dateKey = formatDate(currentDate);
  const todayWorkout = workoutData[dateKey] || { category: '', exercises: [], isPT: false };
  const todayDiet = dietData[dateKey] || { meals: [] };
  const todayMemo = memoData[dateKey] || '';
  const todaySupplements = supplementData[dateKey] || [];
  const todayWater = waterIntake[dateKey] || 0;

  const [exerciseForm, setExerciseForm] = useState({ name: '', category: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, video: null, memo: '' });
  const [dietForm, setDietForm] = useState({ name: '', description: '' });

  const handleVideoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (type === 'exercise') setExerciseForm(p => ({ ...p, video: base64 }));
        else if (type === 'editing') setEditingExercise(p => ({ ...p, video: base64 }));
        else if (type === 'library') setNewLibraryExercise(p => ({ ...p, video: base64 }));
        else if (type === 'libraryEdit') setEditingLibraryExercise(p => ({ ...p, video: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportFromLibrary = () => {
    const toAdd = selectedExercises.map((id, idx) => {
      const ex = exerciseLibrary.find(e => e.id === id);
      return { ...ex, id: Date.now() + idx, sets: JSON.parse(JSON.stringify(ex.sets)) };
    });
    const cat = toAdd[0]?.category || todayWorkout.category || '미지정';
    const newData = { category: workoutData[dateKey]?.category || cat, isPT: workoutData[dateKey]?.isPT || false, exercises: [...(workoutData[dateKey]?.exercises || []), ...toAdd] };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    saveWorkoutToSupabase(dateKey, newData);
    setSelectedExercises([]);
    setShowLibraryModal(false);
  };

  const filteredLibrary = exerciseLibrary.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(librarySearchTerm.toLowerCase());
    const matchCat = selectedCategory === '전체' || ex.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = ['전체', '등', '가슴', '어깨', '하체', '팔', '코어'];

  const handleAddExercise = async () => {
    const newEx = { id: Date.now(), name: exerciseForm.name, category: exerciseForm.category || todayWorkout.category || '미지정', sets: exerciseForm.sets, description: exerciseForm.description, video: exerciseForm.video, memo: exerciseForm.memo };
    if (exerciseForm.saveToLibrary && !exerciseLibrary.find(e => e.name === exerciseForm.name)) {
      const newLib = [...exerciseLibrary, { ...newEx, id: `lib-${Date.now()}` }];
      setExerciseLibrary(newLib);
      await saveLibraryToSupabase(userId, newLib);
    }
    const newData = { category: workoutData[dateKey]?.category || exerciseForm.category || '미지정', isPT: exerciseForm.isPT || workoutData[dateKey]?.isPT || false, exercises: [...(workoutData[dateKey]?.exercises || []), newEx] };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
    setExerciseForm({ name: '', category: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, video: null, memo: '' });
    setShowAddModal(false);
  };

  const handleAddMeal = async () => {
    const newMeal = { id: Date.now(), ...dietForm };
    const newData = { meals: [...(dietData[dateKey]?.meals || []), newMeal] };
    setDietData(prev => ({ ...prev, [dateKey]: newData }));
    await saveDietToSupabase(dateKey, newData);
    setDietForm({ name: '', description: '' });
    setShowAddModal(false);
  };

  const handleDeleteExercise = async (id) => {
    const newData = { ...workoutData[dateKey], exercises: workoutData[dateKey].exercises.filter(e => e.id !== id) };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
  };

  const handleDeleteMeal = async (id) => {
    const newData = { ...dietData[dateKey], meals: dietData[dateKey].meals.filter(m => m.id !== id) };
    setDietData(prev => ({ ...prev, [dateKey]: newData }));
    await saveDietToSupabase(dateKey, newData);
  };

  const handleEditExercise = (ex) => { setEditingExercise({ ...ex, sets: JSON.parse(JSON.stringify(ex.sets)) }); setShowEditModal(true); };

  const handleSaveExercise = async () => {
    const newData = { ...workoutData[dateKey], exercises: workoutData[dateKey].exercises.map(ex => ex.id === editingExercise.id ? editingExercise : ex) };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
    setShowEditModal(false);
    setEditingExercise(null);
  };

  const handleEditLibraryExercise = (ex) => {
    setEditingLibraryExercise({ ...ex, sets: JSON.parse(JSON.stringify(ex.sets)) });
    setShowLibraryEditModal(true);
  };

  const handleSaveLibraryExercise = async () => {
    const newLib = exerciseLibrary.map(ex => ex.id === editingLibraryExercise.id ? editingLibraryExercise : ex);
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
    setShowLibraryEditModal(false);
    setEditingLibraryExercise(null);
  };

  const handleAddNewLibraryExercise = async () => {
    const newEx = { ...newLibraryExercise, id: `lib-${Date.now()}` };
    const newLib = [...exerciseLibrary, newEx];
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
    setNewLibraryExercise({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: null });
    setShowAddLibraryModal(false);
  };

  const handleDeleteFromLibrary = async (id) => {
    const newLib = exerciseLibrary.filter(ex => ex.id !== id);
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
  };

  const handleAddSupplement = async () => {
    const newSupp = { id: `supp-${Date.now()}`, ...newSupplement };
    const newSupps = [...supplements, newSupp];
    setSupplements(newSupps);
    await saveSupplementsToSupabase(newSupps);
    setNewSupplement({ name: '', dosage: '' });
    setShowAddSupplementModal(false);
  };

  const handleDeleteSupplement = async (id) => {
    const newSupps = supplements.filter(s => s.id !== id);
    setSupplements(newSupps);
    await saveSupplementsToSupabase(newSupps);
  };

  const toggleSupplementTaken = async (suppId) => {
    const taken = todaySupplements.includes(suppId) ? todaySupplements.filter(id => id !== suppId) : [...todaySupplements, suppId];
    setSupplementData(prev => ({ ...prev, [dateKey]: taken }));
    await saveSupplementLogToSupabase(dateKey, taken);
  };

  const updateWaterIntake = async (amount) => {
    const newAmount = Math.max(0, todayWater + amount);
    setWaterIntake(prev => ({ ...prev, [dateKey]: newAmount }));
    await saveWaterLogToSupabase(dateKey, newAmount);
  };

  // 운동별 메모 업데이트
  const updateExerciseMemo = async (exId, memo) => {
    const newData = { ...workoutData[dateKey], exercises: workoutData[dateKey].exercises.map(ex => ex.id === exId ? { ...ex, memo } : ex) };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
  };

  const updateEditingSet = (idx, field, val) => { setEditingExercise(prev => ({ ...prev, sets: prev.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };
  const addEditingSetRow = () => { setEditingExercise(prev => ({ ...prev, sets: [...prev.sets, { weight: '', reps: '', sets: 1 }] })); };
  const removeEditingSetRow = (idx) => { setEditingExercise(prev => ({ ...prev, sets: prev.sets.filter((_, i) => i !== idx) })); };

  const updateLibraryEditingSet = (idx, field, val) => { setEditingLibraryExercise(prev => ({ ...prev, sets: prev.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };
  const addLibraryEditingSetRow = () => { setEditingLibraryExercise(prev => ({ ...prev, sets: [...prev.sets, { weight: '', reps: '', sets: 1 }] })); };
  const removeLibraryEditingSetRow = (idx) => { setEditingLibraryExercise(prev => ({ ...prev, sets: prev.sets.filter((_, i) => i !== idx) })); };

  const updateNewLibrarySet = (idx, field, val) => { setNewLibraryExercise(prev => ({ ...prev, sets: prev.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };
  const addNewLibrarySetRow = () => { setNewLibraryExercise(prev => ({ ...prev, sets: [...prev.sets, { weight: '', reps: '', sets: 1 }] })); };
  const removeNewLibrarySetRow = (idx) => { setNewLibraryExercise(prev => ({ ...prev, sets: prev.sets.filter((_, i) => i !== idx) })); };

  const togglePT = async () => {
    const newData = { ...workoutData[dateKey], category: workoutData[dateKey]?.category || '', exercises: workoutData[dateKey]?.exercises || [], isPT: !workoutData[dateKey]?.isPT };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
  };

  const addSetRow = () => { setExerciseForm(prev => ({ ...prev, sets: [...prev.sets, { weight: '', reps: '', sets: 1 }] })); };
  const updateSetRow = (idx, field, val) => { setExerciseForm(prev => ({ ...prev, sets: prev.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };
  const removeSetRow = (idx) => { setExerciseForm(prev => ({ ...prev, sets: prev.sets.filter((_, i) => i !== idx) })); };

  const updateCategory = async (cat) => {
    const newData = { ...workoutData[dateKey], category: cat, isPT: workoutData[dateKey]?.isPT || false, exercises: workoutData[dateKey]?.exercises || [] };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
  };

  const toggleExerciseSelection = (id) => { setSelectedExercises(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const getAllMemos = () => {
    return Object.entries(memoData).filter(([date, content]) => content && content.trim()).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const categoryColors = {
    '등': { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
    '가슴': { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' },
    '하체': { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
    '어깨': { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
    '팔': { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', border: 'border-violet-200' },
    '코어': { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const SetInputRow = ({ set, index, onUpdate, onRemove, canRemove }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 relative">
        <input type="text" value={set.weight} onChange={(e) => onUpdate(index, 'weight', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="무게" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kg</span>
      </div>
      <div className="w-20 relative">
        <input type="number" value={set.reps} onChange={(e) => onUpdate(index, 'reps', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="횟수" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">개</span>
      </div>
      <div className="w-20 relative">
        <input type="number" value={set.sets} onChange={(e) => onUpdate(index, 'sets', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="세트" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">세트</span>
      </div>
      {canRemove && <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-red-500 p-1"><X size={16} /></button>}
    </div>
  );

  // 운동 카드 컴포넌트 (홈에서 바로 영상, 메모 보기)
  const ExerciseCard = ({ ex, onEdit, onDelete }) => {
    const [localMemo, setLocalMemo] = useState(ex.memo || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const handleMemoSave = () => {
      updateExerciseMemo(ex.id, localMemo);
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 영상 영역 */}
        {ex.video && (
          <div className="relative bg-black aspect-video">
            <video 
              ref={videoRef}
              src={ex.video} 
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        )}
        
        <div className="p-4">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{ex.name}</h3>
              {ex.category && <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[ex.category]?.light || 'bg-gray-100'} ${categoryColors[ex.category]?.text || 'text-gray-600'}`}>{ex.category}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(ex)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit3 size={16} /></button>
              <button onClick={() => onDelete(ex.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>

          {/* 세트 정보 */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            {ex.sets.map((set, idx) => (
              <div key={idx} className="flex items-center text-sm text-gray-600 py-1">
                <span className="w-14 text-gray-400">세트 {idx + 1}</span>
                <span className="font-semibold text-gray-900">{set.weight}kg</span>
                <span className="mx-2 text-gray-300">·</span>
                <span>{set.reps}개 × {set.sets}세트</span>
              </div>
            ))}
          </div>

          {/* 설명 */}
          {ex.description && <p className="text-sm text-gray-500 mb-3">{ex.description}</p>}

          {/* 메모 영역 */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">메모</span>
              {localMemo !== (ex.memo || '') && (
                <button onClick={handleMemoSave} className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg">저장</button>
              )}
            </div>
            <textarea
              value={localMemo}
              onChange={(e) => setLocalMemo(e.target.value)}
              placeholder="이 운동에 대한 메모..."
              rows={2}
              className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDailyView = () => (
    <div className="max-w-lg mx-auto px-4 py-6">
      {activeTab === 'workout' ? (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-2 block">오늘의 운동</label>
              <input type="text" value={todayWorkout.category} onChange={(e) => updateCategory(e.target.value)} placeholder="등, 가슴, 하체..." className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={togglePT} className={`px-4 py-3 rounded-xl flex items-center gap-2 font-medium ${todayWorkout.isPT ? 'bg-amber-400 text-amber-900' : 'bg-gray-100 text-gray-500'}`}>
                <Star size={16} fill={todayWorkout.isPT ? 'currentColor' : 'none'} />
                <span className="text-sm">PT</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {todayWorkout.exercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onEdit={handleEditExercise} onDelete={handleDeleteExercise} />
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowLibraryModal(true); setSelectedExercises([]); }} className="flex-1 py-3.5 bg-gray-100 rounded-xl flex items-center justify-center gap-2 font-medium text-gray-700 hover:bg-gray-200">
              <BookOpen size={18} />
              <span>라이브러리</span>
            </button>
            <button onClick={() => { setShowAddModal(true); setExerciseForm({ name: '', category: todayWorkout.category || '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: todayWorkout.isPT, video: null, memo: '' }); }} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-gray-800">
              <Plus size={18} />
              <span>새로 추가</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'diet' ? (
        <div>
          <div className="space-y-3">
            {todayDiet.meals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{meal.description}</p>
                  </div>
                  <button onClick={() => handleDeleteMeal(meal.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowAddModal(true); setDietForm({ name: '', description: '' }); }} className="w-full mt-6 py-3.5 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-gray-800">
            <Plus size={18} />
            <span>식단 추가</span>
          </button>
        </div>
      ) : activeTab === 'supplement' ? (
        <div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets size={20} className="text-blue-500" />
                <span className="font-semibold text-gray-900">물 섭취량</span>
              </div>
              <span className="text-2xl font-bold text-blue-500">{todayWater}ml</span>
            </div>
            <div className="flex gap-2">
              {[250, 500].map(amt => (
                <button key={amt} onClick={() => updateWaterIntake(amt)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">+{amt}ml</button>
              ))}
              <button onClick={() => updateWaterIntake(-250)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">-250ml</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-purple-500" />
                <span className="font-semibold text-gray-900">영양제</span>
              </div>
              <span className="text-sm text-gray-500">{todaySupplements.length}/{supplements.length}</span>
            </div>
            <div className="space-y-2">
              {supplements.map(supp => (
                <div key={supp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSupplementTaken(supp.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${todaySupplements.includes(supp.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                      {todaySupplements.includes(supp.id) && <Check size={14} className="text-white" />}
                    </button>
                    <div>
                      <p className={`font-medium ${todaySupplements.includes(supp.id) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{supp.name}</p>
                      {supp.dosage && <p className="text-xs text-gray-400">{supp.dosage}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSupplement(supp.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddSupplementModal(true)} className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:border-gray-300 flex items-center justify-center gap-2">
              <Plus size={16} />
              영양제 추가
            </button>
          </div>
        </div>
      ) : activeTab === 'memo' ? (
        <div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">{formatDisplayDate(currentDate)}</span>
              <button onClick={() => saveMemoToSupabase(dateKey)} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium ${memoSaved ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white'}`}>
                <Save size={14} />
                {memoSaved ? '저장됨' : '저장'}
              </button>
            </div>
            <textarea value={todayMemo} onChange={(e) => { setMemoData(prev => ({ ...prev, [dateKey]: e.target.value })); setMemoSaved(false); }} placeholder="오늘의 메모..." rows={8} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderLibraryView = () => (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">운동 라이브러리</h2>
        <button onClick={() => setShowAddLibraryModal(true)} className="px-4 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-800">
          <Plus size={16} />
          추가
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={librarySearchTerm} onChange={(e) => setLibrarySearchTerm(e.target.value)} placeholder="운동 검색..." className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
        ))}
      </div>
      
      {/* 카테고리별 운동 목록 */}
      {selectedCategory === '전체' ? (
        // 전체일 때는 카테고리별로 그룹화
        categories.filter(c => c !== '전체').map(cat => {
          const catExercises = exerciseLibrary.filter(ex => ex.category === cat);
          if (catExercises.length === 0) return null;
          return (
            <div key={cat} className="mb-6">
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${categoryColors[cat]?.text || 'text-gray-600'}`}>
                <span className={`w-3 h-3 rounded-full ${categoryColors[cat]?.bg || 'bg-gray-400'}`}></span>
                {cat} ({catExercises.length})
              </h3>
              <div className="space-y-2">
                {catExercises.map(ex => (
                  <div key={ex.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{ex.name}</h4>
                          {ex.video && <Video size={14} className="text-gray-400" />}
                        </div>
                        <div className="text-sm text-gray-500">{ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}{s.weight}kg {s.reps}개</span>)}</div>
                        {ex.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ex.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditLibraryExercise(ex)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit3 size={16} /></button>
                        <button onClick={() => { if (confirm(`"${ex.name}" 삭제?`)) handleDeleteFromLibrary(ex.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // 특정 카테고리 선택 시
        <div className="space-y-2">
          {filteredLibrary.map(ex => (
            <div key={ex.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{ex.name}</h4>
                    {ex.video && <Video size={14} className="text-gray-400" />}
                  </div>
                  <div className="text-sm text-gray-500">{ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}{s.weight}kg {s.reps}개</span>)}</div>
                  {ex.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ex.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditLibraryExercise(ex)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit3 size={16} /></button>
                  <button onClick={() => { if (confirm(`"${ex.name}" 삭제?`)) handleDeleteFromLibrary(ex.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMonthlyView = () => {
    const monthDates = getMonthDates();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const firstDay = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
    const selKey = selectedMonthDate ? formatDate(selectedMonthDate) : null;
    const selWorkout = selKey ? workoutData[selKey] : null;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((d, i) => <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
            {monthDates.map(date => {
              const key = formatDate(date);
              const data = workoutData[key];
              const diet = dietData[key];
              const isToday = formatDate(new Date()) === key;
              const isSel = selectedMonthDate && formatDate(selectedMonthDate) === key;
              const hasW = data?.exercises.length > 0;
              const hasD = diet?.meals.length > 0;
              return (
                <div key={key} onClick={() => setSelectedMonthDate(date)} className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center cursor-pointer relative ${isSel ? 'ring-2 ring-gray-900 bg-gray-900 text-white' : isToday ? 'ring-2 ring-gray-300' : 'hover:bg-gray-50'} ${hasW && !isSel ? categoryColors[data.category]?.light || 'bg-gray-100' : ''}`}>
                  {data?.isPT && <Star size={8} className={`absolute top-1 right-1 ${isSel ? 'text-amber-300' : 'text-amber-500'}`} fill="currentColor" />}
                  <span className={`text-sm font-medium ${isSel ? 'text-white' : hasW ? categoryColors[data.category]?.text : 'text-gray-600'}`}>{date.getDate()}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {hasW && <div className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : categoryColors[data.category]?.bg || 'bg-gray-400'}`} />}
                    {hasD && <div className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-500'}`} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {selectedMonthDate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{formatDisplayDate(selectedMonthDate)}</span>
                {selWorkout?.isPT && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1"><Star size={10} fill="currentColor" />PT</span>}
              </div>
              <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); }} className="text-sm text-gray-500 hover:text-gray-900">편집 →</button>
            </div>
            {selWorkout?.exercises.length > 0 ? (
              <div className="space-y-2">
                {selWorkout.exercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className={`w-6 h-6 rounded-full ${categoryColors[ex.category]?.bg || 'bg-gray-400'} text-white text-xs flex items-center justify-center font-medium`}>{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ex.name}</p>
                      <p className="text-xs text-gray-500">{ex.sets.map(s => `${s.weight}kg×${s.reps}`).join(' → ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">기록이 없습니다</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMemoListView = () => {
    const allMemos = getAllMemos();
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">전체 메모</h2>
        {allMemos.length > 0 ? (
          <div className="space-y-3">
            {allMemos.map(([date, content]) => (
              <div key={date} onClick={() => { setCurrentDate(new Date(date)); setViewMode('daily'); setActiveTab('memo'); }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md">
                <p className="text-sm font-medium text-gray-500 mb-1">{formatDisplayDate(new Date(date))}</p>
                <p className="text-gray-900 line-clamp-3">{content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">작성된 메모가 없습니다</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-3">
          <button onClick={() => { if (viewMode === 'daily') changeDate(-1); else if (viewMode === 'monthly') changeMonth(-1); }} className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronLeft size={20} className="text-gray-600" /></button>
          <div className="text-center">
            {viewMode === 'daily' && <h1 className="font-semibold text-gray-900">{formatDisplayDate(currentDate)}</h1>}
            {viewMode === 'monthly' && <h1 className="font-semibold text-gray-900">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {viewMode === 'library' && <h1 className="font-semibold text-gray-900">라이브러리</h1>}
            {viewMode === 'memos' && <h1 className="font-semibold text-gray-900">메모</h1>}
            {isSyncing && <p className="text-xs text-blue-500">동기화 중...</p>}
          </div>
          <button onClick={() => { if (viewMode === 'daily') changeDate(1); else if (viewMode === 'monthly') changeMonth(1); }} className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronRight size={20} className="text-gray-600" /></button>
        </div>
        <div className="flex gap-1 px-4 pb-3 max-w-2xl mx-auto overflow-x-auto">
          {[{ mode: 'daily', label: '일별' }, { mode: 'monthly', label: '월간' }, { mode: 'library', label: '라이브러리', icon: BookOpen }, { mode: 'memos', label: '메모', icon: FileText }].map(({ mode, label, icon: Icon }) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 whitespace-nowrap ${viewMode === mode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {Icon && <Icon size={14} />}
              {label}
            </button>
          ))}
          <button onClick={() => userId ? handleLogout() : setShowLoginModal(true)} className="ml-auto px-3 py-2 rounded-full bg-gray-100 flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-200 whitespace-nowrap">
            <User size={14} />
            {userId || '로그인'}
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="bg-white border-b border-gray-100">
          <div className="flex gap-1 px-4 py-2 max-w-lg mx-auto">
            {[{ tab: 'workout', label: '운동', icon: Dumbbell }, { tab: 'diet', label: '식단', icon: Utensils }, { tab: 'supplement', label: '영양제', icon: Pill }, { tab: 'memo', label: '메모', icon: FileText }].map(({ tab, label, icon: Icon }) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium ${activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'monthly' && renderMonthlyView()}
        {viewMode === 'library' && renderLibraryView()}
        {viewMode === 'memos' && renderMemoListView()}
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-4"><User size={28} className="text-white" /></div>
              <h2 className="text-xl font-bold text-gray-900">로그인</h2>
              <p className="text-sm text-gray-500 mt-1">닉네임을 입력하세요</p>
            </div>
            <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="닉네임" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin} disabled={!loginInput.trim()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-300">시작하기</button>
          </div>
        </div>
      )}

      {/* 라이브러리에서 가져오기 모달 */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">운동 가져오기</h2>
              <button onClick={() => setShowLibraryModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredLibrary.map(ex => {
                const isSel = selectedExercises.includes(ex.id);
                return (
                  <div key={ex.id} onClick={() => toggleExerciseSelection(ex.id)} className={`p-3 rounded-xl cursor-pointer ${isSel ? 'bg-gray-900 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{ex.name}</p>
                        <p className={`text-xs ${isSel ? 'text-gray-300' : 'text-gray-500'}`}>{ex.sets.map(s => `${s.weight}kg`).join(' → ')}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSel ? 'bg-white border-white' : 'border-gray-300'}`}>
                        {isSel && <Check size={12} className="text-gray-900" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedExercises.length > 0 && (
              <button onClick={handleImportFromLibrary} className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl font-medium">{selectedExercises.length}개 가져오기</button>
            )}
          </div>
        </div>
      )}

      {/* 운동 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{activeTab === 'workout' ? '운동 추가' : '식단 추가'}</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            {activeTab === 'workout' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">운동 이름</label>
                  <input type="text" value={exerciseForm.name} onChange={(e) => setExerciseForm(p => ({ ...p, name: e.target.value }))} placeholder="MTS 로우" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">분류</label>
                  <div className="flex gap-2 flex-wrap">
                    {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                      <button key={cat} onClick={() => setExerciseForm(p => ({ ...p, category: cat }))} className={`px-3 py-1.5 rounded-full text-sm font-medium ${exerciseForm.category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">세트 정보</label>
                  {exerciseForm.sets.map((s, i) => <SetInputRow key={i} set={s} index={i} onUpdate={updateSetRow} onRemove={removeSetRow} canRemove={exerciseForm.sets.length > 1} />)}
                  <button onClick={addSetRow} className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1 hover:text-gray-900"><Plus size={14} />세트 추가</button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">영상</label>
                  <label className="flex items-center justify-center w-full h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                    {exerciseForm.video ? (
                      <div className="text-center">
                        <Video size={24} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">영상 선택됨</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video size={24} className="mx-auto text-gray-300 mb-1" />
                        <span className="text-xs text-gray-400">영상 추가</span>
                      </div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'exercise')} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">설명</label>
                  <textarea value={exerciseForm.description} onChange={(e) => setExerciseForm(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={exerciseForm.isPT} onChange={(e) => setExerciseForm(p => ({ ...p, isPT: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-600">PT 수업</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={exerciseForm.saveToLibrary} onChange={(e) => setExerciseForm(p => ({ ...p, saveToLibrary: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-600">라이브러리 저장</span>
                  </label>
                </div>
                <button onClick={handleAddExercise} disabled={!exerciseForm.name} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-300">추가하기</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">식사</label>
                  <input type="text" value={dietForm.name} onChange={(e) => setDietForm(p => ({ ...p, name: e.target.value }))} placeholder="아침, 점심, 저녁" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">내용</label>
                  <textarea value={dietForm.description} onChange={(e) => setDietForm(p => ({ ...p, description: e.target.value }))} placeholder="먹은 음식" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
                <button onClick={handleAddMeal} disabled={!dietForm.name} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-300">추가하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 운동 편집 모달 */}
      {showEditModal && editingExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">운동 편집</h2>
              <button onClick={() => { setShowEditModal(false); setEditingExercise(null); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">운동 이름</label>
                <input type="text" value={editingExercise.name} onChange={(e) => setEditingExercise(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setEditingExercise(p => ({ ...p, category: cat }))} className={`px-3 py-1.5 rounded-full text-sm font-medium ${editingExercise.category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">세트 정보</label>
                {editingExercise.sets.map((s, i) => <SetInputRow key={i} set={s} index={i} onUpdate={updateEditingSet} onRemove={removeEditingSetRow} canRemove={editingExercise.sets.length > 1} />)}
                <button onClick={addEditingSetRow} className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1 hover:text-gray-900"><Plus size={14} />세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">영상</label>
                <label className="flex items-center justify-center w-full h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                  {editingExercise.video ? (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">영상 변경</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">영상 추가</span>
                    </div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'editing')} className="hidden" />
                </label>
                {editingExercise.video && (
                  <button onClick={() => setEditingExercise(p => ({ ...p, video: null }))} className="text-xs text-red-500 mt-2">영상 삭제</button>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">설명</label>
                <textarea value={editingExercise.description} onChange={(e) => setEditingExercise(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <button onClick={handleSaveExercise} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 라이브러리 운동 편집 모달 */}
      {showLibraryEditModal && editingLibraryExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">라이브러리 편집</h2>
              <button onClick={() => { setShowLibraryEditModal(false); setEditingLibraryExercise(null); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">운동 이름</label>
                <input type="text" value={editingLibraryExercise.name} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setEditingLibraryExercise(p => ({ ...p, category: cat }))} className={`px-3 py-1.5 rounded-full text-sm font-medium ${editingLibraryExercise.category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">세트 정보</label>
                {editingLibraryExercise.sets.map((s, i) => <SetInputRow key={i} set={s} index={i} onUpdate={updateLibraryEditingSet} onRemove={removeLibraryEditingSetRow} canRemove={editingLibraryExercise.sets.length > 1} />)}
                <button onClick={addLibraryEditingSetRow} className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1 hover:text-gray-900"><Plus size={14} />세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">영상</label>
                <label className="flex items-center justify-center w-full h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                  {editingLibraryExercise.video ? (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">영상 변경</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">영상 추가</span>
                    </div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'libraryEdit')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">설명</label>
                <textarea value={editingLibraryExercise.description} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <button onClick={handleSaveLibraryExercise} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 라이브러리 운동 추가 모달 */}
      {showAddLibraryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">라이브러리에 추가</h2>
              <button onClick={() => setShowAddLibraryModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">운동 이름</label>
                <input type="text" value={newLibraryExercise.name} onChange={(e) => setNewLibraryExercise(p => ({ ...p, name: e.target.value }))} placeholder="운동 이름" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setNewLibraryExercise(p => ({ ...p, category: cat }))} className={`px-3 py-1.5 rounded-full text-sm font-medium ${newLibraryExercise.category === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">세트 정보</label>
                {newLibraryExercise.sets.map((s, i) => <SetInputRow key={i} set={s} index={i} onUpdate={updateNewLibrarySet} onRemove={removeNewLibrarySetRow} canRemove={newLibraryExercise.sets.length > 1} />)}
                <button onClick={addNewLibrarySetRow} className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1 hover:text-gray-900"><Plus size={14} />세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">영상</label>
                <label className="flex items-center justify-center w-full h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                  {newLibraryExercise.video ? (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">영상 선택됨</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video size={24} className="mx-auto text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">영상 추가</span>
                    </div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'library')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">설명</label>
                <textarea value={newLibraryExercise.description} onChange={(e) => setNewLibraryExercise(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <button onClick={handleAddNewLibraryExercise} disabled={!newLibraryExercise.name} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-300">추가하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 영양제 추가 모달 */}
      {showAddSupplementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">영양제 추가</h2>
              <button onClick={() => setShowAddSupplementModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">영양제 이름</label>
                <input type="text" value={newSupplement.name} onChange={(e) => setNewSupplement(p => ({ ...p, name: e.target.value }))} placeholder="비타민D" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">복용량 (선택)</label>
                <input type="text" value={newSupplement.dosage} onChange={(e) => setNewSupplement(p => ({ ...p, dosage: e.target.value }))} placeholder="1정, 2캡슐 등" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <button onClick={handleAddSupplement} disabled={!newSupplement.name} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium disabled:bg-gray-300">추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
