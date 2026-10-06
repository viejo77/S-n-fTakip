import React, { useState, useEffect, useRef } from 'react';
import {
  initialSchoolInfo,
  initialClasses,
  initialScheduleSlots,
} from './data/initialData';
import {
  SchoolInfo,
  ClassGroup,
  Student,
  ScheduleSlot,
  AssessmentCriterion,
  CriterionScoreHistory,
} from './types';
import { initialCriteria, getStudentCriterionScore } from './utils/criteria';
import {
  auth,
  signInWithGoogle,
  logOut,
  saveWorkspaceToCloud,
  fetchWorkspaceFromCloud,
  subscribeToWorkspace,
  testConnection,
} from './services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Header } from './components/Header';
import { DrawerMenu } from './components/DrawerMenu';
import { OverviewScheduleView } from './components/OverviewScheduleView';
import { LiveParticipationView } from './components/LiveParticipationView';
import { CriteriaGradebookView } from './components/CriteriaGradebookView';
import { AnalyticsView } from './components/AnalyticsView';
import { RandomStudentModal } from './components/RandomStudentModal';
import { ReportModal } from './components/ReportModal';
import { ClassModal } from './components/ClassModal';
import { StudentModal } from './components/StudentModal';
import { SchoolModal } from './components/SchoolModal';
import { StudentCriteriaModal } from './components/StudentCriteriaModal';
import { CriteriaManagementModal } from './components/CriteriaManagementModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { FirebaseDomainGuideModal } from './components/FirebaseDomainGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, X } from 'lucide-react';

const STORAGE_KEY = 'siniftakip_state_v1';

