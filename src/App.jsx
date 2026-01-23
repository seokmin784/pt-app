import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Video, Dumbbell, Utensils, Trash2, Calendar, List, Play, Download, BookOpen, Search, Check, Star } from 'lucide-react';

// localStorage 헬퍼 함수
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('저장 실패:', e);
  }
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error('불러오기 실패:', e);
    return defaultValue;
  }
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
  
  const sampleVideo = "https://www.w3schools.com/html/mov_bbb.mp4";

  // 기본 라이브러리 데이터
  const defaultLibrary = [
    {
      id: 'lib-1',
      name: 'MTS 로우',
      category: '등',
      video: null,
      sets: [
        { weight: '30kg씩', reps: 15, sets: 1 },
        { weight: '50kg씩', reps: 15, sets: 1 },
        { weight: '70kg씩', reps: 10, sets: 2 },
      ],
      description: '팔을 땡겼을때 팔각도가 90도정도로 땡겨지게끔 의자 높이 맞춰주고 손바닥이 위에보게 잡기, 배 힘 잡고 어깨 낮춰준 상태서 팔꿈치 어깨 당겨지는만큼만 옆구리에 붙혀주면서 당기기'
    },
    {
      id: 'lib-2',
      name: '뉴텍 하이로우',
      category: '등',
      video: null,
      sets: [
        { weight: '20kg씩', reps: 15, sets: 1 },
        { weight: '30kg씩', reps: 12, sets: 3 },
      ],
      description: '뒷꿈치 들어 앉은 상태서 가슴 살짝 말아주고 허리 꺾이지 않게 배 힘 준 상태서 어깨 낮춰광배 잡고 팔꿈치 그대로 밑으로 내려주기'
    },
    {
      id: 'lib-3',
      name: '랫풀다운',
      category: '등',
      video: null,
      sets: [
        { weight: '50kg', reps: 15, sets: 1 },
        { weight: '60kg', reps: 10, sets: 3 },
      ],
      description: '조금 뒤로 앉아서 다리 패드밑에 끼는느낌 들게 잡아 놓고 상체 세워준 상태서 어깨 낮춰주면서 배힘줘 뒤로 밀면서 바가 가슴쪽으로 오게끔 살짝만 누워주면서 당겨주기'
    },
    {
      id: 'lib-4',
      name: '체스트프레스',
      category: '가슴',
      video: null,
      sets: [
        { weight: '26kg', reps: 15, sets: 1 },
        { weight: '47kg', reps: 10, sets: 1 },
        { weight: '61kg', reps: 6, sets: 2 },
      ],
      description: '어깨낮춰 광배 잡고 가슴 들어준 상태서 이두를 가슴에 붙혀주는 느낌으로 밀기'
    },
    {
      id: 'lib-5',
      name: '벤치프레스',
      category: '가슴',
      video: null,
      sets: [{ weight: '10kg씩', reps: 15, sets: 4 }],
      description: '바를 내렸을 때 명치나 명치보다 조금 위쪽으로 오게끔, 팔각도는 내렸을때 90도정도로 설정'
    },
    {
      id: 'lib-6',
      name: '펙덱플라이',
      category: '가슴',
      video: null,
      sets: [{ weight: '25kg', reps: 15, sets: 4 }],
      description: '팔이 어깨 높이보다 조금 아래 위치해 있게끔 만들어주고 손바닥이 가슴이랑 같은방향 보게 만들어주기'
    },
    {
      id: 'lib-7',
      name: '익스터널 로테이션',
      category: '어깨',
      video: null,
      sets: [{ weight: '5kg', reps: 20, sets: 4 }],
      description: '케이블 손잡이를 팔꿈치 위치에 놓아주고 살짝 뒤로 나온 상태서 손바닥이 하늘보게 잡아주고 어깨는 뒤로 보내 날개뼈를 살짝 모아주기'
    },
    {
      id: 'lib-8',
      name: '레터럴레이즈',
      category: '어깨',
      video: null,
      sets: [
        { weight: '2kg', reps: 30, sets: 1 },
        { weight: '3kg', reps: 30, sets: 3 }
      ],
      description: '앉아서 살짝 숙여주고 어깨 낮춰 엉덩이, 배, 광배 힘 잡아주면서 팔꿈치 안쪽으로 살짝 돌려 살짝 앞쪽으로 올리기'
    },
    {
      id: 'lib-9',
      name: '레그컬',
      category: '하체',
      video: null,
      sets: [
        { weight: '10kg', reps: 15, sets: 2 },
        { weight: '20kg', reps: 15, sets: 2 }
      ],
      description: '골반 붙혀주면서 엉덩이 쪼아주고 허벅지 살짝 띄워주면서 접기'
    },
    {
      id: 'lib-10',
      name: '스쿼트',
      category: '하체',
      video: null,
      sets: [
        { weight: '맨몸', reps: 20, sets: 1 },
        { weight: '20kg', reps: 12, sets: 3 }
      ],
      description: '뒷꿈치 간격 사이에 골반이 들어갈정도로 발 잡아주고 발각도를 30도정도 열어준 상태에서 진행'
    },
  ];

  // localStorage에서 데이터 불러오기 (없으면 기본값 사용)
  const [exerciseLibrary, setExerciseLibrary] = useState(() => 
    loadFromStorage('pt-exercise-library', defaultLibrary)
  );
  
  const [workoutData, setWorkoutData] = useState(() => 
    loadFromStorage('pt-workout-data', {})
  );
  
  const [dietData, setDietData] = useState(() => 
    loadFromStorage('pt-diet-data', {})
  );

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    saveToStorage('pt-exercise-library', exerciseLibrary);
  }, [exerciseLibrary]);

  useEffect(() => {
    saveToStorage('pt-workout-data', workoutData);
  }, [workoutData]);

  useEffect(() => {
    saveToStorage('pt-diet-data', dietData);
  }, [dietData]);

  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const formatDisplayDate = (date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const changeWeek = (weeks) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setCurrentDate(newDate);
  };

  const changeMonth = (months) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + months);
    setCurrentDate(newDate);
    setSelectedMonthDate(null);
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getMonthDates = () => {
    const dates = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }
    return dates;
  };

  const dateKey = formatDate(currentDate);
  const todayWorkout = workoutData[dateKey] || { category: '', exercises: [], isPT: false };
  const todayDiet = dietData[dateKey] || { meals: [] };

  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: '',
    video: null,
    videoName: '',
    sets: [{ weight: '', reps: '', sets: 1 }],
    description: '',
    saveToLibrary: true,
    isPT: false
  });

  const [dietForm, setDietForm] = useState({
    name: '',
    video: null,
    videoName: '',
    description: ''
  });

  const handleImportFromLibrary = () => {
    const exercisesToAdd = selectedExercises.map((libId, idx) => {
      const libExercise = exerciseLibrary.find(e => e.id === libId);
      return {
        ...libExercise,
        id: Date.now() + idx,
        sets: JSON.parse(JSON.stringify(libExercise.sets))
      };
    });

    const category = exercisesToAdd[0]?.category || todayWorkout.category || '미지정';

    setWorkoutData(prev => ({
      ...prev,
      [dateKey]: {
        category: prev[dateKey]?.category || category,
        isPT: prev[dateKey]?.isPT || false,
        exercises: [...(prev[dateKey]?.exercises || []), ...exercisesToAdd]
      }
    }));

    setSelectedExercises([]);
    setShowLibraryModal(false);
  };

  const filteredLibrary = exerciseLibrary.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(librarySearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['전체', '등', '가슴', '어깨', '하체', '팔'];

  const handleVideoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'exercise') {
        setExerciseForm(prev => ({ ...prev, video: url, videoName: file.name }));
      } else {
        setDietForm(prev => ({ ...prev, video: url, videoName: file.name }));
      }
    }
  };

  const handleAddExercise = () => {
    const newExercise = {
      id: Date.now(),
      name: exerciseForm.name,
      category: exerciseForm.category || todayWorkout.category || '미지정',
      video: exerciseForm.video,
      sets: exerciseForm.sets,
      description: exerciseForm.description
    };

    if (exerciseForm.saveToLibrary) {
      const existingInLibrary = exerciseLibrary.find(e => e.name === exerciseForm.name);
      if (!existingInLibrary) {
        setExerciseLibrary(prev => [...prev, { ...newExercise, id: `lib-${Date.now()}` }]);
      }
    }

    setWorkoutData(prev => ({
      ...prev,
      [dateKey]: {
        category: prev[dateKey]?.category || exerciseForm.category || '미지정',
        isPT: exerciseForm.isPT || prev[dateKey]?.isPT || false,
        exercises: [...(prev[dateKey]?.exercises || []), newExercise]
      }
    }));

    setExerciseForm({ name: '', category: '', video: null, videoName: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false });
    setShowAddModal(false);
  };

  const handleAddMeal = () => {
    const newMeal = { id: Date.now(), ...dietForm };
    setDietData(prev => ({
      ...prev,
      [dateKey]: { meals: [...(prev[dateKey]?.meals || []), newMeal] }
    }));
    setDietForm({ name: '', video: null, videoName: '', description: '' });
    setShowAddModal(false);
  };

  const handleDeleteExercise = (exerciseId) => {
    setWorkoutData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        exercises: prev[dateKey].exercises.filter(e => e.id !== exerciseId)
      }
    }));
  };

  const handleDeleteMeal = (mealId) => {
    setDietData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        meals: prev[dateKey].meals.filter(m => m.id !== mealId)
      }
    }));
  };

  const togglePT = () => {
    setWorkoutData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        category: prev[dateKey]?.category || '',
        exercises: prev[dateKey]?.exercises || [],
        isPT: !prev[dateKey]?.isPT
      }
    }));
  };

  const addSetRow = () => {
    setExerciseForm(prev => ({
      ...prev,
      sets: [...prev.sets, { weight: '', reps: '', sets: 1 }]
    }));
  };

  const updateSetRow = (index, field, value) => {
    setExerciseForm(prev => ({
      ...prev,
      sets: prev.sets.map((set, i) => i === index ? { ...set, [field]: value } : set)
    }));
  };

  const removeSetRow = (index) => {
    setExerciseForm(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index)
    }));
  };

  const updateCategory = (newCategory) => {
    setWorkoutData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        category: newCategory,
        isPT: prev[dateKey]?.isPT || false,
        exercises: prev[dateKey]?.exercises || []
      }
    }));
  };

  const toggleExerciseSelection = (libId) => {
    setSelectedExercises(prev => 
      prev.includes(libId) ? prev.filter(id => id !== libId) : [...prev, libId]
    );
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

  // 일별 뷰
  const renderDailyView = () => (
    <div className="max-w-lg mx-auto px-5 py-6">
      {activeTab === 'workout' ? (
        <div>
          {/* 종목 + PT 체크 */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">종목</label>
              <input
                type="text"
                value={todayWorkout.category}
                onChange={(e) => updateCategory(e.target.value)}
                placeholder="등, 가슴, 하체..."
                className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={togglePT}
                className={`px-5 py-3.5 rounded-2xl flex items-center gap-2 transition-all ${
                  todayWorkout.isPT 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-lg shadow-amber-500/25' 
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}
              >
                <Star size={16} fill={todayWorkout.isPT ? 'currentColor' : 'none'} />
                <span className="text-sm font-semibold">PT</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {todayWorkout.exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{exercise.name}</h3>
                    {exercise.category && (
                      <span className={`text-xs px-2.5 py-1 rounded-full ${categoryColors[exercise.category]?.light || 'bg-white/10'} ${categoryColors[exercise.category]?.text || 'text-white/60'}`}>
                        {exercise.category}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteExercise(exercise.id)} className="text-white/30 hover:text-rose-400 p-2 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {exercise.video && (
                  <div className="mb-4 rounded-2xl overflow-hidden bg-black/50">
                    <video src={exercise.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: '200px' }} />
                  </div>
                )}
                
                <div className="bg-black/20 rounded-2xl p-4 mb-4">
                  {exercise.sets.map((set, idx) => (
                    <div key={idx} className="flex items-center text-sm py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/30 w-16 font-medium">세트 {idx + 1}</span>
                      <span className="text-amber-400 font-semibold flex-1">{set.weight}</span>
                      <span className="text-white/80">{set.reps}개 × {set.sets}세트</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-white/50 leading-relaxed">{exercise.description}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowLibraryModal(true);
                setSelectedExercises([]);
                setLibrarySearchTerm('');
                setSelectedCategory('전체');
              }}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium"
            >
              <Download size={18} />
              <span>가져오기</span>
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setExerciseForm({ name: '', category: todayWorkout.category || '', video: null, videoName: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: todayWorkout.isPT });
              }}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-2xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg shadow-blue-500/25"
            >
              <Plus size={18} />
              <span>새로 추가</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {todayDiet.meals.map((meal) => (
              <div key={meal.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-emerald-400">{meal.name}</h3>
                  <button onClick={() => handleDeleteMeal(meal.id)} className="text-white/30 hover:text-rose-400 p-2 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                {meal.video && (
                  <div className="mb-4 rounded-2xl overflow-hidden bg-black/50">
                    <video src={meal.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: '200px' }} />
                  </div>
                )}
                <p className="text-sm text-white/60 leading-relaxed">{meal.description}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setShowAddModal(true);
              setDietForm({ name: '', video: null, videoName: '', description: '' });
            }}
            className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-2xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg shadow-emerald-500/25"
          >
            <Plus size={18} />
            <span>식단 추가</span>
          </button>
        </div>
      )}
    </div>
  );

  // 주간 뷰
  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    const stats = getWeeklyStats();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* 주간 요약 카드 */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/10">
          <h3 className="text-sm font-medium text-white/40 mb-4 tracking-wide uppercase">이번주 요약</h3>
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
              <div 
                key={key} 
                className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 border transition-all cursor-pointer hover:bg-white/10 ${isToday ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10'}`}
                onClick={() => { setCurrentDate(date); setViewMode('daily'); }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold ${isToday ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>
                    {days[idx]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/40 text-sm">{date.getMonth() + 1}/{date.getDate()}</span>
                      {data?.isPT && (
                        <Star size={14} className="text-amber-400" fill="currentColor" />
                      )}
                    </div>
                    {data?.exercises.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.exercises.map(ex => (
                          <span key={ex.id} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">{ex.name}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-sm">휴식일</p>
                    )}
                  </div>
                  <div className="text-right">
                    {data?.category && (
                      <span className={`text-xs px-3 py-1.5 rounded-full ${categoryColors[data.category]?.bg || 'bg-white/20'}`}>
                        {data.category}
                      </span>
                    )}
                    {diet?.meals.length > 0 && (
                      <div className="text-xs text-emerald-400 mt-1">{diet.meals.length}끼</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 월간 뷰 - 애플 스타일
  const renderMonthlyView = () => {
    const monthDates = getMonthDates();
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const firstDayOfMonth = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
    
    const selectedDateKey = selectedMonthDate ? formatDate(selectedMonthDate) : null;
    const selectedWorkout = selectedDateKey ? workoutData[selectedDateKey] : null;
    const selectedDiet = selectedDateKey ? dietData[selectedDateKey] : null;
    
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* 캘린더 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 mb-5 border border-white/10">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {days.map((day, idx) => (
              <div key={day} className={`text-center text-xs font-medium py-2 ${idx >= 5 ? 'text-rose-400/70' : 'text-white/30'}`}>
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {Array(firstDayOfMonth).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {monthDates.map(date => {
              const key = formatDate(date);
              const data = workoutData[key];
              const diet = dietData[key];
              const isToday = formatDate(new Date()) === key;
              const isSelected = selectedMonthDate && formatDate(selectedMonthDate) === key;
              const hasWorkout = data?.exercises.length > 0;
              const hasDiet = diet?.meals.length > 0;
              
              return (
                <div
                  key={key}
                  onClick={() => setSelectedMonthDate(date)}
                  className={`aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer relative
                    ${isSelected ? 'ring-2 ring-white shadow-lg scale-105' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${hasWorkout 
                      ? `${categoryColors[data.category]?.bg || 'bg-white/20'}` 
                      : hasDiet
                        ? 'bg-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  {/* PT 별표 */}
                  {data?.isPT && (
                    <Star size={8} className="absolute top-1 right-1 text-amber-300" fill="currentColor" />
                  )}
                  
                  {/* 날짜 */}
                  <span className={`text-sm font-medium ${hasWorkout || hasDiet ? 'text-white' : 'text-white/50'}`}>
                    {date.getDate()}
                  </span>
                  
                  {/* 운동 종목 */}
                  {hasWorkout && (
                    <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">
                      {data.category}
                    </span>
                  )}
                  
                  {/* 식단 끼니 수 */}
                  {hasDiet && (
                    <span className="text-[10px] text-white/70">
                      {diet.meals.length}끼
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 상세 정보 */}
        {selectedMonthDate && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 날짜 헤더 */}
            <div className={`rounded-3xl p-5 ${selectedWorkout?.category ? categoryColors[selectedWorkout.category]?.bg : 'bg-white/10'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{formatDisplayDate(selectedMonthDate)}</h2>
                  {selectedWorkout?.isPT && (
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
                      <Star size={12} className="text-amber-300" fill="currentColor" />
                      <span className="text-xs font-medium text-white/90">PT</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCurrentDate(selectedMonthDate);
                    setViewMode('daily');
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all backdrop-blur"
                >
                  편집
                </button>
              </div>
            </div>

            {/* 운동 상세 */}
            {selectedWorkout?.exercises.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell size={18} className="text-white/40" />
                  <span className="text-sm font-medium text-white/40">운동</span>
                  <span className={`text-sm font-semibold ${categoryColors[selectedWorkout.category]?.text || 'text-white'}`}>
                    {selectedWorkout.category}
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedWorkout.exercises.map((exercise, idx) => (
                    <div key={exercise.id} className="bg-black/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-semibold text-white">{exercise.name}</h4>
                        {exercise.video && <Play size={14} className="text-blue-400" />}
                      </div>
                      {exercise.video && (
                        <div className="mb-3 rounded-xl overflow-hidden">
                          <video src={exercise.video} controls playsInline preload="metadata" className="w-full" style={{ maxHeight: '160px' }} />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {exercise.sets.map((set, setIdx) => (
                          <span key={setIdx} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-amber-400">
                            {set.weight} · {set.reps}개 × {set.sets}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{exercise.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 식단 상세 */}
            {selectedDiet?.meals.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Utensils size={18} className="text-white/40" />
                  <span className="text-sm font-medium text-white/40">식단</span>
                  <span className="text-sm font-semibold text-emerald-400">{selectedDiet.meals.length}끼</span>
                </div>
                <div className="space-y-2">
                  {selectedDiet.meals.map((meal) => (
                    <div key={meal.id} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {meal.name.charAt(0)}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{meal.name}</h4>
                        <p className="text-xs text-white/40">{meal.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 데이터 없는 경우 */}
            {!selectedWorkout?.exercises.length && !selectedDiet?.meals.length && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={28} className="text-white/30" />
                </div>
                <p className="text-white/40 mb-5">기록이 없습니다</p>
                <button
                  onClick={() => {
                    setCurrentDate(selectedMonthDate);
                    setViewMode('daily');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
                >
                  기록 추가하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 날짜 선택 안내 */}
        {!selectedMonthDate && (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-white/30" />
            </div>
            <p className="text-white/40">날짜를 선택하세요</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* 헤더 */}
      <div className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10 border-b border-white/5">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-5 py-4">
          <button 
            onClick={() => {
              if (viewMode === 'daily') changeDate(-1);
              else if (viewMode === 'weekly') changeWeek(-1);
              else changeMonth(-1);
            }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            {viewMode === 'daily' && <h1 className="text-lg font-semibold">{formatDisplayDate(currentDate)}</h1>}
            {viewMode === 'weekly' && <h1 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {viewMode === 'monthly' && <h1 className="text-lg font-semibold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
          </div>
          <button 
            onClick={() => {
              if (viewMode === 'daily') changeDate(1);
              else if (viewMode === 'weekly') changeWeek(1);
              else changeMonth(1);
            }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* 뷰 모드 선택 */}
        <div className="flex justify-center gap-1 px-5 pb-4 max-w-2xl mx-auto">
          {[
            { mode: 'daily', label: '일별' },
            { mode: 'weekly', label: '주간' },
            { mode: 'monthly', label: '월간' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === mode 
                  ? 'bg-white text-slate-900' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 (일별만) */}
      {viewMode === 'daily' && (
        <div className="flex gap-2 px-5 py-3 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium ${
              activeTab === 'workout' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white/5 text-white/40'
            }`}
          >
            <Dumbbell size={18} />
            <span>운동</span>
          </button>
          <button
            onClick={() => setActiveTab('diet')}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium ${
              activeTab === 'diet' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                : 'bg-white/5 text-white/40'
            }`}
          >
            <Utensils size={18} />
            <span>식단</span>
          </button>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="relative">
        {viewMode === 'daily' && renderDailyView()}
        {viewMode === 'weekly' && renderWeeklyView()}
        {viewMode === 'monthly' && renderMonthlyView()}
      </div>

      {/* 라이브러리 모달 */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-hidden flex flex-col border-t border-white/10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">운동 라이브러리</h2>
              <button onClick={() => setShowLibraryModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={librarySearchTerm}
                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                placeholder="검색..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? (cat === '전체' ? 'bg-white text-slate-900' : categoryColors[cat]?.bg || 'bg-white/20') 
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredLibrary.map(exercise => {
                const isSelected = selectedExercises.includes(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    onClick={() => toggleExerciseSelection(exercise.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-blue-500/20 border-blue-500' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{exercise.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[exercise.category]?.light || 'bg-white/10'} ${categoryColors[exercise.category]?.text || 'text-white/60'}`}>
                            {exercise.category}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {exercise.sets.slice(0, 2).map((set, idx) => (
                            <span key={idx} className="text-xs text-amber-400/80">{set.weight} {set.reps}개</span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-white/10'}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedExercises.length > 0 && (
              <button
                onClick={handleImportFromLibrary}
                className="mt-4 w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/25"
              >
                {selectedExercises.length}개 가져오기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{activeTab === 'workout' ? '새 운동' : '식단 추가'}</h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            {activeTab === 'workout' ? (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">운동 이름</label>
                  <input
                    type="text"
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="MTS 로우"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">분류</label>
                  <div className="flex gap-2 flex-wrap">
                    {['등', '가슴', '어깨', '하체', '팔'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setExerciseForm(prev => ({ ...prev, category: cat }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          exerciseForm.category === cat 
                            ? categoryColors[cat]?.bg || 'bg-white/20' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">영상</label>
                  <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                    {exerciseForm.video ? (
                      <div className="text-center">
                        <Play size={24} className="mx-auto text-blue-400 mb-1" />
                        <span className="text-xs text-white/40">{exerciseForm.videoName}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video size={24} className="mx-auto text-white/30 mb-1" />
                        <span className="text-xs text-white/30">영상 추가</span>
                      </div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'exercise')} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">세트 정보</label>
                  {exerciseForm.sets.map((set, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={set.weight}
                        onChange={(e) => updateSetRow(index, 'weight', e.target.value)}
                        placeholder="무게"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30"
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSetRow(index, 'reps', e.target.value)}
                        placeholder="개수"
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30"
                      />
                      <input
                        type="number"
                        value={set.sets}
                        onChange={(e) => updateSetRow(index, 'sets', e.target.value)}
                        placeholder="세트"
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30"
                      />
                      {exerciseForm.sets.length > 1 && (
                        <button onClick={() => removeSetRow(index)} className="text-rose-400 px-2">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addSetRow} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2">
                    <Plus size={14} /> 세트 추가
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">자세 설명</label>
                  <textarea
                    value={exerciseForm.description}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="자세 및 주의사항"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* PT 수업 */}
                <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exerciseForm.isPT}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, isPT: e.target.checked }))}
                    className="w-5 h-5 rounded accent-amber-500"
                  />
                  <Star size={18} className="text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">PT 수업</p>
                    <p className="text-xs text-white/40">트레이너와 함께한 수업</p>
                  </div>
                </label>

                {/* 라이브러리 저장 */}
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exerciseForm.saveToLibrary}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, saveToLibrary: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">라이브러리에 저장</p>
                    <p className="text-xs text-white/40">다음에 다시 사용</p>
                  </div>
                </label>

                <button
                  onClick={handleAddExercise}
                  disabled={!exerciseForm.name}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none"
                >
                  추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">식사</label>
                  <input
                    type="text"
                    value={dietForm.name}
                    onChange={(e) => setDietForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="아침, 점심, 저녁, 간식"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">영상</label>
                  <label className="flex items-center justify-center w-full h-24 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                    {dietForm.video ? (
                      <div className="text-center">
                        <Play size={24} className="mx-auto text-emerald-400 mb-1" />
                        <span className="text-xs text-white/40">{dietForm.videoName}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video size={24} className="mx-auto text-white/30 mb-1" />
                        <span className="text-xs text-white/30">영상 추가</span>
                      </div>
                    )}
                    <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, 'diet')} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block tracking-wide uppercase">내용</label>
                  <textarea
                    value={dietForm.description}
                    onChange={(e) => setDietForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="먹은 음식"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20"
                  />
                </div>
                <button
                  onClick={handleAddMeal}
                  disabled={!dietForm.name}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:shadow-none"
                >
                  추가하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
