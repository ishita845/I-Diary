import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Dumbbell,
  Flame,
  Clock,
  TrendingUp,
  Activity,
  Check,
  Loader,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebase";

/* ================= TYPES ================= */

interface Workout {
  id: string;
  exerciseType: string;
  duration: number;
  sets?: number;
  reps?: number;
  caloriesBurned: number;
  notes: string;
}

interface DayWorkout {
  date: string;
  day: string;
  workouts: Workout[];
}

/* ================= COMPONENT ================= */

export function ExerciseTracking() {
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  const [dayWorkouts, setDayWorkouts] = useState<DayWorkout[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  const [newWorkout, setNewWorkout] = useState({
    exerciseType: "",
    duration: "",
    sets: "",
    reps: "",
    caloriesBurned: "",
    notes: "",
  });

  const EXERCISE_ICONS: Record<string, string> = {
    Cardio: "🏃",
    Strength: "💪",
    Yoga: "🧘",
    Dance: "💃",
  };

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ================= HELPERS ================= */

  const generateMonthEntries = (month: string): DayWorkout[] => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      return {
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        workouts: [],
      };
    });
  };

  /* ================= LOAD MONTH (🔥 FIXED) ================= */

  useEffect(() => {
    if (!userId) return;

    const ref = doc(db, "users", userId, "exerciseMonths", selectedMonth);

    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setDayWorkouts(snap.data().dayWorkouts);
      } else {
        const emptyMonth = generateMonthEntries(selectedMonth);
        setDayWorkouts(emptyMonth);

        // ✅ CREATE DOC IN FIRESTORE
        await setDoc(ref, {
          month: selectedMonth,
          dayWorkouts: emptyMonth,
        });
      }
    });

    return () => unsub();
  }, [userId, selectedMonth]);

  /* ================= SAVE MONTH ================= */

  const saveMonth = async (data: DayWorkout[]) => {
    if (!userId) return;

    try {
      setSaveStatus("saving");

      await setDoc(
        doc(db, "users", userId, "exerciseMonths", selectedMonth),
        {
          month: selectedMonth,
          dayWorkouts: data,
        },
        { merge: true }
      );

      setSaveStatus("saved");
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  };

  /* ================= ADD WORKOUT ================= */

  const addWorkout = async (dateStr: string) => {
    if (!newWorkout.duration || !newWorkout.caloriesBurned) {
      alert("Fill duration & calories");
      return;
    }

    const workout: Workout = {
  id: Date.now().toString(),
  exerciseType: newWorkout.exerciseType,
  duration: Number(newWorkout.duration),
  caloriesBurned: Number(newWorkout.caloriesBurned),
  notes: newWorkout.notes,
};

if (newWorkout.sets) {
  workout.sets = Number(newWorkout.sets);
}

if (newWorkout.reps) {
  workout.reps = Number(newWorkout.reps);
}


    const updated = dayWorkouts.map((day) =>
      day.date === dateStr
        ? { ...day, workouts: [...day.workouts, workout] }
        : day
    );

    setDayWorkouts(updated);
    await saveMonth(updated);

    setNewWorkout({
      exerciseType: "",
      duration: "",
      sets: "",
      reps: "",
      caloriesBurned: "",
      notes: "",
    });
  };

  /* ================= DELETE WORKOUT ================= */

  const deleteWorkout = async (dateStr: string, id: string) => {
    const updated = dayWorkouts.map((day) =>
      day.date === dateStr
        ? { ...day, workouts: day.workouts.filter((w) => w.id !== id) }
        : day
    );

    setDayWorkouts(updated);
    await saveMonth(updated);
  };

  /* ================= CALENDAR ================= */

  const generateCalendar = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

    return days;
  };

  const calendarDays = generateCalendar();

  const datesWithWorkouts = dayWorkouts
    .filter((d) => d.workouts.length > 0)
    .map((d) => d.date);

  const handleDateClick = (day: number) => {
    const [y, m] = selectedMonth.split("-");
    setSelectedDate(`${y}-${m}-${String(day).padStart(2, "0")}`);
  };

  const selectedDayData = selectedDate
    ? dayWorkouts.find((d) => d.date === selectedDate)
    : null;

  /* ================= TOTALS ================= */

  const totalWorkouts = dayWorkouts.reduce(
    (sum, d) => sum + d.workouts.length,
    0
  );

  const totalCalories = dayWorkouts.reduce(
    (sum, d) =>
      sum + d.workouts.reduce((s, w) => s + w.caloriesBurned, 0),
    0
  );

  const totalMinutes = dayWorkouts.reduce(
    (sum, d) => sum + d.workouts.reduce((s, w) => s + w.duration, 0),
    0
  );
    const calculateConsistency = () => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dayWorkouts.find(d => d.date === dateStr);
      
      last30Days.push({
        date: date.getDate(),
        worked: dayData && dayData.workouts.length > 0 ? 1 : 0,
      });
    }
    
    return last30Days;
  };
    const calculateWeeklyData = () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dayWorkouts.find(d => d.date === dateStr);
      const totalCalories = dayData?.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0) || 0;
      
      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: totalCalories,
        workouts: dayData?.workouts.length || 0,
      });
    }
    
    return last7Days;
  };
    const calculateMonthlyData = () => {
    const weeks = [];
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    let weekNum = 1;
    let weekCalories = 0;
    let weekWorkouts = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dayWorkouts.find(d => d.date === dateStr);
      
      weekCalories += dayData?.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0) || 0;
      weekWorkouts += dayData?.workouts.length || 0;
      
      if (date.getDay() === 6 || day === daysInMonth) {
        weeks.push({
          week: `Week ${weekNum}`,
          calories: weekCalories,
          workouts: weekWorkouts,
        });
        weekNum++;
        weekCalories = 0;
        weekWorkouts = 0;
      }
    }
    
    return weeks;
  };

  const weeklyData = calculateWeeklyData();
    const monthlyData = calculateMonthlyData();
  

  const daysWorkedOut = datesWithWorkouts.length;
   const consistencyData = calculateConsistency();
  
  

  /* ================= UI (UNCHANGED BELOW) ================= */
  /* ⬇️ KEEP YOUR EXISTING JSX EXACTLY AS IT IS ⬇️ */


  return (
    <div className="space-y-6">
      {/* Auto-save Status Indicator */}
      <div className="fixed top-20 right-4 z-50">
        <div className={`px-4 py-2 rounded-lg shadow-lg border-2 flex items-center gap-2 transition-all ${
          saveStatus === 'saving' 
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
            : saveStatus === 'saved'
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100'
            : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100'
        }`}>
          {saveStatus === 'saving' && <Loader className="w-4 h-4 animate-spin" />}
          {saveStatus === 'saved' && <Check className="w-4 h-4" />}
          {saveStatus === 'error' && <X className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error'}
          </span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">💪 Exercise Tracker</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Track your workouts and build healthy habits • Auto-saves as you type</p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowAnalytics(false)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            !showAnalytics
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-200 border-2 border-pink-200 dark:border-purple-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Workout Log
        </button>
        <button
          onClick={() => setShowAnalytics(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            showAnalytics
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-200 border-2 border-pink-200 dark:border-purple-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Progress & Analytics
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() - 1);
              setSelectedMonth(date.toISOString().substring(0, 7));
            }}
            className="p-2 hover:bg-pink-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-pink-600 dark:text-purple-400" />
          </button>
          
          <div className="text-center">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none text-center font-medium"
            />
          </div>
          
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() + 1);
              setSelectedMonth(date.toISOString().substring(0, 7));
            }}
            className="p-2 hover:bg-pink-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-pink-600 dark:text-purple-400" />
          </button>
        </div>
      </div>

      {!showAnalytics ? (
        <>
          {/* Calendar View & Workout Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-pink-900 dark:text-purple-200 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Monthly Calendar
                </h3>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {showCalendar ? 'Hide' : 'Show'} Calendar
                </button>
              </div>

              {showCalendar && (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm text-pink-700 dark:text-purple-300 font-medium py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      const [year, monthNum] = selectedMonth.split('-');
                      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
                      const hasWorkout = datesWithWorkouts.includes(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                      
                      const dayData = dayWorkouts.find(d => d.date === dateStr);
                      const totalCalories = dayData?.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0) || 0;

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:shadow-md ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                              : isToday
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-600'
                              : hasWorkout
                              ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-900 dark:text-green-100 border-2 border-green-300 dark:border-green-700'
                              : 'bg-pink-50 dark:bg-purple-900/20 text-pink-900 dark:text-purple-100 hover:bg-pink-100 dark:hover:bg-purple-900/40'
                          }`}
                        >
                          <span className="font-medium">{day}</span>
                          {hasWorkout && (
                            <span className="text-xs mt-1">💪</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-pink-700 dark:text-purple-400">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700"></div>
                      <span>Workout Day</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500"></div>
                      <span>Selected</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Selected Day Summary */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4">
                {selectedDayData ? (
                  <>
                    {new Date(selectedDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    <span className="text-sm text-pink-600 dark:text-purple-400 ml-2">({selectedDayData.day})</span>
                  </>
                ) : (
                  'Click a date'
                )}
              </h3>

              {selectedDayData ? (
                <div className="space-y-3">
                  {selectedDayData.workouts.length > 0 ? (
                    <>
                      {selectedDayData.workouts.map((workout) => (
                        <div
                          key={workout.id}
                          className="p-3 rounded-lg bg-white dark:bg-gray-900 border-2 border-pink-200 dark:border-purple-700/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{EXERCISE_ICONS[workout.exerciseType]}</span>
                              <span className="text-sm font-medium text-pink-900 dark:text-purple-100">
                                {workout.exerciseType}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteWorkout(selectedDate!, workout.id)}
                              className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-pink-700 dark:text-purple-300 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{workout.duration} min</span>
                            </div>
                            {workout.sets && workout.reps && (
                              <div className="flex items-center gap-1">
                                <Dumbbell className="w-3 h-3" />
                                <span>{workout.sets} sets × {workout.reps} reps</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                              <Flame className="w-3 h-3" />
                              <span>{workout.caloriesBurned} cal</span>
                            </div>
                            {workout.notes && (
                              <div className="text-pink-600 dark:text-purple-400 italic mt-2">
                                {workout.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Day Total */}
                      <div className="pt-3 border-t-2 border-purple-200 dark:border-purple-700">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-pink-700 dark:text-purple-300">Total Time:</span>
                            <span className="font-bold text-pink-900 dark:text-purple-100">
                              {selectedDayData.workouts.reduce((sum, w) => sum + w.duration, 0)} min
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-pink-700 dark:text-purple-300">Total Calories:</span>
                            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              🔥 {selectedDayData.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0)} cal
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-pink-600 dark:text-purple-400 text-center py-4">
                      No workouts logged
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-pink-600 dark:text-purple-400 text-center py-8">
                  Select a date from the calendar to view or add workouts
                </p>
              )}
            </div>
          </div>

          {/* Add Workout Form */}
          {selectedDate && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Workout for {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div>
  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">
    Exercise Name *
  </label>
  <input
    type="text"
    value={newWorkout.exerciseType}
    onChange={(e) =>
      setNewWorkout({ ...newWorkout, exerciseType: e.target.value })
    }
    placeholder="e.g. Push-ups, Running, Leg Day, Skipping"
    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700
               bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100
               focus:border-purple-400 focus:outline-none"
  />
</div>


                {/* Duration */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                    placeholder="e.g., 30"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Sets */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Sets (optional)</label>
                  <input
                    type="number"
                    value={newWorkout.sets}
                    onChange={(e) => setNewWorkout({ ...newWorkout, sets: e.target.value })}
                    placeholder="e.g., 3"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Reps */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Reps (optional)</label>
                  <input
                    type="number"
                    value={newWorkout.reps}
                    onChange={(e) => setNewWorkout({ ...newWorkout, reps: e.target.value })}
                    placeholder="e.g., 12"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Calories Burned */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Calories Burned *</label>
                  <input
                    type="number"
                    value={newWorkout.caloriesBurned}
                    onChange={(e) => setNewWorkout({ ...newWorkout, caloriesBurned: e.target.value })}
                    placeholder="e.g., 250"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Notes (optional)</label>
                  <input
                    type="text"
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                    placeholder="e.g., Felt great today!"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => addWorkout(selectedDate)}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                Save Workout
              </button>
            </div>
          )}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-xl text-pink-900 dark:text-purple-200 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Workout Consistency (Last 30 Days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={consistencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9333ea" />
                  <YAxis stroke="#9333ea" ticks={[0, 1]} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value === 1 ? 'Worked Out ✓' : 'Rest Day', 'Status']}
                  />
                  <Legend />
                  <Line
                    type="stepAfter"
                    dataKey="worked"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Workout Status"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-pink-600 dark:text-purple-400 text-center mt-4">
                ✅ Track your consistency over time
              </p>
            </div>


          {/* Monthly Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{totalWorkouts}</span>
              </div>
              <p className="text-sm opacity-90">Total Workouts</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{totalCalories}</span>
              </div>
              <p className="text-sm opacity-90">Calories Burned</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{Math.round(totalMinutes / 60)}h</span>
              </div>
              <p className="text-sm opacity-90">Total Time ({totalMinutes} min)</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{daysWorkedOut}</span>
              </div>
              <p className="text-sm opacity-90">Active Days</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Progress & Analytics Screen */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-xl text-pink-900 dark:text-purple-200 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Weekly Calories Burned
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#9333ea" />
                  <YAxis stroke="#9333ea" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="calories" fill="url(#caloriesGradient)" name="Calories Burned" />
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-pink-600 dark:text-purple-400 text-center mt-4">
                📊 Last 7 days performance
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-xl text-pink-900 dark:text-purple-200 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Monthly Calories by Week
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#9333ea" />
                  <YAxis stroke="#9333ea" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="calories" fill="url(#weeklyGradient)" name="Weekly Calories" />
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-pink-600 dark:text-purple-400 text-center mt-4">
                📈 {selectedMonth} weekly breakdown
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-xl text-pink-900 dark:text-purple-200 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Workout Consistency (Last 30 Days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={consistencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9333ea" />
                  <YAxis stroke="#9333ea" ticks={[0, 1]} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value === 1 ? 'Worked Out ✓' : 'Rest Day', 'Status']}
                  />
                  <Legend />
                  <Line
                    type="stepAfter"
                    dataKey="worked"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Workout Status"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-pink-600 dark:text-purple-400 text-center mt-4">
                ✅ Track your consistency over time
              </p>
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700/50">
                <h4 className="text-lg text-pink-900 dark:text-purple-200 mb-4 font-medium">💡 Insights</h4>
                <div className="space-y-3 text-sm text-pink-800 dark:text-purple-300">
                  <div className="flex items-start gap-2">
                    <span>📅</span>
                    <span>You worked out <strong>{daysWorkedOut}</strong> days this month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🔥</span>
                    <span>Average calories per workout: <strong>{totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0}</strong> cal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>⏱️</span>
                    <span>Average workout duration: <strong>{totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0}</strong> min</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>📈</span>
                    <span>Consistency rate: <strong>{Math.round((daysWorkedOut / dayWorkouts.length) * 100)}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700/50">
                <h4 className="text-lg text-green-900 dark:text-green-200 mb-4 font-medium">🎯 Goals & Motivation</h4>
                <div className="space-y-3 text-sm text-green-800 dark:text-green-300">
                  <div className="flex items-start gap-2">
                    <span>✨</span>
                    <span>Keep up the great work! Consistency is key to progress.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>💪</span>
                    <span>Every workout counts toward your fitness journey.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🎊</span>
                    <span>Remember: Progress, not perfection!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