export default function App() {
  // Load saved state or default
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schoolInfo) return parsed.schoolInfo;
      }
    } catch (e) {
      console.error(e);
    }
    return initialSchoolInfo;
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.classes && parsed.classes.length > 0) return parsed.classes;
      }
    } catch (e) {
      console.error(e);
    }
    return initialClasses;
  });

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scheduleSlots) return parsed.scheduleSlots;
      }
    } catch (e) {
      console.error(e);
    }
    return initialScheduleSlots;
  });

  const [criteria, setCriteria] = useState<AssessmentCriterion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.criteria && parsed.criteria.length > 0) return parsed.criteria;
      }
    } catch (e) {
      console.error(e);
    }
    return initialCriteria;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    return classes[0]?.id || 'class-atp-9a';
  });

  const [currentTab, setCurrentTab] = useState<'overview' | 'live' | 'gradebook' | 'report'>('overview');

  // Drawer & Search
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRandomPickerOpen, setIsRandomPickerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetClass, setReportTargetClass] = useState<ClassGroup | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalInitialTab, setStudentModalInitialTab] = useState<'single' | 'bulk'>('single');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isCriteriaManagementOpen, setIsCriteriaManagementOpen] = useState(false);
  const [selectedStudentForCriteria, setSelectedStudentForCriteria] = useState<Student | null>(null);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState(false);
  const [isDomainGuideOpen, setIsDomainGuideOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Firebase Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const isInitialCloudSyncDoneRef = useRef(false);
  const isSavingToCloudRef = useRef(false);
  const lastCloudUpdateTimestampRef = useRef<string>('');

  // Sync to LocalStorage & generate smart share link with state
  const handleSyncToLink = () => {
    setIsSyncing(true);
    try {
      const stateToSave = {
        schoolInfo,
        classes,
        scheduleSlots,
        criteria,
        lastUpdated: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

      // Generate a share link containing the encoded state so it works seamlessly on any device or domain
      const jsonStr = JSON.stringify(stateToSave);
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      const baseShareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-d6h6duaquawsqjpt5t3pgf-26917758873.europe-west2.run.app';
      const shareUrlWithData = `${baseShareUrl}/#state=${encoded}`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrlWithData).catch(() => {});
      }

      setGlobalToast({
        message: '✓ Çalışmanız kaydedildi ve sınıflarınızı içeren akıllı link panoya kopyalandı! Bu linki telefonda açabilirsiniz.',
        type: 'success',
      });
    } catch {
      setGlobalToast({
        message: '✓ Çalışmanız başarıyla kaydedildi.',
        type: 'success',
      });
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Import JSON backup
  const handleImportState = (data: any) => {
    if (data.classes && Array.isArray(data.classes)) {
      setClasses(data.classes);
      if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
      if (data.scheduleSlots) setScheduleSlots(data.scheduleSlots);
      if (data.criteria) setCriteria(data.criteria);
      if (data.classes[0]?.id) setActiveClassId(data.classes[0].id);

      setGlobalToast({
        message: `✓ Yedek başarıyla yüklendi! (${data.classes.length} sınıf aktarıldı)`,
        type: 'success',
      });
    }
  };

  // Support importing state from URL hash (#state=...)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#state=')) {
        const raw = window.location.hash.slice(7);
        const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
        if (decoded.classes && Array.isArray(decoded.classes)) {
          setClasses(decoded.classes);
          if (decoded.schoolInfo) setSchoolInfo(decoded.schoolInfo);
          if (decoded.scheduleSlots) setScheduleSlots(decoded.scheduleSlots);
          if (decoded.criteria) setCriteria(decoded.criteria);
          if (decoded.classes[0]?.id) setActiveClassId(decoded.classes[0].id);
          setGlobalToast({
            message: `✓ Paylaşılan sınıflar ve veriler başarıyla yüklendi! (${decoded.classes.length} sınıf)`,
            type: 'success',
          });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    } catch (e) {
      console.error('Failed to parse state from URL hash', e);
    }
  }, []);

  // Firebase Auth & Cloud Sync Initialization
  useEffect(() => {
    testConnection().then((ok) => setIsCloudConnected(ok));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        isInitialCloudSyncDoneRef.current = false;
        return;
      }

      setIsCloudSyncing(true);
      try {
        const cloudData = await fetchWorkspaceFromCloud(user.uid);
        if (cloudData && cloudData.classes && cloudData.classes.length > 0) {
          setSchoolInfo(cloudData.schoolInfo);
          setClasses(cloudData.classes);
          setScheduleSlots(cloudData.scheduleSlots || []);
          setCriteria(cloudData.criteria || []);
          if (cloudData.classes[0]?.id) setActiveClassId(cloudData.classes[0].id);
          lastCloudUpdateTimestampRef.current = cloudData.updatedAt || '';
          setGlobalToast({
            message: `✓ Bulut veritabanı bağlandı! (${cloudData.classes.length} sınıf eşitlendi)`,
            type: 'success',
          });
        } else {
          // First time this Google user logs in: save existing local classes to cloud!
          await saveWorkspaceToCloud(user.uid, {
            schoolInfo,
            classes,
            scheduleSlots,
            criteria,
          });
          setGlobalToast({
            message: '✓ Sınıflarınız ve öğrencileriniz Google Firebase bulutuna kaydedildi!',
            type: 'success',
          });
        }
      } catch (e) {
        console.error('Failed to sync on auth change:', e);
      } finally {
        setIsCloudSyncing(false);
        // Only allow automatic writes AFTER initial cloud sync check completes!
        isInitialCloudSyncDoneRef.current = true;
      }
    });

    return () => unsubscribe();
  }, []);

  // Realtime Cloud Synchronization across Devices (Computer, Phone, Tablet)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeRealtime = subscribeToWorkspace(
      currentUser.uid,
      (cloudData) => {
        // If we are currently saving to cloud ourselves, ignore our own echo
        if (isSavingToCloudRef.current) return;

        if (cloudData && cloudData.classes && cloudData.classes.length > 0) {
          if (cloudData.updatedAt && cloudData.updatedAt === lastCloudUpdateTimestampRef.current) {
            return;
          }
          lastCloudUpdateTimestampRef.current = cloudData.updatedAt || '';
          setSchoolInfo(cloudData.schoolInfo);
          setClasses(cloudData.classes);
          setScheduleSlots(cloudData.scheduleSlots || []);
          setCriteria(cloudData.criteria || []);
          setGlobalToast({
            message: `✓ Cihazlar arası bulut senkronizasyonu güncellendi! (${cloudData.classes.length} sınıf)`,
            type: 'success',
          });
        }
      },
      (err) => {
        console.error('Realtime sync listener error:', err);
      }
    );

    return () => unsubscribeRealtime();
  }, [currentUser]);

  // 40-minute Lesson Timer
  const [timerMinutes, setTimerMinutes] = useState(40);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Sync to LocalStorage & Firebase Cloud (when logged in)
  useEffect(() => {
    try {
      const stateToSave = {
        schoolInfo,
        classes,
        scheduleSlots,
        criteria,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // Only auto-save to cloud if user is logged in AND initial cloud fetch has completed!
    if (currentUser && isInitialCloudSyncDoneRef.current) {
      const timer = setTimeout(async () => {
        try {
          isSavingToCloudRef.current = true;
          setIsCloudSyncing(true);
          const timestamp = new Date().toISOString();
          lastCloudUpdateTimestampRef.current = timestamp;
          await saveWorkspaceToCloud(currentUser.uid, {
            schoolInfo,
            classes,
            scheduleSlots,
            criteria,
          });
        } catch (e) {
          console.error('Failed to sync to cloud:', e);
        } finally {
          setTimeout(() => {
            setIsCloudSyncing(false);
            isSavingToCloudRef.current = false;
          }, 400);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [schoolInfo, classes, scheduleSlots, criteria, currentUser]);

  // Auth & Cloud Action Handlers
  const handleSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setGlobalToast({
          message: `✓ Hoş geldiniz ${user.displayName || user.email}! Bulut veritabanı aktif.`,
          type: 'success',
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      if (
        errorCode === 'auth/unauthorized-domain' ||
        errorMessage.includes('unauthorized-domain') ||
        errorMessage.includes('authorized domain')
      ) {
        setIsDomainGuideOpen(true);
        setGlobalToast({
          message: 'Vercel alan adı izni gerekli: Firebase ayarlarından alan adınızı onaylamalısınız.',
          type: 'error',
        });
      } else if (errorCode === 'auth/popup-blocked') {
        setGlobalToast({
          message: 'Tarayıcınız açılır pencereyi engelledi. Lütfen açılır pencerelere izin verip tekrar deneyin.',
          type: 'error',
        });
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setGlobalToast({
          message: 'Google giriş penceresi kapatıldı.',
          type: 'info',
        });
      } else if (errorCode === 'auth/operation-not-allowed') {
        setIsDomainGuideOpen(true);
        setGlobalToast({
          message: 'Firebase Console üzerinde Google ile Giriş yöntemi aktif edilmemiş olabilir.',
          type: 'error',
        });
      } else {
        setGlobalToast({
          message: 'Google ile giriş iptal edildi veya bir hata oluştu.',
          type: 'info',
        });
      }
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setGlobalToast({
        message: 'Google hesabından çıkış yapıldı. Verileriniz yerel hafızada korunuyor.',
        type: 'info',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSaveToCloud = async () => {
    if (!currentUser) {
      handleSignInWithGoogle();
      return;
    }
    setIsCloudSyncing(true);
    isSavingToCloudRef.current = true;
    try {
      const timestamp = new Date().toISOString();
      lastCloudUpdateTimestampRef.current = timestamp;
      await saveWorkspaceToCloud(currentUser.uid, {
        schoolInfo,
        classes,
        scheduleSlots,
        criteria,
      });
      setGlobalToast({
        message: '✓ Tüm sınıflar ve öğrenciler Google Firebase bulutuna kaydedildi!',
        type: 'success',
      });
    } catch (e) {
      setGlobalToast({
        message: 'Bulut kaydetmede bir sorun oluştu.',
        type: 'error',
      });
    } finally {
      setTimeout(() => {
        setIsCloudSyncing(false);
        isSavingToCloudRef.current = false;
      }, 400);
    }
  };

  const handleFetchFromCloud = async () => {
    if (!currentUser) {
      handleSignInWithGoogle();
      return;
    }
    setIsCloudSyncing(true);
    try {
      const cloudData = await fetchWorkspaceFromCloud(currentUser.uid);
      if (cloudData && cloudData.classes && cloudData.classes.length > 0) {
        lastCloudUpdateTimestampRef.current = cloudData.updatedAt || '';
        setSchoolInfo(cloudData.schoolInfo);
        setClasses(cloudData.classes);
        setScheduleSlots(cloudData.scheduleSlots || []);
        setCriteria(cloudData.criteria || []);
        if (cloudData.classes[0]?.id) setActiveClassId(cloudData.classes[0].id);
        setGlobalToast({
          message: `✓ Buluttan veriler başarıyla çekildi! (${cloudData.classes.length} sınıf)`,
          type: 'success',
        });
      } else {
        setGlobalToast({
          message: 'Bulutta henüz kayıtlı bir sınıf bulunamadı.',
          type: 'info',
        });
      }
    } catch (e) {
      setGlobalToast({
        message: 'Buluttan veri çekilirken bir hata oluştu.',
        type: 'error',
      });
    } finally {
      setIsCloudSyncing(false);
      isInitialCloudSyncDoneRef.current = true;
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds((prev) => prev - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes((prev) => prev - 1);
          setTimerSeconds(59);
        } else {
          setIsTimerRunning(false);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  // Active Class reference
  const activeClass =
    classes.find((c) => c.id === activeClassId) || (classes.length > 0 ? classes[0] : null);

  // Handlers
  const handleUpdateStudent = (classId: string, updatedStudent: Student) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students.map((st) =>
            st.id === updatedStudent.id ? updatedStudent : st
          ),
        };
      })
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  const handleStartLessonWithClass = (classId: string, subjectName?: string) => {
    setActiveClassId(classId);
    setCurrentTab('live');
    scrollToTop();
  };

  const handleSaveClass = (classData: {
    id?: string;
    name: string;
    grade: string;
    section: string;
    subject: string;
    room: string;
    color: string;
  }) => {
    if (classData.id) {
      // Edit
      setClasses((prev) =>
        prev.map((c) => (c.id === classData.id ? { ...c, ...classData } : c))
      );
    } else {
      // Create new
      const newClass: ClassGroup = {
        id: 'class-' + Date.now(),
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        subject: classData.subject,
        room: classData.room,
        color: classData.color,
        students: [],
      };
      setClasses((prev) => [...prev, newClass]);
      setActiveClassId(newClass.id);
      setCurrentTab('live');
    }
  };

  const handleDeleteClass = (classId: string) => {
    setClasses((prev) => {
      const filtered = prev.filter((c) => c.id !== classId);
      if (activeClassId === classId) {
        setActiveClassId(filtered.length > 0 ? filtered[0].id : '');
      }
      return filtered;
    });
    setScheduleSlots((prev) => prev.filter((s) => s.classId !== classId));
  };

  const handleDeleteStudent = (classId: string, studentId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students.filter((st) => st.id !== studentId),
        };
      })
    );
  };

  const handleAddStudent = (studentData: {
    number: string;
    name: string;
    gender: 'M' | 'F';
  }) => {
    const newStudent: Student = {
      id: 's-' + Date.now(),
      number: studentData.number,
      name: studentData.name,
      gender: studentData.gender,
      attendance: 'present',
      points: 0,
      homeworkCount: 0,
      homeworkMissed: 0,
      participations: [],
    };

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClassId) return c;
        return {
          ...c,
          students: [...c.students, newStudent],
        };
      })
    );
  };

  const handleAddMultipleStudents = (
    studentsData: Array<{ number: string; name: string; gender?: 'M' | 'F' }>,
    mode: 'replace' | 'append' = 'append'
  ) => {
    if (!activeClass || studentsData.length === 0) return;

    const baseTimestamp = Date.now();
    const newStudents: Student[] = studentsData.map((data, index) => ({
      id: `s-${baseTimestamp}-${index}`,
      number: data.number || String(index + 1),
      name: data.name.trim(),
      gender: data.gender || 'M',
      attendance: 'present',
      points: 0,
      homeworkCount: 0,
      homeworkMissed: 0,
      participations: [],
      criteriaScores: {},
      criteriaHistory: [],
    }));

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClass.id) return c;
        const combined = mode === 'replace' ? newStudents : [...c.students, ...newStudents];

        // Sort students naturally by school number
        combined.sort((a, b) => {
          const numA = parseInt(a.number, 10);
          const numB = parseInt(b.number, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.number.localeCompare(b.number, 'tr');
        });

        return {
          ...c,
          students: combined,
        };
      })
    );

    setGlobalToast({
      message: `✓ ${newStudents.length} öğrenci ${activeClass.name} sınıfına ${
        mode === 'replace' ? 'aktarıldı (yeni liste)' : 'eklendi'
      }!`,
      type: 'success',
    });
    setTimeout(() => {
      setGlobalToast(null);
    }, 4500);
  };

  const handleAwardStudentFromPicker = (
    student: Student,
    type: 'star' | 'homework_plus'
  ) => {
    const updated: Student = {
      ...student,
      points: type === 'star' ? student.points + 1 : student.points,
      homeworkCount:
        type === 'homework_plus' ? student.homeworkCount + 1 : student.homeworkCount,
      participations: [
        {
          id: 'p-' + Date.now(),
          type,
          label: type === 'star' ? '⭐ Rastgele Söz (+1)' : '📝 Ödev Tam (+)',
          points: type === 'star' ? 1 : 0,
          timestamp: new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...student.participations,
      ],
    };
    if (activeClass) {
      handleUpdateStudent(activeClass.id, updated);
    }
  };

  const handleMarkStudentCalled = (studentId: string) => {
    if (!activeClass) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClass.id) return c;

        const updatedStudents = c.students.map((s) => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            calledInCurrentRound: true,
            calledCount: (s.calledCount || 0) + 1,
          };
        });

        // Check if all present/late students have now been called in this round!
        const eligible = updatedStudents.filter(
          (s) => s.attendance === 'present' || s.attendance === 'late'
        );
        const allCalled =
          eligible.length > 0 && eligible.every((s) => s.calledInCurrentRound);

        if (allCalled) {
          // Automatic reset for next round, increment round number
          return {
            ...c,
            roundNumber: (c.roundNumber || 1) + 1,
            students: updatedStudents.map((s) => ({
              ...s,
              calledInCurrentRound: false,
            })),
          };
        }

        return {
          ...c,
          students: updatedStudents,
        };
      })
    );
  };

  const handleResetClassRound = (classId?: string) => {
    const targetId = classId || (activeClass ? activeClass.id : null);
    if (!targetId) return;

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== targetId) return c;
        return {
          ...c,
          roundNumber: (c.roundNumber || 1) + 1,
          students: c.students.map((s) => ({
            ...s,
            calledInCurrentRound: false,
          })),
        };
      })
    );
  };

  // Assessment Criteria Handlers
  const handleUpdateStudentScores = (
    studentId: string,
    newScores: Record<string, number>,
    historyItem?: CriterionScoreHistory
  ) => {
    if (!activeClass) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClass.id) return c;
        return {
          ...c,
          students: c.students.map((st) => {
            if (st.id !== studentId) return st;
            const updatedHistory = historyItem
              ? [historyItem, ...(st.criteriaHistory || [])]
              : st.criteriaHistory || [];
            return {
              ...st,
              criteriaScores: newScores,
              criteriaHistory: updatedHistory,
            };
          }),
        };
      })
    );
  };

  const handleQuickAdjustStudentScore = (
    studentId: string,
    criterionId: string,
    delta: number
  ) => {
    if (!activeClass) return;
    const criterion = criteria.find((c) => c.id === criterionId);
    const critName = criterion ? criterion.name : 'Ölçüt';

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClass.id) return c;
        return {
          ...c,
          students: c.students.map((st) => {
            if (st.id !== studentId) return st;
            const current = getStudentCriterionScore(st, criterionId);
            const nextScore = Math.max(0, Math.min(100, current + delta));
            const newScores = {
              ...(st.criteriaScores || {}),
              [criterionId]: nextScore,
            };
            const historyItem: CriterionScoreHistory = {
              id: 'h-' + Date.now(),
              criterionId,
              criterionName: critName,
              change: delta,
              newScore: nextScore,
              reason: delta < 0 ? `${delta} Puan Düşürüldü` : `+${delta} Puan Eklendi`,
              timestamp: new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
            return {
              ...st,
              criteriaScores: newScores,
              criteriaHistory: [historyItem, ...(st.criteriaHistory || [])],
            };
          }),
        };
      })
    );
  };

  const handleSetStudentCriterionScore = (
    studentId: string,
    criterionId: string,
    exactScore: number,
    reason?: string
  ) => {
    if (!activeClass) return;
    const criterion = criteria.find((c) => c.id === criterionId);
    const critName = criterion ? criterion.name : 'Ölçüt';
    const nextScore = Math.max(0, Math.min(100, exactScore));

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== activeClass.id) return c;
        return {
          ...c,
          students: c.students.map((st) => {
            if (st.id !== studentId) return st;
            const current = getStudentCriterionScore(st, criterionId);
            const delta = nextScore - current;
            const newScores = {
              ...(st.criteriaScores || {}),
              [criterionId]: nextScore,
            };
            const historyItem: CriterionScoreHistory = {
              id: 'h-' + Date.now(),
              criterionId,
              criterionName: critName,
              change: delta,
              newScore: nextScore,
              reason:
                reason ||
                (delta === 0
                  ? 'Puan güncellendi'
                  : delta < 0
                  ? `${delta} Puan Düzenlendi`
                  : `+${delta} Puan Düzenlendi`),
              timestamp: new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
            return {
              ...st,
              criteriaScores: newScores,
              criteriaHistory: [historyItem, ...(st.criteriaHistory || [])],
            };
          }),
        };
      })
    );
  };

  const handleAddCriterion = (
    name: string,
    description: string,
    color: string,
    type: 'score' | 'plus_minus',
    stepPoints: number
  ) => {
    const newCrit: AssessmentCriterion = {
      id: 'crit-' + Date.now(),
      name,
      description,
      defaultScore: 100,
      color,
      type,
      stepPoints,
    };
    setCriteria((prev) => [...prev, newCrit]);
  };

  const handleEditCriterion = (
    id: string,
    name: string,
    description: string,
    type: 'score' | 'plus_minus',
    stepPoints: number
  ) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name, description, type, stepPoints } : c
      )
    );
  };

  const handleDeleteCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetCriteriaToDefaults = () => {
    setCriteria(initialCriteria);
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSchoolInfo(initialSchoolInfo);
    setClasses(initialClasses);
    setScheduleSlots(initialScheduleSlots);
    setCriteria(initialCriteria);
    setActiveClassId(initialClasses[0].id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans max-w-full overflow-x-hidden">
      {/* Primary Top Bar */}
      <Header
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          scrollToTop();
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAddClass={() => {
          setEditingClass(null);
          setIsClassModalOpen(true);
        }}
        onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
        onSyncToLink={handleSyncToLink}
        isSyncing={isSyncing}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={(id) => setActiveClassId(id)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        currentUser={currentUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSaveToCloud={handleManualSaveToCloud}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2.5 sm:px-6 pt-3 sm:pt-6 max-w-full overflow-x-hidden">
        {currentTab === 'overview' && (
          <OverviewScheduleView
            schoolInfo={schoolInfo}
            classes={classes}
            scheduleSlots={scheduleSlots}
            activeClassId={activeClassId}
            onSelectClass={(id) => setActiveClassId(id)}
            onStartLessonWithClass={handleStartLessonWithClass}
            onOpenEditSchool={() => setIsSchoolModalOpen(true)}
            onOpenAddClass={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            onOpenEditClass={(cls) => {
              setEditingClass(cls);
              setIsClassModalOpen(true);
            }}
            onDeleteClass={handleDeleteClass}
            onOpenBulkAddStudent={(classId) => {
              setActiveClassId(classId);
              setStudentModalInitialTab('bulk');
              setIsStudentModalOpen(true);
            }}
          />
        )}

        {currentTab === 'live' && (
          <LiveParticipationView
            activeClass={activeClass}
            classes={classes}
            criteria={criteria}
            onSelectClass={(id) => setActiveClassId(id)}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={() => {
              setStudentModalInitialTab('single');
              setIsStudentModalOpen(true);
            }}
            onOpenBulkAddStudent={() => {
              setStudentModalInitialTab('bulk');
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenEditClass={(cls) => {
              setEditingClass(cls);
              setIsClassModalOpen(true);
            }}
            onDeleteClass={handleDeleteClass}
            onOpenAddClass={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            onOpenRandomPicker={() => setIsRandomPickerOpen(true)}
            onOpenReport={() => {
              setReportTargetClass(activeClass);
              setIsReportOpen(true);
            }}
            onResetRound={handleResetClassRound}
            onOpenStudentCriteria={(student) => setSelectedStudentForCriteria(student)}
            onOpenManageCriteria={() => setIsCriteriaManagementOpen(true)}
            onNavigateToGradebook={() => {
              setCurrentTab('gradebook');
              scrollToTop();
            }}
            timerMinutes={timerMinutes}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
            onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
            onResetTimer={() => {
              setIsTimerRunning(false);
              setTimerMinutes(40);
              setTimerSeconds(0);
            }}
          />
        )}

        {currentTab === 'gradebook' && (
          <CriteriaGradebookView
            activeClass={activeClass}
            classes={classes}
            criteria={criteria}
            onSelectClass={(id) => setActiveClassId(id)}
            onOpenManageCriteria={() => setIsCriteriaManagementOpen(true)}
            onOpenStudentCriteria={(student) => setSelectedStudentForCriteria(student)}
            onQuickAdjustStudentScore={handleQuickAdjustStudentScore}
            onSetStudentCriterionScore={handleSetStudentCriterionScore}
          />
        )}

        {currentTab === 'report' && (
          <AnalyticsView
            schoolInfo={schoolInfo}
            classes={classes}
            onSelectClassAndGoLive={(id) => {
              setActiveClassId(id);
              setCurrentTab('live');
            }}
            onOpenReportModal={(cls) => {
              setReportTargetClass(cls);
              setIsReportOpen(true);
            }}
          />
        )}
      </main>

      {/* Slide-out Drawer */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        schoolInfo={schoolInfo}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={(id) => {
          setActiveClassId(id);
          setCurrentTab('live');
          scrollToTop();
        }}
        onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
        onOpenReportModal={() => {
          if (activeClass) {
            setReportTargetClass(activeClass);
            setIsReportOpen(true);
          }
        }}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          scrollToTop();
        }}
        onOpenCriteriaManage={() => setIsCriteriaManagementOpen(true)}
        onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
        onOpenBulkAddStudent={() => {
          setStudentModalInitialTab('bulk');
          setIsStudentModalOpen(true);
        }}
        onResetData={handleResetData}
        onSyncToLink={handleSyncToLink}
        onImportState={handleImportState}
        currentUser={currentUser}
        onSignInWithGoogle={handleSignInWithGoogle}
        onLogOut={handleLogOut}
        onSaveToCloud={handleManualSaveToCloud}
        onFetchFromCloud={handleFetchFromCloud}
        isCloudSyncing={isCloudSyncing}
        onOpenDomainHelp={() => setIsDomainGuideOpen(true)}
      />

      {/* Random Student Modal */}
      <RandomStudentModal
        isOpen={isRandomPickerOpen && !!activeClass}
        onClose={() => setIsRandomPickerOpen(false)}
        students={activeClass ? activeClass.students : []}
        currentRound={activeClass ? activeClass.roundNumber || 1 : 1}
        onAwardStudent={handleAwardStudentFromPicker}
        onMarkStudentCalled={handleMarkStudentCalled}
        onResetRound={handleResetClassRound}
      />

      {/* Daily/Lesson Report Modal */}
      {(reportTargetClass || activeClass) && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setReportTargetClass(null);
          }}
          schoolInfo={schoolInfo}
          activeClass={reportTargetClass || activeClass!}
        />
      )}

      {/* Class Create / Edit Modal */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSaveClass={handleSaveClass}
        onDeleteClass={handleDeleteClass}
        editingClass={editingClass}
      />

      {/* Student Create Modal */}
      <StudentModal
        isOpen={isStudentModalOpen && !!activeClass}
        onClose={() => setIsStudentModalOpen(false)}
        classNameTitle={activeClass ? activeClass.name : ''}
        initialTab={studentModalInitialTab}
        onAddStudent={handleAddStudent}
        onAddMultipleStudents={handleAddMultipleStudents}
        existingCount={activeClass ? activeClass.students.length : 0}
      />

      {/* School Info Edit Modal */}
      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        schoolInfo={schoolInfo}
        onSaveSchool={setSchoolInfo}
      />

      {/* Student Criteria Scoring Modal */}
      <StudentCriteriaModal
        isOpen={selectedStudentForCriteria !== null}
        onClose={() => setSelectedStudentForCriteria(null)}
        student={
          selectedStudentForCriteria && activeClass
            ? activeClass.students.find((s) => s.id === selectedStudentForCriteria.id) ||
              selectedStudentForCriteria
            : selectedStudentForCriteria
        }
        criteria={criteria}
        onUpdateScores={handleUpdateStudentScores}
      />

      {/* Criteria Definition & Management Modal */}
      <CriteriaManagementModal
        isOpen={isCriteriaManagementOpen}
        onClose={() => setIsCriteriaManagementOpen(false)}
        criteria={criteria}
        onAddCriterion={handleAddCriterion}
        onEditCriterion={handleEditCriterion}
        onDeleteCriterion={handleDeleteCriterion}
        onResetToDefaults={handleResetCriteriaToDefaults}
      />

      {/* Mobile Install & QR Code Modal */}
      <MobileInstallModal
        isOpen={isMobileInstallOpen}
        onClose={() => setIsMobileInstallOpen(false)}
        onSyncToLink={handleSyncToLink}
        isSyncing={isSyncing}
      />

      {/* Firebase Vercel Domain Guide Modal */}
      <FirebaseDomainGuideModal
        isOpen={isDomainGuideOpen}
        onClose={() => setIsDomainGuideOpen(false)}
      />

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{globalToast.message}</span>
            <button
              onClick={() => setGlobalToast(null)}
              className="ml-2 text-emerald-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
