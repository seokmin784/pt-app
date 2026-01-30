import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Video, Dumbbell, Utensils, Trash2, Calendar, Play, Download, Search, Check, Star, User, FileText, Save, Pill, Droplets, Edit3, BookOpen, Camera, Link, Pause, AlertCircle, RefreshCw } from 'lucide-react';
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

// YouTube URL을 embed URL로 변환
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = null;
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) videoId = shortMatch[1];
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
  if (shortsMatch) videoId = shortsMatch[1];
  
  if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  return url;
};

// YouTube 썸네일 URL 가져오기
const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  
  let videoId = null;
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) videoId = shortMatch[1];
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
  if (shortsMatch) videoId = shortsMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) videoId = embedMatch[1];
  
  if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return null;
};

// 🔧 EXIF orientation을 읽고 이미지를 올바른 방향으로 회전시키는 함수
const fixImageOrientation = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target.result);
      
      // JPEG 파일인지 확인
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(file); // JPEG가 아니면 원본 반환
        return;
      }
      
      let offset = 2;
      const length = view.byteLength;
      let orientation = 1; // 기본 orientation
      
      while (offset < length) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          // EXIF marker 찾음
          const exifLength = view.getUint16(offset + 2, false);
          const exifStart = offset + 4;
          
          // "Exif" 문자열 확인
          if (view.getUint32(exifStart, false) === 0x45786966) {
            const tiffStart = exifStart + 6;
            const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
            const ifdStart = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
            const tagCount = view.getUint16(ifdStart, littleEndian);
            
            for (let i = 0; i < tagCount; i++) {
              const tagOffset = ifdStart + 2 + i * 12;
              if (view.getUint16(tagOffset, littleEndian) === 0x0112) {
                orientation = view.getUint16(tagOffset + 8, littleEndian);
                break;
              }
            }
          }
          break;
        }
        offset += 2;
        if (view.getUint16(offset, false) === 0xFFD9) break; // End of image
        offset += view.getUint16(offset, false);
      }
      
      // orientation이 1이면 회전 불필요
      if (orientation === 1) {
        resolve(file);
        return;
      }
      
      // 이미지를 캔버스에 그려서 올바른 방향으로 회전
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // orientation에 따라 캔버스 크기 설정
        if (orientation >= 5 && orientation <= 8) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        // orientation에 따라 변환 적용
        switch (orientation) {
          case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break;
          case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break;
          case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break;
          case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
          case 6: ctx.transform(0, 1, -1, 0, canvas.height, 0); break;
          case 7: ctx.transform(0, -1, -1, 0, canvas.height, canvas.width); break;
          case 8: ctx.transform(0, -1, 1, 0, 0, canvas.width); break;
          default: break;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const correctedFile = new File([blob], file.name || 'image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(correctedFile);
        }, 'image/jpeg', 0.92);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    };
    
    reader.onerror = () => resolve(file);
    reader.readAsArrayBuffer(file);
  });
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
  const [newLibraryExercise, setNewLibraryExercise] = useState({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingLibrarySave, setPendingLibrarySave] = useState(null);
  const [showSyncOptions, setShowSyncOptions] = useState(false);
  const [syncTarget, setSyncTarget] = useState(null);

  const defaultLibrary = [
    { id: 'lib-1', name: 'MTS 로우', category: '등', sets: [{ weight: '30', reps: 15, sets: 1 }, { weight: '50', reps: 15, sets: 1 }, { weight: '70', reps: 10, sets: 2 }], description: '팔각도가 90도정도로 땡겨지게끔 의자 높이 맞춰주기', video: '', memo: '' },
    { id: 'lib-2', name: '뉴텍 하이로우', category: '등', sets: [{ weight: '20', reps: 15, sets: 1 }, { weight: '30', reps: 12, sets: 3 }], description: '뒷꿈치 들어 앉은 상태서 가슴 살짝 말아주기', video: '', memo: '' },
    { id: 'lib-3', name: '랫풀다운', category: '등', sets: [{ weight: '50', reps: 15, sets: 1 }, { weight: '60', reps: 10, sets: 3 }], description: '상체 세워준 상태서 어깨 낮춰주기', video: '', memo: '' },
    { id: 'lib-4', name: '체스트프레스', category: '가슴', sets: [{ weight: '26', reps: 15, sets: 1 }, { weight: '47', reps: 10, sets: 1 }], description: '어깨낮춰 광배 잡고 가슴 들어준 상태서 밀기', video: '', memo: '' },
    { id: 'lib-5', name: '벤치프레스', category: '가슴', sets: [{ weight: '20', reps: 15, sets: 4 }], description: '바를 내렸을 때 명치 위쪽으로', video: '', memo: '' },
  ];

  const [exerciseLibrary, setExerciseLibrary] = useState(defaultLibrary);
  const [workoutData, setWorkoutData] = useState({});
  const [dietData, setDietData] = useState({});

  // 🔧 개선된 이미지 업로드 함수 - EXIF orientation 처리 포함
  const uploadImageToStorage = async (file) => {
    if (!userId) {
      console.error('업로드 실패: 로그인 필요');
      return { success: false, error: '로그인이 필요합니다' };
    }
    
    if (!file) {
      return { success: false, error: '파일이 없습니다' };
    }

    setUploadingPhoto(true);
    setUploadError(null);
    
    try {
      // EXIF orientation 보정
      const correctedFile = await fixImageOrientation(file);
      
      let fileExt = 'jpg';
      if (correctedFile.type) {
        const mimeMatch = correctedFile.type.match(/image\/(\w+)/);
        if (mimeMatch) {
          fileExt = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
        }
      }
      
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      console.log('업로드 시도:', { fileName, fileType: correctedFile.type, fileSize: correctedFile.size });
      
      const { data, error } = await supabase.storage
        .from('video')
        .upload(fileName, correctedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Supabase 업로드 에러:', error);
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from('video')
        .getPublicUrl(fileName);
      
      console.log('업로드 성공:', urlData.publicUrl);
      
      setUploadingPhoto(false);
      return { success: true, url: urlData.publicUrl };
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setUploadingPhoto(false);
      
      let errorMessage = '업로드에 실패했습니다';
      if (error.message?.includes('Bucket not found')) {
        errorMessage = '저장소를 찾을 수 없습니다';
      } else if (error.message?.includes('exceeded')) {
        errorMessage = '파일 크기가 너무 큽니다';
      } else if (error.message?.includes('Invalid')) {
        errorMessage = '유효하지 않은 파일입니다';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // 🔧 로컬 미리보기용 - EXIF 보정 포함
  const createLocalPreview = async (file) => {
    try {
      const correctedFile = await fixImageOrientation(file);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(correctedFile);
      });
    } catch (e) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
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
      
      // 🔧 수정: library_id 컬럼 사용
      const { data: library, error: libError } = await supabase.from('exercise_library').select('*').eq('user_id', uid);
      console.log('라이브러리 로드:', { library, error: libError });
      
      if (library && library.length > 0) {
        setExerciseLibrary(library.map(ex => ({ 
          id: ex.library_id || ex.id, // library_id 우선 사용
          name: ex.name, 
          category: ex.category, 
          sets: ex.sets || [], 
          description: ex.description, 
          video: ex.video || '', 
          memo: ex.memo || '' 
        })));
      } else {
        // 기본 라이브러리 저장
        const libraryWithNewIds = defaultLibrary.map((ex, idx) => ({
          ...ex,
          id: `lib-${Date.now()}-${idx}`
        }));
        await saveLibraryToSupabase(uid, libraryWithNewIds);
        setExerciseLibrary(libraryWithNewIds);
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

  // 🔧 수정된 라이브러리 저장 - id 대신 library_id 사용
  const saveLibraryToSupabase = async (uid, library) => {
    if (!uid) return;
    setIsSyncing(true);
    try {
      // 기존 데이터 삭제
      const { error: deleteError } = await supabase.from('exercise_library').delete().eq('user_id', uid);
      if (deleteError) {
        console.error('라이브러리 삭제 실패:', deleteError);
        throw deleteError;
      }
      
      if (library.length > 0) {
        // 🔧 핵심 수정: id 제외하고 library_id 컬럼으로 저장
        const insertData = library.map(ex => ({ 
          user_id: uid, 
          library_id: ex.id, // id 대신 library_id 컬럼 사용
          name: ex.name, 
          category: ex.category, 
          sets: ex.sets, 
          description: ex.description || '', 
          video: ex.video || '', 
          memo: ex.memo || '' 
        }));
        
        console.log('라이브러리 저장 시도:', insertData);
        
        const { data, error: insertError } = await supabase.from('exercise_library').insert(insertData);
        
        if (insertError) {
          console.error('라이브러리 저장 실패:', insertError);
          throw insertError;
        }
        
        console.log('라이브러리 저장 성공:', data);
      }
    } catch (error) { 
      console.error('라이브러리 저장 실패:', error); 
      alert('라이브러리 저장에 실패했습니다: ' + error.message);
    }
    setIsSyncing(false);
  };

  // 🔧 라이브러리 변경 시 모든 일별 데이터도 업데이트하는 함수
  const syncLibraryToWorkouts = async (updatedExercise, oldName = null) => {
    const searchName = oldName || updatedExercise.name;
    let hasChanges = false;
    const newWorkoutData = { ...workoutData };
    
    // 모든 날짜의 운동 데이터를 순회
    for (const [date, dayData] of Object.entries(workoutData)) {
      if (dayData.exercises && dayData.exercises.length > 0) {
        const updatedExercises = dayData.exercises.map(ex => {
          if (ex.name === searchName || ex.libraryId === updatedExercise.id) {
            hasChanges = true;
            return {
              ...ex,
              name: updatedExercise.name,
              category: updatedExercise.category,
              sets: JSON.parse(JSON.stringify(updatedExercise.sets)),
              description: updatedExercise.description,
              video: updatedExercise.video || '',
              libraryId: updatedExercise.id
            };
          }
          return ex;
        });
        
        if (JSON.stringify(updatedExercises) !== JSON.stringify(dayData.exercises)) {
          newWorkoutData[date] = { ...dayData, exercises: updatedExercises };
        }
      }
    }
    
    if (hasChanges) {
      setWorkoutData(newWorkoutData);
      // 변경된 모든 날짜 저장
      for (const [date, dayData] of Object.entries(newWorkoutData)) {
        if (workoutData[date] && JSON.stringify(workoutData[date]) !== JSON.stringify(dayData)) {
          await saveWorkoutToSupabase(date, dayData);
        }
      }
    }
    
    return hasChanges;
  };

  // 🔧 일별 운동 변경 시 라이브러리도 업데이트할지 묻는 함수
  const promptSyncToLibrary = (exercise) => {
    const libraryExercise = exerciseLibrary.find(e => e.name === exercise.name || e.id === exercise.libraryId);
    if (libraryExercise) {
      setSyncTarget({ exercise, libraryExercise });
      setShowSyncOptions(true);
    }
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
        await supabase.from('supplements').insert(supps.map(s => ({ id: s.id, user_id: userId, name: s.name, dosage: s.dosage })));
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

  const [exerciseForm, setExerciseForm] = useState({ name: '', category: '', video: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, memo: '' });
  const [dietForm, setDietForm] = useState({ name: '', description: '', photo: null, localPreview: null });

  // 🔧 개선된 사진 업로드 핸들러
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!userId) {
      setUploadError('로그인이 필요합니다');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('파일 크기는 10MB 이하여야 합니다');
      return;
    }
    
    setUploadError(null);
    
    // 즉시 로컬 미리보기 표시 (EXIF 보정 포함)
    const localPreview = await createLocalPreview(file);
    if (localPreview) {
      setDietForm(prev => ({ ...prev, localPreview }));
    }
    
    // 서버 업로드 시도
    const result = await uploadImageToStorage(file);
    
    if (result.success) {
      setDietForm(prev => ({ 
        ...prev, 
        photo: result.url,
        localPreview: null
      }));
    } else {
      setUploadError(result.error);
    }
    
    e.target.value = '';
  };

  const handleImportFromLibrary = () => {
    const toAdd = selectedExercises.map((id, idx) => {
      const ex = exerciseLibrary.find(e => e.id === id);
      return { 
        ...ex, 
        id: Date.now() + idx, 
        libraryId: ex.id, // 라이브러리 ID 연결
        sets: JSON.parse(JSON.stringify(ex.sets)) 
      };
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
    const libraryId = exerciseLibrary.find(e => e.name === exerciseForm.name)?.id || null;
    const newEx = { 
      id: Date.now(), 
      name: exerciseForm.name, 
      category: exerciseForm.category || todayWorkout.category || '미지정', 
      sets: exerciseForm.sets, 
      description: exerciseForm.description, 
      video: exerciseForm.video, 
      memo: exerciseForm.memo,
      libraryId: libraryId
    };
    
    if (exerciseForm.saveToLibrary && !exerciseLibrary.find(e => e.name === exerciseForm.name)) {
      const newLibEx = { ...newEx, id: `lib-${Date.now()}` };
      newEx.libraryId = newLibEx.id;
      const newLib = [...exerciseLibrary, newLibEx];
      setExerciseLibrary(newLib);
      await saveLibraryToSupabase(userId, newLib);
    }
    
    const newData = { category: workoutData[dateKey]?.category || exerciseForm.category || '미지정', isPT: exerciseForm.isPT || workoutData[dateKey]?.isPT || false, exercises: [...(workoutData[dateKey]?.exercises || []), newEx] };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
    setExerciseForm({ name: '', category: '', video: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: false, memo: '' });
    setShowAddModal(false);
  };

  const handleAddMeal = async () => {
    if (dietForm.localPreview && !dietForm.photo) {
      const confirmAdd = window.confirm('사진이 서버에 업로드되지 않았습니다. 사진 없이 저장하시겠습니까?');
      if (!confirmAdd) return;
    }
    
    const newMeal = { 
      id: Date.now(), 
      name: dietForm.name,
      description: dietForm.description,
      photo: dietForm.photo || null
    };
    const newData = { meals: [...(dietData[dateKey]?.meals || []), newMeal] };
    setDietData(prev => ({ ...prev, [dateKey]: newData }));
    await saveDietToSupabase(dateKey, newData);
    setDietForm({ name: '', description: '', photo: null, localPreview: null });
    setUploadError(null);
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

  // 🔧 개선된 운동 저장 - 동기화 옵션 제공
  const handleSaveExercise = async (syncToLibrary = false) => {
    const newData = { ...workoutData[dateKey], exercises: workoutData[dateKey].exercises.map(ex => ex.id === editingExercise.id ? editingExercise : ex) };
    setWorkoutData(prev => ({ ...prev, [dateKey]: newData }));
    await saveWorkoutToSupabase(dateKey, newData);
    
    // 라이브러리에도 동기화할지 확인
    if (syncToLibrary && editingExercise.libraryId) {
      const newLib = exerciseLibrary.map(ex => {
        if (ex.id === editingExercise.libraryId) {
          return {
            ...ex,
            name: editingExercise.name,
            category: editingExercise.category,
            sets: JSON.parse(JSON.stringify(editingExercise.sets)),
            description: editingExercise.description,
            video: editingExercise.video || '',
            memo: editingExercise.memo || ''
          };
        }
        return ex;
      });
      setExerciseLibrary(newLib);
      await saveLibraryToSupabase(userId, newLib);
      
      // 다른 날짜의 같은 운동도 업데이트
      await syncLibraryToWorkouts(editingExercise);
    }
    
    setShowEditModal(false);
    setEditingExercise(null);
  };

  const handleSaveToLibrary = async () => {
    if (!editingExercise) return;
    const existingIndex = exerciseLibrary.findIndex(e => e.name === editingExercise.name);
    if (existingIndex !== -1) {
      setPendingLibrarySave(editingExercise);
      setShowOverwriteConfirm(true);
    } else {
      const newLibraryEx = {
        id: `lib-${Date.now()}`,
        name: editingExercise.name,
        category: editingExercise.category,
        sets: JSON.parse(JSON.stringify(editingExercise.sets)),
        description: editingExercise.description,
        video: editingExercise.video || '',
        memo: editingExercise.memo || ''
      };
      
      // 현재 편집 중인 운동에 libraryId 연결
      const updatedExercise = { ...editingExercise, libraryId: newLibraryEx.id };
      setEditingExercise(updatedExercise);
      
      const newLib = [...exerciseLibrary, newLibraryEx];
      setExerciseLibrary(newLib);
      await saveLibraryToSupabase(userId, newLib);
      alert('라이브러리에 저장되었습니다!');
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingLibrarySave) return;
    
    const existingLibEx = exerciseLibrary.find(ex => ex.name === pendingLibrarySave.name);
    const libraryId = existingLibEx?.id;
    
    const newLib = exerciseLibrary.map(ex => {
      if (ex.name === pendingLibrarySave.name) {
        return {
          ...ex,
          category: pendingLibrarySave.category,
          sets: JSON.parse(JSON.stringify(pendingLibrarySave.sets)),
          description: pendingLibrarySave.description,
          video: pendingLibrarySave.video || '',
          memo: pendingLibrarySave.memo || ''
        };
      }
      return ex;
    });
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
    
    // 현재 편집 중인 운동에 libraryId 연결
    if (editingExercise && libraryId) {
      setEditingExercise(prev => ({ ...prev, libraryId }));
    }
    
    // 다른 날짜의 같은 운동도 업데이트
    const updatedEx = newLib.find(ex => ex.id === libraryId);
    if (updatedEx) {
      await syncLibraryToWorkouts(updatedEx);
    }
    
    setShowOverwriteConfirm(false);
    setPendingLibrarySave(null);
    alert('라이브러리가 업데이트되었습니다!');
  };

  const handleEditLibraryExercise = (ex) => { setEditingLibraryExercise({ ...ex, sets: JSON.parse(JSON.stringify(ex.sets)) }); setShowLibraryEditModal(true); };

  // 🔧 라이브러리 편집 시 일별 데이터도 동기화
  const handleSaveLibraryExercise = async () => {
    const oldName = exerciseLibrary.find(ex => ex.id === editingLibraryExercise.id)?.name;
    const newLib = exerciseLibrary.map(ex => ex.id === editingLibraryExercise.id ? editingLibraryExercise : ex);
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
    
    // 모든 일별 데이터 동기화
    const synced = await syncLibraryToWorkouts(editingLibraryExercise, oldName !== editingLibraryExercise.name ? oldName : null);
    
    setShowLibraryEditModal(false);
    setEditingLibraryExercise(null);
    
    if (synced) {
      alert('라이브러리와 연결된 모든 운동 기록이 업데이트되었습니다!');
    }
  };

  const handleAddNewLibraryExercise = async () => {
    const newEx = { ...newLibraryExercise, id: `lib-${Date.now()}` };
    const newLib = [...exerciseLibrary, newEx];
    setExerciseLibrary(newLib);
    await saveLibraryToSupabase(userId, newLib);
    setNewLibraryExercise({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: '' });
    setShowAddLibraryModal(false);
  };

  const handleDeleteFromLibrary = async (id) => {
    if (!window.confirm('라이브러리에서 삭제하시겠습니까? 일별 기록은 유지됩니다.')) return;
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

  const handleSelectDateFromCalendar = (date) => {
    setCurrentDate(date);
    setShowCalendarPopup(false);
  };

  const isInLibrary = (exerciseName) => {
    return exerciseLibrary.some(ex => ex.name === exerciseName);
  };

  const categoryColors = {
    '등': { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'text-blue-400', light: 'bg-blue-500/20', border: 'border-blue-500/30', dot: 'bg-blue-400' },
    '가슴': { bg: 'bg-gradient-to-r from-rose-500 to-rose-600', text: 'text-rose-400', light: 'bg-rose-500/20', border: 'border-rose-500/30', dot: 'bg-rose-400' },
    '하체': { bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', text: 'text-emerald-400', light: 'bg-emerald-500/20', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    '어깨': { bg: 'bg-gradient-to-r from-amber-500 to-amber-600', text: 'text-amber-400', light: 'bg-amber-500/20', border: 'border-amber-500/30', dot: 'bg-amber-400' },
    '팔': { bg: 'bg-gradient-to-r from-violet-500 to-violet-600', text: 'text-violet-400', light: 'bg-violet-500/20', border: 'border-violet-500/30', dot: 'bg-violet-400' },
    '코어': { bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600', text: 'text-cyan-400', light: 'bg-cyan-500/20', border: 'border-cyan-500/30', dot: 'bg-cyan-400' },
  };

  const categoryShort = {
    '등': '등',
    '가슴': '가슴',
    '하체': '하체',
    '어깨': '어깨',
    '팔': '팔',
    '코어': '코어',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-lg">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const SetInputRow = ({ set, index, onUpdate, onRemove, canRemove }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1 relative">
        <input type="text" value={set.weight} onChange={(e) => onUpdate(index, 'weight', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500/50 transition-all" placeholder="무게" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">kg</span>
      </div>
      <div className="w-24 relative">
        <input type="number" value={set.reps} onChange={(e) => onUpdate(index, 'reps', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-3 pr-7 text-white focus:outline-none focus:border-blue-500/50 transition-all" placeholder="횟수" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-sm">개</span>
      </div>
      <div className="w-24 relative">
        <input type="number" value={set.sets} onChange={(e) => onUpdate(index, 'sets', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-3 pr-9 text-white focus:outline-none focus:border-blue-500/50 transition-all" placeholder="세트" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-sm">세트</span>
      </div>
      {canRemove && <button onClick={() => onRemove(index)} className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all"><X size={16} /></button>}
    </div>
  );

  const YouTubeLinkInput = ({ value, onChange, label = '유튜브 링크' }) => {
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const thumbnail = getYouTubeThumbnail(value);
    const embedUrl = getYouTubeEmbedUrl(value);

    return (
      <div>
        <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">{label}</label>
        <div className="relative">
          <Link size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => { onChange(e.target.value); setPreviewPlaying(false); }}
            placeholder="https://youtube.com/watch?v=... 또는 https://youtu.be/..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        {value && thumbnail && (
          <div className="mt-3 relative rounded-xl overflow-hidden">
            {previewPlaying ? (
              <div className="relative pt-[56.25%] bg-black">
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button 
                  onClick={() => setPreviewPlaying(false)} 
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center z-10"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="cursor-pointer group" onClick={() => setPreviewPlaying(true)}>
                <img src={thumbnail} alt="YouTube thumbnail" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                    <Play size={28} className="text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
                  <Video size={12} className="text-red-500" /> YouTube
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ExerciseCard = ({ ex, onEdit, onDelete, exerciseLibrary }) => {
    const [localMemo, setLocalMemo] = useState(ex.memo || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const handleMemoSave = () => { updateExerciseMemo(ex.id, localMemo); };
    const thumbnail = getYouTubeThumbnail(ex.video);
    const embedUrl = getYouTubeEmbedUrl(ex.video);
    const inLibrary = exerciseLibrary.some(libEx => libEx.name === ex.name || libEx.id === ex.libraryId);

    return (
      <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl shadow-black/20">
        {ex.video && thumbnail && (
          <div className="relative bg-black/60">
            {isPlaying ? (
              <div className="relative pt-[56.25%]">
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button 
                  onClick={() => setIsPlaying(false)} 
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center z-10 border border-white/20"
                >
                  <Pause size={20} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="aspect-video cursor-pointer group" onClick={() => setIsPlaying(true)}>
                <img src={thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-600/90 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    <Play size={36} className="text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-xs text-white/80 flex items-center gap-1.5 border border-white/10">
                  <Video size={12} className="text-red-500" /><span>클릭하여 재생</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{ex.name}</h3>
                {inLibrary && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <BookOpen size={10} />
                    라이브러리
                  </span>
                )}
              </div>
              {ex.category && <span className={`text-xs px-3 py-1.5 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'} border ${categoryColors[ex.category]?.border || 'border-white/10'}`}>{ex.category}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(ex)} className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"><Edit3 size={18} /></button>
              <button onClick={() => onDelete(ex.id)} className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
            </div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4 mb-5 border border-white/[0.05]">
            {ex.sets.map((set, idx) => (
              <div key={idx} className="flex items-center text-sm py-3 border-b border-white/[0.05] last:border-0">
                <span className="text-white/40 w-16 font-medium">세트 {idx + 1}</span>
                <span className="text-amber-400 font-bold flex-1 text-lg">{set.weight}<span className="text-amber-400/60 text-sm ml-0.5">kg</span></span>
                <span className="text-white/80">{set.reps}개 × {set.sets}세트</span>
              </div>
            ))}
          </div>
          {ex.description && <p className="text-sm text-white/50 leading-relaxed mb-5 bg-black/20 rounded-xl p-4 border border-white/[0.05]">{ex.description}</p>}
          <div className="border-t border-white/[0.08] pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">메모</span>
              {localMemo !== (ex.memo || '') && <button onClick={handleMemoSave} className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium">저장</button>}
            </div>
            <textarea value={localMemo} onChange={(e) => setLocalMemo(e.target.value)} placeholder="이 운동에 대한 메모..." rows={2} className="w-full bg-black/20 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
          </div>
        </div>
      </div>
    );
  };

  const CalendarCell = ({ date, data, isToday, onClick, size = 'normal' }) => {
    const hasWorkout = data && data.exercises && data.exercises.length > 0;
    const isPT = data?.isPT;
    const category = data?.category;
    const categoryColor = categoryColors[category];

    if (size === 'small') {
      return (
        <button
          onClick={onClick}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative ${
            isToday ? 'ring-2 ring-blue-500' : ''
          } ${
            hasWorkout
              ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30'
              : 'bg-white/[0.02] hover:bg-white/[0.05]'
          }`}
        >
          {isPT && (
            <Star size={8} className="absolute top-1 right-1 text-amber-400" fill="currentColor" />
          )}
          <span className={`font-semibold ${hasWorkout ? 'text-white' : 'text-white/50'}`}>
            {date.getDate()}
          </span>
          {hasWorkout && category && (
            <span className={`text-[8px] mt-0.5 ${categoryColor?.text || 'text-white/40'}`}>
              {categoryShort[category] || category}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        onClick={onClick}
        className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative ${
          isToday ? 'ring-2 ring-blue-500' : ''
        } ${
          hasWorkout
            ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/30'
            : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06]'
        }`}
      >
        {isPT && (
          <Star size={12} className="absolute top-1.5 right-1.5 text-amber-400" fill="currentColor" />
        )}
        <span className={`text-lg font-bold ${hasWorkout ? 'text-white' : 'text-white/60'}`}>
          {date.getDate()}
        </span>
        {hasWorkout && category && (
          <span className={`text-[10px] mt-0.5 ${categoryColor?.text || 'text-white/40'}`}>
            {categoryShort[category] || category}
          </span>
        )}
      </button>
    );
  };

  const renderDailyView = () => (
    <div className="max-w-lg mx-auto px-5 py-6">
      {activeTab === 'workout' ? (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">종목</label>
              <input type="text" value={todayWorkout.category} onChange={(e) => updateCategory(e.target.value)} placeholder="등, 가슴, 하체..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-lg" />
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={togglePT} className={`px-6 py-4 rounded-2xl flex items-center gap-2 transition-all ${todayWorkout.isPT ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-xl shadow-amber-500/30' : 'bg-white/[0.03] border border-white/10 text-white/40'}`}>
                <Star size={18} fill={todayWorkout.isPT ? 'currentColor' : 'none'} />
                <span className="text-sm font-bold">PT</span>
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {todayWorkout.exercises.map((ex) => (<ExerciseCard key={ex.id} ex={ex} onEdit={handleEditExercise} onDelete={handleDeleteExercise} exerciseLibrary={exerciseLibrary} />))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowLibraryModal(true); setSelectedExercises([]); }} className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-semibold">
              <Download size={18} /><span>가져오기</span>
            </button>
            <button onClick={() => { setShowAddModal(true); setExerciseForm({ name: '', category: todayWorkout.category || '', video: '', sets: [{ weight: '', reps: '', sets: 1 }], description: '', saveToLibrary: true, isPT: todayWorkout.isPT, memo: '' }); }} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-blue-500/30">
              <Plus size={18} /><span>새로 추가</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'diet' ? (
        <div>
          <div className="space-y-4">
            {todayDiet.meals.map((meal) => (
              <div key={meal.id} className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-xl shadow-black/20">
                {/* 🔧 이미지가 잘리지 않도록 object-contain 사용 */}
                {meal.photo && (
                  <div className="bg-black/40 flex items-center justify-center">
                    <img 
                      src={meal.photo} 
                      alt={meal.name} 
                      className="w-full max-h-80 object-contain" 
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-emerald-400">{meal.name}</h3>
                    <button onClick={() => handleDeleteMeal(meal.id)} className="p-2.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-sm text-white/60 mt-3 leading-relaxed">{meal.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowAddModal(true); setDietForm({ name: '', description: '', photo: null, localPreview: null }); setUploadError(null); }} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-emerald-500/30">
            <Plus size={18} /><span>식단 추가</span>
          </button>
        </div>
      ) : activeTab === 'supplement' ? (
        <div>
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] mb-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30"><Droplets size={24} className="text-blue-400" /></div>
                <span className="font-bold text-white text-lg">물 섭취량</span>
              </div>
              <span className="text-3xl font-black text-blue-400">{todayWater}<span className="text-lg text-blue-400/60 ml-1">ml</span></span>
            </div>
            <div className="flex gap-2">
              {[250, 500].map(amt => (<button key={amt} onClick={() => updateWaterIntake(amt)} className="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/30 border border-blue-500/20">+{amt}ml</button>))}
              <button onClick={() => updateWaterIntake(-250)} className="px-5 py-3 bg-white/[0.03] text-white/50 rounded-xl font-medium hover:bg-white/[0.06] border border-white/10">-250ml</button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30"><Pill size={24} className="text-purple-400" /></div>
                <span className="font-bold text-white text-lg">영양제</span>
              </div>
              <span className="text-sm text-white/50 bg-white/[0.05] px-3 py-1.5 rounded-full">{todaySupplements.length}/{supplements.length} 완료</span>
            </div>
            <div className="space-y-3">
              {supplements.map(supp => (
                <div key={supp.id} className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/[0.05]">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleSupplementTaken(supp.id)} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${todaySupplements.includes(supp.id) ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500' : 'border-white/20'}`}>
                      {todaySupplements.includes(supp.id) && <Check size={16} className="text-white" />}
                    </button>
                    <div>
                      <p className={`font-semibold ${todaySupplements.includes(supp.id) ? 'text-white/40 line-through' : 'text-white'}`}>{supp.name}</p>
                      {supp.dosage && <p className="text-xs text-white/40 mt-0.5">{supp.dosage}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditSupplement(supp)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteSupplement(supp.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddSupplementModal(true)} className="w-full mt-4 py-3 border border-dashed border-white/20 rounded-xl text-white/50 font-medium hover:border-purple-500/40 hover:text-purple-400 flex items-center justify-center gap-2">
              <Plus size={18} />영양제 추가
            </button>
          </div>
        </div>
      ) : activeTab === 'memo' ? (
        <div>
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white text-lg">{formatDisplayDate(currentDate)}</span>
              <button onClick={() => saveMemoToSupabase(dateKey)} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium ${memoSaved ? 'bg-white/[0.05] text-white/40' : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'}`}>
                <Save size={16} />{memoSaved ? '저장됨' : '저장'}
              </button>
            </div>
            <textarea value={todayMemo} onChange={(e) => { setMemoData(prev => ({ ...prev, [dateKey]: e.target.value })); setMemoSaved(false); }} placeholder="오늘의 기록을 남겨보세요..." rows={8} className="w-full bg-black/20 border border-white/[0.05] rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none resize-none" />
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderWeeklyView = () => {
    const weekDates = getWeekDates();
    const stats = getWeeklyStats();
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['월', '화', '수', '목', '금', '토', '일'].map(day => <div key={day} className="text-center text-sm font-semibold text-white/50">{day}</div>)}
          {weekDates.map((date, idx) => {
            const key = formatDate(date);
            const data = workoutData[key];
            const isToday = formatDate(new Date()) === key;
            return (
              <CalendarCell
                key={idx}
                date={date}
                data={data}
                isToday={isToday}
                onClick={() => { setCurrentDate(date); setViewMode('daily'); }}
                size="normal"
              />
            );
          })}
        </div>
        <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] shadow-xl shadow-black/20">
          <h3 className="font-bold text-white text-lg mb-4">이번 주 통계</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.05]"><p className="text-3xl font-black text-blue-400">{stats.totalDays}</p><p className="text-sm text-white/50 mt-1">운동일</p></div>
            <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.05]"><p className="text-3xl font-black text-amber-400">{stats.ptDays}</p><p className="text-sm text-white/50 mt-1">PT</p></div>
            <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.05]"><p className="text-3xl font-black text-emerald-400">{stats.totalSets}</p><p className="text-sm text-white/50 mt-1">총 세트</p></div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const monthDates = getMonthDates();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {['월', '화', '수', '목', '금', '토', '일'].map(day => <div key={day} className="text-center text-sm font-semibold text-white/50 py-2">{day}</div>)}
          {Array(adjustedFirstDay).fill(null).map((_, idx) => <div key={`empty-${idx}`} />)}
          {monthDates.map((date, idx) => {
            const key = formatDate(date);
            const data = workoutData[key];
            const isToday = formatDate(new Date()) === key;
            return (
              <CalendarCell
                key={idx}
                date={date}
                data={data}
                isToday={isToday}
                onClick={() => { setCurrentDate(date); setViewMode('daily'); }}
                size="small"
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderDietMonthlyView = () => {
    const monthDates = getMonthDates();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    return (
      <div className="max-w-2xl mx-auto px-5 py-6">
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {['월', '화', '수', '목', '금', '토', '일'].map(day => <div key={day} className="text-center text-sm font-semibold text-white/50 py-2">{day}</div>)}
          {Array(adjustedFirstDay).fill(null).map((_, idx) => <div key={`empty-${idx}`} />)}
          {monthDates.map((date, idx) => {
            const key = formatDate(date);
            const data = dietData[key];
            const isToday = formatDate(new Date()) === key;
            const hasMeals = data && data.meals && data.meals.length > 0;
            return (
              <button key={idx} onClick={() => { setCurrentDate(date); setViewMode('daily'); setActiveTab('diet'); }} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm ${isToday ? 'ring-2 ring-emerald-500' : ''} ${hasMeals ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/30' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                <span className={`font-semibold ${hasMeals ? 'text-white' : 'text-white/50'}`}>{date.getDate()}</span>
                {hasMeals && <span className="text-[10px] text-emerald-400 mt-0.5">{data.meals.length}끼</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLibraryView = () => (
    <div className="max-w-lg mx-auto px-5 py-6">
      <div className="relative mb-5">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input type="text" value={librarySearchTerm} onChange={(e) => setLibrarySearchTerm(e.target.value)} placeholder="운동 검색..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap ${selectedCategory === cat ? (cat === '전체' ? 'bg-white text-slate-900' : `${categoryColors[cat]?.bg} text-white shadow-lg`) : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/10'}`}>{cat}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredLibrary.map(ex => (
          <div key={ex.id} className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-white text-lg">{ex.name}</h4>
                <span className={`text-xs px-2.5 py-1 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'} border ${categoryColors[ex.category]?.border || 'border-white/10'}`}>{ex.category}</span>
                {ex.video && <Video size={16} className="text-red-500" />}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEditLibraryExercise(ex)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"><Edit3 size={16} /></button>
                <button onClick={() => handleDeleteFromLibrary(ex.id)} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="text-sm text-white/50">
              {ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}<span className="text-amber-400 font-semibold">{s.weight}kg</span> {s.reps}개</span>)}
            </div>
            {ex.description && <p className="text-sm text-white/40 mt-2 truncate">{ex.description}</p>}
          </div>
        ))}
      </div>
      <button onClick={() => { setNewLibraryExercise({ name: '', category: '등', sets: [{ weight: '', reps: '', sets: 1 }], description: '', video: '' }); setShowAddLibraryModal(true); }} className="w-full mt-5 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-blue-500/30">
        <Plus size={18} /><span>라이브러리에 추가</span>
      </button>
    </div>
  );

  const renderMemoListView = () => {
    const allMemos = getAllMemos();
    return (
      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="space-y-4">
          {allMemos.length > 0 ? allMemos.map(([date, content]) => {
            const d = new Date(date);
            return (
              <div key={date} onClick={() => { setCurrentDate(d); setViewMode('daily'); setActiveTab('memo'); }} className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-2xl p-5 border border-white/[0.08] shadow-xl shadow-black/20 cursor-pointer hover:border-white/20">
                <p className="text-sm text-white/50 mb-2">{d.getFullYear()}.{d.getMonth() + 1}.{d.getDate()}</p>
                <p className="text-white leading-relaxed line-clamp-3">{content}</p>
              </div>
            );
          }) : (
            <div className="text-center py-16">
              <FileText size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40">아직 메모가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarPopup = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) dates.push(new Date(year, month, i));

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5" onClick={() => setShowCalendarPopup(false)}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><ChevronLeft size={20} /></button>
            <h3 className="text-lg font-bold text-white">{year}년 {month + 1}월</h3>
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {['월', '화', '수', '목', '금', '토', '일'].map(day => <div key={day} className="text-center text-sm font-semibold text-white/50 py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array(adjustedFirstDay).fill(null).map((_, idx) => <div key={`empty-${idx}`} />)}
            {dates.map((date, idx) => {
              const key = formatDate(date);
              const isToday = formatDate(new Date()) === key;
              const isSelected = formatDate(currentDate) === key;
              const data = workoutData[key];
              const hasWorkout = data?.exercises?.length > 0;
              const isPT = data?.isPT;
              const category = data?.category;
              const categoryColor = categoryColors[category];

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDateFromCalendar(date)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : isToday
                      ? 'ring-2 ring-blue-500 text-white'
                      : hasWorkout
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-white/60 hover:bg-white/[0.05]'
                  }`}
                >
                  {isPT && !isSelected && (
                    <Star size={8} className="absolute top-0.5 right-0.5 text-amber-400" fill="currentColor" />
                  )}
                  <span>{date.getDate()}</span>
                  {hasWorkout && category && !isSelected && (
                    <span className={`text-[7px] ${categoryColor?.text || 'text-white/40'}`}>
                      {categoryShort[category] || category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-5 py-4">
          <button onClick={() => { if (viewMode === 'daily') changeDate(-1); else if (viewMode === 'weekly') changeWeek(-1); else changeMonth(-1); }} className={`w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronLeft size={20} /></button>
          <div className="text-center">
            {viewMode === 'daily' && (<button onClick={() => setShowCalendarPopup(true)} className="text-lg font-bold hover:text-blue-400 flex items-center gap-2">{formatDisplayDate(currentDate)}<Calendar size={18} className="text-white/40" /></button>)}
            {['weekly', 'monthly', 'dietMonthly'].includes(viewMode) && <h1 className="text-lg font-bold">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h1>}
            {viewMode === 'library' && <h1 className="text-lg font-bold">라이브러리</h1>}
            {viewMode === 'memos' && <h1 className="text-lg font-bold">메모</h1>}
            {isSyncing && <p className="text-xs text-blue-400 mt-1">동기화 중...</p>}
          </div>
          <button onClick={() => { if (viewMode === 'daily') changeDate(1); else if (viewMode === 'weekly') changeWeek(1); else changeMonth(1); }} className={`w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center ${['library', 'memos'].includes(viewMode) ? 'invisible' : ''}`}><ChevronRight size={20} /></button>
        </div>
        <div className="flex justify-between items-center px-5 pb-4 max-w-2xl mx-auto">
          <div className="flex gap-1.5 overflow-x-auto">
            {[{ mode: 'daily', label: '일별' }, { mode: 'weekly', label: '주간' }, { mode: 'monthly', label: '월간' }, { mode: 'dietMonthly', label: '식단', icon: Utensils }, { mode: 'library', label: '라이브러리', icon: BookOpen }, { mode: 'memos', label: '메모', icon: FileText }].map(({ mode, label, icon: Icon }) => (
              <button key={mode} onClick={() => { setViewMode(mode); setSelectedMonthDate(null); }} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 ${viewMode === mode ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'}`}>
                {Icon && <Icon size={14} />}{label}
              </button>
            ))}
          </div>
          <button onClick={() => userId ? handleLogout() : setShowLoginModal(true)} className="ml-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] whitespace-nowrap border border-white/10">
            <User size={16} className="text-white/60" /><span className="text-sm font-medium text-white/60">{userId || '로그인'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div className="flex gap-2 px-5 py-4 max-w-lg mx-auto">
          {[{ tab: 'workout', label: '운동', icon: Dumbbell, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/30' }, { tab: 'diet', label: '식단', icon: Utensils, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/30' }, { tab: 'supplement', label: '영양제', icon: Pill, gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/30' }, { tab: 'memo', label: '메모', icon: FileText, gradient: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/30' }].map(({ tab, label, icon: Icon, gradient, shadow }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold ${activeTab === tab ? `bg-gradient-to-r ${gradient} text-white shadow-xl ${shadow}` : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'}`}>
              <Icon size={18} /><span>{label}</span>
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

      {showCalendarPopup && renderCalendarPopup()}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/30"><User size={40} /></div>
              <h2 className="text-2xl font-black mb-2">로그인</h2>
              <p className="text-sm text-white/50">닉네임을 입력하세요</p>
            </div>
            <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="닉네임 (예: seokmin)" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 mb-5 text-lg" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin} disabled={!loginInput.trim()} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 disabled:shadow-none">시작하기</button>
            <p className="text-xs text-white/30 text-center mt-5">같은 닉네임으로 어디서든 데이터에 접근할 수 있어요</p>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">{activeTab === 'workout' ? '새 운동' : '식단 추가'}</h2>
              <button onClick={() => { setShowAddModal(false); setUploadError(null); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            {activeTab === 'workout' ? (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">운동 이름</label>
                  <input type="text" value={exerciseForm.name} onChange={(e) => setExerciseForm(p => ({ ...p, name: e.target.value }))} placeholder="MTS 로우" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">분류</label>
                  <div className="flex gap-2 flex-wrap">
                    {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (
                      <button key={cat} onClick={() => setExerciseForm(p => ({ ...p, category: cat }))} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${exerciseForm.category === cat ? `${categoryColors[cat]?.bg} text-white shadow-lg` : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/10'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <YouTubeLinkInput
                  value={exerciseForm.video}
                  onChange={(val) => setExerciseForm(p => ({ ...p, video: val }))}
                />
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">세트 정보</label>
                  {exerciseForm.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateSetRow} onRemove={removeSetRow} canRemove={exerciseForm.sets.length > 1} />)}
                  <button onClick={addSetRow} className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 mt-2"><Plus size={16} /> 세트 추가</button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">자세 설명</label>
                  <textarea value={exerciseForm.description} onChange={(e) => setExerciseForm(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={2} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setExerciseForm(p => ({ ...p, saveToLibrary: !p.saveToLibrary }))} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${exerciseForm.saveToLibrary ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500' : 'border-white/20'}`}>
                    {exerciseForm.saveToLibrary && <Check size={16} className="text-white" />}
                  </button>
                  <span className="text-sm text-white/60">라이브러리에 저장</span>
                </div>
                <button onClick={handleAddExercise} disabled={!exerciseForm.name} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl font-bold shadow-xl shadow-blue-500/30 disabled:shadow-none">추가하기</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">식사 이름</label>
                  <input type="text" value={dietForm.name} onChange={(e) => setDietForm(p => ({ ...p, name: e.target.value }))} placeholder="아침, 점심, 저녁..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
                </div>
                {/* 🔧 개선된 사진 업로드 UI - 이미지 잘리지 않도록 */}
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">사진</label>
                  <label className="flex items-center justify-center w-full min-h-[160px] bg-white/[0.03] border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/[0.05] overflow-hidden relative">
                    {uploadingPhoto ? (
                      <div className="text-center py-8">
                        <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <span className="text-sm text-white/50">업로드 중...</span>
                      </div>
                    ) : (dietForm.photo || dietForm.localPreview) ? (
                      <div className="w-full flex flex-col items-center">
                        {/* 이미지가 잘리지 않도록 object-contain 사용 */}
                        <img 
                          src={dietForm.photo || dietForm.localPreview} 
                          alt="Preview" 
                          className="max-w-full max-h-60 object-contain" 
                        />
                        {/* 업로드 상태 표시 */}
                        <div className="absolute bottom-2 right-2">
                          {dietForm.photo ? (
                            <span className="px-2 py-1 bg-emerald-500/80 rounded-lg text-xs text-white flex items-center gap-1">
                              <Check size={12} /> 업로드 완료
                            </span>
                          ) : dietForm.localPreview ? (
                            <span className="px-2 py-1 bg-amber-500/80 rounded-lg text-xs text-white flex items-center gap-1">
                              <AlertCircle size={12} /> 로컬 미리보기
                            </span>
                          ) : null}
                        </div>
                        {/* 사진 변경 버튼 */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-black/60 rounded-lg text-xs text-white">
                            탭하여 변경
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Camera size={36} className="mx-auto text-white/30 mb-3" />
                        <span className="text-sm text-white/40 block">카메라로 촬영</span>
                        <span className="text-xs text-white/30">또는 앨범에서 선택</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                      disabled={uploadingPhoto} 
                    />
                  </label>
                  {/* 에러 메시지 표시 */}
                  {uploadError && (
                    <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400">{uploadError}</span>
                      <button 
                        onClick={() => setUploadError(null)} 
                        className="ml-auto text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {/* 로컬 미리보기만 있을 때 재시도 버튼 */}
                  {dietForm.localPreview && !dietForm.photo && !uploadingPhoto && (
                    <p className="mt-2 text-xs text-amber-400">
                      ⚠️ 사진이 서버에 업로드되지 않았습니다. 다시 촬영하거나 다른 사진을 선택해주세요.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">설명</label>
                  <textarea value={dietForm.description} onChange={(e) => setDietForm(p => ({ ...p, description: e.target.value }))} placeholder="먹은 음식..." rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500/50" />
                </div>
                <button onClick={handleAddMeal} disabled={!dietForm.name} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl font-bold shadow-xl shadow-emerald-500/30 disabled:shadow-none">추가하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">라이브러리에서 가져오기</h2>
              <button onClick={() => setShowLibraryModal(false)} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="relative mb-4">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={librarySearchTerm} onChange={(e) => setLibrarySearchTerm(e.target.value)} placeholder="검색..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${selectedCategory === cat ? (cat === '전체' ? 'bg-white text-slate-900' : `${categoryColors[cat]?.bg} text-white`) : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'}`}>{cat}</button>))}
            </div>
            <div className="space-y-2 mb-4">
              {filteredLibrary.map(ex => (
                <div key={ex.id} onClick={() => toggleExerciseSelection(ex.id)} className={`p-4 rounded-2xl cursor-pointer ${selectedExercises.includes(ex.id) ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${selectedExercises.includes(ex.id) ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500' : 'border-white/30'}`}>
                      {selectedExercises.includes(ex.id) && <Check size={16} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{ex.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[ex.category]?.light || 'bg-white/10'} ${categoryColors[ex.category]?.text || 'text-white/60'}`}>{ex.category}</span>
                        {ex.video && <Video size={14} className="text-red-500" />}
                      </div>
                      <div className="text-sm text-white/50">{ex.sets.map((s, i) => <span key={i}>{i > 0 && ' → '}{s.weight}kg {s.reps}개</span>)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedExercises.length > 0 && (<button onClick={handleImportFromLibrary} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold shadow-xl shadow-blue-500/30">{selectedExercises.length}개 가져오기</button>)}
          </div>
        </div>
      )}

      {showEditModal && editingExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">운동 편집</h2>
              <button onClick={() => { setShowEditModal(false); setEditingExercise(null); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">운동 이름</label>
                <input type="text" value={editingExercise.name} onChange={(e) => setEditingExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (<button key={cat} onClick={() => setEditingExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${editingExercise.category === cat ? `${categoryColors[cat]?.bg} text-white shadow-lg` : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/10'}`}>{cat}</button>))}
                </div>
              </div>
              <YouTubeLinkInput
                value={editingExercise.video}
                onChange={(val) => setEditingExercise(p => ({ ...p, video: val }))}
              />
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">세트 정보</label>
                {editingExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateEditingSet} onRemove={removeEditingSetRow} canRemove={editingExercise.sets.length > 1} />)}
                <button onClick={addEditingSetRow} className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 mt-2"><Plus size={16} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">자세 설명</label>
                <textarea value={editingExercise.description} onChange={(e) => setEditingExercise(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500/50" />
              </div>
              <button onClick={handleSaveToLibrary} className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30">
                <BookOpen size={18} />라이브러리에 저장
              </button>
              {/* 🔧 라이브러리 동기화 옵션 추가 */}
              {editingExercise.libraryId && (
                <div className="flex gap-3">
                  <button onClick={() => handleSaveExercise(false)} className="flex-1 py-4 bg-white/[0.05] hover:bg-white/10 border border-white/10 rounded-2xl font-bold">오늘만 저장</button>
                  <button onClick={() => handleSaveExercise(true)} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
                    <RefreshCw size={16} />전체 동기화
                  </button>
                </div>
              )}
              {!editingExercise.libraryId && (
                <button onClick={() => handleSaveExercise(false)} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold shadow-xl shadow-blue-500/30">저장하기</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showOverwriteConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30"><BookOpen size={32} className="text-amber-400" /></div>
              <h3 className="text-xl font-black mb-2">덮어쓰기 확인</h3>
              <p className="text-white/60 leading-relaxed">라이브러리에 "<span className="text-amber-400 font-semibold">{pendingLibrarySave?.name}</span>" 운동이 이미 존재합니다.</p>
              <p className="text-white/40 text-sm mt-2">기존 데이터를 덮어쓰고 모든 기록을 업데이트하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowOverwriteConfirm(false); setPendingLibrarySave(null); }} className="flex-1 py-3.5 bg-white/[0.05] hover:bg-white/10 rounded-xl font-semibold border border-white/10">취소</button>
              <button onClick={handleConfirmOverwrite} className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold shadow-lg shadow-amber-500/30">덮어쓰기</button>
            </div>
          </div>
        </div>
      )}

      {showLibraryEditModal && editingLibraryExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">라이브러리 편집</h2>
              <button onClick={() => { setShowLibraryEditModal(false); setEditingLibraryExercise(null); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            {/* 🔧 동기화 안내 메시지 */}
            <div className="mb-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <RefreshCw size={16} />
                <span className="font-semibold text-sm">자동 동기화</span>
              </div>
              <p className="text-xs text-white/50">라이브러리를 수정하면 연결된 모든 일별 운동 기록도 함께 업데이트됩니다.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">운동 이름</label>
                <input type="text" value={editingLibraryExercise.name} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (<button key={cat} onClick={() => setEditingLibraryExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${editingLibraryExercise.category === cat ? `${categoryColors[cat]?.bg} text-white shadow-lg` : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/10'}`}>{cat}</button>))}
                </div>
              </div>
              <YouTubeLinkInput
                value={editingLibraryExercise.video}
                onChange={(val) => setEditingLibraryExercise(p => ({ ...p, video: val }))}
              />
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">세트 정보</label>
                {editingLibraryExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateLibraryEditingSet} onRemove={removeLibraryEditingSetRow} canRemove={editingLibraryExercise.sets.length > 1} />)}
                <button onClick={addLibraryEditingSetRow} className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 mt-2"><Plus size={16} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">자세 설명</label>
                <textarea value={editingLibraryExercise.description} onChange={(e) => setEditingLibraryExercise(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500/50" />
              </div>
              <button onClick={handleSaveLibraryExercise} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
                <RefreshCw size={18} />저장 및 전체 동기화
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">라이브러리에 추가</h2>
              <button onClick={() => setShowAddLibraryModal(false)} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">운동 이름</label>
                <input type="text" value={newLibraryExercise.name} onChange={(e) => setNewLibraryExercise(p => ({ ...p, name: e.target.value }))} placeholder="운동 이름" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">분류</label>
                <div className="flex gap-2 flex-wrap">
                  {['등', '가슴', '어깨', '하체', '팔', '코어'].map(cat => (<button key={cat} onClick={() => setNewLibraryExercise(p => ({ ...p, category: cat }))} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${newLibraryExercise.category === cat ? `${categoryColors[cat]?.bg} text-white shadow-lg` : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.06] border border-white/10'}`}>{cat}</button>))}
                </div>
              </div>
              <YouTubeLinkInput
                value={newLibraryExercise.video}
                onChange={(val) => setNewLibraryExercise(p => ({ ...p, video: val }))}
              />
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">세트 정보</label>
                {newLibraryExercise.sets.map((set, idx) => <SetInputRow key={idx} set={set} index={idx} onUpdate={updateNewLibrarySet} onRemove={removeNewLibrarySetRow} canRemove={newLibraryExercise.sets.length > 1} />)}
                <button onClick={addNewLibrarySetRow} className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 mt-2"><Plus size={16} /> 세트 추가</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">자세 설명</label>
                <textarea value={newLibraryExercise.description} onChange={(e) => setNewLibraryExercise(p => ({ ...p, description: e.target.value }))} placeholder="자세 및 주의사항" rows={2} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-blue-500/50" />
              </div>
              <button onClick={handleAddNewLibraryExercise} disabled={!newLibraryExercise.name} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl font-bold shadow-xl shadow-blue-500/30 disabled:shadow-none">추가하기</button>
            </div>
          </div>
        </div>
      )}

      {showAddSupplementModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">영양제 추가</h2>
              <button onClick={() => setShowAddSupplementModal(false)} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">영양제 이름</label>
                <input type="text" value={newSupplement.name} onChange={(e) => setNewSupplement(p => ({ ...p, name: e.target.value }))} placeholder="비타민D" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">복용량 (선택)</label>
                <input type="text" value={newSupplement.dosage} onChange={(e) => setNewSupplement(p => ({ ...p, dosage: e.target.value }))} placeholder="1정, 2캡슐 등" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" />
              </div>
              <button onClick={handleAddSupplement} disabled={!newSupplement.name} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl font-bold shadow-xl shadow-purple-500/30 disabled:shadow-none">추가하기</button>
            </div>
          </div>
        </div>
      )}

      {showEditSupplementModal && editingSupplement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">영양제 편집</h2>
              <button onClick={() => { setShowEditSupplementModal(false); setEditingSupplement(null); }} className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">영양제 이름</label>
                <input type="text" value={editingSupplement.name} onChange={(e) => setEditingSupplement(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-2 block uppercase tracking-wider">복용량</label>
                <input type="text" value={editingSupplement.dosage} onChange={(e) => setEditingSupplement(p => ({ ...p, dosage: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50" />
              </div>
              <button onClick={handleSaveSupplement} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold shadow-xl shadow-purple-500/30">저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
