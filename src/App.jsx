import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Video, Dumbbell, Utensils, Trash2, Calendar, Play, Download, Search, Check, Star, User, FileText, Save, Pill, Droplets, Edit3, BookOpen, Camera } from 'lucide-react';
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
  const [supplements, setSupplements] = useState([]);
  const [supplementData, setSupplementData] = useState({});
  const [waterIntake, setWaterIntake] = useState({});
  const [showAddSupplementModal, setShowAddSupplementModal] = useState(false);
  const [newSupplement, setNewSupplement] = useState({ name: '', dosage: '' });
  const [editingSupplement, setEditingSupplement] = useState(null);
  const [showEditSupplementModal, setShowEditSupplementModal] = useState(false);
  const [showLibraryEditModal, setShowLibraryEditModal] = useState(false);
  const [editingLibraryExercise, setEditingLibraryExercise] = useState(null);
  const [showAddLibraryModal, setShowAddLibraryModal] = useState(false);
  const [newLibraryExercise, setNewLibraryExercise] = useState({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: null });
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  const uploadVideoToStorage = async (file) => {
    if (!userId || !file) return null;
    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('video').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('video').getPublicUrl(fileName);
      setUploadingVideo(false);
      return urlData.publicUrl;
    } catch (error) {
      console.error('영상 업로드 실패:', error);
      setUploadingVideo(false);
      return null;
    }
  };

  const uploadImageToStorage = async (file) => {
    if (!userId || !file) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('video').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('video').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      return null;
    }
  };

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
  const changeWeek = (weeks) => { const d = new Date(currentDate); d.setDate(d.getDate() + (weeks * 7)); setCurrentDate(d); };
  const changeMonth = (months) => { const d = new Date(currentDate); d.setMonth(d.getMonth() + months); setCurrentDate(d); setSelectedMonthDate(null); };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

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

  const [exerciseForm, setExerciseForm] = useState({ name: '', category: '', video: null, sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, memo: '' });
  const [dietForm, setDietForm] = useState({ name: '', description: '', photo: null });

  const handleVideoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadVideoToStorage(file);
    if (url) {
      if (type === 'exercise') setExerciseForm(p => ({ ...p, video: url }));
      else if (type === 'editing') setEditingExercise(p => ({ ...p, video: url }));
      else if (type === 'library') setNewLibraryExercise(p => ({ ...p, video: url }));
      else if (type === 'libraryEdit') setEditingLibraryExercise(p => ({ ...p, video: url }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadImageToStorage(file);
    if (url) setDietForm(p => ({ ...p, photo: url }));
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
    setExerciseForm({ name: '', category: '', video: null, sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, memo: '' });
    setShowAddModal(false);
  };

  const handleAddMeal = async () => {
    const newMeal = { id: Date.now(), ...dietForm };
    const newData = { meals: [...(dietData[dateKey]?.meals || []), newMeal] };
    setDietData(prev => ({ ...prev, [dateKey]: newData }));
    await saveDietToSupabase(dateKey, newData);
    setDietForm({ name: '', description: '', photo: null });
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

  const handleEditLibraryExercise = (ex) => { setEditingLibraryExercise({ ...ex, sets: JSON.parse(JSON.stringify(ex.sets)) }); setShowLibraryEditModal(true); };

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

  const handleEditSupplement = (supp) => { setEditingSupplement({ ...supp }); setShowEditSupplementModal(true); };

  const handleSaveSupplement = async () => {
    const newSupps = supplements.map(s => s.id === editingSupplement.id ? editingSupplement : s);
    setSupplements(newSupps);
    await saveSupplementsToSupabase(newSupps);
    setShowEditSupplementModal(false);
    setEditingSupplement(null);
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

  const getAllMemos = () => Object.entries(memoData).filter(([date, content]) => content && content.trim()).sort((a, b) => b[0].localeCompare(a[0]));

  const getWeeklyStats = () => {
    const weekDates = getWeekDates();
    const stats = { totalDays: 0, categories: {}, exercises: {}, totalSets: 0, ptDays: 0 };
    weekDates.forEach(date => {
      const key = formatDate(date);
      const data = workoutData[key];
      if (data && data.exercises.length > 0) {
        stats.totalDays++;
        if (data.isPT) stats.ptDays++;
        if (data.category) stats.categories[data.category] = (stats.categories[data.category] || 0) + 1;
        data.exercises.forEach(ex => {
          stats.exercises[ex.name] = (stats.exercises[ex.name] || 0) + 1;
          ex.sets.forEach(s => stats.totalSets += parseInt(s.sets) || 1);
        });
      }
    });
    return stats;
  };

  const categoryColors = {
    '등': { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20' },
    '가슴': { bg: 'bg-rose-500', text: 'text-rose-400', light: 'bg-rose-500/20' },
    '하체': { bg: 'bg-emerald-500', text: 'text-emerald-400', light: 'bg-emerald-500/20' },
    '어깨': { bg: 'bg-amber-500', text: 'text-amber-400', light: 'bg-amber-500/20' },
    '팔': { bg: 'bg-violet-500', text: 'text-violet-400', light: 'bg-violet-500/20' },
    '코어': { bg: 'bg-cyan-500', text: 'text-cyan-400', light: 'bg-cyan-500/20' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const SetInputRow = ({ set, index, onUpdate, onRemove, canRemove }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 relative">
        <input type="text" value={set.weight} onChange={(e) => onUpdate(index, 'weight', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-white/30" placeholder="무게" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">kg</span>
      </div>
      <div className="w-20 relative">
        <input type="number" value={set.reps} onChange={(e) => onUpdate(index, 'reps', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-7 text-sm text-white focus:outline-none focus:border-white/30" placeholder="횟수" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">개</span>
      </div>
      <div className="w-20 relative">
        <input type="number" value={set.sets} onChange={(e) => onUpdate(index, 'sets', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-white/30" placeholder="세트" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs">세트</span>
      </div>
      {canRemove && <button onClick={() => onRemove(index)} className="text-white/30 hover:text-red-400 p-1"><X size={16} /></button>}
    </div>
  );

  const ExerciseCard = ({ ex, onEdit, onDelete }) => {
    const [localMemo, setLocalMemo] = useState(ex.memo || '');
    const handleMemoSave = () => { updateExerciseMemo(ex.id, localMemo); };

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        {ex.video && (
          <div className="relative bg-black aspect-video">
            <video src={ex.video} className="w-full h-full object-contain" controls playsInline preload="metadata" />
          </div>
        )}
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{ex.name}</h3>
              {ex.category && <span className={`text-xs px-2.5 py-1 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'}`}>{ex.category}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(ex)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg"><Edit3 size={16} /></button>
              <button onClick={() => onDelete(ex.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 mb-4">
            {ex.sets.map((set, idx) => (
              <div key={idx} className="flex items-center text-sm py-2 border-b border-white/5 last:border-0">
                <span className="text-white/30 w-16 font-medium">세트 {idx + 1}</span>
                <span className="text-amber-400 font-semibold flex-1">{set.weight}kg</span>
                <span className="text-white/80">{set.reps}개 × {set.sets}세트</span>
              </div>
            ))}
          </div>
          {ex.description && <p className="text-sm text-white/50 leading-relaxed mb-4">{ex.description}</p>}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/40">메모</span>
              {localMemo !== (ex.memo || '') && <button onClick={handleMemoSave} className="text-xs px-2 py-1 bg-blue-500 text-white rounded-lg">저장</button>}
            </div>
            <textarea value={localMemo} onChange={(e) => setLocalMemo(e.target.value)} placeholder="이 운동에 대한 메모..." rows={2} className="w-full bg-black/20 border-0 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
          </div>
        </div>
      </div>
    );
  };

  const renderDailyView = () => (
    <div className="max-w-lg mx-auto px-5 py-6">
      {activeTab === 'workout' ? (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-medium text-white/40 mb-2 block uppercase">종목</label>
              <input type="text" value={todayWorkout.category} onChange={(e) => updateCategory(e.target.value)} placeholder="등, 가슴, 하체..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={togglePT} className={`px-5 py-3.5 rounded-2xl flex items-center gap-2 transition-all ${todayWorkout.isPT ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-lg shadow-amber-500/25' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                <Star size={16} fill={todayWorkout.isPT ? 'currentColor' : 'none'} />
                <span className="text-sm font-semibold">PT</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {todayWorkout.exercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onEdit={handleEditExercise} onDelete={handleDeleteExercise} />
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowLibraryModal(true); setSelectedExercises([]); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-medium">
              <Download size={18} />
              <span>가져오기</span>
            </button>
            <button onClick={() => { setShowAddModal(true); setExerciseForm({ name: '', category: todayWorkout.category || '', video: null, sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: todayWorkout.isPT, memo: '' }); }} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/25">
              <Plus size={18} />
              <span>새로 추가</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'diet' ? (
        <div>
          <div className="space-y-4">
            {todayDiet.meals.map((meal) => (
              <div key={meal.id} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                {meal.photo && <img src={meal.photo} alt={meal.name} className="w-full aspect-video object-cover" />}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-emerald-400">{meal.name}</h3>
                    <button onClick={() => handleDeleteMeal(meal.id)} className="text-white/30 hover:text-rose-400 p-2"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-sm text-white/60 mt-2">{meal.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowAddModal(true); setDietForm({ name: '', description: '', photo: null }); }} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/25">
            <Plus size={18} />
            <span>식단 추가</span>
          </button>
        </div>
      ) : activeTab === 'supplement' ? (
        <div>
          <div className="bg-white/5 backdrop-blur rounded-3xl p-5 border border-white/10 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplets size={20} className="text-blue-400" />
                <span className="font-semibold text-white">물 섭취량</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">{todayWater}ml</span>
            </div>
            <div className="flex gap-2">
              {[250, 500].map(amt => (
                <button key={amt} onClick={() => updateWaterIntake(amt)} className="flex-1 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30">+{amt}ml</button>
              ))}
              <button onClick={() => updateWaterIntake(-250)} className="px-4 py-2.5 bg-white/5 text-white/50 rounded-xl text-sm font-medium hover:bg-white/10">-250ml</button>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-purple-400" />
                <span className="font-semibold text-white">영양제</span>
              </div>
              <span className="text-sm text-white/50">{todaySupplements.length}/{supplements.length}</span>
            </div>
            <div className="space-y-2">
              {supplements.map(supp => (
                <div key={supp.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSupplementTaken(supp.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${todaySupplements.includes(supp.id) ? 'bg-purple-500 border-purple-500' : 'border-white/30'}`}>
                      {todaySupplements.includes(supp.id) && <Check size={14} className="text-white" />}
                    </button>
                    <div>
                      <p className={`font-medium ${todaySupplements.includes(supp.id) ? 'text-white/40 line-through' : 'text-white'}`}>{supp.name}</p>
                      {supp.dosage && <p className="text-xs text-white/30">{supp.dosage}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditSupplement(supp)} className="p-1.5 text-white/30 hover:text-white"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteSupplement(supp.id)} className="p-1.5 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddSupplementModal(true)} className="w-full mt-3 py-2.5 border border-dashed border-white/20 rounded-xl text-white/40 text-sm font-medium hover:border-white/30 flex items-center justify-center gap-2">
              <Plus size={16} />
              영양제 추가
            </button>
          </div>
        </div>
      ) : activeTab === 'memo' ? (
        <div>
          <div className="bg-white/5 backdrop-blur rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white">{formatDisplayDate(currentDate)}</span>
              <button onClick={() => saveMemoToSupabase(dateKey)} className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium ${memoSaved ? 'bg-white/5 text-white/40' : 'bg-blue-500 text-white'}`}>
                <Save size={14} />
                {memoSaved ? '저장됨' : '저장'}
              </button>
            </div>
            <textarea value={todayMemo} onChange={(e) => { setMemoData(prev => ({ ...prev, [dateKey]: e.target.value })); setMemoSaved(false); }} placeholder="오늘의 메모..." rows={8} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    const stats = getWeeklyStats();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/10">
          <h3 className="text-sm font-medium text-white/40 mb-4 uppercase">이번주 요약</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.totalDays}</div>
              <div className="text-xs text-white/40 mt-1">운동</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stats.ptDays}</div>
              <div className="text-xs text-white/40 mt-1">PT</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{stats.totalSets}</div>
              <div className="text-xs text-white/40 mt-1">세트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{Object.keys(stats.exercises).length}</div>
              <div className="text-xs text-white/40 mt-1">종류</div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {weekDates.map((date, idx) => {
            const key = formatDate(date);
            const data = workoutData[key];
            const diet = dietData[key];
            const isToday = formatDate(new Date()) === key;
            return (
              <div key={key} className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 border cursor-pointer hover:bg-white/10 ${isToday ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10'}`} onClick={() => { setCurrentDate(date); setViewMode('daily'); }}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${isToday ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>{days[idx]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/40 text-sm">{date.getMonth() + 1}/{date.getDate()}</span>
                      {data?.isPT && <Star size={14} className="text-amber-400" fill="currentColor" />}
                    </div>
                    {data?.exercises.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.exercises.map(ex => <span key={ex.id} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">{ex.name}</span>)}
                      </div>
                    ) : <p className="text-white/30 text-sm">휴식일</p>}
                  </div>
                  <div className="text-right">
                    {data?.category && <span className={`text-xs px-3 py-1.5 rounded-full ${categoryColors[data.category]?.bg || 'bg-white/20'}`}>{data.category}</span>}
                    {diet?.meals.length > 0 && <div className="text-xs text-emerald-400 mt-1">{diet.meals.length}끼</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const monthDates = getMonthDates();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const firstDay = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
    const selKey = selectedMonthDate ? formatDate(selectedMonthDate) : null;
    const selWorkout = selKey ? workoutData[selKey] : null;
    const selDiet = selKey ? dietData[selKey] : null;
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 mb-5 border border-white/10">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((d, i) => <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? 'text-rose-400/70' : 'text-white/30'}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
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
                <div key={key} onClick={() => setSelectedMonthDate(date)} className={`aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer relative ${isSel ? 'ring-2 ring-white shadow-lg scale-105' : ''} ${isToday && !isSel ? 'ring-2 ring-blue-500' : ''} ${hasW ? categoryColors[data.category]?.bg || 'bg-white/20' : hasD ? 'bg-emerald-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
                  {data?.isPT && <Star size={8} className="absolute top-1 right-1 text-amber-300" fill="currentColor" />}
                  <span className={`text-sm font-medium ${hasW || hasD ? 'text-white' : 'text-white/50'}`}>{date.getDate()}</span>
                  {hasW && <span className="text-[10px] text-white/80 font-medium">{data.category}</span>}
                  {hasD && <span className="text-[10px] text-white/70">{diet.meals.length}끼</span>}
                </div>
              );
            })}
          </div>
        </div>
        {selectedMonthDate && (
          <div className="space-y-4">
            <div className={`rounded-3xl p-5 ${selWorkout?.category ? categoryColors[selWorkout.category]?.bg : 'bg-white/10'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{formatDisplayDate(selectedMonthDate)}</h2>
                  {selWorkout?.isPT && <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full"><Star size={12} className="text-amber-300" fill="currentColor" /><span className="text-xs font-medium text-white/90">PT</span></div>}
                </div>
                <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium backdrop-blur">편집</button>
              </div>
            </div>
            {selWorkout?.exercises.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4"><Dumbbell size={18} className="text-white/40" /><span className="text-sm font-medium text-white/40">운동</span><span className={`text-sm font-semibold ${categoryColors[selWorkout.category]?.text || 'text-white'}`}>{selWorkout.category}</span></div>
                <div className="space-y-3">
                  {selWorkout.exercises.map((ex, idx) => (
                    <div key={ex.id} className="bg-black/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <h4 className="font-semibold text-white">{ex.name}</h4>
                        {ex.video && <Play size={14} className="text-blue-400" />}
                      </div>
                      {ex.video && <div className="mb-3 rounded-xl overflow-hidden"><video src={ex.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: '160px' }} /></div>}
                      <div className="flex flex-wrap gap-2 mb-2">{ex.sets.map((set, setIdx) => <span key={setIdx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-amber-400">{set.weight}kg · {set.reps}개 × {set.sets}</span>)}</div>
                      <p className="text-xs text-white/40 leading-relaxed">{ex.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selDiet?.meals.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4"><Utensils size={18} className="text-white/40" /><span className="text-sm font-medium text-white/40">식단</span><span className="text-sm font-semibold text-emerald-400">{selDiet.meals.length}끼</span></div>
                <div className="space-y-2">{selDiet.meals.map(meal => <div key={meal.id} className="bg-black/20 rounded-xl p-3 flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">{meal.name.charAt(0)}</span><div className="flex-1"><h4 className="font-medium text-white text-sm">{meal.name}</h4><p className="text-xs text-white/40">{meal.description}</p></div></div>)}</div>
              </div>
            )}
            {!selWorkout?.exercises.length && !selDiet?.meals.length && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4"><Calendar size={28} className="text-white/30" /></div>
                <p className="text-white/40 mb-5">기록이 없습니다</p>
                <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); }} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-medium shadow-lg shadow-blue-500/25">기록 추가하기</button>
              </div>
            )}
          </div>
        )}
        {!selectedMonthDate && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4"><Calendar size={28} className="text-white/30" /></div>
            <p className="text-white/40">날짜를 선택하세요</p>
          </div>
        )}
      </div>
    );
  };

  const renderLibraryView = () => (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">운동 라이브러리</h2>
        <button onClick={() => setShowAddLibraryModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} />추가
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input type="text" value={librarySearchTerm} onChange={(e) => setLibrarySearchTerm(e.target.value)} placeholder="검색..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? (cat === '전체' ? 'bg-white text-slate-900' : categoryColors[cat]?.bg || 'bg-white/20') : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{cat}</button>
        ))}
      </div>
      {selectedCategory === '전체' ? (
        categories.filter(c => c !== '전체').map(cat => {
          const catExercises = exerciseLibrary.filter(ex => ex.category === cat);
          if (catExercises.length === 0) return null;
          return (
            <div key={cat} className="mb-6">
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${categoryColors[cat]?.text || 'text-white/60'}`}>
                <span className={`w-3 h-3 rounded-full ${categoryColors[cat]?.bg || 'bg-white/30'}`}></span>
                {cat} ({catExercises.length})
              </h3>
              <div className="space-y-2">
                {catExercises.map(ex => (
                  <div key={ex.id} className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{ex.name}</h4>
                          {ex.video && <Video size={14} className="text-white/30" />}
                        </div>
                        <div className="text-sm text-white/40">{ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}{s.weight}kg {s.reps}개</span>)}</div>
                        {ex.description && <p className="text-xs text-white/30 mt-1 line-clamp-1">{ex.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditLibraryExercise(ex)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg"><Edit3 size={16} /></button>
                        <button onClick={() => { if (confirm(`"${ex.name}" 삭제?`)) handleDeleteFromLibrary(ex.id); }} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-2">
          {filteredLibrary.map(ex => (
            <div key={ex.id} className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{ex.name}</h4>
                    {ex.video && <Video size={14} className="text-white/30" />}
                  </div>
                  <div className="text-sm text-white/40">{ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}{s.weight}kg {s.reps}개</span>)}</div>
                  {ex.description && <p className="text-xs text-white/30 mt-1 line-clamp-1">{ex.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditLibraryExercise(ex)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg"><Edit3 size={16} /></button>
                  <button onClick={() => { if (confirm(`"${ex.name}" 삭제?`)) handleDeleteFromLibrary(ex.id); }} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDietMonthlyView = () => {
    const monthDates = getMonthDates();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const firstDay = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
    const totalMeals = monthDates.reduce((acc, date) => acc + (dietData[formatDate(date)]?.meals?.length || 0), 0);
    const daysWithMeals = monthDates.filter(date => (dietData[formatDate(date)]?.meals?.length || 0) > 0).length;
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm">기록한 날</p>
            <p className="text-3xl font-bold text-white">{daysWithMeals}<span className="text-lg text-white/50">일</span></p>
          </div>
          <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30">
            <p className="text-amber-400 text-sm">총 식사</p>
            <p className="text-3xl font-bold text-white">{totalMeals}<span className="text-lg text-white/50">끼</span></p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 mb-4">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((d, i) => <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? 'text-rose-400/70' : 'text-white/30'}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
            {monthDates.map(date => {
              const key = formatDate(date);
              const diet = dietData[key];
              const isToday = formatDate(new Date()) === key;
              const isSel = selectedMonthDate && formatDate(selectedMonthDate) === key;
              const hasD = diet?.meals?.length > 0;
              const hasPhoto = diet?.meals?.some(m => m.photo);
              return (
                <div key={key} onClick={() => setSelectedMonthDate(date)} className={`aspect-square rounded-2xl p-1 flex flex-col items-center justify-center cursor-pointer relative ${isSel ? 'ring-2 ring-white shadow-lg scale-105' : ''} ${isToday && !isSel ? 'ring-2 ring-blue-500' : ''} ${hasD ? 'bg-emerald-500/20' : 'bg-white/5 hover:bg-white/10'}`}>
                  {hasPhoto && <Camera size={8} className={`absolute top-1 right-1 ${isSel ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                  <span className={`text-sm font-medium ${hasD ? 'text-emerald-400' : 'text-white/50'}`}>{date.getDate()}</span>
                  {hasD && <span className={`text-[10px] ${isSel ? 'text-black/60' : 'text-emerald-400/70'}`}>{diet.meals.length}끼</span>}
                </div>
              );
            })}
          </div>
        </div>
        {selectedMonthDate && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white">{formatDisplayDate(selectedMonthDate)}</span>
              <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); setActiveTab('diet'); }} className="text-sm text-white/50 hover:text-white">편집 →</button>
            </div>
            {dietData[formatDate(selectedMonthDate)]?.meals?.length > 0 ? (
              <div className="space-y-3">
                {dietData[formatDate(selectedMonthDate)].meals.map(meal => (
                  <div key={meal.id} className="bg-black/30 rounded-xl overflow-hidden">
                    {meal.photo && <img src={meal.photo} alt={meal.name} className="w-full h-32 object-cover" />}
                    <div className="p-3">
                      <p className="font-medium text-white">{meal.name}</p>
                      {meal.description && <p className="text-sm text-white/50">{meal.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-white/30 py-8">기록이 없습니다</p>}
          </div>
        )}
      </div>
    );
  };

  const renderMemoListView = () => {
    const allMemos = getAllMemos();
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <h2 className="text-xl font-bold text-white mb-4">전체 메모</h2>
        {allMemos.length > 0 ? (
          <div className="space-y-3">
            {allMemos.map(([date, content]) => (
              <div key={date} onClick={() => { setCurrentDate(new Date(date)); setViewMode('daily'); setActiveTab('memo'); }} className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 cursor-pointer hover:bg-white/10">
                <p className="text-sm font-medium text-white/50 mb-1">{formatDisplayDate(new Date(date))}</p>
                <p className="text-white line-clamp-3">{content}</p>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-16 text-white/30">작성된 메모가 없습니다</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10 border-b border-white/5">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-5 py-4">
          <button onClick={() => { if (viewMode === 'daily') changeDate(-1); else if (viewMode === 'weekly') changeWeek(-1); else changeMonth(-1); }} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronLeft size={20} /></button>
          <div className="text-center">
            {viewMode === 'daily' && <h1 className="text-lg font-semibold">{formatDisplayDate(currentDate)}</h1>}
            {['weekly', 'monthly', 'dietMonthly'].includes(viewMode) && <h1 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {viewMode === 'library' && <h1 className="text-lg font-semibold">라이브러리</h1>}
            {viewMode === 'memos' && <h1 className="text-lg font-semibold">메모</h1>}
            {isSyncing && <p className="text-xs text-blue-400">동기화 중...</p>}
          </div>
          <button onClick={() => { if (viewMode === 'daily') changeDate(1); else if (viewMode === 'weekly') changeWeek(1); else changeMonth(1); }} className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronRight size={20} /></button>
        </div>
        <div className="flex justify-between items-center px-5 pb-4 max-w-2xl mx-auto">
          <div className="flex gap-1 overflow-x-auto">
            {[{ mode: 'daily', label: '일별' }, { mode: 'weekly', label: '주간' }, { mode: 'monthly', label: '월간' }, { mode: 'dietMonthly', label: '식단', icon: Utensils }, { mode: 'library', label: '라이브러리', icon: BookOpen }, { mode: 'memos', label: '메모', icon: FileText }].map(({ mode, label, icon: Icon }) => (
              <button key={mode} onClick={() => { setViewMode(mode); setSelectedMonthDate(null); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 ${viewMode === mode ? 'bg-white text-slate-900' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                {Icon && <Icon size={14} />}
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => userId ? handleLogout() : setShowLoginModal(true)} className="ml-2 flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 whitespace-nowrap">
            <User size={16} className="text-white/60" />
            <span className="text-sm text-white/60">{userId || '로그인'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="flex gap-2 px-5 py-3 max-w-lg mx-auto">
          {[{ tab: 'workout', label: '운동', icon: Dumbbell, color: 'blue' }, { tab: 'diet', label: '식단', icon: Utensils, color: 'emerald' }, { tab: 'supplement', label: '영양제', icon: Pill, color: 'purple' }, { tab: 'memo', label: '메모', icon: FileText, color: 'slate' }].map(({ tab, label, icon: Icon, color }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium ${activeTab === tab ? `bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-cyan-500 shadow-blue-500/25' : color === 'emerald' ? 'from-emerald-500 to-teal-500 shadow-emerald-500/25' : color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/25' : 'from-slate-500 to-slate-600 shadow-slate-500/25'} text-white shadow-lg` : 'bg-white/5 text-white/40'}`}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && renderWeeklyView()}
        {viewMode === 'monthly' && renderMonthlyView()}
        {viewMode === 'dietMonthly' && renderDietMonthlyView()}
        {viewMode === 'library' && renderLibraryView()}
        {viewMode === 'memos' && renderMemoListView()}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4"><User size={32} /></div>
              <h2 className="text-xl font-bold mb-2">로그인</h2>
              <p className="text-sm text-white/50">닉네임을 입력하세요</p>
            </div>
            <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="닉네임 (예: seokmin)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 mb-4" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin} disabled={!loginInput.trim()} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold">시작하기</button>
            <p className="text-xs text-white/30 text-center mt-4">같은 닉네임으로 어디서든 데이터에 접근할 수 있어요</p>
          </div>
        </div>
      )}
40 mb-2 block uppercase">분류</label>
                  <div className="flex gap-2 flex-wrap">
                    {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                      <button key={cat} onClick={() => setExerciseForm(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm font-medium ${exerciseForm.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">영상</label>
                  <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10">
                    {uploadingVideo ? (
                      <div className="text-center"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div><span className="text-xs text-white/40">업로드 중...</span></div>
                    ) : exerciseForm.video ? (
                      <div className="text-center"><Play size={24} className="mx-auto text-blue-400 mb-1" /><span className="text-xs text-white/40">영상 선택됨</span></div>
                    ) : (
                      <div className="text-center"><Video size={24} className="mx-auto text-white/30 mb-1" /><span className="text-xs text-white/30">영상 추가</span></div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'exercise')} className="hidden" disabled={uploadingVideo} />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">세트 정보</label>
                  {exerciseForm.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateSetRow} onRemove={removeSetRow} canRemove={exerciseForm.sets.length > 1} />)}
                  <button onClick={addSetRow} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">자세 설명</label>
                  <textarea value={exerciseForm.description} onChange={(e) => setExerciseForm(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20" />
                </div>
                <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={exerciseForm.isPT} onChange={(e) => setExerciseForm(p => ({ ...p, isPT: e.target.checked }))} className="w-5 h-5 rounded accent-amber-500" />
                  <Star size={18} className="text-amber-400" />
                  <div><p className="text-sm font-medium text-amber-400">PT 수업</p><p className="text-xs text-white/40">트레이너와 함께한 수업</p></div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={exerciseForm.saveToLibrary} onChange={(e) => setExerciseForm(p => ({ ...p, saveToLibrary: e.target.checked }))} className="w-5 h-5 rounded" />
                  <div><p className="text-sm font-medium">라이브러리에 저장</p><p className="text-xs text-white/40">다음에 다시 사용</p></div>
                </label>
                <button onClick={handleAddExercise} disabled={!exerciseForm.name || uploadingVideo} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold shadow-lg shadow-blue-500/25 disabled:shadow-none">추가하기</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">식사</label>
                  <input type="text" value={dietForm.name} onChange={(e) => setDietForm(p => ({ ...p, name: e.target.value }))} placeholder="아침, 점심, 저녁, 간식" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">사진</label>
                  <label className="flex items-center justify-center w-full h-32 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 overflow-hidden">
                    {dietForm.photo ? <img src={dietForm.photo} alt="식단" className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={24} className="mx-auto text-white/30 mb-1" /><span className="text-xs text-white/30">사진 추가</span></div>}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block uppercase">내용</label>
                  <textarea value={dietForm.description} onChange={(e) => setDietForm(p => ({ ...p, description: e.target.value }))} placeholder="먹은 음식" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20" />
                </div>
                <button onClick={handleAddMeal} disabled={!dietForm.name} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 disabled:shadow-none">추가하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && editingExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">운동 편집</h2>
              <button onClick={() => { setShowEditModal(false); setEditingExercise(null); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">운동 이름</label>
                <input type="text" value={editingExercise.name} onChange={(e) => setEditingExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setEditingExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm font-medium ${editingExercise.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">영상</label>
                <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10">
                  {uploadingVideo ? (
                    <div className="text-center"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div><span className="text-xs text-white/40">업로드 중...</span></div>
                  ) : editingExercise.video ? (
                    <div className="text-center"><Play size={24} className="mx-auto text-blue-400 mb-1" /><span className="text-xs text-white/40">영상 변경</span></div>
                  ) : (
                    <div className="text-center"><Video size={24} className="mx-auto text-white/30 mb-1" /><span className="text-xs text-white/30">영상 추가</span></div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'editing')} className="hidden" disabled={uploadingVideo} />
                </label>
                {editingExercise.video && <button onClick={() => setEditingExercise(p => ({ ...p, video: null }))} className="text-xs text-red-400 mt-2">영상 삭제</button>}
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">세트 정보</label>
                {editingExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateEditingSet} onRemove={removeEditingSetRow} canRemove={editingExercise.sets.length > 1} />)}
                <button onClick={addEditingSetRow} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">자세 설명</label>
                <textarea value={editingExercise.description} onChange={(e) => setEditingExercise(p => ({ ...p, description: e.target.value }))} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-white/20" />
              </div>
              <button onClick={handleSaveExercise} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold shadow-lg shadow-blue-500/25">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {showLibraryEditModal && editingLibraryExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">라이브러리 편집</h2>
              <button onClick={() => { setShowLibraryEditModal(false); setEditingLibraryExercise(null); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">운동 이름</label>
                <input type="text" value={editingLibraryExercise.name} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setEditingLibraryExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm font-medium ${editingLibraryExercise.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">영상</label>
                <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10">
                  {editingLibraryExercise.video ? (
                    <div className="text-center"><Play size={24} className="mx-auto text-blue-400 mb-1" /><span className="text-xs text-white/40">영상 변경</span></div>
                  ) : (
                    <div className="text-center"><Video size={24} className="mx-auto text-white/30 mb-1" /><span className="text-xs text-white/30">영상 추가</span></div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'libraryEdit')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">세트 정보</label>
                {editingLibraryExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateLibraryEditingSet} onRemove={removeLibraryEditingSetRow} canRemove={editingLibraryExercise.sets.length > 1} />)}
                <button onClick={addLibraryEditingSetRow} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">자세 설명</label>
                <textarea value={editingLibraryExercise.description} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-white/20" />
              </div>
              <button onClick={handleSaveLibraryExercise} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold shadow-lg shadow-blue-500/25">저장하기</button>
            </div>
          </div>
        </div>
      )}

      {showAddLibraryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">라이브러리에 추가</h2>
              <button onClick={() => setShowAddLibraryModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">운동 이름</label>
                <input type="text" value={newLibraryExercise.name} onChange={(e) => setNewLibraryExercise(p => ({ ...p, name: e.target.value }))} placeholder="운동 이름" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                    <button key={cat} onClick={() => setNewLibraryExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm font-medium ${newLibraryExercise.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">영상</label>
                <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10">
                  {newLibraryExercise.video ? (
                    <div className="text-center"><Play size={24} className="mx-auto text-blue-400 mb-1" /><span className="text-xs text-white/40">영상 선택됨</span></div>
                  ) : (
                    <div className="text-center"><Video size={24} className="mx-auto text-white/30 mb-1" /><span className="text-xs text-white/30">영상 추가</span></div>
                  )}
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'library')} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">세트 정보</label>
                {newLibraryExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateNewLibrarySet} onRemove={removeNewLibrarySetRow} canRemove={newLibraryExercise.sets.length > 1} />)}
                <button onClick={addNewLibrarySetRow} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block uppercase">자세 설명</label>
                <textarea value={newLibraryExercise.description} onChange={(e) => setNewLibraryExercise(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20" />
              </div>
              <button onClick={handleAddNewLibraryExercise} disabled={!newLibraryExercise.name} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold shadow-lg shadow-blue-500/25 disabled:shadow-none">추가하기</button>
            </div>
          </div>
        </div>
      )}

      {showAddSupplementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">영양제 추가</h2>
              <button onClick={() => setShowAddSupplementModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">영양제 이름</label>
                <input type="text" value={newSupplement.name} onChange={(e) => setNewSupplement(p => ({ ...p, name: e.target.value }))} placeholder="비타민D" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">복용량 (선택)</label>
                <input type="text" value={newSupplement.dosage} onChange={(e) => setNewSupplement(p => ({ ...p, dosage: e.target.value }))} placeholder="1정, 2캡슐 등" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20" />
              </div>
              <button onClick={handleAddSupplement} disabled={!newSupplement.name} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold">추가하기</button>
            </div>
          </div>
        </div>
      )}

      {showEditSupplementModal && editingSupplement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">영양제 편집</h2>
              <button onClick={() => { setShowEditSupplementModal(false); setEditingSupplement(null); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">영양제 이름</label>
                <input type="text" value={editingSupplement.name} onChange={(e) => setEditingSupplement(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-2 block">복용량</label>
                <input type="text" value={editingSupplement.dosage} onChange={(e) => setEditingSupplement(p => ({ ...p, dosage: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
              </div>
              <button onClick={handleSaveSupplement} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
