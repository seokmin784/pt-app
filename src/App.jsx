import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Video, Dumbbell, Utensils, Trash2, Calendar, Play, Download, Search, Check, Star, User } from 'lucide-react';
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

  const defaultLibrary = [
    { id: 'lib-1', name: 'MTS 로우', category: '등', video: null, sets: [{ weight: '30kg씩', reps: 15, sets: 1 }, { weight: '50kg씩', reps: 15, sets: 1 }, { weight: '70kg씩', reps: 10, sets: 2 }], description: '팔각도가 90도정도로 땡겨지게끔 의자 높이 맞춰주기' },
    { id: 'lib-2', name: '뉴텍 하이로우', category: '등', video: null, sets: [{ weight: '20kg씩', reps: 15, sets: 1 }, { weight: '30kg씩', reps: 12, sets: 3 }], description: '뒷꿈치 들어 앉은 상태서 가슴 살짝 말아주기' },
    { id: 'lib-3', name: '랫풀다운', category: '등', video: null, sets: [{ weight: '50kg', reps: 15, sets: 1 }, { weight: '60kg', reps: 10, sets: 3 }], description: '상체 세워준 상태서 어깨 낮춰주기' },
    { id: 'lib-4', name: '체스트프레스', category: '가슴', video: null, sets: [{ weight: '26kg', reps: 15, sets: 1 }, { weight: '47kg', reps: 10, sets: 1 }, { weight: '61kg', reps: 6, sets: 2 }], description: '어깨낮춰 광배 잡고 가슴 들어준 상태서 밀기' },
    { id: 'lib-5', name: '벤치프레스', category: '가슴', video: null, sets: [{ weight: '10kg씩', reps: 15, sets: 4 }], description: '바를 내렸을 때 명치나 명치보다 조금 위쪽으로' },
    { id: 'lib-6', name: '펙덱플라이', category: '가슴', video: null, sets: [{ weight: '25kg', reps: 15, sets: 4 }], description: '팔이 어깨 높이보다 조금 아래 위치' },
    { id: 'lib-7', name: '익스터널 로테이션', category: '어깨', video: null, sets: [{ weight: '5kg', reps: 20, sets: 4 }], description: '손바닥이 하늘보게 잡아주기' },
    { id: 'lib-8', name: '레터럴레이즈', category: '어깨', video: null, sets: [{ weight: '2kg', reps: 30, sets: 1 }, { weight: '3kg', reps: 30, sets: 3 }], description: '앉아서 살짝 숙여주고 어깨 낮춰주기' },
    { id: 'lib-9', name: '레그컬', category: '하체', video: null, sets: [{ weight: '10kg', reps: 15, sets: 2 }, { weight: '20kg', reps: 15, sets: 2 }], description: '골반 붙혀주면서 엉덩이 쪼아주기' },
    { id: 'lib-10', name: '스쿼트', category: '하체', video: null, sets: [{ weight: '맨몸', reps: 20, sets: 1 }, { weight: '20kg', reps: 12, sets: 3 }], description: '발각도를 30도정도 열어준 상태에서 진행' },
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
        setExerciseLibrary(library.map(ex => ({ id: ex.id, name: ex.name, category: ex.category, video: ex.video, sets: ex.sets || [], description: ex.description })));
      } else {
        await saveLibraryToSupabase(uid, defaultLibrary);
        setExerciseLibrary(defaultLibrary);
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
        await supabase.from('exercise_library').insert(library.map(ex => ({ user_id: uid, name: ex.name, category: ex.category, video: ex.video, sets: ex.sets, description: ex.description })));
      }
    } catch (error) { console.error('라이브러리 저장 실패:', error); }
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
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); dates.push(d); }
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

  const [exerciseForm, setExerciseForm] = useState({ name: '', category: '', video: null, videoName: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false });
  const [dietForm, setDietForm] = useState({ name: '', video: null, videoName: '', description: '' });

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

  const categories = ['전체', '등', '가슴', '어깨', '하체', '팔'];

  const handleVideoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'exercise') setExerciseForm(prev => ({ ...prev, video: url, videoName: file.name }));
      else setDietForm(prev => ({ ...prev, video: url, videoName: file.name }));
    }
  };

  const handleAddExercise = async () => {
    const newEx = { id: Date.now(), name: exerciseForm.name, category: exerciseForm.category || todayWorkout.category || '미지정', video: exerciseForm.video, sets: exerciseForm.sets, description: exerciseForm.description };
    if (exerciseForm.saveToLibrary && !exerciseLibrary.find(e => e.name === exerciseForm.name)) {
      const newLib = [...exerciseLibrary, { ...newEx, id: `lib-${Date.now()}` }];
      setExerciseLibrary(newLib);
      await saveLibraryToSupabase(userId, newLib);
    }
    const newData = { category: workoutData[dateKey]?.category || exerciseForm.category || '미지정', isPT: exerciseForm.isPT || workoutData[dateKey]?.isPT || false, exercises: [...(workoutData[dateKey]?.exercises || []), newEx] };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
    setExerciseForm({ name: '', category: '', video: null, videoName: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false });
    setShowAddModal(false);
  };

  const handleAddMeal = async () => {
    const newMeal = { id: Date.now(), ...dietForm };
    const newData = { meals: [...(dietData[dateKey]?.meals || []), newMeal] };
    setDietData(prev => ({ ...prev, [dateKey]: newData }));
    await saveDietToSupabase(dateKey, newData);
    setDietForm({ name: '', video: null, videoName: '', description: '' });
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

  const updateEditingSet = (idx, field, val) => { setEditingExercise(prev => ({ ...prev, sets: prev.sets.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };
  const addEditingSetRow = () => { setEditingExercise(prev => ({ ...prev, sets: [...prev.sets, { weight: '', reps: '', sets: 1 }] })); };
  const removeEditingSetRow = (idx) => { setEditingExercise(prev => ({ ...prev, sets: prev.sets.filter((_, i) => i !== idx) })); };

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

  const handleDeleteFromLibrary = async (id) => {
    const newLib = exerciseLibrary.filter(ex => ex.id !== id);
    setExerciseLibrary(newLib);
    setSelectedExercises(prev => prev.filter(i => i !== id));
    await saveLibraryToSupabase(userId, newLib);
  };

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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const renderDailyView = () => (
    <div className="max-w-lg mx-auto px-5 py-6">
      {activeTab === 'workout' ? (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-medium text-white/40 mb-2 block uppercase">종목</label>
              <input type="text" value={todayWorkout.category} onChange={(e) => updateCategory(e.target.value)} placeholder="등, 가슴, 하체..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none" />
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={togglePT} className={`px-5 py-3.5 rounded-2xl flex items-center gap-2 transition-all ${todayWorkout.isPT ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                <Star size={16} fill={todayWorkout.isPT ? 'currentColor' : 'none'} />
                <span className="text-sm font-semibold">PT</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {todayWorkout.exercises.map((ex) => (
              <div key={ex.id} className="bg-white/5 rounded-3xl p-5 border border-white/10 cursor-pointer hover:bg-white/10" onClick={() => handleEditExercise(ex)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{ex.name}</h3>
                    {ex.category && <span className={`text-xs px-2.5 py-1 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'}`}>{ex.category}</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteExercise(ex.id); }} className="text-white/30 hover:text-rose-400 p-2"><Trash2 size={18} /></button>
                </div>
                <div className="bg-black/20 rounded-2xl p-4 mb-4">
                  {ex.sets.map((set, idx) => (
                    <div key={idx} className="flex items-center text-sm py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/30 w-16">세트 {idx + 1}</span>
                      <span className="text-amber-400 font-semibold flex-1">{set.weight}</span>
                      <span className="text-white/80">{set.reps}개 × {set.sets}세트</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/50">{ex.description}</p>
                <div className="mt-3 text-xs text-blue-400 text-center">탭하여 편집</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowLibraryModal(true); setSelectedExercises([]); setLibrarySearchTerm(''); setSelectedCategory('전체'); }} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2"><Download size={18} /><span>가져오기</span></button>
            <button onClick={() => { setShowAddModal(true); setExerciseForm({ name: '', category: todayWorkout.category || '', video: null, videoName: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: todayWorkout.isPT }); }} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center gap-2 font-semibold"><Plus size={18} /><span>새로 추가</span></button>
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {todayDiet.meals.map((meal) => (
              <div key={meal.id} className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-emerald-400">{meal.name}</h3>
                  <button onClick={() => handleDeleteMeal(meal.id)} className="text-white/30 hover:text-rose-400 p-2"><Trash2 size={18} /></button>
                </div>
                <p className="text-sm text-white/60">{meal.description}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowAddModal(true); setDietForm({ name: '', video: null, videoName: '', description: '' }); }} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-2 font-semibold"><Plus size={18} /><span>식단 추가</span></button>
        </div>
      )}
    </div>
  );

  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    const stats = getWeeklyStats();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="bg-white/5 rounded-3xl p-6 mb-6 border border-white/10">
          <h3 className="text-sm text-white/40 mb-4 uppercase">이번주 요약</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center"><div className="text-3xl font-bold text-blue-400">{stats.totalDays}</div><div className="text-xs text-white/40">운동</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-amber-400">{stats.ptDays}</div><div className="text-xs text-white/40">PT</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-emerald-400">{stats.totalSets}</div><div className="text-xs text-white/40">세트</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-violet-400">{Object.keys(stats.exercises).length}</div><div className="text-xs text-white/40">종류</div></div>
          </div>
        </div>
        <div className="space-y-3">
          {weekDates.map((date, idx) => {
            const key = formatDate(date);
            const data = workoutData[key];
            const diet = dietData[key];
            const isToday = formatDate(new Date()) === key;
            return (
              <div key={key} className={`bg-white/5 rounded-2xl p-4 border cursor-pointer hover:bg-white/10 ${isToday ? 'border-blue-500/50' : 'border-white/10'}`} onClick={() => { setCurrentDate(date); setViewMode('daily'); }}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${isToday ? 'bg-blue-500' : 'bg-white/10 text-white/60'}`}>{days[idx]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/40 text-sm">{date.getMonth() + 1}/{date.getDate()}</span>
                      {data?.isPT && <Star size={14} className="text-amber-400" fill="currentColor" />}
                    </div>
                    {data?.exercises.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">{data.exercises.map(ex => <span key={ex.id} className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{ex.name}</span>)}</div>
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
        <div className="bg-white/5 rounded-3xl p-5 mb-5 border border-white/10">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((d, i) => <div key={d} className={`text-center text-xs py-2 ${i >= 5 ? 'text-rose-400/70' : 'text-white/30'}`}>{d}</div>)}
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
                <div key={key} onClick={() => setSelectedMonthDate(date)} className={`aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer relative ${isSel ? 'ring-2 ring-white scale-105' : ''} ${isToday && !isSel ? 'ring-2 ring-blue-500' : ''} ${hasW ? categoryColors[data.category]?.bg || 'bg-white/20' : hasD ? 'bg-emerald-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
                  {data?.isPT && <Star size={8} className="absolute top-1 right-1 text-amber-300" fill="currentColor" />}
                  <span className={`text-sm font-medium ${hasW || hasD ? 'text-white' : 'text-white/50'}`}>{date.getDate()}</span>
                  {hasW && <span className="text-[10px] text-white/80">{data.category}</span>}
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
                  <h2 className="text-xl font-bold">{formatDisplayDate(selectedMonthDate)}</h2>
                  {selWorkout?.isPT && <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full"><Star size={12} className="text-amber-300" fill="currentColor" /><span className="text-xs">PT</span></div>}
                </div>
                <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); }} className="px-4 py-2 bg-white/20 rounded-xl text-sm">편집</button>
              </div>
            </div>
            {selWorkout?.exercises.length > 0 && (
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4"><Dumbbell size={18} className="text-white/40" /><span className="text-sm text-white/40">운동</span><span className={`text-sm font-semibold ${categoryColors[selWorkout.category]?.text || 'text-white'}`}>{selWorkout.category}</span></div>
                <div className="space-y-3">
                  {selWorkout.exercises.map((ex, idx) => (
                    <div key={ex.id} className="bg-black/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3"><span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span><h4 className="font-semibold">{ex.name}</h4></div>
                      <div className="flex flex-wrap gap-2 mb-2">{ex.sets.map((s, i) => <span key={i} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-amber-400">{s.weight} · {s.reps}개 × {s.sets}</span>)}</div>
                      <p className="text-xs text-white/40">{ex.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selDiet?.meals.length > 0 && (
              <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4"><Utensils size={18} className="text-white/40" /><span className="text-sm text-white/40">식단</span><span className="text-sm font-semibold text-emerald-400">{selDiet.meals.length}끼</span></div>
                <div className="space-y-2">
                  {selDiet.meals.map(m => (
                    <div key={m.id} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">{m.name.charAt(0)}</span>
                      <div><h4 className="font-medium text-sm">{m.name}</h4><p className="text-xs text-white/40">{m.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!selWorkout?.exercises.length && !selDiet?.meals.length && (
              <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10">
                <Calendar size={28} className="text-white/30 mx-auto mb-4" />
                <p className="text-white/40 mb-5">기록이 없습니다</p>
                <button onClick={() => { setCurrentDate(selectedMonthDate); setViewMode('daily'); }} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">기록 추가하기</button>
              </div>
            )}
          </div>
        )}
        {!selectedMonthDate && (
          <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10">
            <Calendar size={28} className="text-white/30 mx-auto mb-4" />
            <p className="text-white/40">날짜를 선택하세요</p>
          </div>
        )}
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
          <button onClick={() => { if (viewMode === 'daily') changeDate(-1); else if (viewMode === 'weekly') changeWeek(-1); else changeMonth(-1); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft size={20} /></button>
          <div className="text-center">
            {viewMode === 'daily' && <h1 className="text-lg font-semibold">{formatDisplayDate(currentDate)}</h1>}
            {viewMode === 'weekly' && <h1 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {viewMode === 'monthly' && <h1 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {isSyncing && <p className="text-xs text-blue-400">동기화 중...</p>}
          </div>
          <button onClick={() => { if (viewMode === 'daily') changeDate(1); else if (viewMode === 'weekly') changeWeek(1); else changeMonth(1); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronRight size={20} /></button>
        </div>
        <div className="flex justify-between items-center px-5 pb-4 max-w-2xl mx-auto">
          <div className="flex gap-1">
            {[{ mode: 'daily', label: '일별' }, { mode: 'weekly', label: '주간' }, { mode: 'monthly', label: '월간' }].map(({ mode, label }) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-5 py-2 rounded-full text-sm font-medium ${viewMode === mode ? 'bg-white text-slate-900' : 'bg-white/5 text-white/60'}`}>{label}</button>
            ))}
          </div>
          <button onClick={() => userId ? handleLogout() : setShowLoginModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5">
            <User size={16} className="text-white/60" />
            <span className="text-sm text-white/60">{userId || '로그인'}</span>
          </button>
        </div>
      </div>
      {viewMode === 'daily' && (
        <div className="flex gap-2 px-5 py-3 max-w-lg mx-auto">
          <button onClick={() => setActiveTab('workout')} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium ${activeTab === 'workout' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/5 text-white/40'}`}><Dumbbell size={18} /><span>운동</span></button>
          <button onClick={() => setActiveTab('diet')} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium ${activeTab === 'diet' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-white/5 text-white/40'}`}><Utensils size={18} /><span>식단</span></button>
        </div>
      )}
      <div className="relative">
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && renderWeeklyView()}
        {viewMode === 'monthly' && renderMonthlyView()}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4"><User size={32} /></div>
              <h2 className="text-xl font-bold mb-2">로그인</h2>
              <p className="text-sm text-white/50">닉네임을 입력하세요</p>
            </div>
            <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="닉네임 (예: seokmin)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 mb-4" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin} disabled={!loginInput.trim()} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold">시작하기</button>
            <p className="text-xs text-white/30 text-center mt-4">같은 닉네임으로 어디서든 데이터에 접근할 수 있어요</p>
          </div>
        </div>
      )}

      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-hidden flex flex-col border-t border-white/10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">운동 라이브러리</h2>
              <button onClick={() => setShowLibraryModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={librarySearchTerm} onChange={(e) => setLibrarySearchTerm(e.target.value)} placeholder="검색..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/30" />
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === cat ? (cat === '전체' ? 'bg-white text-slate-900' : categoryColors[cat]?.bg || 'bg-white/20') : 'bg-white/5 text-white/60'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredLibrary.map(ex => {
                const isSel = selectedExercises.includes(ex.id);
                return (
                  <div key={ex.id} className={`p-4 rounded-2xl border ${isSel ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleExerciseSelection(ex.id)}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{ex.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'}`}>{ex.category}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">{ex.sets.slice(0, 2).map((s, i) => <span key={i} className="text-xs text-amber-400/80">{s.weight} {s.reps}개</span>)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`"${ex.name}" 삭제?`)) handleDeleteFromLibrary(ex.id); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Trash2 size={14} className="text-white/40" /></button>
                        <div onClick={() => toggleExerciseSelection(ex.id)} className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ${isSel ? 'bg-blue-500' : 'bg-white/10'}`}>{isSel && <Check size={14} />}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedExercises.length > 0 && <button onClick={handleImportFromLibrary} className="mt-4 w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-semibold">{selectedExercises.length}개 가져오기</button>}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{activeTab === 'workout' ? '새 운동' : '식단 추가'}</h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X size={20} /></button>
            </div>
            {activeTab === 'workout' ? (
              <div className="space-y-5">
                <div><label className="text-xs text-white/40 mb-2 block uppercase">운동 이름</label><input type="text" value={exerciseForm.name} onChange={(e) => setExerciseForm(p => ({ ...p, name: e.target.value }))} placeholder="MTS 로우" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30" /></div>
                <div><label className="text-xs text-white/40 mb-2 block uppercase">분류</label><div className="flex gap-2 flex-wrap">{['등', '가슴', '어깨', '하체', '팔'].map(cat => (<button key={cat} onClick={() => setExerciseForm(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm ${exerciseForm.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60'}`}>{cat}</button>))}</div></div>
                <div><label className="text-xs text-white/40 mb-2 block uppercase">세트 정보</label>
                  {exerciseForm.sets.map((s, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" value={s.weight} onChange={(e) => updateSetRow(i, 'weight', e.target.value)} placeholder="무게" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30" />
                      <input type="number" value={s.reps} onChange={(e) => updateSetRow(i, 'reps', e.target.value)} placeholder="개수" className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
                      <input type="number" value={s.sets} onChange={(e) => updateSetRow(i, 'sets', e.target.value)} placeholder="세트" className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
                      {exerciseForm.sets.length > 1 && <button onClick={() => removeSetRow(i)} className="text-rose-400 px-2"><X size={16} /></button>}
                    </div>
                  ))}
                  <button onClick={addSetRow} className="text-blue-400 text-sm flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
                </div>
                <div><label className="text-xs text-white/40 mb-2 block uppercase">자세 설명</label><textarea value={exerciseForm.description} onChange={(e) => setExerciseForm(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none" /></div>
                <label className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl cursor-pointer"><input type="checkbox" checked={exerciseForm.isPT} onChange={(e) => setExerciseForm(p => ({ ...p, isPT: e.target.checked }))} className="w-5 h-5 rounded" /><Star size={18} className="text-amber-400" /><div><p className="text-sm font-medium text-amber-400">PT 수업</p></div></label>
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer"><input type="checkbox" checked={exerciseForm.saveToLibrary} onChange={(e) => setExerciseForm(p => ({ ...p, saveToLibrary: e.target.checked }))} className="w-5 h-5 rounded" /><div><p className="text-sm font-medium">라이브러리에 저장</p></div></label>
                <button onClick={handleAddExercise} disabled={!exerciseForm.name} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold">추가하기</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div><label className="text-xs text-white/40 mb-2 block uppercase">식사</label><input type="text" value={dietForm.name} onChange={(e) => setDietForm(p => ({ ...p, name: e.target.value }))} placeholder="아침, 점심, 저녁" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30" /></div>
                <div><label className="text-xs text-white/40 mb-2 block uppercase">내용</label><textarea value={dietForm.description} onChange={(e) => setDietForm(p => ({ ...p, description: e.target.value }))} placeholder="먹은 음식" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none" /></div>
                <button onClick={handleAddMeal} disabled={!dietForm.name} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold">추가하기</button>
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
              <button onClick={() => { setShowEditModal(false); setEditingExercise(null); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div><label className="text-xs text-white/40 mb-2 block uppercase">운동 이름</label><input type="text" value={editingExercise.name} onChange={(e) => setEditingExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /></div>
              <div><label className="text-xs text-white/40 mb-2 block uppercase">분류</label><div className="flex gap-2 flex-wrap">{['등', '가슴', '어깨', '하체', '팔'].map(cat => (<button key={cat} onClick={() => setEditingExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2 rounded-full text-sm ${editingExercise.category === cat ? categoryColors[cat]?.bg || 'bg-white/20' : 'bg-white/5 text-white/60'}`}>{cat}</button>))}</div></div>
              <div><label className="text-xs text-white/40 mb-2 block uppercase">세트 정보</label>
                {editingExercise.sets.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" value={s.weight} onChange={(e) => updateEditingSet(i, 'weight', e.target.value)} placeholder="무게" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
                    <input type="number" value={s.reps} onChange={(e) => updateEditingSet(i, 'reps', e.target.value)} placeholder="개수" className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
                    <input type="number" value={s.sets} onChange={(e) => updateEditingSet(i, 'sets', e.target.value)} placeholder="세트" className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
                    {editingExercise.sets.length > 1 && <button onClick={() => removeEditingSetRow(i)} className="text-rose-400 px-2"><X size={16} /></button>}
                  </div>
                ))}
                <button onClick={addEditingSetRow} className="text-blue-400 text-sm flex items-center gap-1 mt-2"><Plus size={14} /> 세트 추가</button>
              </div>
              <div><label className="text-xs text-white/40 mb-2 block uppercase">자세 설명</label><textarea value={editingExercise.description} onChange={(e) => setEditingExercise(p => ({ ...p, description: e.target.value }))} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none" /></div>
              <button onClick={handleSaveExercise} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
